
-- Fix Function Search Path Mutable warnings by setting search_path for all remaining functions

-- Fix is_current_user_admin function
CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS BOOLEAN 
LANGUAGE plpgsql 
SECURITY DEFINER 
STABLE
SET search_path = public
AS $$
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
$$;

-- Fix get_current_user_tier function
CREATE OR REPLACE FUNCTION public.get_current_user_tier()
RETURNS subscription_tier 
LANGUAGE plpgsql 
SECURITY DEFINER 
STABLE
SET search_path = public
AS $$
BEGIN
  RETURN (
    SELECT bs.subscription_tier 
    FROM public.beehiiv_subscribers bs
    WHERE bs.email = current_setting('request.jwt.claims', true)::json->>'email'
  );
END;
$$;

-- Fix setup_beehiiv_daily_sync function
CREATE OR REPLACE FUNCTION public.setup_beehiiv_daily_sync()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public, extensions
AS $$
BEGIN
  -- Remove existing cron jobs if they exist (using dynamic SQL to handle if cron doesn't exist)
  BEGIN
    PERFORM cron.unschedule('beehiiv-daily-sync');
  EXCEPTION WHEN OTHERS THEN
    -- Ignore if job doesn't exist
    NULL;
  END;
  
  BEGIN
    PERFORM cron.unschedule('beehiiv-incremental-sync');
  EXCEPTION WHEN OTHERS THEN
    -- Ignore if job doesn't exist
    NULL;
  END;
  
  -- Schedule daily sync at 6 AM UTC
  PERFORM cron.schedule(
    'beehiiv-daily-sync',
    '0 6 * * *',
    'SELECT net.http_post(url := ''https://wrvvlmevpvcenauglcyz.supabase.co/functions/v1/beehiiv-automated-sync'', headers := ''{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndydnZsbWV2cHZjZW5hdWdsY3l6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTg1Mzk1MCwiZXhwIjoyMDY1NDI5OTUwfQ.H_srIeAcaWEtM3a2u9-dxLLmpU7mmHOHqrHCvWOwlEg"}''::jsonb, body := ''{"trigger": "daily_cron"}''::jsonb);'
  );
  
  -- Schedule incremental sync every 4 hours
  PERFORM cron.schedule(
    'beehiiv-incremental-sync',
    '0 */4 * * *',
    'SELECT net.http_post(url := ''https://wrvvlmevpvcenauglcyz.supabase.co/functions/v1/beehiiv-automated-sync'', headers := ''{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndydnZsbWV2cHZjZW5hdWdsY3l6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTg1Mzk1MCwiZXhwIjoyMDY1NDI5OTUwfQ.H_srIeAcaWEtM3a2u9-dxLLmpU7mmHOHqrHCvWOwlEg"}''::jsonb, body := ''{"trigger": "incremental_cron"}''::jsonb);'
  );
END;
$$;

-- Fix log_auth_event function
CREATE OR REPLACE FUNCTION public.log_auth_event(
  p_user_email text, 
  p_auth_method text, 
  p_action_type text, 
  p_ip_address text DEFAULT NULL::text, 
  p_user_agent text DEFAULT NULL::text, 
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.authentication_audit_log (
    user_email, auth_method, action_type, ip_address, user_agent, metadata
  ) VALUES (
    p_user_email, p_auth_method, p_action_type, p_ip_address, p_user_agent, p_metadata
  );
END;
$$;

-- Fix cleanup_old_sync_jobs function
CREATE OR REPLACE FUNCTION public.cleanup_old_sync_jobs()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
BEGIN
  -- Clean up sync jobs older than 7 days
  DELETE FROM public.beehiiv_sync_jobs 
  WHERE created_at < NOW() - INTERVAL '7 days'
    AND status IN ('completed', 'failed');
    
  -- Clean up sync failures older than 3 days
  DELETE FROM public.beehiiv_sync_failures 
  WHERE created_at < NOW() - INTERVAL '3 days';
  
  -- Mark stuck jobs as failed (running for more than 2 hours)
  UPDATE public.beehiiv_sync_jobs 
  SET 
    status = 'failed',
    error_message = 'Job stuck and automatically failed',
    completed_at = NOW()
  WHERE status = 'running' 
    AND updated_at < NOW() - INTERVAL '2 hours';
END;
$$;

-- Fix update_daily_message_count function
CREATE OR REPLACE FUNCTION public.update_daily_message_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
BEGIN
  -- Reset count if it's a new day
  UPDATE public.user_telegram_permissions 
  SET 
    messages_sent_today = CASE 
      WHEN last_message_date < CURRENT_DATE THEN 1 
      ELSE messages_sent_today + 1 
    END,
    last_message_date = CURRENT_DATE
  WHERE user_id = NEW.sender_user_id;
  
  RETURN NEW;
END;
$$;

-- Fix validate_password_strength function
CREATE OR REPLACE FUNCTION public.validate_password_strength(password text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
BEGIN
  -- Minimum 8 characters, at least one letter and one number
  RETURN length(password) >= 8 
    AND password ~ '[A-Za-z]' 
    AND password ~ '[0-9]';
END;
$$;

-- Fix is_account_locked function
CREATE OR REPLACE FUNCTION public.is_account_locked(p_email text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
DECLARE
  locked_until_time timestamp with time zone;
BEGIN
  SELECT locked_until INTO locked_until_time
  FROM public.beehiiv_subscribers
  WHERE email = p_email;
  
  RETURN locked_until_time IS NOT NULL AND locked_until_time > now();
END;
$$;

-- Fix apply_highlight_rules function
CREATE OR REPLACE FUNCTION public.apply_highlight_rules()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
BEGIN
  -- Apply user-based rules
  INSERT INTO auto_highlights (telegram_message_id, rule_id, priority_score)
  SELECT 
    NEW.id,
    chr.id,
    chr.priority
  FROM chat_highlight_rules chr
  WHERE chr.rule_type = 'user' 
    AND chr.is_active = true
    AND (
      (chr.rule_config->>'username' = NEW.username) OR
      (chr.rule_config->>'user_id' = NEW.user_id::text) OR
      (chr.rule_config->>'first_name' = NEW.first_name)
    );

  -- Apply keyword-based rules
  INSERT INTO auto_highlights (telegram_message_id, rule_id, priority_score)
  SELECT 
    NEW.id,
    chr.id,
    chr.priority
  FROM chat_highlight_rules chr
  WHERE chr.rule_type = 'keyword' 
    AND chr.is_active = true
    AND NEW.message_text IS NOT NULL
    AND NEW.message_text ILIKE '%' || (chr.rule_config->>'keyword') || '%';

  -- Apply topic-based rules
  INSERT INTO auto_highlights (telegram_message_id, rule_id, priority_score)
  SELECT 
    NEW.id,
    chr.id,
    chr.priority
  FROM chat_highlight_rules chr
  WHERE chr.rule_type = 'topic' 
    AND chr.is_active = true
    AND NEW.topic_name IS NOT NULL
    AND NEW.topic_name = (chr.rule_config->>'topic_name');

  -- Apply engagement-based rules (for updates)
  IF TG_OP = 'UPDATE' AND OLD.likes_count != NEW.likes_count THEN
    INSERT INTO auto_highlights (telegram_message_id, rule_id, priority_score)
    SELECT 
      NEW.id,
      chr.id,
      chr.priority
    FROM chat_highlight_rules chr
    WHERE chr.rule_type = 'engagement' 
      AND chr.is_active = true
      AND NEW.likes_count >= (chr.rule_config->>'min_likes')::integer
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

-- Fix update_updated_at_column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;
