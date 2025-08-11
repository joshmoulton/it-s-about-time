
-- Secure sentiment and social data used by premium widgets, without breaking reads
DO $$
DECLARE
  tbl text;
  pol record;
BEGIN
  -- Tables where premium users (and admins) need read access; admins/service can fully manage
  FOR tbl IN SELECT unnest(ARRAY[
    'sentiment_alerts',
    'x_posts',
    'x_sentiment_analysis',
    'highlight_topics'
  ]) LOOP
    IF to_regclass('public.'||tbl) IS NOT NULL THEN
      -- Enable RLS
      BEGIN
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', tbl);
      EXCEPTION WHEN OTHERS THEN NULL; END;

      -- Drop existing policies to avoid conflicts
      FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = tbl
      LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, tbl);
      END LOOP;

      -- SELECT for premium users and admins
      EXECUTE format(
        'CREATE POLICY %I ON public.%I FOR SELECT USING ((get_current_user_tier_optimized() = ''premium''::subscription_tier) OR is_current_user_admin_fast())',
        tbl || '_select_premium', tbl
      );

      -- Admins and service_role: full access (read/write/delete)
      EXECUTE format(
        'CREATE POLICY %I ON public.%I FOR ALL USING (is_current_user_admin_fast() OR ((auth.jwt() ->> ''role'') = ''service_role'')) WITH CHECK (is_current_user_admin_fast() OR ((auth.jwt() ->> ''role'') = ''service_role''))',
        tbl || '_admin_service_all', tbl
      );
    END IF;
  END LOOP;

  -- newsletter_blacklist: lock down fully to admin/service only
  IF to_regclass('public.newsletter_blacklist') IS NOT NULL THEN
    BEGIN
      EXECUTE 'ALTER TABLE public.newsletter_blacklist ENABLE ROW LEVEL SECURITY';
    EXCEPTION WHEN OTHERS THEN NULL; END;

    -- Drop existing policies
    FOR pol IN 
      SELECT policyname 
      FROM pg_policies 
      WHERE schemaname = 'public' AND tablename = 'newsletter_blacklist'
    LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.newsletter_blacklist', pol.policyname);
    END LOOP;

    -- Admin/service only for ALL operations (no direct public SELECTs)
    EXECUTE
      'CREATE POLICY newsletter_blacklist_admin_service_all
       ON public.newsletter_blacklist
       FOR ALL
       USING (is_current_user_admin_fast() OR ((auth.jwt() ->> ''role'') = ''service_role''))
       WITH CHECK (is_current_user_admin_fast() OR ((auth.jwt() ->> ''role'') = ''service_role''))';
  END IF;
END $$;

-- Safe, minimal RPCs for the UI filter (expose only IDs to authenticated users)
CREATE OR REPLACE FUNCTION public.get_blacklisted_newsletter_ids()
RETURNS TABLE(beehiiv_post_id text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT beehiiv_post_id
  FROM public.newsletter_blacklist
  WHERE beehiiv_post_id IS NOT NULL;
$$;

CREATE OR REPLACE FUNCTION public.is_newsletter_blacklisted(p_beehiiv_post_id text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.newsletter_blacklist
    WHERE beehiiv_post_id = p_beehiiv_post_id
  );
$$;

-- Ensure only logged-in users may call these RPCs
REVOKE ALL ON FUNCTION public.get_blacklisted_newsletter_ids() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_newsletter_blacklisted(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_blacklisted_newsletter_ids() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_newsletter_blacklisted(text) TO authenticated;
