
-- Add public SELECT policy for vehicle showcase - only exposes available drivers' basic info
CREATE POLICY "Anyone can view available drivers for showcase"
ON public.drivers
FOR SELECT
USING (is_available = true AND car_model IS NOT NULL);
