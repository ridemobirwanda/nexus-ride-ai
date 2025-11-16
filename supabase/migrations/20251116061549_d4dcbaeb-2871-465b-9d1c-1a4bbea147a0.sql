-- Create system_settings table for persisting application configuration
CREATE TABLE IF NOT EXISTS public.system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'general',
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- RLS policies for system_settings
CREATE POLICY "Super admins can manage system settings"
  ON public.system_settings
  FOR ALL
  USING (get_user_role(auth.uid()) = 'super_admin');

CREATE POLICY "Admins can view system settings"
  ON public.system_settings
  FOR SELECT
  USING (is_admin(auth.uid()));

-- Create trigger for updated_at
CREATE TRIGGER update_system_settings_updated_at
  BEFORE UPDATE ON public.system_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default system settings
INSERT INTO public.system_settings (key, value, description, category) VALUES
  ('maintenance_mode', 'false'::jsonb, 'Enable maintenance mode', 'general'),
  ('allow_new_registrations', 'true'::jsonb, 'Allow new user registrations', 'general'),
  ('max_ride_distance', '50'::jsonb, 'Maximum ride distance in km', 'general'),
  ('default_ride_fee', '2.5'::jsonb, 'Default base ride fee', 'general'),
  ('app_version', '"1.0.0"'::jsonb, 'Current app version', 'general'),
  ('support_email', '"support@rideshare.com"'::jsonb, 'Support email address', 'general'),
  ('emergency_contact', '"+1-800-911-HELP"'::jsonb, 'Emergency contact number', 'general'),
  ('push_notifications', 'true'::jsonb, 'Enable push notifications', 'notifications'),
  ('email_notifications', 'true'::jsonb, 'Enable email notifications', 'notifications'),
  ('sms_notifications', 'true'::jsonb, 'Enable SMS notifications', 'notifications'),
  ('geo_fencing', 'true'::jsonb, 'Enable geo-fencing', 'security'),
  ('two_factor_auth', 'false'::jsonb, 'Require 2FA for admins', 'security'),
  ('auto_dispatch', 'true'::jsonb, 'Enable automatic ride dispatch', 'system'),
  ('auto_dispatch_timeout', '30'::jsonb, 'Auto dispatch timeout in seconds', 'system'),
  ('driver_matching_radius', '10'::jsonb, 'Maximum driver search radius in km', 'system'),
  ('min_driver_rating', '3.5'::jsonb, 'Minimum driver rating for matching', 'system')
ON CONFLICT (key) DO NOTHING;

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_system_settings_category ON public.system_settings(category);
CREATE INDEX IF NOT EXISTS idx_system_settings_key ON public.system_settings(key);