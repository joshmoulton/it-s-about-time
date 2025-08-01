-- EMERGENCY SECURITY LOCKDOWN - Phase 1 (Fixed)
-- This migration addresses critical security vulnerabilities identified in the audit

-- 1. CRITICAL: Remove public access to payment/financial data
DROP POLICY IF EXISTS "whop_products_public_read" ON public.whop_products;
DROP POLICY IF EXISTS "whop_purchases_public_read" ON public.whop_purchases;

-- Create secure policies for Whop data (admin and user-specific access only)
CREATE POLICY "whop_products_admin_access" 
  ON public.whop_products 
  FOR ALL 
  USING (is_current_user_admin());

CREATE POLICY "whop_purchases_admin_access" 
  ON public.whop_purchases 
  FOR ALL 
  USING (is_current_user_admin());

CREATE POLICY "whop_purchases_user_access" 
  ON public.whop_purchases 
  FOR SELECT 
  USING (customer_email = get_current_user_email_optimized());

-- 2. CRITICAL: Secure telegram sentiment analysis (remove public access)
DROP POLICY IF EXISTS "Sentiment analysis read" ON public.telegram_sentiment_analysis;

CREATE POLICY "sentiment_analysis_premium_access" 
  ON public.telegram_sentiment_analysis 
  FOR SELECT 
  USING (
    (get_current_user_tier() = 'premium'::subscription_tier) OR 
    is_current_user_admin()
  );

-- 3. CRITICAL: Secure auto highlights (remove unrestricted public access)
DROP POLICY IF EXISTS "auto_highlights_public_read" ON public.auto_highlights;

CREATE POLICY "auto_highlights_premium_access" 
  ON public.auto_highlights 
  FOR SELECT 
  USING (
    (get_current_user_tier() = 'premium'::subscription_tier) OR 
    is_current_user_admin()
  );

-- 4. CRITICAL: Force enable 2FA for ALL admin accounts
UPDATE public.admin_users 
SET requires_2fa = true,
    updated_at = now()
WHERE is_active = true;

-- 5. CRITICAL: Secure admin 2FA secrets (add additional protection)
DROP POLICY IF EXISTS "2fa_secrets_self_manage" ON public.admin_2fa_secrets;

CREATE POLICY "2fa_secrets_strict_self_manage" 
  ON public.admin_2fa_secrets 
  FOR ALL 
  USING (
    admin_email = get_current_user_email_optimized() AND
    is_current_user_admin()
  )
  WITH CHECK (
    admin_email = get_current_user_email_optimized() AND
    is_current_user_admin()
  );

-- 6. CRITICAL: Secure admin sessions table
CREATE POLICY "admin_sessions_self_access" 
  ON public.admin_2fa_sessions 
  FOR ALL 
  USING (
    admin_email = get_current_user_email_optimized() AND
    is_current_user_admin()
  )
  WITH CHECK (
    admin_email = get_current_user_email_optimized() AND
    is_current_user_admin()
  );

-- 7. CRITICAL: Secure admin security events
CREATE POLICY "admin_security_events_restricted" 
  ON public.admin_security_events 
  FOR SELECT 
  USING (
    admin_email = get_current_user_email_optimized() OR
    has_admin_role('super_admin')
  );

-- 8. CRITICAL: Secure telegram community access
DROP POLICY IF EXISTS "telegram_community_access_public_read" ON public.telegram_community_access;

CREATE POLICY "telegram_community_access_restricted" 
  ON public.telegram_community_access 
  FOR SELECT 
  USING (
    user_email = get_current_user_email_optimized() OR
    is_current_user_admin()
  );

-- 9. CRITICAL: Add session timeout for admin sessions (expire after 2 hours)
CREATE OR REPLACE FUNCTION public.cleanup_expired_admin_sessions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM public.admin_2fa_sessions 
  WHERE expires_at < now() OR created_at < now() - INTERVAL '2 hours';
END;
$$;

-- 10. CRITICAL: Create secure audit logging function
CREATE OR REPLACE FUNCTION public.log_security_event(
  p_event_type TEXT,
  p_admin_email TEXT,
  p_success BOOLEAN DEFAULT true,
  p_details JSONB DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.admin_security_events (
    event_type,
    admin_email,
    success,
    event_details,
    ip_address,
    user_agent,
    created_at
  ) VALUES (
    p_event_type,
    p_admin_email,
    p_success,
    p_details,
    current_setting('request.headers', true)::json->>'x-forwarded-for',
    current_setting('request.headers', true)::json->>'user-agent',
    now()
  );
END;
$$;

-- 11. CRITICAL: Revoke all existing admin sessions (force re-authentication)
DELETE FROM public.admin_2fa_sessions;

-- 12. CRITICAL: Add device tracking for admin access
CREATE POLICY "admin_device_auth_super_restricted" 
  ON public.admin_device_auth 
  FOR ALL 
  USING (
    (admin_email = get_current_user_email_optimized() AND is_current_user_admin()) OR
    has_admin_role('super_admin')
  )
  WITH CHECK (
    (admin_email = get_current_user_email_optimized() AND is_current_user_admin()) OR
    has_admin_role('super_admin')
  );

-- 13. SECURITY LOG: Record this security lockdown
INSERT INTO public.admin_audit_log (
  action,
  resource,
  user_email,
  metadata
) VALUES (
  'security_lockdown',
  'system_wide',
  'system',
  jsonb_build_object(
    'phase', 'emergency_lockdown',
    'timestamp', now(),
    'changes', jsonb_build_array(
      'payment_data_secured',
      '2fa_enforced', 
      'sessions_revoked',
      'public_access_removed'
    )
  )
);