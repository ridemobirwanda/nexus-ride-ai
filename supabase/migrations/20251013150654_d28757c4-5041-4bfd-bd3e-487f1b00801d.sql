-- Create verification request for existing driver
INSERT INTO public.driver_verification_requests (driver_id, status, documents, submitted_at)
VALUES ('08e0c19c-e74e-412d-bb6c-67a2fd40404f', 'pending', '[]'::jsonb, now())
ON CONFLICT DO NOTHING;