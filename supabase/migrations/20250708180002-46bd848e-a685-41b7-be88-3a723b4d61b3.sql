-- Create highlight topics table to consolidate related messages
CREATE TABLE public.highlight_topics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  topic_title TEXT NOT NULL,
  topic_slug TEXT NOT NULL UNIQUE,
  keyword_group TEXT[] NOT NULL DEFAULT '{}',
  message_count INTEGER NOT NULL DEFAULT 0,
  engagement_score INTEGER NOT NULL DEFAULT 0,
  first_mentioned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_activity_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_trending BOOLEAN NOT NULL DEFAULT false,
  topic_description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create highlight comments table for threaded discussions
CREATE TABLE public.highlight_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  topic_id UUID NOT NULL REFERENCES public.highlight_topics(id) ON DELETE CASCADE,
  parent_comment_id UUID REFERENCES public.highlight_comments(id) ON DELETE CASCADE,
  user_email TEXT NOT NULL,
  user_display_name TEXT,
  comment_text TEXT NOT NULL,
  upvotes INTEGER NOT NULL DEFAULT 0,
  downvotes INTEGER NOT NULL DEFAULT 0,
  is_highlighted BOOLEAN NOT NULL DEFAULT false,
  is_deleted BOOLEAN NOT NULL DEFAULT false,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create comment votes table for tracking user votes
CREATE TABLE public.comment_votes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  comment_id UUID NOT NULL REFERENCES public.highlight_comments(id) ON DELETE CASCADE,
  user_email TEXT NOT NULL,
  vote_type TEXT NOT NULL CHECK (vote_type IN ('upvote', 'downvote')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(comment_id, user_email)
);

-- Create topic follows table for user subscriptions
CREATE TABLE public.topic_follows (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  topic_id UUID NOT NULL REFERENCES public.highlight_topics(id) ON DELETE CASCADE,
  user_email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(topic_id, user_email)
);

-- Enable RLS on all new tables
ALTER TABLE public.highlight_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.highlight_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comment_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.topic_follows ENABLE ROW LEVEL SECURITY;

-- RLS Policies for highlight_topics
CREATE POLICY "Anyone can view highlight topics" 
ON public.highlight_topics 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can create topics" 
ON public.highlight_topics 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Service role can manage topics" 
ON public.highlight_topics 
FOR ALL 
USING (true);

-- RLS Policies for highlight_comments
CREATE POLICY "Anyone can view non-deleted comments" 
ON public.highlight_comments 
FOR SELECT 
USING (is_deleted = false);

CREATE POLICY "Users can create comments" 
ON public.highlight_comments 
FOR INSERT 
WITH CHECK (user_email = (current_setting('request.jwt.claims', true)::json->>'email'));

CREATE POLICY "Users can update their own comments" 
ON public.highlight_comments 
FOR UPDATE 
USING (user_email = (current_setting('request.jwt.claims', true)::json->>'email'));

CREATE POLICY "Users can soft delete their own comments" 
ON public.highlight_comments 
FOR UPDATE 
USING (user_email = (current_setting('request.jwt.claims', true)::json->>'email'));

-- RLS Policies for comment_votes
CREATE POLICY "Users can view all votes" 
ON public.comment_votes 
FOR SELECT 
USING (true);

CREATE POLICY "Users can manage their own votes" 
ON public.comment_votes 
FOR ALL 
USING (user_email = (current_setting('request.jwt.claims', true)::json->>'email'));

-- RLS Policies for topic_follows
CREATE POLICY "Users can view all follows" 
ON public.topic_follows 
FOR SELECT 
USING (true);

CREATE POLICY "Users can manage their own follows" 
ON public.topic_follows 
FOR ALL 
USING (user_email = (current_setting('request.jwt.claims', true)::json->>'email'));

-- Create indexes for performance
CREATE INDEX idx_highlight_topics_trending ON public.highlight_topics(is_trending, last_activity_at DESC);
CREATE INDEX idx_highlight_topics_slug ON public.highlight_topics(topic_slug);
CREATE INDEX idx_highlight_comments_topic ON public.highlight_comments(topic_id, created_at DESC);
CREATE INDEX idx_highlight_comments_parent ON public.highlight_comments(parent_comment_id, created_at ASC);
CREATE INDEX idx_comment_votes_comment ON public.comment_votes(comment_id);
CREATE INDEX idx_topic_follows_user ON public.topic_follows(user_email);

-- Create function to update comment votes count
CREATE OR REPLACE FUNCTION update_comment_votes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.vote_type = 'upvote' THEN
      UPDATE public.highlight_comments 
      SET upvotes = upvotes + 1 
      WHERE id = NEW.comment_id;
    ELSE
      UPDATE public.highlight_comments 
      SET downvotes = downvotes + 1 
      WHERE id = NEW.comment_id;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.vote_type = 'upvote' THEN
      UPDATE public.highlight_comments 
      SET upvotes = upvotes - 1 
      WHERE id = OLD.comment_id;
    ELSE
      UPDATE public.highlight_comments 
      SET downvotes = downvotes - 1 
      WHERE id = OLD.comment_id;
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Handle vote change
    IF OLD.vote_type = 'upvote' THEN
      UPDATE public.highlight_comments 
      SET upvotes = upvotes - 1 
      WHERE id = OLD.comment_id;
    ELSE
      UPDATE public.highlight_comments 
      SET downvotes = downvotes - 1 
      WHERE id = OLD.comment_id;
    END IF;
    
    IF NEW.vote_type = 'upvote' THEN
      UPDATE public.highlight_comments 
      SET upvotes = upvotes + 1 
      WHERE id = NEW.comment_id;
    ELSE
      UPDATE public.highlight_comments 
      SET downvotes = downvotes + 1 
      WHERE id = NEW.comment_id;
    END IF;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for comment votes
CREATE TRIGGER update_comment_votes_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.comment_votes
  FOR EACH ROW EXECUTE FUNCTION update_comment_votes();

-- Create function to generate topic slug
CREATE OR REPLACE FUNCTION generate_topic_slug(title TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN lower(regexp_replace(trim(title), '[^a-zA-Z0-9]+', '-', 'g'));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Create function to update topic activity
CREATE OR REPLACE FUNCTION update_topic_activity()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.highlight_topics 
  SET 
    last_activity_at = now(),
    engagement_score = (
      SELECT COALESCE(SUM(upvotes - downvotes), 0) 
      FROM public.highlight_comments 
      WHERE topic_id = NEW.topic_id AND is_deleted = false
    )
  WHERE id = NEW.topic_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for topic activity updates
CREATE TRIGGER update_topic_activity_trigger
  AFTER INSERT OR UPDATE ON public.highlight_comments
  FOR EACH ROW EXECUTE FUNCTION update_topic_activity();

-- Create function to aggregate keywords into topics
CREATE OR REPLACE FUNCTION create_topic_from_keywords(
  keywords TEXT[],
  first_message_time TIMESTAMP WITH TIME ZONE DEFAULT now()
)
RETURNS UUID AS $$
DECLARE
  topic_id UUID;
  topic_title TEXT;
  topic_slug TEXT;
BEGIN
  -- Generate topic title from most frequent keyword
  topic_title := COALESCE(keywords[1], 'General Discussion');
  topic_slug := generate_topic_slug(topic_title);
  
  -- Insert or get existing topic
  INSERT INTO public.highlight_topics (
    topic_title,
    topic_slug,
    keyword_group,
    message_count,
    first_mentioned_at,
    last_activity_at
  ) VALUES (
    topic_title,
    topic_slug,
    keywords,
    1,
    first_message_time,
    first_message_time
  )
  ON CONFLICT (topic_slug) 
  DO UPDATE SET
    keyword_group = highlight_topics.keyword_group || EXCLUDED.keyword_group,
    message_count = highlight_topics.message_count + 1,
    last_activity_at = EXCLUDED.last_activity_at
  RETURNING id INTO topic_id;
  
  RETURN topic_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;