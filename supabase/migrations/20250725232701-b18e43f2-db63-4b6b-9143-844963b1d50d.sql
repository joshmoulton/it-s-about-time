-- Fix notification_queue table by adding telegram_message_id column
-- Since telegram_messages doesn't have unique constraint on telegram_message_id, 
-- we'll reference the UUID id column instead

ALTER TABLE public.notification_queue 
ADD COLUMN IF NOT EXISTS telegram_message_id UUID;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_notification_queue_telegram_message_id 
ON public.notification_queue(telegram_message_id) 
WHERE telegram_message_id IS NOT NULL;

-- Add foreign key constraint to reference telegram_messages.id (UUID primary key)
ALTER TABLE public.notification_queue 
ADD CONSTRAINT fk_notification_queue_telegram_message_id 
FOREIGN KEY (telegram_message_id) 
REFERENCES public.telegram_messages(id) 
ON DELETE SET NULL;