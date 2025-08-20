-- Remove the problematic view completely
DROP VIEW IF EXISTS public.drivers_public;

-- Revoke the grants we made earlier
REVOKE SELECT ON public.drivers_public FROM authenticated;
REVOKE SELECT ON public.drivers_public FROM anon;

-- The existing security policy on drivers table is now sufficient:
-- "Basic driver info viewable for active rides" allows:
-- 1. Drivers to see their own profile (user_id = auth.uid())
-- 2. Passengers to see driver info only during active rides
-- This properly protects driver PII (phone, car_plate) from public access