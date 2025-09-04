-- Remove unique constraint on passengers phone field to allow multiple users with same/no phone
ALTER TABLE public.passengers DROP CONSTRAINT IF EXISTS passengers_phone_key;