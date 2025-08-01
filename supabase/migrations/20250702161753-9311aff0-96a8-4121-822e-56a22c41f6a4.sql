-- Create function to increment newsletter view count
CREATE OR REPLACE FUNCTION public.increment_newsletter_views(newsletter_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.newsletters 
  SET view_count = view_count + 1,
      updated_at = now()
  WHERE id = newsletter_id;
END;
$$;