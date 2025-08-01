-- Set up automated daily newsletter sync
SELECT cron.schedule(
  'beehiiv-newsletter-sync',
  '0 8 * * *', -- Daily at 8 AM UTC
  $$
  select
    net.http_post(
        url:='https://wrvvlmevpvcenauglcyz.supabase.co/functions/v1/beehiiv-auth',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndydnZsbWV2cHZjZW5hdWdsY3l6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTg1Mzk1MCwiZXhwIjoyMDY1NDI5OTUwfQ.H_srIeAcaWEtM3a2u9-dxLLmpU7mmHOHqrHCvWOwlEg"}'::jsonb,
        body:='{"action": "sync_newsletters"}'::jsonb
    ) as request_id;
  $$
);