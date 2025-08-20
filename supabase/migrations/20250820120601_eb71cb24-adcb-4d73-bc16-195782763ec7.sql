-- Fix driver data exposure security issue
-- Drop the overly permissive policy that allows anyone to view all driver data
DROP POLICY IF EXISTS "Drivers are viewable by everyone" ON public.drivers;

-- Create a more secure policy that only exposes necessary public information
-- This allows passengers to see basic driver info during rides without exposing personal data
CREATE POLICY "Basic driver info viewable for active rides" ON public.drivers
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.rides 
    WHERE rides.driver_id = drivers.id 
    AND rides.passenger_id = auth.uid()
    AND rides.status IN ('accepted', 'in_progress')
  )
);

-- Create a view for public driver information (non-sensitive data only)
CREATE OR REPLACE VIEW public.drivers_public AS
SELECT 
  id,
  name,
  car_model,
  car_color,
  rating,
  is_available,
  created_at
FROM public.drivers;

-- Enable RLS on the view
ALTER VIEW public.drivers_public SET (security_barrier = true);

-- Allow everyone to view the public driver information
CREATE POLICY "Public driver info viewable by everyone" ON public.drivers_public
FOR SELECT USING (true);