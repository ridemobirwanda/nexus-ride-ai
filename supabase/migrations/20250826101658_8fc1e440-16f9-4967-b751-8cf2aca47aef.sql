-- Create car categories table with pricing
CREATE TABLE public.car_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  base_price_per_km NUMERIC(10,2) NOT NULL DEFAULT 1.20,
  base_fare NUMERIC(10,2) NOT NULL DEFAULT 2.50,
  minimum_fare NUMERIC(10,2) NOT NULL DEFAULT 5.00,
  surge_multiplier NUMERIC(3,2) NOT NULL DEFAULT 1.0,
  image_url TEXT,
  features JSONB DEFAULT '[]'::JSONB,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert default car categories
INSERT INTO public.car_categories (name, description, base_price_per_km, base_fare, minimum_fare, features) VALUES
('Economy', 'Affordable everyday rides', 1.20, 2.50, 5.00, '["Air Conditioning", "4 Seats", "Standard Comfort"]'::JSONB),
('Comfort', 'More space and comfort', 1.80, 3.50, 7.00, '["Air Conditioning", "4 Seats", "Premium Comfort", "Extra Legroom"]'::JSONB),
('Premium', 'Luxury vehicles with premium service', 2.50, 5.00, 12.00, '["Air Conditioning", "4 Seats", "Luxury Interior", "Professional Driver", "Complimentary Water"]'::JSONB),
('XL', 'Larger vehicles for groups', 2.00, 4.00, 8.00, '["Air Conditioning", "6+ Seats", "Extra Space", "Group Travel"]'::JSONB);

-- Create car images table for multiple images per driver
CREATE TABLE public.car_images (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  driver_id UUID NOT NULL,
  image_url TEXT NOT NULL,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add car category to drivers table
ALTER TABLE public.drivers 
ADD COLUMN car_category_id UUID REFERENCES public.car_categories(id),
ADD COLUMN car_year INTEGER,
ADD COLUMN car_color TEXT,
ADD COLUMN car_features JSONB DEFAULT '[]'::JSONB;

-- Update drivers to have default economy category
UPDATE public.drivers 
SET car_category_id = (SELECT id FROM public.car_categories WHERE name = 'Economy' LIMIT 1);

-- Create storage bucket for car images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('car-images', 'car-images', true);

-- Enable RLS on new tables
ALTER TABLE public.car_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.car_images ENABLE ROW LEVEL SECURITY;

-- RLS policies for car_categories (public read)
CREATE POLICY "Anyone can view car categories" 
ON public.car_categories 
FOR SELECT 
USING (is_active = true);

-- RLS policies for car_images
CREATE POLICY "Drivers can insert their own car images" 
ON public.car_images 
FOR INSERT 
WITH CHECK (driver_id IN (SELECT id FROM public.drivers WHERE user_id = auth.uid()));

CREATE POLICY "Drivers can view their own car images" 
ON public.car_images 
FOR SELECT 
USING (driver_id IN (SELECT id FROM public.drivers WHERE user_id = auth.uid()));

CREATE POLICY "Anyone can view car images for available drivers" 
ON public.car_images 
FOR SELECT 
USING (driver_id IN (SELECT id FROM public.drivers WHERE is_available = true));

CREATE POLICY "Drivers can update their own car images" 
ON public.car_images 
FOR UPDATE 
USING (driver_id IN (SELECT id FROM public.drivers WHERE user_id = auth.uid()));

CREATE POLICY "Drivers can delete their own car images" 
ON public.car_images 
FOR DELETE 
USING (driver_id IN (SELECT id FROM public.drivers WHERE user_id = auth.uid()));

-- Storage policies for car images
CREATE POLICY "Anyone can view car images" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'car-images');

CREATE POLICY "Drivers can upload car images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'car-images' AND auth.uid() IS NOT NULL);

CREATE POLICY "Drivers can update their own car images" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'car-images' AND auth.uid() IS NOT NULL);

CREATE POLICY "Drivers can delete their own car images" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'car-images' AND auth.uid() IS NOT NULL);

-- Add updated_at trigger for new tables
CREATE TRIGGER update_car_categories_updated_at
BEFORE UPDATE ON public.car_categories
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Update rides table to include car category pricing
ALTER TABLE public.rides
ADD COLUMN car_category_id UUID REFERENCES public.car_categories(id);