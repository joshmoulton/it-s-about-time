-- Fix highlight_topics table permissions and create RLS policies

-- Enable RLS on highlight_topics if not already enabled
ALTER TABLE public.highlight_topics ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users to view all topics
CREATE POLICY "Users can view all highlight topics" 
ON public.highlight_topics 
FOR SELECT 
USING (true);

-- Create policy for authenticated users to create topics (needed for auto-creation)
CREATE POLICY "Authenticated users can create topics" 
ON public.highlight_topics 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

-- Create policy for authenticated users to update topics
CREATE POLICY "Authenticated users can update topics" 
ON public.highlight_topics 
FOR UPDATE 
USING (auth.uid() IS NOT NULL);

-- Enable RLS on highlight_comments if not already enabled
ALTER TABLE public.highlight_comments ENABLE ROW LEVEL SECURITY;

-- Create policy for users to view all comments
CREATE POLICY "Users can view all comments" 
ON public.highlight_comments 
FOR SELECT 
USING (true);

-- Create policy for authenticated users to create comments
CREATE POLICY "Authenticated users can create comments" 
ON public.highlight_comments 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL AND user_email = auth.email());

-- Create policy for users to update their own comments
CREATE POLICY "Users can update their own comments" 
ON public.highlight_comments 
FOR UPDATE 
USING (auth.uid() IS NOT NULL AND user_email = auth.email());

-- Enable RLS on comment_votes if not already enabled
ALTER TABLE public.comment_votes ENABLE ROW LEVEL SECURITY;

-- Create policy for users to view votes (needed for vote display)
CREATE POLICY "Users can view comment votes" 
ON public.comment_votes 
FOR SELECT 
USING (true);

-- Create policy for authenticated users to manage their own votes
CREATE POLICY "Users can manage their own votes" 
ON public.comment_votes 
FOR ALL 
USING (auth.uid() IS NOT NULL AND user_email = auth.email())
WITH CHECK (auth.uid() IS NOT NULL AND user_email = auth.email());

-- Insert some sample topics to get the chat highlights working
INSERT INTO public.highlight_topics (
  topic_title, 
  topic_slug, 
  keyword_group, 
  message_count, 
  engagement_score, 
  first_mentioned_at, 
  last_activity_at, 
  is_trending, 
  topic_description
) VALUES 
(
  'BTC Price Discussion', 
  'btc-price-discussion', 
  ARRAY['BTC', 'Bitcoin', 'price'], 
  25, 
  85, 
  NOW() - INTERVAL '2 hours', 
  NOW() - INTERVAL '30 minutes', 
  true, 
  'Community discussion about Bitcoin price movements and predictions'
),
(
  'Options Trading Strategies', 
  'options-trading-strategies', 
  ARRAY['calls', 'puts', 'options'], 
  18, 
  72, 
  NOW() - INTERVAL '4 hours', 
  NOW() - INTERVAL '1 hour', 
  true, 
  'Discussions about options trading strategies and market plays'
),
(
  'Market Sentiment Analysis', 
  'market-sentiment-analysis', 
  ARRAY['bullish', 'bearish', 'moon'], 
  32, 
  93, 
  NOW() - INTERVAL '3 hours', 
  NOW() - INTERVAL '15 minutes', 
  true, 
  'General market sentiment and trading psychology discussions'
),
(
  'Crypto Altcoins Discussion', 
  'crypto-altcoins-discussion', 
  ARRAY['ETH', 'SOL', 'altcoins'], 
  21, 
  78, 
  NOW() - INTERVAL '5 hours', 
  NOW() - INTERVAL '2 hours', 
  false, 
  'Discussion about alternative cryptocurrencies and their potential'
),
(
  'SPY Trading Analysis', 
  'spy-trading-analysis', 
  ARRAY['SPY', 'S&P', 'index'], 
  15, 
  68, 
  NOW() - INTERVAL '6 hours', 
  NOW() - INTERVAL '3 hours', 
  false, 
  'Analysis and discussion of SPY trading opportunities'
)
ON CONFLICT (topic_slug) DO NOTHING;