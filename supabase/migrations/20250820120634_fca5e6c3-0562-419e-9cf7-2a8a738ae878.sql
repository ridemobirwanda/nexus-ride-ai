-- Fix driver data exposure security issue
-- Drop the overly permissive policy that allows anyone to view all driver data
DROP POLICY IF EXISTS "Anyone can view available drivers" ON public.drivers;

-- Create a more secure policy that only exposes necessary information during active rides
CREATE POLICY "Basic driver info viewable for active rides" ON public.drivers
FOR SELECT USING (
  user_id = auth.uid() OR  -- Drivers can see their own profile
  EXISTS (
    SELECT 1 FROM public.rides 
    WHERE rides.driver_id = drivers.id 
    AND rides.passenger_id IN (
      SELECT id FROM public.passengers WHERE user_id = auth.uid()
    )
    AND rides.status IN ('accepted', 'in_progress')
  )
);

-- Create a view for public driver information (non-sensitive data only)
CREATE OR REPLACE VIEW public.drivers_public AS
SELECT 
  id,
  name,
  car_model,
  is_available,
  current_location,
  created_at
FROM public.drivers
WHERE is_available = true;

-- Grant access to the view
GRANT SELECT ON public.drivers_public TO authenticated;
GRANT SELECT ON public.drivers_public TO anon;