
import { useState, useCallback } from 'react';
import { useUserManagement as useOriginalUserManagement } from '@/components/admin/sections/user-management/hooks/useUserManagement';

export function useUserManagement() {
  return useOriginalUserManagement();
}
