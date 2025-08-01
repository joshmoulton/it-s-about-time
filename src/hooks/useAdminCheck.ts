import { useAdminStatus } from '@/hooks/useAdminStatus';

export const useAdminCheck = () => {
  const { isAdmin, isLoading } = useAdminStatus();
  return { isAdmin, isLoading };
};