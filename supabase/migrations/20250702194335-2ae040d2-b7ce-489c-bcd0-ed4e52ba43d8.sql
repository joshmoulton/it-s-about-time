-- Create telegram_messages table for community chat
CREATE TABLE IF NOT EXISTS public.telegram_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  telegram_message_id BIGINT,
  chat_id BIGINT,
  user_id BIGINT,
  username TEXT,
  first_name TEXT,
  last_name TEXT,
  message_text TEXT,
  message_type TEXT DEFAULT 'text',
  message_thread_id BIGINT,
  topic_name TEXT,
  reply_to_message_id BIGINT,
  forwarded_from TEXT,
  media_url TEXT,
  media_type TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT now(),
  is_highlighted BOOLEAN DEFAULT false,
  is_hidden BOOLEAN DEFAULT false,
  likes_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create newsletters table for newsletter widget
CREATE TABLE IF NOT EXISTS public.newsletters (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT,
  excerpt TEXT,
  featured_image_url TEXT,
  status TEXT DEFAULT 'draft',
  published_at TIMESTAMP WITH TIME ZONE,
  read_time_minutes INTEGER DEFAULT 5,
  view_count INTEGER DEFAULT 0,
  likes_count INTEGER DEFAULT 0,
  required_tier subscription_tier DEFAULT 'free',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.telegram_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.newsletters ENABLE ROW LEVEL SECURITY;

-- Create policies for telegram_messages (allow all authenticated users to view)
CREATE POLICY "Allow authenticated users to view telegram messages" 
  ON public.telegram_messages 
  FOR SELECT 
  TO authenticated 
  USING (true);

-- Create policies for newsletters (allow all authenticated users to view published)
CREATE POLICY "Allow authenticated users to view published newsletters" 
  ON public.newsletters 
  FOR SELECT 
  TO authenticated 
  USING (status = 'published');

CREATE POLICY "Allow admins to manage newsletters" 
  ON public.newsletters 
  FOR ALL 
  TO authenticated 
  USING (is_current_user_admin());

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_telegram_messages_timestamp ON public.telegram_messages(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_telegram_messages_chat_id ON public.telegram_messages(chat_id);
CREATE INDEX IF NOT EXISTS idx_newsletters_published_at ON public.newsletters(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_newsletters_status ON public.newsletters(status);

-- Insert some sample telegram messages for testing
INSERT INTO public.telegram_messages (
  telegram_message_id, chat_id, username, first_name, message_text, 
  topic_name, timestamp, likes_count
) VALUES 
  (1001, -1001234567890, 'cryptotrader_alex', 'Alex', 'Just spotted massive whale activity on $BTC - 2,500 BTC moved to exchanges in the last hour.', 'Trading Signals', now() - interval '15 minutes', 47),
  (1002, -1001234567890, 'eth_analyst', 'Sarah', 'ETH breaking resistance at $2,450. Volume is confirming the breakout.', 'Technical Analysis', now() - interval '45 minutes', 32),
  (1003, -1001234567890, 'options_wizard', 'Mike', 'SPY calls printing hard today. 460 strike exp Friday looking juicy.', 'Options Talk', now() - interval '1 hour', 28),
  (1004, -1001234567890, 'defi_degen', 'John', 'New farming opportunity on Arbitrum with 150% APY. DYOR but looks legit.', 'DeFi', now() - interval '2 hours', 19)
ON CONFLICT DO NOTHING;

-- Insert some sample newsletters
INSERT INTO public.newsletters (
  title, excerpt, status, published_at, read_time_minutes, content
) VALUES 
  ('Weekly Market Outlook: Crypto Rally Continues', 'Bitcoin and Ethereum lead the charge as institutional adoption accelerates...', 'published', now() - interval '2 days', 8, 'Full newsletter content here...'),
  ('DeFi Protocols to Watch in 2025', 'Emerging protocols showing strong fundamentals and growing TVL...', 'published', now() - interval '1 week', 12, 'Full newsletter content here...')
ON CONFLICT DO NOTHING;