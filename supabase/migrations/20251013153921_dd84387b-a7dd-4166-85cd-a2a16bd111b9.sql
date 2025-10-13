-- Create or replace the update_driver_status function
CREATE OR REPLACE FUNCTION public.update_driver_status(p_status driver_status)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
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