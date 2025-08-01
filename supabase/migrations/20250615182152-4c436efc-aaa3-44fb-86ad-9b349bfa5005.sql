
-- First, let's add your email to the beehiiv_subscribers table if it doesn't exist
INSERT INTO beehiiv_subscribers (email, status, subscription_tier, beehiiv_subscriber_id)
SELECT 'moulton.joshua@gmail.com', 'active', 'premium', 'admin-user-001'
WHERE NOT EXISTS (
  SELECT 1 FROM beehiiv_subscribers WHERE email = 'moulton.joshua@gmail.com'
);

-- Now let's ensure you're in the admin_users table, linked to your subscriber record
INSERT INTO admin_users (subscriber_id, role, is_active)
SELECT bs.id, 'super_admin', TRUE 
FROM beehiiv_subscribers bs
WHERE bs.email = 'moulton.joshua@gmail.com'
AND NOT EXISTS (
  SELECT 1 FROM admin_users au WHERE au.subscriber_id = bs.id
);

-- Let's check what we have in our tables (fixed the type mismatch)
SELECT 'beehiiv_subscribers' as table_name, email, subscription_tier::text as tier_or_role, status 
FROM beehiiv_subscribers 
WHERE email = 'moulton.joshua@gmail.com'
UNION ALL
SELECT 'admin_users' as table_name, 
       bs.email, 
       au.role::text as tier_or_role, 
       au.is_active::text as status
FROM admin_users au
JOIN beehiiv_subscribers bs ON au.subscriber_id = bs.id
WHERE bs.email = 'moulton.joshua@gmail.com';
