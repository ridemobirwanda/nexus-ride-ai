
-- Update drivers missing proper data
UPDATE public.drivers
SET car_model = 'Mercedes E-Class',
    car_plate = 'RAE 201G',
    car_year = 2023,
    car_color = 'Black',
    car_category_id = '29ab2a11-4b5e-404c-a096-08a8116c8ddb',
    bio = 'Luxury service specialist. 3+ years of VIP transportation experience.',
    is_available = true,
    status = 'available',
    name = 'Jean-Pierre'
WHERE id = '840fe183-0733-43c4-955b-07cede0f2e7b';

UPDATE public.drivers
SET car_model = 'Toyota Hiace',
    car_plate = 'RAD 890G',
    car_year = 2021,
    car_color = 'White',
    car_category_id = '6c0c81ba-fc95-428b-812c-8eac34c2fba3',
    bio = 'Group travel expert. Spacious van for families and tours.',
    is_available = true,
    status = 'available',
    name = 'Emmanuel'
WHERE id = '2f10dd02-3405-4e04-8c7f-68d60688c210';

UPDATE public.drivers
SET car_model = 'BMW X5',
    car_plate = 'RAG 709F',
    car_year = 2024,
    car_color = 'Dark Blue',
    car_category_id = '46980540-db43-40a2-a896-5aab001376e0',
    bio = 'Premium SUV driver. Smooth and safe rides guaranteed.',
    is_available = true,
    status = 'available',
    name = 'Patrick'
WHERE id = '08e0c19c-e74e-412d-bb6c-67a2fd40404f';

-- Add car images for drivers missing them
INSERT INTO public.car_images (driver_id, image_url, is_primary) VALUES
  ('840fe183-0733-43c4-955b-07cede0f2e7b', 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=800', true),
  ('840fe183-0733-43c4-955b-07cede0f2e7b', 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=800', false),
  ('2f10dd02-3405-4e04-8c7f-68d60688c210', 'https://images.unsplash.com/photo-1570125909232-eb263c188f7e?w=800', true),
  ('2f10dd02-3405-4e04-8c7f-68d60688c210', 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800', false),
  ('08e0c19c-e74e-412d-bb6c-67a2fd40404f', 'https://images.unsplash.com/photo-1556189250-72ba954cfc2b?w=800', true),
  ('08e0c19c-e74e-412d-bb6c-67a2fd40404f', 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800', false),
  ('dccf0834-17c9-481f-9e32-69cf08abb77b', 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800', false);

-- Add active driver locations for all sample drivers (Kigali area)
INSERT INTO public.driver_locations (driver_id, location, is_active, accuracy, heading, speed)
VALUES
  ('840fe183-0733-43c4-955b-07cede0f2e7b', point(29.8739, -1.9500), true, 8, 120, 30),
  ('2f10dd02-3405-4e04-8c7f-68d60688c210', point(29.8650, -1.9350), true, 12, 200, 15),
  ('08e0c19c-e74e-412d-bb6c-67a2fd40404f', point(29.8800, -1.9450), true, 6, 90, 40),
  ('5870c2a8-b937-4ff5-88e8-1cfea74fc52d', point(29.8700, -1.9380), true, 10, 170, 20),
  ('3a4543cb-9ada-4643-a6a6-59e21aad21a8', point(29.8550, -1.9520), true, 9, 310, 25),
  ('dccf0834-17c9-481f-9e32-69cf08abb77b', point(29.8620, -1.9410), true, 7, 45, 35),
  ('54ca234c-a30c-4ed6-9dc2-f56d0a0842b6', point(29.8780, -1.9480), true, 11, 260, 18)
ON CONFLICT DO NOTHING;
