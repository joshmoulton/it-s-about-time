import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ModernCard, ModernCardHeader, ModernCardTitle, ModernCardContent } from '@/components/ui/modern-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Zap, ExternalLink, TrendingUp, DollarSign, Clock } from 'lucide-react';
import { useDegenCallAlerts } from '@/hooks/useDegenCallAlerts';
interface Subscriber {
  id: string;
  email: string;
  status: string;
  subscription_tier: 'free' | 'paid' | 'premium';
  created_at: string;
  updated_at: string;
}
interface DegenCallAlertsWidgetProps {
  subscriber: Subscriber;
  hideHeader?: boolean;
}
export function DegenCallAlertsWidget({
  subscriber,
  hideHeader = false
}: DegenCallAlertsWidgetProps) {
  const navigate = useNavigate();
  const {
    data: degenCalls,
    isLoading
  } = useDegenCallAlerts(2); // Last 2 calls for better fit

  const handleViewAllCalls = () => {
    navigate('/dashboard?section=degen-calls');
  };
  const formatMultiplier = (multiplier: number) => {
    return `${multiplier.toFixed(1)}x`;
  };
  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const callTime = new Date(timestamp);
    const diffMinutes = Math.floor((now.getTime() - callTime.getTime()) / (1000 * 60));
    if (diffMinutes < 1) return 'just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h ago`;
    return `${Math.floor(diffMinutes / 1440)}d ago`;
  };
  return <ModernCard className="h-full min-h-[300px] flex flex-col bg-gradient-to-br from-orange-900/20 via-red-900/10 to-slate-800/50 border-orange-500/20 hover:border-orange-400/30 transition-all duration-200" interactive data-tour="degen-calls-widget">
      {!hideHeader && <ModernCardHeader className="pb-2 pt-3 flex-shrink-0 px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg flex items-center justify-center shadow-sm">
                <Zap className="h-4 w-4 text-white" />
              </div>
              <div>
                <ModernCardTitle className="text-sm text-white">Degen Call Alerts</ModernCardTitle>
              </div>
            </div>
            {/* Spacer to match newsletter countdown height */}
            <div className="h-10 w-16"></div>
          </div>
        </ModernCardHeader>}
      
      <ModernCardContent className={`flex-1 flex flex-col ${hideHeader ? 'pt-0' : 'pt-0'} px-4 pb-4`}>
        {/* Coming Soon Badge Overlay */}
        <div className="flex-1 flex items-center justify-center relative">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-900/30 via-red-800/20 to-transparent rounded-lg flex items-center justify-center backdrop-blur-sm">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto bg-orange-500/20 rounded-full flex items-center justify-center mb-4">
                <Clock className="w-8 h-8 text-orange-400" />
              </div>
              <h3 className="text-xl font-semibold text-white">Coming Soon</h3>
              <p className="text-orange-200/80 max-w-sm">
                Premium degen call alerts with high-risk, high-reward opportunities are coming soon.
              </p>
            </div>
          </div>
        </div>
      </ModernCardContent>
    </ModernCard>;
}