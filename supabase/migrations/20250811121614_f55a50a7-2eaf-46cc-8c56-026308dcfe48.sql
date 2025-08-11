-- Secure the public.subscriptions table
-- 0) Ensure RLS is enabled
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- 1) Helper function to map current user to their verified Telegram user id
CREATE OR REPLACE FUNCTION public.get_current_user_telegram_id()
RETURNS bigint
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT tum.telegram_user_id
  FROM public.telegram_user_mapping tum
  WHERE tum.dashboard_email = get_current_user_email_optimized()
    AND tum.verified = true
  ORDER BY tum.updated_at DESC NULLS LAST
  LIMIT 1
$$;

-- 2) Remove overly-permissive policy if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'subscriptions' 
      AND policyname = 'Public can manage their own subscriptions'
  ) THEN
    DROP POLICY "Public can manage their own subscriptions" ON public.subscriptions;
  END IF;
END $$;

-- 3) Create strict SELECT policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'subscriptions' 
      AND policyname = 'subscriptions_admin_read'
  ) THEN
    CREATE POLICY subscriptions_admin_read
    ON public.subscriptions
    FOR SELECT
    USING (is_current_user_admin_fast());
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'subscriptions' 
      AND policyname = 'subscriptions_self_read'
  ) THEN
    CREATE POLICY subscriptions_self_read
    ON public.subscriptions
    FOR SELECT
    USING (subscriber_id = get_current_user_telegram_id());
  END IF;
END $$;

-- 4) Intentionally do not grant INSERT/UPDATE/DELETE to public; these should be handled by trusted services.
