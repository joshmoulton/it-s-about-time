// Enhanced audit logging utilities
import { supabase } from '@/integrations/supabase/client';

export interface SecurityEvent {
  eventType: string;
  adminEmail: string;
  success: boolean;
  ipAddress?: string;
  userAgent?: string;
  eventDetails?: Record<string, any>;
  riskLevel?: 'low' | 'medium' | 'high' | 'critical';
}

export interface AuditLogEntry {
  action: string;
  resource: string;
  resourceId?: string;
  userEmail: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Enhanced security event logging with risk assessment
 */
export const logSecurityEventEnhanced = async (event: SecurityEvent): Promise<void> => {
  try {
    // Determine risk level if not provided
    const riskLevel = event.riskLevel || assessRiskLevel(event);
    
    const { error } = await supabase
      .from('admin_security_events')
      .insert({
        event_type: event.eventType,
        admin_email: event.adminEmail,
        success: event.success,
        ip_address: event.ipAddress,
        user_agent: event.userAgent,
        event_details: {
          ...event.eventDetails,
          risk_level: riskLevel,
          timestamp: new Date().toISOString()
        }
      });
    
    if (error) {
      console.error('Failed to log security event:', error);
    }
    
    // For critical events, also log to admin audit log
    if (riskLevel === 'critical') {
      await logAuditEventEnhanced({
        action: 'security_alert',
        resource: 'security_events',
        userEmail: event.adminEmail,
        metadata: {
          event_type: event.eventType,
          risk_level: riskLevel,
          details: event.eventDetails
        },
        ipAddress: event.ipAddress,
        userAgent: event.userAgent
      });
    }
  } catch (error) {
    console.error('Security event logging failed:', error);
  }
};

/**
 * Enhanced audit logging with metadata enrichment
 */
export const logAuditEventEnhanced = async (entry: AuditLogEntry): Promise<void> => {
  try {
    const enrichedMetadata = {
      ...entry.metadata,
      timestamp: new Date().toISOString(),
      user_agent: entry.userAgent,
      ip_address: entry.ipAddress,
      session_info: {
        source: detectUserSource(entry.userAgent),
        is_mobile: isMobileUserAgent(entry.userAgent)
      }
    };
    
    const { error } = await supabase
      .from('admin_audit_log')
      .insert({
        action: entry.action,
        resource: entry.resource,
        resource_id: entry.resourceId,
        user_email: entry.userEmail,
        metadata: enrichedMetadata,
        ip_address: entry.ipAddress,
        user_agent: entry.userAgent
      });
    
    if (error) {
      console.error('Failed to log audit event:', error);
    }
  } catch (error) {
    console.error('Audit logging failed:', error);
  }
};

/**
 * Assess risk level based on event characteristics
 */
const assessRiskLevel = (event: SecurityEvent): 'low' | 'medium' | 'high' | 'critical' => {
  const { eventType, success, eventDetails } = event;
  
  // Critical events
  if (!success && ['admin_login', 'password_change', 'data_access'].includes(eventType)) {
    return 'critical';
  }
  
  if (eventType === 'suspicious_activity' || eventType === 'rate_limit_exceeded') {
    return 'high';
  }
  
  // Failed login attempts
  if (eventType === 'login_attempt' && !success) {
    const attemptCount = eventDetails?.attempt_count || 1;
    if (attemptCount > 5) return 'high';
    if (attemptCount > 3) return 'medium';
    return 'low';
  }
  
  // Data access events
  if (eventType.includes('data_access') || eventType.includes('export')) {
    return 'medium';
  }
  
  return 'low';
};

/**
 * Detect user source from user agent
 */
const detectUserSource = (userAgent?: string): string => {
  if (!userAgent) return 'unknown';
  
  if (userAgent.includes('Mobile')) return 'mobile';
  if (userAgent.includes('Tablet')) return 'tablet';
  if (userAgent.includes('Chrome')) return 'chrome';
  if (userAgent.includes('Firefox')) return 'firefox';
  if (userAgent.includes('Safari')) return 'safari';
  if (userAgent.includes('Edge')) return 'edge';
  
  return 'desktop';
};

/**
 * Check if user agent indicates mobile device
 */
const isMobileUserAgent = (userAgent?: string): boolean => {
  if (!userAgent) return false;
  
  const mobilePatterns = [
    /Android/i,
    /iPhone/i,
    /iPad/i,
    /iPod/i,
    /BlackBerry/i,
    /Windows Phone/i,
    /Mobile/i
  ];
  
  return mobilePatterns.some(pattern => pattern.test(userAgent));
};

/**
 * Create security context for logging
 */
export const createSecurityContext = (request?: Request) => {
  const headers = request?.headers;
  
  return {
    ipAddress: headers?.get('x-forwarded-for') || 
               headers?.get('x-real-ip') || 
               'unknown',
    userAgent: headers?.get('user-agent') || 'unknown',
    timestamp: new Date().toISOString()
  };
};

/**
 * Log data access with privacy considerations
 */
export const logDataAccess = async (
  operation: string,
  resourceType: string,
  resourceId?: string,
  userEmail?: string,
  context?: any
): Promise<void> => {
  try {
    const { error } = await supabase
      .from('data_access_logs')
      .insert({
        action_type: operation,
        resource_type: resourceType,
        resource_id: resourceId,
        admin_email: userEmail,
        ip_address: context?.ipAddress,
        user_agent: context?.userAgent,
        access_granted: true, // Assume granted if we're logging it
        risk_score: 0.1, // Low risk for successful operations
        geo_location: context?.geoLocation || null,
        device_fingerprint: context?.deviceFingerprint
      });
    
    if (error) {
      console.error('Failed to log data access:', error);
    }
  } catch (error) {
    console.error('Data access logging failed:', error);
  }
};