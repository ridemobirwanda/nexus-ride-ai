-- Automatically set up admin access for admin@admin.com user
DO $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Get the user_id for admin@admin.com
  SELECT id INTO v_user_id 
  FROM auth.users 
  WHERE email = 'admin@admin.com' 
  LIMIT 1;
  
  -- If user exists, set up admin access
  IF v_user_id IS NOT NULL THEN
    -- Add super_admin role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (v_user_id, 'super_admin')
    ON CONFLICT (user_id) DO UPDATE SET role = 'super_admin';
    
    -- Add to admin_profiles
    INSERT INTO public.admin_profiles (user_id, email, name, is_active)
    VALUES (v_user_id, 'admin@admin.com', 'Super Admin', true)
    ON CONFLICT (user_id) DO UPDATE SET is_active = true;
    
    RAISE NOTICE 'Admin access configured for user: %', v_user_id;
  ELSE
    RAISE NOTICE 'No user found with email admin@admin.com. Please create the user first in Authentication > Users';
  END IF;
END $$;