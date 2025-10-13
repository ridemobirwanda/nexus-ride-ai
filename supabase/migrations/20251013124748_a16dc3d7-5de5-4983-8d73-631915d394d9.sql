-- Create admin user function that can be called
CREATE OR REPLACE FUNCTION create_admin_user(
  p_email TEXT,
  p_password TEXT,
  p_name TEXT DEFAULT 'Admin User'
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- This function helps document the process
  -- Actual user creation must be done through Supabase Auth dashboard or API
  
  RETURN 'To create an admin user:
1. Go to Supabase Dashboard > Authentication > Users
2. Click "Add User" and create user with email: ' || p_email || '
3. After user is created, run this SQL with their user_id:

INSERT INTO public.user_roles (user_id, role)
VALUES (''[USER_ID_HERE]'', ''super_admin'');

INSERT INTO public.admin_profiles (user_id, email, name, is_active)
VALUES (''[USER_ID_HERE]'', ''' || p_email || ''', ''' || p_name || ''', true);
';
END;
$$;

-- For testing: Create a function to promote existing user to admin
CREATE OR REPLACE FUNCTION promote_user_to_admin(p_user_email TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_existing_role TEXT;
BEGIN
  -- Get user_id from auth.users (need service role for this)
  -- For now, manual process:
  
  RETURN 'To promote user ' || p_user_email || ' to admin:
1. Get their user_id from Supabase Dashboard > Authentication > Users
2. Run: 
   INSERT INTO user_roles (user_id, role) VALUES (''[user_id]'', ''super_admin'') 
   ON CONFLICT (user_id) DO UPDATE SET role = ''super_admin'';
   
   INSERT INTO admin_profiles (user_id, email, name) 
   VALUES (''[user_id]'', ''' || p_user_email || ''', ''Admin'');
';
END;
$$;