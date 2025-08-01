-- Remove the broken cron job calling non-existent beehiiv-auth function
SELECT cron.unschedule('beehiiv-newsletter-sync');