-- PHASE 2: Complete cleanup of ALL remaining duplicate policies
-- This addresses the tables that weren't fully cleaned in Phase 1

-- =====================================================
-- DROP ALL REMAINING DUPLICATE/CONFLICTING POLICIES
-- =====================================================

-- Clean up admin_2fa_sessions (4 policies)
DROP POLICY IF EXISTS "2FA sessions access policy" ON public.admin_2fa_sessions;
DROP POLICY IF EXISTS "Admins can view their own 2FA sessions" ON public.admin_2fa_sessions;
DROP POLICY IF EXISTS "System can manage 2FA sessions" ON public.admin_2fa_sessions;

-- Clean up admin_ip_allowlist (3 policies)
DROP POLICY IF EXISTS "Admin IP allowlist management" ON public.admin_ip_allowlist;
DROP POLICY IF EXISTS "Admins can view their own IP allowlist" ON public.admin_ip_allowlist;
DROP POLICY IF EXISTS "Super admins can manage IP allowlist" ON public.admin_ip_allowlist;

-- Clean up admin_security_events (5 policies!)
DROP POLICY IF EXISTS "Admin security events insert" ON public.admin_security_events;
DROP POLICY IF EXISTS "Admin security events read" ON public.admin_security_events;
DROP POLICY IF EXISTS "Admins can view their own security events" ON public.admin_security_events;
DROP POLICY IF EXISTS "Super admins can view all security events" ON public.admin_security_events;
DROP POLICY IF EXISTS "System can insert security events" ON public.admin_security_events;

-- Clean up analyst_call_patterns (3 policies)
DROP POLICY IF EXISTS "Admins can manage analyst call patterns" ON public.analyst_call_patterns;
DROP POLICY IF EXISTS "Analyst call patterns management" ON public.analyst_call_patterns;
DROP POLICY IF EXISTS "Anyone can view active patterns" ON public.analyst_call_patterns;

-- Clean up auto_highlights (3 policies)
DROP POLICY IF EXISTS "Allow authenticated users to view auto highlights" ON public.auto_highlights;
DROP POLICY IF EXISTS "Allow service role to manage auto highlights" ON public.auto_highlights;
DROP POLICY IF EXISTS "Auto highlights read" ON public.auto_highlights;

-- Clean up backup_history (4 policies)
DROP POLICY IF EXISTS "Admin users can create backup records" ON public.backup_history;
DROP POLICY IF EXISTS "Admin users can update backup records" ON public.backup_history;
DROP POLICY IF EXISTS "Admin users can view backup history" ON public.backup_history;
DROP POLICY IF EXISTS "Backup history admin access" ON public.backup_history;

-- Clean up chat_highlight_rules (4 policies)
DROP POLICY IF EXISTS "Allow authenticated users to manage highlight rules" ON public.chat_highlight_rules;
DROP POLICY IF EXISTS "Allow authenticated users to view highlight rules" ON public.chat_highlight_rules;
DROP POLICY IF EXISTS "Chat highlight rules management" ON public.chat_highlight_rules;
DROP POLICY IF EXISTS "Chat highlight rules read" ON public.chat_highlight_rules;

-- Clean up content_analytics (4 policies)
DROP POLICY IF EXISTS "Content analytics insert" ON public.content_analytics;
DROP POLICY IF EXISTS "Content analytics read" ON public.content_analytics;
DROP POLICY IF EXISTS "Users can insert their own analytics" ON public.content_analytics;
DROP POLICY IF EXISTS "Users can view their own analytics" ON public.content_analytics;

-- Clean up course_modules (4 policies)
DROP POLICY IF EXISTS "Admin users can manage course modules" ON public.course_modules;
DROP POLICY IF EXISTS "Anyone can view published course modules" ON public.course_modules;
DROP POLICY IF EXISTS "Course modules management" ON public.course_modules;
DROP POLICY IF EXISTS "Course modules read" ON public.course_modules;

-- Clean up crypto_alerts (3 policies)
DROP POLICY IF EXISTS "Admins can view all crypto alerts" ON public.crypto_alerts;
DROP POLICY IF EXISTS "Allow reading active crypto alerts" ON public.crypto_alerts;
DROP POLICY IF EXISTS "Users can manage their own crypto alerts" ON public.crypto_alerts;

-- Clean up data_access_logs (5 policies)
DROP POLICY IF EXISTS "Admins can view their own access logs" ON public.data_access_logs;
DROP POLICY IF EXISTS "Data access logs insert" ON public.data_access_logs;
DROP POLICY IF EXISTS "Data access logs read" ON public.data_access_logs;
DROP POLICY IF EXISTS "Super admins can view all access logs" ON public.data_access_logs;
DROP POLICY IF EXISTS "System can insert access logs" ON public.data_access_logs;

-- Clean up degen_call_subscriptions (8 policies!!!)
DROP POLICY IF EXISTS "Admins can view all degen call subscriptions" ON public.degen_call_subscriptions;
DROP POLICY IF EXISTS "Authenticated users can manage degen call subscriptions" ON public.degen_call_subscriptions;
DROP POLICY IF EXISTS "Users can delete their own analyst subscriptions" ON public.degen_call_subscriptions;
DROP POLICY IF EXISTS "Users can insert their own degen call subscription" ON public.degen_call_subscriptions;
DROP POLICY IF EXISTS "Users can update their own analyst subscriptions" ON public.degen_call_subscriptions;
DROP POLICY IF EXISTS "Users can update their own degen call subscription" ON public.degen_call_subscriptions;
DROP POLICY IF EXISTS "Users can view their own analyst subscriptions" ON public.degen_call_subscriptions;
DROP POLICY IF EXISTS "Users can view their own degen call subscription" ON public.degen_call_subscriptions;

-- Clean up newsletters (7 policies!!!)
DROP POLICY IF EXISTS "Admin users can create newsletters" ON public.newsletters;
DROP POLICY IF EXISTS "Admin users can manage newsletters" ON public.newsletters;
DROP POLICY IF EXISTS "Admins can manage newsletters" ON public.newsletters;
DROP POLICY IF EXISTS "Allow admins to manage newsletters" ON public.newsletters;
DROP POLICY IF EXISTS "Allow authenticated users to view published newsletters" ON public.newsletters;
DROP POLICY IF EXISTS "Anyone can view published newsletters" ON public.newsletters;
DROP POLICY IF EXISTS "Users can view published newsletters" ON public.newsletters;

-- Clean up telegram_messages (6 policies)
DROP POLICY IF EXISTS "Admin users can manage telegram messages" ON public.telegram_messages;
DROP POLICY IF EXISTS "Allow authenticated users to view telegram messages" ON public.telegram_messages;
DROP POLICY IF EXISTS "Authenticated users can view all non-hidden messages" ON public.telegram_messages;
DROP POLICY IF EXISTS "Public can view non-hidden messages" ON public.telegram_messages;
DROP POLICY IF EXISTS "Telegram messages read" ON public.telegram_messages;

-- Clean up telegram_sync_status (4 policies)
DROP POLICY IF EXISTS "Admin users can manage sync status" ON public.telegram_sync_status;
DROP POLICY IF EXISTS "Allow authenticated users to view sync status" ON public.telegram_sync_status;
DROP POLICY IF EXISTS "Allow service role to manage sync status" ON public.telegram_sync_status;
DROP POLICY IF EXISTS "Anyone can view sync status" ON public.telegram_sync_status;

-- Clean up user_profiles (4 policies)
DROP POLICY IF EXISTS "Allow authenticated users to manage profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.user_profiles;

-- Clean up trading_alerts (5 policies)
DROP POLICY IF EXISTS "Admins can view all trading alerts" ON public.trading_alerts;
DROP POLICY IF EXISTS "Users can create their own trading alerts" ON public.trading_alerts;
DROP POLICY IF EXISTS "Users can delete their own trading alerts" ON public.trading_alerts;
DROP POLICY IF EXISTS "Users can manage their own trading alerts" ON public.trading_alerts;
DROP POLICY IF EXISTS "Users can update their own trading alerts" ON public.trading_alerts;

-- =====================================================
-- CREATE SINGLE, CONSOLIDATED POLICIES FOR EACH TABLE
-- =====================================================

-- ADMIN_2FA_SESSIONS: Admin self-access + system management
CREATE POLICY "2fa_sessions_admin_access" ON public.admin_2fa_sessions
FOR ALL USING (admin_email = get_current_user_email_optimized())
WITH CHECK (admin_email = get_current_user_email_optimized());

CREATE POLICY "2fa_sessions_system_access" ON public.admin_2fa_sessions
FOR ALL USING (true)
WITH CHECK (true);

-- ADMIN_IP_ALLOWLIST: Super admin only
CREATE POLICY "ip_allowlist_super_admin" ON public.admin_ip_allowlist
FOR ALL USING (has_admin_role('super_admin'))
WITH CHECK (has_admin_role('super_admin'));

-- ADMIN_SECURITY_EVENTS: Admin self-access + system insert
CREATE POLICY "security_events_admin_access" ON public.admin_security_events
FOR SELECT USING (admin_email = get_current_user_email_optimized() OR has_admin_role('super_admin'));

CREATE POLICY "security_events_system_insert" ON public.admin_security_events
FOR INSERT WITH CHECK (true);

-- ANALYST_CALL_PATTERNS: Admin manage + public read active
CREATE POLICY "call_patterns_admin_manage" ON public.analyst_call_patterns
FOR ALL USING (is_current_user_admin_fast())
WITH CHECK (is_current_user_admin_fast());

CREATE POLICY "call_patterns_public_read" ON public.analyst_call_patterns
FOR SELECT USING (is_active = true);

-- AUTO_HIGHLIGHTS: Public read + system manage
CREATE POLICY "auto_highlights_public_read" ON public.auto_highlights
FOR SELECT USING (true);

CREATE POLICY "auto_highlights_system_manage" ON public.auto_highlights
FOR ALL USING (true)
WITH CHECK (true);

-- BACKUP_HISTORY: Admin only
CREATE POLICY "backup_history_admin_access" ON public.backup_history
FOR ALL USING (is_current_user_admin_fast())
WITH CHECK (is_current_user_admin_fast());

-- CHAT_HIGHLIGHT_RULES: Admin only
CREATE POLICY "highlight_rules_admin_access" ON public.chat_highlight_rules
FOR ALL USING (is_current_user_admin_fast())
WITH CHECK (is_current_user_admin_fast());

-- CONTENT_ANALYTICS: User-owned + admin oversight
CREATE POLICY "content_analytics_user_manage" ON public.content_analytics
FOR ALL USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "content_analytics_admin_read" ON public.content_analytics
FOR SELECT USING (is_current_user_admin_fast());

-- COURSE_MODULES: Admin manage + public read for published courses
CREATE POLICY "course_modules_admin_manage" ON public.course_modules
FOR ALL USING (is_current_user_admin_fast())
WITH CHECK (is_current_user_admin_fast());

CREATE POLICY "course_modules_public_read" ON public.course_modules
FOR SELECT USING (EXISTS (
  SELECT 1 FROM courses c 
  WHERE c.id = course_modules.course_id 
  AND c.status = 'published'
));

-- CRYPTO_ALERTS: User-owned + admin read
CREATE POLICY "crypto_alerts_user_manage" ON public.crypto_alerts
FOR ALL USING (user_id = get_beehiiv_subscriber_id())
WITH CHECK (user_id = get_beehiiv_subscriber_id());

CREATE POLICY "crypto_alerts_admin_read" ON public.crypto_alerts
FOR SELECT USING (is_current_user_admin_fast());

-- DATA_ACCESS_LOGS: Admin self-access + super admin all + system insert
CREATE POLICY "access_logs_admin_access" ON public.data_access_logs
FOR SELECT USING (admin_email = get_current_user_email_optimized() OR has_admin_role('super_admin'));

CREATE POLICY "access_logs_system_insert" ON public.data_access_logs
FOR INSERT WITH CHECK (true);

-- DEGEN_CALL_SUBSCRIPTIONS: User-owned + admin read (SINGLE POLICY!)
CREATE POLICY "degen_subs_user_manage" ON public.degen_call_subscriptions
FOR ALL USING (user_email = get_current_user_email_optimized())
WITH CHECK (user_email = get_current_user_email_optimized());

CREATE POLICY "degen_subs_admin_read" ON public.degen_call_subscriptions
FOR SELECT USING (is_current_user_admin_fast());

-- NEWSLETTERS: Admin manage + public read published (SINGLE POLICY!)
CREATE POLICY "newsletters_admin_manage" ON public.newsletters
FOR ALL USING (is_current_user_admin_fast())
WITH CHECK (is_current_user_admin_fast());

CREATE POLICY "newsletters_public_read" ON public.newsletters
FOR SELECT USING (status = 'published');

-- TELEGRAM_MESSAGES: Admin manage + public read non-hidden
CREATE POLICY "telegram_messages_admin_manage" ON public.telegram_messages
FOR ALL USING (is_current_user_admin_fast())
WITH CHECK (is_current_user_admin_fast());

CREATE POLICY "telegram_messages_public_read" ON public.telegram_messages
FOR SELECT USING (is_hidden = false OR is_hidden IS NULL);

-- TELEGRAM_SYNC_STATUS: Admin manage + public read
CREATE POLICY "sync_status_admin_manage" ON public.telegram_sync_status
FOR ALL USING (is_current_user_admin_fast())
WITH CHECK (is_current_user_admin_fast());

CREATE POLICY "sync_status_public_read" ON public.telegram_sync_status
FOR SELECT USING (true);

-- USER_PROFILES: User self-manage + admin read
CREATE POLICY "user_profiles_self_manage" ON public.user_profiles
FOR ALL USING (
  user_id = auth.uid() OR 
  whop_email = get_current_user_email_optimized()
)
WITH CHECK (
  user_id = auth.uid() OR 
  whop_email = get_current_user_email_optimized()
);

CREATE POLICY "user_profiles_admin_read" ON public.user_profiles
FOR SELECT USING (is_current_user_admin_fast());

-- TRADING_ALERTS: User-owned + admin read
CREATE POLICY "trading_alerts_user_manage" ON public.trading_alerts
FOR ALL USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "trading_alerts_admin_read" ON public.trading_alerts
FOR SELECT USING (is_current_user_admin_fast());