-- Add the user to whop_authenticated_users with premium tier using correct columns
INSERT INTO public.whop_authenticated_users (
  user_email,
  subscription_tier,
  access_granted_at,
  created_at,
  updated_at
) VALUES (
  'drewfromweb3@gmail.com',
  'premium',
  NOW(),
  NOW(),
  NOW()
) ON CONFLICT (user_email) 
DO UPDATE SET 
  subscription_tier = 'premium',
  access_granted_at = NOW(),
  updated_at = NOW();