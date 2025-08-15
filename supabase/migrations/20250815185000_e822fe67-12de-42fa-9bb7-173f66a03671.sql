-- Update format_degen_call_message function to remove risk percentage
CREATE OR REPLACE FUNCTION public.format_degen_call_message(signal_id uuid)
RETURNS text
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    signal_data RECORD;
    entry_display TEXT;
    stop_loss_display TEXT;
    targets_display TEXT;
    size_display TEXT;
    message_text TEXT;
BEGIN
    -- Get signal data
    SELECT 
        ticker,
        trade_direction,
        entry_price,
        stop_loss_price,
        targets,
        analyst_name
    INTO signal_data
    FROM analyst_signals
    WHERE id = signal_id;
    
    IF NOT FOUND THEN
        RETURN 'Signal not found';
    END IF;
    
    -- Format entry price
    IF signal_data.entry_price IS NOT NULL THEN
        entry_display := '$' || signal_data.entry_price::TEXT;
    ELSE
        entry_display := 'N/A';
    END IF;
    
    -- Format stop loss
    IF signal_data.stop_loss_price IS NOT NULL THEN
        stop_loss_display := '$' || signal_data.stop_loss_price::TEXT;
    ELSE
        stop_loss_display := 'N/A';
    END IF;
    
    -- Format targets
    IF signal_data.targets IS NOT NULL AND jsonb_array_length(signal_data.targets) > 0 THEN
        SELECT string_agg('$' || value::TEXT, ', ') INTO targets_display
        FROM jsonb_array_elements_text(signal_data.targets);
    ELSE
        targets_display := 'N/A';
    END IF;
    
    -- Size is always N/A for now
    size_display := 'N/A';
    
    -- Build the message
    message_text := format(
        E'🚨 <b>DEGEN CALL ALERT</b> 🚨\n\n💎 <b>%s %s</b> 📈\n\n🎯 <b>Entry:</b> %s\n❌ <b>Stop Loss:</b> %s\n🚀 <b>Targets:</b> %s\n📏 <b>Size:</b> %s\n\n👤 <b>Called by:</b> %s\n\n⚠️ This is a DEGEN CALL - Trade at your own risk!\n📈 Not financial advice - DYOR!',
        UPPER(signal_data.ticker),
        UPPER(signal_data.trade_direction::TEXT),
        entry_display,
        stop_loss_display,
        targets_display,
        size_display,
        signal_data.analyst_name
    );
    
    RETURN message_text;
END;
$function$;