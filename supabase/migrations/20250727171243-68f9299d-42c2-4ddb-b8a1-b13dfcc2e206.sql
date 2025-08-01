-- Create function to automatically timeout hanging jobs
CREATE OR REPLACE FUNCTION cleanup_hanging_sync_jobs()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  cleaned_count INTEGER := 0;
BEGIN
  -- Update jobs that have been running for more than 10 minutes to failed
  UPDATE public.telegram_sync_status 
  SET 
    status = 'failed',
    updated_at = now(),
    metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object(
      'timeout_reason', 'Job exceeded maximum runtime of 10 minutes',
      'auto_cleaned_at', now()
    )
  WHERE 
    status = 'running' 
    AND (
      (started_at IS NOT NULL AND started_at < now() - INTERVAL '10 minutes') OR
      (started_at IS NULL AND created_at < now() - INTERVAL '10 minutes')
    );
    
  GET DIAGNOSTICS cleaned_count = ROW_COUNT;
    
  -- Log the cleanup action if any jobs were cleaned
  IF cleaned_count > 0 THEN
    INSERT INTO public.telegram_sync_status (
      sync_type, 
      status, 
      metadata,
      messages_synced,
      messages_deleted,
      errors_count
    ) VALUES (
      'cleanup_job',
      'completed', 
      jsonb_build_object('cleaned_hanging_jobs', cleaned_count, 'cleanup_time', now()),
      0,
      0,
      0
    );
  END IF;
END;
$$;