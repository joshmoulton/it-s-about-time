-- Create sentiment analysis tables
CREATE TABLE public.telegram_sentiment_analysis (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  telegram_message_id UUID REFERENCES public.telegram_messages(id) ON DELETE CASCADE,
  sentiment_score NUMERIC(3,2) NOT NULL, -- -1.00 to 1.00
  sentiment_label TEXT NOT NULL, -- positive, negative, neutral
  confidence_score NUMERIC(3,2) NOT NULL, -- 0.00 to 1.00
  emotional_tone TEXT, -- happy, angry, fearful, excited, etc.
  topic_categories TEXT[], -- array of detected topics
  keywords_detected TEXT[], -- key sentiment-driving words
  analysis_metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create sentiment trends aggregation table
CREATE TABLE public.sentiment_trends (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  time_period TIMESTAMP WITH TIME ZONE NOT NULL,
  period_type TEXT NOT NULL, -- hourly, daily, weekly
  avg_sentiment_score NUMERIC(3,2) NOT NULL,
  message_count INTEGER NOT NULL DEFAULT 0,
  positive_count INTEGER NOT NULL DEFAULT 0,
  negative_count INTEGER NOT NULL DEFAULT 0,
  neutral_count INTEGER NOT NULL DEFAULT 0,
  dominant_topics TEXT[],
  trending_keywords TEXT[],
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(time_period, period_type)
);

-- Create sentiment alerts table
CREATE TABLE public.sentiment_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  alert_type TEXT NOT NULL, -- spike, drop, trend_change
  severity TEXT NOT NULL, -- low, medium, high, critical
  sentiment_threshold NUMERIC(3,2) NOT NULL,
  triggered_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  message_count INTEGER NOT NULL DEFAULT 0,
  avg_sentiment NUMERIC(3,2) NOT NULL,
  alert_data JSONB DEFAULT '{}',
  is_resolved BOOLEAN NOT NULL DEFAULT false,
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.telegram_sentiment_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sentiment_trends ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sentiment_alerts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Authenticated users can view sentiment analysis" 
  ON public.telegram_sentiment_analysis 
  FOR SELECT 
  TO authenticated 
  USING (true);

CREATE POLICY "Service role can manage sentiment analysis" 
  ON public.telegram_sentiment_analysis 
  FOR ALL 
  TO service_role 
  USING (true);

CREATE POLICY "Authenticated users can view sentiment trends" 
  ON public.sentiment_trends 
  FOR SELECT 
  TO authenticated 
  USING (true);

CREATE POLICY "Service role can manage sentiment trends" 
  ON public.sentiment_trends 
  FOR ALL 
  TO service_role 
  USING (true);

CREATE POLICY "Authenticated users can view sentiment alerts" 
  ON public.sentiment_alerts 
  FOR SELECT 
  TO authenticated 
  USING (true);

CREATE POLICY "Service role can manage sentiment alerts" 
  ON public.sentiment_alerts 
  FOR ALL 
  TO service_role 
  USING (true);

-- Create indexes for performance
CREATE INDEX idx_sentiment_analysis_message_id ON public.telegram_sentiment_analysis(telegram_message_id);
CREATE INDEX idx_sentiment_analysis_sentiment_score ON public.telegram_sentiment_analysis(sentiment_score);
CREATE INDEX idx_sentiment_analysis_created_at ON public.telegram_sentiment_analysis(created_at);
CREATE INDEX idx_sentiment_trends_time_period ON public.sentiment_trends(time_period, period_type);
CREATE INDEX idx_sentiment_alerts_triggered_at ON public.sentiment_alerts(triggered_at);
CREATE INDEX idx_sentiment_alerts_severity ON public.sentiment_alerts(severity);

-- Create trigger for updated_at
CREATE TRIGGER update_sentiment_analysis_updated_at
  BEFORE UPDATE ON public.telegram_sentiment_analysis
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_sentiment_trends_updated_at
  BEFORE UPDATE ON public.sentiment_trends
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to aggregate sentiment trends
CREATE OR REPLACE FUNCTION public.aggregate_sentiment_trends()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  current_hour TIMESTAMP WITH TIME ZONE;
  hourly_data RECORD;
BEGIN
  -- Get current hour
  current_hour := date_trunc('hour', NOW());
  
  -- Aggregate hourly sentiment data
  FOR hourly_data IN
    SELECT 
      date_trunc('hour', tsa.created_at) as hour_period,
      AVG(tsa.sentiment_score) as avg_sentiment,
      COUNT(*) as total_messages,
      COUNT(*) FILTER (WHERE tsa.sentiment_label = 'positive') as positive_count,
      COUNT(*) FILTER (WHERE tsa.sentiment_label = 'negative') as negative_count,
      COUNT(*) FILTER (WHERE tsa.sentiment_label = 'neutral') as neutral_count,
      array_agg(DISTINCT unnest(tsa.topic_categories)) FILTER (WHERE tsa.topic_categories IS NOT NULL) as topics,
      array_agg(DISTINCT unnest(tsa.keywords_detected)) FILTER (WHERE tsa.keywords_detected IS NOT NULL) as keywords
    FROM telegram_sentiment_analysis tsa
    WHERE tsa.created_at >= current_hour - INTERVAL '1 hour'
      AND tsa.created_at < current_hour
    GROUP BY date_trunc('hour', tsa.created_at)
  LOOP
    -- Insert or update hourly trend
    INSERT INTO sentiment_trends (
      time_period, period_type, avg_sentiment_score, message_count,
      positive_count, negative_count, neutral_count, dominant_topics, trending_keywords
    ) VALUES (
      hourly_data.hour_period, 'hourly', hourly_data.avg_sentiment, hourly_data.total_messages,
      hourly_data.positive_count, hourly_data.negative_count, hourly_data.neutral_count,
      hourly_data.topics[1:5], hourly_data.keywords[1:10]
    )
    ON CONFLICT (time_period, period_type) 
    DO UPDATE SET
      avg_sentiment_score = EXCLUDED.avg_sentiment_score,
      message_count = EXCLUDED.message_count,
      positive_count = EXCLUDED.positive_count,
      negative_count = EXCLUDED.negative_count,
      neutral_count = EXCLUDED.neutral_count,
      dominant_topics = EXCLUDED.dominant_topics,
      trending_keywords = EXCLUDED.trending_keywords,
      updated_at = NOW();
  END LOOP;
END;
$$;