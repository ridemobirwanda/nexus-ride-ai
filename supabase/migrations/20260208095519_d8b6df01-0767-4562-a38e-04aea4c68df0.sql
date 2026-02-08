-- Refresh all active driver location timestamps to now()
UPDATE public.driver_locations
SET timestamp = now()
WHERE is_active = true;