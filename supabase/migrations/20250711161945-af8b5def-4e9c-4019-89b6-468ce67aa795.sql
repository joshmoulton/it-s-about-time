-- PHASE 3: Final cleanup of remaining tables with multiple policies

-- =====================================================
-- CLEAN UP REMAINING TABLES WITH DUPLICATE POLICIES
-- =====================================================

-- Clean up highlight_topics (4 policies)
DROP POLICY IF EXISTS "Anyone can view highlight topics" ON public.highlight_topics;
DROP POLICY IF EXISTS "Authenticated users can create topics" ON public.highlight_topics;
DROP POLICY IF EXISTS "Highlight topics read" ON public.highlight_topics;
DROP POLICY IF EXISTS "Service role can manage topics" ON public.highlight_topics;

-- Clean up user_roles (3 policies)
DROP POLICY IF EXISTS "Super admins can manage all user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view their roles" ON public.user_roles;

-- Clean up user_sessions (3 policies)
DROP POLICY IF EXISTS "Public can read sessions for verification" ON public.user_sessions;
DROP POLICY IF EXISTS "Service role can access all sessions" ON public.user_sessions;
DROP POLICY IF EXISTS "Users can view their sessions" ON public.user_sessions;

-- Clean up user_telegram_permissions (2 policies)
DROP POLICY IF EXISTS "Users can view their own permissions" ON public.user_telegram_permissions;
DROP POLICY IF EXISTS "Users can view their telegram permissions" ON public.user_telegram_permissions;

-- Clean up whop_authenticated_users (2 policies)
DROP POLICY IF EXISTS "Users can view their own whop auth record" ON public.whop_authenticated_users;
DROP POLICY IF EXISTS "Users can view their whop data" ON public.whop_authenticated_users;

-- Clean up sentiment analysis tables (2 policies each)
DROP POLICY IF EXISTS "Authenticated users can view sentiment alerts" ON public.sentiment_alerts;
DROP POLICY IF EXISTS "Service role can manage sentiment alerts" ON public.sentiment_alerts;

DROP POLICY IF EXISTS "Authenticated users can view sentiment trends" ON public.sentiment_trends;
DROP POLICY IF EXISTS "Service role can manage sentiment trends" ON public.sentiment_trends;

DROP POLICY IF EXISTS "Authenticated users can view X sentiment analysis" ON public.x_sentiment_analysis;
DROP POLICY IF EXISTS "Service role can manage X sentiment analysis" ON public.x_sentiment_analysis;

-- Clean up telegram topic tables
DROP POLICY IF EXISTS "Allow authenticated users to view topic discovery" ON public.telegram_topic_discovery;
DROP POLICY IF EXISTS "Allow service role to manage topic discovery" ON public.telegram_topic_discovery;

DROP POLICY IF EXISTS "Authenticated users can view active telegram topics" ON public.telegram_topics;

-- Clean up user follow/permission tables
DROP POLICY IF EXISTS "Users can manage their own follows" ON public.topic_follows;
DROP POLICY IF EXISTS "Users can view all follows" ON public.topic_follows;

DROP POLICY IF EXISTS "Users can manage their own telegram settings" ON public.telegram_user_settings;

-- Clean up whop product tables
DROP POLICY IF EXISTS "Allow authenticated users to view Whop products" ON public.whop_products;
DROP POLICY IF EXISTS "Allow authenticated users to view Whop purchases" ON public.whop_purchases;

-- Clean up community access
DROP POLICY IF EXISTS "Allow authenticated users to view community access" ON public.telegram_community_access;

-- =====================================================
-- CREATE SINGLE CONSOLIDATED POLICIES
-- =====================================================

-- HIGHLIGHT_TOPICS: Public read + system manage
CREATE POLICY "highlight_topics_public_read" ON public.highlight_topics
FOR SELECT USING (true);

CREATE POLICY "highlight_topics_system_manage" ON public.highlight_topics
FOR ALL USING (true)
WITH CHECK (true);

-- USER_ROLES: Super admin manage + users read own
CREATE POLICY "user_roles_super_admin_manage" ON public.user_roles
FOR ALL USING (has_role(auth.uid(), 'super_admin'))
WITH CHECK (has_role(auth.uid(), 'super_admin'));

CREATE POLICY "user_roles_user_read" ON public.user_roles
FOR SELECT USING (user_id = auth.uid());

-- USER_SESSIONS: System access + user read own
CREATE POLICY "user_sessions_system_access" ON public.user_sessions
FOR ALL USING (true)
WITH CHECK (true);

CREATE POLICY "user_sessions_user_read" ON public.user_sessions
FOR SELECT USING (subscriber_id = get_beehiiv_subscriber_id());

-- USER_TELEGRAM_PERMISSIONS: User read own
CREATE POLICY "telegram_permissions_user_read" ON public.user_telegram_permissions
FOR SELECT USING (user_id = get_beehiiv_subscriber_id());

-- WHOP_AUTHENTICATED_USERS: User read own
CREATE POLICY "whop_users_self_read" ON public.whop_authenticated_users
FOR SELECT USING (user_email = get_current_user_email_optimized());

-- SENTIMENT ANALYSIS TABLES: Public read + system manage
CREATE POLICY "sentiment_alerts_public_read" ON public.sentiment_alerts
FOR SELECT USING (true);

CREATE POLICY "sentiment_alerts_system_manage" ON public.sentiment_alerts
FOR ALL USING (true)
WITH CHECK (true);

CREATE POLICY "sentiment_trends_public_read" ON public.sentiment_trends
FOR SELECT USING (true);

CREATE POLICY "sentiment_trends_system_manage" ON public.sentiment_trends
FOR ALL USING (true)
WITH CHECK (true);

CREATE POLICY "x_sentiment_public_read" ON public.x_sentiment_analysis
FOR SELECT USING (true);

CREATE POLICY "x_sentiment_system_manage" ON public.x_sentiment_analysis
FOR ALL USING (true)
WITH CHECK (true);

-- TELEGRAM TOPIC TABLES: Public read + system manage
CREATE POLICY "topic_discovery_public_read" ON public.telegram_topic_discovery
FOR SELECT USING (true);

CREATE POLICY "topic_discovery_system_manage" ON public.telegram_topic_discovery
FOR ALL USING (true)
WITH CHECK (true);

CREATE POLICY "telegram_topics_public_read" ON public.telegram_topics
FOR SELECT USING (is_active = true);

-- USER FOLLOW/SETTINGS TABLES: User self-manage
CREATE POLICY "topic_follows_user_manage" ON public.topic_follows
FOR ALL USING (user_email = get_current_user_email_optimized())
WITH CHECK (user_email = get_current_user_email_optimized());

CREATE POLICY "topic_follows_public_read" ON public.topic_follows
FOR SELECT USING (true);

CREATE POLICY "telegram_settings_user_manage" ON public.telegram_user_settings
FOR ALL USING (user_email = get_current_user_email_optimized())
WITH CHECK (user_email = get_current_user_email_optimized());

-- WHOP PRODUCT TABLES: Public read
CREATE POLICY "whop_products_public_read" ON public.whop_products
FOR SELECT USING (true);

CREATE POLICY "whop_purchases_public_read" ON public.whop_purchases
FOR SELECT USING (true);

-- COMMUNITY ACCESS: Public read
CREATE POLICY "community_access_public_read" ON public.telegram_community_access
FOR SELECT USING (true);

-- =====================================================
-- FINAL CLEANUP: Remove any old/broken function usage
-- =====================================================

-- Clean up feedback_replies table which still had complex policies
DROP POLICY IF EXISTS "Admins can view all replies" ON public.feedback_replies;
DROP POLICY IF EXISTS "Authenticated users can create replies" ON public.feedback_replies;
DROP POLICY IF EXISTS "Users can view replies to their feedback" ON public.feedback_replies;

CREATE POLICY "feedback_replies_admin_access" ON public.feedback_replies
FOR ALL USING (is_current_user_admin_fast())
WITH CHECK (is_current_user_admin_fast());

CREATE POLICY "feedback_replies_user_read" ON public.feedback_replies
FOR SELECT USING (EXISTS (
  SELECT 1 FROM feedback f 
  WHERE f.id = feedback_replies.feedback_id 
  AND f.user_email = get_current_user_email_optimized()
) AND is_internal_note = false);

-- Clean up user_beehiiv_links
DROP POLICY IF EXISTS "Admins can view all BeehiIV links" ON public.user_beehiiv_links;
DROP POLICY IF EXISTS "Users can view their own BeehiIV link" ON public.user_beehiiv_links;

CREATE POLICY "beehiiv_links_admin_read" ON public.user_beehiiv_links
FOR ALL USING (is_current_user_admin_fast())
WITH CHECK (is_current_user_admin_fast());

CREATE POLICY "beehiiv_links_user_read" ON public.user_beehiiv_links
FOR SELECT USING (user_id = auth.uid());

-- Clean up user_trading_profiles
DROP POLICY IF EXISTS "Authenticated users can manage trading profiles" ON public.user_trading_profiles;

CREATE POLICY "trading_profiles_user_manage" ON public.user_trading_profiles
FOR ALL USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Clean up remaining degen notification policy
DROP POLICY IF EXISTS "Admins can view degen call notifications" ON public.degen_call_notifications;

CREATE POLICY "degen_notifications_admin_read" ON public.degen_call_notifications
FOR SELECT USING (is_current_user_admin_fast());

-- Clean up message_audit_log
DROP POLICY IF EXISTS "Admins can view audit log" ON public.message_audit_log;

CREATE POLICY "message_audit_admin_read" ON public.message_audit_log
FOR ALL USING (is_current_user_admin_fast())
WITH CHECK (is_current_user_admin_fast());