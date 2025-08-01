-- Create function to safely request job cancellation
CREATE OR REPLACE FUNCTION request_sync_cancellation(p_job_id UUID)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  -- Mark the job for cancellation
  UPDATE public.telegram_sync_status 
  SET 
    cancellation_requested = true,
    updated_at = now(),
    metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object(
      'cancellation_requested_at', now(),
      'cancellation_requested_by', get_current_user_email()
    )
  WHERE 
    job_id = p_job_id 
    AND status = 'running';
    
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  
  IF updated_count > 0 THEN
    RETURN jsonb_build_object(
      'success', true,
      'message', 'Cancellation requested successfully',
      'job_id', p_job_id
    );
  ELSE
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Job not found or not running',
      'job_id', p_job_id
    );
  END IF;
END;
$$;

-- Create function to force stop all running jobs (emergency use only)
CREATE OR REPLACE FUNCTION force_stop_all_sync_jobs()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  stopped_count INTEGER;
BEGIN
  -- Update all running jobs to failed status
  UPDATE public.telegram_sync_status 
  SET 
    status = 'failed',
    updated_at = now(),
    cancellation_requested = true,
    metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object(
      'force_stopped_at', now(),
      'force_stopped_by', get_current_user_email(),
      'stop_reason', 'Emergency force stop requested'
    )
  WHERE status = 'running';
  
  GET DIAGNOSTICS stopped_count = ROW_COUNT;
  
  RETURN jsonb_build_object(
    'success', true,
    'stopped_jobs', stopped_count,
    'timestamp', now()
  );
END;
$$;