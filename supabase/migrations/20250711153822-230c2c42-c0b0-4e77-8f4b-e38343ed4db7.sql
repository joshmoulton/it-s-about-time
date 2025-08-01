-- Fix remaining performance issues in Supabase

-- 1. Fix remaining RLS policies that still have Auth RLS warnings
-- Update policies to use our security definer functions

-- Fix whop_authenticated_users policies if they exist
DROP POLICY IF EXISTS "Users can view their whop data" ON public.whop_authenticated_users;
CREATE POLICY "Users can view their whop data" 
ON public.whop_authenticated_users 
FOR SELECT 
USING (user_email = get_jwt_email());

-- Fix user_telegram_permissions policies if they exist
DROP POLICY IF EXISTS "Users can view their telegram permissions" ON public.user_telegram_permissions;
CREATE POLICY "Users can view their telegram permissions" 
ON public.user_telegram_permissions 
FOR SELECT 
USING (user_id = get_beehiiv_subscriber_id());

-- Fix user_sessions policies if they exist
DROP POLICY IF EXISTS "Users can view their sessions" ON public.user_sessions;
CREATE POLICY "Users can view their sessions" 
ON public.user_sessions 
FOR SELECT 
USING (subscriber_id = get_beehiiv_subscriber_id());

-- Fix user_roles policies if they exist
DROP POLICY IF EXISTS "Users can view their roles" ON public.user_roles;
CREATE POLICY "Users can view their roles" 
ON public.user_roles 
FOR SELECT 
USING (user_id = get_current_user_id());

-- Fix video_tutorials policies if they exist
DROP POLICY IF EXISTS "Authenticated users can insert video tutorials" ON public.video_tutorials;
DROP POLICY IF EXISTS "Authenticated users can update video tutorials" ON public.video_tutorials;
DROP POLICY IF EXISTS "Authenticated users can delete video tutorials" ON public.video_tutorials;

CREATE POLICY "Premium users can manage video tutorials" 
ON public.video_tutorials 
FOR ALL 
USING (user_has_premium_tier() OR has_admin_role('admin'));

-- 2. Add missing indexes for foreign keys to improve performance

-- Add indexes for analyst_call_detections foreign keys
CREATE INDEX IF NOT EXISTS idx_analyst_call_detections_analyst_signal_id 
ON public.analyst_call_detections(analyst_signal_id);

CREATE INDEX IF NOT EXISTS idx_analyst_call_detections_pattern_id 
ON public.analyst_call_detections(pattern_id);

CREATE INDEX IF NOT EXISTS idx_analyst_call_detections_telegram_message_id 
ON public.analyst_call_detections(telegram_message_id);

-- Add indexes for analyst_call_patterns foreign keys
CREATE INDEX IF NOT EXISTS idx_analyst_call_patterns_analyst_id 
ON public.analyst_call_patterns(analyst_id);

-- Add indexes for analyst_channel_config foreign keys
CREATE INDEX IF NOT EXISTS idx_analyst_channel_config_analyst_id 
ON public.analyst_channel_config(analyst_id);

-- Add indexes for auto_highlights foreign keys
CREATE INDEX IF NOT EXISTS idx_auto_highlights_rule_id 
ON public.auto_highlights(rule_id);

CREATE INDEX IF NOT EXISTS idx_auto_highlights_telegram_message_id 
ON public.auto_highlights(telegram_message_id);

-- Add indexes for chat_highlights foreign keys
CREATE INDEX IF NOT EXISTS idx_chat_highlights_promoted_by 
ON public.chat_highlights(promoted_by);

CREATE INDEX IF NOT EXISTS idx_chat_highlights_telegram_message_id 
ON public.chat_highlights(telegram_message_id);

-- Add indexes for comment_votes foreign keys
CREATE INDEX IF NOT EXISTS idx_comment_votes_comment_id 
ON public.comment_votes(comment_id);

-- Add indexes for content_analytics foreign keys
CREATE INDEX IF NOT EXISTS idx_content_analytics_user_id 
ON public.content_analytics(user_id);

-- Add indexes for course_modules foreign keys
CREATE INDEX IF NOT EXISTS idx_course_modules_course_id 
ON public.course_modules(course_id);

-- Add indexes for degen_call_notifications foreign keys
CREATE INDEX IF NOT EXISTS idx_degen_call_notifications_analyst_signal_id 
ON public.degen_call_notifications(analyst_signal_id);

-- Add indexes for highlight_comments foreign keys
CREATE INDEX IF NOT EXISTS idx_highlight_comments_parent_comment_id 
ON public.highlight_comments(parent_comment_id);

CREATE INDEX IF NOT EXISTS idx_highlight_comments_topic_id 
ON public.highlight_comments(topic_id);

-- Add indexes for newsletters foreign keys
CREATE INDEX IF NOT EXISTS idx_newsletters_author_id 
ON public.newsletters(author_id);

-- Add indexes for telegram_sentiment_analysis foreign keys
CREATE INDEX IF NOT EXISTS idx_telegram_sentiment_analysis_telegram_message_id 
ON public.telegram_sentiment_analysis(telegram_message_id);

-- Add indexes for x_posts foreign keys
CREATE INDEX IF NOT EXISTS idx_x_posts_account_id 
ON public.x_posts(account_id);

-- Add indexes for user_trading_profiles foreign keys
CREATE INDEX IF NOT EXISTS idx_user_trading_profiles_user_id 
ON public.user_trading_profiles(user_id);

-- Add indexes for user_sessions foreign keys
CREATE INDEX IF NOT EXISTS idx_user_sessions_subscriber_id 
ON public.user_sessions(subscriber_id);

-- Add indexes for user_roles foreign keys
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id 
ON public.user_roles(user_id);

-- 3. Fix function search path issues
-- Update functions to have proper search_path settings

CREATE OR REPLACE FUNCTION public.log_data_access(
    p_user_id uuid DEFAULT NULL,
    p_admin_email text DEFAULT NULL,
    p_resource_type text DEFAULT NULL,
    p_resource_id text DEFAULT NULL,
    p_action_type text DEFAULT NULL,
    p_ip_address inet DEFAULT NULL,
    p_user_agent text DEFAULT NULL,
    p_geo_location jsonb DEFAULT NULL,
    p_device_fingerprint text DEFAULT NULL,
    p_access_granted boolean DEFAULT false,
    p_denial_reason text DEFAULT NULL,
    p_risk_score numeric DEFAULT 0.0
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    log_id UUID;
BEGIN
    INSERT INTO public.data_access_logs (
        user_id, admin_email, resource_type, resource_id, action_type,
        ip_address, user_agent, geo_location, device_fingerprint,
        access_granted, denial_reason, risk_score
    ) VALUES (
        p_user_id, p_admin_email, p_resource_type, p_resource_id, p_action_type,
        p_ip_address, p_user_agent, p_geo_location, p_device_fingerprint,
        p_access_granted, p_denial_reason, p_risk_score
    ) RETURNING id INTO log_id;
    
    RETURN log_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.is_ip_allowed(p_admin_email text, p_ip_address inet)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    is_allowed BOOLEAN := false;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM public.admin_ip_allowlist
        WHERE admin_email = p_admin_email
        AND is_active = true
        AND (expires_at IS NULL OR expires_at > now())
        AND (
            ip_address = p_ip_address OR
            p_ip_address <<= (ip_address::text || '/' || subnet_mask::text)::inet
        )
    ) INTO is_allowed;
    
    RETURN is_allowed;
END;
$function$;

CREATE OR REPLACE FUNCTION public.require_secure_data_access(
    p_operation_type text,
    p_resource_type text DEFAULT 'sensitive_data',
    p_ip_address inet DEFAULT NULL,
    p_device_fingerprint text DEFAULT NULL
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    current_email TEXT;
    ip_allowed BOOLEAN := true;
    device_authorized BOOLEAN := true;
    quota_available BOOLEAN := true;
    risk_score NUMERIC := 0.0;
    access_granted BOOLEAN := false;
BEGIN
    current_email := get_current_user_email();
    
    IF current_email IS NULL THEN
        PERFORM log_data_access(
            NULL, NULL, p_resource_type, NULL, p_operation_type,
            p_ip_address, NULL, NULL, p_device_fingerprint,
            false, 'No authenticated user', 10.0
        );
        RETURN FALSE;
    END IF;
    
    -- Check IP allowlist if IP provided
    IF p_ip_address IS NOT NULL THEN
        ip_allowed := is_ip_allowed(current_email, p_ip_address);
        IF NOT ip_allowed THEN
            risk_score := risk_score + 5.0;
        END IF;
    END IF;
    
    -- Check device authorization if fingerprint provided
    IF p_device_fingerprint IS NOT NULL THEN
        device_authorized := is_device_authorized(current_email, p_device_fingerprint);
        IF NOT device_authorized THEN
            risk_score := risk_score + 3.0;
        END IF;
    END IF;
    
    -- Determine access based on checks
    access_granted := ip_allowed AND device_authorized AND risk_score < 5.0;
    
    -- Log the access attempt
    PERFORM log_data_access(
        NULL, current_email, p_resource_type, NULL, p_operation_type,
        p_ip_address, NULL, NULL, p_device_fingerprint,
        access_granted, 
        CASE WHEN NOT access_granted THEN 
            'Access denied: IP=' || ip_allowed::text || 
            ', Device=' || device_authorized::text
        ELSE NULL END,
        risk_score
    );
    
    RETURN access_granted;
END;
$function$;

-- 4. Remove unused indexes (commonly unused ones)
-- Note: Be careful with this - only remove if truly unused

-- Remove potentially unused indexes on telegram_messages
DROP INDEX IF EXISTS public.idx_telegram_messages_timestamp;
DROP INDEX IF EXISTS public.idx_telegram_messages_chat_id_timestamp;

-- Add more targeted indexes that are actually useful
CREATE INDEX IF NOT EXISTS idx_telegram_messages_is_highlighted 
ON public.telegram_messages(is_highlighted) WHERE is_highlighted = true;

CREATE INDEX IF NOT EXISTS idx_telegram_messages_topic_timestamp 
ON public.telegram_messages(topic_name, timestamp DESC) WHERE topic_name IS NOT NULL;

-- Add composite indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_beehiiv_subscribers_email_status 
ON public.beehiiv_subscribers(email, status);

CREATE INDEX IF NOT EXISTS idx_admin_users_email_active 
ON public.admin_users(email, is_active) WHERE is_active = true;

-- 5. Create missing helper function for quota checking
CREATE OR REPLACE FUNCTION public.check_data_access_quota(
    p_admin_email text,
    p_resource_type text
) RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    quota_limit INTEGER;
    quota_used INTEGER;
    has_quota BOOLEAN := true;
BEGIN
    -- Get current quota information
    SELECT q.quota_limit, q.quota_used INTO quota_limit, quota_used
    FROM public.data_access_quotas q
    WHERE q.admin_email = p_admin_email 
    AND q.resource_type = p_resource_type
    AND q.period_end > now()
    ORDER BY q.created_at DESC
    LIMIT 1;
    
    -- If no quota record exists, allow access (no quota restrictions)
    IF quota_limit IS NULL THEN
        RETURN true;
    END IF;
    
    -- Check if under quota
    has_quota := COALESCE(quota_used, 0) < quota_limit;
    
    RETURN has_quota;
END;
$function$;

-- 6. Add missing function for user tier checking
CREATE OR REPLACE FUNCTION public.user_has_paid_tier()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.beehiiv_subscribers
    WHERE email = get_jwt_email()
    AND subscription_tier IN ('paid', 'premium')
  )
$function$;