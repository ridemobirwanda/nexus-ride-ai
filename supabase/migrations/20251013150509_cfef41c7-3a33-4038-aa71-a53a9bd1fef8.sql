-- Create function to automatically create verification request for new drivers
CREATE OR REPLACE FUNCTION public.create_driver_verification_request()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Create a verification request for the new driver
  INSERT INTO public.driver_verification_requests (
    driver_id,
    status,
    documents,
    submitted_at
  ) VALUES (
    NEW.id,
    'pending',
    '[]'::jsonb,
    now()
  );
  
  RETURN NEW;
END;
$$;

-- Create trigger to automatically create verification requests
DROP TRIGGER IF EXISTS on_driver_created ON public.drivers;
CREATE TRIGGER on_driver_created
  AFTER INSERT ON public.drivers
  FOR EACH ROW
  EXECUTE FUNCTION public.create_driver_verification_request();