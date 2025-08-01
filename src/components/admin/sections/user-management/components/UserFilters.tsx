
import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UserFilters as UserFiltersType } from '../types';

interface UserFiltersProps {
  filters: UserFiltersType;
  onFiltersChange: (filters: Partial<UserFiltersType>) => void;
  resultsCount: number;
}

export function UserFilters({ filters, onFiltersChange, resultsCount }: UserFiltersProps) {
  const [searchInput, setSearchInput] = useState(filters.search);

  // Debounced search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchInput !== filters.search) {
        onFiltersChange({ search: searchInput });
      }
    }, 500); // 500ms delay

    return () => clearTimeout(timeoutId);
  }, [searchInput, filters.search, onFiltersChange]);

  // Update local state when filters change externally
  useEffect(() => {
    setSearchInput(filters.search);
  }, [filters.search]);

  return (
    <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between bg-slate-800/50 p-4 rounded-lg border border-slate-700">
      <div className="flex flex-col sm:flex-row gap-4 flex-1">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
          <Input
            placeholder="Search users..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-10 bg-slate-900 border-slate-600 text-white"
          />
        </div>
        
        <Select value={filters.tier} onValueChange={(value) => onFiltersChange({ tier: value as any })}>
          <SelectTrigger className="w-full sm:w-[140px] bg-slate-900 border-slate-600 text-white">
            <SelectValue placeholder="All Tiers" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Tiers</SelectItem>
            <SelectItem value="free">Free</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="premium">Premium</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filters.status} onValueChange={(value) => onFiltersChange({ status: value as any })}>
          <SelectTrigger className="w-full sm:w-[140px] bg-slate-900 border-slate-600 text-white">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="text-sm text-slate-400 whitespace-nowrap">
        {resultsCount.toLocaleString()} results
      </div>
    </div>
  );
}
