-- Add beehiiv-specific fields to newsletters table
ALTER TABLE public.newsletters 
ADD COLUMN beehiiv_post_id text UNIQUE,
ADD COLUMN html_content text,
ADD COLUMN plain_content text,
ADD COLUMN featured_image_url text,
ADD COLUMN analytics_data jsonb DEFAULT '{}'::jsonb,
ADD COLUMN beehiiv_created_at timestamp with time zone,
ADD COLUMN beehiiv_updated_at timestamp with time zone,
ADD COLUMN web_url text,
ADD COLUMN thumbnail_url text,
ADD COLUMN view_count integer DEFAULT 0;

-- Create index for efficient querying by beehiiv_post_id
CREATE INDEX IF NOT EXISTS idx_newsletters_beehiiv_post_id ON public.newsletters(beehiiv_post_id);

-- Create index for published newsletters sorted by date
CREATE INDEX IF NOT EXISTS idx_newsletters_published_date ON public.newsletters(published_at DESC) WHERE status = 'published';