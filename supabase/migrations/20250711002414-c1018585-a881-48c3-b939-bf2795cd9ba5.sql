-- Phase 5: Advanced Data Encryption & Security Hardening (Fixed)
-- Step 1: Database-Level Encryption Infrastructure

-- Create encrypted data storage schema
CREATE SCHEMA IF NOT EXISTS encrypted_data;

-- Enable pgcrypto extension for encryption functions
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create data classification enum
CREATE TYPE public.data_classification AS ENUM ('public', 'internal', 'confidential', 'restricted', 'secret');

-- Create table for storing encrypted user data
CREATE TABLE public.encrypted_user_data (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    data_type TEXT NOT NULL,
    classification public.data_classification NOT NULL DEFAULT 'confidential',
    encrypted_value TEXT NOT NULL,
    encryption_key_id TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    accessed_at TIMESTAMP WITH TIME ZONE,
    access_count INTEGER DEFAULT 0
);

-- Enable RLS on encrypted data
ALTER TABLE public.encrypted_user_data ENABLE ROW LEVEL SECURITY;

-- Create access control logs table
CREATE TABLE public.data_access_logs (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID,
    admin_email TEXT,
    resource_type TEXT NOT NULL,
    resource_id TEXT,
    action_type TEXT NOT NULL,
    ip_address INET,
    user_agent TEXT,
    geo_location JSONB,
    device_fingerprint TEXT,
    access_granted BOOLEAN NOT NULL DEFAULT false,
    denial_reason TEXT,
    risk_score NUMERIC DEFAULT 0.0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on access logs
ALTER TABLE public.data_access_logs ENABLE ROW LEVEL SECURITY;

-- Create IP allowlist table
CREATE TABLE public.admin_ip_allowlist (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    admin_email TEXT NOT NULL,
    ip_address INET NOT NULL,
    subnet_mask INTEGER DEFAULT 32,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_by TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on IP allowlist
ALTER TABLE public.admin_ip_allowlist ENABLE ROW LEVEL SECURITY;

-- Create device authorization table
CREATE TABLE public.admin_device_auth (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    admin_email TEXT NOT NULL,
    device_fingerprint TEXT NOT NULL UNIQUE,
    device_name TEXT,
    device_type TEXT,
    browser_info JSONB,
    is_trusted BOOLEAN NOT NULL DEFAULT false,
    last_used_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on device auth
ALTER TABLE public.admin_device_auth ENABLE ROW LEVEL SECURITY;

-- Create data access quotas table
CREATE TABLE public.data_access_quotas (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    admin_email TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    quota_limit INTEGER NOT NULL,
    quota_used INTEGER DEFAULT 0,
    quota_period TEXT NOT NULL DEFAULT 'daily', -- daily, weekly, monthly
    period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on quotas
ALTER TABLE public.data_access_quotas ENABLE ROW LEVEL SECURITY;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_encrypted_user_data_user_id ON public.encrypted_user_data(user_id);
CREATE INDEX IF NOT EXISTS idx_encrypted_user_data_type ON public.encrypted_user_data(data_type);
CREATE INDEX IF NOT EXISTS idx_encrypted_user_data_classification ON public.encrypted_user_data(classification);
CREATE INDEX IF NOT EXISTS idx_data_access_logs_admin_email ON public.data_access_logs(admin_email);
CREATE INDEX IF NOT EXISTS idx_data_access_logs_created_at ON public.data_access_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_data_access_logs_ip ON public.data_access_logs(ip_address);
CREATE INDEX IF NOT EXISTS idx_admin_ip_allowlist_email ON public.admin_ip_allowlist(admin_email);
CREATE INDEX IF NOT EXISTS idx_admin_ip_allowlist_ip ON public.admin_ip_allowlist(ip_address);
CREATE INDEX IF NOT EXISTS idx_admin_device_auth_email ON public.admin_device_auth(admin_email);
CREATE INDEX IF NOT EXISTS idx_admin_device_auth_fingerprint ON public.admin_device_auth(device_fingerprint);

-- Function to encrypt sensitive data
CREATE OR REPLACE FUNCTION public.encrypt_sensitive_data(
    p_data TEXT,
    p_key_id TEXT DEFAULT 'default'
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    encryption_key TEXT;
    encrypted_result TEXT;
BEGIN
    -- Get encryption key from vault (simplified for demo)
    encryption_key := 'demo_key_' || p_key_id;
    
    -- Encrypt the data using pgcrypto
    encrypted_result := encode(
        encrypt(
            p_data::bytea,
            encryption_key::bytea,
            'aes'
        ),
        'base64'
    );
    
    RETURN encrypted_result;
END;
$$;

-- Function to decrypt sensitive data
CREATE OR REPLACE FUNCTION public.decrypt_sensitive_data(
    p_encrypted_data TEXT,
    p_key_id TEXT DEFAULT 'default'
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    encryption_key TEXT;
    decrypted_result TEXT;
BEGIN
    -- Get encryption key from vault (simplified for demo)
    encryption_key := 'demo_key_' || p_key_id;
    
    -- Decrypt the data
    decrypted_result := convert_from(
        decrypt(
            decode(p_encrypted_data, 'base64'),
            encryption_key::bytea,
            'aes'
        ),
        'UTF8'
    );
    
    RETURN decrypted_result;
END;
$$;

-- Function to log data access
CREATE OR REPLACE FUNCTION public.log_data_access(
    p_user_id UUID DEFAULT NULL,
    p_admin_email TEXT DEFAULT NULL,
    p_resource_type TEXT DEFAULT NULL,
    p_resource_id TEXT DEFAULT NULL,
    p_action_type TEXT DEFAULT NULL,
    p_ip_address INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL,
    p_geo_location JSONB DEFAULT NULL,
    p_device_fingerprint TEXT DEFAULT NULL,
    p_access_granted BOOLEAN DEFAULT false,
    p_denial_reason TEXT DEFAULT NULL,
    p_risk_score NUMERIC DEFAULT 0.0
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    log_id UUID;
BEGIN
    INSERT INTO public.data_access_logs (
        user_id, admin_email, resource_type, resource_id, action_type,
        ip_address, user_agent, geo_location, device_fingerprint,
        access_granted, denial_reason, risk_score
    ) VALUES (
        p_user_id, p_admin_email, p_resource_type, p_resource_id, p_action_type,
        p_ip_address, p_user_agent, p_geo_location, p_device_fingerprint,
        p_access_granted, p_denial_reason, p_risk_score
    ) RETURNING id INTO log_id;
    
    RETURN log_id;
END;
$$;

-- Function to check IP allowlist
CREATE OR REPLACE FUNCTION public.is_ip_allowed(
    p_admin_email TEXT,
    p_ip_address INET
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
    is_allowed BOOLEAN := false;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM public.admin_ip_allowlist
        WHERE admin_email = p_admin_email
        AND is_active = true
        AND (expires_at IS NULL OR expires_at > now())
        AND (
            ip_address = p_ip_address OR
            p_ip_address <<= (ip_address::text || '/' || subnet_mask::text)::inet
        )
    ) INTO is_allowed;
    
    RETURN is_allowed;
END;
$$;

-- Function to check device authorization
CREATE OR REPLACE FUNCTION public.is_device_authorized(
    p_admin_email TEXT,
    p_device_fingerprint TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
    is_authorized BOOLEAN := false;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM public.admin_device_auth
        WHERE admin_email = p_admin_email
        AND device_fingerprint = p_device_fingerprint
        AND is_trusted = true
        AND (expires_at IS NULL OR expires_at > now())
    ) INTO is_authorized;
    
    RETURN is_authorized;
END;
$$;

-- Function to check data access quota
CREATE OR REPLACE FUNCTION public.check_data_access_quota(
    p_admin_email TEXT,
    p_resource_type TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    quota_available BOOLEAN := false;
    current_quota RECORD;
BEGIN
    -- Get current quota for the admin and resource type
    SELECT * INTO current_quota
    FROM public.data_access_quotas
    WHERE admin_email = p_admin_email
    AND resource_type = p_resource_type
    AND period_start <= now()
    AND period_end >= now()
    ORDER BY created_at DESC
    LIMIT 1;
    
    IF current_quota.id IS NULL THEN
        -- No quota set, allow access
        quota_available := true;
    ELSE
        -- Check if quota is available
        quota_available := current_quota.quota_used < current_quota.quota_limit;
    END IF;
    
    RETURN quota_available;
END;
$$;

-- Function to require secure data access with comprehensive checks
CREATE OR REPLACE FUNCTION public.require_secure_data_access(
    p_operation_type TEXT,
    p_resource_type TEXT DEFAULT 'sensitive_data',
    p_ip_address INET DEFAULT NULL,
    p_device_fingerprint TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_email TEXT;
    ip_allowed BOOLEAN := true;
    device_authorized BOOLEAN := true;
    quota_available BOOLEAN := true;
    risk_score NUMERIC := 0.0;
    access_granted BOOLEAN := false;
BEGIN
    current_email := get_current_user_email();
    
    IF current_email IS NULL THEN
        PERFORM log_data_access(
            NULL, NULL, p_resource_type, NULL, p_operation_type,
            p_ip_address, NULL, NULL, p_device_fingerprint,
            false, 'No authenticated user', 10.0
        );
        RETURN FALSE;
    END IF;
    
    -- Check IP allowlist if IP provided
    IF p_ip_address IS NOT NULL THEN
        ip_allowed := is_ip_allowed(current_email, p_ip_address);
        IF NOT ip_allowed THEN
            risk_score := risk_score + 5.0;
        END IF;
    END IF;
    
    -- Check device authorization if fingerprint provided
    IF p_device_fingerprint IS NOT NULL THEN
        device_authorized := is_device_authorized(current_email, p_device_fingerprint);
        IF NOT device_authorized THEN
            risk_score := risk_score + 3.0;
        END IF;
    END IF;
    
    -- Check data access quota
    quota_available := check_data_access_quota(current_email, p_resource_type);
    IF NOT quota_available THEN
        risk_score := risk_score + 2.0;
    END IF;
    
    -- Determine access based on checks
    access_granted := ip_allowed AND device_authorized AND quota_available AND risk_score < 5.0;
    
    -- Log the access attempt
    PERFORM log_data_access(
        NULL, current_email, p_resource_type, NULL, p_operation_type,
        p_ip_address, NULL, NULL, p_device_fingerprint,
        access_granted, 
        CASE WHEN NOT access_granted THEN 
            'Access denied: IP=' || ip_allowed::text || 
            ', Device=' || device_authorized::text || 
            ', Quota=' || quota_available::text ||
            ', Risk=' || risk_score::text
        ELSE NULL END,
        risk_score
    );
    
    -- Update quota if access granted
    IF access_granted THEN
        UPDATE public.data_access_quotas
        SET quota_used = quota_used + 1,
            updated_at = now()
        WHERE admin_email = current_email
        AND resource_type = p_resource_type
        AND period_start <= now()
        AND period_end >= now();
    END IF;
    
    RETURN access_granted;
END;
$$;

-- Apply triggers for updated_at columns
CREATE TRIGGER update_encrypted_user_data_updated_at
    BEFORE UPDATE ON public.encrypted_user_data
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_admin_ip_allowlist_updated_at
    BEFORE UPDATE ON public.admin_ip_allowlist
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_data_access_quotas_updated_at
    BEFORE UPDATE ON public.data_access_quotas
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies (created after functions to avoid dependency issues)
CREATE POLICY "Super admins can manage encrypted data"
ON public.encrypted_user_data
FOR ALL
USING (has_admin_role('super_admin'));

-- RLS Policies for access logs
CREATE POLICY "Admins can view their own access logs"
ON public.data_access_logs
FOR SELECT
USING (admin_email = get_current_user_email());

CREATE POLICY "Super admins can view all access logs"
ON public.data_access_logs
FOR SELECT
USING (has_admin_role('super_admin'));

CREATE POLICY "System can insert access logs"
ON public.data_access_logs
FOR INSERT
WITH CHECK (true);

-- RLS Policies for IP allowlist
CREATE POLICY "Admins can view their own IP allowlist"
ON public.admin_ip_allowlist
FOR SELECT
USING (admin_email = get_current_user_email());

CREATE POLICY "Super admins can manage IP allowlist"
ON public.admin_ip_allowlist
FOR ALL
USING (has_admin_role('super_admin'));

-- RLS Policies for device auth
CREATE POLICY "Admins can view their own devices"
ON public.admin_device_auth
FOR SELECT
USING (admin_email = get_current_user_email());

CREATE POLICY "Admins can manage their own devices"
ON public.admin_device_auth
FOR ALL
USING (admin_email = get_current_user_email());

CREATE POLICY "Super admins can manage all devices"
ON public.admin_device_auth
FOR ALL
USING (has_admin_role('super_admin'));

-- RLS Policies for quotas
CREATE POLICY "Admins can view their own quotas"
ON public.data_access_quotas
FOR SELECT
USING (admin_email = get_current_user_email());

CREATE POLICY "Super admins can manage all quotas"
ON public.data_access_quotas
FOR ALL
USING (has_admin_role('super_admin'));