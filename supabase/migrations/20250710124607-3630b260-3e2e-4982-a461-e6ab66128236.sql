-- Find and remove all BeehiIV-related triggers and functions properly

-- Drop all auth.users triggers that reference BeehiIV functions
DROP TRIGGER IF EXISTS trigger_sync_new_user_to_beehiiv ON auth.users CASCADE;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users CASCADE;
DROP TRIGGER IF EXISTS trigger_handle_email_confirmation ON auth.users CASCADE;

-- Now safely drop the functions
DROP FUNCTION IF EXISTS public.sync_new_user_to_beehiiv() CASCADE;
DROP FUNCTION IF EXISTS public.handle_email_confirmation() CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- Drop BeehiIV auth-related tables
DROP TABLE IF EXISTS public.beehiiv_sync_jobs CASCADE;
DROP TABLE IF EXISTS public.beehiiv_sync_failures CASCADE;
DROP TABLE IF EXISTS public.beehiiv_webhook_logs CASCADE;

-- Clean up the beehiiv_subscribers table
ALTER TABLE public.beehiiv_subscribers 
DROP COLUMN IF EXISTS last_login_at,
DROP COLUMN IF EXISTS last_webhook_update,
DROP COLUMN IF EXISTS webhook_version,
DROP COLUMN IF EXISTS sync_source,
DROP COLUMN IF EXISTS beehiiv_id,
DROP COLUMN IF EXISTS beehiiv_subscriber_id,
DROP COLUMN IF EXISTS beehiiv_data,
DROP COLUMN IF EXISTS last_synced_at;

-- Update admin function to remove BeehiIV subscriber dependency
CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.admin_users au
    WHERE au.is_active = TRUE
    AND (
      -- Check via direct email (for Supabase admins)
      (au.email IS NOT NULL AND au.email = current_setting('request.jwt.claims', true)::json->>'email')
      OR
      -- Check if Whop authenticated user's email matches any admin email
      (EXISTS (
        SELECT 1 FROM public.whop_authenticated_users wau
        WHERE wau.user_email = current_setting('request.jwt.claims', true)::json->>'email'
        AND EXISTS (
          SELECT 1 FROM public.admin_users au2 
          WHERE au2.is_active = TRUE 
          AND au2.email = current_setting('request.jwt.claims', true)::json->>'email'
        )
      ))
    )
  );
END;
$$;

-- Clean up BeehiIV-related RLS policies
DROP POLICY IF EXISTS "Admin users can view all subscribers" ON public.beehiiv_subscribers;
DROP POLICY IF EXISTS "Authenticated users can view subscriber data" ON public.beehiiv_subscribers;
DROP POLICY IF EXISTS "Public can read subscriber data by email" ON public.beehiiv_subscribers;
DROP POLICY IF EXISTS "Service role can access all subscriber data" ON public.beehiiv_subscribers;
DROP POLICY IF EXISTS "Users can update their own subscriber data" ON public.beehiiv_subscribers;

-- Create simple policy for newsletter content
CREATE POLICY "Anyone can view newsletter subscribers for content" 
ON public.beehiiv_subscribers 
FOR SELECT 
USING (true);

-- Remove other BeehiIV functions
DROP FUNCTION IF EXISTS public.setup_beehiiv_daily_sync() CASCADE;
DROP FUNCTION IF EXISTS public.cleanup_old_sync_jobs() CASCADE;