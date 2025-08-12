-- Create function to get topic statistics for chat highlights
CREATE OR REPLACE FUNCTION get_topic_statistics()
RETURNS TABLE (
  topic_name TEXT,
  message_count BIGINT,
  last_message TEXT,
  unique_users BIGINT,
  trending_score NUMERIC
) 
LANGUAGE sql SECURITY DEFINER
AS $$
  SELECT 
    tm.topic_name,
    COUNT(*) as message_count,
    MAX(tm.timestamp) as last_message,
    COUNT(DISTINCT tm.username) as unique_users,
    -- Simple trending score based on recent activity and engagement
    (COUNT(*) * 0.7 + COUNT(DISTINCT tm.username) * 0.3) as trending_score
  FROM telegram_messages tm
  WHERE tm.topic_name IS NOT NULL 
    AND tm.topic_name != ''
    AND tm.timestamp > NOW() - INTERVAL '7 days'  -- Only recent messages
  GROUP BY tm.topic_name
  ORDER BY trending_score DESC, message_count DESC;
$$;