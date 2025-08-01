-- Fix notification_queue table and clean up duplicate functions

-- 1. Add missing subscriber_id column to notification_queue
ALTER TABLE public.notification_queue 
ADD COLUMN IF NOT EXISTS subscriber_id UUID REFERENCES public.beehiiv_subscribers(id);

-- 2. Remove the old duplicate insert_telegram_message function signature
DROP FUNCTION IF EXISTS public.insert_telegram_message(bigint, bigint, text, timestamp with time zone, bigint);

-- 3. Create index for better performance on notification_queue
CREATE INDEX IF NOT EXISTS idx_notification_queue_subscriber_id 
ON public.notification_queue(subscriber_id) WHERE subscriber_id IS NOT NULL;

-- 4. Update notification_queue default values for better handling
ALTER TABLE public.notification_queue 
ALTER COLUMN recipient_info SET DEFAULT '{"subscriber_id": null}'::jsonb;