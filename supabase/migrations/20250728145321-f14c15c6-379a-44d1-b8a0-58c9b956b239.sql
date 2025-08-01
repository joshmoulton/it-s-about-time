-- Add content type classification to newsletters
-- Classify existing newsletters based on "Issue #number" pattern

-- First, update existing newsletters to set content_type in metadata
UPDATE public.newsletters 
SET metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object('content_type', 
  CASE 
    WHEN (excerpt ~ 'Issue\s*#\s*\d+' OR html_content ~ 'Issue\s*#\s*\d+' OR plain_content ~ 'Issue\s*#\s*\d+' OR title ~ 'Issue\s*#\s*\d+')
    THEN 'newsletter'
    ELSE 'article'
  END
)
WHERE status = 'published';

-- Create function to auto-classify newsletters during sync
CREATE OR REPLACE FUNCTION public.classify_newsletter_content_type(
  p_title text DEFAULT '',
  p_excerpt text DEFAULT '',
  p_html_content text DEFAULT '',
  p_plain_content text DEFAULT ''
)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Check if any of the content fields contain "Issue #number" pattern
  IF (p_title ~ 'Issue\s*#\s*\d+' OR 
      p_excerpt ~ 'Issue\s*#\s*\d+' OR 
      p_html_content ~ 'Issue\s*#\s*\d+' OR 
      p_plain_content ~ 'Issue\s*#\s*\d+') THEN
    RETURN 'newsletter';
  ELSE
    RETURN 'article';
  END IF;
END;
$$;