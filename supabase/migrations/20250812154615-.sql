-- Restrict analyst_signals to paid/premium users and admins; remove public read
BEGIN;

-- Ensure RLS is enabled
ALTER TABLE public.analyst_signals ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DO $$
DECLARE r record;
BEGIN
  FOR r IN (
    SELECT policyname FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'analyst_signals'
  ) LOOP
    EXECUTE format('DROP POLICY "%I" ON public.analyst_signals', r.policyname);
  END LOOP;
END $$;

-- Admins can fully manage analyst_signals
CREATE POLICY "analyst_signals_admin_manage"
ON public.analyst_signals
FOR ALL
USING (is_current_user_admin_fast())
WITH CHECK (is_current_user_admin_fast());

-- Paid/Premium subscribers can read active signals
CREATE POLICY "analyst_signals_tier_read"
ON public.analyst_signals
FOR SELECT
USING (
  status = 'active'::text
  AND get_current_user_tier_optimized() IN ('paid'::subscription_tier, 'premium'::subscription_tier)
);

-- Signal creators (authenticated) can read their own rows (non-public)
CREATE POLICY "analyst_signals_owner_read"
ON public.analyst_signals
FOR SELECT
USING (
  auth.uid() IS NOT NULL AND created_by = auth.uid()
);

COMMIT;