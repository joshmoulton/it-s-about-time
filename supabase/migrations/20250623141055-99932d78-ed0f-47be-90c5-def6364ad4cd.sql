
-- Add topic-related columns to telegram_messages table
ALTER TABLE public.telegram_messages 
ADD COLUMN message_thread_id BIGINT,
ADD COLUMN topic_name TEXT;

-- Create telegram_topics table to manage topic metadata
CREATE TABLE public.telegram_topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  telegram_topic_id BIGINT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  display_order INTEGER DEFAULT 0,
  message_count INTEGER DEFAULT 0,
  last_activity_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on telegram_topics
ALTER TABLE public.telegram_topics ENABLE ROW LEVEL SECURITY;

-- Create policy for telegram_topics (premium users only)
CREATE POLICY "Premium users can view telegram topics"
  ON public.telegram_topics
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
    AND is_active = TRUE
  );

-- Create indexes for better performance
CREATE INDEX idx_telegram_messages_thread_id ON public.telegram_messages(message_thread_id);
CREATE INDEX idx_telegram_topics_active ON public.telegram_topics(is_active, display_order);
CREATE INDEX idx_telegram_topics_activity ON public.telegram_topics(last_activity_at DESC);

-- Create trigger for updating telegram_topics updated_at
CREATE TRIGGER update_telegram_topics_updated_at 
  BEFORE UPDATE ON public.telegram_topics 
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
