-- Insert sample rental cars
INSERT INTO public.rental_cars (
  brand, model, year, car_type, seating_capacity, fuel_type, 
  price_per_day, price_per_hour, description, features, 
  availability_status, location_address
) VALUES
-- Luxury Cars
('BMW', 'X7', 2023, 'Luxury SUV', 7, 'Petrol', 25000, 1500, 
 'Premium luxury SUV with advanced technology and comfort features', 
 '["Leather Seats", "Panoramic Sunroof", "Premium Sound System", "GPS Navigation", "Climate Control", "Massage Seats"]'::jsonb,
 'available', 'Kigali City Center'),

('Mercedes-Benz', 'S-Class', 2023, 'Luxury Sedan', 5, 'Hybrid', 22000, 1300, 
 'Executive luxury sedan with cutting-edge technology and ultimate comfort',
 '["Leather Interior", "Heated/Cooled Seats", "Premium Audio", "Adaptive Cruise Control", "Night Vision", "Wireless Charging"]'::jsonb,
 'available', 'Kigali Airport'),

-- SUVs
('Toyota', 'Land Cruiser', 2022, 'SUV', 8, 'Diesel', 18000, 1100, 
 'Reliable and powerful SUV perfect for Rwanda terrain and family trips',
 '["4WD", "8 Seats", "GPS Navigation", "Air Conditioning", "Roof Rails", "Tow Hitch"]'::jsonb,
 'available', 'Nyanza District'),

('Honda', 'CR-V', 2023, 'SUV', 5, 'Petrol', 15000, 900, 
 'Comfortable and fuel-efficient SUV ideal for city and countryside driving',
 '["All-Wheel Drive", "Backup Camera", "Bluetooth", "USB Ports", "Safety Sensors", "Cargo Space"]'::jsonb,
 'available', 'Musanze Town'),

-- Sedans
('Toyota', 'Camry', 2022, 'Sedan', 5, 'Hybrid', 12000, 750, 
 'Efficient and reliable sedan perfect for business trips and daily commuting',
 '["Hybrid Engine", "Advanced Safety", "Infotainment System", "Keyless Entry", "LED Headlights", "Spacious Interior"]'::jsonb,
 'available', 'Huye District'),

('Nissan', 'Altima', 2023, 'Sedan', 5, 'Petrol', 11000, 700, 
 'Modern sedan with great fuel economy and comfortable ride quality',
 '["CVT Transmission", "Smart Key", "Push Start", "Dual Climate", "Premium Interior", "Safety Features"]'::jsonb,
 'available', 'Rubavu District'),

-- Compact Cars
('Suzuki', 'Swift', 2023, 'Compact', 5, 'Petrol', 8000, 500, 
 'Economical compact car perfect for city driving and short trips',
 '["Manual Transmission", "Air Conditioning", "Power Steering", "CD Player", "Central Locking", "Fuel Efficient"]'::jsonb,
 'available', 'Kigali Downtown'),

('Hyundai', 'i10', 2022, 'Compact', 5, 'Petrol', 7500, 450, 
 'Small and nimble car ideal for navigating city streets and parking',
 '["Automatic Transmission", "Air Conditioning", "Power Windows", "ABS Brakes", "Airbags", "Bluetooth"]'::jsonb,
 'available', 'Kimisagara Market'),

-- Electric Cars
('Tesla', 'Model 3', 2023, 'Electric Sedan', 5, 'Electric', 20000, 1200, 
 'Revolutionary electric sedan with autopilot and cutting-edge technology',
 '["Autopilot", "Supercharging", "Glass Roof", "Premium Audio", "Over-the-Air Updates", "Mobile Connector"]'::jsonb,
 'available', 'Kigali Convention Centre');

-- Insert sample car images
INSERT INTO public.rental_car_images (car_id, image_url, is_primary, caption, display_order)
SELECT 
  rc.id,
  '/placeholder.svg' as image_url,
  true as is_primary,
  CONCAT(rc.brand, ' ', rc.model, ' - Main View') as caption,
  0 as display_order
FROM public.rental_cars rc;

-- Insert additional images for each car
INSERT INTO public.rental_car_images (car_id, image_url, is_primary, caption, display_order)
SELECT 
  rc.id,
  '/placeholder.svg' as image_url,
  false as is_primary,
  CONCAT(rc.brand, ' ', rc.model, ' - Interior View') as caption,
  1 as display_order
FROM public.rental_cars rc;

INSERT INTO public.rental_car_images (car_id, image_url, is_primary, caption, display_order)
SELECT 
  rc.id,
  '/placeholder.svg' as image_url,
  false as is_primary,
  CONCAT(rc.brand, ' ', rc.model, ' - Side View') as caption,
  2 as display_order
FROM public.rental_cars rc;