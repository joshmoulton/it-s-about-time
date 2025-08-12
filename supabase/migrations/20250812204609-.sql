-- Fix degen call status to show recent calls as active
UPDATE analyst_signals 
SET status = 'active', updated_at = now()
WHERE ticker = 'LINK' 
  AND status = 'closed' 
  AND created_at > NOW() - INTERVAL '1 day';

-- Add foreign key constraint for chat highlights to work properly
ALTER TABLE auto_highlights 
ADD CONSTRAINT fk_auto_highlights_telegram_message_id 
FOREIGN KEY (telegram_message_id) 
REFERENCES telegram_messages(id) 
ON DELETE CASCADE;

-- Add foreign key constraint for chat highlight rules
ALTER TABLE auto_highlights 
ADD CONSTRAINT fk_auto_highlights_rule_id 
FOREIGN KEY (rule_id) 
REFERENCES chat_highlight_rules(id) 
ON DELETE SET NULL;