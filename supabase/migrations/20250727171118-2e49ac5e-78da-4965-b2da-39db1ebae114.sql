-- Enhanced sync job management with proper locking and cancellation

-- First, let's add a unique constraint to prevent duplicate running jobs
-- This will ensure only one sync job of each type can run at a time
ALTER TABLE public.telegram_sync_status 
ADD CONSTRAINT unique_running_sync 
EXCLUDE (sync_type WITH =) 
WHERE (status = 'running');

-- Add a started_at column to track when jobs actually begin processing
ALTER TABLE public.telegram_sync_status 
ADD COLUMN started_at TIMESTAMP WITH TIME ZONE NULL;

-- Add updated_at column to track when status was last updated
ALTER TABLE public.telegram_sync_status 
ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Add a job_id column to track unique job instances
ALTER TABLE public.telegram_sync_status 
ADD COLUMN job_id UUID DEFAULT gen_random_uuid();

-- Add cancellation_requested column to support graceful cancellation
ALTER TABLE public.telegram_sync_status 
ADD COLUMN cancellation_requested BOOLEAN DEFAULT false;

-- Add process_id column to track which process is handling the job
ALTER TABLE public.telegram_sync_status 
ADD COLUMN process_id TEXT NULL;

-- Create function to automatically timeout hanging jobs
CREATE OR REPLACE FUNCTION cleanup_hanging_sync_jobs()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
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
    
  -- Log the cleanup action
  GET DIAGNOSTICS 
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
    jsonb_build_object('cleaned_hanging_jobs', ROW_COUNT, 'cleanup_time', now()),
    0,
    0,
    0
  );
END;
$$;

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