-- Create enum for application roles
CREATE TYPE public.app_role AS ENUM ('user', 'analyst', 'admin', 'super_admin');

-- Create user_roles table
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    assigned_by UUID REFERENCES auth.users(id),
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create role permissions table
CREATE TABLE public.role_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role app_role NOT NULL,
    permission_name TEXT NOT NULL,
    permission_category TEXT NOT NULL,
    can_read BOOLEAN DEFAULT false,
    can_write BOOLEAN DEFAULT false,
    can_delete BOOLEAN DEFAULT false,
    can_admin BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE (role, permission_name)
);

-- Enable RLS on role_permissions
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check if user has a role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create security definer function to get user's highest role
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT role
  FROM public.user_roles
  WHERE user_id = _user_id
  ORDER BY CASE 
    WHEN role = 'super_admin' THEN 4
    WHEN role = 'admin' THEN 3
    WHEN role = 'analyst' THEN 2
    WHEN role = 'user' THEN 1
  END DESC
  LIMIT 1
$$;

-- Create security definer function to check permissions
CREATE OR REPLACE FUNCTION public.has_permission(_user_id UUID, _permission_name TEXT, _action TEXT)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    JOIN public.role_permissions rp ON ur.role = rp.role
    WHERE ur.user_id = _user_id
      AND rp.permission_name = _permission_name
      AND (
        (_action = 'read' AND rp.can_read = true) OR
        (_action = 'write' AND rp.can_write = true) OR
        (_action = 'delete' AND rp.can_delete = true) OR
        (_action = 'admin' AND rp.can_admin = true)
      )
  )
$$;

-- Create RLS policies for user_roles
CREATE POLICY "Super admins can manage all user roles"
ON public.user_roles
FOR ALL
USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
USING (user_id = auth.uid());

-- Create RLS policies for role_permissions
CREATE POLICY "Super admins can manage all role permissions"
ON public.role_permissions
FOR ALL
USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "All authenticated users can view role permissions"
ON public.role_permissions
FOR SELECT
TO authenticated
USING (true);

-- Insert default permissions for each role
INSERT INTO public.role_permissions (role, permission_name, permission_category, can_read, can_write, can_delete, can_admin) VALUES
-- User permissions
('user', 'dashboard_access', 'dashboard', true, false, false, false),
('user', 'content_view', 'content', true, false, false, false),

-- Analyst permissions (full/premium dashboard access)
('analyst', 'dashboard_access', 'dashboard', true, true, false, false),
('analyst', 'premium_features', 'dashboard', true, true, false, false),
('analyst', 'content_view', 'content', true, false, false, false),
('analyst', 'chat_highlights', 'dashboard', true, true, false, false),
('analyst', 'sentiment_analysis', 'dashboard', true, false, false, false),
('analyst', 'trading_alerts', 'dashboard', true, false, false, false),

-- Admin permissions (limited to signal creation and management)
('admin', 'signal_creation', 'signals', true, true, true, false),
('admin', 'signal_management', 'signals', true, true, true, false),
('admin', 'own_signals_only', 'signals', true, true, true, false),

-- Super admin permissions (full access)
('super_admin', 'dashboard_access', 'dashboard', true, true, true, true),
('super_admin', 'premium_features', 'dashboard', true, true, true, true),
('super_admin', 'user_management', 'admin', true, true, true, true),
('super_admin', 'role_management', 'admin', true, true, true, true),
('super_admin', 'signal_creation', 'signals', true, true, true, true),
('super_admin', 'signal_management', 'signals', true, true, true, true),
('super_admin', 'content_management', 'content', true, true, true, true),
('super_admin', 'system_settings', 'admin', true, true, true, true);

-- Create trigger for updated_at
CREATE TRIGGER update_user_roles_updated_at
    BEFORE UPDATE ON public.user_roles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_role_permissions_updated_at
    BEFORE UPDATE ON public.role_permissions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();