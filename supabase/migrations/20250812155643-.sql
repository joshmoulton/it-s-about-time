BEGIN;

-- admin_users: restrict SELECT to super admins
DO $$
DECLARE pol record;
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='admin_users') THEN
    ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

    IF EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE schemaname='public' AND tablename='admin_users' AND policyname='admin_users_read'
    ) THEN
      EXECUTE 'DROP POLICY "admin_users_read" ON public.admin_users';
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE schemaname='public' AND tablename='admin_users' AND policyname='admin_users_read_superadmins'
    ) THEN
      EXECUTE 'CREATE POLICY "admin_users_read_superadmins" ON public.admin_users FOR SELECT USING (has_admin_role(''super_admin''::text))';
    END IF;
  END IF;
END$$;

-- admin_audit_log: restrict SELECT to super admins
DO $$
DECLARE pol record;
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='admin_audit_log') THEN
    ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

    IF EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE schemaname='public' AND tablename='admin_audit_log' AND policyname='auth_audit_admin_read'
    ) THEN
      EXECUTE 'DROP POLICY "auth_audit_admin_read" ON public.admin_audit_log';
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE schemaname='public' AND tablename='admin_audit_log' AND policyname='auth_audit_super_admin_read'
    ) THEN
      EXECUTE 'CREATE POLICY "auth_audit_super_admin_read" ON public.admin_audit_log FOR SELECT USING (has_admin_role(''super_admin''::text))';
    END IF;
  END IF;
END$$;

-- role_permissions: super admin only (if table exists)
DO $$
DECLARE pol record;
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='role_permissions') THEN
    ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

    FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='role_permissions' LOOP
      EXECUTE format('DROP POLICY "%I" ON public.role_permissions', pol.policyname);
    END LOOP;

    EXECUTE 'CREATE POLICY "role_permissions_super_admin_all" ON public.role_permissions FOR ALL USING (has_admin_role(''super_admin''::text)) WITH CHECK (has_admin_role(''super_admin''::text))';
  END IF;
END$$;

-- system_settings: super admin only
DO $$
DECLARE pol record;
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='system_settings') THEN
    ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

    FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='system_settings' LOOP
      EXECUTE format('DROP POLICY "%I" ON public.system_settings', pol.policyname);
    END LOOP;

    EXECUTE 'CREATE POLICY "system_settings_super_admin_read" ON public.system_settings FOR SELECT USING (has_admin_role(''super_admin''::text))';
    EXECUTE 'CREATE POLICY "system_settings_super_admin_write" ON public.system_settings FOR ALL USING (has_admin_role(''super_admin''::text)) WITH CHECK (has_admin_role(''super_admin''::text))';
  END IF;
END$$;

COMMIT;