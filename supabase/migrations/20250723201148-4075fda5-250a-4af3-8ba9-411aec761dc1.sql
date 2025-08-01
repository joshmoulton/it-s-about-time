-- First, let's backup the existing data structure and see what we have
CREATE TABLE IF NOT EXISTS telegram_messages_backup AS 
SELECT * FROM telegram_messages;

-- Drop the old table and recreate with the correct schema
DROP TABLE IF EXISTS telegram_messages CASCADE;

-- Create the new telegram_messages table with the correct schema
CREATE TABLE public.telegram_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  telegram_message_id BIGINT NOT NULL,
  chat_id BIGINT NOT NULL,
  user_id BIGINT,
  username TEXT,
  first_name TEXT,
  last_name TEXT,
  message_text TEXT,
  message_type TEXT DEFAULT 'text',
  message_thread_id BIGINT,
  reply_to_message_id BIGINT,
  forwarded_from TEXT,
  media_url TEXT,
  media_type TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT now(),
  message_time TIMESTAMP WITH TIME ZONE DEFAULT now(),
  topic_name TEXT,
  is_highlighted BOOLEAN DEFAULT false,
  is_hidden BOOLEAN DEFAULT false,
  likes_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_telegram_messages_message_id ON public.telegram_messages(telegram_message_id);
CREATE INDEX idx_telegram_messages_chat_id ON public.telegram_messages(chat_id);
CREATE INDEX idx_telegram_messages_user_id ON public.telegram_messages(user_id);
CREATE INDEX idx_telegram_messages_timestamp ON public.telegram_messages(timestamp);
CREATE INDEX idx_telegram_messages_thread_id ON public.telegram_messages(message_thread_id);
CREATE INDEX idx_telegram_messages_topic_name ON public.telegram_messages(topic_name);
CREATE INDEX idx_telegram_messages_is_hidden ON public.telegram_messages(is_hidden);

-- Enable RLS
ALTER TABLE public.telegram_messages ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Premium users can read telegram messages" 
ON public.telegram_messages 
FOR SELECT 
USING ((get_current_user_tier() = 'premium'::subscription_tier) OR is_current_user_admin());

CREATE POLICY "Admins can manage telegram messages" 
ON public.telegram_messages 
FOR ALL 
USING (is_current_user_admin_fast()) 
WITH CHECK (is_current_user_admin_fast());

-- Migrate existing data if any exists in backup
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'telegram_messages_backup') THEN
    INSERT INTO public.telegram_messages (
      telegram_message_id,
      chat_id,
      message_text,
      timestamp,
      message_time,
      created_at,
      updated_at
    )
    SELECT 
      COALESCE(message_id, id),
      -1002083186778, -- Default chat ID from the logs
      message_text,
      message_time,
      message_time,
      message_time,
      message_time
    FROM telegram_messages_backup
    ON CONFLICT (telegram_message_id, chat_id) DO NOTHING;
  END IF;
END $$;

-- Create unique constraint to prevent duplicate messages
ALTER TABLE public.telegram_messages 
ADD CONSTRAINT unique_telegram_message_chat UNIQUE (telegram_message_id, chat_id);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_telegram_messages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_telegram_messages_updated_at
    BEFORE UPDATE ON public.telegram_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_telegram_messages_updated_at();