
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { TierFilter } from '../types';
import { logger } from '@/utils/secureLogger';

interface UseUserQueriesProps {
  searchTerm: string;
  tierFilter: TierFilter;
  currentPage: number;
  itemsPerPage: number;
}

export function useUserQueries({ searchTerm, tierFilter, currentPage, itemsPerPage }: UseUserQueriesProps) {
  return useQuery({
    queryKey: ['admin-users-list', searchTerm, tierFilter, currentPage],
    queryFn: async () => {
      logger.info('Fetching ALL user types via edge function', { searchTerm, tierFilter, currentPage });
      
      try {
        // Call the edge function to get all users
        const { data: result, error } = await supabase.functions.invoke('list-all-users');
        
        if (error) {
          logger.error('Edge function error:', error);
          throw error;
        }

        if (!result.success) {
          logger.error('Edge function returned error:', result.error);
          throw new Error(result.error || 'Failed to fetch users');
        }

        let allUsers = result.users || [];
        logger.info('Total users received from edge function', { count: allUsers.length });
        logger.debug('Sample users', allUsers.slice(0, 3).map(u => ({ 
          email: u.email || u.display_email, 
          type: u.user_type 
        })));

        // Apply search filter
        if (searchTerm) {
          const beforeSearch = allUsers.length;
          allUsers = allUsers.filter(user => {
            const email = user.email || user.display_email || '';
            const matches = email.toLowerCase().includes(searchTerm.toLowerCase());
            if (searchTerm.toLowerCase() === 'pidgeon' && email.includes('pidgeon')) {
              logger.debug('Found pidgeon user', { email, type: user.user_type, matches });
            }
            return matches;
          });
          logger.info('Search filter applied', { searchTerm, before: beforeSearch, after: allUsers.length });
        }

        // Apply tier filter
        if (tierFilter !== 'all') {
          const beforeTier = allUsers.length;
          allUsers = allUsers.filter(user => user.subscription_tier === tierFilter);
          logger.info('Tier filter applied', { tierFilter, before: beforeTier, after: allUsers.length });
        }

        // Sort by created_at
        allUsers.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

        const totalCount = allUsers.length;
        
        // Apply pagination
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const paginatedUsers = allUsers.slice(startIndex, endIndex);
        
        logger.info('User query completed', { totalCount, dataLength: paginatedUsers.length });
        return { users: paginatedUsers, totalCount };

      } catch (error) {
        logger.error('Supabase function error details:', error);
        throw error;
      }
    },
    staleTime: 1000 * 30, // 30 seconds
  });
}
