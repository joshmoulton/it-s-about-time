-- Clear existing newsletter data to start fresh
DELETE FROM newsletters WHERE beehiiv_post_id IS NOT NULL;

-- Reset any sync job data
DELETE FROM beehiiv_sync_jobs WHERE job_type = 'newsletter_sync';
DELETE FROM beehiiv_sync_failures WHERE sync_job_id IN (
  SELECT id FROM beehiiv_sync_jobs WHERE job_type = 'newsletter_sync'
);