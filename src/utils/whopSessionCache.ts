interface WhopSessionData {
  user: {
    id: string;
    email: string;
    username?: string;
    has_whop_purchase: boolean;
  };
  access_token?: string;
  expires_at: number;
  auth_method: 'whop';
  cached_at: number;
}

interface WhopSessionCache {
  version: string;
  data: WhopSessionData;
}

const CACHE_VERSION = '1.0';
const CACHE_KEY = 'whop_session_cache';
const DEFAULT_CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

/**
 * Stores a successful Whop authentication in session cache
 */
export const storeWhopSession = (
  user: any, 
  access_token?: string, 
  customDuration?: number
): void => {
  try {
    const cacheDuration = customDuration || DEFAULT_CACHE_DURATION;
    const now = Date.now();
    
    const sessionData: WhopSessionData = {
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        has_whop_purchase: user.has_whop_purchase || false
      },
      access_token,
      expires_at: now + cacheDuration,
      auth_method: 'whop',
      cached_at: now
    };

    const cacheEntry: WhopSessionCache = {
      version: CACHE_VERSION,
      data: sessionData
    };

    sessionStorage.setItem(CACHE_KEY, JSON.stringify(cacheEntry));
    
    console.log('✅ Whop session cached for:', user.email, 'expires in:', Math.round(cacheDuration / (1000 * 60 * 60)), 'hours');
    
    // Also update the auth persistence data for compatibility
    const persistenceData = {
      auth_method: 'whop',
      user_email: user.email,
      cached_at: now,
      expires_at: now + cacheDuration
    };
    localStorage.setItem('auth_persistence_data', JSON.stringify(persistenceData));
    
  } catch (error) {
    console.error('❌ Failed to store Whop session cache:', error);
  }
};

/**
 * Retrieves a valid Whop session from cache
 */
export const getWhopSession = (): WhopSessionData | null => {
  try {
    const cached = sessionStorage.getItem(CACHE_KEY);
    if (!cached) {
      console.log('📭 No Whop session cache found');
      return null;
    }

    const cacheEntry: WhopSessionCache = JSON.parse(cached);
    
    // Check version compatibility
    if (cacheEntry.version !== CACHE_VERSION) {
      console.log('🔄 Whop session cache version mismatch, clearing...');
      clearWhopSession();
      return null;
    }

    const now = Date.now();
    const sessionData = cacheEntry.data;
    
    // Check if session has expired
    if (now > sessionData.expires_at) {
      console.log('⏰ Whop session cache expired, clearing...');
      clearWhopSession();
      return null;
    }

    const hoursRemaining = Math.round((sessionData.expires_at - now) / (1000 * 60 * 60));
    console.log('✅ Valid Whop session found for:', sessionData.user.email, 'expires in:', hoursRemaining, 'hours');
    
    return sessionData;
    
  } catch (error) {
    console.error('❌ Failed to retrieve Whop session cache:', error);
    clearWhopSession();
    return null;
  }
};

/**
 * Checks if user has a valid cached Whop session
 */
export const hasValidWhopSession = (): boolean => {
  return getWhopSession() !== null;
};

/**
 * Clears the Whop session cache
 */
export const clearWhopSession = (): void => {
  try {
    sessionStorage.removeItem(CACHE_KEY);
    
    // Also clear related localStorage items
    const persistenceData = localStorage.getItem('auth_persistence_data');
    if (persistenceData) {
      try {
        const parsed = JSON.parse(persistenceData);
        if (parsed.auth_method === 'whop') {
          localStorage.removeItem('auth_persistence_data');
          console.log('🧹 Cleared related Whop persistence data');
        }
      } catch (e) {
        // Ignore parsing errors
      }
    }
    
    console.log('🧹 Whop session cache cleared');
  } catch (error) {
    console.error('❌ Failed to clear Whop session cache:', error);
  }
};

/**
 * Gets session cache info for debugging
 */
export const getWhopSessionInfo = (): { 
  hasCachedSession: boolean; 
  expiresAt?: Date; 
  userEmail?: string; 
  hoursRemaining?: number;
} => {
  const session = getWhopSession();
  
  if (!session) {
    return { hasCachedSession: false };
  }

  const hoursRemaining = Math.round((session.expires_at - Date.now()) / (1000 * 60 * 60));
  
  return {
    hasCachedSession: true,
    expiresAt: new Date(session.expires_at),
    userEmail: session.user.email,
    hoursRemaining
  };
};

/**
 * Extends the current session cache by the specified duration
 */
export const extendWhopSession = (additionalHours: number = 24): boolean => {
  try {
    const session = getWhopSession();
    if (!session) {
      console.log('⚠️ No session to extend');
      return false;
    }

    const additionalMs = additionalHours * 60 * 60 * 1000;
    session.expires_at += additionalMs;
    
    const cacheEntry: WhopSessionCache = {
      version: CACHE_VERSION,
      data: session
    };

    sessionStorage.setItem(CACHE_KEY, JSON.stringify(cacheEntry));
    
    console.log('⏰ Whop session extended by', additionalHours, 'hours for:', session.user.email);
    return true;
    
  } catch (error) {
    console.error('❌ Failed to extend Whop session:', error);
    return false;
  }
};