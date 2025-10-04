-- Update RLS policy to allow everyone to view car categories (not just authenticated users)
DROP POLICY IF EXISTS "Authenticated can view car categories" ON car_categories;

CREATE POLICY "Anyone can view active car categories" 
ON car_categories 
FOR SELECT 
USING (is_active = true);