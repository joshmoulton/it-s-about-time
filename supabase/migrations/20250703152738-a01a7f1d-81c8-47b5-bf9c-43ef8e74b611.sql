-- Simplify telegram_messages RLS policies to prevent realtime timeouts
-- Drop existing overlapping policies
DROP POLICY IF EXISTS "Anyone can view non-hidden messages" ON public.telegram_messages;
DROP POLICY IF EXISTS "Authenticated users can view telegram messages" ON public.telegram_messages;
DROP POLICY IF EXISTS "Premium users can view telegram messages" ON public.telegram_messages;

-- Create simplified, non-overlapping policies
CREATE POLICY "Public can view non-hidden messages" 
  ON public.telegram_messages 
  FOR SELECT 
  TO public
  USING (is_hidden = false OR is_hidden IS NULL);

CREATE POLICY "Authenticated users can view all non-hidden messages" 
  ON public.telegram_messages 
  FOR SELECT 
  TO authenticated
  USING (is_hidden = false OR is_hidden IS NULL);

-- Ensure realtime is enabled for these tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.telegram_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.telegram_topics;
ALTER PUBLICATION supabase_realtime ADD TABLE public.telegram_sentiment_analysis;