-- Restore admin access for pidgeon@avium.trade
INSERT INTO public.admin_users (
  email,
  role,
  user_type,
  is_active,
  created_at,
  updated_at
) VALUES (
  'pidgeon@avium.trade',
  'admin',
  'supabase_admin',
  true,
  now(),
  now()
)
ON CONFLICT (email) DO UPDATE SET
  is_active = true,
  role = 'admin',
  user_type = 'supabase_admin',
  updated_at = now();