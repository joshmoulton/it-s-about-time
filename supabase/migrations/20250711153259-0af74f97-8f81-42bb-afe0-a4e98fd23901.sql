-- Update RLS policies to use security definer functions instead of direct auth calls

-- Fix chat_highlights policies
DROP POLICY IF EXISTS "Premium users can view chat highlights" ON public.chat_highlights;
CREATE POLICY "Premium users can view chat highlights" 
ON public.chat_highlights 
FOR SELECT 
USING (user_has_premium_tier());

-- Fix admin_audit_log policies
DROP POLICY IF EXISTS "Admins can view their own audit logs" ON public.admin_audit_log;
DROP POLICY IF EXISTS "Super admins can view all audit logs" ON public.admin_audit_log;

CREATE POLICY "Admins can view their own audit logs" 
ON public.admin_audit_log 
FOR SELECT 
USING (user_email = get_jwt_email() OR has_admin_role('admin'));

CREATE POLICY "Super admins can view all audit logs" 
ON public.admin_audit_log 
FOR SELECT 
USING (has_admin_role('super_admin'));

-- Fix admin_feed_controls policies
DROP POLICY IF EXISTS "Premium users can view feed controls" ON public.admin_feed_controls;
CREATE POLICY "Premium users can view feed controls" 
ON public.admin_feed_controls 
FOR SELECT 
USING (user_has_premium_tier());

-- Fix courses policies
DROP POLICY IF EXISTS "Admins can manage courses" ON public.courses;
DROP POLICY IF EXISTS "Users can view published courses" ON public.courses;

CREATE POLICY "Admins can manage courses" 
ON public.courses 
FOR ALL 
USING (has_admin_role('admin'));

CREATE POLICY "Users can view published courses" 
ON public.courses 
FOR SELECT 
USING (
  status = 'published' AND (
    required_tier = 'free' OR
    (required_tier = 'paid' AND user_has_paid_tier()) OR
    (required_tier = 'premium' AND user_has_premium_tier()) OR
    has_admin_role('admin')
  )
);

-- Fix sent_messages policies
DROP POLICY IF EXISTS "Users can insert their own sent messages" ON public.sent_messages;
DROP POLICY IF EXISTS "Users can view their own sent messages" ON public.sent_messages;

CREATE POLICY "Users can insert their own sent messages" 
ON public.sent_messages 
FOR INSERT 
WITH CHECK (sender_user_id = get_beehiiv_subscriber_id());

CREATE POLICY "Users can view their own sent messages" 
ON public.sent_messages 
FOR SELECT 
USING (sender_user_id = get_beehiiv_subscriber_id());

-- Fix telegram_user_mapping policies
DROP POLICY IF EXISTS "Users can update their own mapping" ON public.telegram_user_mapping;
DROP POLICY IF EXISTS "Users can view their own mapping" ON public.telegram_user_mapping;

CREATE POLICY "Users can update their own mapping" 
ON public.telegram_user_mapping 
FOR UPDATE 
USING (dashboard_user_id = get_beehiiv_subscriber_id());

CREATE POLICY "Users can view their own mapping" 
ON public.telegram_user_mapping 
FOR SELECT 
USING (dashboard_user_id = get_beehiiv_subscriber_id());

-- Fix authentication_audit_log policies
DROP POLICY IF EXISTS "Admins can view all audit logs" ON public.authentication_audit_log;
CREATE POLICY "Admins can view all audit logs" 
ON public.authentication_audit_log 
FOR SELECT 
USING (has_admin_role('admin'));

-- Fix content_analytics policies
DROP POLICY IF EXISTS "content_analytics policy" ON public.content_analytics;
CREATE POLICY "Users can view their own analytics" 
ON public.content_analytics 
FOR SELECT 
USING (user_id = get_beehiiv_subscriber_id() OR has_admin_role('admin'));