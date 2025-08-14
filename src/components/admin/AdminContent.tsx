
import React, { Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { AddLocalUserForm } from './forms/AddLocalUserForm';
import { EditAdminForm } from './forms/EditAdminForm';

import { RolePermissionsManagement } from './sections/RolePermissionsManagement';
import { OptimizedAdminOverview } from './sections/OptimizedAdminOverview';
import { NewsletterManagement } from './sections/NewsletterManagement';
import { VideoManagement } from './sections/VideoManagement';
import { CourseManagement } from './sections/CourseManagement';
import { ArticleManagement } from './sections/ArticleManagement';
import { AdminSettings } from './sections/AdminSettings';
import { EnhancedSEOManagement } from './sections/EnhancedSEOManagement';
import { TrafficManagement } from './sections/TrafficManagement';
import { ContentSEO } from './sections/ContentSEO';
import { SecurityManagement } from './sections/SecurityManagement';
import { DatabasePerformance } from './sections/DatabasePerformance';
import { RealtimeMonitor } from './sections/RealtimeMonitor';
import { AdminTelegramControls } from '@/components/dashboard/AdminTelegramControls';
import { TelegramTopicManagement } from './sections/TelegramTopicManagement';
import { ChatHighlightsConfig } from './sections/ChatHighlightsConfig';
// BeehiIV and Whop components removed - simplified system
import { Loader2 } from 'lucide-react';
import { SignalGenerator } from './sections/SignalGenerator';
import { ManageSignals } from './sections/ManageSignals';
import { DegenCallManagement } from './sections/DegenCallManagement';
import { NotificationTemplates } from './sections/NotificationTemplates';
import { EmailTemplateManager } from './sections/EmailTemplateManager';
import { FeedbackManagement } from './sections/FeedbackManagement';
import { AnalystCallManagement } from './sections/AnalystCallManagement';
import { LiveAlertsManagement } from './sections/LiveAlertsManagement';
import { XMonitoringDashboard } from './sections/XMonitoringDashboard';
import { TelegramMonitoring } from './sections/TelegramMonitoring';
import { OpenAISettings } from './sections/OpenAISettings';
import { SentimentAnalytics } from './sections/SentimentAnalytics';
import { XSentimentManagement } from './sections/XSentimentManagement';
// TwoFactorSetup removed
import { DataSecurityDashboard } from './security';
import { BrandingManagement } from './sections/BrandingManagement';
import { AnalystOverview } from './sections/AnalystOverview';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface AdminUser {
  id: string;
  role: string;
  permissions: any;
  is_active: boolean;
}

interface Subscriber {
  id: string;
  email: string;
  status: string;
  subscription_tier: 'free' | 'paid' | 'premium';
  created_at: string;
  updated_at: string;
}

interface AdminContentProps {
  adminUser: AdminUser;
  subscriber: Subscriber;
}

const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-[400px]">
    <div className="flex flex-col items-center space-y-4">
      <Loader2 className="h-6 w-6 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground">Loading section...</p>
    </div>
  </div>
);

// Placeholder component for enterprise features
import { WhopIntegrationManagement } from './WhopIntegrationManagement';
const ComingSoonPlaceholder = ({ title, description }: { title: string; description: string }) => (
  <div className="p-8 space-y-6 min-h-screen">
    <div className="text-center max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-white mb-4">{title}</h1>
      <p className="text-slate-400 mb-8">{description}</p>
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-8">
        <p className="text-slate-500">This enterprise-level feature is being developed for the CNBC launch.</p>
        <p className="text-sm text-slate-600 mt-2">Coming soon with advanced analytics and automation capabilities.</p>
      </div>
    </div>
  </div>
);

// Full-screen admin user editing component
const EditAdminUserView = () => {
  const { adminId } = useParams<{ adminId: string }>();
  const navigate = useNavigate();
  
  const { data: admin, isLoading } = useQuery({
    queryKey: ['admin-user', adminId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('admin_users')
        .select('*')
        .eq('id', adminId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!adminId
  });

  if (isLoading) {
    return (
      <div className="flex-1 w-full overflow-auto bg-slate-950 text-white p-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <LoadingFallback />
        </div>
      </div>
    );
  }

  if (!admin) {
    return (
      <div className="flex-1 w-full overflow-auto bg-slate-950 text-white p-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Admin User Not Found</h1>
          <p className="text-slate-400 mb-8">The requested admin user could not be found.</p>
          <button 
            onClick={() => navigate('/admin/settings')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
          >
            Back to Settings
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 w-full overflow-auto bg-slate-950 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <EditAdminForm 
          admin={admin}
          onCancel={() => navigate('/admin/settings')}
          onSuccess={() => navigate('/admin/settings')}
        />
      </div>
    </div>
  );
};

export function AdminContent({ adminUser, subscriber }: AdminContentProps) {
  const isAnalyst = adminUser.role === 'analyst';
  
  if (isAnalyst) {
    // Analyst-specific routes with restricted access
    return (
      <div className="flex-1 w-full overflow-auto bg-slate-950 text-white">
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            <Route path="/" element={<AnalystOverview adminUser={adminUser} />} />
            <Route path="/trading-signals" element={<SignalGenerator />} />
            <Route path="/live-alerts" element={<LiveAlertsManagement />} />
            {/* Redirect all other paths to overview for analysts */}
            <Route path="*" element={<AnalystOverview adminUser={adminUser} />} />
          </Routes>
        </Suspense>
      </div>
    );
  }

  // Full admin routes
  return (
    <div className="flex-1 w-full overflow-auto bg-slate-950 text-white">
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          <Route path="/" element={<OptimizedAdminOverview adminUser={adminUser} />} />
          
          {/* Content Management */}
          <Route path="/newsletters" element={<NewsletterManagement />} />
          <Route path="/videos" element={<VideoManagement />} />
          <Route path="/courses" element={<CourseManagement />} />
          <Route path="/articles" element={<ArticleManagement />} />
          <Route path="/trading-signals" element={<SignalGenerator />} />
          <Route path="/live-alerts" element={<LiveAlertsManagement />} />
          <Route path="/manage-signals" element={<ManageSignals />} />
          <Route path="/content-seo" element={<ContentSEO />} />
          <Route path="/chat-highlights-config" element={<ChatHighlightsConfig />} />
          
          {/* SEO & Growth */}
          <Route path="/branding" element={<BrandingManagement />} />
          <Route path="/seo" element={<EnhancedSEOManagement />} />
          <Route path="/traffic" element={<TrafficManagement />} />
          <Route path="/ab-testing" element={<ComingSoonPlaceholder title="A/B Testing Suite" description="Enterprise split testing for maximum conversion optimization" />} />
          
          {/* Performance & Monitoring */}
          <Route path="/realtime-monitor" element={<RealtimeMonitor />} />
          <Route path="/database-performance" element={<DatabasePerformance />} />
          <Route path="/server-monitoring" element={<ComingSoonPlaceholder title="Server Monitoring" description="Real-time infrastructure monitoring and alerting" />} />
          <Route path="/cdn-analytics" element={<ComingSoonPlaceholder title="CDN Analytics" description="Global content delivery performance insights" />} />
          <Route path="/logs" element={<ComingSoonPlaceholder title="Log Analysis" description="Advanced log aggregation and analysis platform" />} />
          
          {/* Business Intelligence */}
          <Route path="/funnels" element={<ComingSoonPlaceholder title="Conversion Funnels" description="Advanced funnel analysis and optimization" />} />
          <Route path="/customer-insights" element={<ComingSoonPlaceholder title="Customer Insights" description="AI-powered customer behavior analysis" />} />
          
          {/* Integrations */}
          <Route path="/whop-integration" element={<WhopIntegrationManagement />} />
          <Route path="/telegram" element={<AdminTelegramControls subscriber={subscriber} />} />
          <Route path="/telegram-topics" element={<TelegramTopicManagement />} />
          <Route path="/x-monitoring" element={<XMonitoringDashboard />} />
          <Route path="/degen-calls" element={<DegenCallManagement />} />
          <Route path="/analyst-detection" element={<AnalystCallManagement />} />
          <Route path="/webhooks" element={<ComingSoonPlaceholder title="Webhook Management" description="Enterprise webhook orchestration and monitoring" />} />
          <Route path="/api-management" element={<ComingSoonPlaceholder title="API Management" description="Advanced API rate limiting, analytics, and security" />} />
          
          {/* Automation */}
          <Route path="/alerts" element={<ComingSoonPlaceholder title="Alert Management" description="Intelligent alerting and escalation system" />} />
          <Route path="/scheduled-tasks" element={<ComingSoonPlaceholder title="Scheduled Tasks" description="Enterprise task scheduling and job management" />} />
          
          {/* AI Sentiment Analysis */}
          <Route path="/sentiment-analytics" element={<SentimentAnalytics />} />
          <Route path="/telegram-monitoring" element={<TelegramMonitoring />} />
          <Route path="/x-sentiment-management" element={<XSentimentManagement />} />
          <Route path="/openai-settings" element={<OpenAISettings />} />
          
          {/* System Administration */}
           <Route path="/security" element={<SecurityManagement />} />
           <Route path="/data-security" element={<DataSecurityDashboard />} />
           {/* 2FA setup removed */}
          
          <Route path="/feedback" element={<FeedbackManagement />} />
          <Route path="/role-permissions" element={<RolePermissionsManagement />} />
          <Route path="/notification-templates" element={<NotificationTemplates />} />
          <Route path="/email-templates" element={<EmailTemplateManager />} />
          <Route path="/audit-logs" element={<ComingSoonPlaceholder title="Audit Logs" description="Comprehensive audit trail and compliance reporting" />} />
          
          {adminUser.role === 'super_admin' && (
            <Route path="/settings" element={<AdminSettings />} />
          )}
          
          {/* Full-screen admin user editing */}
          <Route path="/edit-admin/:adminId" element={<EditAdminUserView />} />
          
          <Route path="*" element={<OptimizedAdminOverview adminUser={adminUser} />} />
        </Routes>
      </Suspense>
    </div>
  );
}
