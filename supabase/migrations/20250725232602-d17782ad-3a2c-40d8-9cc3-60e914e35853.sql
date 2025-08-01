-- Add missing telegram_message_id column to notification_queue table
-- This column is referenced by the notify_subscribers function but doesn't exist

ALTER TABLE public.notification_queue 
ADD COLUMN IF NOT EXISTS telegram_message_id BIGINT;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_notification_queue_telegram_message_id 
ON public.notification_queue(telegram_message_id) 
WHERE telegram_message_id IS NOT NULL;

-- Add foreign key constraint to maintain referential integrity
ALTER TABLE public.notification_queue 
ADD CONSTRAINT fk_notification_queue_telegram_message_id 
FOREIGN KEY (telegram_message_id) 
REFERENCES public.telegram_messages(telegram_message_id) 
ON DELETE SET NULL;