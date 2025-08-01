-- Fix Auth RLS Initialization Plan Issues: Replace auth.uid() and current_setting() with optimized functions

-- ==============================================
-- PHASE 1: CONTENT ANALYTICS - REPLACE AUTH.UID()
-- ==============================================

DROP POLICY IF EXISTS "content_analytics_user_manage" ON public.content_analytics;

CREATE POLICY "content_analytics_user_manage" ON public.content_analytics 
FOR ALL TO public 
USING (user_id = get_current_user_id())
WITH CHECK (user_id = get_current_user_id());

-- ==============================================
-- PHASE 2: ROLE PERMISSIONS - REPLACE AUTH.UID()
-- ==============================================

DROP POLICY IF EXISTS "Super admins can manage all role permissions" ON public.role_permissions;

CREATE POLICY "role_permissions_admin_full" ON public.role_permissions 
FOR ALL TO public 
USING (is_current_user_admin_fast())
WITH CHECK (is_current_user_admin_fast());

-- ==============================================
-- PHASE 3: TELEGRAM USER MAPPING - REPLACE CURRENT_SETTING()
-- ==============================================

DROP POLICY IF EXISTS "Users can update their own mapping" ON public.telegram_user_mapping;
DROP POLICY IF EXISTS "Users can view their own mapping" ON public.telegram_user_mapping;

CREATE POLICY "telegram_user_mapping_user_access" ON public.telegram_user_mapping 
FOR ALL TO public 
USING (dashboard_email = get_current_user_email_optimized())
WITH CHECK (dashboard_email = get_current_user_email_optimized());

-- ==============================================
-- PHASE 4: TRADING ALERTS - REPLACE AUTH.UID()
-- ==============================================

DROP POLICY IF EXISTS "trading_alerts_user_manage" ON public.trading_alerts;

CREATE POLICY "trading_alerts_user_manage" ON public.trading_alerts 
FOR ALL TO public 
USING (user_id = get_current_user_id())
WITH CHECK (user_id = get_current_user_id());

-- ==============================================
-- PHASE 5: USER BEEHIIV LINKS - REPLACE AUTH.UID()
-- ==============================================

DROP POLICY IF EXISTS "beehiiv_links_user_read" ON public.user_beehiiv_links;

CREATE POLICY "user_beehiiv_links_user_access" ON public.user_beehiiv_links 
FOR ALL TO public 
USING (user_id = get_current_user_id())
WITH CHECK (user_id = get_current_user_id());

-- ==============================================
-- PHASE 6: USER PROFILES - REPLACE AUTH.UID()
-- ==============================================

DROP POLICY IF EXISTS "user_profiles_self_manage" ON public.user_profiles;

CREATE POLICY "user_profiles_user_access" ON public.user_profiles 
FOR ALL TO public 
USING (user_id = get_current_user_id() OR whop_email = get_current_user_email_optimized())
WITH CHECK (user_id = get_current_user_id() OR whop_email = get_current_user_email_optimized());

-- ==============================================
-- PHASE 7: USER TRADING PROFILES - REPLACE AUTH.UID()
-- ==============================================

DROP POLICY IF EXISTS "trading_profiles_user_manage" ON public.user_trading_profiles;

CREATE POLICY "user_trading_profiles_user_access" ON public.user_trading_profiles 
FOR ALL TO public 
USING (user_id = get_current_user_id())
WITH CHECK (user_id = get_current_user_id());

-- ==============================================
-- CREATE MISSING OPTIMIZED FUNCTION
-- ==============================================

-- Ensure get_current_user_id function exists and is optimized
CREATE OR REPLACE FUNCTION public.get_current_user_id()
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT auth.uid()
$$;