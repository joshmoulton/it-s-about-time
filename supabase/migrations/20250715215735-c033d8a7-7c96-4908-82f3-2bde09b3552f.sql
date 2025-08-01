-- Fix RLS policy for newsletters to allow unauthenticated users to see free newsletters
DROP POLICY IF EXISTS "newsletters_tier_access" ON public.newsletters;

CREATE POLICY "newsletters_tier_access" 
ON public.newsletters 
FOR SELECT 
USING (
  status = 'published' AND (
    -- Free newsletters are accessible to everyone (authenticated or not)
    required_tier = 'free'::subscription_tier OR
    -- Paid/premium newsletters require authentication and appropriate tier
    (auth.uid() IS NOT NULL AND (
      (required_tier = 'paid'::subscription_tier AND get_current_user_tier() IN ('paid'::subscription_tier, 'premium'::subscription_tier)) OR
      (required_tier = 'premium'::subscription_tier AND get_current_user_tier() = 'premium'::subscription_tier) OR
      is_current_user_admin()
    ))
  )
);