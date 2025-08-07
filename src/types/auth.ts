
export interface Subscriber {
  id: string;
  email: string;
  status: string;
  subscription_tier: 'free' | 'paid' | 'premium';
  created_at: string;
  updated_at: string;
  metadata?: any;
}

export interface CurrentUser {
  id: string;
  email: string;
  subscription_tier: 'free' | 'paid' | 'premium';
  user_type: 'supabase_admin' | 'supabase_user' | 'whop_admin' | 'whop_user' | 'unified_user';
  status?: string;
  created_at?: string;
  updated_at?: string;
  metadata?: any;
}

export interface AuthContextType {
  subscriber: Subscriber | null;
  currentUser: CurrentUser | null;
  isLoading: boolean;
  login: (email: string) => Promise<{ success: boolean; error?: string; requiresPasswordSetup?: boolean; userTier?: string }>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  setAuthenticatedUser?: (user: any, authMethod: string) => void; // Add this for enhanced auth
  refreshCurrentUser?: () => Promise<void>;
}
