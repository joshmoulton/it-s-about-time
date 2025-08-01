-- Add missing RLS policies for degen_call_subscriptions
CREATE POLICY "Users can view their own degen call subscription" 
ON public.degen_call_subscriptions 
FOR SELECT 
USING (user_email = (current_setting('request.jwt.claims', true)::json->>'email'));

CREATE POLICY "Users can insert their own degen call subscription" 
ON public.degen_call_subscriptions 
FOR INSERT 
WITH CHECK (user_email = (current_setting('request.jwt.claims', true)::json->>'email'));

CREATE POLICY "Users can update their own degen call subscription" 
ON public.degen_call_subscriptions 
FOR UPDATE 
USING (user_email = (current_setting('request.jwt.claims', true)::json->>'email'));

CREATE POLICY "Admins can view all degen call subscriptions" 
ON public.degen_call_subscriptions 
FOR ALL
USING (is_current_user_admin());