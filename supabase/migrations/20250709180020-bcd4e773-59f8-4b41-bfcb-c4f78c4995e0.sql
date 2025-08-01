-- Add enhanced X monitoring settings with X API v2 capabilities (fixed syntax)
ALTER TABLE x_account_monitoring 
ADD COLUMN IF NOT EXISTS sentiment_threshold NUMERIC DEFAULT 0.5,
ADD COLUMN IF NOT EXISTS engagement_threshold INTEGER DEFAULT 100,
ADD COLUMN IF NOT EXISTS verified_only BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS include_media BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS exclude_retweets BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS max_posts_per_sync INTEGER DEFAULT 100,
ADD COLUMN IF NOT EXISTS user_mentions_filter TEXT[],
ADD COLUMN IF NOT EXISTS hashtag_filters TEXT[],
ADD COLUMN IF NOT EXISTS language_filter TEXT DEFAULT 'en',
ADD COLUMN IF NOT EXISTS sentiment_alerts_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS engagement_alerts_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS auto_categorize BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS priority_keywords TEXT[],
ADD COLUMN IF NOT EXISTS sentiment_history_days INTEGER DEFAULT 7;