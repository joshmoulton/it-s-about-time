-- Ensure moulton.joshua@gmail.com admin access is working properly
-- Update admin record to ensure it's current and active
UPDATE public.admin_users 
SET 
  is_active = true,
  role = 'super_admin',
  user_type = 'supabase_admin',
  requires_2fa = true,
  updated_at = now()
WHERE email = 'moulton.joshua@gmail.com';

-- Also ensure the beehiiv subscriber record is premium
UPDATE public.beehiiv_subscribers 
SET 
  subscription_tier = 'premium',
  status = 'active',
  updated_at = now()
WHERE email = 'moulton.joshua@gmail.com';