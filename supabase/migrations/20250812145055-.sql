-- Tighten RLS for admin session tables to prevent hijacking risks
-- 1) admin_2fa_sessions: restrict to self-only for app clients
-- 2) admin_secure_sessions: restrict to self-only for app clients (remove super_admin blanket bypass)
-- Edge functions using service role can still perform broader operations as needed.

BEGIN;

-- Ensure RLS is enabled
ALTER TABLE public.admin_2fa_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_secure_sessions ENABLE ROW LEVEL SECURITY;

-- Drop overly broad policies if they exist
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'admin_2fa_sessions' 
      AND policyname = 'admin_2fa_sessions_consolidated'
  ) THEN
    EXECUTE 'DROP POLICY "admin_2fa_sessions_consolidated" ON public.admin_2fa_sessions';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'admin_secure_sessions' 
      AND policyname = 'admin_secure_sessions_self_access'
  ) THEN
    EXECUTE 'DROP POLICY "admin_secure_sessions_self_access" ON public.admin_secure_sessions';
  END IF;
END $$;

-- Recreate granular, least-privilege policies for admin_2fa_sessions
CREATE POLICY "admin_2fa_sessions_select_own"
ON public.admin_2fa_sessions
FOR SELECT
USING (admin_email = get_current_user_email_optimized());

CREATE POLICY "admin_2fa_sessions_insert_own"
ON public.admin_2fa_sessions
FOR INSERT
WITH CHECK (admin_email = get_current_user_email_optimized());

CREATE POLICY "admin_2fa_sessions_update_own"
ON public.admin_2fa_sessions
FOR UPDATE
USING (admin_email = get_current_user_email_optimized())
WITH CHECK (admin_email = get_current_user_email_optimized());

-- Recreate granular, least-privilege policies for admin_secure_sessions
CREATE POLICY "admin_secure_sessions_select_own"
ON public.admin_secure_sessions
FOR SELECT
USING (admin_email = get_current_user_email_optimized());

CREATE POLICY "admin_secure_sessions_insert_own"
ON public.admin_secure_sessions
FOR INSERT
WITH CHECK (admin_email = get_current_user_email_optimized());

CREATE POLICY "admin_secure_sessions_update_own"
ON public.admin_secure_sessions
FOR UPDATE
USING (admin_email = get_current_user_email_optimized())
WITH CHECK (admin_email = get_current_user_email_optimized());

COMMIT;