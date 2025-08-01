-- Temporarily disable 2FA requirement for moulton.joshua@gmail.com to restore admin access
-- This will allow immediate admin access while 2FA can be set up later

UPDATE admin_users 
SET requires_2fa = false,
    last_login_at = now()
WHERE email = 'moulton.joshua@gmail.com';

-- Also ensure the admin user is properly linked to beehiiv_subscribers if needed
INSERT INTO beehiiv_subscribers (email, status, subscription_tier, created_at, updated_at)
VALUES ('moulton.joshua@gmail.com', 'active', 'premium', now(), now())
ON CONFLICT (email) DO UPDATE SET
    status = 'active',
    subscription_tier = 'premium',
    updated_at = now();

-- Update the admin_users record to link to the subscriber
UPDATE admin_users 
SET subscriber_id = (SELECT id FROM beehiiv_subscribers WHERE email = 'moulton.joshua@gmail.com')
WHERE email = 'moulton.joshua@gmail.com' AND subscriber_id IS NULL;