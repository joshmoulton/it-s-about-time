-- Verify and create auto highlights trigger if it doesn't exist
DO $$
BEGIN
    -- Check if trigger exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.triggers 
        WHERE trigger_name = 'apply_highlight_rules_trigger'
        AND table_name = 'telegram_messages'
    ) THEN
        -- Create the trigger
        CREATE TRIGGER apply_highlight_rules_trigger
        AFTER INSERT OR UPDATE ON public.telegram_messages
        FOR EACH ROW
        EXECUTE FUNCTION public.apply_highlight_rules();
        
        RAISE NOTICE 'Created apply_highlight_rules_trigger on telegram_messages table';
    ELSE
        RAISE NOTICE 'apply_highlight_rules_trigger already exists on telegram_messages table';
    END IF;
END $$;