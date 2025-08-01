-- First, let's restore admin access for moulton.joshua@gmail.com
INSERT INTO public.admin_users (
  email,
  role,
  is_active,
  user_type,
  created_at,
  updated_at
) VALUES (
  'moulton.joshua@gmail.com',
  'admin',
  true,
  'whop',
  now(),
  now()
)
ON CONFLICT (email) DO UPDATE SET
  is_active = true,
  role = 'admin',
  user_type = 'whop',
  updated_at = now();

-- Let's also check if the crypto_alerts table has data and is properly configured
-- Add replica identity for realtime updates
ALTER TABLE public.crypto_alerts REPLICA IDENTITY FULL;