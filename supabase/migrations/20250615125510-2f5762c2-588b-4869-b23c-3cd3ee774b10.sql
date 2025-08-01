
-- First, let's see what subscribers exist and check the current admin users
SELECT bs.email, bs.subscription_tier, au.role, au.is_active 
FROM beehiiv_subscribers bs
LEFT JOIN admin_users au ON bs.id = au.subscriber_id
ORDER BY bs.email;

-- Add the current user as an admin if they exist in subscribers but not in admin_users
-- This will work for any email that exists in the beehiiv_subscribers table
INSERT INTO admin_users (subscriber_id, role, is_active)
SELECT bs.id, 'super_admin', TRUE 
FROM beehiiv_subscribers bs
LEFT JOIN admin_users au ON bs.id = au.subscriber_id
WHERE au.subscriber_id IS NULL
AND bs.email = (
  SELECT email FROM beehiiv_subscribers 
  ORDER BY created_at DESC 
  LIMIT 1
);

-- If you know your specific email, you can also run this (replace with your actual email):
-- INSERT INTO admin_users (subscriber_id, role, is_active)
-- SELECT bs.id, 'super_admin', TRUE 
-- FROM beehiiv_subscribers bs
-- WHERE bs.email = 'your-email@example.com'
-- AND NOT EXISTS (
--   SELECT 1 FROM admin_users WHERE subscriber_id = bs.id
-- );
