-- Add user to whop_authenticated_users table for admin access
INSERT INTO whop_authenticated_users (user_email, subscription_tier, whop_user_id, whop_purchase_id, access_granted_at, created_at, updated_at)
VALUES ('moulton.joshua@gmail.com', 'premium', 'admin_user_001', 'admin_purchase_001', now(), now(), now())
ON CONFLICT (user_email) DO UPDATE SET
  subscription_tier = 'premium',
  access_granted_at = now(),
  updated_at = now();