-- Add localization and geographic system settings
INSERT INTO public.system_settings (key, value, description, category)
VALUES 
  ('default_country_code', '"RW"', 'Default country code for geocoding (ISO 3166-1 alpha-2)', 'localization'),
  ('default_currency', '"RWF"', 'Default currency code (ISO 4217)', 'localization'),
  ('default_locale', '"en-RW"', 'Default locale for formatting (BCP 47)', 'localization'),
  ('default_map_center', '{"lat": -1.9414, "lng": 30.0588}', 'Default map center coordinates', 'localization'),
  ('default_map_zoom', '15', 'Default map zoom level', 'localization'),
  ('service_area_countries', '["RW"]', 'List of countries where service is available', 'localization')
ON CONFLICT (key) DO UPDATE SET 
  value = EXCLUDED.value,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  updated_at = now();