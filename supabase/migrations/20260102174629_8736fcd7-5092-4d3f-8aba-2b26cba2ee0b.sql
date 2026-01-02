-- Create storage bucket for rental car images if not exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('rental-car-images', 'rental-car-images', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for rental car images
CREATE POLICY "Anyone can view rental car images"
ON storage.objects FOR SELECT
USING (bucket_id = 'rental-car-images');

CREATE POLICY "Admins can upload rental car images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'rental-car-images' 
  AND is_admin(auth.uid())
);

CREATE POLICY "Admins can update rental car images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'rental-car-images' 
  AND is_admin(auth.uid())
);

CREATE POLICY "Admins can delete rental car images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'rental-car-images' 
  AND is_admin(auth.uid())
);