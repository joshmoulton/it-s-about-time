
export type TierFilter = 'all' | 'free' | 'paid' | 'premium';
export type StatusFilter = 'all' | 'active' | 'inactive';

export interface UserFilters {
  search: string;
  tier: TierFilter;
  status: StatusFilter;
}

export interface UserSort {
  field: string | null;
  direction: 'asc' | 'desc';
}

export interface UserStats {
  totalUsers: number;
  tierBreakdown: {
    free: number;
    paid: number;
    premium: number;
  };
  statusBreakdown: {
    active: number;
    inactive: number;
    other: number;
  };
  recentSignups: number;
}

export interface AdminUser {
  subscriber_id: string;
  role: string;
  is_active: boolean;
  beehiiv_subscribers?: {
    email: string;
  };
}
