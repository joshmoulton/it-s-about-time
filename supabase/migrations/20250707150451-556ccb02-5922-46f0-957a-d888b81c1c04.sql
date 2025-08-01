-- Add beta_user flag to distinguish beta users from regular subscribers
ALTER TABLE public.beehiiv_subscribers 
ADD COLUMN beta_user BOOLEAN DEFAULT FALSE;

-- Update the accept_beta_invite function to handle beta user setup
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
  
  -- Create or update subscriber record with beta user flag
  INSERT INTO beehiiv_subscribers (
    email, 
    status, 
    subscription_tier, 
    beta_access_granted,
    beta_access_expires_at,
    beta_user
  ) VALUES (
    p_email, 
    'active', 
    'premium'::subscription_tier,
    true,
    now() + INTERVAL '30 days',
    true
  )
  ON CONFLICT (email) 
  DO UPDATE SET
    subscription_tier = 'premium'::subscription_tier,
    beta_access_granted = true,
    beta_access_expires_at = now() + INTERVAL '30 days',
    beta_user = true,
    updated_at = now();
  
  RETURN jsonb_build_object('success', true, 'message', 'Beta invite accepted successfully', 'requires_setup', true);
END;
$$;