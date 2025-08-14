-- Fix RLS policies to use proper get_current_user_tier_optimized() function instead of insecure user_metadata

-- Update analyst_signals RLS policy to use secure function
DROP POLICY IF EXISTS "analyst_signals_authenticated_users" ON public.analyst_signals;
CREATE POLICY "analyst_signals_authenticated_users" 
ON public.analyst_signals 
FOR SELECT 
TO authenticated
USING (
  (status = 'active') AND (
    is_current_user_admin_fast() OR 
    (get_current_user_tier_optimized() = ANY (ARRAY['premium'::subscription_tier, 'paid'::subscription_tier])) OR
    (created_by = auth.uid())
  )
);

-- Update telegram_messages RLS policy if it exists and uses insecure user_metadata
-- This ensures premium users can access chat highlights and other telegram-based features
DO $$
BEGIN
  -- Check if telegram_messages table exists and update its RLS policy
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'telegram_messages' AND table_schema = 'public') THEN
    -- Drop existing policies that might use insecure metadata
    DROP POLICY IF EXISTS "telegram_messages_premium_access" ON public.telegram_messages;
    
    -- Create secure policy using proper tier function
    CREATE POLICY "telegram_messages_premium_access" 
    ON public.telegram_messages 
    FOR SELECT 
    TO authenticated
    USING (
      is_current_user_admin_fast() OR 
      (get_current_user_tier_optimized() = ANY (ARRAY['premium'::subscription_tier, 'paid'::subscription_tier]))
    );
  END IF;
END $$;