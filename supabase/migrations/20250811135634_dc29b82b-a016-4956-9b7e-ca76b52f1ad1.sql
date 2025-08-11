-- Secure system_settings to prevent exposure of secrets
DO $$
DECLARE
  p RECORD;
BEGIN
  -- 1) Ensure RLS is enabled
  BEGIN
    EXECUTE 'ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY';
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;

  -- 2) Drop existing policies to remove public read
  FOR p IN 
    SELECT policyname 
    FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'system_settings'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.system_settings', p.policyname);
  END LOOP;

  -- 3) Admins: full access (read/write/delete)
  EXECUTE 'CREATE POLICY "system_settings_admin_all" 
           ON public.system_settings 
           FOR ALL 
           USING (is_current_user_admin_fast()) 
           WITH CHECK (is_current_user_admin_fast())';

  -- 4) Service role: full access for backend/edge functions
  EXECUTE 'CREATE POLICY "system_settings_service_all" 
           ON public.system_settings 
           FOR ALL 
           USING (((auth.jwt() ->> ''role'') = ''service_role'')) 
           WITH CHECK (((auth.jwt() ->> ''role'') = ''service_role''))';
END $$;