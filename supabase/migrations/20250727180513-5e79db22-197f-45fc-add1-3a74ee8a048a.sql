-- Fix search_path security issues for trigger functions
-- This ensures functions operate with a secure, predictable search path

-- Fix update_sync_status_timestamp function
CREATE OR REPLACE FUNCTION public.update_sync_status_timestamp()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$function$;

-- Fix update_telegram_messages_updated_at function  
CREATE OR REPLACE FUNCTION public.update_telegram_messages_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$function$;

-- Fix update_topic_activity function (the one with bigint parameter)
CREATE OR REPLACE FUNCTION public.update_topic_activity(topic_id bigint)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE telegram_topic_mappings
  SET last_active = now()
  WHERE telegram_topic_id = topic_id;
END;
$function$;

-- Fix update_topic_activity trigger function (if it exists)
CREATE OR REPLACE FUNCTION public.update_topic_activity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE public.highlight_topics 
  SET 
    last_activity_at = now(),
    engagement_score = (
      SELECT COALESCE(SUM(upvotes - downvotes), 0) 
      FROM public.highlight_comments 
      WHERE topic_id = NEW.topic_id AND is_deleted = false
    )
  WHERE id = NEW.topic_id;
  
  RETURN NEW;
END;
$function$;