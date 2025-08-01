-- Update stuck running jobs to failed status
UPDATE telegram_sync_status 
SET 
  status = 'failed',
  metadata = jsonb_build_object(
    'error', 'Job stuck and automatically failed - cleanup',
    'auto_failed_at', NOW()
  )
WHERE status = 'running' 
  AND created_at < NOW() - INTERVAL '1 hour';

-- Clean up old sync jobs (older than 7 days)
DELETE FROM telegram_sync_status 
WHERE created_at < NOW() - INTERVAL '7 days'
  AND status IN ('completed', 'failed');

-- Also clean up old beehiiv sync jobs if any are stuck
UPDATE beehiiv_sync_jobs 
SET 
  status = 'failed',
  error_message = 'Job stuck and automatically failed - cleanup',
  completed_at = NOW()
WHERE status = 'running' 
  AND updated_at < NOW() - INTERVAL '2 hours';