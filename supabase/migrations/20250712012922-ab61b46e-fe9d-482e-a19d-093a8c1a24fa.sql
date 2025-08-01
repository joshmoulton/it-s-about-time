-- Phase 1 & 2: Data Cleanup - Remove inactive Beehiiv subscribers and unused user data

-- Step 1: Keep only active admin users and users with actual activity
-- Delete inactive beehiiv subscribers (users who never logged in and have no activity)
DELETE FROM public.beehiiv_subscribers 
WHERE id NOT IN (
    -- Keep users who are admins
    SELECT DISTINCT bs.id FROM public.beehiiv_subscribers bs
    INNER JOIN public.admin_users au ON au.subscriber_id = bs.id
    UNION
    -- Keep users who have sent messages
    SELECT DISTINCT bs.id FROM public.beehiiv_subscribers bs
    INNER JOIN public.sent_messages sm ON sm.sender_user_id = bs.id
    UNION
    -- Keep users with trading profiles
    SELECT DISTINCT utp.user_id FROM public.user_trading_profiles utp
    WHERE EXISTS (SELECT 1 FROM public.beehiiv_subscribers bs WHERE bs.id = utp.user_id)
    UNION
    -- Keep users with telegram mappings
    SELECT DISTINCT tum.dashboard_user_id FROM public.telegram_user_mapping tum
    WHERE EXISTS (SELECT 1 FROM public.beehiiv_subscribers bs WHERE bs.id = tum.dashboard_user_id)
    UNION
    -- Keep users who have logged in recently (last 30 days)
    SELECT DISTINCT bs.id FROM public.beehiiv_subscribers bs
    WHERE bs.last_login_at > NOW() - INTERVAL '30 days'
    UNION
    -- Keep users with whop authentication
    SELECT DISTINCT bs.id FROM public.beehiiv_subscribers bs
    WHERE EXISTS (
        SELECT 1 FROM public.whop_authenticated_users wau 
        WHERE wau.user_email = bs.email
    )
);

-- Step 2: Remove user_profiles table if it exists (storing duplicate user data)
DROP TABLE IF EXISTS public.user_profiles CASCADE;

-- Step 3: Remove user_trading_profiles table (questionnaire data stored locally instead)
DROP TABLE IF EXISTS public.user_trading_profiles CASCADE;

-- Step 4: Remove user_sessions table (use Whop/client-side sessions instead)
DROP TABLE IF EXISTS public.user_sessions CASCADE;

-- Step 5: Remove user_telegram_permissions table (manage via client-side)
DROP TABLE IF EXISTS public.user_telegram_permissions CASCADE;

-- Step 6: Remove user_roles table if it exists (use Whop roles instead)
DROP TABLE IF EXISTS public.user_roles CASCADE;

-- Step 7: Clean up role_permissions table (not needed without user_roles)
DROP TABLE IF EXISTS public.role_permissions CASCADE;

-- Step 8: Remove newsletter subscription tracking (use Beehiiv directly)
DROP TABLE IF EXISTS public.newsletter_subscriptions CASCADE;

-- Step 9: Remove degen call subscriptions (manage via Whop)
DELETE FROM public.degen_call_subscriptions 
WHERE user_email NOT IN (
    SELECT DISTINCT wau.user_email 
    FROM public.whop_authenticated_users wau
);

-- Step 10: Remove analyst degen subscriptions for non-Whop users
DELETE FROM public.analyst_degen_subscriptions 
WHERE user_email NOT IN (
    SELECT DISTINCT wau.user_email 
    FROM public.whop_authenticated_users wau
);

-- Step 11: Update beehiiv_subscribers to remove unnecessary PII
UPDATE public.beehiiv_subscribers 
SET 
    password_hash = NULL,
    password_reset_token = NULL,
    password_reset_expires_at = NULL,
    metadata = '{}',
    requires_password_setup = false,
    login_attempts = 0,
    locked_until = NULL
WHERE password_hash IS NOT NULL;

-- Step 12: Clean up content_analytics for privacy
DELETE FROM public.content_analytics 
WHERE created_at < NOW() - INTERVAL '90 days';

-- Step 13: Clean up authentication_audit_log (keep only recent)
DELETE FROM public.authentication_audit_log 
WHERE created_at < NOW() - INTERVAL '30 days';

-- Add indexes for better performance on remaining essential queries
CREATE INDEX IF NOT EXISTS idx_beehiiv_subscribers_active 
ON public.beehiiv_subscribers(email, subscription_tier) 
WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_whop_users_email 
ON public.whop_authenticated_users(user_email);

-- Update RLS policies to be more efficient
DROP POLICY IF EXISTS "subscribers_comprehensive_access" ON public.beehiiv_subscribers;
CREATE POLICY "subscribers_optimized_access" ON public.beehiiv_subscribers
FOR ALL USING (
    is_current_user_admin_fast() OR 
    (email = get_current_user_email_optimized() AND status = 'active')
);

-- Log the cleanup results
INSERT INTO public.admin_audit_log (action, resource, user_email, metadata)
VALUES (
    'data_cleanup', 
    'user_data_simplification', 
    'system',
    jsonb_build_object(
        'cleanup_phase', 'user_data_reduction',
        'timestamp', NOW(),
        'tables_dropped', ARRAY['user_profiles', 'user_trading_profiles', 'user_sessions', 'user_telegram_permissions', 'user_roles', 'role_permissions', 'newsletter_subscriptions'],
        'data_retention_policy', '30_days_auth_logs_90_days_analytics'
    )
);