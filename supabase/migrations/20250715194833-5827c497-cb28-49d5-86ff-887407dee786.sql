-- Add cryptofoxy6969@gmail.com as beehiiv subscriber if not exists
INSERT INTO public.beehiiv_subscribers (
  email,
  status,
  subscription_tier,
  created_at,
  updated_at
) VALUES (
  'cryptofoxy6969@gmail.com',
  'active',
  'premium',
  now(),
  now()
) ON CONFLICT (email) DO UPDATE SET
  status = 'active',
  subscription_tier = 'premium',
  updated_at = now();

-- Add cryptofoxy6969@gmail.com as admin user with analyst role
INSERT INTO public.admin_users (
  email,
  role,
  user_type,
  is_active,
  permissions,
  created_at,
  updated_at
) VALUES (
  'cryptofoxy6969@gmail.com',
  'analyst',
  'beehiiv_admin',
  true,
  '["signals_manage", "signals_create", "signals_view"]'::jsonb,
  now(),
  now()
) ON CONFLICT (email) DO UPDATE SET
  role = 'analyst',
  user_type = 'beehiiv_admin',
  is_active = true,
  permissions = '["signals_manage", "signals_create", "signals_view"]'::jsonb,
  updated_at = now();