-- Create newsletters table
CREATE TABLE public.newsletters (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT,
  excerpt TEXT,
  featured_image_url TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  published_at TIMESTAMP WITH TIME ZONE,
  view_count INTEGER DEFAULT 0,
  required_tier subscription_tier DEFAULT 'free',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create telegram_sync_status table
CREATE TABLE public.telegram_sync_status (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  status TEXT NOT NULL DEFAULT 'idle',
  last_sync_at TIMESTAMP WITH TIME ZONE,
  sync_duration_seconds INTEGER,
  messages_synced INTEGER DEFAULT 0,
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create telegram_messages table
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
  topic_name TEXT,
  is_highlighted BOOLEAN DEFAULT false,
  is_hidden BOOLEAN DEFAULT false,
  likes_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.newsletters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.telegram_sync_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.telegram_messages ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for newsletters
CREATE POLICY "Anyone can view published newsletters" 
ON public.newsletters 
FOR SELECT 
USING (status = 'published');

CREATE POLICY "Admin users can manage newsletters" 
ON public.newsletters 
FOR ALL 
USING (is_current_user_admin());

-- Create RLS policies for telegram_sync_status
CREATE POLICY "Premium users can view sync status" 
ON public.telegram_sync_status 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM beehiiv_subscribers 
  WHERE id = (
    SELECT id FROM beehiiv_subscribers 
    WHERE email = current_setting('request.jwt.claims', true)::json->>'email'
  ) AND subscription_tier = 'premium'
));

-- Create RLS policies for telegram_messages
CREATE POLICY "Premium users can view telegram messages" 
ON public.telegram_messages 
FOR SELECT 
USING (
  is_hidden = false AND 
  EXISTS (
    SELECT 1 FROM beehiiv_subscribers 
    WHERE id = (
      SELECT id FROM beehiiv_subscribers 
      WHERE email = current_setting('request.jwt.claims', true)::json->>'email'
    ) AND subscription_tier IN ('paid', 'premium')
  )
);

-- Create indexes for performance
CREATE INDEX idx_newsletters_status_published_at ON public.newsletters(status, published_at DESC);
CREATE INDEX idx_telegram_sync_status_created_at ON public.telegram_sync_status(created_at DESC);
CREATE INDEX idx_telegram_messages_timestamp ON public.telegram_messages(timestamp DESC);
CREATE INDEX idx_telegram_messages_topic_name ON public.telegram_messages(topic_name);
CREATE INDEX idx_telegram_messages_is_hidden ON public.telegram_messages(is_hidden);

-- Create triggers for updated_at
CREATE TRIGGER update_newsletters_updated_at
BEFORE UPDATE ON public.newsletters
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_telegram_sync_status_updated_at
BEFORE UPDATE ON public.telegram_sync_status
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_telegram_messages_updated_at
BEFORE UPDATE ON public.telegram_messages
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();