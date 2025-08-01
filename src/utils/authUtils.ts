
// Legacy auth utilities - maintained for compatibility
// New applications should use unifiedAuthUtils.ts

import { UnifiedAuth } from './unifiedAuthUtils';

// Legacy wrapper for performLogin - redirects to unified auth
export const performLogin = async (email: string) => {
  console.log('🔄 LEGACY AUTH: Redirecting to unified auth for:', email);
  return await UnifiedAuth.performLogin(email);
};

// Legacy wrapper for performLogout - redirects to unified auth
export const performLogout = async () => {
  console.log('🔄 LEGACY AUTH: Redirecting to unified logout');
  await UnifiedAuth.performLogout();
};
