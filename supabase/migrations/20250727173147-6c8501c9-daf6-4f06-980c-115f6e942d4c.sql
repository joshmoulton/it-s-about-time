-- Create indexes for better query performance on sentiment analysis
CREATE INDEX IF NOT EXISTS idx_telegram_messages_message_time ON telegram_messages(message_time DESC);
CREATE INDEX IF NOT EXISTS idx_telegram_messages_topic_name ON telegram_messages(topic_name) WHERE topic_name IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_telegram_messages_created_at ON telegram_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_telegram_sentiment_analysis_created_at ON telegram_sentiment_analysis(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_telegram_sentiment_analysis_message_id ON telegram_sentiment_analysis(telegram_message_id);

-- Create composite index for common query patterns
CREATE INDEX IF NOT EXISTS idx_telegram_messages_time_topic ON telegram_messages(message_time DESC, topic_name) WHERE topic_name IS NOT NULL;

-- Create indexes for auto highlights join performance
CREATE INDEX IF NOT EXISTS idx_auto_highlights_telegram_message_id ON auto_highlights(telegram_message_id);
CREATE INDEX IF NOT EXISTS idx_auto_highlights_rule_id ON auto_highlights(rule_id);

-- Create index for chat highlight rules
CREATE INDEX IF NOT EXISTS idx_chat_highlight_rules_active ON chat_highlight_rules(is_active) WHERE is_active = true;