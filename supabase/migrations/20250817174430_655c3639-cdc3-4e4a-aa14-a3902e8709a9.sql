-- Create passengers table
CREATE TABLE public.passengers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT UNIQUE,
  profile_pic TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create drivers table
CREATE TABLE public.drivers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT UNIQUE,
  car_model TEXT,
  car_plate TEXT,
  current_location POINT,
  is_available BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create rides table
CREATE TABLE public.rides (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  passenger_id UUID NOT NULL REFERENCES public.passengers(id) ON DELETE CASCADE,
  driver_id UUID REFERENCES public.drivers(id),
  pickup_location POINT NOT NULL,
  pickup_address TEXT NOT NULL,
  dropoff_location POINT NOT NULL,
  dropoff_address TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'in_progress', 'completed', 'cancelled')),
  estimated_fare DECIMAL(10,2),
  final_fare DECIMAL(10,2),
  distance_km DECIMAL(10,2),
  duration_minutes INTEGER,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  feedback TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create chat_messages table
CREATE TABLE public.chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ride_id UUID NOT NULL REFERENCES public.rides(id) ON DELETE CASCADE,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('passenger', 'driver')),
  sender_id UUID NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.passengers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for passengers
CREATE POLICY "Passengers can view their own profile" 
ON public.passengers FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Passengers can update their own profile" 
ON public.passengers FOR UPDATE 
USING (user_id = auth.uid());

CREATE POLICY "Passengers can insert their own profile" 
ON public.passengers FOR INSERT 
WITH CHECK (user_id = auth.uid());

-- RLS Policies for drivers
CREATE POLICY "Anyone can view available drivers" 
ON public.drivers FOR SELECT 
USING (is_available = true);

CREATE POLICY "Drivers can view their own profile" 
ON public.drivers FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Drivers can update their own profile" 
ON public.drivers FOR UPDATE 
USING (user_id = auth.uid());

CREATE POLICY "Drivers can insert their own profile" 
ON public.drivers FOR INSERT 
WITH CHECK (user_id = auth.uid());

-- RLS Policies for rides
CREATE POLICY "Passengers can view their own rides" 
ON public.rides FOR SELECT 
USING (passenger_id IN (SELECT id FROM public.passengers WHERE user_id = auth.uid()));

CREATE POLICY "Drivers can view their assigned rides" 
ON public.rides FOR SELECT 
USING (driver_id IN (SELECT id FROM public.drivers WHERE user_id = auth.uid()));

CREATE POLICY "Passengers can create rides" 
ON public.rides FOR INSERT 
WITH CHECK (passenger_id IN (SELECT id FROM public.passengers WHERE user_id = auth.uid()));

CREATE POLICY "Passengers can update their own rides" 
ON public.rides FOR UPDATE 
USING (passenger_id IN (SELECT id FROM public.passengers WHERE user_id = auth.uid()));

CREATE POLICY "Drivers can update their assigned rides" 
ON public.rides FOR UPDATE 
USING (driver_id IN (SELECT id FROM public.drivers WHERE user_id = auth.uid()));

-- RLS Policies for chat messages
CREATE POLICY "Ride participants can view chat messages" 
ON public.chat_messages FOR SELECT 
USING (
  ride_id IN (
    SELECT r.id FROM public.rides r 
    INNER JOIN public.passengers p ON r.passenger_id = p.id 
    WHERE p.user_id = auth.uid()
    UNION
    SELECT r.id FROM public.rides r 
    INNER JOIN public.drivers d ON r.driver_id = d.id 
    WHERE d.user_id = auth.uid()
  )
);

CREATE POLICY "Ride participants can send chat messages" 
ON public.chat_messages FOR INSERT 
WITH CHECK (
  ride_id IN (
    SELECT r.id FROM public.rides r 
    INNER JOIN public.passengers p ON r.passenger_id = p.id 
    WHERE p.user_id = auth.uid()
    UNION
    SELECT r.id FROM public.rides r 
    INNER JOIN public.drivers d ON r.driver_id = d.id 
    WHERE d.user_id = auth.uid()
  )
);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_rides_updated_at
BEFORE UPDATE ON public.rides
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle new user profiles
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();