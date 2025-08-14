-- Fix telegram_messages RLS policies - Add missing policies for proper access control

-- Create comprehensive RLS policies for telegram_messages table
CREATE POLICY "telegram_messages_admin_full_access" 
ON public.telegram_messages 
FOR ALL 
USING (is_current_user_admin_fast())
WITH CHECK (is_current_user_admin_fast());

-- Allow premium and paid users to read telegram messages
CREATE POLICY "telegram_messages_premium_paid_read" 
ON public.telegram_messages 
FOR SELECT 
USING (
  is_current_user_admin_fast() OR 
  (is_magic_link_authenticated() AND get_user_effective_tier() = ANY(ARRAY['paid'::subscription_tier, 'premium'::subscription_tier])) OR
  ((auth.uid() IS NOT NULL) AND get_user_effective_tier() = ANY(ARRAY['paid'::subscription_tier, 'premium'::subscription_tier]))
);

-- Create supporting function to check magic link authentication
CREATE OR REPLACE FUNCTION public.is_magic_link_authenticated()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT current_setting('app.auth_method', true) = 'magic_link'
$$;

-- Create supporting function to get user effective tier
CREATE OR REPLACE FUNCTION public.get_user_effective_tier()
RETURNS subscription_tier
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT CASE 
    WHEN current_setting('app.auth_tier', true) = 'premium' THEN 'premium'::subscription_tier
    WHEN current_setting('app.auth_tier', true) = 'paid' THEN 'paid'::subscription_tier
    ELSE 'free'::subscription_tier
  END
$$;