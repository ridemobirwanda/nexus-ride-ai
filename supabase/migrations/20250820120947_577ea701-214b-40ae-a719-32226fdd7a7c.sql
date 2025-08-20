-- Fix the security definer view issue
-- Drop the previous view and recreate without security definer
DROP VIEW IF EXISTS public.drivers_public;

-- Create a regular view without security definer
CREATE VIEW public.drivers_public AS
SELECT 
  id,
  name,
  car_model,
  is_available,
  current_location,
  created_at
FROM public.drivers
WHERE is_available = true;

-- Enable RLS on the view and create appropriate policies
ALTER VIEW public.drivers_public SET (security_barrier = true);

-- Create a policy for the view that allows anyone to see available drivers (public info only)
CREATE POLICY "Public driver info viewable by all" ON public.drivers_public
FOR SELECT USING (true);