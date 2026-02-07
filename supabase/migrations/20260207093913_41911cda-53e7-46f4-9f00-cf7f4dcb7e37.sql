
-- Allow public viewing of active driver locations for vehicle showcase
CREATE POLICY "Anyone can view active locations of available drivers"
ON public.driver_locations
FOR SELECT
USING (
  is_active = true 
  AND driver_id IN (
    SELECT id FROM public.drivers WHERE is_available = true
  )
);
