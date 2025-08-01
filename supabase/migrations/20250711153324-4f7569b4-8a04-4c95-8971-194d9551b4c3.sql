-- Fix remaining RLS policies for trading and crypto alerts

-- Fix content_analytics policies (handle existing policy)
DROP POLICY IF EXISTS "Users can view their own analytics" ON public.content_analytics;
CREATE POLICY "Users can view their own analytics" 
ON public.content_analytics 
FOR SELECT 
USING (user_id = get_beehiiv_subscriber_id() OR has_admin_role('admin'));

-- Fix trading_alerts policies  
DROP POLICY IF EXISTS "Users can manage their own trading alerts" ON public.trading_alerts;
DROP POLICY IF EXISTS "Users can view their own trading alerts" ON public.trading_alerts;
DROP POLICY IF EXISTS "Admins can view all trading alerts" ON public.trading_alerts;

CREATE POLICY "Users can manage their own trading alerts" 
ON public.trading_alerts 
FOR ALL 
USING (user_id = get_beehiiv_subscriber_id());

CREATE POLICY "Admins can view all trading alerts" 
ON public.trading_alerts 
FOR SELECT 
USING (has_admin_role('admin'));

-- Fix crypto_alerts policies
DROP POLICY IF EXISTS "Users can manage their own crypto alerts" ON public.crypto_alerts;
DROP POLICY IF EXISTS "Users can view their own crypto alerts" ON public.crypto_alerts;
DROP POLICY IF EXISTS "Admins can view all crypto alerts" ON public.crypto_alerts;

CREATE POLICY "Users can manage their own crypto alerts" 
ON public.crypto_alerts 
FOR ALL 
USING (user_id = get_beehiiv_subscriber_id());

CREATE POLICY "Admins can view all crypto alerts" 
ON public.crypto_alerts 
FOR SELECT 
USING (has_admin_role('admin'));

-- Fix newsletters policies if they exist
DROP POLICY IF EXISTS "Anyone can view published newsletters" ON public.newsletters;
CREATE POLICY "Anyone can view published newsletters" 
ON public.newsletters 
FOR SELECT 
USING (status = 'published' OR has_admin_role('admin'));