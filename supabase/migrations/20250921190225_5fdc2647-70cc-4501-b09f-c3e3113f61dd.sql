-- Add sample driver locations around Kigali, Rwanda
-- First, let's add some sample drivers with realistic locations

-- Update existing drivers with sample locations in Kigali
UPDATE drivers SET 
  current_location = point(-1.9441, 30.0619),  -- Kigali City Center
  last_activity_at = now(),
  status = 'available',
  is_available = true
WHERE name IS NULL OR name = '';

-- Insert sample driver location records for active tracking
INSERT INTO driver_locations (driver_id, location, is_active, timestamp) 
SELECT 
  id,
  point(-1.9441 + (random() - 0.5) * 0.02, 30.0619 + (random() - 0.5) * 0.02), -- Random locations around Kigali
  true,
  now()
FROM drivers 
WHERE current_location IS NOT NULL
ON CONFLICT DO NOTHING;

-- Update rental cars with sample locations around Kigali
UPDATE rental_cars SET 
  location_lat = -1.9441 + (random() - 0.5) * 0.03,  -- Latitude around Kigali
  location_lng = 30.0619 + (random() - 0.5) * 0.03,  -- Longitude around Kigali  
  location_address = CASE 
    WHEN random() < 0.2 THEN 'Kigali Airport, Kigali'
    WHEN random() < 0.4 THEN 'Kimisagara, Kigali'
    WHEN random() < 0.6 THEN 'Nyarutarama, Kigali'
    WHEN random() < 0.8 THEN 'Remera, Kigali'
    ELSE 'City Centre, Kigali'
  END
WHERE location_lat IS NULL OR location_lng IS NULL;

-- Add some specific popular locations for better reference
INSERT INTO rental_cars (
  brand, model, year, car_type, fuel_type, seating_capacity, 
  price_per_hour, price_per_day, description, location_lat, location_lng, location_address,
  features, availability_status, is_active, owner_name, owner_phone
) VALUES 
(
  'Toyota', 'RAV4', 2022, 'SUV', 'Petrol', 7,
  5000, 35000, 'Perfect family SUV for city and countryside trips',
  -1.9706, 30.1044, 'Kigali International Airport, Kigali',
  '["Air Conditioning", "GPS Navigation", "Bluetooth", "USB Charging", "4WD", "Luggage Space"]'::jsonb,
  'available', true, 'Airport Car Rentals', '+250788123456'
),
(
  'Honda', 'Civic', 2023, 'Sedan', 'Petrol', 5,
  3500, 25000, 'Fuel-efficient sedan perfect for business trips',
  -1.9441, 30.0619, 'City Centre, Kigali',
  '["Air Conditioning", "GPS Navigation", "Bluetooth", "Fuel Efficient", "Comfortable Seats"]'::jsonb,
  'available', true, 'City Rentals', '+250788234567'
),
(
  'Mercedes', 'C-Class', 2023, 'Luxury Sedan', 'Petrol', 5,
  8000, 60000, 'Luxury sedan for premium travel experience',
  -1.9302, 30.0588, 'Nyarutarama, Kigali',  
  '["Premium Interior", "GPS Navigation", "Bluetooth", "Climate Control", "Leather Seats", "Premium Sound"]'::jsonb,
  'available', true, 'Premium Auto', '+250788345678'
),
(
  'Toyota', 'Hiace', 2021, 'Van', 'Diesel', 14,
  6000, 45000, 'Large capacity van for group transportation',
  -1.9659, 30.0588, 'Remera, Kigali',
  '["Air Conditioning", "14 Seats", "GPS Navigation", "Large Capacity", "Luggage Space"]'::jsonb,
  'available', true, 'Group Transport Ltd', '+250788456789'
)
ON CONFLICT DO NOTHING;