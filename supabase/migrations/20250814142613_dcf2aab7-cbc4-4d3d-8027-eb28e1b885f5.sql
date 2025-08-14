-- Fix Security Issues: Restrict public access to sensitive tables (Corrected)

-- 1. Fix analysts table - restrict to authenticated users only
DROP POLICY IF EXISTS "analysts_public_read" ON public.analysts;
CREATE POLICY "analysts_authenticated_read" ON public.analysts
FOR SELECT TO authenticated
USING (is_active = true);

-- 2. Fix crypto_prices table - restrict to authenticated users
DROP POLICY IF EXISTS "crypto_prices_public_read" ON public.crypto_prices;
CREATE POLICY "crypto_prices_authenticated_read" ON public.crypto_prices
FOR SELECT TO authenticated
USING (true);

-- 3. Fix analyst_call_patterns table - restrict to admins only for patterns
DROP POLICY IF EXISTS "analyst_call_patterns_consolidated" ON public.analyst_call_patterns;
CREATE POLICY "analyst_call_patterns_admin_only" ON public.analyst_call_patterns
FOR SELECT TO authenticated
USING (is_current_user_admin_fast());

CREATE POLICY "analyst_call_patterns_admin_manage" ON public.analyst_call_patterns
FOR ALL TO authenticated
USING (is_current_user_admin_fast())
WITH CHECK (is_current_user_admin_fast());

-- 4. Create video_tutorials table if it doesn't exist and add proper RLS
CREATE TABLE IF NOT EXISTS public.video_tutorials (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title text NOT NULL,
    description text,
    video_url text NOT NULL,
    thumbnail_url text,
    duration_minutes integer,
    required_tier subscription_tier NOT NULL DEFAULT 'free',
    status text NOT NULL DEFAULT 'draft',
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on video_tutorials
ALTER TABLE public.video_tutorials ENABLE ROW LEVEL SECURITY;

-- Create proper tier-based access policy for video_tutorials
CREATE POLICY "video_tutorials_tier_access" ON public.video_tutorials
FOR SELECT TO authenticated
USING (
    status = 'published' AND (
        required_tier = 'free' OR
        (required_tier = 'paid' AND get_current_user_tier_optimized() IN ('paid', 'premium')) OR
        (required_tier = 'premium' AND get_current_user_tier_optimized() = 'premium') OR
        is_current_user_admin_fast()
    )
);

CREATE POLICY "video_tutorials_admin_manage" ON public.video_tutorials
FOR ALL TO authenticated
USING (is_current_user_admin_fast())
WITH CHECK (is_current_user_admin_fast());

-- 5. Fix newsletters table - strengthen RLS for tier-based access
-- First check what columns exist in newsletters table
DO $$
BEGIN
    -- Check if we have the right column structure
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'newsletters' 
        AND column_name = 'status'
        AND table_schema = 'public'
    ) THEN
        -- Drop existing policy and create tier-based one
        EXECUTE 'DROP POLICY IF EXISTS "newsletters_public_read" ON public.newsletters';
        EXECUTE 'CREATE POLICY "newsletters_tier_access" ON public.newsletters
        FOR SELECT TO authenticated
        USING (
            status = ''published'' AND (
                required_tier = ''free'' OR
                (required_tier = ''paid'' AND get_current_user_tier_optimized() IN (''paid'', ''premium'')) OR
                (required_tier = ''premium'' AND get_current_user_tier_optimized() = ''premium'') OR
                is_current_user_admin_fast()
            )
        )';
    END IF;
END $$;

-- 6. Fix crypto_coin_mappings - restrict to authenticated users
DROP POLICY IF EXISTS "crypto_coin_mappings_public_read" ON public.crypto_coin_mappings;
CREATE POLICY "crypto_coin_mappings_authenticated_read" ON public.crypto_coin_mappings
FOR SELECT TO authenticated
USING (true);

-- 7. Fix function search path issues by updating functions
CREATE OR REPLACE FUNCTION public.get_current_user_tier_optimized()
RETURNS subscription_tier
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    user_email TEXT;
    user_tier subscription_tier;
    is_admin BOOLEAN;
BEGIN
    -- Get current user email
    user_email := get_current_user_email_optimized();
    
    IF user_email IS NULL THEN
        RETURN 'free'::subscription_tier;
    END IF;
    
    -- Check if user is admin first
    is_admin := is_current_user_admin_fast();
    IF is_admin THEN
        RETURN 'premium'::subscription_tier;
    END IF;
    
    -- Check beehiiv_subscribers table for tier
    SELECT subscription_tier INTO user_tier
    FROM public.beehiiv_subscribers
    WHERE email = user_email;
    
    -- Return found tier or default to free
    RETURN COALESCE(user_tier, 'free'::subscription_tier);
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_current_user_email_optimized()
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
    
    RETURN NULL;
END;
$function$;

CREATE OR REPLACE FUNCTION public.is_current_user_admin_fast()
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    user_email TEXT;
    admin_override_tier subscription_tier;
BEGIN
    user_email := get_current_user_email_optimized();
    
    IF user_email IS NULL THEN
        RETURN false;
    END IF;
    
    -- Check admin tier override first
    SELECT (setting_value->>'tier')::subscription_tier INTO admin_override_tier
    FROM public.system_settings 
    WHERE setting_key = 'admin_tier_override';
    
    IF admin_override_tier IS NOT NULL THEN
        RETURN true;
    END IF;
    
    -- Check admin_users table
    RETURN EXISTS (
        SELECT 1 FROM public.admin_users 
        WHERE email = user_email 
        AND is_active = true
    );
END;
$function$;