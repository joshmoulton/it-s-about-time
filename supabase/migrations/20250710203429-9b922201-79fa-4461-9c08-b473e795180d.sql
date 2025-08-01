-- Fix RLS policies for degen_call_subscriptions to allow authenticated users to insert
DROP POLICY IF EXISTS "Users can insert their own analyst subscriptions" ON public.degen_call_subscriptions;

CREATE POLICY "Users can insert their own degen call subscriptions" 
ON public.degen_call_subscriptions 
FOR INSERT 
WITH CHECK (
  user_email = COALESCE(
    get_current_user_email(),
    (current_setting('request.jwt.claims', true)::json ->> 'email')
  )
);

-- Fix RLS policies for user_trading_profiles to allow authenticated users to insert
DROP POLICY IF EXISTS "Users can manage their own trading profiles" ON public.user_trading_profiles;

CREATE POLICY "Users can view their own trading profiles" 
ON public.user_trading_profiles 
FOR SELECT 
USING (
  user_email = COALESCE(
    get_current_user_email(),
    (current_setting('request.jwt.claims', true)::json ->> 'email')
  )
);

CREATE POLICY "Users can insert their own trading profiles" 
ON public.user_trading_profiles 
FOR INSERT 
WITH CHECK (
  user_email = COALESCE(
    get_current_user_email(),
    (current_setting('request.jwt.claims', true)::json ->> 'email')
  )
);

CREATE POLICY "Users can update their own trading profiles" 
ON public.user_trading_profiles 
FOR UPDATE 
USING (
  user_email = COALESCE(
    get_current_user_email(),
    (current_setting('request.jwt.claims', true)::json ->> 'email')
  )
);

-- Update the admin user detection function to better handle Whop users
CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
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
$$;