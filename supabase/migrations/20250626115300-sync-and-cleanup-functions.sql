
-- Sync and Cleanup Related Functions

-- Fix setup_beehiiv_daily_sync function to be more secure
CREATE OR REPLACE FUNCTION public.setup_beehiiv_daily_sync()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  -- Remove existing cron jobs if they exist (using dynamic SQL to handle if cron doesn't exist)
  BEGIN
    PERFORM cron.unschedule('beehiiv-daily-sync');
  EXCEPTION WHEN OTHERS THEN
    -- Ignore if job doesn't exist
    NULL;
  END;
  
  BEGIN
    PERFORM cron.unschedule('beehiiv-incremental-sync');
  EXCEPTION WHEN OTHERS THEN
    -- Ignore if job doesn't exist
    NULL;
  END;
  
  -- Schedule daily sync at 6 AM UTC
  PERFORM cron.schedule(
    'beehiiv-daily-sync',
    '0 6 * * *',
    'SELECT net.http_post(url := ''https://wrvvlmevpvcenauglcyz.supabase.co/functions/v1/beehiiv-automated-sync'', headers := ''{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndydnZsbWV2cHZjZW5hdWdsY3l6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTg1Mzk1MCwiZXhwIjoyMDY1NDI5OTUwfQ.H_srIeAcaWEtM3a2u9-dxLLmpU7mmHOHqrHCvWOwlEg"}''::jsonb, body := ''{"trigger": "daily_cron"}''::jsonb);'
  );
  
  -- Schedule incremental sync every 4 hours
  PERFORM cron.schedule(
    'beehiiv-incremental-sync',
    '0 */4 * * *',
    'SELECT net.http_post(url := ''https://wrvvlmevpvcenauglcyz.supabase.co/functions/v1/beehiiv-automated-sync'', headers := ''{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndydnZsbWV2cHZjZW5hdWdsY3l6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTg1Mzk1MCwiZXhwIjoyMDY1NDI5OTUwfQ.H_srIeAcaWEtM3a2u9-dxLLmpU7mmHOHqrHCvWOwlEg"}''::jsonb, body := ''{"trigger": "incremental_cron"}''::jsonb);'
  );
  
END;
$$;

-- Fix cleanup_old_sync_jobs function
CREATE OR REPLACE FUNCTION public.cleanup_old_sync_jobs()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  -- Clean up sync jobs older than 7 days
  DELETE FROM public.beehiiv_sync_jobs 
  WHERE created_at < NOW() - INTERVAL '7 days'
    AND status IN ('completed', 'failed');
    
  -- Clean up sync failures older than 3 days
  DELETE FROM public.beehiiv_sync_failures 
  WHERE created_at < NOW() - INTERVAL '3 days';
  
  -- Mark stuck jobs as failed (running for more than 2 hours)
  UPDATE public.beehiiv_sync_jobs 
  SET 
    status = 'failed',
    error_message = 'Job stuck and automatically failed',
    completed_at = NOW()
  WHERE status = 'running' 
    AND updated_at < NOW() - INTERVAL '2 hours';
    
END;
$$;
