-- Fix the security warning by setting immutable search_path for the function
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