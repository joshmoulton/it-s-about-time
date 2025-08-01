
-- Create telegram_messages table to store all incoming Telegram messages
CREATE TABLE public.telegram_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  telegram_message_id BIGINT NOT NULL,
  chat_id BIGINT NOT NULL,
  user_id BIGINT,
  username TEXT,
  first_name TEXT,
  last_name TEXT,
  message_text TEXT,
  message_type TEXT NOT NULL DEFAULT 'text', -- text, photo, document, sticker, etc.
  reply_to_message_id BIGINT,
  forwarded_from TEXT,
  media_url TEXT,
  media_type TEXT,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  is_highlighted BOOLEAN DEFAULT FALSE,
  is_hidden BOOLEAN DEFAULT FALSE,
  likes_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create chat_highlights table for manually curated messages
CREATE TABLE public.chat_highlights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  telegram_message_id UUID REFERENCES public.telegram_messages(id) ON DELETE CASCADE,
  promoted_by UUID REFERENCES public.beehiiv_subscribers(id),
  promoted_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  priority_order INTEGER DEFAULT 0,
  custom_title TEXT,
  custom_description TEXT
);

-- Create admin_feed_controls table for managing display settings
CREATE TABLE public.admin_feed_controls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_name TEXT NOT NULL UNIQUE, -- 'chat_highlights', 'live_chat', 'newsletter'
  max_messages INTEGER DEFAULT 10,
  auto_refresh_seconds INTEGER DEFAULT 30,
  keyword_filters TEXT[], -- array of keywords to filter by
  author_whitelist TEXT[], -- array of usernames to always show
  author_blacklist TEXT[], -- array of usernames to always hide
  is_active BOOLEAN DEFAULT TRUE,
  display_rules JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.telegram_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_highlights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_feed_controls ENABLE ROW LEVEL SECURITY;

-- RLS Policies for telegram_messages (premium users only)
CREATE POLICY "Premium users can view telegram messages"
  ON public.telegram_messages
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.beehiiv_subscribers 
      WHERE id = (
        SELECT id FROM public.beehiiv_subscribers 
        WHERE email = current_setting('request.jwt.claims', true)::json->>'email'
      )
      AND subscription_tier IN ('premium')
    )
    AND is_hidden = FALSE
  );

-- RLS Policies for chat_highlights (premium users only)
CREATE POLICY "Premium users can view chat highlights"
  ON public.chat_highlights
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.beehiiv_subscribers 
      WHERE id = (
        SELECT id FROM public.beehiiv_subscribers 
        WHERE email = current_setting('request.jwt.claims', true)::json->>'email'
      )
      AND subscription_tier IN ('premium')
    )
  );

-- RLS Policies for admin_feed_controls (premium users only for now)
CREATE POLICY "Premium users can view feed controls"
  ON public.admin_feed_controls
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.beehiiv_subscribers 
      WHERE id = (
        SELECT id FROM public.beehiiv_subscribers 
        WHERE email = current_setting('request.jwt.claims', true)::json->>'email'
      )
      AND subscription_tier IN ('premium')
    )
  );

-- Create indexes for better performance
CREATE INDEX idx_telegram_messages_timestamp ON public.telegram_messages(timestamp DESC);
CREATE INDEX idx_telegram_messages_highlighted ON public.telegram_messages(is_highlighted, timestamp DESC);
CREATE INDEX idx_telegram_messages_hidden ON public.telegram_messages(is_hidden);
CREATE INDEX idx_chat_highlights_priority ON public.chat_highlights(priority_order DESC, promoted_at DESC);

-- Insert default admin feed controls
INSERT INTO public.admin_feed_controls (section_name, max_messages, auto_refresh_seconds, display_rules) VALUES
('chat_highlights', 5, 60, '{"show_author": true, "show_timestamp": true, "show_likes": true}'::jsonb),
('live_chat', 20, 10, '{"show_author": true, "show_timestamp": true, "show_avatar": true}'::jsonb),
('newsletter', 3, 300, '{"show_author": false, "show_timestamp": false}'::jsonb);

-- Create trigger for updating telegram_messages updated_at
CREATE TRIGGER update_telegram_messages_updated_at 
  BEFORE UPDATE ON public.telegram_messages 
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Create trigger for updating admin_feed_controls updated_at  
CREATE TRIGGER update_admin_feed_controls_updated_at 
  BEFORE UPDATE ON public.admin_feed_controls 
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
