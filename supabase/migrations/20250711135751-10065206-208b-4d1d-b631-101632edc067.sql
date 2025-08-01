-- Set up a simple cron job to run daily database backups
-- This will call the database-backup edge function every day at 2 AM
SELECT cron.schedule(
  'daily-database-backup',
  '0 2 * * *', -- Every day at 2:00 AM
  $$
  SELECT
    net.http_post(
        url:='https://wrvvlmevpvcenauglcyz.supabase.co/functions/v1/database-backup',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndydnZsbWV2cHZjZW5hdWdsY3l6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4NTM5NTAsImV4cCI6MjA2NTQyOTk1MH0.iR1E5RqVrH7OsDdIqDvMWsc5d2jK9Qg9Ck-2lpi3E2g"}'::jsonb,
        body:='{"type": "scheduled"}'::jsonb
    ) as request_id;
  $$
);