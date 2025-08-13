-- Fix RLS policy for degen_call_subscriptions to handle both auth methods consistently
DROP POLICY IF EXISTS "degen_subs_user_manage" ON public.degen_call_subscriptions;
DROP POLICY IF EXISTS "degen_subs_admin_read" ON public.degen_call_subscriptions;

-- Create unified RLS policies that handle both Supabase Auth and Enhanced Auth Context
CREATE POLICY "degen_call_subscriptions_user_access" 
ON public.degen_call_subscriptions 
FOR ALL 
USING (
  user_email = COALESCE(
    (SELECT email FROM auth.users WHERE id = auth.uid()),
    get_current_user_email_optimized()
  )
)
WITH CHECK (
  user_email = COALESCE(
    (SELECT email FROM auth.users WHERE id = auth.uid()),
    get_current_user_email_optimized()
  )
);

-- Admin access policy
CREATE POLICY "degen_call_subscriptions_admin_access" 
ON public.degen_call_subscriptions 
FOR ALL 
USING (is_current_user_admin_fast())
WITH CHECK (is_current_user_admin_fast());