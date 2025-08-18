-- Remove the overly permissive policy for viewing drivers
DROP POLICY IF EXISTS "Anyone can view available drivers" ON public.drivers;

-- Create a security definer function that returns only safe driver information
CREATE OR REPLACE FUNCTION public.get_available_drivers_safe()
RETURNS TABLE (
  id UUID,
  display_name TEXT,
  current_location POINT,
  is_available BOOLEAN
) 
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT 
    d.id,
    split_part(d.name, ' ', 1) as display_name, -- Only first name
    d.current_location,
    d.is_available
  FROM public.drivers d
  WHERE d.is_available = true;
$$;

-- Create a new policy that prevents direct access to sensitive driver data
CREATE POLICY "Drivers table access restricted" 
ON public.drivers 
FOR SELECT 
USING (false); -- Block all direct SELECT access

-- Allow drivers to still view and update their own profiles
CREATE POLICY "Drivers can view their own profile" 
ON public.drivers 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Drivers can update their own profile" 
ON public.drivers 
FOR UPDATE 
USING (user_id = auth.uid());

-- Passengers and drivers should use the safe function instead