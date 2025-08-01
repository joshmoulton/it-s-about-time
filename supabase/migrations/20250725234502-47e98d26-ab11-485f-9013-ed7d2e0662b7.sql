-- Fix Telegram-Beehiiv Architecture Separation
-- Remove problematic trigger and function that's causing type mismatches

-- 1. Drop the problematic trigger that calls notify_subscribers
DROP TRIGGER IF EXISTS after_insert_message ON public.telegram_messages;

-- 2. Drop the notify_subscribers function (it's architecturally wrong)
DROP FUNCTION IF EXISTS public.notify_subscribers();

-- 3. Drop the subscriptions table (it's mixing Telegram and beehiiv concepts)
DROP TABLE IF EXISTS public.subscriptions;

-- 4. Remove telegram_message_id from notification_queue (keep it beehiiv-only)
ALTER TABLE public.notification_queue 
DROP CONSTRAINT IF EXISTS fk_notification_queue_telegram_message_id;

DROP INDEX IF EXISTS idx_notification_queue_telegram_message_id;

ALTER TABLE public.notification_queue 
DROP COLUMN IF EXISTS telegram_message_id;

-- Keep the apply_highlight_rules_trigger - it works correctly for Telegram chat highlights