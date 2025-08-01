
-- Find the subscriber ID for moulton.joshua@gmail.com
-- Then, insert it as an admin
WITH sub AS (
  SELECT id FROM beehiiv_subscribers WHERE email = 'moulton.joshua@gmail.com'
)
INSERT INTO admin_users (subscriber_id, role, is_active)
SELECT id, 'admin', TRUE FROM sub
WHERE NOT EXISTS (
  SELECT 1 FROM admin_users WHERE subscriber_id = (SELECT id FROM sub)
);
