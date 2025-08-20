-- Fix security issues by adding search_path to functions

-- Update all functions to have proper search_path
CREATE OR REPLACE FUNCTION public.update_inactive_drivers()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  -- Set drivers to inactive if no activity in last 30 seconds and they're available
  UPDATE public.drivers 
  SET status = 'inactive'
  WHERE status = 'available' 
  AND last_activity_at < (now() - INTERVAL '30 seconds')
  AND last_activity_at IS NOT NULL;
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  
  RETURN updated_count;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_driver_status(p_status public.driver_status)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_driver_id UUID;
BEGIN
  -- Get driver ID for current user
  SELECT id INTO v_driver_id 
  FROM public.drivers 
  WHERE user_id = auth.uid();
  
  IF v_driver_id IS NULL THEN
    RAISE EXCEPTION 'Driver not found for current user';
  END IF;
  
  -- Update status and activity timestamp
  UPDATE public.drivers 
  SET 
    status = p_status,
    last_activity_at = now(),
    is_available = CASE 
      WHEN p_status = 'available' THEN true 
      ELSE false 
    END
  WHERE id = v_driver_id;
  
  RETURN TRUE;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_driver_location(p_location point, p_heading numeric DEFAULT NULL::numeric, p_speed numeric DEFAULT NULL::numeric, p_accuracy numeric DEFAULT NULL::numeric)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_driver_id UUID;
  v_location_id UUID;
  v_current_status public.driver_status;
BEGIN
  -- Get driver ID and current status for current user
  SELECT id, status INTO v_driver_id, v_current_status
  FROM public.drivers 
  WHERE user_id = auth.uid();
  
  IF v_driver_id IS NULL THEN
    RAISE EXCEPTION 'Driver not found for current user';
  END IF;
  
  -- Auto-set to available if offline/inactive and sharing location
  IF v_current_status IN ('offline', 'inactive') THEN
    v_current_status := 'available';
  END IF;
  
  -- Update driver's current location, status, and activity timestamp
  UPDATE public.drivers 
  SET 
    current_location = p_location,
    status = v_current_status,
    is_available = CASE WHEN v_current_status = 'available' THEN true ELSE false END,
    last_activity_at = now(),
    updated_at = now()
  WHERE id = v_driver_id;
  
  -- Insert new location record
  INSERT INTO public.driver_locations (
    driver_id, 
    location, 
    heading, 
    speed, 
    accuracy,
    is_active
  ) VALUES (
    v_driver_id, 
    p_location, 
    p_heading, 
    p_speed, 
    p_accuracy,
    true
  ) RETURNING id INTO v_location_id;
  
  -- Mark previous locations as inactive (keep last 10)
  UPDATE public.driver_locations 
  SET is_active = false 
  WHERE driver_id = v_driver_id 
  AND id != v_location_id
  AND id NOT IN (
    SELECT id FROM public.driver_locations 
    WHERE driver_id = v_driver_id 
    ORDER BY timestamp DESC 
    LIMIT 10
  );
  
  RETURN v_location_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.find_nearest_driver(
  p_pickup_location point,
  p_max_distance_km numeric DEFAULT 10,
  p_limit integer DEFAULT 5
)
RETURNS TABLE(
  driver_id uuid,
  name text,
  phone text,
  car_model text,
  car_plate text,
  rating numeric,
  distance_km numeric,
  estimated_arrival_minutes integer,
  total_trips integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    d.id as driver_id,
    d.name,
    d.phone,
    d.car_model,
    d.car_plate,
    d.rating,
    -- Calculate distance using Earth's radius approximation
    (point_distance(d.current_location, p_pickup_location) * 111.32) as distance_km,
    -- Estimate arrival time: distance/average_speed(30kmh) * 60min
    ROUND((point_distance(d.current_location, p_pickup_location) * 111.32 / 30) * 60)::integer as estimated_arrival_minutes,
    d.total_trips
  FROM public.drivers d
  WHERE d.status = 'available'
  AND d.current_location IS NOT NULL
  AND d.last_activity_at > (now() - INTERVAL '30 seconds')
  AND (point_distance(d.current_location, p_pickup_location) * 111.32) <= p_max_distance_km
  ORDER BY 
    -- Priority: rating first, then distance
    d.rating DESC,
    (point_distance(d.current_location, p_pickup_location)) ASC
  LIMIT p_limit;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_driver_rating_and_trips()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only process when ride is completed and has a rating
  IF NEW.status = 'completed' AND NEW.rating IS NOT NULL AND OLD.rating IS NULL THEN
    UPDATE public.drivers
    SET 
      rating = (
        COALESCE(
          (SELECT AVG(rating)::numeric(3,2) 
           FROM public.rides 
           WHERE driver_id = NEW.driver_id 
           AND rating IS NOT NULL), 
          4.0
        )
      ),
      total_trips = total_trips + 1,
      status = 'available' -- Make driver available again after ride completion
    WHERE id = NEW.driver_id;
  END IF;
  
  -- Set driver to on_trip when ride is accepted
  IF NEW.status = 'accepted' AND OLD.status = 'pending' THEN
    UPDATE public.drivers
    SET status = 'on_trip'
    WHERE id = NEW.driver_id;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if user metadata indicates they're registering as a passenger
  IF NEW.raw_user_meta_data->>'user_type' = 'passenger' THEN
    INSERT INTO public.passengers (user_id, name, phone)
    VALUES (
      NEW.id, 
      COALESCE(NEW.raw_user_meta_data->>'name', NEW.email), 
      NEW.raw_user_meta_data->>'phone'
    );
  ELSIF NEW.raw_user_meta_data->>'user_type' = 'driver' THEN
    INSERT INTO public.drivers (user_id, name, phone, car_model, car_plate)
    VALUES (
      NEW.id, 
      COALESCE(NEW.raw_user_meta_data->>'name', NEW.email), 
      NEW.raw_user_meta_data->>'phone',
      NEW.raw_user_meta_data->>'car_model',
      NEW.raw_user_meta_data->>'car_plate'
    );
  END IF;
  RETURN NEW;
END;
$$;