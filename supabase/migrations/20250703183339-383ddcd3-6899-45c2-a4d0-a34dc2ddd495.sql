-- Create analysts table to manage all analysts
CREATE TABLE public.analysts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  display_name TEXT,
  description TEXT,
  avatar_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.analysts ENABLE ROW LEVEL SECURITY;

-- Create policies - analysts are viewable by everyone
CREATE POLICY "Anyone can view active analysts" 
ON public.analysts 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Admins can manage analysts" 
ON public.analysts 
FOR ALL 
USING (is_current_user_admin());

-- Insert existing analysts plus a few more
INSERT INTO public.analysts (name, display_name, description) VALUES 
('Foxy', 'Foxy', 'Expert crypto trader with focus on DeFi opportunities'),
('Pidgeon', 'Pidgeon', 'Technical analysis specialist and swing trader'),
('CryptoWiz', 'Crypto Wiz', 'Day trader specializing in altcoin momentum plays'),
('DegenKing', 'Degen King', 'High-risk, high-reward meme coin specialist'),
('TechAnalyst', 'Tech Analyst', 'Long-term technical analysis and market structure expert');

-- Add trigger for updated_at
CREATE TRIGGER update_analysts_updated_at
BEFORE UPDATE ON public.analysts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();