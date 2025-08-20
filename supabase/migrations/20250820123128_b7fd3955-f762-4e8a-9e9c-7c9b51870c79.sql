-- Enable real-time updates for drivers table with full row data
ALTER TABLE public.drivers REPLICA IDENTITY FULL;

-- Add the drivers table to the realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.drivers;

-- Create driver_locations table for high-frequency location updates
CREATE TABLE public.driver_locations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  driver_id UUID NOT NULL REFERENCES public.drivers(id) ON DELETE CASCADE,
  location POINT NOT NULL,
  heading NUMERIC,
  speed NUMERIC,
  accuracy NUMERIC,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true
);

-- Enable RLS on driver_locations
ALTER TABLE public.driver_locations ENABLE ROW LEVEL SECURITY;

-- Create policies for driver_locations
CREATE POLICY "Drivers can insert their own location updates" 
ON public.driver_locations 
FOR INSERT 
WITH CHECK (driver_id IN (
  SELECT id FROM public.drivers WHERE user_id = auth.uid()
));

CREATE POLICY "Drivers can view their own location history" 
ON public.driver_locations 
FOR SELECT 
USING (driver_id IN (
  SELECT id FROM public.drivers WHERE user_id = auth.uid()
));

CREATE POLICY "Passengers can view active driver locations during rides" 
ON public.driver_locations 
FOR SELECT 
USING (
  is_active = true AND 
  driver_id IN (
    SELECT r.driver_id 
    FROM rides r 
    JOIN passengers p ON r.passenger_id = p.id 
    WHERE p.user_id = auth.uid() 
    AND r.status IN ('accepted', 'in_progress')
  )
);

-- Enable real-time for driver_locations
ALTER TABLE public.driver_locations REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.driver_locations;

-- Create index for better performance on location queries
CREATE INDEX idx_driver_locations_driver_active ON public.driver_locations(driver_id, is_active, timestamp DESC);
CREATE INDEX idx_driver_locations_timestamp ON public.driver_locations(timestamp DESC);

-- Create function to update driver availability and location
CREATE OR REPLACE FUNCTION public.update_driver_location(
  p_location POINT,
  p_heading NUMERIC DEFAULT NULL,
  p_speed NUMERIC DEFAULT NULL,
  p_accuracy NUMERIC DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_driver_id UUID;
  v_location_id UUID;
BEGIN
  -- Get driver ID for current user
  SELECT id INTO v_driver_id 
  FROM public.drivers 
  WHERE user_id = auth.uid();
  
  IF v_driver_id IS NULL THEN
    RAISE EXCEPTION 'Driver not found for current user';
  END IF;
  
  -- Update driver's current location and set as available
  UPDATE public.drivers 
  SET 
    current_location = p_location,
    is_available = true,
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