-- Create trigger to update updated_at on any status change
CREATE OR REPLACE FUNCTION update_sync_status_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER sync_status_update_timestamp
  BEFORE UPDATE ON public.telegram_sync_status
  FOR EACH ROW
  EXECUTE FUNCTION update_sync_status_timestamp();

-- Set up automated cleanup job (runs every 5 minutes)
-- This will automatically clean up any hanging jobs
SELECT cron.schedule(
  'cleanup-hanging-sync-jobs',
  '*/5 * * * *', -- Every 5 minutes
  'SELECT cleanup_hanging_sync_jobs();'
);