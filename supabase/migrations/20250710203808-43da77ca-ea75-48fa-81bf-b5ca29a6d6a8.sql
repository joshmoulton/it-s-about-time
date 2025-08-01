-- Update your user in whop_authenticated_users to ensure proper admin access
INSERT INTO public.whop_authenticated_users (user_email, subscription_tier, access_granted_at, last_verified_at)
VALUES ('moulton.joshua@gmail.com', 'premium', now(), now())
ON CONFLICT (user_email) DO UPDATE SET
    subscription_tier = EXCLUDED.subscription_tier,
    access_granted_at = COALESCE(whop_authenticated_users.access_granted_at, now()),
    last_verified_at = now(),
    updated_at = now();