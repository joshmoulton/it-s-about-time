-- Simplify BeehiIV integration: Remove auth system, keep newsletter sync only

-- Drop BeehiIV auth-related tables and functions that are no longer needed
DROP TABLE IF EXISTS public.beehiiv_sync_jobs CASCADE;
DROP TABLE IF EXISTS public.beehiiv_sync_failures CASCADE;
DROP TABLE IF EXISTS public.beehiiv_webhook_logs CASCADE;

-- Clean up the beehiiv_subscribers table to keep only essential newsletter data
-- Remove auth-related columns and keep only what's needed for newsletter display
ALTER TABLE public.beehiiv_subscribers 
DROP COLUMN IF EXISTS last_login_at,
DROP COLUMN IF EXISTS last_webhook_update,
DROP COLUMN IF EXISTS webhook_version,
DROP COLUMN IF EXISTS sync_source,
DROP COLUMN IF EXISTS beehiiv_id,
DROP COLUMN IF EXISTS beehiiv_subscriber_id,
DROP COLUMN IF EXISTS beehiiv_data,
DROP COLUMN IF EXISTS last_synced_at;

-- Update the admin function to not rely on BeehiIV subscribers for admin checks
-- Keep it focused on direct admin_users table and Whop authentication
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

-- Remove BeehiIV-related RLS policies from beehiiv_subscribers
DROP POLICY IF EXISTS "Admin users can view all subscribers" ON public.beehiiv_subscribers;
DROP POLICY IF EXISTS "Authenticated users can view subscriber data" ON public.beehiiv_subscribers;
DROP POLICY IF EXISTS "Public can read subscriber data by email" ON public.beehiiv_subscribers;
DROP POLICY IF EXISTS "Service role can access all subscriber data" ON public.beehiiv_subscribers;
DROP POLICY IF EXISTS "Users can update their own subscriber data" ON public.beehiiv_subscribers;

-- Create simple policy for newsletter content only
CREATE POLICY "Anyone can view newsletter subscribers for content" 
ON public.beehiiv_subscribers 
FOR SELECT 
USING (true);

-- Remove BeehiIV subscriber triggers that are no longer needed
DROP TRIGGER IF EXISTS sync_new_user_to_beehiiv ON auth.users;
DROP TRIGGER IF EXISTS handle_email_confirmation ON auth.users;
DROP FUNCTION IF EXISTS public.sync_new_user_to_beehiiv();
DROP FUNCTION IF EXISTS public.handle_email_confirmation();

-- Remove cron jobs for BeehiIV sync (if they exist)
SELECT cron.unschedule('beehiiv-daily-sync') WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'beehiiv-daily-sync');
SELECT cron.unschedule('beehiiv-incremental-sync') WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'beehiiv-incremental-sync');

-- Clean up any remaining BeehiIV functions
DROP FUNCTION IF EXISTS public.setup_beehiiv_daily_sync();
DROP FUNCTION IF EXISTS public.cleanup_old_sync_jobs();

-- Keep newsletters table as-is since it contains the actual content we want to display