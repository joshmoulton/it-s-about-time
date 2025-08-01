
-- Phase 1: Fix Database Function Volatility Issues
-- Update all message insertion and sync-related functions to be VOLATILE

-- Fix processAndInsertMessage-related functions to allow INSERTs
CREATE OR REPLACE FUNCTION public.apply_highlight_rules()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
VOLATILE  -- Changed from STABLE to VOLATILE to allow INSERTs
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

-- Fix update_daily_message_count to allow INSERTs/UPDATEs
CREATE OR REPLACE FUNCTION public.update_daily_message_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
VOLATILE  -- Changed from STABLE to VOLATILE to allow UPDATEs
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

-- Fix update_updated_at_column trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
VOLATILE  -- Changed from STABLE to VOLATILE for trigger functions
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

-- Create new function specifically for message insertion to ensure it's VOLATILE
CREATE OR REPLACE FUNCTION public.insert_telegram_message(
  p_telegram_message_id bigint,
  p_chat_id bigint,
  p_user_id bigint DEFAULT NULL,
  p_username text DEFAULT NULL,
  p_first_name text DEFAULT NULL,
  p_last_name text DEFAULT NULL,
  p_message_text text DEFAULT NULL,
  p_message_type text DEFAULT 'text',
  p_message_thread_id bigint DEFAULT NULL,
  p_reply_to_message_id bigint DEFAULT NULL,
  p_forwarded_from text DEFAULT NULL,
  p_media_url text DEFAULT NULL,
  p_media_type text DEFAULT NULL,
  p_timestamp timestamp with time zone DEFAULT NULL,
  p_topic_name text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
VOLATILE  -- Explicitly VOLATILE for INSERT operations
SET search_path = public
AS $$
DECLARE
  message_id uuid;
BEGIN
  INSERT INTO public.telegram_messages (
    telegram_message_id,
    chat_id,
    user_id,
    username,
    first_name,
    last_name,
    message_text,
    message_type,
    message_thread_id,
    reply_to_message_id,
    forwarded_from,
    media_url,
    media_type,
    timestamp,
    topic_name,
    is_highlighted,
    is_hidden,
    likes_count
  ) VALUES (
    p_telegram_message_id,
    p_chat_id,
    p_user_id,
    p_username,
    p_first_name,
    p_last_name,
    p_message_text,
    p_message_type,
    p_message_thread_id,
    p_reply_to_message_id,
    p_forwarded_from,
    p_media_url,
    p_media_type,
    COALESCE(p_timestamp, now()),
    p_topic_name,
    false,
    false,
    0
  ) RETURNING id INTO message_id;
  
  RETURN message_id;
END;
$$;

-- Create function for topic activity updates
CREATE OR REPLACE FUNCTION public.update_topic_activity(
  p_topic_id bigint,
  p_topic_name text,
  p_last_activity timestamp with time zone DEFAULT now()
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
VOLATILE
SET search_path = public
AS $$
BEGIN
  -- Update or insert topic activity
  INSERT INTO public.telegram_topics (
    telegram_topic_id,
    name,
    last_activity_at,
    message_count
  ) VALUES (
    p_topic_id,
    p_topic_name,
    p_last_activity,
    1
  )
  ON CONFLICT (telegram_topic_id) 
  DO UPDATE SET
    last_activity_at = p_last_activity,
    message_count = telegram_topics.message_count + 1,
    updated_at = now();
END;
$$;
