-- Fix RLS policies for telegram_messages to be more direct and avoid complex function calls

-- Drop existing problematic policies
DROP POLICY IF EXISTS "telegram_messages_admin_access" ON public.telegram_messages;
DROP POLICY IF EXISTS "telegram_messages_admin_service_all" ON public.telegram_messages;
DROP POLICY IF EXISTS "telegram_messages_tier_access" ON public.telegram_messages;

-- Create simpler, more direct policies using auth.uid() and auth.email()
CREATE POLICY "telegram_messages_authenticated_premium_users" 
ON public.telegram_messages 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL 
  AND (
    -- Check if user is in admin_users table
    EXISTS (
      SELECT 1 FROM public.admin_users 
      WHERE email = auth.email() AND is_active = true
    )
    OR
    -- Check if user has premium/paid tier in beehiiv_subscribers
    EXISTS (
      SELECT 1 FROM public.beehiiv_subscribers 
      WHERE email = auth.email() 
      AND subscription_tier IN ('premium', 'paid')
    )
    OR
    -- Check if user has premium tier in auth metadata
    (auth.jwt() -> 'user_metadata' ->> 'subscription_tier') IN ('premium', 'paid')
  )
);

-- Fix RLS policies for analyst_signals to be more direct
DROP POLICY IF EXISTS "analyst_signals_admin_manage" ON public.analyst_signals;
DROP POLICY IF EXISTS "analyst_signals_owner_read" ON public.analyst_signals;
DROP POLICY IF EXISTS "analyst_signals_tier_read" ON public.analyst_signals;

-- Create simpler policy for analyst_signals
CREATE POLICY "analyst_signals_authenticated_users" 
ON public.analyst_signals 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL 
  AND status = 'active'
  AND (
    -- Check if user is admin
    EXISTS (
      SELECT 1 FROM public.admin_users 
      WHERE email = auth.email() AND is_active = true
    )
    OR
    -- Check if user has premium/paid tier in beehiiv_subscribers
    EXISTS (
      SELECT 1 FROM public.beehiiv_subscribers 
      WHERE email = auth.email() 
      AND subscription_tier IN ('premium', 'paid')
    )
    OR
    -- Check if user has premium tier in auth metadata
    (auth.jwt() -> 'user_metadata' ->> 'subscription_tier') IN ('premium', 'paid')
    OR
    -- Allow access to own created signals
    created_by = auth.uid()
  )
);

-- Add admin management policy for analyst_signals
CREATE POLICY "analyst_signals_admin_all" 
ON public.analyst_signals 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE email = auth.email() AND is_active = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE email = auth.email() AND is_active = true
  )
);