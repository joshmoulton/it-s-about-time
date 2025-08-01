-- Create beta invites table
CREATE TABLE public.beta_invites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  invite_token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired')),
  invited_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  accepted_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + INTERVAL '7 days'),
  access_level TEXT NOT NULL DEFAULT 'premium' CHECK (access_level IN ('premium', 'paid')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for performance
CREATE INDEX idx_beta_invites_token ON public.beta_invites(invite_token);
CREATE INDEX idx_beta_invites_email ON public.beta_invites(email);

-- Enable RLS
ALTER TABLE public.beta_invites ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Admins and analysts can view beta invites" 
ON public.beta_invites 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() 
    AND ur.role IN ('admin', 'analyst', 'super_admin')
  )
);

CREATE POLICY "Admins and analysts can create beta invites" 
ON public.beta_invites 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() 
    AND ur.role IN ('admin', 'analyst', 'super_admin')
  )
);

CREATE POLICY "Admins and analysts can update beta invites" 
ON public.beta_invites 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() 
    AND ur.role IN ('admin', 'analyst', 'super_admin')
  )
);

-- Add beta_access column to beehiiv_subscribers
ALTER TABLE public.beehiiv_subscribers 
ADD COLUMN beta_access_granted BOOLEAN DEFAULT FALSE,
ADD COLUMN beta_access_expires_at TIMESTAMP WITH TIME ZONE;

-- Create function to handle beta invite acceptance
CREATE OR REPLACE FUNCTION public.accept_beta_invite(p_token TEXT, p_email TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  invite_record beta_invites%ROWTYPE;
  subscriber_record beehiiv_subscribers%ROWTYPE;
  result JSONB;
BEGIN
  -- Find the invite
  SELECT * INTO invite_record 
  FROM beta_invites 
  WHERE invite_token = p_token 
    AND email = p_email 
    AND status = 'pending' 
    AND expires_at > now();
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid or expired invite');
  END IF;
  
  -- Update invite status
  UPDATE beta_invites 
  SET status = 'accepted', 
      accepted_at = now(),
      updated_at = now()
  WHERE id = invite_record.id;
  
  -- Create or update subscriber record
  INSERT INTO beehiiv_subscribers (
    email, 
    status, 
    subscription_tier, 
    beta_access_granted,
    beta_access_expires_at
  ) VALUES (
    p_email, 
    'active', 
    'premium'::subscription_tier,
    true,
    now() + INTERVAL '30 days'
  )
  ON CONFLICT (email) 
  DO UPDATE SET
    subscription_tier = 'premium'::subscription_tier,
    beta_access_granted = true,
    beta_access_expires_at = now() + INTERVAL '30 days',
    updated_at = now();
  
  RETURN jsonb_build_object('success', true, 'message', 'Beta invite accepted successfully');
END;
$$;

-- Add trigger for updated_at
CREATE TRIGGER update_beta_invites_updated_at
  BEFORE UPDATE ON public.beta_invites
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();