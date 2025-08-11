-- Secure whop_authenticated_users table
-- 1) Enable Row Level Security (RLS)
ALTER TABLE public.whop_authenticated_users ENABLE ROW LEVEL SECURITY;

-- 2) Create SELECT policies
-- Admins can read all rows
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'whop_authenticated_users' 
      AND policyname = 'whop_users_admin_read'
  ) THEN
    CREATE POLICY whop_users_admin_read
    ON public.whop_authenticated_users
    FOR SELECT
    USING (is_current_user_admin_fast());
  END IF;
END $$;

-- Users can read only their own record
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'whop_authenticated_users' 
      AND policyname = 'whop_users_self_read'
  ) THEN
    CREATE POLICY whop_users_self_read
    ON public.whop_authenticated_users
    FOR SELECT
    USING (user_email = get_current_user_email_optimized());
  END IF;
END $$;

-- 3) Do not grant INSERT/UPDATE/DELETE via RLS; these should be performed by trusted server-side services only.
