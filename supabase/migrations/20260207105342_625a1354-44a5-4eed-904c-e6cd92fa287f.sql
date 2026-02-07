
-- Update all driver location timestamps to now() so they appear as "Online" in the showcase
UPDATE public.driver_locations
SET timestamp = now()
WHERE is_active = true;
