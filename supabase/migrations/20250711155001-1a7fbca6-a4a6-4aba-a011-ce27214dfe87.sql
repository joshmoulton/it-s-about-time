-- Fix Supabase RLS Policy Issues - Part 2: Fix remaining policies

-- Create missing policies for tables that need them (without IF NOT EXISTS)
DROP POLICY IF EXISTS "Admin IP allowlist management" ON public.admin_ip_allowlist;
CREATE POLICY "Admin IP allowlist management" ON public.admin_ip_allowlist
FOR ALL USING (has_admin_role('super_admin'))
WITH CHECK (has_admin_role('super_admin'));

DROP POLICY IF EXISTS "Admin security events read" ON public.admin_security_events;
CREATE POLICY "Admin security events read" ON public.admin_security_events
FOR SELECT USING (
  admin_email = get_current_user_email() OR has_admin_role('super_admin')
);

DROP POLICY IF EXISTS "Admin security events insert" ON public.admin_security_events;
CREATE POLICY "Admin security events insert" ON public.admin_security_events
FOR INSERT WITH CHECK (true); -- Allow system inserts

-- Fix data access tables
DROP POLICY IF EXISTS "Data access logs read" ON public.data_access_logs;
CREATE POLICY "Data access logs read" ON public.data_access_logs
FOR SELECT USING (
  user_id = auth.uid() OR 
  admin_email = get_current_user_email() OR 
  has_admin_role('super_admin')
);

DROP POLICY IF EXISTS "Data access logs insert" ON public.data_access_logs;
CREATE POLICY "Data access logs insert" ON public.data_access_logs
FOR INSERT WITH CHECK (true); -- Allow system inserts

-- Fix highlight_comments policies to use proper functions
DROP POLICY IF EXISTS "Anyone can view non-deleted comments" ON public.highlight_comments;
DROP POLICY IF EXISTS "Users can create comments" ON public.highlight_comments;
DROP POLICY IF EXISTS "Users can update their own comments" ON public.highlight_comments;

CREATE POLICY "Highlight comments read" ON public.highlight_comments
FOR SELECT USING (is_deleted = false);

CREATE POLICY "Highlight comments insert" ON public.highlight_comments
FOR INSERT WITH CHECK (user_email = get_current_user_email());

CREATE POLICY "Highlight comments update" ON public.highlight_comments
FOR UPDATE USING (user_email = get_current_user_email())
WITH CHECK (user_email = get_current_user_email());

-- Fix sent_messages policies
DROP POLICY IF EXISTS "Users can insert their own sent messages" ON public.sent_messages;
DROP POLICY IF EXISTS "Users can view their own sent messages" ON public.sent_messages;

CREATE POLICY "Sent messages user access" ON public.sent_messages
FOR SELECT USING (sender_user_id = get_beehiiv_subscriber_id());

CREATE POLICY "Sent messages insert" ON public.sent_messages
FOR INSERT WITH CHECK (sender_user_id = get_beehiiv_subscriber_id());

-- Fix feedback policies to use proper functions
DROP POLICY IF EXISTS "Admins can update all feedback" ON public.feedback;
DROP POLICY IF EXISTS "Admins can view all feedback" ON public.feedback;
DROP POLICY IF EXISTS "Anonymous users can create feedback with valid email" ON public.feedback;
DROP POLICY IF EXISTS "Authenticated users can create feedback" ON public.feedback;
DROP POLICY IF EXISTS "Users can view their own feedback via JWT" ON public.feedback;

CREATE POLICY "Feedback admin access" ON public.feedback
FOR ALL USING (is_current_user_admin())
WITH CHECK (is_current_user_admin());

CREATE POLICY "Feedback user read" ON public.feedback
FOR SELECT USING (user_email = get_current_user_email());

CREATE POLICY "Feedback create" ON public.feedback
FOR INSERT WITH CHECK (
  user_email IS NOT NULL AND 
  user_email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' AND 
  char_length(user_email) <= 254 AND 
  char_length(title) <= 200 AND 
  char_length(description) <= 2000 AND
  (get_current_user_email() IS NULL OR user_email = get_current_user_email())
);

-- Fix chat_highlights policies
DROP POLICY IF EXISTS "Premium users can view chat highlights" ON public.chat_highlights;

CREATE POLICY "Chat highlights premium access" ON public.chat_highlights
FOR SELECT USING (get_current_user_tier() = 'premium' OR is_current_user_admin());

-- Fix admin_feed_controls policies
DROP POLICY IF EXISTS "Premium users can view feed controls" ON public.admin_feed_controls;

CREATE POLICY "Feed controls premium access" ON public.admin_feed_controls
FOR SELECT USING (get_current_user_tier() = 'premium' OR is_current_user_admin());

-- Fix gatekeeper_logs policies
DROP POLICY IF EXISTS "Allow authenticated users to view gatekeeper logs" ON public.gatekeeper_logs;

CREATE POLICY "Gatekeeper logs read" ON public.gatekeeper_logs
FOR SELECT USING (is_current_user_admin());

-- Fix notification_templates policies
DROP POLICY IF EXISTS "Admins can manage notification templates" ON public.notification_templates;
DROP POLICY IF EXISTS "Users can view active notification templates" ON public.notification_templates;

CREATE POLICY "Notification templates read" ON public.notification_templates
FOR SELECT USING (is_active = true OR is_current_user_admin());

CREATE POLICY "Notification templates management" ON public.notification_templates
FOR ALL USING (is_current_user_admin())
WITH CHECK (is_current_user_admin());

-- Fix system_settings policies
DROP POLICY IF EXISTS "Authenticated users can view system settings" ON public.system_settings;
DROP POLICY IF EXISTS "Only admins can modify system settings" ON public.system_settings;

CREATE POLICY "System settings read" ON public.system_settings
FOR SELECT USING (true);

CREATE POLICY "System settings management" ON public.system_settings
FOR ALL USING (is_current_user_admin())
WITH CHECK (is_current_user_admin());

-- Fix authentication_audit_log policies
DROP POLICY IF EXISTS "Admins can view all audit logs" ON public.authentication_audit_log;

CREATE POLICY "Auth audit log admin access" ON public.authentication_audit_log
FOR SELECT USING (is_current_user_admin());

-- Fix video_tutorials policies (if they exist)
DROP POLICY IF EXISTS "Admins can manage video tutorials" ON public.video_tutorials;
DROP POLICY IF EXISTS "Premium users can manage video tutorials" ON public.video_tutorials;
DROP POLICY IF EXISTS "Users can view published videos" ON public.video_tutorials;
DROP POLICY IF EXISTS "Video tutorials are viewable by everyone" ON public.video_tutorials;

CREATE POLICY "Video tutorials read" ON public.video_tutorials
FOR SELECT USING (
  (status = 'published' AND (
    (required_tier = 'free') OR
    (required_tier = 'paid' AND get_current_user_tier() IN ('paid', 'premium')) OR
    (required_tier = 'premium' AND get_current_user_tier() = 'premium')
  )) OR 
  is_current_user_admin()
);

CREATE POLICY "Video tutorials management" ON public.video_tutorials
FOR ALL USING (
  user_has_premium_tier() OR is_current_user_admin()
)
WITH CHECK (
  user_has_premium_tier() OR is_current_user_admin()
);