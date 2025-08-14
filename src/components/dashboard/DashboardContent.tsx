import React, { useLayoutEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, TrendingUp, MessageCircle, AlertTriangle, Crown, ArrowRight } from 'lucide-react';
import { WidgetErrorBoundary } from './widgets/WidgetErrorBoundary';
import { ContentSection } from './sections/ContentSection';
import { AffiliateSection } from './sections/AffiliateSection';
import { AccountSection } from './sections/account/AccountSection';
import { AdminTelegramControls } from './AdminTelegramControls';
import { ModernChatHighlightsWidget } from './widgets/ModernChatHighlightsWidget';
import { ModernSentimentWidget } from './widgets/ModernSentimentWidget';
import { ModernNewsletterWidget } from './widgets/ModernNewsletterWidget';
import { ModernEdgeWidget } from './widgets/ModernEdgeWidget';
import { ModernAlertsWidget } from './widgets/ModernAlertsWidget';
import { ModernChatWidget } from './widgets/ModernChatWidget';
import { DegenCallAlertsWidget } from './widgets/DegenCallAlertsWidget';
import { LiveAlertsWidget } from './widgets/LiveAlertsWidget';
import { UnifiedChatWidget } from './widgets/UnifiedChatWidget';
import { FullAlertsView } from './widgets/FullAlertsView';
import { FullDegenCallAlertsView } from './widgets/FullDegenCallAlertsView';
import { CompactEdgeWidget } from './widgets/CompactEdgeWidget';
import { useUnifiedRealtimeConnection } from '@/hooks/useUnifiedRealtimeConnection';
import { useTelegramIntegration } from '@/hooks/useTelegramIntegration';
import { useLiveSentiment } from '@/hooks/useLiveSentiment';
import { FreemiumWidgetWrapper } from '../freemium/FreemiumWidgetWrapper';
import { TierAccessManager } from '@/utils/tierAccess';
import { useAdminCheck } from '@/hooks/useAdminCheck';

interface Subscriber {
  id: string;
  email: string;
  status: string;
  subscription_tier: 'free' | 'paid' | 'premium';
  created_at: string;
  updated_at: string;
}

interface DashboardContentProps {
  subscriber: Subscriber;
  activeSection: string;
  onStartTour?: (tourType: 'dashboard' | 'content' | 'account') => void;
  onForceRestartTour?: (tourType: 'dashboard' | 'content' | 'account') => void;
}

export function DashboardContent({
  subscriber,
  activeSection,
  onStartTour,
  onForceRestartTour
}: DashboardContentProps) {
  const navigate = useNavigate();
  const { sentimentData, isLoading: sentimentLoading } = useLiveSentiment();
  const { isAdmin } = useAdminCheck();

  // Scroll to top whenever activeSection changes
  useLayoutEffect(() => {
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [activeSection]);

  // Initialize unified realtime connection for the entire dashboard
  const {
    connectionState,
    reconnect,
    isConnected
  } = useUnifiedRealtimeConnection({
    enabled: activeSection === 'overview' || activeSection === 'dashboard',
    maxReconnectAttempts: 3
  });

  // Enable auto-sync for Telegram messages
  useTelegramIntegration();

  // Handle widget clicks to navigate to dedicated pages
  const handleWidgetClick = (widgetType: string) => {
    switch (widgetType) {
      case 'chat-highlights':
        navigate('/chat-highlights');
        break;
      case 'sentiment':
        navigate('/sentiment-analysis');
        break;
      case 'newsletter':
        navigate('/newsletters');
        break;
      case 'edge':
        navigate('/dashboard?section=edge');
        break;
      case 'alerts':
        navigate('/dashboard?section=alerts');
        break;
      case 'live-alerts':
        navigate('/dashboard?section=live-alerts');
        break;
      case 'chat':
        navigate('/dashboard?section=chat');
        break;
      case 'degen-calls':
        navigate('/dashboard?section=degen-calls');
        break;
    }
  };

  // Check if user has premium access
  const hasFullAccess = TierAccessManager.canAccess(subscriber, 'paid');
  
  console.log('🔍 DashboardContent tier check:', {
    subscriber: subscriber?.email,
    tier: subscriber?.subscription_tier,
    hasFullAccess
  });

  console.log('🎨 DashboardContent CSS Debug:', {
    brandNavy: getComputedStyle(document.documentElement).getPropertyValue('--brand-navy'),
    classList: document.documentElement.classList.toString()
  });
  
  // Main dashboard view - modern card-based layout with improved spacing
  if (activeSection === 'overview' || activeSection === 'dashboard') {
    return (
      <main className="min-h-screen p-3 sm:p-4 lg:p-6 xl:p-8 relative" style={{ zIndex: 10 }}>
        <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
          
          
          {/* Top Row - Newsletter, Edge, and Degen Calls - all in same responsive container */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            {/* Newsletter Widget - Always accessible to all users */}
            <FreemiumWidgetWrapper
              featureName="Weekly Wizdom Newsletter"
              className="h-[280px] sm:h-[300px] lg:h-[340px] overflow-hidden"
              gradientTheme="blue"
              showTeaserStats={false}
              widgetType="newsletter"
            >
              <div className="h-full">
                <WidgetErrorBoundary widgetName="Newsletter">
                  <ModernNewsletterWidget 
                    subscriber={subscriber} 
                    hideHeader={false}
                  />
                </WidgetErrorBoundary>
              </div>
            </FreemiumWidgetWrapper>

            {/* Watch The Edge Widget - Premium only */}
            <FreemiumWidgetWrapper
              featureName="Watch The Edge Signals"
              className="h-[280px] sm:h-[300px] lg:h-[340px] overflow-hidden"
              gradientTheme="teal"
              showTeaserStats={true}
              teaserStats={{
                activeAlerts: 15,
                activeTrades: 8,
                awaitingEntry: 7,
                avgDailyPnL: "$3,247"
              }}
              widgetType="edge"
            >
              <div className="h-full">
                <WidgetErrorBoundary widgetName="Edge">
                  <ModernEdgeWidget subscriber={subscriber} />
                </WidgetErrorBoundary>
              </div>
            </FreemiumWidgetWrapper>

            {/* Degen Call Alerts Widget - Premium only */}
            <FreemiumWidgetWrapper
              featureName="Degen Call Alerts"
              className="h-[280px] sm:h-[300px] lg:h-[340px] overflow-hidden"
              gradientTheme="orange"
              showTeaserStats={true}
              teaserStats={{
                activeAlerts: 8,
                activeTrades: 3,
                awaitingEntry: 5,
                avgDailyPnL: "$1,247"
              }}
              widgetType="degen-calls"
            >
              <div className="h-full">
                <WidgetErrorBoundary widgetName="Degen Call Alerts">
                  <DegenCallAlertsWidget subscriber={subscriber} />
                </WidgetErrorBoundary>
              </div>
            </FreemiumWidgetWrapper>
          </div>

          {/* Second Row - Live Alerts takes full width - Premium only */}
          <div className="grid grid-cols-1 gap-6 lg:gap-8">
            <FreemiumWidgetWrapper
              featureName="🧙‍♂️ Live Trading Alerts"
              className="h-[380px] lg:h-[400px] overflow-hidden"
              gradientTheme="green"
              showTeaserStats={true}
              teaserStats={{
                activeAlerts: 12,
                activeTrades: 7,
                awaitingEntry: 5,
                avgDailyPnL: "$2,847"
              }}
              widgetType="live-alerts"
            >
              <div className="h-full cursor-pointer" onClick={() => handleWidgetClick('live-alerts')}>
                <WidgetErrorBoundary widgetName="Live Alerts">
                  <LiveAlertsWidget subscriber={subscriber} hideHeader={false} />
                </WidgetErrorBoundary>
              </div>
            </FreemiumWidgetWrapper>
          </div>

          {/* Third Row - Community Chat full width - Premium only */}
          <div className="grid grid-cols-1 gap-6 lg:gap-8">
            <FreemiumWidgetWrapper
              featureName="Community Chat & Live Updates"
              className="h-[420px] lg:h-[450px] overflow-hidden"
              gradientTheme="indigo"
              showTeaserStats={true}
              teaserStats={{
                activeAlerts: 24,
                activeTrades: 15,
                awaitingEntry: 9,
                avgDailyPnL: "$4,125"
              }}
              widgetType="chat"
            >
              <div className="h-full cursor-pointer" onClick={() => handleWidgetClick('chat')}>
                <WidgetErrorBoundary widgetName="Community Chat">
                  <ModernChatWidget subscriber={subscriber} hideHeader={true} />
                </WidgetErrorBoundary>
              </div>
            </FreemiumWidgetWrapper>
          </div>

          {/* Bottom Row - Chat Highlights and AI Sentiment - Premium only */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
            {/* Chat Highlights - Takes full width on mobile, half on desktop */}
            <FreemiumWidgetWrapper
              featureName="Chat Highlights & Analysis"
              className="lg:col-span-1 h-[420px] lg:h-[450px] overflow-hidden"
              gradientTheme="purple"
              showTeaserStats={true}
              teaserStats={{
                activeAlerts: 18,
                activeTrades: 9,
                awaitingEntry: 9,
                avgDailyPnL: "$2,945"
              }}
              widgetType="chat-highlights"
            >
              <div className="h-full">
                <WidgetErrorBoundary widgetName="Chat Highlights">
                  <ModernChatHighlightsWidget subscriber={subscriber} />
                </WidgetErrorBoundary>
              </div>
            </FreemiumWidgetWrapper>

            {/* AI Sentiment - Premium only */}
            <FreemiumWidgetWrapper
              featureName="AI Sentiment Analysis"
              className="h-[420px] lg:h-[450px] overflow-hidden"
              gradientTheme="purple"
              showTeaserStats={true}
              teaserStats={{
                activeAlerts: 16,
                activeTrades: 11,
                awaitingEntry: 5,
                avgDailyPnL: "$3,659"
              }}
              widgetType="sentiment"
            >
              <div className="h-full">
                <WidgetErrorBoundary widgetName="AI Sentiment">
                  <ModernSentimentWidget subscriber={subscriber} />
                </WidgetErrorBoundary>
              </div>
            </FreemiumWidgetWrapper>
          </div>
          
        </div>
      </main>
    );
  }

  // Individual section views
  const renderSection = () => {
    switch (activeSection) {
      case 'content':
        return <div data-tour="content-section">
            <ContentSection subscriber={subscriber} />
          </div>;
      case 'affiliate':
        return <AffiliateSection subscriber={subscriber} />;
      case 'account':
        return <AccountSection />;
      case 'telegram-admin':
        return <AdminTelegramControls subscriber={subscriber} />;
      case 'chat-highlights':
        return <div className="p-6">
            <h1 className="text-2xl font-bold mb-6 text-foreground">Chat Highlights</h1>
            <div className="max-w-4xl">
              <WidgetErrorBoundary widgetName="Chat Highlights">
                <ModernChatHighlightsWidget subscriber={subscriber} />
              </WidgetErrorBoundary>
            </div>
          </div>;
      case 'sentiment':
        return <div className="p-6">
            <h1 className="text-2xl font-bold mb-6 text-foreground">AI Sentiment Analysis</h1>
            <div className="max-w-4xl">
              <WidgetErrorBoundary widgetName="Sentiment Tracker">
                <ModernSentimentWidget subscriber={subscriber} />
              </WidgetErrorBoundary>
            </div>
          </div>;
      case 'newsletter':
        return <div className="p-6">
            <h1 className="text-2xl font-bold mb-6 text-foreground">Newsletter</h1>
            <div className="max-w-4xl">
              <WidgetErrorBoundary widgetName="Newsletter">
                <ModernNewsletterWidget subscriber={subscriber} hideHeader={true} />
              </WidgetErrorBoundary>
            </div>
          </div>;
      case 'edge':
        return <div className="p-6">
            <h1 className="text-2xl font-bold mb-6 text-foreground">Edge Content</h1>
            <div className="max-w-4xl">
              <WidgetErrorBoundary widgetName="Edge">
                <CompactEdgeWidget subscriber={subscriber} />
              </WidgetErrorBoundary>
            </div>
          </div>;
      case 'alerts':
        return <div className="h-full w-full relative" style={{ zIndex: 10 }}>
            {/* Header */}
            <div className="px-8 py-6 border-b border-border/50 flex-shrink-0 bg-background">
              <div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/dashboard')}
                  className="bg-muted/20 border-border/50 text-foreground hover:bg-muted/50 hover:border-border"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              </div>
            </div>
            
            {/* Content */}
            <div className="flex-1 overflow-hidden">
              <WidgetErrorBoundary widgetName="Full Alerts View">
                <FullAlertsView subscriber={subscriber} />
              </WidgetErrorBoundary>
            </div>
          </div>;
      case 'chat':
        return <div className="h-full w-full relative bg-background" style={{ zIndex: 10 }}>
            {/* Header */}
            <div className="px-8 py-6 border-b border-border/50 flex-shrink-0 bg-gradient-to-br from-slate-800/40 via-slate-900/30 to-slate-800/20 backdrop-blur-xl">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate('/dashboard')}
                      className="bg-muted/20 border-border/50 text-foreground hover:bg-muted/50 hover:border-border"
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Back to Dashboard
                    </Button>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-blue-500 rounded-xl flex items-center justify-center shadow-lg">
                      <MessageCircle className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h1 className="text-3xl font-bold text-foreground mb-1">Community Chat</h1>
                      <p className="text-muted-foreground">Live community discussions and updates</p>
                    </div>
                  </div>
                </div>
                
                <Badge className="bg-indigo-500/10 text-indigo-400 border-indigo-500/20 px-4 py-2">
                  <span className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse mr-2"></span>
                  Live Chat
                </Badge>
              </div>
            </div>
            
            {/* Content */}
            <div className="flex-1 overflow-hidden px-8 py-6">
              <div className="h-[calc(100vh-200px)] bg-card/30 rounded-xl border border-border/50">
                <WidgetErrorBoundary widgetName="Community Chat">
                  <UnifiedChatWidget 
                    subscriber={subscriber}
                    isExpanded={true}
                    onToggleExpanded={undefined}
                  />
                </WidgetErrorBoundary>
              </div>
            </div>
          </div>;
      case 'live-alerts':
        return <div className="h-full w-full relative" style={{ zIndex: 10 }}>
            {/* Header */}
            <div className="px-8 py-6 border-b border-border/50 flex-shrink-0 bg-background">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate('/dashboard')}
                      className="bg-muted/20 border-border/50 text-foreground hover:bg-muted/50 hover:border-border"
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Back to Dashboard
                    </Button>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center">
                      <TrendingUp className="h-6 w-6 text-blue-500" />
                    </div>
                    <div>
                      <h1 className="text-3xl font-bold text-foreground mb-1">🧙‍♂️ Live Trading Alerts</h1>
                      <p className="text-muted-foreground">Real-time trading signals and market opportunities</p>
                    </div>
                  </div>
                </div>
                
                <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20 px-4 py-2">
                  <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse mr-2"></span>
                  Live Alerts
                </Badge>
              </div>
            </div>
            
            {/* Content with proper scrolling */}
            <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-4 sm:py-6">
              <WidgetErrorBoundary widgetName="Live Alerts View">
                <div className="max-w-4xl mx-auto grid gap-4">
                  <LiveAlertsWidget subscriber={subscriber} hideHeader={true} />
                </div>
              </WidgetErrorBoundary>
            </div>
          </div>;
      case 'degen-calls':
        return <div className="h-full w-full relative" style={{ zIndex: 10 }}>
            {/* Header */}
            <div className="px-8 py-6 border-b border-border/50 flex-shrink-0 bg-background">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate('/dashboard')}
                      className="bg-muted/20 border-border/50 text-foreground hover:bg-muted/50 hover:border-border"
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Back to Dashboard
                    </Button>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-orange-500/10 rounded-xl flex items-center justify-center">
                      <AlertTriangle className="h-6 w-6 text-orange-500" />
                    </div>
                    <div>
                      <h1 className="text-3xl font-bold text-foreground mb-1">Degen Call Alerts</h1>
                      <p className="text-muted-foreground">High-risk, high-reward trading opportunities</p>
                    </div>
                  </div>
                </div>
                
                <Badge className="bg-orange-500/10 text-orange-500 border-orange-500/20 px-4 py-2">
                  <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse mr-2"></span>
                  Degen Calls
                </Badge>
              </div>
            </div>
            
            {/* Content with proper scrolling */}
            <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-4 sm:py-6">
              <WidgetErrorBoundary widgetName="Full Degen Call Alerts View">
                <FullDegenCallAlertsView subscriber={subscriber} />
              </WidgetErrorBoundary>
            </div>
          </div>;
      default:
        return <div className="h-full w-full relative" style={{ zIndex: 10 }}>
            {/* Header */}
            <div className="px-8 py-6 border-b border-border/50 flex-shrink-0 bg-background">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate('/dashboard')}
                      className="bg-muted/20 border-border/50 text-foreground hover:bg-muted/50 hover:border-border"
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Back to Dashboard
                    </Button>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-slate-500/10 rounded-xl flex items-center justify-center">
                      <AlertTriangle className="h-6 w-6 text-slate-500" />
                    </div>
                    <div>
                      <h1 className="text-3xl font-bold text-foreground mb-1">Section Not Available</h1>
                      <p className="text-muted-foreground">The requested section is not available</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Content */}
            <div className="flex-1 overflow-hidden px-8 py-6">
              <div className="text-center text-muted-foreground p-8">
                <h2 className="text-xl font-semibold mb-2">Section not available</h2>
                <p>The requested section "{activeSection}" is not available.</p>
              </div>
            </div>
          </div>;
    }
  };

  return (
    <main className="flex-1 p-3 sm:p-6 overflow-hidden relative" style={{ zIndex: 10 }}>
      <div className="max-w-7xl mx-auto h-full overflow-hidden">
        {renderSection()}
      </div>
    </main>
  );
}
