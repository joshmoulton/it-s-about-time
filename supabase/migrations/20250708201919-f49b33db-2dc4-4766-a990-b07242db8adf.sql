-- Fix function search path warnings by adding SET search_path = public to functions missing it

-- Fix create_topic_from_keywords function
CREATE OR REPLACE FUNCTION public.create_topic_from_keywords(keywords text[], first_message_time timestamp with time zone DEFAULT now())
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $$
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
$$;

-- Fix generate_topic_slug function
CREATE OR REPLACE FUNCTION public.generate_topic_slug(title text)
 RETURNS text
 LANGUAGE plpgsql
 IMMUTABLE
 SET search_path = public
AS $$
BEGIN
  RETURN lower(regexp_replace(trim(title), '[^a-zA-Z0-9]+', '-', 'g'));
END;
$$;

-- Fix get_user_role function
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id uuid)
 RETURNS app_role
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path = public
AS $$
  SELECT role
  FROM public.user_roles
  WHERE user_id = _user_id
  ORDER BY CASE 
    WHEN role = 'super_admin' THEN 4
    WHEN role = 'admin' THEN 3
    WHEN role = 'analyst' THEN 2
    WHEN role = 'user' THEN 1
  END DESC
  LIMIT 1
$$;

-- Fix has_permission function
CREATE OR REPLACE FUNCTION public.has_permission(_user_id uuid, _permission_name text, _action text)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    JOIN public.role_permissions rp ON ur.role = rp.role
    WHERE ur.user_id = _user_id
      AND rp.permission_name = _permission_name
      AND (
        (_action = 'read' AND rp.can_read = true) OR
        (_action = 'write' AND rp.can_write = true) OR
        (_action = 'delete' AND rp.can_delete = true) OR
        (_action = 'admin' AND rp.can_admin = true)
      )
  )
$$;

-- Fix has_role function
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Fix update_comment_votes trigger function
CREATE OR REPLACE FUNCTION public.update_comment_votes()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $$
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
$$;

-- Fix update_topic_activity trigger function
CREATE OR REPLACE FUNCTION public.update_topic_activity()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $$
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
$$;