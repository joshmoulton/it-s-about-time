-- Add editor and premium_user roles as valid options for admin_users
-- No need to create enum since admin_users.role is text type

-- Update the adminPermissions.ts utility to recognize the new roles  
-- Add any default permissions for premium_user role in admin system

-- Create role_permissions table for proper role management
CREATE TABLE public.role_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role TEXT NOT NULL,
    permission_name TEXT NOT NULL,
    permission_category TEXT NOT NULL DEFAULT 'general',
    can_read BOOLEAN DEFAULT false,
    can_write BOOLEAN DEFAULT false,
    can_delete BOOLEAN DEFAULT false,
    can_admin BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(role, permission_name)
);

-- Enable RLS
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

-- Create policies for role_permissions
CREATE POLICY "role_permissions_admin_read" 
ON public.role_permissions 
FOR SELECT 
USING (is_current_user_admin_fast());

CREATE POLICY "role_permissions_super_admin_manage" 
ON public.role_permissions 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE email = get_current_user_email_optimized() 
    AND role = 'super_admin' 
    AND is_active = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE email = get_current_user_email_optimized() 
    AND role = 'super_admin' 
    AND is_active = true
  )
);

-- Insert default permissions for each role
INSERT INTO public.role_permissions (role, permission_name, permission_category, can_read, can_write, can_delete, can_admin) VALUES
-- Super Admin - Full access
('super_admin', 'admin_users', 'user_management', true, true, true, true),
('super_admin', 'system_settings', 'system', true, true, true, true),
('super_admin', 'role_permissions', 'system', true, true, true, true),
('super_admin', 'analytics', 'content', true, true, true, true),
('super_admin', 'newsletters', 'content', true, true, true, true),
('super_admin', 'videos', 'content', true, true, true, true),
('super_admin', 'courses', 'content', true, true, true, true),
('super_admin', 'articles', 'content', true, true, true, true),
('super_admin', 'signals', 'trading', true, true, true, true),

-- Admin - Most access except user management
('admin', 'analytics', 'content', true, true, false, false),
('admin', 'newsletters', 'content', true, true, true, false),
('admin', 'videos', 'content', true, true, true, false),
('admin', 'courses', 'content', true, true, true, false),
('admin', 'articles', 'content', true, true, true, false),
('admin', 'signals', 'trading', true, true, true, false),
('admin', 'admin_users', 'user_management', true, false, false, false),

-- Editor - Content creation and editing
('editor', 'newsletters', 'content', true, true, true, false),
('editor', 'videos', 'content', true, true, true, false),
('editor', 'courses', 'content', true, true, true, false),
('editor', 'articles', 'content', true, true, true, false),
('editor', 'analytics', 'content', true, false, false, false),

-- Analyst - Trading signals and analytics
('analyst', 'signals', 'trading', true, true, true, false),
('analyst', 'analytics', 'content', true, false, false, false),

-- Premium User - Read access to premium content (for testing)
('premium_user', 'newsletters', 'content', true, false, false, false),
('premium_user', 'videos', 'content', true, false, false, false),
('premium_user', 'courses', 'content', true, false, false, false),
('premium_user', 'articles', 'content', true, false, false, false),
('premium_user', 'signals', 'trading', true, false, false, false),
('premium_user', 'analytics', 'content', true, false, false, false);

-- Add trigger for updated_at
CREATE TRIGGER update_role_permissions_updated_at
    BEFORE UPDATE ON public.role_permissions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();