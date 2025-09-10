-- Add plate number and owner information to rental cars
ALTER TABLE public.rental_cars 
ADD COLUMN plate_number text,
ADD COLUMN owner_name text,
ADD COLUMN owner_phone text;