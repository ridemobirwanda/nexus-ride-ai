-- Remove unique constraint on passengers phone field to allow multiple users with same/no phone
DROP INDEX IF EXISTS passengers_phone_key;
ALTER TABLE IF EXISTS public.passengers DROP CONSTRAINT IF EXISTS passengers_phone_key;