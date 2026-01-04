-- Add admin CRUD policies for car_categories table
-- Admins can manage all car categories (insert, update, delete)
CREATE POLICY "Admins can manage car categories" 
ON public.car_categories 
FOR ALL 
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));