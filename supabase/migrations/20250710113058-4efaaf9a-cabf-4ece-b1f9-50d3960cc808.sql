-- Add user to whop_authenticated_users table for admin access
INSERT INTO whop_authenticated_users (user_email, subscription_tier, user_id, is_active, created_at, updated_at)
VALUES ('moulton.joshua@gmail.com', 'premium', gen_random_uuid(), true, now(), now())
ON CONFLICT (user_email) DO UPDATE SET
  subscription_tier = 'premium',
  is_active = true,
  updated_at = now();