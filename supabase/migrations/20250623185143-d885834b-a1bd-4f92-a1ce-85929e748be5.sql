
-- Create table for chat highlight rules configuration
CREATE TABLE public.chat_highlight_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  rule_name TEXT NOT NULL,
  rule_type TEXT NOT NULL CHECK (rule_type IN ('user', 'keyword', 'topic', 'engagement', 'time')),
  rule_config JSONB NOT NULL DEFAULT '{}'::jsonb,
  priority INTEGER NOT NULL DEFAULT 5 CHECK (priority >= 1 AND priority <= 10),
  is_active BOOLEAN NOT NULL DEFAULT true,
  highlight_color TEXT DEFAULT '#fbbf24',
  highlight_style TEXT DEFAULT 'background',
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for automatic highlight assignments
CREATE TABLE public.auto_highlights (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  telegram_message_id UUID REFERENCES telegram_messages(id) ON DELETE CASCADE,
  rule_id UUID REFERENCES chat_highlight_rules(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  priority_score INTEGER NOT NULL DEFAULT 5
);

-- Add webhook configuration to system settings
INSERT INTO public.system_settings (setting_key, setting_value, description)
VALUES 
  ('telegram_webhook_auto_enabled', '{"enabled": true}', 'Enable automatic Telegram webhook for real-time updates'),
  ('telegram_sync_interval_minutes', '{"interval": 5}', 'Interval for background sync jobs in minutes'),
  ('chat_highlight_auto_enabled', '{"enabled": true}', 'Enable automatic chat highlighting based on rules')
ON CONFLICT (setting_key) DO NOTHING;

-- Add indexes for performance
CREATE INDEX idx_chat_highlight_rules_type_active ON public.chat_highlight_rules(rule_type, is_active);
CREATE INDEX idx_auto_highlights_message_id ON public.auto_highlights(telegram_message_id);
CREATE INDEX idx_auto_highlights_expires_at ON public.auto_highlights(expires_at) WHERE expires_at IS NOT NULL;

-- Enable RLS
ALTER TABLE public.chat_highlight_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auto_highlights ENABLE ROW LEVEL SECURITY;

-- Create policies for admin access
CREATE POLICY "Allow authenticated users to view highlight rules" 
  ON public.chat_highlight_rules 
  FOR SELECT 
  TO authenticated 
  USING (true);

CREATE POLICY "Allow authenticated users to manage highlight rules" 
  ON public.chat_highlight_rules 
  FOR ALL 
  TO authenticated 
  USING (true);

CREATE POLICY "Allow authenticated users to view auto highlights" 
  ON public.auto_highlights 
  FOR SELECT 
  TO authenticated 
  USING (true);

CREATE POLICY "Allow service role to manage auto highlights" 
  ON public.auto_highlights 
  FOR ALL 
  TO service_role 
  USING (true);

-- Add trigger to update updated_at column
CREATE TRIGGER update_chat_highlight_rules_updated_at
  BEFORE UPDATE ON public.chat_highlight_rules
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to automatically apply highlight rules
CREATE OR REPLACE FUNCTION apply_highlight_rules()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;

-- Create trigger for automatic highlighting
CREATE TRIGGER auto_apply_highlight_rules
  AFTER INSERT OR UPDATE ON telegram_messages
  FOR EACH ROW
  EXECUTE FUNCTION apply_highlight_rules();
