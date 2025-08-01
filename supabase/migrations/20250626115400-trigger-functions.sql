
-- Trigger Functions

-- Fix update_daily_message_count function
CREATE OR REPLACE FUNCTION public.update_daily_message_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
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

-- Fix apply_highlight_rules function
CREATE OR REPLACE FUNCTION public.apply_highlight_rules()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
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
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;
