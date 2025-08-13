
import {
  BarChart3,
  FileText,
  Search,
  Activity,
  DollarSign,
  Zap,
  Bot,
  Shield,
  Mail,
  Video,
  GraduationCap,
  TrendingUp,
  MessageCircle,
  BookText,
  Settings,
  Bell,
  Users,
  MessageSquare,
  Brain,
} from 'lucide-react';
import { LucideIcon } from 'lucide-react';

export type MenuItem = {
  label: string;
  path: string;
  icon: LucideIcon;
};

export const getMenuItemsBySection = (section: string) => {
  const menuItems = {
    main: [
      { label: 'Overview', path: '/admin', icon: BarChart3 },
    ],
    analyst_main: [
      { label: 'Overview', path: '/admin', icon: BarChart3 },
    ],
    content: [
      { label: 'Newsletters', path: '/admin/newsletters', icon: Mail },
      { label: 'Videos', path: '/admin/videos', icon: Video },
      { label: 'Courses', path: '/admin/courses', icon: GraduationCap },
      { label: 'Articles', path: '/admin/articles', icon: FileText },
      { label: 'Trading Signals', path: '/admin/trading-signals', icon: TrendingUp },
      { label: 'Live Alerts', path: '/admin/live-alerts', icon: Zap },
      { label: 'Manage Signals', path: '/admin/manage-signals', icon: BarChart3 },
    ],
    analyst_signals: [
      { label: 'Trading Signals', path: '/admin/trading-signals', icon: TrendingUp },
      { label: 'Live Alerts', path: '/admin/live-alerts', icon: Zap },
    ],
    operations: [
      { label: 'Pattern Detection', path: '/admin/analyst-detection', icon: Brain },
      { label: 'Branding & SEO', path: '/admin/branding', icon: Search },
      { label: 'SEO Management', path: '/admin/seo', icon: Search },
      { label: 'Content SEO', path: '/admin/content-seo', icon: Search },
      { label: 'Traffic Management', path: '/admin/traffic', icon: Activity },
      { label: 'Realtime Monitor', path: '/admin/realtime-monitor', icon: Activity },
      { label: 'Database Performance', path: '/admin/database-performance', icon: Activity },
    ],
    ai_sentiment: [
      { label: 'Sentiment Analytics', path: '/admin/sentiment-analytics', icon: Brain },
      { label: 'X Monitoring', path: '/admin/x-monitoring', icon: MessageSquare },
      { label: 'X Sentiment Management', path: '/admin/x-sentiment-management', icon: Brain },
      { label: 'Telegram Monitoring', path: '/admin/telegram-monitoring', icon: Zap },
      { label: 'OpenAI Settings', path: '/admin/openai-settings', icon: Brain },
    ],
    chat_highlights: [
      { label: 'Highlight Rules', path: '/admin/chat-highlights-config', icon: MessageCircle },
      { label: 'Topic Management', path: '/admin/telegram-topics', icon: MessageCircle },
    ],
    integrations: [
      { label: 'Telegram', path: '/admin/telegram', icon: Zap },
    ],
    system: [
      { label: 'Feedback Management', path: '/admin/feedback', icon: MessageSquare },
      { label: 'Role Permissions', path: '/admin/role-permissions', icon: Shield },
      { label: 'Security Management', path: '/admin/security', icon: Shield },
      { label: 'Notification Templates', path: '/admin/notification-templates', icon: Bell },
      { label: 'Email Templates', path: '/admin/email-templates', icon: Mail },
      { label: 'Admin Settings', path: '/admin/settings', icon: Shield },
    ],
  };

  return menuItems[section as keyof typeof menuItems] || [];
};

export const getAllMenuItems = (): MenuItem[] => {
  const sections = ['main', 'content', 'operations', 'ai_sentiment', 'chat_highlights', 'integrations', 'system'];
  return sections.flatMap(section => getMenuItemsBySection(section));
};
