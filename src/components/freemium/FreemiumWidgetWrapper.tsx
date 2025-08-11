
import React from 'react';
import { FreemiumGradientOverlay } from './FreemiumGradientOverlay';
import { UpgradeModal } from './UpgradeModal';
import { useEnhancedAuth } from '@/contexts/EnhancedAuthContext';
import { TierAccessManager } from '@/utils/tierAccess';
import { useState } from 'react';
import { Mail, Bell, TrendingUp, MessageCircle, BarChart3, Zap, AlertTriangle } from 'lucide-react';
import { useAdminCheck } from '@/hooks/useAdminCheck';

interface FreemiumWidgetWrapperProps {
  children: React.ReactNode;
  featureName?: string;
  showTeaserStats?: boolean;
  teaserStats?: {
    activeAlerts?: number;
    activeTrades?: number;
    awaitingEntry?: number;
    avgDailyPnL?: string;
  };
  className?: string;
  gradientTheme?: 'blue' | 'teal' | 'orange' | 'green' | 'purple' | 'indigo';
  widgetType?: string;
}

const getWidgetHeader = (widgetType?: string) => {
  switch (widgetType) {
    case 'newsletter':
      return {
        title: 'Weekly Newsletter',
        icon: Mail,
        description: 'Market insights & analysis'
      };
    case 'alerts':
      return {
        title: 'Live Trading Alerts',
        icon: Bell,
        description: 'Real-time market opportunities'
      };
    case 'trading_signals':
      return {
        title: 'Recent Winning Calls',
        icon: TrendingUp,
        description: 'Verified trading results'
      };
    case 'analytics':
      return {
        title: 'Performance Analytics',
        icon: BarChart3,
        description: '12-month growth tracking'
      };
    case 'chat':
      return {
        title: 'Community Chat',
        icon: MessageCircle,
        description: 'Live trading discussions'
      };
    case 'chat-highlights':
      return {
        title: 'Chat Highlights',
        icon: Zap,
        description: 'Key insights & analysis'
      };
    case 'sentiment':
      return {
        title: 'AI Sentiment Analysis',
        icon: BarChart3,
        description: 'Market sentiment tracking'
      };
    case 'edge':
      return {
        title: 'Watch The Edge',
        icon: TrendingUp,
        description: 'Weekly video analysis'
      };
    case 'degen-calls':
      return {
        title: 'Degen Call Alerts',
        icon: AlertTriangle,
        description: 'High-risk opportunities'
      };
    default:
      return {
        title: 'Premium Feature',
        icon: TrendingUp,
        description: 'Upgrade to unlock'
      };
  }
};

const getWidgetMockContent = (widgetType?: string) => {
  switch (widgetType) {
    case 'edge':
      return {
        showTeaserStats: false,
        mockData: {
          features: [
            'Weekly deep-dive market analysis',
            'Expert trading insights & strategies',
            'Technical analysis tutorials',
            'Market outlook & predictions'
          ],
          highlight: 'New episodes every Wednesday'
        }
      };
    case 'degen-calls':
      return {
        showTeaserStats: false,
        mockData: {
          features: [
            'High-conviction moonshot calls',
            'Early altcoin opportunities',
            'Leverage & options strategies',
            'Risk/reward calculations'
          ],
          highlight: 'For experienced risk-takers only'
        }
      };
    case 'alerts':
      return {
        showTeaserStats: true,
        teaserStats: {
          activeAlerts: 12,
          activeTrades: 7,
          awaitingEntry: 5,
          avgDailyPnL: '$2,847'
        }
      };
    case 'chat':
      return {
        showTeaserStats: false,
        mockData: {
          features: [
            'Live trading discussions',
            'Expert market commentary',
            'Real-time Q&A sessions',
            'Community sentiment tracking'
          ],
          highlight: '2,500+ active traders online'
        }
      };
    case 'chat-highlights':
      return {
        showTeaserStats: false,
        mockData: {
          features: [
            'AI-curated key insights',
            'Top performer analysis',
            'Market-moving discussions',
            'Alpha leak detection'
          ],
          highlight: 'Never miss important signals'
        }
      };
    case 'sentiment':
      return {
        showTeaserStats: false,
        mockData: {
          features: [
            'AI sentiment analysis',
            'Social media tracking',
            'Whale movement alerts',
            'Market psychology insights'
          ],
          highlight: 'See what smart money is doing'
        }
      };
    case 'trading_signals':
      return {
        showTeaserStats: false,
        mockData: {
          recentCalls: [
            { symbol: 'BTC', gain: '+23%', profit: '$2,847' },
            { symbol: 'SOL', gain: '+45%', profit: '$1,924' },
            { symbol: 'NVDA', gain: '+52%', profit: '$4,235' }
          ]
        }
      };
    case 'analytics':
      return {
        showTeaserStats: false,
        mockData: {
          winRate: '96%',
          growth: '+142%',
          monthlyGain: '+28%'
        }
      };
    default:
      return {
        showTeaserStats: false
      };
  }
};

export const FreemiumWidgetWrapper: React.FC<FreemiumWidgetWrapperProps> = ({
  children,
  featureName = "this feature",
  className = "",
  gradientTheme = 'blue',
  widgetType
}) => {
const { subscriber, isLoading } = useEnhancedAuth();
const [showUpgradeModal, setShowUpgradeModal] = useState(false);
const { isAdmin } = useAdminCheck();
  console.log('🔍 FreemiumWidgetWrapper Debug:', {
    featureName,
    widgetType,
    subscriber: subscriber ? {
      email: subscriber.email,
      subscription_tier: subscriber.subscription_tier,
      status: subscriber.status
    } : null,
    isLoading,
    subscriberExists: !!subscriber
  });

// Admins always have access (bypass overlay)
if (isAdmin) {
  console.log('✅ Admin detected: bypassing freemium overlay');
  return <>{children}</>;
}

// Use TierAccessManager to determine if overlay should be shown
const shouldShowOverlay = TierAccessManager.shouldShowFreemiumOverlay(subscriber, widgetType);
const hasAccess = !shouldShowOverlay;

console.log('🔍 FreemiumWidgetWrapper Logic:', {
  shouldShowOverlay,
  hasAccess,
  reason: !subscriber ? 'No subscriber object' : 
          subscriber.subscription_tier === 'free' ? 'Free tier' :
          !subscriber.subscription_tier ? 'No subscription tier' :
          widgetType === 'newsletter' ? 'Newsletter is always free' :
          `Tier: ${subscriber.subscription_tier}`
});

  // Get widget header and mock content
  const widgetHeader = getWidgetHeader(widgetType);
  const widgetMockContent = getWidgetMockContent(widgetType);

  // During loading, show overlay for premium features to prevent flashing
  if (isLoading && widgetType !== 'newsletter') {
    console.log('🔍 FreemiumWidgetWrapper: Showing overlay during loading');
    return (
      <div className={`relative ${className} min-h-[300px]`}>
        {/* Widget Header - Only show for non-alerts widgets during loading */}
        {widgetType !== 'alerts' && (
          <div className="absolute top-4 left-4 z-50 flex items-center gap-2 bg-slate-800/90 backdrop-blur-sm rounded-lg px-3 py-2 border border-slate-600/50">
            <widgetHeader.icon className="h-4 w-4 text-slate-300" />
            <div>
              <h3 className="text-white font-medium text-sm">{widgetHeader.title}</h3>
              <p className="text-slate-400 text-xs">{widgetHeader.description}</p>
            </div>
          </div>
        )}

        <div className="opacity-100 pointer-events-none">
          {children}
        </div>
        <FreemiumGradientOverlay
          onUpgrade={() => setShowUpgradeModal(true)}
          showTeaserStats={widgetMockContent.showTeaserStats}
          teaserStats={widgetMockContent.teaserStats}
          gradientTheme={gradientTheme}
          mockData={widgetMockContent.mockData}
        />
        
        <UpgradeModal
          isOpen={showUpgradeModal}
          onClose={() => setShowUpgradeModal(false)}
          featureName={featureName}
        />
      </div>
    );
  }

  // If user has access (premium/paid or feature is free), show content directly without any freemium elements
  if (hasAccess) {
    console.log('✅ FreemiumWidgetWrapper: User has access, showing content directly');
    return <>{children}</>;
  }

  // For free users on premium features, show freemium overlay
  console.log('🚫 FreemiumWidgetWrapper: Showing freemium overlay');
  return (
    <div className={`relative ${className} min-h-[300px]`}>
      {/* Widget Header - Only show for non-alerts widgets */}
      {widgetType !== 'alerts' && (
        <div className="absolute top-4 left-4 z-50 flex items-center gap-2 bg-slate-800/90 backdrop-blur-sm rounded-lg px-3 py-2 border border-slate-600/50">
          <widgetHeader.icon className="h-4 w-4 text-slate-300" />
          <div>
            <h3 className="text-white font-medium text-sm">{widgetHeader.title}</h3>
            <p className="text-slate-400 text-xs">{widgetHeader.description}</p>
          </div>
        </div>
      )}

      {/* Render the widget content for proper layout */}
      <div className="opacity-100 pointer-events-none">
        {children}
      </div>
      
      <FreemiumGradientOverlay
        onUpgrade={() => setShowUpgradeModal(true)}
        showTeaserStats={widgetMockContent.showTeaserStats}
        teaserStats={widgetMockContent.teaserStats}
        gradientTheme={gradientTheme}
        mockData={widgetMockContent.mockData}
      />
      
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        featureName={featureName}
      />
    </div>
  );
};
