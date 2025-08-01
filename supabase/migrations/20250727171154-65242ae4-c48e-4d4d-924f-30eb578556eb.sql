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