-- Fix remaining performance issues in Supabase - Part 3: Index optimization

-- 5. Remove unused indexes and add more targeted ones
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

-- Add performance indexes for common queries
CREATE INDEX IF NOT EXISTS idx_analyst_signals_status_created 
ON public.analyst_signals(status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_feedback_status_priority 
ON public.feedback(status, priority, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_articles_status_published 
ON public.articles(status, published_at DESC) WHERE status = 'published';

CREATE INDEX IF NOT EXISTS idx_newsletters_status_published 
ON public.newsletters(status, published_at DESC) WHERE status = 'published';

-- Add admin-specific performance indexes
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_user_created 
ON public.admin_audit_log(user_email, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_authentication_audit_log_user_created 
ON public.authentication_audit_log(user_email, created_at DESC);

-- Add indexes for better RLS performance
CREATE INDEX IF NOT EXISTS idx_whop_authenticated_users_email 
ON public.whop_authenticated_users(user_email) WHERE user_email IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_telegram_user_mapping_dashboard_user 
ON public.telegram_user_mapping(dashboard_user_id, verified);

-- Clean up any duplicate indexes if they exist
DROP INDEX IF EXISTS public.duplicate_telegram_messages_chat_id;
DROP INDEX IF EXISTS public.duplicate_beehiiv_subscribers_email;