-- CRITICAL: Performance and Security Cleanup - Remove 80+ unused indexes and fix security issues

-- ==============================================
-- PHASE 1: REMOVE ALL UNUSED INDEXES (Major Performance Boost)
-- ==============================================

-- Drop all unused indexes with 0 scans (50+ indexes consuming storage)
DROP INDEX IF EXISTS public.admin_2fa_secrets_admin_email_key;
DROP INDEX IF EXISTS public.idx_admin_2fa_secrets_email;
DROP INDEX IF EXISTS public.admin_2fa_sessions_session_token_key;
DROP INDEX IF EXISTS public.idx_admin_2fa_sessions_admin_email;
DROP INDEX IF EXISTS public.idx_admin_2fa_sessions_expires;
DROP INDEX IF EXISTS public.idx_admin_2fa_sessions_token;
DROP INDEX IF EXISTS public.idx_admin_audit_log_action;
DROP INDEX IF EXISTS public.idx_admin_audit_log_resource;
DROP INDEX IF EXISTS public.idx_admin_audit_log_user_created;
DROP INDEX IF EXISTS public.idx_admin_audit_log_user_email;
DROP INDEX IF EXISTS public.admin_device_auth_device_fingerprint_key;
DROP INDEX IF EXISTS public.idx_admin_device_auth_admin_email;
DROP INDEX IF EXISTS public.idx_admin_device_auth_email;
DROP INDEX IF EXISTS public.idx_admin_device_auth_fingerprint;
DROP INDEX IF EXISTS public.idx_admin_ip_allowlist_admin_email;
DROP INDEX IF EXISTS public.idx_admin_ip_allowlist_email;
DROP INDEX IF EXISTS public.idx_admin_ip_allowlist_ip;
DROP INDEX IF EXISTS public.idx_admin_security_events_admin_email;
DROP INDEX IF EXISTS public.idx_admin_security_events_email;
DROP INDEX IF EXISTS public.idx_admin_security_events_type;
DROP INDEX IF EXISTS public.idx_admin_users_email;
DROP INDEX IF EXISTS public.idx_analyst_call_detections_analyst_signal_id;
DROP INDEX IF EXISTS public.idx_analyst_call_detections_pattern_id;
DROP INDEX IF EXISTS public.idx_analyst_call_detections_telegram_message_id;
DROP INDEX IF EXISTS public.idx_analyst_call_patterns_analyst_id;
DROP INDEX IF EXISTS public.idx_analyst_channel_config_analyst_id;
DROP INDEX IF EXISTS public.idx_analyst_signals_status_created;
DROP INDEX IF EXISTS public.idx_authentication_audit_log_user_created;
DROP INDEX IF EXISTS public.idx_auto_highlights_expires_at;
DROP INDEX IF EXISTS public.idx_auto_highlights_rule_id;
DROP INDEX IF EXISTS public.idx_auto_highlights_telegram_message_id;
DROP INDEX IF EXISTS public.idx_backup_history_status;
DROP INDEX IF EXISTS public.comment_votes_comment_id_user_email_key;
DROP INDEX IF EXISTS public.idx_comment_votes_comment;
DROP INDEX IF EXISTS public.idx_comment_votes_comment_id;
DROP INDEX IF EXISTS public.idx_crypto_alerts_active;
DROP INDEX IF EXISTS public.idx_crypto_alerts_symbol;
DROP INDEX IF EXISTS public.idx_data_access_logs_admin_email;
DROP INDEX IF EXISTS public.idx_data_access_logs_created_at;
DROP INDEX IF EXISTS public.idx_data_access_logs_ip;
DROP INDEX IF EXISTS public.idx_degen_call_notifications_analyst_signal_id;
DROP INDEX IF EXISTS public.idx_encrypted_user_data_classification;
DROP INDEX IF EXISTS public.idx_encrypted_user_data_type;
DROP INDEX IF EXISTS public.idx_encrypted_user_data_user_id;
DROP INDEX IF EXISTS public.idx_feedback_category;
DROP INDEX IF EXISTS public.idx_feedback_created_at;
DROP INDEX IF EXISTS public.idx_feedback_status;
DROP INDEX IF EXISTS public.idx_feedback_status_priority;
DROP INDEX IF EXISTS public.idx_feedback_user_email;
DROP INDEX IF EXISTS public.idx_highlight_comments_parent;
DROP INDEX IF EXISTS public.idx_highlight_comments_parent_comment_id;
DROP INDEX IF EXISTS public.idx_highlight_comments_topic;
DROP INDEX IF EXISTS public.idx_highlight_comments_topic_id;
DROP INDEX IF EXISTS public.highlight_topics_topic_slug_key;
DROP INDEX IF EXISTS public.idx_highlight_topics_slug;
DROP INDEX IF EXISTS public.idx_highlight_topics_trending;
DROP INDEX IF EXISTS public.idx_newsletters_author_id;
DROP INDEX IF EXISTS public.idx_newsletters_beehiiv_post_id;
DROP INDEX IF EXISTS public.idx_newsletters_scheduled_status;
DROP INDEX IF EXISTS public.notification_templates_template_type_channel_is_default_key;
DROP INDEX IF EXISTS public.idx_sentiment_alerts_severity;
DROP INDEX IF EXISTS public.sentiment_trends_time_period_period_type_key;
DROP INDEX IF EXISTS public.idx_telegram_access_email;
DROP INDEX IF EXISTS public.idx_telegram_access_purchase_id;
DROP INDEX IF EXISTS public.idx_telegram_access_user_id;
DROP INDEX IF EXISTS public.idx_sentiment_analysis_sentiment_score;
DROP INDEX IF EXISTS public.idx_telegram_sentiment_analysis_telegram_message_id;
DROP INDEX IF EXISTS public.idx_telegram_topic_discovery_topic_id;
DROP INDEX IF EXISTS public.telegram_topic_mappings_telegram_topic_id_key;
DROP INDEX IF EXISTS public.idx_telegram_topics_activity;
DROP INDEX IF EXISTS public.idx_telegram_user_mapping_dashboard_user;
DROP INDEX IF EXISTS public.telegram_user_mapping_dashboard_user_id_key;
DROP INDEX IF EXISTS public.telegram_user_mapping_telegram_user_id_key;
DROP INDEX IF EXISTS public.idx_topic_follows_user;
DROP INDEX IF EXISTS public.topic_follows_topic_id_user_email_key;
DROP INDEX IF EXISTS public.user_beehiiv_links_user_id_key;
DROP INDEX IF EXISTS public.idx_user_roles_user_id;
DROP INDEX IF EXISTS public.idx_user_sessions_subscriber_id;
DROP INDEX IF EXISTS public.idx_user_trading_profiles_user_id;
DROP INDEX IF EXISTS public.idx_whop_authenticated_users_email;
DROP INDEX IF EXISTS public.whop_authenticated_users_whop_user_id_key;
DROP INDEX IF EXISTS public.idx_whop_products_whop_id;
DROP INDEX IF EXISTS public.idx_whop_purchases_product;
DROP INDEX IF EXISTS public.idx_whop_purchases_whop_id;
DROP INDEX IF EXISTS public.whop_purchases_whop_purchase_id_key;
DROP INDEX IF EXISTS public.x_account_monitoring_account_handle_key;
DROP INDEX IF EXISTS public.idx_x_posts_account_id;
DROP INDEX IF EXISTS public.idx_x_posts_collected_at;

-- ==============================================
-- PHASE 2: CRITICAL SECURITY FIXES - REMOVE UNRESTRICTED ACCESS
-- ==============================================

-- Fix admin_audit_log - SECURITY CRITICAL
DROP POLICY IF EXISTS "audit_log_system_insert" ON public.admin_audit_log;
CREATE POLICY "audit_log_admin_insert" ON public.admin_audit_log 
FOR INSERT TO public 
WITH CHECK (is_current_user_admin_fast());

-- Fix admin_security_events - SECURITY CRITICAL  
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

-- Fix data_access_logs - SECURITY CRITICAL
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