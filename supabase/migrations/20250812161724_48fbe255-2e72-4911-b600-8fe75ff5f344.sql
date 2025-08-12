
BEGIN;

-- Ensure RLS is enabled
ALTER TABLE public.notification_templates ENABLE ROW LEVEL SECURITY;

-- Drop the public read policy if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='public' AND tablename='notification_templates' AND policyname='templates_public_read'
  ) THEN
    EXECUTE 'DROP POLICY "templates_public_read" ON public.notification_templates';
  END IF;
END$$;

-- Create admin-only read policy (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='public' AND tablename='notification_templates' AND policyname='templates_admin_read'
  ) THEN
    EXECUTE 'CREATE POLICY "templates_admin_read" ON public.notification_templates FOR SELECT USING (is_current_user_admin_fast())';
  END IF;
END$$;

-- Ensure admin manage policy exists (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='public' AND tablename='notification_templates' AND policyname='templates_admin_manage'
  ) THEN
    EXECUTE 'CREATE POLICY "templates_admin_manage" ON public.notification_templates FOR ALL USING (is_current_user_admin_fast()) WITH CHECK (is_current_user_admin_fast())';
  END IF;
END$$;

COMMIT;
