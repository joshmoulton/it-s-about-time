-- Fix Supabase Security and Performance Issues

-- 1. Enable RLS on user_profiles table (Security Advisor)
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  whop_email text,
  display_name text,
  avatar_url text,
  bio text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Create proper RLS policies for user_profiles
DROP POLICY IF EXISTS "Users can manage their own profile" ON public.user_profiles;

CREATE POLICY "Users can view their own profile"
ON public.user_profiles
FOR SELECT
USING (
  user_id = auth.uid() OR 
  whop_email = (current_setting('request.jwt.claims', true)::json ->> 'email')
);

CREATE POLICY "Users can insert their own profile"
ON public.user_profiles
FOR INSERT
WITH CHECK (
  user_id = auth.uid() OR 
  whop_email = (current_setting('request.jwt.claims', true)::json ->> 'email')
);

CREATE POLICY "Users can update their own profile"
ON public.user_profiles
FOR UPDATE
USING (
  user_id = auth.uid() OR 
  whop_email = (current_setting('request.jwt.claims', true)::json ->> 'email')
);

-- 2. Fix function search paths (Security Advisor)
CREATE OR REPLACE FUNCTION public.get_current_user_email()
RETURNS text
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
    user_email TEXT;
BEGIN
    -- First, try to get email from Supabase Auth user
    IF auth.uid() IS NOT NULL THEN
        SELECT email INTO user_email 
        FROM auth.users 
        WHERE id = auth.uid();
        
        IF user_email IS NOT NULL THEN
            RETURN user_email;
        END IF;
    END IF;
    
    -- Fall back to JWT claims for Whop users
    BEGIN
        user_email := current_setting('request.jwt.claims', true)::json->>'email';
        
        IF user_email IS NOT NULL AND user_email != '' THEN
            RETURN user_email;
        END IF;
    EXCEPTION WHEN OTHERS THEN
        -- JWT parsing failed
        NULL;
    END;
    
    -- Alternative approach: check app setting
    IF current_setting('app.current_user_email', true) IS NOT NULL THEN
        RETURN current_setting('app.current_user_email', true);
    END IF;
    
    RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
    user_email TEXT;
    auth_uid UUID;
BEGIN
    -- Get auth.uid() first for Supabase authenticated users
    auth_uid := auth.uid();
    
    -- If we have a Supabase auth user (local admin), prioritize this
    IF auth_uid IS NOT NULL THEN
        SELECT email INTO user_email FROM auth.users WHERE id = auth_uid;
        IF user_email IS NOT NULL THEN
            -- For local admin users, check admin_users table
            -- Only allow supabase_admin type for security (no whop_admin via local login)
            RETURN EXISTS (
                SELECT 1 FROM public.admin_users 
                WHERE email = user_email 
                AND is_active = true 
                AND (user_type = 'supabase_admin' OR user_type IS NULL)
            );
        END IF;
    END IF;
    
    -- Try JWT claims approach for Whop users (should not have admin access)
    BEGIN
        user_email := current_setting('request.jwt.claims', true)::json->>'email';
        IF user_email IS NOT NULL AND user_email != '' THEN
            -- For Whop users, deny admin access for security
            -- This ensures only local Supabase users can be admins
            RETURN FALSE;
        END IF;
    EXCEPTION WHEN OTHERS THEN
        -- Continue to next method
        NULL;
    END;
    
    -- Check session-based authentication (legacy support)
    BEGIN
        user_email := current_setting('app.current_user_email', true);
        IF user_email IS NOT NULL AND user_email != '' THEN
            RETURN EXISTS (
                SELECT 1 FROM public.admin_users 
                WHERE email = user_email 
                AND is_active = true 
                AND (user_type = 'supabase_admin' OR user_type IS NULL)
            );
        END IF;
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;
    
    -- No admin access granted
    RETURN FALSE;
END;
$$;

-- 3. Fix multiple permissive policies (Performance Advisor)
-- Remove duplicate policies on admin_2fa_secrets
DROP POLICY IF EXISTS "Admins can view their own 2FA secrets" ON public.admin_2fa_secrets;
DROP POLICY IF EXISTS "Super admins can view all 2FA secrets" ON public.admin_2fa_secrets;

-- Create single comprehensive policy for admin_2fa_secrets
CREATE POLICY "2FA secrets access policy"
ON public.admin_2fa_secrets
FOR ALL
USING (
  admin_email = get_current_user_email() OR 
  has_admin_role('super_admin')
)
WITH CHECK (
  admin_email = get_current_user_email() OR 
  has_admin_role('super_admin')
);

-- Fix admin_2fa_sessions policies
DROP POLICY IF EXISTS "Admins can manage their own 2FA sessions" ON public.admin_2fa_sessions;
DROP POLICY IF EXISTS "Super admins can view all 2FA sessions" ON public.admin_2fa_sessions;

CREATE POLICY "2FA sessions access policy"
ON public.admin_2fa_sessions
FOR ALL
USING (
  admin_email = get_current_user_email() OR 
  has_admin_role('super_admin')
)
WITH CHECK (
  admin_email = get_current_user_email() OR 
  has_admin_role('super_admin')
);

-- 4. Add performance indexes (Performance Advisor)
-- Create indexes for frequently queried columns
CREATE INDEX IF NOT EXISTS idx_telegram_community_access_user_email ON public.telegram_community_access(user_email);
CREATE INDEX IF NOT EXISTS idx_telegram_sentiment_analysis_created_at ON public.telegram_sentiment_analysis(created_at);
CREATE INDEX IF NOT EXISTS idx_sentiment_alerts_created_at ON public.sentiment_alerts(created_at);
CREATE INDEX IF NOT EXISTS idx_newsletters_published_at ON public.newsletters(published_at);
CREATE INDEX IF NOT EXISTS idx_highlight_topics_last_activity ON public.highlight_topics(last_activity_at);
CREATE INDEX IF NOT EXISTS idx_highlight_comments_topic_id ON public.highlight_comments(topic_id);
CREATE INDEX IF NOT EXISTS idx_comment_votes_comment_id ON public.comment_votes(comment_id);
CREATE INDEX IF NOT EXISTS idx_topic_follows_user_email ON public.topic_follows(user_email);
CREATE INDEX IF NOT EXISTS idx_backup_history_created_at ON public.backup_history(created_at);
CREATE INDEX IF NOT EXISTS idx_telegram_messages_timestamp ON public.telegram_messages(timestamp);
CREATE INDEX IF NOT EXISTS idx_telegram_topics_last_activity ON public.telegram_topics(last_activity_at);
CREATE INDEX IF NOT EXISTS idx_telegram_topic_discovery_discovered_at ON public.telegram_topic_discovery(discovered_at);
CREATE INDEX IF NOT EXISTS idx_x_posts_posted_at ON public.x_posts(posted_at);
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON public.admin_users(email);
CREATE INDEX IF NOT EXISTS idx_auto_highlights_telegram_message_id ON public.auto_highlights(telegram_message_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_created_at ON public.admin_audit_log(created_at);
CREATE INDEX IF NOT EXISTS idx_admin_2fa_secrets_admin_email ON public.admin_2fa_secrets(admin_email);
CREATE INDEX IF NOT EXISTS idx_admin_2fa_sessions_admin_email ON public.admin_2fa_sessions(admin_email);
CREATE INDEX IF NOT EXISTS idx_admin_security_events_admin_email ON public.admin_security_events(admin_email);
CREATE INDEX IF NOT EXISTS idx_encrypted_user_data_user_id ON public.encrypted_user_data(user_id);
CREATE INDEX IF NOT EXISTS idx_data_access_logs_admin_email ON public.data_access_logs(admin_email);
CREATE INDEX IF NOT EXISTS idx_admin_ip_allowlist_admin_email ON public.admin_ip_allowlist(admin_email);
CREATE INDEX IF NOT EXISTS idx_admin_device_auth_admin_email ON public.admin_device_auth(admin_email);