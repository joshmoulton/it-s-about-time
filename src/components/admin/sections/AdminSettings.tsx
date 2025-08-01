
import React from 'react';
import { ResponsiveAdminHeader } from '../ResponsiveAdminHeader';
import { AdminUsersSection } from './settings/AdminUsersSection';
import { SystemConfigurationSection } from './settings/SystemConfigurationSection';
import { ContentSettingsSection } from './settings/ContentSettingsSection';
import { EmailNotificationSection } from './settings/EmailNotificationSection';
import { DatabaseBackupSection } from './settings/DatabaseBackupSection';
// import { TierTestingSection } from './settings/TierTestingSection';
import { NewsletterBlacklistSection } from './settings/NewsletterBlacklistSection';

export function AdminSettings() {
  return (
    <div className="p-8 space-y-6">
      <ResponsiveAdminHeader 
        title="Admin Settings" 
        description="Configure system settings and admin access" 
      />


      {/* Tier Testing - Hidden */}
      {/* <TierTestingSection /> */}

      {/* Newsletter Blacklist */}
      <NewsletterBlacklistSection />

      {/* Admin Users Management */}
      <AdminUsersSection />

      {/* System Configuration */}
      <SystemConfigurationSection />

      {/* Content Settings */}
      <ContentSettingsSection />

      {/* Email & Notification Settings */}
      <EmailNotificationSection />

      {/* Database & Backup */}
      <DatabaseBackupSection />
    </div>
  );
}
