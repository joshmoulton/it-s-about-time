-- Add enhanced X monitoring settings with X API v2 capabilities
ALTER TABLE x_account_monitoring ADD COLUMN IF NOT EXISTS 
  sentiment_threshold NUMERIC DEFAULT 0.5,
  engagement_threshold INTEGER DEFAULT 100,
  verified_only BOOLEAN DEFAULT false,
  include_media BOOLEAN DEFAULT true,
  exclude_retweets BOOLEAN DEFAULT false,
  max_posts_per_sync INTEGER DEFAULT 100,
  user_mentions_filter TEXT[],
  hashtag_filters TEXT[],
  language_filter TEXT DEFAULT 'en',
  sentiment_alerts_enabled BOOLEAN DEFAULT true,
  engagement_alerts_enabled BOOLEAN DEFAULT false,
  auto_categorize BOOLEAN DEFAULT true,
  priority_keywords TEXT[],
  sentiment_history_days INTEGER DEFAULT 7;