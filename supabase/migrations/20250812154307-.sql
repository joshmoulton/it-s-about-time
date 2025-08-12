-- Secure newsletters access with tier-based RLS
BEGIN;

-- Ensure RLS is enabled on newsletters
ALTER TABLE public.newsletters ENABLE ROW LEVEL SECURITY;

-- Drop existing policies on newsletters to avoid conflicts
DO $$
DECLARE r record;
BEGIN
  FOR r IN (
    SELECT policyname FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'newsletters'
  ) LOOP
    EXECUTE format('DROP POLICY "%I" ON public.newsletters', r.policyname);
  END LOOP;
END $$;

-- Admins can fully manage newsletters
CREATE POLICY "newsletters_admin_manage"
ON public.newsletters
FOR ALL
USING (is_current_user_admin_fast())
WITH CHECK (is_current_user_admin_fast());

-- Tier-based read access for published newsletters only
CREATE POLICY "newsletters_tier_access"
ON public.newsletters
FOR SELECT
USING (
  status = 'published'::text
  AND (published_at IS NULL OR published_at <= now())
  AND (
    COALESCE(required_tier, 'free'::subscription_tier) = 'free'::subscription_tier
    OR (
      COALESCE(required_tier, 'free'::subscription_tier) = 'paid'::subscription_tier 
      AND get_current_user_tier_optimized() IN ('paid'::subscription_tier, 'premium'::subscription_tier)
    )
    OR (
      COALESCE(required_tier, 'free'::subscription_tier) = 'premium'::subscription_tier 
      AND get_current_user_tier_optimized() = 'premium'::subscription_tier
    )
  )
);

COMMIT;