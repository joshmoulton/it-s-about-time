-- Add required_tier column to newsletters table for access control
ALTER TABLE public.newsletters 
ADD COLUMN required_tier subscription_tier DEFAULT 'free'::subscription_tier;

-- Add index for better query performance on tier filtering
CREATE INDEX idx_newsletters_required_tier ON public.newsletters(required_tier);

-- Update RLS policy for newsletters to respect tier access
DROP POLICY IF EXISTS "newsletters_public_read" ON public.newsletters;

CREATE POLICY "newsletters_tier_access" 
ON public.newsletters 
FOR SELECT 
USING (
  status = 'published' AND (
    required_tier = 'free'::subscription_tier OR
    (required_tier = 'paid'::subscription_tier AND get_current_user_tier() IN ('paid'::subscription_tier, 'premium'::subscription_tier)) OR
    (required_tier = 'premium'::subscription_tier AND get_current_user_tier() = 'premium'::subscription_tier) OR
    is_current_user_admin()
  )
);