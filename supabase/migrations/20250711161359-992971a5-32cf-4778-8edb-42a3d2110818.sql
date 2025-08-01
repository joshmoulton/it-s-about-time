-- Comprehensive RLS Security Cleanup Migration
-- This migration consolidates policies, eliminates conflicts, and standardizes function usage

-- =====================================================
-- STEP 1: DROP ALL EXISTING POLICIES TO START CLEAN
-- =====================================================

-- Drop policies on high-priority user data tables
DROP POLICY IF EXISTS "Fast admin users read" ON public.admin_users;
DROP POLICY IF EXISTS "Fast admin users write" ON public.admin_users;
DROP POLICY IF EXISTS "Admin users can manage admin users" ON public.admin_users;
DROP POLICY IF EXISTS "Admin users can view admin users" ON public.admin_users;

DROP POLICY IF EXISTS "Fast subscribers admin read" ON public.beehiiv_subscribers;
DROP POLICY IF EXISTS "Fast subscribers admin write" ON public.beehiiv_subscribers;
DROP POLICY IF EXISTS "Subscribers can view their own data" ON public.beehiiv_subscribers;
DROP POLICY IF EXISTS "Admin users can manage subscribers" ON public.beehiiv_subscribers;

DROP POLICY IF EXISTS "Fast audit log read" ON public.admin_audit_log;
DROP POLICY IF EXISTS "System can insert audit logs" ON public.admin_audit_log;
DROP POLICY IF EXISTS "Admin audit log read" ON public.admin_audit_log;

-- Drop policies on authentication and security tables
DROP POLICY IF EXISTS "2FA secrets access policy" ON public.admin_2fa_secrets;
DROP POLICY IF EXISTS "Admins can insert their own 2FA secrets" ON public.admin_2fa_secrets;
DROP POLICY IF EXISTS "Admins can update their own 2FA secrets" ON public.admin_2fa_secrets;

DROP POLICY IF EXISTS "Admins can manage their own devices" ON public.admin_device_auth;
DROP POLICY IF EXISTS "Admins can view their own devices" ON public.admin_device_auth;
DROP POLICY IF EXISTS "Super admins can manage all devices" ON public.admin_device_auth;

-- Drop policies on content tables
DROP POLICY IF EXISTS "Admin users can manage articles" ON public.articles;
DROP POLICY IF EXISTS "Anyone can view published articles" ON public.articles;

DROP POLICY IF EXISTS "Admins can manage courses" ON public.courses;
DROP POLICY IF EXISTS "Users can view published courses" ON public.courses;

DROP POLICY IF EXISTS "Video tutorials management" ON public.video_tutorials;
DROP POLICY IF EXISTS "Video tutorials read" ON public.video_tutorials;

-- Drop policies on user interaction tables
DROP POLICY IF EXISTS "Highlight comments insert" ON public.highlight_comments;
DROP POLICY IF EXISTS "Highlight comments read" ON public.highlight_comments;
DROP POLICY IF EXISTS "Highlight comments update" ON public.highlight_comments;

DROP POLICY IF EXISTS "Users can manage their own votes" ON public.comment_votes;
DROP POLICY IF EXISTS "Users can view all votes" ON public.comment_votes;

DROP POLICY IF EXISTS "Feedback admin access" ON public.feedback;
DROP POLICY IF EXISTS "Feedback create" ON public.feedback;
DROP POLICY IF EXISTS "Feedback user read" ON public.feedback;

-- Drop policies on analyst and trading tables
DROP POLICY IF EXISTS "Admin users can manage analyst signals" ON public.analyst_signals;
DROP POLICY IF EXISTS "Users can view active analyst signals" ON public.analyst_signals;

DROP POLICY IF EXISTS "Users can view their own analyst subscriptions" ON public.analyst_degen_subscriptions;
DROP POLICY IF EXISTS "Users can insert their own analyst subscriptions" ON public.analyst_degen_subscriptions;
DROP POLICY IF EXISTS "Users can update their own analyst subscriptions" ON public.analyst_degen_subscriptions;
DROP POLICY IF EXISTS "Users can delete their own analyst subscriptions" ON public.analyst_degen_subscriptions;
DROP POLICY IF EXISTS "Admins can view all analyst subscriptions" ON public.analyst_degen_subscriptions;

-- Drop policies on system and monitoring tables
DROP POLICY IF EXISTS "Fast system settings read" ON public.system_settings;
DROP POLICY IF EXISTS "Fast system settings write" ON public.system_settings;

DROP POLICY IF EXISTS "Notification templates management" ON public.notification_templates;
DROP POLICY IF EXISTS "Notification templates read" ON public.notification_templates;

DROP POLICY IF EXISTS "Auth audit log admin access" ON public.authentication_audit_log;

-- =====================================================
-- STEP 2: CREATE CONSOLIDATED, SECURE POLICIES
-- =====================================================

-- ADMIN_USERS: Admin-only access with optimized functions
CREATE POLICY "admin_users_admin_access" ON public.admin_users
FOR ALL USING (is_current_user_admin_fast())
WITH CHECK (is_current_user_admin_fast());

-- BEEHIIV_SUBSCRIBERS: Admin access + users can view/update their own data
CREATE POLICY "subscribers_admin_access" ON public.beehiiv_subscribers
FOR ALL USING (is_current_user_admin_fast())
WITH CHECK (is_current_user_admin_fast());

CREATE POLICY "subscribers_user_access" ON public.beehiiv_subscribers
FOR SELECT USING (email = get_current_user_email_optimized());

CREATE POLICY "subscribers_user_update" ON public.beehiiv_subscribers
FOR UPDATE USING (email = get_current_user_email_optimized())
WITH CHECK (email = get_current_user_email_optimized());

-- ADMIN_AUDIT_LOG: Admin read + system insert
CREATE POLICY "audit_log_admin_read" ON public.admin_audit_log
FOR SELECT USING (is_current_user_admin_fast());

CREATE POLICY "audit_log_system_insert" ON public.admin_audit_log
FOR INSERT WITH CHECK (true);

-- ADMIN_2FA_SECRETS: Admin self-management
CREATE POLICY "2fa_secrets_self_manage" ON public.admin_2fa_secrets
FOR ALL USING (admin_email = get_current_user_email_optimized())
WITH CHECK (admin_email = get_current_user_email_optimized());

-- ADMIN_DEVICE_AUTH: Admin self-management + super admin oversight
CREATE POLICY "device_auth_self_manage" ON public.admin_device_auth
FOR ALL USING (admin_email = get_current_user_email_optimized())
WITH CHECK (admin_email = get_current_user_email_optimized());

CREATE POLICY "device_auth_super_admin" ON public.admin_device_auth
FOR ALL USING (has_admin_role('super_admin'))
WITH CHECK (has_admin_role('super_admin'));

-- ARTICLES: Admin management + tier-based public read
CREATE POLICY "articles_admin_manage" ON public.articles
FOR ALL USING (is_current_user_admin_fast())
WITH CHECK (is_current_user_admin_fast());

CREATE POLICY "articles_public_read" ON public.articles
FOR SELECT USING (status = 'published');

-- COURSES: Admin management + tier-based access
CREATE POLICY "courses_admin_manage" ON public.courses
FOR ALL USING (is_current_user_admin_fast())
WITH CHECK (is_current_user_admin_fast());

CREATE POLICY "courses_tier_access" ON public.courses
FOR SELECT USING (
  status = 'published' AND (
    required_tier = 'free' OR
    (required_tier = 'paid' AND get_current_user_tier() IN ('paid', 'premium')) OR
    (required_tier = 'premium' AND get_current_user_tier() = 'premium')
  )
);

-- VIDEO_TUTORIALS: Admin management + tier-based access
CREATE POLICY "video_tutorials_admin_manage" ON public.video_tutorials
FOR ALL USING (is_current_user_admin_fast())
WITH CHECK (is_current_user_admin_fast());

CREATE POLICY "video_tutorials_tier_access" ON public.video_tutorials
FOR SELECT USING (
  status = 'published' AND (
    required_tier = 'free' OR
    (required_tier = 'paid' AND get_current_user_tier() IN ('paid', 'premium')) OR
    (required_tier = 'premium' AND get_current_user_tier() = 'premium')
  )
);

-- HIGHLIGHT_COMMENTS: User-owned with public read
CREATE POLICY "comments_user_manage" ON public.highlight_comments
FOR ALL USING (user_email = get_current_user_email_optimized())
WITH CHECK (user_email = get_current_user_email_optimized());

CREATE POLICY "comments_public_read" ON public.highlight_comments
FOR SELECT USING (is_deleted = false);

-- COMMENT_VOTES: User-owned with public read
CREATE POLICY "votes_user_manage" ON public.comment_votes
FOR ALL USING (user_email = get_current_user_email_optimized())
WITH CHECK (user_email = get_current_user_email_optimized());

CREATE POLICY "votes_public_read" ON public.comment_votes
FOR SELECT USING (true);

-- FEEDBACK: Admin management + user self-access
CREATE POLICY "feedback_admin_manage" ON public.feedback
FOR ALL USING (is_current_user_admin_fast())
WITH CHECK (is_current_user_admin_fast());

CREATE POLICY "feedback_user_access" ON public.feedback
FOR SELECT USING (user_email = get_current_user_email_optimized());

CREATE POLICY "feedback_user_create" ON public.feedback
FOR INSERT WITH CHECK (
  user_email IS NOT NULL AND
  user_email = COALESCE(get_current_user_email_optimized(), user_email) AND
  char_length(title) <= 200 AND
  char_length(description) <= 2000
);

-- ANALYST_SIGNALS: Admin management + public read for active
CREATE POLICY "signals_admin_manage" ON public.analyst_signals
FOR ALL USING (is_current_user_admin_fast())
WITH CHECK (is_current_user_admin_fast());

CREATE POLICY "signals_public_read" ON public.analyst_signals
FOR SELECT USING (status = 'active');

-- ANALYST_DEGEN_SUBSCRIPTIONS: User-owned + admin oversight
CREATE POLICY "degen_subs_user_manage" ON public.analyst_degen_subscriptions
FOR ALL USING (user_email = get_current_user_email_optimized())
WITH CHECK (user_email = get_current_user_email_optimized());

CREATE POLICY "degen_subs_admin_read" ON public.analyst_degen_subscriptions
FOR SELECT USING (is_current_user_admin_fast());

-- SYSTEM_SETTINGS: Admin management + public read
CREATE POLICY "settings_admin_manage" ON public.system_settings
FOR ALL USING (is_current_user_admin_fast())
WITH CHECK (is_current_user_admin_fast());

CREATE POLICY "settings_public_read" ON public.system_settings
FOR SELECT USING (true);

-- NOTIFICATION_TEMPLATES: Admin management + public read for active
CREATE POLICY "templates_admin_manage" ON public.notification_templates
FOR ALL USING (is_current_user_admin_fast())
WITH CHECK (is_current_user_admin_fast());

CREATE POLICY "templates_public_read" ON public.notification_templates
FOR SELECT USING (is_active = true);

-- AUTHENTICATION_AUDIT_LOG: Admin read-only
CREATE POLICY "auth_audit_admin_read" ON public.authentication_audit_log
FOR SELECT USING (is_current_user_admin_fast());

-- =====================================================
-- STEP 3: CLEAN UP REMAINING TABLES WITH SIMPLE POLICIES
-- =====================================================

-- Tables with existing optimized policies - just ensure consistency
-- (These already use optimized functions, just consolidate if needed)

-- ANALYSTS: Simple admin + public read
DROP POLICY IF EXISTS "Admins can manage analysts" ON public.analysts;
DROP POLICY IF EXISTS "Anyone can view active analysts" ON public.analysts;

CREATE POLICY "analysts_admin_manage" ON public.analysts
FOR ALL USING (is_current_user_admin_fast())
WITH CHECK (is_current_user_admin_fast());

CREATE POLICY "analysts_public_read" ON public.analysts
FOR SELECT USING (is_active = true);

-- ENCRYPTED_USER_DATA: Super admin only
DROP POLICY IF EXISTS "Encrypted data super admin access" ON public.encrypted_user_data;

CREATE POLICY "encrypted_data_super_admin" ON public.encrypted_user_data
FOR ALL USING (has_admin_role('super_admin'))
WITH CHECK (has_admin_role('super_admin'));

-- SUBSCRIPTION_TIERS: Public read-only
DROP POLICY IF EXISTS "Anyone can view subscription tiers" ON public.subscription_tiers;

CREATE POLICY "subscription_tiers_public_read" ON public.subscription_tiers
FOR SELECT USING (true);

-- =====================================================
-- STEP 4: ENSURE ALL TABLES HAVE PROPER RLS ENABLED
-- =====================================================

-- Ensure RLS is enabled on all security-critical tables
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.beehiiv_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_2fa_secrets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_device_auth ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_tutorials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.highlight_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comment_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analyst_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analyst_degen_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.authentication_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analysts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.encrypted_user_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_tiers ENABLE ROW LEVEL SECURITY;