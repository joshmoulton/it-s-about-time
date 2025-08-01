-- Remove duplicate cron job
SELECT cron.unschedule('newsletter-auto-sync');