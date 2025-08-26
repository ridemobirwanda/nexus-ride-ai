-- Update car categories with proper pricing tiers and passenger capacities
DELETE FROM public.car_categories;

-- Insert the new car categories with RWF pricing and different passenger capacities
INSERT INTO public.car_categories (id, name, description, base_price_per_km, base_fare, minimum_fare, passenger_capacity, features, is_active) VALUES
-- Standard cars - 4 passengers
(gen_random_uuid(), 'Standard 4-Seat', 'Basic comfortable ride for up to 4 passengers', 600, 2000, 3000, 4, 
 '["Air Conditioning", "4 Seats", "Basic Comfort", "Safe & Clean"]'::jsonb, true),

-- Comfortable cars - 4 passengers  
(gen_random_uuid(), 'Comfortable 4-Seat', 'Enhanced comfort ride for up to 4 passengers', 1000, 3000, 4000, 4,
 '["Premium Air Conditioning", "4 Seats", "Enhanced Comfort", "Leather Seats", "Music System"]'::jsonb, true),

-- Standard cars - 7 passengers
(gen_random_uuid(), 'Standard 7-Seat', 'Basic comfortable ride for up to 7 passengers', 600, 2500, 4000, 7,
 '["Air Conditioning", "7 Seats", "Family Size", "Safe & Clean", "Extra Space"]'::jsonb, true),

-- Comfortable cars - 7 passengers
(gen_random_uuid(), 'Comfortable 7-Seat', 'Enhanced comfort ride for up to 7 passengers', 1000, 3500, 5000, 7,
 '["Premium Air Conditioning", "7 Seats", "Family Comfort", "Leather Seats", "Entertainment System"]'::jsonb, true),

-- Standard cars - 10 passengers
(gen_random_uuid(), 'Standard 10-Seat', 'Basic comfortable ride for up to 10 passengers', 600, 3000, 5000, 10,
 '["Air Conditioning", "10 Seats", "Group Travel", "Safe & Clean", "Large Capacity"]'::jsonb, true),

-- Premium cars - 4 passengers
(gen_random_uuid(), 'Premium 4-Seat', 'Premium experience for up to 4 passengers', 1500, 4000, 6000, 4,
 '["Climate Control", "4 Seats", "Premium Interior", "Leather Seats", "Sound System", "WiFi"]'::jsonb, true),

-- Premium cars - 7 passengers  
(gen_random_uuid(), 'Premium 7-Seat', 'Premium experience for up to 7 passengers', 1500, 4500, 7000, 7,
 '["Climate Control", "7 Seats", "Premium Family", "Leather Seats", "Entertainment", "WiFi"]'::jsonb, true),

-- Luxury cars - 4 passengers
(gen_random_uuid(), 'Luxury 4-Seat', 'Ultimate luxury experience for up to 4 passengers', 2500, 6000, 10000, 4,
 '["Luxury Interior", "4 Seats", "Premium Leather", "Massage Seats", "Premium Sound", "Champagne Service"]'::jsonb, true),

-- Luxury cars - 7 passengers
(gen_random_uuid(), 'Luxury 7-Seat', 'Ultimate luxury experience for up to 7 passengers', 2500, 7000, 12000, 7,
 '["Luxury Interior", "7 Seats", "Premium Family Luxury", "Massage Seats", "Entertainment Suite", "VIP Service"]'::jsonb, true);