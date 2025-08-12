-- Process the specific degen call manually since it happened before patterns were added
INSERT INTO public.analyst_signals (
    analyst_name,
    ticker,
    trade_direction,
    trade_type,
    market,
    entry_type,
    risk_management,
    risk_percentage,
    full_description,
    telegram_message_id,
    posted_to_telegram,
    status,
    created_at,
    updated_at
) VALUES (
    'iamjoshmoulton',
    'PENGU',
    'long',
    'futures',
    'crypto',
    'market',
    'conditional',
    5.0,
    'DEGEN: !degen long pengu',
    2012977,
    true,
    'active',
    '2025-08-12 21:46:31.246888+00',
    NOW()
);