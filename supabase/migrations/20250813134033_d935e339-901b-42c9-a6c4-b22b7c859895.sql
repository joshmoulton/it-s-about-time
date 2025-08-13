-- Drop conflicting and problematic RLS policies on newsletters table
DROP POLICY IF EXISTS "newsletters_public_read" ON public.newsletters;
DROP POLICY IF EXISTS "Users can view newsletters based on tier" ON public.newsletters;
DROP POLICY IF EXISTS "Newsletters tier access" ON public.newsletters;
DROP POLICY IF EXISTS "newsletters_tier_access" ON public.newsletters;

-- Create a single, secure RLS policy for newsletter access
CREATE POLICY "newsletters_secure_tier_access" 
ON public.newsletters 
FOR SELECT 
USING (
  status = 'published' AND (
    -- Free newsletters are always accessible
    required_tier = 'free' OR
    -- For paid/premium content, user must be authenticated and have proper tier
    (
      auth.uid() IS NOT NULL AND
      get_current_user_email_optimized() IS NOT NULL AND
      (
        (required_tier = 'paid' AND get_current_user_tier_optimized() = ANY(ARRAY['paid'::subscription_tier, 'premium'::subscription_tier])) OR
        (required_tier = 'premium' AND get_current_user_tier_optimized() = 'premium'::subscription_tier)
      )
    ) OR
    -- Admins can always access
    is_current_user_admin_fast()
  )
);