-- Remove duplicate passengers, keeping the oldest record (use created_at for ordering)
DELETE FROM public.passengers p1
WHERE EXISTS (
  SELECT 1 FROM public.passengers p2 
  WHERE p2.user_id = p1.user_id 
  AND p2.created_at < p1.created_at
);

-- Remove duplicate drivers, keeping the oldest record
DELETE FROM public.drivers d1
WHERE EXISTS (
  SELECT 1 FROM public.drivers d2 
  WHERE d2.user_id = d1.user_id 
  AND d2.created_at < d1.created_at
);

-- Now add unique constraints
ALTER TABLE public.passengers ADD CONSTRAINT passengers_user_id_key UNIQUE (user_id);
ALTER TABLE public.drivers ADD CONSTRAINT drivers_user_id_key UNIQUE (user_id);