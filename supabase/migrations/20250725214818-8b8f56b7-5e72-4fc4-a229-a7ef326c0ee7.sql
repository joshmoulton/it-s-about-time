-- Create some basic highlight rules for testing
INSERT INTO public.chat_highlight_rules (
    rule_name, 
    rule_type, 
    rule_config, 
    priority, 
    highlight_color,
    is_active
) VALUES 
-- Keyword-based rules
('High Value Keywords', 'keyword', '{"keyword": "BONK"}', 8, '#ff6b6b', true),
('Trading Keywords', 'keyword', '{"keyword": "buy"}', 7, '#4ecdc4', true),
('Profit Keywords', 'keyword', '{"keyword": "profit"}', 7, '#45b7d1', true),
('Alert Keywords', 'keyword', '{"keyword": "alert"}', 9, '#f39c12', true),

-- User-based rules
('High Value Users', 'user', '{"username": "traderkaos"}', 8, '#e74c3c', true),
('Important Users', 'user', '{"username": "WorryDice"}', 7, '#9b59b6', true),

-- Topic-based rules  
('Money Glitch Topic', 'topic', '{"topic_name": "Money Glitch"}', 6, '#2ecc71', true),
('Main Topic', 'topic', '{"topic_name": "Main"}', 5, '#95a5a6', true)

ON CONFLICT (rule_name) DO UPDATE SET
    rule_config = EXCLUDED.rule_config,
    priority = EXCLUDED.priority,
    highlight_color = EXCLUDED.highlight_color,
    is_active = EXCLUDED.is_active,
    updated_at = now();