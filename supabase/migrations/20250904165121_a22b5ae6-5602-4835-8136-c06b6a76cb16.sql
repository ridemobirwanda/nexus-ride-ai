-- Fix driver profile creation and improve role-based authentication
-- First, ensure the handle_new_user trigger properly creates driver profiles

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create improved trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if user metadata indicates they're registering as a driver
  IF NEW.raw_user_meta_data->>'user_type' = 'driver' THEN
    INSERT INTO public.drivers (user_id, name, phone, car_model, car_plate, status, is_available)
    VALUES (
      NEW.id, 
      COALESCE(NEW.raw_user_meta_data->>'name', NEW.email), 
      NEW.raw_user_meta_data->>'phone',
      NEW.raw_user_meta_data->>'car_model',
      NEW.raw_user_meta_data->>'car_plate',
      'offline'::driver_status,
      false
    );
    
    -- Also create a user role entry
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'driver'::user_role)
    ON CONFLICT (user_id) DO UPDATE SET role = 'driver'::user_role;
    
  ELSIF NEW.raw_user_meta_data->>'user_type' = 'passenger' THEN
    INSERT INTO public.passengers (user_id, name, phone)
    VALUES (
      NEW.id, 
      COALESCE(NEW.raw_user_meta_data->>'name', NEW.email), 
      NEW.raw_user_meta_data->>'phone'
    );
    
    -- Also create a user role entry
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'passenger'::user_role)
    ON CONFLICT (user_id) DO UPDATE SET role = 'passenger'::user_role;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Add function to check if user is a driver
CREATE OR REPLACE FUNCTION public.is_driver(user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.drivers d
    WHERE d.user_id = is_driver.user_id
  );
$$;

-- Improve the update_driver_status function to handle better error reporting
CREATE OR REPLACE FUNCTION public.update_driver_status(p_status driver_status)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_driver_id UUID;
  v_driver_count INTEGER;
BEGIN
  -- Check if user has a driver profile
  SELECT COUNT(*), MAX(id) INTO v_driver_count, v_driver_id
  FROM public.drivers 
  WHERE user_id = auth.uid();
  
  IF v_driver_count = 0 THEN
    RAISE EXCEPTION 'No driver profile found for user. Please complete driver registration first.';
  END IF;
  
  -- Update status and activity timestamp
  UPDATE public.drivers 
  SET 
    status = p_status,
    last_activity_at = now(),
    is_available = CASE 
      WHEN p_status = 'available' THEN true 
      ELSE false 
    END
  WHERE id = v_driver_id;
  
  RETURN TRUE;
END;
$$;