-- First, clean up any duplicate user_profiles entries and fix the table structure
DELETE FROM public.user_profiles 
WHERE id IN (
    SELECT id 
    FROM (
        SELECT id, ROW_NUMBER() OVER (PARTITION BY user_email ORDER BY created_at DESC) as rn
        FROM public.user_profiles
    ) t 
    WHERE t.rn > 1
);

-- Now create the unique index safely
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_profiles_email 
ON public.user_profiles(user_email);

-- Fix the newsletter RLS policy to prevent ambiguous column references
DROP POLICY IF EXISTS "Users can view newsletters based on tier" ON public.newsletters;

CREATE POLICY "Users can view newsletters based on tier"
ON public.newsletters
FOR SELECT
USING (
  newsletters.status = 'published' AND (
    newsletters.required_tier = 'free' OR
    (newsletters.required_tier = 'paid' AND get_current_user_tier() IN ('paid', 'premium')) OR
    (newsletters.required_tier = 'premium' AND get_current_user_tier() = 'premium') OR
    is_current_user_admin_fast()
  )
);