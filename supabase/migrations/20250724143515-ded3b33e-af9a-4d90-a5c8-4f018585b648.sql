-- Add drewfromweb3@gmail.com to whop_authenticated_users with all required fields
INSERT INTO public.whop_authenticated_users (
  user_email,
  whop_user_id,
  whop_purchase_id,
  subscription_tier,
  access_granted_at,
  created_at,
  updated_at
) VALUES (
  'drewfromweb3@gmail.com',
  'admin_test_user_001',
  'admin_test_purchase_001', 
  'premium',
  NOW(),
  NOW(),
  NOW()
) ON CONFLICT (user_email) 
DO UPDATE SET 
  subscription_tier = 'premium',
  whop_user_id = 'admin_test_user_001',
  whop_purchase_id = 'admin_test_purchase_001',
  access_granted_at = NOW(),
  updated_at = NOW();