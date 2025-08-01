
-- Create table to track Beehiiv webhook events and logs
CREATE TABLE public.beehiiv_webhook_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type TEXT NOT NULL,
  event_id TEXT NOT NULL,
  webhook_data JSONB NOT NULL,
  processed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'success',
  error_message TEXT,
  subscriber_email TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add index for efficient querying
CREATE INDEX idx_beehiiv_webhook_logs_event_id ON public.beehiiv_webhook_logs(event_id);
CREATE INDEX idx_beehiiv_webhook_logs_event_type ON public.beehiiv_webhook_logs(event_type);
CREATE INDEX idx_beehiiv_webhook_logs_subscriber_email ON public.beehiiv_webhook_logs(subscriber_email);

-- Add webhook signature verification settings
INSERT INTO public.system_settings (setting_key, setting_value, description)
VALUES 
  ('beehiiv_webhook_secret', '{"value": ""}', 'Secret key for verifying Beehiiv webhook signatures'),
  ('beehiiv_webhook_enabled', '{"enabled": true}', 'Enable/disable Beehiiv webhook processing')
ON CONFLICT (setting_key) DO NOTHING;

-- Add last sync tracking for bidirectional sync
ALTER TABLE public.beehiiv_subscribers 
ADD COLUMN IF NOT EXISTS last_webhook_update TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS webhook_version INTEGER DEFAULT 1;
