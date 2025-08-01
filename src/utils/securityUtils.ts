import { supabase } from '@/integrations/supabase/client';

export type DataClassification = 'public' | 'internal' | 'confidential' | 'restricted' | 'secret';

export interface EncryptedData {
  id: string;
  user_id: string;
  data_type: string;
  classification: DataClassification;
  encrypted_value: string;
  encryption_key_id: string;
  created_at: string;
  updated_at: string;
  accessed_at?: string;
  access_count: number;
}

export interface DataAccessLog {
  id: string;
  user_id?: string;
  admin_email?: string;
  resource_type: string;
  resource_id?: string;
  action_type: string;
  ip_address?: string;
  user_agent?: string;
  geo_location?: any;
  device_fingerprint?: string;
  access_granted: boolean;
  denial_reason?: string;
  risk_score: number;
  created_at: string;
}

export interface IPAllowlistEntry {
  id: string;
  admin_email: string;
  ip_address: string;
  subnet_mask: number;
  description?: string;
  is_active: boolean;
  expires_at?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface DeviceAuth {
  id: string;
  admin_email: string;
  device_fingerprint: string;
  device_name?: string;
  device_type?: string;
  browser_info?: any;
  is_trusted: boolean;
  last_used_at?: string;
  expires_at?: string;
  created_at: string;
}

export interface DataAccessQuota {
  id: string;
  admin_email: string;
  resource_type: string;
  quota_limit: number;
  quota_used: number;
  quota_period: 'daily' | 'weekly' | 'monthly';
  period_start: string;
  period_end: string;
  created_at: string;
  updated_at: string;
}

// Device fingerprinting utilities
export const generateDeviceFingerprint = (): string => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillText('Device fingerprint', 2, 2);
  }
  
  const fingerprint = {
    userAgent: navigator.userAgent,
    language: navigator.language,
    platform: navigator.platform,
    screen: `${screen.width}x${screen.height}`,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    canvas: canvas.toDataURL(),
    webgl: getWebGLFingerprint(),
  };
  
  return btoa(JSON.stringify(fingerprint)).substring(0, 32);
};

const getWebGLFingerprint = (): string => {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) return 'no-webgl';
    
    const glContext = gl as WebGLRenderingContext;
    const renderer = glContext.getParameter(glContext.RENDERER);
    const vendor = glContext.getParameter(glContext.VENDOR);
    return `${vendor}-${renderer}`;
  } catch {
    return 'webgl-error';
  }
};

// IP detection utility
export const getCurrentIP = async (): Promise<string | null> => {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip;
  } catch {
    return null;
  }
};

// Secure data access utilities
export const encryptSensitiveData = async (
  data: string,
  keyId: string = 'default'
): Promise<string | null> => {
  try {
    const { data: result, error } = await supabase.rpc('encrypt_sensitive_data', {
      data_to_encrypt: data,
      key_id: keyId
    });
    
    if (error) throw error;
    return result;
  } catch (error) {
    console.error('Encryption failed:', error);
    return null;
  }
};

export const decryptSensitiveData = async (
  encryptedData: string,
  keyId: string = 'default'
): Promise<string | null> => {
  try {
    const { data: result, error } = await supabase.rpc('decrypt_sensitive_data', {
      p_encrypted_data: encryptedData,
      p_key_id: keyId
    });
    
    if (error) throw error;
    return result;
  } catch (error) {
    console.error('Decryption failed:', error);
    return null;
  }
};

export const logDataAccess = async (
  params: Partial<DataAccessLog>
): Promise<string | null> => {
  try {
    const { data: result, error } = await supabase.rpc('log_data_access', {
      p_user_id: params.user_id,
      p_admin_email: params.admin_email,
      p_resource_type: params.resource_type,
      p_resource_id: params.resource_id,
      p_action_type: params.action_type,
      p_ip_address: params.ip_address,
      p_user_agent: params.user_agent,
      p_geo_location: params.geo_location,
      p_device_fingerprint: params.device_fingerprint,
      p_access_granted: params.access_granted || false,
      p_denial_reason: params.denial_reason,
      p_risk_score: params.risk_score || 0.0
    });
    
    if (error) throw error;
    return result;
  } catch (error) {
    console.error('Failed to log data access:', error);
    return null;
  }
};

export const checkSecureDataAccess = async (
  operationType: string,
  resourceType: string = 'sensitive_data',
  ipAddress?: string,
  deviceFingerprint?: string
): Promise<boolean> => {
  try {
    const { data: result, error } = await supabase.rpc('require_secure_data_access', {
      p_operation_type: operationType,
      p_resource_type: resourceType,
      p_ip_address: ipAddress,
      p_device_fingerprint: deviceFingerprint
    });
    
    if (error) throw error;
    return result;
  } catch (error) {
    console.error('Security check failed:', error);
    return false;
  }
};

// IP allowlist management
export const addIPToAllowlist = async (
  adminEmail: string,
  ipAddress: string,
  subnetMask: number = 32,
  description?: string,
  expiresAt?: string
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('admin_ip_allowlist')
      .insert({
        admin_email: adminEmail,
        ip_address: ipAddress,
        subnet_mask: subnetMask,
        description,
        expires_at: expiresAt
      });
    
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Failed to add IP to allowlist:', error);
    return false;
  }
};

export const getIPAllowlist = async (adminEmail?: string): Promise<IPAllowlistEntry[]> => {
  try {
    let query = supabase.from('admin_ip_allowlist').select('*');
    
    if (adminEmail) {
      query = query.eq('admin_email', adminEmail);
    }
    
    const { data, error } = await query.order('created_at', { ascending: false });
    
    if (error) throw error;
    return (data || []) as IPAllowlistEntry[];
  } catch (error) {
    console.error('Failed to fetch IP allowlist:', error);
    return [];
  }
};

// Device authorization management
export const authorizeDevice = async (
  adminEmail: string,
  deviceFingerprint: string,
  deviceName?: string,
  deviceType?: string,
  browserInfo?: any,
  expiresAt?: string
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('admin_device_auth')
      .upsert({
        admin_email: adminEmail,
        device_fingerprint: deviceFingerprint,
        device_name: deviceName,
        device_type: deviceType,
        browser_info: browserInfo,
        is_trusted: true,
        expires_at: expiresAt,
        last_used_at: new Date().toISOString()
      });
    
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Failed to authorize device:', error);
    return false;
  }
};

export const getAuthorizedDevices = async (adminEmail?: string): Promise<DeviceAuth[]> => {
  try {
    let query = supabase.from('admin_device_auth').select('*');
    
    if (adminEmail) {
      query = query.eq('admin_email', adminEmail);
    }
    
    const { data, error } = await query.order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Failed to fetch authorized devices:', error);
    return [];
  }
};

// Data access quota management
export const setDataAccessQuota = async (
  adminEmail: string,
  resourceType: string,
  quotaLimit: number,
  quotaPeriod: 'daily' | 'weekly' | 'monthly' = 'daily'
): Promise<boolean> => {
  try {
    const now = new Date();
    let periodEnd: Date;
    
    switch (quotaPeriod) {
      case 'daily':
        periodEnd = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        break;
      case 'weekly':
        periodEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        break;
      case 'monthly':
        periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());
        break;
    }
    
    const { error } = await supabase
      .from('data_access_quotas')
      .insert({
        admin_email: adminEmail,
        resource_type: resourceType,
        quota_limit: quotaLimit,
        quota_period: quotaPeriod,
        period_start: now.toISOString(),
        period_end: periodEnd.toISOString()
      });
    
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Failed to set data access quota:', error);
    return false;
  }
};

export const getDataAccessQuotas = async (adminEmail?: string): Promise<DataAccessQuota[]> => {
  try {
    let query = supabase.from('data_access_quotas').select('*');
    
    if (adminEmail) {
      query = query.eq('admin_email', adminEmail);
    }
    
    const { data, error } = await query.order('created_at', { ascending: false });
    
    if (error) throw error;
    return (data || []) as DataAccessQuota[];
  } catch (error) {
    console.error('Failed to fetch data access quotas:', error);
    return [];
  }
};

// Data access logs
export const getDataAccessLogs = async (
  adminEmail?: string,
  limit: number = 100
): Promise<DataAccessLog[]> => {
  try {
    let query = supabase.from('data_access_logs').select('*');
    
    if (adminEmail) {
      query = query.eq('admin_email', adminEmail);
    }
    
    const { data, error } = await query
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error) throw error;
    return (data || []) as DataAccessLog[];
  } catch (error) {
    console.error('Failed to fetch data access logs:', error);
    return [];
  }
};