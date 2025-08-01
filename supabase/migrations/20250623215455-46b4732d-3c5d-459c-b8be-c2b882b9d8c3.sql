
-- Enable realtime for telegram_messages table
ALTER TABLE public.telegram_messages REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.telegram_messages;

-- Enable realtime for auto_highlights table
ALTER TABLE public.auto_highlights REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.auto_highlights;

-- Enable realtime for telegram_topics table
ALTER TABLE public.telegram_topics REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.telegram_topics;

-- Enable realtime for telegram_topic_mappings table
ALTER TABLE public.telegram_topic_mappings REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.telegram_topic_mappings;

-- Enable realtime for chat_highlights table (also needed for live updates)
ALTER TABLE public.chat_highlights REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_highlights;
