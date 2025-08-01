
import { useState, useCallback } from 'react';
import type { TierFilter } from '../types';

export function useUserFilters() {
  const [searchTerm, setSearchTerm] = useState('');
  const [tierFilter, setTierFilter] = useState<TierFilter>('all');
  const [currentPage, setCurrentPage] = useState(1);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Debounced search function
  const handleSearch = useCallback((value: string) => {
    setSearchTerm(value);
    setCurrentPage(1); // Reset to first page when searching
  }, []);

  const handleTierFilter = (value: string) => {
    setTierFilter(value as TierFilter);
    setCurrentPage(1); // Reset to first page when filtering
  };

  return {
    searchTerm,
    tierFilter,
    currentPage,
    handlePageChange,
    handleSearch,
    handleTierFilter
  };
}
