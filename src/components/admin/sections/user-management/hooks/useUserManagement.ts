
import { useUserQueries } from './useUserQueries';
import { useOptimizedUserStats } from './useOptimizedUserStats';
import { useAdminUsers } from './useAdminUsers';
import { useUserFilters } from './useUserFilters';

export function useUserManagement() {
  const itemsPerPage = 50;
  
  const {
    searchTerm,
    tierFilter,
    currentPage,
    handlePageChange,
    handleSearch,
    handleTierFilter
  } = useUserFilters();

  // Fetch users with pagination
  const { data: usersData, isLoading, error, refetch } = useUserQueries({
    searchTerm,
    tierFilter,
    currentPage,
    itemsPerPage
  });

  // Fetch user stats
  const { data: userStats } = useOptimizedUserStats();

  // Fetch admin users
  const { data: adminUsers } = useAdminUsers();

  const users = usersData?.users || [];
  const totalUsers = usersData?.totalCount || 0;
  const totalPages = Math.ceil(totalUsers / itemsPerPage);

  const getUserAdminRole = (userId: string) => {
    return adminUsers?.find(admin => admin.subscriber_id === userId)?.role;
  };

  return {
    users,
    userStats,
    adminUsers,
    isLoading,
    error,
    searchTerm,
    tierFilter,
    currentPage,
    totalUsers,
    totalPages,
    itemsPerPage,
    getUserAdminRole,
    handlePageChange,
    handleSearch,
    handleTierFilter,
    refetch
  };
}
