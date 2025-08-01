-- Clear all existing newsletters for fresh sync with proper tiers
DELETE FROM newsletters;

-- Reset sync job data
DELETE FROM beehiiv_sync_jobs WHERE job_type = 'newsletter_sync';
DELETE FROM beehiiv_sync_failures WHERE sync_job_id IN (
  SELECT id FROM beehiiv_sync_jobs WHERE job_type = 'newsletter_sync'
);