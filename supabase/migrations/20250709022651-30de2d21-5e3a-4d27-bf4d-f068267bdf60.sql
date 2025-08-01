-- Create table for X account monitoring configuration
CREATE TABLE public.x_account_monitoring (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  account_handle TEXT NOT NULL,
  account_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  monitor_frequency_minutes INTEGER NOT NULL DEFAULT 15,
  content_type TEXT NOT NULL DEFAULT 'all_posts',
  keyword_filters TEXT[],
  last_sync_at TIMESTAMP WITH TIME ZONE,
  last_post_id TEXT,
  error_count INTEGER NOT NULL DEFAULT 0,
  last_error_message TEXT,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(account_handle)
);

-- Create table for storing X posts
CREATE TABLE public.x_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  x_post_id TEXT NOT NULL UNIQUE,
  account_id UUID REFERENCES public.x_account_monitoring(id),
  account_handle TEXT NOT NULL,
  post_text TEXT,
  post_url TEXT,
  author_name TEXT,
  author_username TEXT,
  retweet_count INTEGER DEFAULT 0,
  like_count INTEGER DEFAULT 0,
  reply_count INTEGER DEFAULT 0,
  quote_count INTEGER DEFAULT 0,
  posted_at TIMESTAMP WITH TIME ZONE,
  collected_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  post_metadata JSONB DEFAULT '{}',
  is_retweet BOOLEAN DEFAULT false,
  is_reply BOOLEAN DEFAULT false,
  reply_to_post_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for X sentiment analysis
CREATE TABLE public.x_sentiment_analysis (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  x_post_id UUID REFERENCES public.x_posts(id),
  sentiment_score NUMERIC NOT NULL,
  sentiment_label TEXT NOT NULL,
  confidence_score NUMERIC NOT NULL,
  emotional_tone TEXT,
  topic_categories TEXT[],
  keywords_detected TEXT[],
  analysis_metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.x_account_monitoring ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.x_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.x_sentiment_analysis ENABLE ROW LEVEL SECURITY;

-- Create policies for x_account_monitoring
CREATE POLICY "Admins can manage X account monitoring" 
ON public.x_account_monitoring 
FOR ALL
USING (is_current_user_admin());

CREATE POLICY "Service role can manage X account monitoring" 
ON public.x_account_monitoring 
FOR ALL
USING (true);

-- Create policies for x_posts
CREATE POLICY "Admins can view X posts" 
ON public.x_posts 
FOR SELECT
USING (is_current_user_admin());

CREATE POLICY "Service role can manage X posts" 
ON public.x_posts 
FOR ALL
USING (true);

CREATE POLICY "Authenticated users can view X posts" 
ON public.x_posts 
FOR SELECT
USING (true);

-- Create policies for x_sentiment_analysis
CREATE POLICY "Authenticated users can view X sentiment analysis" 
ON public.x_sentiment_analysis 
FOR SELECT
USING (true);

CREATE POLICY "Service role can manage X sentiment analysis" 
ON public.x_sentiment_analysis 
FOR ALL
USING (true);

-- Add triggers for updated_at columns
CREATE TRIGGER update_x_account_monitoring_updated_at
BEFORE UPDATE ON public.x_account_monitoring
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_x_sentiment_analysis_updated_at
BEFORE UPDATE ON public.x_sentiment_analysis
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_x_posts_account_handle ON public.x_posts(account_handle);
CREATE INDEX idx_x_posts_posted_at ON public.x_posts(posted_at);
CREATE INDEX idx_x_posts_collected_at ON public.x_posts(collected_at);
CREATE INDEX idx_x_account_monitoring_active ON public.x_account_monitoring(is_active) WHERE is_active = true;