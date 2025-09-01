-- Create rental cars table
CREATE TABLE public.rental_cars (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  year INTEGER NOT NULL,
  car_type TEXT NOT NULL, -- SUV, Sedan, Luxury, etc.
  seating_capacity INTEGER NOT NULL DEFAULT 5,
  fuel_type TEXT NOT NULL DEFAULT 'Petrol', -- Petrol, Diesel, Electric, Hybrid
  price_per_day NUMERIC NOT NULL,
  price_per_hour NUMERIC NOT NULL,
  description TEXT,
  features JSONB DEFAULT '[]'::jsonb,
  availability_status TEXT NOT NULL DEFAULT 'available', -- available, rented, maintenance
  location_lat NUMERIC,
  location_lng NUMERIC,
  location_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  is_active BOOLEAN NOT NULL DEFAULT true
);

-- Create rental car images table
CREATE TABLE public.rental_car_images (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  car_id UUID NOT NULL REFERENCES public.rental_cars(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  caption TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create car rentals table (booking records)
CREATE TABLE public.car_rentals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  car_id UUID NOT NULL REFERENCES public.rental_cars(id),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  rental_start TIMESTAMP WITH TIME ZONE NOT NULL,
  rental_end TIMESTAMP WITH TIME ZONE NOT NULL,
  duration_type TEXT NOT NULL, -- 'hourly' or 'daily'
  duration_value INTEGER NOT NULL, -- number of hours/days
  total_price NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, confirmed, active, completed, cancelled
  pickup_location TEXT,
  return_location TEXT,
  driver_license_number TEXT,
  contact_phone TEXT NOT NULL,
  special_requests TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create rental locations table (for GPS tracking)
CREATE TABLE public.rental_locations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  rental_id UUID NOT NULL REFERENCES public.car_rentals(id) ON DELETE CASCADE,
  car_id UUID NOT NULL REFERENCES public.rental_cars(id),
  latitude NUMERIC NOT NULL,
  longitude NUMERIC NOT NULL,
  speed NUMERIC,
  heading NUMERIC,
  accuracy NUMERIC,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true
);

-- Enable Row Level Security
ALTER TABLE public.rental_cars ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rental_car_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.car_rentals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rental_locations ENABLE ROW LEVEL SECURITY;

-- Create policies for rental_cars
CREATE POLICY "Anyone can view active rental cars" ON public.rental_cars
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage rental cars" ON public.rental_cars
  FOR ALL USING (is_admin(auth.uid()));

-- Create policies for rental_car_images
CREATE POLICY "Anyone can view car images" ON public.rental_car_images
  FOR SELECT USING (
    car_id IN (SELECT id FROM public.rental_cars WHERE is_active = true)
  );

CREATE POLICY "Admins can manage car images" ON public.rental_car_images
  FOR ALL USING (is_admin(auth.uid()));

-- Create policies for car_rentals
CREATE POLICY "Users can view their own rentals" ON public.car_rentals
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create their own rentals" ON public.car_rentals
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own rentals" ON public.car_rentals
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all rentals" ON public.car_rentals
  FOR ALL USING (is_admin(auth.uid()));

-- Create policies for rental_locations
CREATE POLICY "Users can view locations for their rentals" ON public.rental_locations
  FOR SELECT USING (
    rental_id IN (SELECT id FROM public.car_rentals WHERE user_id = auth.uid())
  );

CREATE POLICY "Admins can view all rental locations" ON public.rental_locations
  FOR SELECT USING (is_admin(auth.uid()));

CREATE POLICY "System can insert location updates" ON public.rental_locations
  FOR INSERT WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX idx_rental_cars_type ON public.rental_cars(car_type);
CREATE INDEX idx_rental_cars_availability ON public.rental_cars(availability_status);
CREATE INDEX idx_rental_car_images_car_id ON public.rental_car_images(car_id);
CREATE INDEX idx_rental_car_images_primary ON public.rental_car_images(is_primary);
CREATE INDEX idx_car_rentals_user_id ON public.car_rentals(user_id);
CREATE INDEX idx_car_rentals_car_id ON public.car_rentals(car_id);
CREATE INDEX idx_car_rentals_status ON public.car_rentals(status);
CREATE INDEX idx_rental_locations_rental_id ON public.rental_locations(rental_id);
CREATE INDEX idx_rental_locations_timestamp ON public.rental_locations(timestamp);

-- Create triggers for updated_at
CREATE TRIGGER update_rental_cars_updated_at
  BEFORE UPDATE ON public.rental_cars
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_car_rentals_updated_at
  BEFORE UPDATE ON public.car_rentals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();