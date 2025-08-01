-- Clean up conflicting RLS policies for degen_call_subscriptions
DROP POLICY IF EXISTS "Admins can manage all degen subscriptions" ON public.degen_call_subscriptions;
DROP POLICY IF EXISTS "Users can manage their own degen subscriptions" ON public.degen_call_subscriptions;

-- The remaining policies should be sufficient:
-- "Users can view their own degen call subscription" (SELECT)
-- "Users can insert their own degen call subscription" (INSERT) 
-- "Users can update their own degen call subscription" (UPDATE)
-- "Admins can view all degen call subscriptions" (ALL)