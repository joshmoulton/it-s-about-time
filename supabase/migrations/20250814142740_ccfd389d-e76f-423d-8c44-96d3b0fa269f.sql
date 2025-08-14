-- Fix Security Issues: Restrict public access to sensitive tables (Final)

-- 1. Fix analysts table - restrict to authenticated users only
DROP POLICY IF EXISTS "analysts_public_read" ON public.analysts;
DROP POLICY IF EXISTS "analysts_authenticated_read" ON public.analysts;
CREATE POLICY "analysts_authenticated_read" ON public.analysts
FOR SELECT TO authenticated
USING (is_active = true);

-- 2. Fix crypto_prices table - restrict to authenticated users
DROP POLICY IF EXISTS "crypto_prices_public_read" ON public.crypto_prices;
DROP POLICY IF EXISTS "crypto_prices_authenticated_read" ON public.crypto_prices;
CREATE POLICY "crypto_prices_authenticated_read" ON public.crypto_prices
FOR SELECT TO authenticated
USING (true);

-- 3. Fix analyst_call_patterns table - restrict to admins only for patterns
DROP POLICY IF EXISTS "analyst_call_patterns_consolidated" ON public.analyst_call_patterns;
DROP POLICY IF EXISTS "analyst_call_patterns_admin_only" ON public.analyst_call_patterns;
DROP POLICY IF EXISTS "analyst_call_patterns_admin_manage" ON public.analyst_call_patterns;

CREATE POLICY "analyst_call_patterns_admin_only" ON public.analyst_call_patterns
FOR SELECT TO authenticated
USING (is_current_user_admin_fast());

CREATE POLICY "analyst_call_patterns_admin_manage" ON public.analyst_call_patterns
FOR ALL TO authenticated
USING (is_current_user_admin_fast())
WITH CHECK (is_current_user_admin_fast());

-- 4. Handle video_tutorials table 
DROP POLICY IF EXISTS "video_tutorials_tier_access" ON public.video_tutorials;
DROP POLICY IF EXISTS "video_tutorials_admin_manage" ON public.video_tutorials;

-- Only create table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'video_tutorials' AND table_schema = 'public'
    ) THEN
        CREATE TABLE public.video_tutorials (
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
        
        ALTER TABLE public.video_tutorials ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- Create policies for video_tutorials
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
DROP POLICY IF EXISTS "newsletters_public_read" ON public.newsletters;
DROP POLICY IF EXISTS "newsletters_tier_access" ON public.newsletters;

-- Only create newsletter policy if the table exists and has required columns
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'newsletters' 
        AND column_name = 'status'
        AND table_schema = 'public'
    ) AND EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'newsletters' 
        AND column_name = 'required_tier'
        AND table_schema = 'public'
    ) THEN
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
DROP POLICY IF EXISTS "crypto_coin_mappings_authenticated_read" ON public.crypto_coin_mappings;
CREATE POLICY "crypto_coin_mappings_authenticated_read" ON public.crypto_coin_mappings
FOR SELECT TO authenticated
USING (true);