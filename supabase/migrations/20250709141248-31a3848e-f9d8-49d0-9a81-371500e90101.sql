-- Add new fields to user_trading_profiles table for comprehensive questionnaire
ALTER TABLE user_trading_profiles 
ADD COLUMN IF NOT EXISTS trading_confidence INTEGER CHECK (trading_confidence >= 1 AND trading_confidence <= 10),
ADD COLUMN IF NOT EXISTS timezone TEXT,
ADD COLUMN IF NOT EXISTS work_status TEXT,
ADD COLUMN IF NOT EXISTS market_experience_category TEXT,
ADD COLUMN IF NOT EXISTS learning_motivation TEXT,
ADD COLUMN IF NOT EXISTS time_learning_trading TEXT,
ADD COLUMN IF NOT EXISTS biggest_hurdle TEXT;