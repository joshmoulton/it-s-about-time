-- Fix Multiple Permissive Policies warnings by consolidating overlapping policies

-- Drop duplicate policies on admin_security_events table
DROP POLICY IF EXISTS "admin_security_events_consolidated" ON public.admin_security_events;
DROP POLICY IF EXISTS "security_events_admin_insert" ON public.admin_security_events;

-- Create single consolidated policy for admin_security_events
CREATE POLICY "admin_security_events_unified" ON public.admin_security_events
FOR ALL USING (is_current_user_admin_fast())
WITH CHECK (is_current_user_admin_fast());

-- Drop duplicate policies on admin_users table  
DROP POLICY IF EXISTS "admin_users_secure_access" ON public.admin_users;
DROP POLICY IF EXISTS "admin_users_read_access" ON public.admin_users;
DROP POLICY IF EXISTS "admin_users_create_access" ON public.admin_users;
DROP POLICY IF EXISTS "admin_users_update_access" ON public.admin_users;
DROP POLICY IF EXISTS "admin_users_delete_access" ON public.admin_users;

-- Create consolidated admin_users policies
CREATE POLICY "admin_users_read" ON public.admin_users
FOR SELECT USING (is_current_user_admin_fast());

CREATE POLICY "admin_users_write" ON public.admin_users
FOR INSERT WITH CHECK (is_current_user_admin_fast() AND can_manage_admin_role(role));

CREATE POLICY "admin_users_update" ON public.admin_users
FOR UPDATE 
USING (is_current_user_admin_fast() AND can_manage_admin_role(role))
WITH CHECK (is_current_user_admin_fast() AND can_manage_admin_role(role));

CREATE POLICY "admin_users_delete" ON public.admin_users
FOR DELETE 
USING (is_current_user_admin_fast() AND can_manage_admin_role(role) AND (email <> get_current_user_email_optimized()));

-- Drop duplicate policies on feedback table
DROP POLICY IF EXISTS "feedback_admin_manage" ON public.feedback;
DROP POLICY IF EXISTS "feedback_read_policy" ON public.feedback;
DROP POLICY IF EXISTS "feedback_submission_policy" ON public.feedback;
DROP POLICY IF EXISTS "feedback_update_policy" ON public.feedback;

-- Create optimized feedback policies
CREATE POLICY "feedback_read" ON public.feedback
FOR SELECT USING (
  user_email = get_current_user_email_optimized() OR 
  user_email = auth.email() OR 
  is_current_user_admin_fast()
);

CREATE POLICY "feedback_create" ON public.feedback
FOR INSERT WITH CHECK (
  auth.uid() IS NOT NULL AND user_email = auth.email() OR
  auth.uid() IS NULL OR
  is_current_user_admin_fast()
);

CREATE POLICY "feedback_manage" ON public.feedback
FOR UPDATE USING (
  user_email = get_current_user_email_optimized() OR 
  user_email = auth.email() OR 
  is_current_user_admin_fast()
) WITH CHECK (
  char_length(title) <= 200 AND 
  char_length(description) <= 2000
);

CREATE POLICY "feedback_admin_all" ON public.feedback
FOR ALL USING (is_current_user_admin_fast())
WITH CHECK (is_current_user_admin_fast());

-- Drop duplicate policies on comment_votes table
DROP POLICY IF EXISTS "Users can manage their own votes" ON public.comment_votes;
DROP POLICY IF EXISTS "Users can view comment votes" ON public.comment_votes;
DROP POLICY IF EXISTS "votes_public_read" ON public.comment_votes;
DROP POLICY IF EXISTS "votes_user_manage" ON public.comment_votes;

-- Create optimized comment_votes policies
CREATE POLICY "comment_votes_read" ON public.comment_votes
FOR SELECT USING (true);

CREATE POLICY "comment_votes_manage" ON public.comment_votes
FOR ALL USING (
  auth.uid() IS NOT NULL AND 
  user_email = COALESCE(auth.email(), get_current_user_email_optimized())
) WITH CHECK (
  auth.uid() IS NOT NULL AND 
  user_email = COALESCE(auth.email(), get_current_user_email_optimized())
);

-- Optimize frequently used auth functions to reduce current_setting() calls
CREATE OR REPLACE FUNCTION public.get_current_user_email_optimized()
RETURNS text
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    user_email TEXT;
    cached_email TEXT;
BEGIN
    -- Check if we already have the email in the current transaction
    BEGIN
        cached_email := current_setting('app.cached_user_email', true);
        IF cached_email IS NOT NULL AND cached_email != '' THEN
            RETURN cached_email;
        END IF;
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;
    
    -- Get email from Supabase Auth user (fastest path)
    IF auth.uid() IS NOT NULL THEN
        SELECT email INTO user_email 
        FROM auth.users 
        WHERE id = auth.uid();
        
        IF user_email IS NOT NULL THEN
            -- Cache the result for this transaction
            PERFORM set_config('app.cached_user_email', user_email, true);
            RETURN user_email;
        END IF;
    END IF;
    
    -- Fall back to JWT claims only if auth.uid() is null
    BEGIN
        user_email := current_setting('request.jwt.claims', true)::json->>'email';
        IF user_email IS NOT NULL AND user_email != '' THEN
            PERFORM set_config('app.cached_user_email', user_email, true);
            RETURN user_email;
        END IF;
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;
    
    RETURN NULL;
END;
$function$;

-- Optimize admin check function
CREATE OR REPLACE FUNCTION public.is_current_user_admin_fast()
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    user_email TEXT;
    cached_result TEXT;
BEGIN
    -- Check cache first
    BEGIN
        cached_result := current_setting('app.cached_is_admin', true);
        IF cached_result IS NOT NULL THEN
            RETURN cached_result::boolean;
        END IF;
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;
    
    user_email := get_current_user_email_optimized();
    
    IF user_email IS NULL THEN
        PERFORM set_config('app.cached_is_admin', 'false', true);
        RETURN false;
    END IF;
    
    -- Single optimized query
    IF EXISTS (
        SELECT 1 FROM public.admin_users 
        WHERE email = user_email 
        AND is_active = true
        LIMIT 1
    ) THEN
        PERFORM set_config('app.cached_is_admin', 'true', true);
        RETURN true;
    END IF;
    
    PERFORM set_config('app.cached_is_admin', 'false', true);
    RETURN false;
END;
$function$;