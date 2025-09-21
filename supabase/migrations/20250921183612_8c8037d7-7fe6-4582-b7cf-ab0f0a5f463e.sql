-- Update car categories with realistic car models and enhanced descriptions
UPDATE car_categories SET 
  name = 'Economy - Toyota Corolla',
  description = 'Reliable & fuel-efficient sedan perfect for city rides',
  features = '["Air Conditioning", "4 Seats", "Basic Comfort", "Safe & Clean", "Fuel Efficient", "Reliable"]'::jsonb
WHERE name = 'Standard 4-Seat';

UPDATE car_categories SET 
  name = 'Standard - Toyota RAV4',
  description = 'Spacious SUV for families and group travel',
  features = '["Air Conditioning", "7 Seats", "Family Size", "Safe & Clean", "Extra Space", "All Weather"]'::jsonb
WHERE name = 'Standard 7-Seat';

UPDATE car_categories SET 
  name = 'Van - Toyota Hiace',
  description = 'Large capacity van for group transportation',
  features = '["Air Conditioning", "10 Seats", "Group Travel", "Safe & Clean", "Large Capacity", "Luggage Space"]'::jsonb
WHERE name = 'Standard 10-Seat';

UPDATE car_categories SET 
  name = 'Comfort - Honda Accord',
  description = 'Premium sedan with enhanced comfort features',
  features = '["Premium Air Conditioning", "4 Seats", "Enhanced Comfort", "Leather Seats", "Music System", "WiFi"]'::jsonb
WHERE name = 'Comfortable 4-Seat';

UPDATE car_categories SET 
  name = 'SUV - Toyota Prado',
  description = 'Luxury SUV with premium family comfort',
  features = '["Premium Air Conditioning", "7 Seats", "Family Comfort", "Leather Seats", "Entertainment System", "4WD"]'::jsonb
WHERE name = 'Comfortable 7-Seat';

UPDATE car_categories SET 
  name = 'Premium - BMW 3 Series',
  description = 'Executive sedan with premium interior and features',
  features = '["Climate Control", "4 Seats", "Premium Interior", "Leather Seats", "Sound System", "WiFi", "Phone Charger"]'::jsonb
WHERE name = 'Premium 4-Seat';

UPDATE car_categories SET 
  name = 'Premium SUV - BMW X5',
  description = 'Luxury SUV with premium family experience',
  features = '["Climate Control", "7 Seats", "Premium Family", "Leather Seats", "Entertainment", "WiFi", "Panoramic Roof"]'::jsonb
WHERE name = 'Premium 7-Seat';

UPDATE car_categories SET 
  name = 'Luxury - Mercedes S-Class',
  description = 'Ultimate luxury sedan with VIP service',
  features = '["Luxury Interior", "4 Seats", "Premium Leather", "Massage Seats", "Premium Sound", "Champagne Service", "Butler Service"]'::jsonb
WHERE name = 'Luxury 4-Seat';

UPDATE car_categories SET 
  name = 'VIP - Mercedes GLS',
  description = 'Ultra-luxury SUV with exclusive family service',
  features = '["Luxury Interior", "7 Seats", "Premium Family", "Massage Seats", "Entertainment Suite", "VIP Service", "Concierge"]'::jsonb
WHERE name = 'Luxury 7-Seat';