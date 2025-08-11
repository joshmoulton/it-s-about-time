-- Secure Telegram- and sentiment-related tables without breaking premium widgets
DO $$
DECLARE
  tbl text;
  pol record;
BEGIN
  -- Tables where premium users (and admins) need read access
  FOR tbl IN SELECT unnest(ARRAY[
    'telegram_messages',
    'telegram_topics',
    'telegram_sentiment_analysis',
    'sentiment_trends',
    'telegram_topic_mappings'
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

  -- Operational tables: admin/service only (no premium read)
  FOR tbl IN SELECT unnest(ARRAY[
    'telegram_sync_status',
    'telegram_topic_discovery'
  ]) LOOP
    IF to_regclass('public.'||tbl) IS NOT NULL THEN
      -- Enable RLS
      BEGIN
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', tbl);
      EXCEPTION WHEN OTHERS THEN NULL; END;

      -- Drop existing policies
      FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = tbl
      LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, tbl);
      END LOOP;

      -- Admins and service_role only
      EXECUTE format(
        'CREATE POLICY %I ON public.%I FOR ALL USING (is_current_user_admin_fast() OR ((auth.jwt() ->> ''role'') = ''service_role'')) WITH CHECK (is_current_user_admin_fast() OR ((auth.jwt() ->> ''role'') = ''service_role''))',
        tbl || '_admin_service_all', tbl
      );
    END IF;
  END LOOP;
END $$;
