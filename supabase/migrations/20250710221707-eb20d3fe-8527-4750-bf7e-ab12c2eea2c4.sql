-- Create admin audit log table for security tracking
CREATE TABLE public.admin_audit_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  action TEXT NOT NULL,
  resource TEXT NOT NULL,
  resource_id TEXT,
  user_email TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Super admins can view all audit logs"
ON public.admin_audit_log
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM admin_users au
    JOIN beehiiv_subscribers bs ON au.subscriber_id = bs.id
    WHERE bs.email = ((current_setting('request.jwt.claims', true))::json ->> 'email')
    AND au.is_active = true
    AND au.role = 'super_admin'
  )
);

CREATE POLICY "Admins can view their own audit logs"
ON public.admin_audit_log
FOR SELECT
USING (
  user_email = ((current_setting('request.jwt.claims', true))::json ->> 'email')
  OR EXISTS (
    SELECT 1
    FROM admin_users au
    JOIN beehiiv_subscribers bs ON au.subscriber_id = bs.id
    WHERE bs.email = ((current_setting('request.jwt.claims', true))::json ->> 'email')
    AND au.is_active = true
    AND au.role IN ('admin', 'super_admin')
  )
);

CREATE POLICY "System can insert audit logs"
ON public.admin_audit_log
FOR INSERT
WITH CHECK (true);

-- Create index for better performance
CREATE INDEX idx_admin_audit_log_user_email ON public.admin_audit_log(user_email);
CREATE INDEX idx_admin_audit_log_created_at ON public.admin_audit_log(created_at);
CREATE INDEX idx_admin_audit_log_action ON public.admin_audit_log(action);
CREATE INDEX idx_admin_audit_log_resource ON public.admin_audit_log(resource);