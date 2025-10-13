-- Allow admins to update driver status and profiles
CREATE POLICY "Admins can update drivers"
ON public.drivers
FOR UPDATE
USING (is_admin(auth.uid()));