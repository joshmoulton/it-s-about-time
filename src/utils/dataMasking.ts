// Data masking utilities for protecting sensitive information
import { logger } from './secureLogger';

export type DataClassification = 'public' | 'restricted' | 'confidential' | 'secret';

export interface MaskingOptions {
  classification: DataClassification;
  showFirstChars?: number;
  showLastChars?: number;
  maskChar?: string;
  preserveFormat?: boolean;
}

export interface FieldMaskingConfig {
  email: MaskingOptions;
  phone: MaskingOptions;
  address: MaskingOptions;
  name: MaskingOptions;
  ip: MaskingOptions;
  financial: MaskingOptions;
  id: MaskingOptions;
}

// Default masking configuration
export const DEFAULT_MASKING_CONFIG: FieldMaskingConfig = {
  email: { 
    classification: 'restricted', 
    showFirstChars: 2, 
    showLastChars: 0, 
    preserveFormat: true 
  },
  phone: { 
    classification: 'confidential', 
    showFirstChars: 0, 
    showLastChars: 2 
  },
  address: { 
    classification: 'confidential', 
    showFirstChars: 3, 
    showLastChars: 0 
  },
  name: { 
    classification: 'restricted', 
    showFirstChars: 2, 
    showLastChars: 0 
  },
  ip: { 
    classification: 'confidential', 
    showFirstChars: 0, 
    showLastChars: 0 
  },
  financial: { 
    classification: 'secret', 
    showFirstChars: 0, 
    showLastChars: 0 
  },
  id: { 
    classification: 'confidential', 
    showFirstChars: 4, 
    showLastChars: 4 
  }
};

/**
 * Masks sensitive data based on classification and options
 */
export const maskData = (value: string | null | undefined, options: MaskingOptions): string => {
  if (!value) return '';
  
  const {
    showFirstChars = 0,
    showLastChars = 0,
    maskChar = '*',
    preserveFormat = false
  } = options;

  // For very short strings, mask completely
  if (value.length <= 3) {
    return maskChar.repeat(value.length);
  }

  const totalShowChars = showFirstChars + showLastChars;
  
  // If we're showing more characters than the string length, mask completely
  if (totalShowChars >= value.length) {
    return maskChar.repeat(value.length);
  }

  const firstPart = value.substring(0, showFirstChars);
  const lastPart = showLastChars > 0 ? value.substring(value.length - showLastChars) : '';
  const middleLength = value.length - totalShowChars;
  
  let masked = firstPart + maskChar.repeat(middleLength) + lastPart;
  
  // Preserve format for emails and other structured data
  if (preserveFormat && value.includes('@')) {
    const [localPart, domain] = value.split('@');
    const maskedLocal = maskData(localPart, { ...options, preserveFormat: false });
    const maskedDomain = domain.split('.').map((part, index, arr) => {
      // Don't mask the last part (TLD)
      if (index === arr.length - 1) return part;
      return part.length > 3 ? part.substring(0, 1) + maskChar.repeat(part.length - 1) : part;
    }).join('.');
    masked = maskedLocal + '@' + maskedDomain;
  }
  
  return masked;
};

/**
 * Masks email addresses
 */
export const maskEmail = (email: string | null | undefined): string => {
  return maskData(email, DEFAULT_MASKING_CONFIG.email);
};

/**
 * Masks phone numbers
 */
export const maskPhone = (phone: string | null | undefined): string => {
  return maskData(phone, DEFAULT_MASKING_CONFIG.phone);
};

/**
 * Masks names
 */
export const maskName = (name: string | null | undefined): string => {
  return maskData(name, DEFAULT_MASKING_CONFIG.name);
};

/**
 * Masks IP addresses
 */
export const maskIpAddress = (ip: string | null | undefined): string => {
  return maskData(ip, DEFAULT_MASKING_CONFIG.ip);
};

/**
 * Masks user IDs and sensitive identifiers
 */
export const maskId = (id: string | null | undefined): string => {
  return maskData(id, DEFAULT_MASKING_CONFIG.id);
};

/**
 * Determines if a user has permission to view unmasked data
 */
export const canViewUnmaskedData = (
  userRole: string | undefined,
  dataClassification: DataClassification
): boolean => {
  const rolePermissions = {
    super_admin: ['public', 'restricted', 'confidential', 'secret'],
    admin: ['public', 'restricted', 'confidential'],
    editor: ['public', 'restricted'],
    moderator: ['public'],
    user: ['public']
  };

  const allowedClassifications = rolePermissions[userRole as keyof typeof rolePermissions] || ['public'];
  return allowedClassifications.includes(dataClassification);
};

/**
 * Conditionally masks data based on user permissions
 */
export const conditionalMask = (
  value: string | null | undefined,
  classification: DataClassification,
  userRole: string | undefined,
  options?: Partial<MaskingOptions>
): string => {
  if (canViewUnmaskedData(userRole, classification)) {
    return value || '';
  }
  
  const maskingOptions: MaskingOptions = {
    classification,
    ...DEFAULT_MASKING_CONFIG[classification as keyof FieldMaskingConfig] || {},
    ...options
  };
  
  return maskData(value, maskingOptions);
};

/**
 * Masks an entire user object based on permissions
 */
export const maskUserData = (user: any, viewerRole: string | undefined) => {
  if (!user) return null;

  return {
    ...user,
    email: conditionalMask(user.email, 'restricted', viewerRole),
    display_email: conditionalMask(user.display_email, 'restricted', viewerRole),
    phone: conditionalMask(user.phone, 'confidential', viewerRole),
    first_name: conditionalMask(user.first_name, 'restricted', viewerRole),
    last_name: conditionalMask(user.last_name, 'restricted', viewerRole),
    full_name: conditionalMask(user.full_name, 'restricted', viewerRole),
    address: conditionalMask(user.address, 'confidential', viewerRole),
    ip_address: conditionalMask(user.ip_address, 'confidential', viewerRole),
    user_agent: conditionalMask(user.user_agent, 'confidential', viewerRole),
    // IDs are shown but partially masked for traceability
    id: conditionalMask(user.id, 'confidential', viewerRole),
    whop_user_id: conditionalMask(user.whop_user_id, 'confidential', viewerRole),
  };
};

/**
 * Logs data access for audit trail
 */
export const logDataAccess = (
  action: string,
  dataType: string,
  classification: DataClassification,
  userRole: string | undefined,
  userEmail: string | undefined,
  recordId?: string
) => {
  logger.secureLog('info', 'Data access logged', {
    action,
    dataType,
    classification,
    userRole,
    userEmail: maskEmail(userEmail),
    recordId: recordId ? maskId(recordId) : undefined,
    timestamp: new Date().toISOString(),
    wasUnmasked: canViewUnmaskedData(userRole, classification)
  });
};