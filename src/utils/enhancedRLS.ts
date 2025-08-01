// Enhanced RLS policy utilities for fine-grained access control
import { supabase } from '@/integrations/supabase/client';
import { logger } from './secureLogger';
import { maskEmail } from './dataMasking';

export interface AccessControlRule {
  resource: string;
  action: 'select' | 'insert' | 'update' | 'delete' | 'all';
  conditions: {
    userRole?: string[];
    dataClassification?: string;
    ownershipRequired?: boolean;
    timeRestrictions?: {
      allowedHours?: [number, number]; // [start, end] in 24h format
      allowedDays?: number[]; // 0-6, Sunday = 0
    };
    ipRestrictions?: string[];
    sessionRequirements?: {
      maxAge?: number; // in minutes
      requireElevated?: boolean;
    };
  };
}

export interface PolicyValidationResult {
  isAllowed: boolean;
  reason?: string;
  requiredActions?: string[];
}

class RLSPolicyManager {
  private static instance: RLSPolicyManager;
  private accessRules: Map<string, AccessControlRule[]> = new Map();

  static getInstance(): RLSPolicyManager {
    if (!RLSPolicyManager.instance) {
      RLSPolicyManager.instance = new RLSPolicyManager();
    }
    return RLSPolicyManager.instance;
  }

  /**
   * Register access control rules for a resource
   */
  registerAccessRules(resourceTable: string, rules: AccessControlRule[]): void {
    this.accessRules.set(resourceTable, rules);
    logger.info('Access rules registered', { resource: resourceTable, ruleCount: rules.length });
  }

  /**
   * Validate if a user can perform an action on a resource
   */
  async validateAccess(
    resourceTable: string,
    action: string,
    userEmail?: string,
    userRole?: string,
    metadata?: any
  ): Promise<PolicyValidationResult> {
    const rules = this.accessRules.get(resourceTable);
    
    if (!rules) {
      logger.warn('No access rules found for resource', { resource: resourceTable });
      return { isAllowed: false, reason: 'No access rules defined' };
    }

    // Find applicable rules for this action
    const applicableRules = rules.filter(rule => 
      rule.action === action || rule.action === 'all'
    );

    if (applicableRules.length === 0) {
      return { isAllowed: false, reason: `No rules for action: ${action}` };
    }

    // Validate each rule
    for (const rule of applicableRules) {
      const validation = await this.validateRule(rule, userEmail, userRole, metadata);
      
      if (!validation.isAllowed) {
        logger.warn('Access denied by rule', { 
          resource: resourceTable, 
          action, 
          userEmail: maskEmail(userEmail),
          reason: validation.reason 
        });
        return validation;
      }
    }

    logger.info('Access granted', { 
      resource: resourceTable, 
      action, 
      userEmail: maskEmail(userEmail) 
    });
    
    return { isAllowed: true };
  }

  /**
   * Validate a specific access rule
   */
  private async validateRule(
    rule: AccessControlRule,
    userEmail?: string,
    userRole?: string,
    metadata?: any
  ): Promise<PolicyValidationResult> {
    const { conditions } = rule;

    // Check user role requirements
    if (conditions.userRole && userRole) {
      if (!conditions.userRole.includes(userRole)) {
        return { 
          isAllowed: false, 
          reason: `Insufficient role. Required: ${conditions.userRole.join(' or ')}` 
        };
      }
    }

    // Check time restrictions
    if (conditions.timeRestrictions) {
      const now = new Date();
      const currentHour = now.getHours();
      const currentDay = now.getDay();

      if (conditions.timeRestrictions.allowedHours) {
        const [startHour, endHour] = conditions.timeRestrictions.allowedHours;
        if (currentHour < startHour || currentHour > endHour) {
          return { 
            isAllowed: false, 
            reason: `Access only allowed between ${startHour}:00 and ${endHour}:00` 
          };
        }
      }

      if (conditions.timeRestrictions.allowedDays) {
        if (!conditions.timeRestrictions.allowedDays.includes(currentDay)) {
          return { 
            isAllowed: false, 
            reason: 'Access not allowed on this day of the week' 
          };
        }
      }
    }

    // Check IP restrictions (if provided in metadata)
    if (conditions.ipRestrictions && metadata?.ipAddress) {
      const userIP = metadata.ipAddress;
      const isAllowedIP = conditions.ipRestrictions.some(allowedIP => {
        // Support CIDR notation or exact matches
        if (allowedIP.includes('/')) {
          // CIDR notation - would need CIDR library for proper validation
          return userIP.startsWith(allowedIP.split('/')[0]);
        }
        return userIP === allowedIP;
      });

      if (!isAllowedIP) {
        return { 
          isAllowed: false, 
          reason: 'Access not allowed from this IP address' 
        };
      }
    }

    // Check session requirements
    if (conditions.sessionRequirements && metadata?.sessionInfo) {
      const { maxAge, requireElevated } = conditions.sessionRequirements;
      const { sessionStartTime, isElevated } = metadata.sessionInfo;

      if (maxAge && sessionStartTime) {
        const sessionAge = (Date.now() - sessionStartTime) / (1000 * 60); // minutes
        if (sessionAge > maxAge) {
          return { 
            isAllowed: false, 
            reason: 'Session too old. Please re-authenticate.',
            requiredActions: ['reauthenticate'] 
          };
        }
      }

      if (requireElevated && !isElevated) {
        return { 
          isAllowed: false, 
          reason: 'Elevated permissions required.',
          requiredActions: ['elevate_permissions'] 
        };
      }
    }

    return { isAllowed: true };
  }

  /**
   * Generate RLS policy SQL for a rule
   */
  generatePolicySQL(tableName: string, rule: AccessControlRule): string {
    const policyName = `enhanced_${rule.action}_policy_${tableName}`;
    let conditions: string[] = [];

    // User role conditions
    if (rule.conditions.userRole) {
      const roleCheck = rule.conditions.userRole
        .map(role => `'${role}'`)
        .join(', ');
      conditions.push(`get_current_user_role() IN (${roleCheck})`);
    }

    // Ownership conditions
    if (rule.conditions.ownershipRequired) {
      conditions.push(`user_id = auth.uid()`);
    }

    // Time restrictions
    if (rule.conditions.timeRestrictions?.allowedHours) {
      const [start, end] = rule.conditions.timeRestrictions.allowedHours;
      conditions.push(`EXTRACT(HOUR FROM NOW()) BETWEEN ${start} AND ${end}`);
    }

    // Build the policy
    const conditionSQL = conditions.length > 0 ? conditions.join(' AND ') : 'true';
    
    return `
      CREATE POLICY "${policyName}"
      ON public.${tableName}
      FOR ${rule.action.toUpperCase()}
      USING (${conditionSQL});
    `;
  }

  /**
   * Audit policy access attempts
   */
  async auditPolicyAccess(
    tableName: string,
    action: string,
    allowed: boolean,
    userEmail?: string,
    reason?: string
  ): Promise<void> {
    try {
      await supabase.from('admin_audit_log').insert({
        action: 'policy_access',
        resource: tableName,
        user_email: userEmail || 'anonymous',
        metadata: {
          table_action: action,
          access_granted: allowed,
          denial_reason: reason,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      logger.error('Failed to audit policy access:', error);
    }
  }
}

// Global instance
export const rlsPolicyManager = RLSPolicyManager.getInstance();

// Define access rules for sensitive tables
rlsPolicyManager.registerAccessRules('beehiiv_subscribers', [
  {
    resource: 'beehiiv_subscribers',
    action: 'select',
    conditions: {
      userRole: ['admin', 'super_admin'],
      sessionRequirements: { maxAge: 30 }
    }
  },
  {
    resource: 'beehiiv_subscribers',
    action: 'update',
    conditions: {
      userRole: ['super_admin'],
      sessionRequirements: { maxAge: 15, requireElevated: true }
    }
  },
  {
    resource: 'beehiiv_subscribers',
    action: 'delete',
    conditions: {
      userRole: ['super_admin'],
      sessionRequirements: { maxAge: 10, requireElevated: true },
      timeRestrictions: { allowedHours: [9, 17] } // Business hours only
    }
  }
]);

rlsPolicyManager.registerAccessRules('admin_users', [
  {
    resource: 'admin_users',
    action: 'select',
    conditions: {
      userRole: ['admin', 'super_admin']
    }
  },
  {
    resource: 'admin_users',
    action: 'insert',
    conditions: {
      userRole: ['super_admin'],
      sessionRequirements: { requireElevated: true }
    }
  },
  {
    resource: 'admin_users',
    action: 'update',
    conditions: {
      userRole: ['super_admin'],
      sessionRequirements: { requireElevated: true }
    }
  },
  {
    resource: 'admin_users',
    action: 'delete',
    conditions: {
      userRole: ['super_admin'],
      sessionRequirements: { requireElevated: true },
      timeRestrictions: { allowedHours: [9, 17] }
    }
  }
]);

/**
 * Enhanced RLS policy helper for database functions
 */
export const enhancedRLSCheck = async (
  tableName: string,
  action: string,
  userEmail?: string,
  metadata?: any
): Promise<boolean> => {
  // Get user role from database
  let userRole: string | undefined;
  
  if (userEmail) {
    try {
      const { data } = await supabase
        .from('admin_users')
        .select('role')
        .eq('email', userEmail)
        .eq('is_active', true)
        .single();
      
      userRole = data?.role;
    } catch (error) {
      logger.error('Failed to get user role for RLS check:', error);
    }
  }

  const result = await rlsPolicyManager.validateAccess(
    tableName,
    action,
    userEmail,
    userRole,
    metadata
  );

  // Audit the access attempt
  await rlsPolicyManager.auditPolicyAccess(
    tableName,
    action,
    result.isAllowed,
    userEmail,
    result.reason
  );

  return result.isAllowed;
};