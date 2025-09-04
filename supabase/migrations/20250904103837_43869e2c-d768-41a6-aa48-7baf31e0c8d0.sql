-- Create security definer functions to avoid infinite recursion in RLS policies
CREATE OR REPLACE FUNCTION public.get_current_passenger_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT id FROM public.passengers WHERE user_id = auth.uid() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.get_current_driver_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT id FROM public.drivers WHERE user_id = auth.uid() LIMIT 1;
$$;

-- Update rides RLS policies to use security definer functions
DROP POLICY IF EXISTS "Passengers can create rides" ON public.rides;
DROP POLICY IF EXISTS "Passengers can update their own rides" ON public.rides;
DROP POLICY IF EXISTS "Passengers can view their own rides" ON public.rides;
DROP POLICY IF EXISTS "Drivers can update their assigned rides" ON public.rides;
DROP POLICY IF EXISTS "Drivers can view their assigned rides" ON public.rides;

-- Recreate policies using security definer functions
CREATE POLICY "Passengers can create rides" 
ON public.rides 
FOR INSERT 
WITH CHECK (passenger_id = public.get_current_passenger_id());

CREATE POLICY "Passengers can update their own rides" 
ON public.rides 
FOR UPDATE 
USING (passenger_id = public.get_current_passenger_id());

CREATE POLICY "Passengers can view their own rides" 
ON public.rides 
FOR SELECT 
USING (passenger_id = public.get_current_passenger_id());

CREATE POLICY "Drivers can update their assigned rides" 
ON public.rides 
FOR UPDATE 
USING (driver_id = public.get_current_driver_id());

CREATE POLICY "Drivers can view their assigned rides" 
ON public.rides 
FOR SELECT 
USING (driver_id = public.get_current_driver_id());