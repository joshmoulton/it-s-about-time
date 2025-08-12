-- Create the main degen call detection pattern
INSERT INTO public.analyst_call_patterns (
    pattern_name,
    pattern_regex,
    extraction_config,
    is_active,
    priority,
    analyst_id
) VALUES (
    'Degen Call Pattern',
    '!degen\s+(long|short)\s+([A-Za-z0-9]+)(?:\s+(\d+(?:\.\d+)?))?(?:\s+(?:stop|sl)\s+(\d+(?:\.\d+)?))?(?:\s+(?:target|tp)\s+(\d+(?:\.\d+)?))?',
    '{
        "description": "Detects !degen DIRECTION TICKER [ENTRY] [stop STOP] [target TARGET] commands",
        "type": "degen_call",
        "direction_group": 1,
        "ticker_group": 2,
        "entry_group": 3,
        "stop_group": 4,
        "target_group": 5,
        "risk_level": "high",
        "auto_create_signal": true
    }',
    true,
    9,
    NULL
);

-- Also create a simpler backup pattern for basic degen calls
INSERT INTO public.analyst_call_patterns (
    pattern_name,
    pattern_regex,
    extraction_config,
    is_active,
    priority,
    analyst_id
) VALUES (
    'Simple Degen Pattern',
    '!degen\s+(long|short)\s+([A-Za-z0-9]+)',
    '{
        "description": "Detects basic !degen DIRECTION TICKER commands",
        "type": "degen_call",
        "direction_group": 1,
        "ticker_group": 2,
        "risk_level": "high",
        "auto_create_signal": true
    }',
    true,
    8,
    NULL
);