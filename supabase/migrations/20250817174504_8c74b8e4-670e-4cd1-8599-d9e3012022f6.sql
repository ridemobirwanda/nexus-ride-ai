-- Fix function search path security issues
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Fix handle_new_user function search path
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if user metadata indicates they're registering as a passenger
  IF NEW.raw_user_meta_data->>'user_type' = 'passenger' THEN
    INSERT INTO public.passengers (user_id, name, phone)
    VALUES (
      NEW.id, 
      COALESCE(NEW.raw_user_meta_data->>'name', NEW.email), 
      NEW.raw_user_meta_data->>'phone'
    );
  ELSIF NEW.raw_user_meta_data->>'user_type' = 'driver' THEN
    INSERT INTO public.drivers (user_id, name, phone, car_model, car_plate)
    VALUES (
      NEW.id, 
      COALESCE(NEW.raw_user_meta_data->>'name', NEW.email), 
      NEW.raw_user_meta_data->>'phone',
      NEW.raw_user_meta_data->>'car_model',
      NEW.raw_user_meta_data->>'car_plate'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;