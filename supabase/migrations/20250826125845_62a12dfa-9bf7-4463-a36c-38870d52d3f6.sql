-- Update car categories to include passenger capacity and use RWF pricing
-- First, add passenger_capacity column
ALTER TABLE car_categories 
ADD COLUMN IF NOT EXISTS passenger_capacity INTEGER DEFAULT 4;

-- Update existing categories with RWF pricing (600 RWF per km)
-- and passenger capacity information
UPDATE car_categories SET 
  base_price_per_km = 600.00,
  base_fare = 1500.00,  -- Base fare in RWF
  minimum_fare = 3000.00, -- Minimum fare in RWF
  passenger_capacity = CASE 
    WHEN name ILIKE '%economy%' OR name ILIKE '%basic%' THEN 4
    WHEN name ILIKE '%premium%' OR name ILIKE '%comfort%' THEN 4
    WHEN name ILIKE '%luxury%' OR name ILIKE '%executive%' THEN 4
    WHEN name ILIKE '%suv%' OR name ILIKE '%large%' THEN 7
    WHEN name ILIKE '%van%' OR name ILIKE '%minibus%' THEN 12
    ELSE 4
  END;

-- Insert default car categories if none exist
INSERT INTO car_categories (name, description, base_price_per_km, base_fare, minimum_fare, passenger_capacity, features, is_active) 
SELECT * FROM (VALUES
  ('Economy', 'Affordable rides for daily commuting', 600.00, 1500.00, 3000.00, 4, '["4 seats", "Air conditioning", "Safe & reliable"]'::jsonb, true),
  ('Comfort', 'More spacious and comfortable rides', 800.00, 2000.00, 4000.00, 4, '["4 seats", "Premium comfort", "Air conditioning", "Professional driver"]'::jsonb, true),
  ('Premium', 'Luxury vehicles for special occasions', 1200.00, 3000.00, 6000.00, 4, '["4 seats", "Luxury interior", "Premium sound system", "Complimentary water"]'::jsonb, true),
  ('SUV', 'Large vehicles for groups and families', 1000.00, 2500.00, 5000.00, 7, '["7 seats", "Extra space", "Air conditioning", "Family friendly"]'::jsonb, true)
) AS new_categories(name, description, base_price_per_km, base_fare, minimum_fare, passenger_capacity, features, is_active)
WHERE NOT EXISTS (SELECT 1 FROM car_categories LIMIT 1);