-- Secure telegram_community_access RLS and remove public read access (fixed DO quoting)
DO $$
DECLARE
  p RECORD;
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'public' AND tablename = 'telegram_community_access'
  ) THEN
    -- Enable RLS
    BEGIN
      EXECUTE 'ALTER TABLE public.telegram_community_access ENABLE ROW LEVEL SECURITY';
    EXCEPTION WHEN OTHERS THEN
      NULL;
    END;

    -- Drop all existing policies
    FOR p IN 
      SELECT policyname 
      FROM pg_policies 
      WHERE schemaname = 'public' AND tablename = 'telegram_community_access'
    LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.telegram_community_access', p.policyname);
    END LOOP;

    -- Admins: full access
    EXECUTE 'CREATE POLICY "telegram_community_access_admin_all" ON public.telegram_community_access FOR ALL USING (is_current_user_admin_fast()) WITH CHECK (is_current_user_admin_fast())';

    -- Users: read own records only
    EXECUTE 'CREATE POLICY "telegram_community_access_user_read" ON public.telegram_community_access FOR SELECT USING (user_email = get_current_user_email_optimized())';

    -- Service role / admins: writes
    EXECUTE 'CREATE POLICY "telegram_community_access_service_insert" ON public.telegram_community_access FOR INSERT WITH CHECK (((auth.jwt() ->> ''role'') = ''service_role'') OR is_current_user_admin_fast())';

    EXECUTE 'CREATE POLICY "telegram_community_access_service_update" ON public.telegram_community_access FOR UPDATE USING (((auth.jwt() ->> ''role'') = ''service_role'') OR is_current_user_admin_fast()) WITH CHECK (((auth.jwt() ->> ''role'') = ''service_role'') OR is_current_user_admin_fast())';

    EXECUTE 'CREATE POLICY "telegram_community_access_service_delete" ON public.telegram_community_access FOR DELETE USING (((auth.jwt() ->> ''role'') = ''service_role'') OR is_current_user_admin_fast())';
  END IF;
END $$;