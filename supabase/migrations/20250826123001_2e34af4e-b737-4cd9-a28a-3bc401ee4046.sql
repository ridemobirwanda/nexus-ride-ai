-- Create the manual admin user
-- First, we need to insert into auth.users (this would normally be done through Supabase Auth)
-- Instead, we'll create a function to handle admin user creation

-- Create admin user in auth.users table (this is a simplified approach)
-- In production, you should use Supabase Auth API to create users

-- Create function to setup admin user
CREATE OR REPLACE FUNCTION setup_admin_user()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  admin_user_id UUID;
BEGIN
  -- Check if admin user already exists
  SELECT id INTO admin_user_id 
  FROM auth.users 
  WHERE email = 'admin@admin.com';
  
  -- If admin doesn't exist, we need to create it manually
  -- Note: In production, use Supabase dashboard or Auth API
  IF admin_user_id IS NULL THEN
    -- Generate a UUID for the admin user
    admin_user_id := gen_random_uuid();
    
    -- Insert basic user record (simplified - in production use Supabase Auth)
    -- This is just for reference - actual user creation should be done through Supabase Auth
    RAISE NOTICE 'Admin user should be created through Supabase Auth dashboard with email: admin@admin.com and password: admin123';
  END IF;
  
  -- Ensure admin role exists
  INSERT INTO public.user_roles (user_id, role)
  VALUES (admin_user_id, 'super_admin'::user_role)
  ON CONFLICT (user_id, role) DO NOTHING;
  
  -- Create admin profile
  INSERT INTO public.admin_profiles (
    user_id,
    name,
    email,
    department,
    permissions
  ) VALUES (
    admin_user_id,
    'System Administrator',
    'admin@admin.com',
    'IT Administration',
    '["full_access", "user_management", "system_config", "analytics", "support"]'::jsonb
  ) ON CONFLICT (user_id) DO NOTHING;
  
END;
$$;

-- Function to reset admin password (generates reset instructions)
CREATE OR REPLACE FUNCTION request_admin_password_reset(admin_email TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- In production, this would integrate with Supabase Auth
  -- For now, return instructions
  IF admin_email = 'admin@admin.com' THEN
    RETURN 'Password reset requested for admin user. Use Supabase Auth dashboard to reset password or contact system administrator.';
  ELSE
    RETURN 'Admin user not found.';
  END IF;
END;
$$;

-- Create activity tracking table
CREATE TABLE IF NOT EXISTS public.user_activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  user_type TEXT NOT NULL, -- 'passenger', 'driver', 'admin'
  activity_type TEXT NOT NULL, -- 'login', 'logout', 'ride_request', 'ride_complete', etc.
  activity_details JSONB DEFAULT '{}'::jsonb,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on activity logs
ALTER TABLE public.user_activity_logs ENABLE ROW LEVEL SECURITY;

-- Policy for admins to view all activity logs
CREATE POLICY "Admins can view all activity logs"
ON public.user_activity_logs
FOR SELECT
TO authenticated
USING (is_admin(auth.uid()));

-- Policy for system to insert activity logs
CREATE POLICY "System can insert activity logs"
ON public.user_activity_logs
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Create function to log user activity
CREATE OR REPLACE FUNCTION log_user_activity(
  p_user_id UUID,
  p_user_type TEXT,
  p_activity_type TEXT,
  p_activity_details JSONB DEFAULT '{}'::jsonb,
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  activity_id UUID;
BEGIN
  INSERT INTO public.user_activity_logs (
    user_id,
    user_type,
    activity_type,
    activity_details,
    ip_address,
    user_agent
  ) VALUES (
    p_user_id,
    p_user_type,
    p_activity_type,
    p_activity_details,
    p_ip_address,
    p_user_agent
  ) RETURNING id INTO activity_id;
  
  RETURN activity_id;
END;
$$;

-- Create dashboard analytics functions
CREATE OR REPLACE FUNCTION get_admin_dashboard_stats()
RETURNS TABLE(
  total_users INTEGER,
  total_passengers INTEGER,
  total_drivers INTEGER,
  active_drivers INTEGER,
  total_rides INTEGER,
  completed_rides INTEGER,
  pending_rides INTEGER,
  total_revenue NUMERIC,
  today_rides INTEGER,
  today_revenue NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    -- Total users (passengers + drivers)
    (SELECT COUNT(*)::INTEGER FROM public.passengers) + (SELECT COUNT(*)::INTEGER FROM public.drivers) as total_users,
    
    -- Passenger stats
    (SELECT COUNT(*)::INTEGER FROM public.passengers) as total_passengers,
    
    -- Driver stats  
    (SELECT COUNT(*)::INTEGER FROM public.drivers) as total_drivers,
    (SELECT COUNT(*)::INTEGER FROM public.drivers WHERE status = 'available') as active_drivers,
    
    -- Ride stats
    (SELECT COUNT(*)::INTEGER FROM public.rides) as total_rides,
    (SELECT COUNT(*)::INTEGER FROM public.rides WHERE status = 'completed') as completed_rides,
    (SELECT COUNT(*)::INTEGER FROM public.rides WHERE status = 'pending') as pending_rides,
    
    -- Revenue stats
    COALESCE((SELECT SUM(final_fare) FROM public.rides WHERE status = 'completed'), 0) as total_revenue,
    
    -- Today's stats
    (SELECT COUNT(*)::INTEGER FROM public.rides WHERE DATE(created_at) = CURRENT_DATE) as today_rides,
    COALESCE((SELECT SUM(final_fare) FROM public.rides WHERE status = 'completed' AND DATE(created_at) = CURRENT_DATE), 0) as today_revenue;
END;
$$;