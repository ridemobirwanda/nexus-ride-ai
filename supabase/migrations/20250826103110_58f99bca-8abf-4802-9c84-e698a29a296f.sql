-- Admin Panel Database Migration
-- Create admin roles and permissions system
CREATE TYPE public.user_role AS ENUM ('super_admin', 'admin', 'support', 'driver', 'passenger');

-- User roles table
CREATE TABLE public.user_roles (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role user_role NOT NULL DEFAULT 'passenger',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(user_id)
);

-- Admin profiles table
CREATE TABLE public.admin_profiles (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    department TEXT,
    permissions JSONB DEFAULT '[]'::jsonb,
    is_active BOOLEAN DEFAULT true,
    last_login_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(user_id)
);

-- Promo codes table
CREATE TABLE public.promo_codes (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    description TEXT,
    discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
    discount_value NUMERIC NOT NULL,
    min_ride_amount NUMERIC DEFAULT 0,
    max_discount NUMERIC,
    usage_limit INTEGER,
    usage_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    valid_from TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    valid_until TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Support tickets table
CREATE TABLE public.support_tickets (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    ticket_number TEXT NOT NULL UNIQUE,
    user_id UUID REFERENCES auth.users(id),
    user_type TEXT CHECK (user_type IN ('driver', 'passenger')),
    subject TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('payment', 'ride_issue', 'app_bug', 'account', 'other')),
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
    assigned_to UUID REFERENCES auth.users(id),
    ride_id UUID REFERENCES public.rides(id),
    attachments JSONB DEFAULT '[]'::jsonb,
    resolution_notes TEXT,
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Support ticket messages table
CREATE TABLE public.support_ticket_messages (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    ticket_id UUID NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES auth.users(id),
    sender_type TEXT NOT NULL CHECK (sender_type IN ('admin', 'user')),
    message TEXT NOT NULL,
    attachments JSONB DEFAULT '[]'::jsonb,
    is_internal BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Driver verification requests table
CREATE TABLE public.driver_verification_requests (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    driver_id UUID NOT NULL REFERENCES public.drivers(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'resubmitted')),
    documents JSONB NOT NULL DEFAULT '[]'::jsonb,
    rejection_reason TEXT,
    reviewed_by UUID REFERENCES auth.users(id),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Surge pricing table
CREATE TABLE public.surge_pricing (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    area_name TEXT NOT NULL,
    area_boundaries JSONB NOT NULL, -- GeoJSON polygon
    multiplier NUMERIC NOT NULL DEFAULT 1.0,
    is_active BOOLEAN DEFAULT false,
    start_time TIMESTAMP WITH TIME ZONE,
    end_time TIMESTAMP WITH TIME ZONE,
    reason TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- System notifications table
CREATE TABLE public.system_notifications (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('info', 'warning', 'critical', 'maintenance')),
    target_audience TEXT NOT NULL CHECK (target_audience IN ('all', 'drivers', 'passengers', 'admins')),
    is_active BOOLEAN DEFAULT true,
    show_from TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    show_until TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_ticket_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_verification_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.surge_pricing ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_notifications ENABLE ROW LEVEL SECURITY;

-- Security definer function to check user role
CREATE OR REPLACE FUNCTION public.get_user_role(user_id UUID)
RETURNS user_role
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT role FROM public.user_roles WHERE user_roles.user_id = get_user_role.user_id;
$$;

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_roles.user_id = is_admin.user_id 
    AND role IN ('super_admin', 'admin', 'support')
  );
$$;

-- RLS Policies

-- User roles policies
CREATE POLICY "Users can view their own role" ON public.user_roles
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all roles" ON public.user_roles
FOR ALL USING (public.is_admin(auth.uid()));

-- Admin profiles policies
CREATE POLICY "Admins can view admin profiles" ON public.admin_profiles
FOR SELECT USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update their own profile" ON public.admin_profiles
FOR UPDATE USING (user_id = auth.uid() AND public.is_admin(auth.uid()));

CREATE POLICY "Super admins can manage all admin profiles" ON public.admin_profiles
FOR ALL USING (public.get_user_role(auth.uid()) = 'super_admin');

-- Promo codes policies
CREATE POLICY "Anyone can view active promo codes" ON public.promo_codes
FOR SELECT USING (is_active = true AND valid_until > now());

CREATE POLICY "Admins can manage promo codes" ON public.promo_codes
FOR ALL USING (public.is_admin(auth.uid()));

-- Support tickets policies
CREATE POLICY "Users can view their own tickets" ON public.support_tickets
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create their own tickets" ON public.support_tickets
FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can manage all tickets" ON public.support_tickets
FOR ALL USING (public.is_admin(auth.uid()));

-- Support ticket messages policies
CREATE POLICY "Ticket participants can view messages" ON public.support_ticket_messages
FOR SELECT USING (
  ticket_id IN (
    SELECT id FROM public.support_tickets 
    WHERE user_id = auth.uid() OR public.is_admin(auth.uid())
  )
);

CREATE POLICY "Users and admins can send messages" ON public.support_ticket_messages
FOR INSERT WITH CHECK (sender_id = auth.uid());

-- Driver verification policies
CREATE POLICY "Drivers can view their own verification" ON public.driver_verification_requests
FOR SELECT USING (
  driver_id IN (SELECT id FROM public.drivers WHERE user_id = auth.uid())
);

CREATE POLICY "Drivers can submit verification" ON public.driver_verification_requests
FOR INSERT WITH CHECK (
  driver_id IN (SELECT id FROM public.drivers WHERE user_id = auth.uid())
);

CREATE POLICY "Admins can manage verifications" ON public.driver_verification_requests
FOR ALL USING (public.is_admin(auth.uid()));

-- Surge pricing policies
CREATE POLICY "Anyone can view active surge pricing" ON public.surge_pricing
FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage surge pricing" ON public.surge_pricing
FOR ALL USING (public.is_admin(auth.uid()));

-- System notifications policies
CREATE POLICY "Users can view relevant notifications" ON public.system_notifications
FOR SELECT USING (
  is_active = true 
  AND show_from <= now() 
  AND (show_until IS NULL OR show_until > now())
  AND (
    target_audience = 'all' 
    OR (target_audience = 'drivers' AND EXISTS(SELECT 1 FROM public.drivers WHERE user_id = auth.uid()))
    OR (target_audience = 'passengers' AND EXISTS(SELECT 1 FROM public.passengers WHERE user_id = auth.uid()))
    OR (target_audience = 'admins' AND public.is_admin(auth.uid()))
  )
);

CREATE POLICY "Admins can manage notifications" ON public.system_notifications
FOR ALL USING (public.is_admin(auth.uid()));

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_roles_updated_at
  BEFORE UPDATE ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_admin_profiles_updated_at
  BEFORE UPDATE ON public.admin_profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_promo_codes_updated_at
  BEFORE UPDATE ON public.promo_codes
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_support_tickets_updated_at
  BEFORE UPDATE ON public.support_tickets
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_surge_pricing_updated_at
  BEFORE UPDATE ON public.surge_pricing
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Generate ticket numbers
CREATE OR REPLACE FUNCTION public.generate_ticket_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.ticket_number = 'TK-' || TO_CHAR(now(), 'YYYYMMDD') || '-' || LPAD(nextval('ticket_number_seq')::text, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE SEQUENCE IF NOT EXISTS ticket_number_seq;

CREATE TRIGGER generate_support_ticket_number
  BEFORE INSERT ON public.support_tickets
  FOR EACH ROW EXECUTE FUNCTION public.generate_ticket_number();

-- Insert default super admin role for first user (will need to be manually assigned)
-- This is commented out for security - should be done manually
-- INSERT INTO public.user_roles (user_id, role) 
-- SELECT id, 'super_admin' FROM auth.users LIMIT 1;