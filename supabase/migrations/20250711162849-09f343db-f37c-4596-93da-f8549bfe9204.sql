-- Comprehensive Performance Advisor Cleanup: Fix Multiple Permissive Policies and Auth RLS Issues

-- ==============================================
-- PHASE 1: ADMIN 2FA SESSIONS - CONSOLIDATE POLICIES
-- ==============================================

DROP POLICY IF EXISTS "2fa_sessions_admin_access" ON public.admin_2fa_sessions;
DROP POLICY IF EXISTS "2fa_sessions_system_access" ON public.admin_2fa_sessions;

CREATE POLICY "admin_2fa_sessions_admin_full" ON public.admin_2fa_sessions 
FOR ALL TO public 
USING (admin_email = get_current_user_email_optimized() OR is_current_user_admin_fast())
WITH CHECK (admin_email = get_current_user_email_optimized() OR is_current_user_admin_fast());

-- ==============================================
-- PHASE 2: ADMIN DEVICE AUTH - CONSOLIDATE POLICIES  
-- ==============================================

DROP POLICY IF EXISTS "device_auth_self_manage" ON public.admin_device_auth;
DROP POLICY IF EXISTS "device_auth_super_admin" ON public.admin_device_auth;

CREATE POLICY "admin_device_auth_full" ON public.admin_device_auth 
FOR ALL TO public 
USING (admin_email = get_current_user_email_optimized() OR is_current_user_admin_fast())
WITH CHECK (admin_email = get_current_user_email_optimized() OR is_current_user_admin_fast());

-- ==============================================
-- PHASE 3: ANALYST CALL DETECTIONS - CONSOLIDATE POLICIES
-- ==============================================

DROP POLICY IF EXISTS "Admins can manage analyst call detections" ON public.analyst_call_detections;
DROP POLICY IF EXISTS "Service role can create detections" ON public.analyst_call_detections;

CREATE POLICY "analyst_call_detections_admin_full" ON public.analyst_call_detections 
FOR ALL TO public 
USING (is_current_user_admin_fast())
WITH CHECK (is_current_user_admin_fast());

-- ==============================================
-- PHASE 4: ANALYST CALL PATTERNS - CONSOLIDATE POLICIES
-- ==============================================

DROP POLICY IF EXISTS "call_patterns_admin_manage" ON public.analyst_call_patterns;
DROP POLICY IF EXISTS "call_patterns_public_read" ON public.analyst_call_patterns;

CREATE POLICY "analyst_call_patterns_admin_full" ON public.analyst_call_patterns 
FOR ALL TO public 
USING (is_current_user_admin_fast())
WITH CHECK (is_current_user_admin_fast());

CREATE POLICY "analyst_call_patterns_public_read" ON public.analyst_call_patterns 
FOR SELECT TO public 
USING (is_active = true);

-- ==============================================
-- PHASE 5: ANALYST CHANNEL CONFIG - CONSOLIDATE POLICIES
-- ==============================================

DROP POLICY IF EXISTS "Channel config management" ON public.analyst_channel_config;
DROP POLICY IF EXISTS "Channel config read" ON public.analyst_channel_config;

CREATE POLICY "analyst_channel_config_admin_full" ON public.analyst_channel_config 
FOR ALL TO public 
USING (is_current_user_admin_fast())
WITH CHECK (is_current_user_admin_fast());

-- ==============================================
-- PHASE 6: ANALYST DEGEN SUBSCRIPTIONS - CONSOLIDATE POLICIES
-- ==============================================

DROP POLICY IF EXISTS "degen_subs_admin_read" ON public.analyst_degen_subscriptions;
DROP POLICY IF EXISTS "degen_subs_user_manage" ON public.analyst_degen_subscriptions;

CREATE POLICY "analyst_degen_subs_admin_full" ON public.analyst_degen_subscriptions 
FOR ALL TO public 
USING (is_current_user_admin_fast())
WITH CHECK (is_current_user_admin_fast());

CREATE POLICY "analyst_degen_subs_user_access" ON public.analyst_degen_subscriptions 
FOR ALL TO public 
USING (user_email = get_current_user_email_optimized())
WITH CHECK (user_email = get_current_user_email_optimized());

-- ==============================================
-- PHASE 7: NEWSLETTERS - CONSOLIDATE POLICIES
-- ==============================================

DROP POLICY IF EXISTS "newsletters_admin_manage" ON public.newsletters;
DROP POLICY IF EXISTS "newsletters_public_read" ON public.newsletters;

CREATE POLICY "newsletters_admin_full" ON public.newsletters 
FOR ALL TO public 
USING (is_current_user_admin_fast())
WITH CHECK (is_current_user_admin_fast());

CREATE POLICY "newsletters_public_read" ON public.newsletters 
FOR SELECT TO public 
USING (status = 'published');

-- ==============================================
-- PHASE 8: TELEGRAM MESSAGES - CONSOLIDATE POLICIES
-- ==============================================

DROP POLICY IF EXISTS "telegram_messages_admin_manage" ON public.telegram_messages;
DROP POLICY IF EXISTS "telegram_messages_public_read" ON public.telegram_messages;

CREATE POLICY "telegram_messages_admin_full" ON public.telegram_messages 
FOR ALL TO public 
USING (is_current_user_admin_fast())
WITH CHECK (is_current_user_admin_fast());

CREATE POLICY "telegram_messages_public_read" ON public.telegram_messages 
FOR SELECT TO public 
USING (is_hidden = false OR is_hidden IS NULL);

-- ==============================================
-- PHASE 9: USER ROLES - CONSOLIDATE POLICIES (FIX AUTH.UID ISSUE)
-- ==============================================

DROP POLICY IF EXISTS "user_roles_super_admin_manage" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_user_read" ON public.user_roles;

CREATE POLICY "user_roles_admin_full" ON public.user_roles 
FOR ALL TO public 
USING (is_current_user_admin_fast())
WITH CHECK (is_current_user_admin_fast());

CREATE POLICY "user_roles_user_read" ON public.user_roles 
FOR SELECT TO public 
USING (user_id = get_current_user_id());

-- ==============================================
-- PHASE 10: USER SESSIONS - CONSOLIDATE POLICIES
-- ==============================================

DROP POLICY IF EXISTS "user_sessions_system_access" ON public.user_sessions;
DROP POLICY IF EXISTS "user_sessions_user_read" ON public.user_sessions;

CREATE POLICY "user_sessions_admin_full" ON public.user_sessions 
FOR ALL TO public 
USING (is_current_user_admin_fast())
WITH CHECK (is_current_user_admin_fast());

CREATE POLICY "user_sessions_user_access" ON public.user_sessions 
FOR ALL TO public 
USING (subscriber_id = get_beehiiv_subscriber_id())
WITH CHECK (subscriber_id = get_beehiiv_subscriber_id());