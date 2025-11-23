-- Create car_videos table for video uploads
CREATE TABLE IF NOT EXISTS public.car_videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id uuid NOT NULL REFERENCES public.drivers(id) ON DELETE CASCADE,
  video_url text NOT NULL,
  thumbnail_url text,
  is_primary boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on car_videos
ALTER TABLE public.car_videos ENABLE ROW LEVEL SECURITY;

-- Drivers can view their own car videos
CREATE POLICY "Drivers can view their own car videos"
ON public.car_videos
FOR SELECT
TO authenticated
USING (driver_id IN (
  SELECT id FROM public.drivers WHERE user_id = auth.uid()
));

-- Drivers can insert their own car videos
CREATE POLICY "Drivers can insert their own car videos"
ON public.car_videos
FOR INSERT
TO authenticated
WITH CHECK (driver_id IN (
  SELECT id FROM public.drivers WHERE user_id = auth.uid()
));

-- Drivers can update their own car videos
CREATE POLICY "Drivers can update their own car videos"
ON public.car_videos
FOR UPDATE
TO authenticated
USING (driver_id IN (
  SELECT id FROM public.drivers WHERE user_id = auth.uid()
));

-- Drivers can delete their own car videos
CREATE POLICY "Drivers can delete their own car videos"
ON public.car_videos
FOR DELETE
TO authenticated
USING (driver_id IN (
  SELECT id FROM public.drivers WHERE user_id = auth.uid()
));

-- Anyone can view car videos for available drivers
CREATE POLICY "Anyone can view car videos for available drivers"
ON public.car_videos
FOR SELECT
TO authenticated
USING (driver_id IN (
  SELECT id FROM public.drivers WHERE is_available = true
));

-- Create storage bucket for car videos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'car-videos',
  'car-videos',
  true,
  52428800, -- 50MB limit
  ARRAY['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo', 'video/x-matroska']
)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for car-videos bucket
CREATE POLICY "Drivers can upload their own car videos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'car-videos' AND
  (storage.foldername(name))[1] IN (
    SELECT id::text FROM public.drivers WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Drivers can update their own car videos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'car-videos' AND
  (storage.foldername(name))[1] IN (
    SELECT id::text FROM public.drivers WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Drivers can delete their own car videos"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'car-videos' AND
  (storage.foldername(name))[1] IN (
    SELECT id::text FROM public.drivers WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Anyone can view car videos"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'car-videos');