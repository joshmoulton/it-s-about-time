-- Fix missing database schema components for telegram bot processing

-- 1. Add missing is_active column to telegram_topic_mappings
ALTER TABLE public.telegram_topic_mappings 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Add missing timestamps if they don't exist
ALTER TABLE public.telegram_topic_mappings 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT now();

ALTER TABLE public.telegram_topic_mappings 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- 2. Create notification_queue table for async notifications
CREATE TABLE IF NOT EXISTS public.notification_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    notification_type TEXT NOT NULL,
    recipient_info JSONB NOT NULL DEFAULT '{}',
    message_content TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    priority INTEGER NOT NULL DEFAULT 5,
    scheduled_for TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    processed_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3
);

-- Enable RLS on notification_queue
ALTER TABLE public.notification_queue ENABLE ROW LEVEL SECURITY;

-- Create policy for notification_queue (admin access only)
CREATE POLICY "notification_queue_admin_access" ON public.notification_queue
FOR ALL USING (is_current_user_admin_fast())
WITH CHECK (is_current_user_admin_fast());

-- 3. Create find_duplicate_messages function
CREATE OR REPLACE FUNCTION public.find_duplicate_messages()
RETURNS TABLE(duplicate_id UUID, telegram_message_id BIGINT, count BIGINT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        tm.id as duplicate_id,
        tm.telegram_message_id,
        COUNT(*) as count
    FROM public.telegram_messages tm
    GROUP BY tm.telegram_message_id, tm.id
    HAVING COUNT(*) > 1
    ORDER BY COUNT(*) DESC;
END;
$$;

-- 4. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_telegram_topic_mappings_active 
ON public.telegram_topic_mappings(is_active) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_notification_queue_status_priority 
ON public.notification_queue(status, priority, scheduled_for) WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_telegram_messages_thread_topic 
ON public.telegram_messages(message_thread_id, topic_name) WHERE message_thread_id IS NOT NULL;

-- 5. Create trigger for updated_at on telegram_topic_mappings (PostgreSQL compatible)
CREATE OR REPLACE FUNCTION public.update_telegram_topic_mappings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS trigger_update_telegram_topic_mappings_updated_at ON public.telegram_topic_mappings;

CREATE TRIGGER trigger_update_telegram_topic_mappings_updated_at
    BEFORE UPDATE ON public.telegram_topic_mappings
    FOR EACH ROW
    EXECUTE FUNCTION public.update_telegram_topic_mappings_updated_at();

-- 6. Update existing topic mappings to be active
UPDATE public.telegram_topic_mappings 
SET is_active = true 
WHERE is_active IS NULL;