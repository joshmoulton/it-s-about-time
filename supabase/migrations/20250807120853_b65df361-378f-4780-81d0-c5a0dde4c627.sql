-- CRITICAL SECURITY FIX: Enable RLS on exposed tables and create proper access policies

-- Enable RLS on newsletters table
ALTER TABLE public.newsletters ENABLE ROW LEVEL SECURITY;

-- Newsletters policies - tier-based access
CREATE POLICY "newsletters_public_read" 
ON public.newsletters 
FOR SELECT 
USING (
  status = 'published' AND (
    required_tier = 'free' OR 
    (required_tier = 'paid' AND get_current_user_tier() IN ('paid', 'premium')) OR
    (required_tier = 'premium' AND get_current_user_tier() = 'premium') OR
    is_current_user_admin_fast()
  )
);

CREATE POLICY "newsletters_admin_manage" 
ON public.newsletters 
FOR ALL 
USING (is_current_user_admin_fast())
WITH CHECK (is_current_user_admin_fast());

-- Enable RLS on telegram_messages table
ALTER TABLE public.telegram_messages ENABLE ROW LEVEL SECURITY;

-- Telegram messages policies - premium only access
CREATE POLICY "telegram_messages_premium_read" 
ON public.telegram_messages 
FOR SELECT 
USING (
  get_current_user_tier() = 'premium' OR 
  is_current_user_admin_fast()
);

CREATE POLICY "telegram_messages_admin_manage" 
ON public.telegram_messages 
FOR ALL 
USING (is_current_user_admin_fast())
WITH CHECK (is_current_user_admin_fast());

-- Enable RLS on video_tutorials table
ALTER TABLE public.video_tutorials ENABLE ROW LEVEL SECURITY;

-- Video tutorials policies - tier-based access
CREATE POLICY "video_tutorials_tier_access" 
ON public.video_tutorials 
FOR SELECT 
USING (
  status = 'published' AND (
    required_tier = 'free' OR 
    (required_tier = 'paid' AND get_current_user_tier() IN ('paid', 'premium')) OR
    (required_tier = 'premium' AND get_current_user_tier() = 'premium') OR
    is_current_user_admin_fast()
  )
);

CREATE POLICY "video_tutorials_admin_manage" 
ON public.video_tutorials 
FOR ALL 
USING (is_current_user_admin_fast())
WITH CHECK (is_current_user_admin_fast());

-- Enhance existing admin_users policies with additional security
DROP POLICY IF EXISTS "admin_users_read" ON public.admin_users;
CREATE POLICY "admin_users_secure_read" 
ON public.admin_users 
FOR SELECT 
USING (
  is_current_user_admin_fast() AND 
  is_active = true
);

-- Add security audit trigger for sensitive tables
CREATE OR REPLACE FUNCTION public.security_audit_trigger()
RETURNS TRIGGER AS $$
BEGIN
  -- Log high-risk operations
  IF TG_OP IN ('UPDATE', 'DELETE') AND TG_TABLE_NAME IN ('admin_users', 'beehiiv_subscribers') THEN
    INSERT INTO admin_audit_log (
      action, resource, resource_id, user_email, metadata
    ) VALUES (
      TG_OP, TG_TABLE_NAME, 
      COALESCE(NEW.id::text, OLD.id::text),
      get_current_user_email(),
      jsonb_build_object('table', TG_TABLE_NAME, 'timestamp', now())
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;