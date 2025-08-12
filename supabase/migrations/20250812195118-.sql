-- Add STOCKS & OPTIONS topic monitoring rule
INSERT INTO chat_highlight_rules (
  rule_name,
  rule_type,
  rule_config,
  priority,
  highlight_color,
  is_active
) VALUES (
  'STOCKS & OPTIONS Topic',
  'topic',
  '{"topic_name": "STOCKS & OPTIONS"}',
  6,
  '#3498db',
  true
);

-- Add more comprehensive trading keyword rules
INSERT INTO chat_highlight_rules (
  rule_name,
  rule_type,
  rule_config,
  priority,
  highlight_color,
  is_active
) VALUES 
(
  'Options Trading Keywords',
  'keyword',
  '{"keywords": ["calls", "puts", "strike", "expiry", "premium", "IV", "theta", "delta"]}',
  7,
  '#e67e22',
  true
),
(
  'Stock Market Keywords', 
  'keyword',
  '{"keywords": ["earnings", "guidance", "merger", "acquisition", "dividend", "split", "buyback"]}',
  7,
  '#8e44ad',
  true
),
(
  'Crypto High Impact Keywords',
  'keyword', 
  '{"keywords": ["pump", "dump", "moon", "rekt", "diamond hands", "paper hands", "HODL", "DeFi"]}',
  7,
  '#27ae60',
  true
),
(
  'Market Sentiment Keywords',
  'keyword',
  '{"keywords": ["bullish", "bearish", "capitulation", "euphoria", "fear", "greed", "FOMO"]}',
  6,
  '#f1c40f',
  true
),
(
  'Technical Analysis Keywords',
  'keyword',
  '{"keywords": ["breakout", "support", "resistance", "trend", "pattern", "volume", "RSI", "MACD"]}',
  6,
  '#16a085',
  true
);

-- Add important users from STOCKS & OPTIONS
INSERT INTO chat_highlight_rules (
  rule_name,
  rule_type,
  rule_config,
  priority,
  highlight_color,
  is_active
) VALUES 
(
  'STOCKS & OPTIONS VIP Users',
  'user',
  '{"usernames": ["Wizard_of_Alt", "nftspaceman", "PalePro"]}',
  8,
  '#e74c3c',
  true
),
(
  'Active Traders',
  'user', 
  '{"usernames": ["abullish", "rickjamesishere", "Tastro21"]}',
  7,
  '#9b59b6',
  true
);