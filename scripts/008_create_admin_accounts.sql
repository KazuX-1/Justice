-- Create admin accounts directly in database
-- Replace the values below with actual admin details

INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  role
) VALUES (
  gen_random_uuid(),
  'admin@justiceexists.id',
  crypt('admin123', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{}',
  false,
  'authenticated'
);

-- Get the user ID for the profiles table
WITH admin_user AS (
  SELECT id FROM auth.users WHERE email = 'admin@justiceexists.id'
)
INSERT INTO public.profiles (
  id,
  username,
  kota,
  provinsi,
  umur,
  points,
  created_at,
  updated_at
) 
SELECT 
  admin_user.id,
  'admin_system',
  'Jakarta',
  'DKI Jakarta',
  30,
  1000,
  now(),
  now()
FROM admin_user;

-- Add more admin accounts as needed
-- Just change the email and username values
