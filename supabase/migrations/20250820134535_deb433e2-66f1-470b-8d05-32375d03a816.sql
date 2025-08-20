-- Create driver status enum
CREATE TYPE public.driver_status AS ENUM ('offline', 'available', 'on_trip', 'inactive');

-- Add status and rating columns to drivers table
ALTER TABLE public.drivers 
ADD COLUMN status public.driver_status NOT NULL DEFAULT 'offline',
ADD COLUMN rating NUMERIC(3,2) DEFAULT 4.0,
ADD COLUMN total_trips INTEGER DEFAULT 0,
ADD COLUMN last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Add indexes for efficient querying
CREATE INDEX idx_drivers_status ON public.drivers(status);
CREATE INDEX idx_drivers_location ON public.drivers USING GIST(current_location);
CREATE INDEX idx_drivers_rating ON public.drivers(rating DESC);
CREATE INDEX idx_drivers_last_activity ON public.drivers(last_activity_at);

-- Function to automatically set drivers inactive after 30 seconds
CREATE OR REPLACE FUNCTION public.update_inactive_drivers()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
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

-- Function to update driver status
CREATE OR REPLACE FUNCTION public.update_driver_status(p_status public.driver_status)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
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

-- Enhanced driver location update function with status management
CREATE OR REPLACE FUNCTION public.update_driver_location(p_location point, p_heading numeric DEFAULT NULL::numeric, p_speed numeric DEFAULT NULL::numeric, p_accuracy numeric DEFAULT NULL::numeric)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
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

-- Smart driver matching function
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

-- Function to calculate point distance (simple approximation)
CREATE OR REPLACE FUNCTION point_distance(p1 point, p2 point)
RETURNS numeric
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT sqrt(pow(p1[0] - p2[0], 2) + pow(p1[1] - p2[1], 2));
$$;

-- Update RLS policies for driver status visibility
DROP POLICY IF EXISTS "Passengers can view active driver locations during rides" ON public.driver_locations;

CREATE POLICY "Passengers can view driver locations based on status" 
ON public.driver_locations 
FOR SELECT 
USING (
  -- Always allow drivers to see their own locations
  (driver_id IN (SELECT id FROM public.drivers WHERE user_id = auth.uid()))
  OR
  -- For passengers: show available drivers or assigned driver during rides
  (
    driver_id IN (
      -- Show available drivers for all passengers
      SELECT d.id FROM public.drivers d 
      WHERE d.status = 'available' AND is_active = true
    )
    OR
    -- Show assigned driver during active rides
    driver_id IN (
      SELECT r.driver_id
      FROM public.rides r
      JOIN public.passengers p ON r.passenger_id = p.id
      WHERE p.user_id = auth.uid() 
      AND r.status IN ('accepted', 'in_progress')
      AND is_active = true
    )
  )
);

-- Add trigger to automatically update driver ratings after ride completion
CREATE OR REPLACE FUNCTION public.update_driver_rating_and_trips()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
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

-- Create trigger for automatic driver rating updates
DROP TRIGGER IF EXISTS trigger_update_driver_rating ON public.rides;
CREATE TRIGGER trigger_update_driver_rating
  AFTER UPDATE ON public.rides
  FOR EACH ROW
  EXECUTE FUNCTION public.update_driver_rating_and_trips();