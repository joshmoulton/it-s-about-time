-- Fix the RLS policy by removing direct auth.users access
DROP POLICY IF EXISTS "degen_call_subscriptions_user_access" ON degen_call_subscriptions;

CREATE POLICY "degen_call_subscriptions_user_access" 
ON degen_call_subscriptions 
FOR ALL 
USING (
    -- Admin access
    is_current_user_admin_fast() OR
    -- User access using only the optimized function (no direct auth.users access)
    (user_email = get_current_user_email_optimized())
)
WITH CHECK (
    -- Admin access
    is_current_user_admin_fast() OR
    -- User access using only the optimized function (no direct auth.users access)
    (user_email = get_current_user_email_optimized())
);