interface AdminUser {
  id: string;
  role: string;
  permissions: any;
  is_active: boolean;
}

export const isPremiumUser = (adminUser: AdminUser): boolean => {
  return adminUser.role === 'premium_user';
};

export const isAnalyst = (adminUser: AdminUser): boolean => {
  return adminUser.role === 'analyst';
};

export const isEditor = (adminUser: AdminUser): boolean => {
  return adminUser.role === 'editor';
};

export const isAdmin = (adminUser: AdminUser): boolean => {
  return adminUser.role === 'admin';
};

export const isSuperAdmin = (adminUser: AdminUser): boolean => {
  return adminUser.role === 'super_admin';
};

export const hasSignalAccess = (adminUser: AdminUser): boolean => {
  return isAnalyst(adminUser) || isAdmin(adminUser) || isSuperAdmin(adminUser);
};

export const hasContentAccess = (adminUser: AdminUser): boolean => {
  return isEditor(adminUser) || isAdmin(adminUser) || isSuperAdmin(adminUser);
};

export const hasPremiumAccess = (adminUser: AdminUser): boolean => {
  return isPremiumUser(adminUser) || isEditor(adminUser) || isAnalyst(adminUser) || isAdmin(adminUser) || isSuperAdmin(adminUser);
};

export const hasFullAdminAccess = (adminUser: AdminUser): boolean => {
  return isAdmin(adminUser) || isSuperAdmin(adminUser);
};

export const hasSystemAccess = (adminUser: AdminUser): boolean => {
  return isSuperAdmin(adminUser);
};

export const getAccessibleRoutes = (adminUser: AdminUser): string[] => {
  if (isPremiumUser(adminUser)) {
    return [
      '/admin',
      '/admin/analytics',
      '/admin/newsletters',
      '/admin/videos',
      '/admin/courses',
      '/admin/articles',
      '/admin/trading-signals'
    ];
  }
  
  if (isAnalyst(adminUser)) {
    return [
      '/admin',
      '/admin/trading-signals',
      '/admin/manage-signals',
      '/admin/sentiment-analytics'
    ];
  }
  
  if (isEditor(adminUser)) {
    return [
      '/admin',
      '/admin/analytics',
      '/admin/newsletters',
      '/admin/videos',
      '/admin/courses',
      '/admin/articles',
      '/admin/content-seo'
    ];
  }
  
  if (isAdmin(adminUser)) {
    return [
      '/admin',
      '/admin/analytics',
      '/admin/newsletters',
      '/admin/videos',
      '/admin/courses',
      '/admin/articles',
      '/admin/trading-signals',
      '/admin/manage-signals',
      '/admin/content-seo',
      '/admin/chat-highlights-config',
      '/admin/seo',
      '/admin/traffic',
      '/admin/realtime-monitor',
      '/admin/database-performance',
      '/admin/revenue',
      '/admin/whop',
      '/admin/telegram',
      '/admin/telegram-topics',
      '/admin/x-monitoring',
      '/admin/degen-calls',
      '/admin/analyst-call-management',
      '/admin/sentiment-analytics',
      '/admin/telegram-monitoring',
      '/admin/x-sentiment-management',
      '/admin/openai-settings',
      '/admin/security',
      '/admin/data-security',
      '/admin/2fa-setup',
      '/admin/feedback',
      '/admin/notification-templates',
      '/admin/email-templates'
    ];
  }
  
  if (isSuperAdmin(adminUser)) {
    // Super admins have access to all routes
    return ['*'];
  }
  
  return [];
};

export const canAccessRoute = (adminUser: AdminUser, route: string): boolean => {
  const accessibleRoutes = getAccessibleRoutes(adminUser);
  
  if (accessibleRoutes.includes('*')) {
    return true;
  }
  
  return accessibleRoutes.includes(route);
};