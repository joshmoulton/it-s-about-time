-- CRITICAL: Performance and Security Cleanup - Part 1: Remove constraints and fix security

-- ==============================================
-- PHASE 1: REMOVE UNIQUE CONSTRAINTS FIRST
-- ==============================================

-- Drop constraints that are backing the indexes
ALTER TABLE public.admin_2fa_secrets DROP CONSTRAINT IF EXISTS admin_2fa_secrets_admin_email_key;
ALTER TABLE public.admin_2fa_sessions DROP CONSTRAINT IF EXISTS admin_2fa_sessions_session_token_key;
ALTER TABLE public.admin_device_auth DROP CONSTRAINT IF EXISTS admin_device_auth_device_fingerprint_key;
ALTER TABLE public.comment_votes DROP CONSTRAINT IF EXISTS comment_votes_comment_id_user_email_key;
ALTER TABLE public.highlight_topics DROP CONSTRAINT IF EXISTS highlight_topics_topic_slug_key;
ALTER TABLE public.notification_templates DROP CONSTRAINT IF EXISTS notification_templates_template_type_channel_is_default_key;
ALTER TABLE public.sentiment_trends DROP CONSTRAINT IF EXISTS sentiment_trends_time_period_period_type_key;
ALTER TABLE public.telegram_topic_mappings DROP CONSTRAINT IF EXISTS telegram_topic_mappings_telegram_topic_id_key;
ALTER TABLE public.telegram_user_mapping DROP CONSTRAINT IF EXISTS telegram_user_mapping_dashboard_user_id_key;
ALTER TABLE public.telegram_user_mapping DROP CONSTRAINT IF EXISTS telegram_user_mapping_telegram_user_id_key;
ALTER TABLE public.topic_follows DROP CONSTRAINT IF EXISTS topic_follows_topic_id_user_email_key;
ALTER TABLE public.user_beehiiv_links DROP CONSTRAINT IF EXISTS user_beehiiv_links_user_id_key;
ALTER TABLE public.whop_authenticated_users DROP CONSTRAINT IF EXISTS whop_authenticated_users_whop_user_id_key;
ALTER TABLE public.whop_purchases DROP CONSTRAINT IF EXISTS whop_purchases_whop_purchase_id_key;
ALTER TABLE public.x_account_monitoring DROP CONSTRAINT IF EXISTS x_account_monitoring_account_handle_key;

-- ==============================================
-- PHASE 2: CRITICAL SECURITY FIXES - REMOVE UNRESTRICTED ACCESS
-- ==============================================

-- Fix admin_audit_log - SECURITY CRITICAL: Remove unrestricted INSERT
DROP POLICY IF EXISTS "audit_log_system_insert" ON public.admin_audit_log;
CREATE POLICY "audit_log_admin_insert" ON public.admin_audit_log 
FOR INSERT TO public 
WITH CHECK (is_current_user_admin_fast());

-- Fix admin_security_events - SECURITY CRITICAL: Remove unrestricted INSERT  
DROP POLICY IF EXISTS "security_events_system_insert" ON public.admin_security_events;
CREATE POLICY "security_events_admin_insert" ON public.admin_security_events 
FOR INSERT TO public 
WITH CHECK (is_current_user_admin_fast());

-- Fix auto_highlights - REMOVE UNRESTRICTED ACCESS
DROP POLICY IF EXISTS "auto_highlights_system_manage" ON public.auto_highlights;
CREATE POLICY "auto_highlights_admin_manage" ON public.auto_highlights 
FOR ALL TO public 
USING (is_current_user_admin_fast())
WITH CHECK (is_current_user_admin_fast());

-- Fix data_access_logs - SECURITY CRITICAL: Remove unrestricted INSERT
DROP POLICY IF EXISTS "access_logs_system_insert" ON public.data_access_logs;
CREATE POLICY "access_logs_admin_insert" ON public.data_access_logs 
FOR INSERT TO public 
WITH CHECK (is_current_user_admin_fast());

-- Fix highlight_topics - REMOVE UNRESTRICTED ACCESS
DROP POLICY IF EXISTS "highlight_topics_system_manage" ON public.highlight_topics;
CREATE POLICY "highlight_topics_admin_manage" ON public.highlight_topics 
FOR ALL TO public 
USING (is_current_user_admin_fast())
WITH CHECK (is_current_user_admin_fast());

-- Fix sentiment_alerts - REMOVE UNRESTRICTED ACCESS  
DROP POLICY IF EXISTS "sentiment_alerts_system_manage" ON public.sentiment_alerts;
CREATE POLICY "sentiment_alerts_admin_manage" ON public.sentiment_alerts 
FOR ALL TO public 
USING (is_current_user_admin_fast())
WITH CHECK (is_current_user_admin_fast());

-- Fix sentiment_trends - REMOVE UNRESTRICTED ACCESS
DROP POLICY IF EXISTS "sentiment_trends_system_manage" ON public.sentiment_trends;
CREATE POLICY "sentiment_trends_admin_manage" ON public.sentiment_trends 
FOR ALL TO public 
USING (is_current_user_admin_fast())
WITH CHECK (is_current_user_admin_fast());

-- Fix telegram_topic_discovery - REMOVE UNRESTRICTED ACCESS
DROP POLICY IF EXISTS "topic_discovery_system_manage" ON public.telegram_topic_discovery;
CREATE POLICY "topic_discovery_admin_manage" ON public.telegram_topic_discovery 
FOR ALL TO public 
USING (is_current_user_admin_fast())
WITH CHECK (is_current_user_admin_fast());

-- Fix x_sentiment_analysis - REMOVE UNRESTRICTED ACCESS
DROP POLICY IF EXISTS "x_sentiment_system_manage" ON public.x_sentiment_analysis;
CREATE POLICY "x_sentiment_admin_manage" ON public.x_sentiment_analysis 
FOR ALL TO public 
USING (is_current_user_admin_fast())
WITH CHECK (is_current_user_admin_fast());