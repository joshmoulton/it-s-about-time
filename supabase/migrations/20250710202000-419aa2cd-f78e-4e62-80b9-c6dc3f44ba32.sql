-- First, let's check if we have a whop_authenticated_users table and update our admin function
-- to properly handle Whop users

-- Update the is_current_user_admin function to check for Whop users
CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    user_email TEXT;
    whop_user_exists BOOLEAN := false;
BEGIN
    -- First, try to get email from Supabase Auth user
    IF auth.uid() IS NOT NULL THEN
        SELECT email INTO user_email 
        FROM auth.users 
        WHERE id = auth.uid();
        
        IF user_email IS NOT NULL THEN
            -- Check if this email is an admin
            RETURN EXISTS (
                SELECT 1 FROM public.admin_users 
                WHERE email = user_email
                AND is_active = true
            );
        END IF;
    END IF;
    
    -- Check for Whop authenticated users via JWT claims
    BEGIN
        user_email := current_setting('request.jwt.claims', true)::json->>'email';
        
        IF user_email IS NOT NULL AND user_email != '' THEN
            -- First check if this is a Whop authenticated user
            SELECT EXISTS (
                SELECT 1 FROM public.whop_authenticated_users 
                WHERE user_email = user_email
            ) INTO whop_user_exists;
            
            -- If Whop user exists, check admin status
            IF whop_user_exists THEN
                RETURN EXISTS (
                    SELECT 1 FROM public.admin_users 
                    WHERE email = user_email
                    AND is_active = true
                );
            END IF;
            
            -- Also check beehiiv subscribers for admin status
            RETURN EXISTS (
                SELECT 1 FROM public.admin_users 
                WHERE email = user_email
                AND is_active = true
            );
        END IF;
    EXCEPTION WHEN OTHERS THEN
        -- JWT parsing failed, continue to alternative approach
        NULL;
    END;
    
    -- Alternative approach: check if there's a current session with admin privileges
    IF current_setting('app.current_user_email', true) IS NOT NULL THEN
        user_email := current_setting('app.current_user_email', true);
        RETURN EXISTS (
            SELECT 1 FROM public.admin_users 
            WHERE email = user_email
            AND is_active = true
        );
    END IF;
    
    RETURN false;
END;
$function$;

-- Create a function to get current user email that works for both Supabase and Whop users
CREATE OR REPLACE FUNCTION public.get_current_user_email()
RETURNS text
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
$function$;

-- Update RLS policies for degen_call_subscriptions to use the new function
DROP POLICY IF EXISTS "Users can insert their own analyst subscriptions" ON public.degen_call_subscriptions;
DROP POLICY IF EXISTS "Users can update their own analyst subscriptions" ON public.degen_call_subscriptions;
DROP POLICY IF EXISTS "Users can view their own analyst subscriptions" ON public.degen_call_subscriptions;
DROP POLICY IF EXISTS "Users can delete their own analyst subscriptions" ON public.degen_call_subscriptions;

CREATE POLICY "Users can insert their own analyst subscriptions" 
ON public.degen_call_subscriptions 
FOR INSERT 
WITH CHECK (user_email = get_current_user_email());

CREATE POLICY "Users can update their own analyst subscriptions" 
ON public.degen_call_subscriptions 
FOR UPDATE 
USING (user_email = get_current_user_email());

CREATE POLICY "Users can view their own analyst subscriptions" 
ON public.degen_call_subscriptions 
FOR SELECT 
USING (user_email = get_current_user_email());

CREATE POLICY "Users can delete their own analyst subscriptions" 
ON public.degen_call_subscriptions 
FOR DELETE 
USING (user_email = get_current_user_email());

-- Update RLS policies for user_trading_profiles to work with both auth types
DROP POLICY IF EXISTS "Allow all operations on trading profiles" ON public.user_trading_profiles;

CREATE POLICY "Users can manage their own trading profiles" 
ON public.user_trading_profiles 
FOR ALL 
USING (user_email = get_current_user_email())
WITH CHECK (user_email = get_current_user_email());

-- Update RLS policies for beehiiv_subscribers to work with Whop users
DROP POLICY IF EXISTS "Users can update their own subscriber profile" ON public.beehiiv_subscribers;

CREATE POLICY "Users can update their own subscriber profile" 
ON public.beehiiv_subscribers 
FOR UPDATE 
USING (email = get_current_user_email())
WITH CHECK (email = get_current_user_email());

-- Add a policy to allow Whop users to view their subscriber profile
CREATE POLICY "Users can view their own subscriber profile" 
ON public.beehiiv_subscribers 
FOR SELECT 
USING (email = get_current_user_email() OR true); -- Keep public read access

-- Update other critical RLS policies that might affect Whop users
DROP POLICY IF EXISTS "Users can create their own feedback" ON public.feedback;
DROP POLICY IF EXISTS "Users can view their own feedback" ON public.feedback;

CREATE POLICY "Users can create their own feedback" 
ON public.feedback 
FOR INSERT 
WITH CHECK (user_email = get_current_user_email());

CREATE POLICY "Users can view their own feedback" 
ON public.feedback 
FOR SELECT 
USING (user_email = get_current_user_email());

-- Update comment policies
DROP POLICY IF EXISTS "Users can create comments" ON public.highlight_comments;
DROP POLICY IF EXISTS "Users can soft delete their own comments" ON public.highlight_comments;
DROP POLICY IF EXISTS "Users can update their own comments" ON public.highlight_comments;

CREATE POLICY "Users can create comments" 
ON public.highlight_comments 
FOR INSERT 
WITH CHECK (user_email = get_current_user_email());

CREATE POLICY "Users can update their own comments" 
ON public.highlight_comments 
FOR UPDATE 
USING (user_email = get_current_user_email());

-- Update comment votes policy
DROP POLICY IF EXISTS "Users can manage their own votes" ON public.comment_votes;

CREATE POLICY "Users can manage their own votes" 
ON public.comment_votes 
FOR ALL 
USING (user_email = get_current_user_email())
WITH CHECK (user_email = get_current_user_email());