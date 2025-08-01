-- Create detailed user profiles table
CREATE TABLE public.user_trading_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_email TEXT NOT NULL UNIQUE,
  user_id UUID REFERENCES public.beehiiv_subscribers(id) ON DELETE CASCADE,
  
  -- Trading Experience
  experience_level TEXT CHECK (experience_level IN ('beginner', 'intermediate', 'advanced', 'professional')) DEFAULT 'beginner',
  years_trading INTEGER CHECK (years_trading >= 0 AND years_trading <= 50),
  
  -- Financial Information
  portfolio_size_range TEXT CHECK (portfolio_size_range IN ('under_1k', '1k_5k', '5k_25k', '25k_100k', '100k_500k', '500k_plus')),
  typical_position_size_range TEXT CHECK (typical_position_size_range IN ('under_100', '100_500', '500_2k', '2k_10k', '10k_50k', '50k_plus')),
  monthly_trading_budget_range TEXT CHECK (monthly_trading_budget_range IN ('under_500', '500_2k', '2k_10k', '10k_plus')),
  
  -- Risk Profile
  risk_tolerance TEXT CHECK (risk_tolerance IN ('very_conservative', 'conservative', 'moderate', 'aggressive', 'very_aggressive')) DEFAULT 'moderate',
  max_loss_percentage INTEGER CHECK (max_loss_percentage >= 1 AND max_loss_percentage <= 100) DEFAULT 10,
  preferred_roi_target INTEGER CHECK (preferred_roi_target >= 5 AND preferred_roi_target <= 1000) DEFAULT 20,
  
  -- Market Preferences
  preferred_markets TEXT[] DEFAULT '{}',
  crypto_allocation_percentage INTEGER CHECK (crypto_allocation_percentage >= 0 AND crypto_allocation_percentage <= 100) DEFAULT 0,
  stocks_allocation_percentage INTEGER CHECK (stocks_allocation_percentage >= 0 AND stocks_allocation_percentage <= 100) DEFAULT 0,
  
  -- Trading Style
  trading_frequency TEXT CHECK (trading_frequency IN ('daily', 'weekly', 'monthly', 'quarterly', 'hold_long_term')) DEFAULT 'weekly',
  trading_style TEXT[] DEFAULT '{}', -- ['scalping', 'day_trading', 'swing_trading', 'position_trading', 'buy_hold']
  preferred_analysis_types TEXT[] DEFAULT '{}', -- ['technical', 'fundamental', 'sentiment', 'news_based']
  
  -- Goals & Preferences
  primary_trading_goal TEXT CHECK (primary_trading_goal IN ('income_generation', 'wealth_building', 'speculation', 'hedging', 'learning')) DEFAULT 'wealth_building',
  time_horizon TEXT CHECK (time_horizon IN ('short_term', 'medium_term', 'long_term', 'mixed')) DEFAULT 'medium_term',
  
  -- Demographics (optional)
  age_range TEXT CHECK (age_range IN ('18_25', '26_35', '36_45', '46_55', '56_65', '65_plus')),
  employment_status TEXT CHECK (employment_status IN ('employed', 'self_employed', 'retired', 'student', 'unemployed')),
  
  -- Preferences
  notification_preferences JSONB DEFAULT '{"degen_calls": true, "newsletter_alerts": true, "educational_content": true}',
  calculator_preferences JSONB DEFAULT '{"risk_calculator": true, "position_sizing": true, "roi_calculator": true}',
  
  -- Metadata
  profile_completed BOOLEAN DEFAULT false,
  profile_completion_percentage INTEGER DEFAULT 0,
  last_updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_trading_profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can manage their own trading profile" 
ON public.user_trading_profiles 
FOR ALL
USING (user_email = (current_setting('request.jwt.claims', true)::json->>'email'));

CREATE POLICY "Admins can view all trading profiles" 
ON public.user_trading_profiles 
FOR SELECT
USING (is_current_user_admin());

-- Add trigger to update timestamps
CREATE TRIGGER update_user_trading_profiles_updated_at
BEFORE UPDATE ON public.user_trading_profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to calculate profile completion percentage
CREATE OR REPLACE FUNCTION public.calculate_profile_completion(profile_row user_trading_profiles)
RETURNS INTEGER
LANGUAGE plpgsql
STABLE
AS $function$
DECLARE
  total_fields INTEGER := 15;
  completed_fields INTEGER := 0;
BEGIN
  -- Count completed fields
  IF profile_row.experience_level IS NOT NULL THEN completed_fields := completed_fields + 1; END IF;
  IF profile_row.years_trading IS NOT NULL THEN completed_fields := completed_fields + 1; END IF;
  IF profile_row.portfolio_size_range IS NOT NULL THEN completed_fields := completed_fields + 1; END IF;
  IF profile_row.typical_position_size_range IS NOT NULL THEN completed_fields := completed_fields + 1; END IF;
  IF profile_row.risk_tolerance IS NOT NULL THEN completed_fields := completed_fields + 1; END IF;
  IF profile_row.max_loss_percentage IS NOT NULL THEN completed_fields := completed_fields + 1; END IF;
  IF profile_row.preferred_markets IS NOT NULL AND array_length(profile_row.preferred_markets, 1) > 0 THEN completed_fields := completed_fields + 1; END IF;
  IF profile_row.trading_frequency IS NOT NULL THEN completed_fields := completed_fields + 1; END IF;
  IF profile_row.trading_style IS NOT NULL AND array_length(profile_row.trading_style, 1) > 0 THEN completed_fields := completed_fields + 1; END IF;
  IF profile_row.primary_trading_goal IS NOT NULL THEN completed_fields := completed_fields + 1; END IF;
  IF profile_row.time_horizon IS NOT NULL THEN completed_fields := completed_fields + 1; END IF;
  IF profile_row.age_range IS NOT NULL THEN completed_fields := completed_fields + 1; END IF;
  IF profile_row.employment_status IS NOT NULL THEN completed_fields := completed_fields + 1; END IF;
  IF profile_row.crypto_allocation_percentage IS NOT NULL THEN completed_fields := completed_fields + 1; END IF;
  IF profile_row.preferred_roi_target IS NOT NULL THEN completed_fields := completed_fields + 1; END IF;
  
  RETURN ROUND((completed_fields::DECIMAL / total_fields::DECIMAL) * 100);
END;
$function$;