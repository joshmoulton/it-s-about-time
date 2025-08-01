-- Restore admin access for moulton.joshua@gmail.com
INSERT INTO public.admin_users (
  email,
  role,
  is_active,
  user_type,
  requires_2fa,
  created_at,
  updated_at
) VALUES (
  'moulton.joshua@gmail.com',
  'super_admin',
  true,
  'supabase_admin',
  false,
  now(),
  now()
)
ON CONFLICT (email) DO UPDATE SET
  is_active = true,
  role = 'super_admin',
  user_type = 'supabase_admin',
  requires_2fa = false,
  updated_at = now();