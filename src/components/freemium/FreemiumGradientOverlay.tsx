import React, { useState } from 'react';
import { Lock, Crown, ArrowRight, Sparkles, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FreemiumGradientOverlayProps {
  onUpgrade: () => void;
  showTeaserStats?: boolean;
  teaserStats?: {
    activeAlerts?: number;
    activeTrades?: number;
    awaitingEntry?: number;
    avgDailyPnL?: string;
  };
  mockData?: {
    recentCalls?: Array<{ symbol: string; gain: string; profit: string }>;
    winRate?: string;
    growth?: string;
    monthlyGain?: string;
  };
  gradientTheme?: 'blue' | 'teal' | 'orange' | 'green' | 'purple' | 'indigo';
}

export const FreemiumGradientOverlay: React.FC<FreemiumGradientOverlayProps> = ({
  onUpgrade,
  showTeaserStats = false,
  teaserStats,
  mockData,
  gradientTheme = 'blue'
}) => {
  const [showModal, setShowModal] = useState(false);
  
  const getGradientClasses = () => {
    switch (gradientTheme) {
      case 'teal':
        return 'from-teal-900/70 via-cyan-900/60 to-slate-900/70';
      case 'orange':
        return 'from-orange-900/70 via-red-900/60 to-slate-900/70';
      case 'green':
        return 'from-green-900/70 via-emerald-900/60 to-slate-900/70';
      case 'purple':
        return 'from-purple-900/70 via-violet-900/60 to-slate-900/70';
      case 'indigo':
        return 'from-blue-900/70 via-indigo-900/60 to-slate-900/70';
      default:
        return 'from-blue-900/70 via-purple-900/60 to-slate-900/70';
    }
  };

  const getAccentColor = () => {
    switch (gradientTheme) {
      case 'teal': return 'text-teal-300';
      case 'orange': return 'text-orange-300';
      case 'green': return 'text-emerald-300';
      case 'purple': return 'text-purple-300';
      case 'indigo': return 'text-blue-300';
      default: return 'text-blue-300';
    }
  };

  const getBorderColor = () => {
    switch (gradientTheme) {
      case 'teal': return 'border-teal-500/30';
      case 'orange': return 'border-orange-500/30';
      case 'green': return 'border-emerald-500/30';
      case 'purple': return 'border-purple-500/30';
      case 'indigo': return 'border-blue-500/30';
      default: return 'border-blue-500/30';
    }
  };
  
  return (
    <div 
      className="absolute inset-0 z-40 rounded-xl overflow-hidden"
    >
      {/* Aggressive blur overlay - this is the main effect */}
      <div 
        className="absolute inset-0" 
        style={{
          backdropFilter: 'blur(20px) saturate(120%)',
          WebkitBackdropFilter: 'blur(20px) saturate(120%)',
          background: 'rgba(15, 23, 42, 0.3)' // Subtle dark tint to enhance contrast
        }}
      />
      
      {/* Very subtle theme color hint - much more transparent than before */}
      <div className={`absolute inset-0 bg-gradient-to-br ${getGradientClasses()} opacity-20`} />
      
      {/* Teaser stats - now positioned above the upgrade button for better visibility */}
      {showTeaserStats && teaserStats && (
        <div className="absolute top-4 left-4 right-4 z-50">
          <div className="grid grid-cols-3 gap-2 max-w-md mx-auto">
            <div className="bg-slate-800/95 backdrop-blur-sm rounded-lg p-2 text-center border border-slate-600/50 shadow-lg">
              <div className="text-yellow-400 text-sm font-bold">{teaserStats.activeAlerts || 12}</div>
              <div className="text-slate-200 text-xs font-medium">Active Alerts</div>
            </div>
            <div className="bg-slate-800/95 backdrop-blur-sm rounded-lg p-2 text-center border border-slate-600/50 shadow-lg">
              <div className="text-green-400 text-sm font-bold">{teaserStats.activeTrades || 7}</div>
              <div className="text-slate-200 text-xs font-medium">Live Trades</div>
            </div>
            <div className="bg-slate-800/95 backdrop-blur-sm rounded-lg p-2 text-center border border-slate-600/50 shadow-lg">
              <div className="text-blue-400 text-sm font-bold">{teaserStats.awaitingEntry || 5}</div>
              <div className="text-slate-200 text-xs font-medium">Awaiting Entry</div>
            </div>
          </div>
          
          {/* Upgrade prompt positioned below stats */}
          <div className="mt-4 text-center">
            <div className="text-slate-300 text-sm mb-2">
              Want to see success rates and P&L data?
            </div>
            <Button
              onClick={onUpgrade}
              size="lg"
              className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-semibold shadow-2xl border-0 transition-all duration-200 px-6 py-3 text-base rounded-xl"
            >
              <Crown className="w-5 h-5 mr-2" />
              Upgrade Now
            </Button>
          </div>
        </div>
      )}

      {/* Original centered upgrade button - shown when no teaser stats */}
      {!showTeaserStats && (
        <div className="absolute inset-0 flex items-center justify-center z-50">
          <Button
            onClick={onUpgrade}
            size="lg"
            className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-semibold shadow-2xl border-0 transition-all duration-200 px-8 py-6 text-lg rounded-xl"
          >
            <Crown className="w-6 h-6 mr-3" />
            Upgrade Now
          </Button>
        </div>
      )}

      {/* Mock trading calls data - visible on top of blur */}
      {mockData?.recentCalls && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-10"
             style={{ filter: 'none' }}>
          <div className="space-y-2 max-w-sm w-full">
            {mockData.recentCalls.map((call, index) => (
              <div key={index} className="bg-slate-800/90 backdrop-blur-sm rounded-lg p-3 border border-slate-600/50 flex items-center justify-between shadow-lg">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-blue-500 rounded-lg flex items-center justify-center">
                    <span className="text-white text-xs font-bold">{call.symbol}</span>
                  </div>
                  <div>
                    <div className="text-green-400 font-bold text-sm">{call.gain}</div>
                    <div className="text-slate-200 text-xs">{call.profit}</div>
                  </div>
                </div>
                <TrendingUp className="h-4 w-4 text-green-400" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Success Rate and Analytics - REMOVED for free users */}
      {/* These premium metrics (success rate, P&L) are now only available after upgrade */}
    </div>
  );
};