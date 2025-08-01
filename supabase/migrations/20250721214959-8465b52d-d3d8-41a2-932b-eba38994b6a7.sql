-- Set up automatic newsletter syncing every 6 hours
SELECT cron.schedule(
  'newsletter-auto-sync',
  '0 */6 * * *', -- Every 6 hours at minute 0
  $$
  SELECT net.http_post(
    url := 'https://wrvvlmevpvcenauglcyz.supabase.co/functions/v1/newsletter-sync',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndydnZsbWV2cHZjZW5hdWdsY3l6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTg1Mzk1MCwiZXhwIjoyMDY1NDI5OTUwfQ.H_srIeAcaWEtM3a2u9-dxLLmpU7mmHOHqrHCvWOwlEg"}'::jsonb,
    body := '{"action": "sync_newsletters", "automated": true}'::jsonb
  );
  $$
);