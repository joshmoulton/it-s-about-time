-- Add degen_alerts_enabled column to degen_call_subscriptions table
ALTER TABLE degen_call_subscriptions 
ADD COLUMN degen_alerts_enabled boolean NOT NULL DEFAULT true;

-- Update existing records to have degen alerts enabled by default
UPDATE degen_call_subscriptions 
SET degen_alerts_enabled = true 
WHERE degen_alerts_enabled IS NULL;