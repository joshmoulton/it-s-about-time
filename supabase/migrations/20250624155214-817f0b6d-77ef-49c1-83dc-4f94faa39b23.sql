
-- Fix RLS issues for tables that should have RLS enabled
ALTER TABLE public.beehiiv_sync_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.beehiiv_sync_failures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.beehiiv_webhook_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for beehiiv_sync_jobs (admin access only)
CREATE POLICY "Admin users can view sync jobs"
  ON public.beehiiv_sync_jobs
  FOR SELECT
  TO authenticated
  USING (public.is_current_user_admin());

CREATE POLICY "Admin users can manage sync jobs"
  ON public.beehiiv_sync_jobs
  FOR ALL
  TO authenticated
  USING (public.is_current_user_admin());

-- Create RLS policies for beehiiv_sync_failures (admin access only)
CREATE POLICY "Admin users can view sync failures"
  ON public.beehiiv_sync_failures
  FOR SELECT
  TO authenticated
  USING (public.is_current_user_admin());

CREATE POLICY "Admin users can manage sync failures"
  ON public.beehiiv_sync_failures
  FOR ALL
  TO authenticated
  USING (public.is_current_user_admin());

-- Create RLS policies for beehiiv_webhook_logs (admin access only)
CREATE POLICY "Admin users can view webhook logs"
  ON public.beehiiv_webhook_logs
  FOR SELECT
  TO authenticated
  USING (public.is_current_user_admin());

CREATE POLICY "Admin users can manage webhook logs"
  ON public.beehiiv_webhook_logs
  FOR ALL
  TO authenticated
  USING (public.is_current_user_admin());

-- Fix RLS policies for tables that have RLS enabled but no policies
CREATE POLICY "Anyone can view published articles"
  ON public.articles
  FOR SELECT
  TO public
  USING (status = 'published');

CREATE POLICY "Admin users can manage articles"
  ON public.articles
  FOR ALL
  TO authenticated
  USING (public.is_current_user_admin());

-- Create policies for content_analytics (users can view their own data)
CREATE POLICY "Users can view their own analytics"
  ON public.content_analytics
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own analytics"
  ON public.content_analytics
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Create policies for course_modules (based on course access)
CREATE POLICY "Anyone can view published course modules"
  ON public.course_modules
  FOR SELECT
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM public.courses 
      WHERE id = course_id 
      AND status = 'published'
    )
  );

CREATE POLICY "Admin users can manage course modules"
  ON public.course_modules
  FOR ALL
  TO authenticated
  USING (public.is_current_user_admin());

-- Update the is_current_user_admin function to handle both subscriber-linked and standalone admins
CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.admin_users au
    WHERE au.is_active = TRUE
    AND (
      -- Check via beehiiv subscriber
      (au.subscriber_id IS NOT NULL AND au.subscriber_id = (
        SELECT id FROM public.beehiiv_subscribers 
        WHERE email = current_setting('request.jwt.claims', true)::json->>'email'
      ))
      OR
      -- Check via direct email
      (au.email IS NOT NULL AND au.email = current_setting('request.jwt.claims', true)::json->>'email')
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Fix function search path issues by making functions STABLE where appropriate
CREATE OR REPLACE FUNCTION public.get_current_user_tier()
RETURNS subscription_tier AS $$
BEGIN
  RETURN (
    SELECT bs.subscription_tier 
    FROM public.beehiiv_subscribers bs
    WHERE bs.email = current_setting('request.jwt.calls', true)::json->>'email'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;
