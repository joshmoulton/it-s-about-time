
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { UserFilters, UserSort } from '../types';

export function useUnlimitedUserManagement(
  filters: UserFilters,
  sorting: UserSort,
  currentPage: number,
  itemsPerPage: number
) {
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

  // Get stats from available secure tables
  const { data: secureStats, isLoading: statsLoading } = useQuery({
    queryKey: ['secure-user-stats'],
    queryFn: async () => {
      console.log('👥 Fetching secure user statistics...');
      
      // Get counts from available tables
      const [adminResult, whopResult] = await Promise.allSettled([
        supabase.from('admin_users').select('*', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('whop_authenticated_users').select('*', { count: 'exact', head: true })
      ]);

      const getCount = (result: PromiseSettledResult<any>) => {
        if (result.status === 'fulfilled' && result.value.count !== null) {
          return result.value.count;
        }
        return 0;
      };

      const adminUsers = getCount(adminResult);
      const whopUsers = getCount(whopResult);
      const totalUsers = adminUsers + whopUsers;

      const stats = {
        totalUsers,
        tierBreakdown: {
          free: 0, // Not tracked in secure system
          paid: 0, // Not tracked in secure system
          premium: whopUsers // Approximate
        },
        statusBreakdown: {
          active: adminUsers,
          inactive: 0,
          other: whopUsers
        },
        recentSignups: 0 // Not tracked in secure system
      };

      console.log('👥 Calculated secure user stats:', stats);
      return stats;
    },
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false
  });

  // Get paginated users from available tables
  const { data: paginatedData, isLoading: usersLoading, refetch } = useQuery({
    queryKey: ['paginated-secure-users', filters, sorting, currentPage, itemsPerPage],
    queryFn: async () => {
      console.log('👥 Fetching paginated secure user data...');
      
      // In secure system, we only show admin users and whop users
      const [adminUsers, whopUsers] = await Promise.allSettled([
        supabase.from('admin_users').select('*').eq('is_active', true),
        supabase.from('whop_authenticated_users').select('*')
      ]);

      const allUsers: any[] = [];
      let totalCount = 0;

      if (adminUsers.status === 'fulfilled' && adminUsers.value.data) {
        adminUsers.value.data.forEach(user => {
          allUsers.push({
            id: `admin-${user.email}`,
            email: user.email,
            display_email: user.email,
            subscription_tier: 'admin',
            status: user.is_active ? 'active' : 'inactive',
            created_at: user.created_at,
            admin_type: 'admin_user',
            role: user.role
          });
        });
        totalCount += adminUsers.value.data.length;
      }

      if (whopUsers.status === 'fulfilled' && whopUsers.value.data) {
        whopUsers.value.data.forEach(user => {
          allUsers.push({
            id: `whop-${user.user_email}`,
            email: user.user_email,
            display_email: user.user_email,
            subscription_tier: user.subscription_tier,
            status: 'active',
            created_at: user.created_at,
            admin_type: 'whop_user'
          });
        });
        totalCount += whopUsers.value.data.length;
      }

      // Apply filters
      let filteredUsers = allUsers;
      
      if (filters.tier !== 'all') {
        filteredUsers = filteredUsers.filter(user => user.subscription_tier === filters.tier);
      }
      
      if (filters.status !== 'all') {
        filteredUsers = filteredUsers.filter(user => user.status === filters.status);
      }
      
      if (filters.search) {
        filteredUsers = filteredUsers.filter(user => 
          user.email.toLowerCase().includes(filters.search.toLowerCase())
        );
      }

      // Apply sorting
      if (sorting.field) {
        filteredUsers.sort((a, b) => {
          const aValue = a[sorting.field] || '';
          const bValue = b[sorting.field] || '';
          if (sorting.direction === 'asc') {
            return aValue.toString().localeCompare(bValue.toString());
          }
          return bValue.toString().localeCompare(aValue.toString());
        });
      } else {
        filteredUsers.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      }

      // Apply pagination
      const from = (currentPage - 1) * itemsPerPage;
      const to = from + itemsPerPage;
      const paginatedUsers = filteredUsers.slice(from, to);

      return {
        users: paginatedUsers,
        filteredCount: filteredUsers.length
      };
    },
    staleTime: 1000 * 30
  });

  const toggleUserSelection = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const selectAllUsers = () => {
    const allIds = paginatedData?.users.map(user => user.id) || [];
    setSelectedUsers(allIds);
  };

  const deselectAllUsers = () => {
    setSelectedUsers([]);
  };

  return {
    // Secure stats from available data
    stats: secureStats,
    statsLoading,
    
    // Paginated data for display
    users: paginatedData?.users || [],
    filteredCount: paginatedData?.filteredCount || 0,
    usersLoading,
    
    // Selection
    selectedUsers,
    toggleUserSelection,
    selectAllUsers,
    deselectAllUsers,
    
    // Actions
    refetch
  };
}
