-- Update car categories with proper image URLs
UPDATE public.car_categories 
SET image_url = CASE 
  WHEN name = 'Standard 4-Seat' THEN '/src/assets/standard-4seat.jpg'
  WHEN name = 'Comfortable 4-Seat' THEN '/src/assets/comfortable-4seat.jpg'
  WHEN name = 'Standard 7-Seat' THEN '/src/assets/standard-7seat.jpg'
  WHEN name = 'Comfortable 7-Seat' THEN '/src/assets/standard-7seat.jpg'
  WHEN name = 'Standard 10-Seat' THEN '/src/assets/standard-10seat.jpg'
  WHEN name = 'Premium 4-Seat' THEN '/src/assets/premium-4seat.jpg'
  WHEN name = 'Premium 7-Seat' THEN '/src/assets/premium-4seat.jpg'
  WHEN name = 'Luxury 4-Seat' THEN '/src/assets/luxury-4seat.jpg'
  WHEN name = 'Luxury 7-Seat' THEN '/src/assets/luxury-4seat.jpg'
  ELSE '/placeholder.svg'
END;