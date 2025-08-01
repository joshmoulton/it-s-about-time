-- Fix Supabase RLS Policy Issues - Comprehensive cleanup and optimization

-- First, let's fix the auth function issues by ensuring we use proper security definer functions
-- Most of these are already created, but let's make sure they're optimized

-- 1. Fix Multiple Permissive Policies by dropping conflicting policies and creating consolidated ones

-- Fix admin_2fa_secrets table
DROP POLICY IF EXISTS "2FA secrets access policy" ON public.admin_2fa_secrets;
DROP POLICY IF EXISTS "Admins can insert their own 2FA secrets" ON public.admin_2fa_secrets;
DROP POLICY IF EXISTS "Admins can update their own 2FA secrets" ON public.admin_2fa_secrets;

CREATE POLICY "Admin 2FA secrets management" ON public.admin_2fa_secrets
FOR ALL USING (
  admin_email = get_current_user_email() OR has_admin_role('super_admin')
)
WITH CHECK (
  admin_email = get_current_user_email() OR has_admin_role('super_admin')
);

-- Fix admin_2fa_sessions table - consolidate policies
DROP POLICY IF EXISTS "Admin 2FA sessions policy" ON public.admin_2fa_sessions;

CREATE POLICY "Admin 2FA sessions management" ON public.admin_2fa_sessions
FOR ALL USING (
  admin_email = get_current_user_email() OR has_admin_role('super_admin')
)
WITH CHECK (
  admin_email = get_current_user_email() OR has_admin_role('super_admin')
);

-- Fix admin_audit_log table
DROP POLICY IF EXISTS "Admins can view their own audit logs" ON public.admin_audit_log;
DROP POLICY IF EXISTS "Super admins can view all audit logs" ON public.admin_audit_log;
DROP POLICY IF EXISTS "System can insert audit logs" ON public.admin_audit_log;

CREATE POLICY "Admin audit log access" ON public.admin_audit_log
FOR SELECT USING (
  user_email = get_current_user_email() OR has_admin_role('super_admin')
);

CREATE POLICY "System audit log insert" ON public.admin_audit_log
FOR INSERT WITH CHECK (true);

-- Fix admin_device_auth table
DROP POLICY IF EXISTS "Admins can manage their own devices" ON public.admin_device_auth;
DROP POLICY IF EXISTS "Admins can view their own devices" ON public.admin_device_auth;
DROP POLICY IF EXISTS "Super admins can manage all devices" ON public.admin_device_auth;

CREATE POLICY "Admin device management" ON public.admin_device_auth
FOR ALL USING (
  admin_email = get_current_user_email() OR has_admin_role('super_admin')
)
WITH CHECK (
  admin_email = get_current_user_email() OR has_admin_role('super_admin')
);

-- Fix admin_users table
DROP POLICY IF EXISTS "Enhanced admins can view active admin users" ON public.admin_users;
DROP POLICY IF EXISTS "Enhanced only super admins can delete admin users during busine" ON public.admin_users;
DROP POLICY IF EXISTS "Enhanced super admins can create admin users during business ho" ON public.admin_users;
DROP POLICY IF EXISTS "Enhanced super admins can update admin users" ON public.admin_users;
DROP POLICY IF EXISTS "Enhanced super admins can view all admin users" ON public.admin_users;

CREATE POLICY "Admin users read access" ON public.admin_users
FOR SELECT USING (
  (has_admin_role('admin') AND is_active = true) OR 
  has_admin_role('super_admin')
);

CREATE POLICY "Admin users write access" ON public.admin_users
FOR INSERT WITH CHECK (
  has_admin_role('super_admin') AND is_business_hours()
);

CREATE POLICY "Admin users update access" ON public.admin_users
FOR UPDATE USING (has_admin_role('super_admin'))
WITH CHECK (has_admin_role('super_admin'));

CREATE POLICY "Admin users delete access" ON public.admin_users
FOR DELETE USING (
  has_admin_role('super_admin') AND is_business_hours()
);

-- Fix analyst_signals table
DROP POLICY IF EXISTS "Admin users can manage analyst signals" ON public.analyst_signals;
DROP POLICY IF EXISTS "Users can view active analyst signals" ON public.analyst_signals;

CREATE POLICY "Analyst signals read" ON public.analyst_signals
FOR SELECT USING (status = 'active' OR is_current_user_admin());

CREATE POLICY "Analyst signals management" ON public.analyst_signals
FOR ALL USING (is_current_user_admin())
WITH CHECK (is_current_user_admin());

-- Fix analysts table
DROP POLICY IF EXISTS "Admins can manage analysts" ON public.analysts;
DROP POLICY IF EXISTS "Anyone can view active analysts" ON public.analysts;

CREATE POLICY "Analysts read" ON public.analysts
FOR SELECT USING (is_active = true OR is_current_user_admin());

CREATE POLICY "Analysts management" ON public.analysts
FOR ALL USING (is_current_user_admin())
WITH CHECK (is_current_user_admin());

-- Fix articles table
DROP POLICY IF EXISTS "Admin users can manage articles" ON public.articles;
DROP POLICY IF EXISTS "Anyone can view published articles" ON public.articles;

CREATE POLICY "Articles read" ON public.articles
FOR SELECT USING (status = 'published' OR is_current_user_admin());

CREATE POLICY "Articles management" ON public.articles
FOR ALL USING (is_current_user_admin())
WITH CHECK (is_current_user_admin());

-- Fix beehiiv_subscribers table
DROP POLICY IF EXISTS "Enhanced only super admins can modify subscribers" ON public.beehiiv_subscribers;
DROP POLICY IF EXISTS "Enhanced prevent subscriber deletion except during business hou" ON public.beehiiv_subscribers;
DROP POLICY IF EXISTS "Super admins can view all subscribers for dashboard stats" ON public.beehiiv_subscribers;

CREATE POLICY "Subscribers read access" ON public.beehiiv_subscribers
FOR SELECT USING (
  has_admin_role('super_admin') OR 
  (has_admin_role('admin') AND email = get_current_user_email())
);

CREATE POLICY "Subscribers update access" ON public.beehiiv_subscribers
FOR UPDATE USING (
  has_admin_role('super_admin') OR email = get_current_user_email()
)
WITH CHECK (
  has_admin_role('super_admin') OR email = get_current_user_email()
);

CREATE POLICY "Subscribers delete access" ON public.beehiiv_subscribers
FOR DELETE USING (
  has_admin_role('super_admin') AND is_business_hours()
);

-- Fix comment_votes table
DROP POLICY IF EXISTS "Users can manage their own votes" ON public.comment_votes;

CREATE POLICY "Comment votes management" ON public.comment_votes
FOR ALL USING (user_email = get_current_user_email())
WITH CHECK (user_email = get_current_user_email());

-- Fix courses table
DROP POLICY IF EXISTS "Admins can manage courses" ON public.courses;
DROP POLICY IF EXISTS "Users can view published courses" ON public.courses;

CREATE POLICY "Courses read" ON public.courses
FOR SELECT USING (
  (status = 'published' AND (
    (required_tier = 'free') OR
    (required_tier = 'paid' AND get_current_user_tier() IN ('paid', 'premium')) OR
    (required_tier = 'premium' AND get_current_user_tier() = 'premium')
  )) OR 
  is_current_user_admin()
);

CREATE POLICY "Courses management" ON public.courses
FOR ALL USING (is_current_user_admin())
WITH CHECK (is_current_user_admin());

-- Fix analyst_degen_subscriptions table
DROP POLICY IF EXISTS "Admins can view all analyst subscriptions" ON public.analyst_degen_subscriptions;
DROP POLICY IF EXISTS "Users can delete their own analyst subscriptions" ON public.analyst_degen_subscriptions;
DROP POLICY IF EXISTS "Users can insert their own analyst subscriptions" ON public.analyst_degen_subscriptions;
DROP POLICY IF EXISTS "Users can update their own analyst subscriptions" ON public.analyst_degen_subscriptions;
DROP POLICY IF EXISTS "Users can view their own analyst subscriptions" ON public.analyst_degen_subscriptions;

CREATE POLICY "Analyst degen subscriptions user access" ON public.analyst_degen_subscriptions
FOR ALL USING (
  user_email = get_current_user_email() OR is_current_user_admin()
)
WITH CHECK (
  user_email = get_current_user_email() OR is_current_user_admin()
);

-- Fix analyst_call_detections table
DROP POLICY IF EXISTS "Admins can manage analyst call detections" ON public.analyst_call_detections;
DROP POLICY IF EXISTS "Service role can create detections" ON public.analyst_call_detections;

CREATE POLICY "Analyst call detections read" ON public.analyst_call_detections
FOR SELECT USING (is_current_user_admin());

CREATE POLICY "Analyst call detections write" ON public.analyst_call_detections
FOR INSERT WITH CHECK (true); -- Allow service role inserts

CREATE POLICY "Analyst call detections update" ON public.analyst_call_detections
FOR UPDATE USING (is_current_user_admin())
WITH CHECK (is_current_user_admin());

CREATE POLICY "Analyst call detections delete" ON public.analyst_call_detections
FOR DELETE USING (is_current_user_admin());

-- Fix crypto_alerts table - remove conflicting policies if any exist
DROP POLICY IF EXISTS "Crypto alerts user access" ON public.crypto_alerts;

CREATE POLICY "Crypto alerts management" ON public.crypto_alerts
FOR ALL USING (
  user_id = get_beehiiv_subscriber_id() OR is_current_user_admin()
)
WITH CHECK (
  user_id = get_beehiiv_subscriber_id() OR is_current_user_admin()
);

-- Optimize telegram_user_mapping policies
DROP POLICY IF EXISTS "Users can update their own mapping" ON public.telegram_user_mapping;
DROP POLICY IF EXISTS "Users can view their own mapping" ON public.telegram_user_mapping;

CREATE POLICY "Telegram user mapping access" ON public.telegram_user_mapping
FOR SELECT USING (
  dashboard_user_id = get_beehiiv_subscriber_id() OR is_current_user_admin()
);

CREATE POLICY "Telegram user mapping update" ON public.telegram_user_mapping
FOR UPDATE USING (
  dashboard_user_id = get_beehiiv_subscriber_id() OR is_current_user_admin()
)
WITH CHECK (
  dashboard_user_id = get_beehiiv_subscriber_id() OR is_current_user_admin()
);

-- Create missing policies for tables that need them
CREATE POLICY IF NOT EXISTS "Admin IP allowlist management" ON public.admin_ip_allowlist
FOR ALL USING (has_admin_role('super_admin'))
WITH CHECK (has_admin_role('super_admin'));

CREATE POLICY IF NOT EXISTS "Admin security events read" ON public.admin_security_events
FOR SELECT USING (
  admin_email = get_current_user_email() OR has_admin_role('super_admin')
);

CREATE POLICY IF NOT EXISTS "Admin security events insert" ON public.admin_security_events
FOR INSERT WITH CHECK (true); -- Allow system inserts

-- Fix data access tables
CREATE POLICY IF NOT EXISTS "Data access logs read" ON public.data_access_logs
FOR SELECT USING (
  user_id = auth.uid() OR 
  admin_email = get_current_user_email() OR 
  has_admin_role('super_admin')
);

CREATE POLICY IF NOT EXISTS "Data access logs insert" ON public.data_access_logs
FOR INSERT WITH CHECK (true); -- Allow system inserts