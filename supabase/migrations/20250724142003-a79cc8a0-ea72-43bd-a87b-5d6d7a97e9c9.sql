-- Create a user session or subscription record for the admin user drewfromweb3@gmail.com
-- Since this user is an admin with premium_user role, they should get premium access

-- First, let's ensure they have a record in whop_authenticated_users with premium tier
INSERT INTO public.whop_authenticated_users (
  user_email,
  subscription_tier,
  user_type,
  access_granted_at,
  created_at,
  updated_at
) VALUES (
  'drewfromweb3@gmail.com',
  'premium',
  'admin_test_user',
  NOW(),
  NOW(),
  NOW()
) ON CONFLICT (user_email) 
DO UPDATE SET 
  subscription_tier = 'premium',
  user_type = 'admin_test_user',
  access_granted_at = NOW(),
  updated_at = NOW();