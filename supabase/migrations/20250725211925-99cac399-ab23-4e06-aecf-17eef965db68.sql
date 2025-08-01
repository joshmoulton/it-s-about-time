-- Check if the auto highlights trigger exists and create it if needed
DO $$
BEGIN
    -- Check if trigger exists using the correct column name
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.triggers 
        WHERE trigger_name = 'apply_highlight_rules_trigger'
        AND event_object_table = 'telegram_messages'
        AND event_object_schema = 'public'
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