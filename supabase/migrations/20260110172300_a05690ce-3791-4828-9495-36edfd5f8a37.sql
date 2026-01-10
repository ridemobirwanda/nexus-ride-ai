-- Create a dedicated storage bucket for driver verification documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('driver-documents', 'driver-documents', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for driver-documents bucket
-- Allow authenticated users to upload to their own driver folder
CREATE POLICY "Drivers can upload their own documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'driver-documents' 
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM public.drivers WHERE user_id = auth.uid()
  )
);

-- Allow drivers to view their own documents
CREATE POLICY "Drivers can view their own documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'driver-documents'
  AND (
    (storage.foldername(name))[1] IN (
      SELECT id::text FROM public.drivers WHERE user_id = auth.uid()
    )
    OR
    -- Admins can view all documents
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('super_admin', 'admin', 'support')
    )
  )
);

-- Allow drivers to update/delete their own documents
CREATE POLICY "Drivers can update their own documents"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'driver-documents'
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM public.drivers WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Drivers can delete their own documents"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'driver-documents'
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM public.drivers WHERE user_id = auth.uid()
  )
);

-- Public read access for approved documents (needed for admin verification panel)
CREATE POLICY "Public read for driver documents"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'driver-documents');

-- Function to auto-create verification request when a driver is created
CREATE OR REPLACE FUNCTION public.create_driver_verification_request()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.driver_verification_requests (
    driver_id,
    status,
    documents,
    submitted_at
  ) VALUES (
    NEW.id,
    'pending',
    '{}'::jsonb,
    NOW()
  )
  ON CONFLICT DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Create trigger for auto-creating verification requests
DROP TRIGGER IF EXISTS on_driver_created_verification ON public.drivers;
CREATE TRIGGER on_driver_created_verification
  AFTER INSERT ON public.drivers
  FOR EACH ROW
  EXECUTE FUNCTION public.create_driver_verification_request();

-- Add RLS policy for drivers to create their own verification requests
CREATE POLICY "Drivers can create their own verification requests"
ON public.driver_verification_requests
FOR INSERT
TO authenticated
WITH CHECK (
  driver_id IN (
    SELECT id FROM public.drivers WHERE user_id = auth.uid()
  )
);

-- Add RLS policy for drivers to view their own verification requests
CREATE POLICY "Drivers can view their own verification requests"
ON public.driver_verification_requests
FOR SELECT
TO authenticated
USING (
  driver_id IN (
    SELECT id FROM public.drivers WHERE user_id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('super_admin', 'admin', 'support')
  )
);

-- Add RLS policy for drivers to update their own verification requests (for resubmission)
CREATE POLICY "Drivers can update their own verification requests"
ON public.driver_verification_requests
FOR UPDATE
TO authenticated
USING (
  driver_id IN (
    SELECT id FROM public.drivers WHERE user_id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('super_admin', 'admin')
  )
);

-- Ensure RLS is enabled
ALTER TABLE public.driver_verification_requests ENABLE ROW LEVEL SECURITY;