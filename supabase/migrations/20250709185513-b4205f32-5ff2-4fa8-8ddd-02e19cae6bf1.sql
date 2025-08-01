-- Set up cron job for newsletter scheduler (runs every 10 minutes)
SELECT cron.schedule(
  'newsletter-scheduler',
  '*/10 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://wrvvlmevpvcenauglcyz.supabase.co/functions/v1/newsletter-scheduler',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndydnZsbWV2cHZjZW5hdWdsY3l6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTg1Mzk1MCwiZXhwIjoyMDY1NDI5OTUwfQ.H_srIeAcaWEtM3a2u9-dxLLmpU7mmHOHqrHCvWOwlEg"}'::jsonb,
    body := '{"trigger": "cron_job"}'::jsonb
  ) as request_id;
  $$
);

-- Create index for better performance on scheduled newsletter queries
CREATE INDEX IF NOT EXISTS idx_newsletters_scheduled_status 
ON newsletters(status, scheduled_at) 
WHERE status = 'scheduled';

-- Create index for better performance on newsletter queries by author
CREATE INDEX IF NOT EXISTS idx_newsletters_author_status 
ON newsletters(author_id, status, created_at);

-- Create index for better performance on newsletter queries by published date
CREATE INDEX IF NOT EXISTS idx_newsletters_published_date 
ON newsletters(published_at DESC) 
WHERE status = 'published';