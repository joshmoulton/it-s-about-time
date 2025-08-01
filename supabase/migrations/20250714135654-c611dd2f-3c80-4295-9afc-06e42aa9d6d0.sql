-- Fix the search path security issue in the Beehiiv sync function
CREATE OR REPLACE FUNCTION public.setup_beehiiv_twice_daily_sync()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Remove existing cron jobs
  BEGIN
    PERFORM cron.unschedule('beehiiv-daily-sync');
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
  
  BEGIN
    PERFORM cron.unschedule('beehiiv-incremental-sync');
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
  
  -- Schedule morning sync at 8 AM UTC
  PERFORM cron.schedule(
    'beehiiv-morning-sync',
    '0 8 * * *',
    'SELECT net.http_post(url := ''https://wrvvlmevpvcenauglcyz.supabase.co/functions/v1/beehiiv-automated-sync'', headers := ''{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndydnZsbWV2cHZjZW5hdWdsY3l6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTg1Mzk1MCwiZXhwIjoyMDY1NDI5OTUwfQ.H_srIeAcaWEtM3a2u9-dxLLmpU7mmHOHqrHCvWOwlEg"}''::jsonb, body := ''{"trigger": "morning_cron"}''::jsonb);'
  );
  
  -- Schedule evening sync at 8 PM UTC  
  PERFORM cron.schedule(
    'beehiiv-evening-sync',
    '0 20 * * *',
    'SELECT net.http_post(url := ''https://wrvvlmevpvcenauglcyz.supabase.co/functions/v1/beehiiv-automated-sync'', headers := ''{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndydnZsbWV2cHZjZW5hdWdsY3l6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTg1Mzk1MCwiZXhwIjoyMDY1NDI5OTUwfQ.H_srIeAcaWEtM3a2u9-dxLLmpU7mmHOHqrHCvWOwlEg"}''::jsonb, body := ''{"trigger": "evening_cron"}''::jsonb);'
  );
  
  -- Keep incremental sync every 4 hours for real-time updates
  PERFORM cron.schedule(
    'beehiiv-incremental-sync',
    '0 */4 * * *',
    'SELECT net.http_post(url := ''https://wrvvlmevpvcenauglcyz.supabase.co/functions/v1/beehiiv-automated-sync'', headers := ''{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndydnZsbWV2cHZjZW5hdWdsY3l6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTg1Mzk1MCwiZXhwIjoyMDY1NDI5OTUwfQ.H_srIeAcaWEtM3a2u9-dxLLmpU7mmHOHqrHCvWOwlEg"}''::jsonb, body := ''{"trigger": "incremental_cron"}''::jsonb);'
  );
  
END;
$$;