-- Add admin access policies for viewing all data in admin panel

-- Allow admins to view all passengers
CREATE POLICY "Admins can view all passengers"
ON public.passengers
FOR SELECT
USING (is_admin(auth.uid()));

-- Allow admins to view all drivers
CREATE POLICY "Admins can view all drivers"
ON public.drivers
FOR SELECT
USING (is_admin(auth.uid()));

-- Allow admins to view all rides
CREATE POLICY "Admins can view all rides"
ON public.rides
FOR SELECT
USING (is_admin(auth.uid()));

-- Allow admins to manage all rides
CREATE POLICY "Admins can update all rides"
ON public.rides
FOR UPDATE
USING (is_admin(auth.uid()));

-- Allow admins to delete rides
CREATE POLICY "Admins can delete rides"
ON public.rides
FOR DELETE
USING (is_admin(auth.uid()));