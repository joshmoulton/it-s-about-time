-- Add drewfromweb3@gmail.com to whop_authenticated_users with premium tier
-- Using dummy whop_user_id since this is a test admin account
INSERT INTO public.whop_authenticated_users (
  user_email,
  whop_user_id,
  subscription_tier,
  access_granted_at,
  created_at,
  updated_at
) VALUES (
  'drewfromweb3@gmail.com',
  'admin_test_user_001',
  'premium',
  NOW(),
  NOW(),
  NOW()
) ON CONFLICT (user_email) 
DO UPDATE SET 
  subscription_tier = 'premium',
  access_granted_at = NOW(),
  updated_at = NOW();