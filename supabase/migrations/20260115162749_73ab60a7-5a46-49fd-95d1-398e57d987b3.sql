-- Add sample drivers with proper categories for testing
-- Update existing available drivers with car categories and add images

-- Update driver 1 with Economy category
UPDATE public.drivers 
SET car_category_id = '3c39bc6e-f9e6-4ade-bf5b-3eba944cf932',
    car_year = 2022,
    car_color = 'White',
    bio = 'Professional driver with 5 years of experience. Safe and reliable.'
WHERE id = 'be46a648-bd00-4a46-bd72-782d8640a78e';

-- Update driver 2 with Comfort category  
UPDATE public.drivers 
SET car_category_id = '22b1e03c-c8d1-485f-a2c6-c1d0f57648a6',
    car_year = 2023,
    car_color = 'Black',
    bio = 'Experienced driver specializing in comfortable rides.'
WHERE id = '5870c2a8-b937-4ff5-88e8-1cfea74fc52d';

-- Update driver 3 with SUV category
UPDATE public.drivers 
SET car_category_id = '12a8f1cc-328f-4c69-ad29-ed6568bfd4aa',
    car_year = 2021,
    car_color = 'Silver',
    bio = 'Family-friendly driver with a spacious SUV.'
WHERE id = '3a4543cb-9ada-4643-a6a6-59e21aad21a8';

-- Update driver 4 with Premium category and make available
UPDATE public.drivers 
SET car_category_id = '36cdb539-17ae-477f-9ab6-58581039e04e',
    car_year = 2024,
    car_color = 'Blue',
    bio = 'Premium service driver with top-rated reviews.',
    is_available = true,
    status = 'available'
WHERE id = 'dccf0834-17c9-481f-9e32-69cf08abb77b';

-- Update driver 5 with Standard category
UPDATE public.drivers 
SET car_category_id = 'a455eece-0067-4c70-9609-bd73824d5cbf',
    car_year = 2020,
    car_color = 'Gray',
    bio = 'Reliable driver for all your transportation needs.'
WHERE id = '54ca234c-a30c-4ed6-9dc2-f56d0a0842b6';

-- Add sample car images for testing (using Unsplash car images)
INSERT INTO public.car_images (driver_id, image_url, is_primary)
VALUES 
  -- Driver 1 - Toyota
  ('be46a648-bd00-4a46-bd72-782d8640a78e', 'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=800', true),
  ('be46a648-bd00-4a46-bd72-782d8640a78e', 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800', false),
  
  -- Driver 2 - Hybrid
  ('5870c2a8-b937-4ff5-88e8-1cfea74fc52d', 'https://images.unsplash.com/photo-1553440569-bcc63803a83d?w=800', true),
  ('5870c2a8-b937-4ff5-88e8-1cfea74fc52d', 'https://images.unsplash.com/photo-1502877338535-766e1452684a?w=800', false),
  
  -- Driver 3 - Toyota SUV
  ('3a4543cb-9ada-4643-a6a6-59e21aad21a8', 'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=800', true),
  
  -- Driver 5 - BMW
  ('54ca234c-a30c-4ed6-9dc2-f56d0a0842b6', 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800', true),
  ('54ca234c-a30c-4ed6-9dc2-f56d0a0842b6', 'https://images.unsplash.com/photo-1520050206757-ef6ac0a18ead?w=800', false)
ON CONFLICT DO NOTHING;

-- Add sample driver locations for real-time tracking (Kigali area) using native point type
INSERT INTO public.driver_locations (driver_id, location, is_active, accuracy, heading, speed)
VALUES 
  ('be46a648-bd00-4a46-bd72-782d8640a78e', point(30.0619, -1.9403), true, 10, 45, 25),
  ('5870c2a8-b937-4ff5-88e8-1cfea74fc52d', point(30.0742, -1.9536), true, 15, 180, 30),
  ('3a4543cb-9ada-4643-a6a6-59e21aad21a8', point(30.0523, -1.9298), true, 8, 270, 0),
  ('dccf0834-17c9-481f-9e32-69cf08abb77b', point(30.0891, -1.9652), true, 12, 90, 15),
  ('54ca234c-a30c-4ed6-9dc2-f56d0a0842b6', point(30.0456, -1.9187), true, 20, 315, 20)
ON CONFLICT DO NOTHING;

-- Add sample car videos for some drivers
INSERT INTO public.car_videos (driver_id, video_url, is_primary, thumbnail_url)
VALUES 
  ('be46a648-bd00-4a46-bd72-782d8640a78e', 'https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4', true, 'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=400'),
  ('5870c2a8-b937-4ff5-88e8-1cfea74fc52d', 'https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4', true, 'https://images.unsplash.com/photo-1553440569-bcc63803a83d?w=400')
ON CONFLICT DO NOTHING;