-- Check current foreign key constraints first
SELECT constraint_name, table_name, column_name 
FROM information_schema.key_column_usage 
WHERE table_name = 'auto_highlights' AND column_name = 'rule_id';

-- Drop the duplicate foreign key constraint (keeping the standard named one)
ALTER TABLE public.auto_highlights 
DROP CONSTRAINT IF EXISTS fk_auto_highlights_rule_id;

-- Verify only one constraint remains
SELECT constraint_name, table_name, column_name 
FROM information_schema.key_column_usage 
WHERE table_name = 'auto_highlights' AND column_name = 'rule_id';