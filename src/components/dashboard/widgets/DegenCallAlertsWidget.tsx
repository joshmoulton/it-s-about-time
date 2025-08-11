import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ModernCard, ModernCardHeader, ModernCardTitle, ModernCardContent } from '@/components/ui/modern-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Zap, ExternalLink, TrendingUp, DollarSign, Clock } from 'lucide-react';
import { useDegenCallAlerts } from '@/hooks/useDegenCallAlerts';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
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

  const queryClient = useQueryClient();
  useEffect(() => {
    const KEY = 'ww_backfill_degen_2025_08_11';
    if (sessionStorage.getItem(KEY)) return;
    sessionStorage.setItem(KEY, '1');
    (async () => {
      try {
        console.log('🧩 Triggering degen backfill...');
        const res = await supabase.functions.invoke('telegram-bot', {
          body: { action: 'backfill_degen_calls', limit: 500 }
        });
        if ((res as any).error) {
          console.error('❌ Backfill error:', (res as any).error);
        } else {
          console.log('✅ Backfill result:', (res as any).data || res);
          // Refresh the degen calls list
          queryClient.invalidateQueries({ queryKey: ['degenCallAlerts', 2] });
        }
      } catch (e: any) {
        console.error('❌ Backfill invocation failed:', e?.message || e);
      }
    })();
  }, [queryClient]);

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
        <div className="flex-1 flex flex-col gap-3">
          {isLoading ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500" />
            </div>
          ) : degenCalls && degenCalls.length > 0 ? (
            <div className="space-y-3">
              {degenCalls.map((call) => (
                <div key={call.id} className="bg-orange-900/20 border border-orange-500/20 rounded-lg p-3 hover:border-orange-400/30 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-gradient-to-br from-orange-500 to-red-500 rounded-md flex items-center justify-center">
                        <Zap className="w-3.5 h-3.5 text-white" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-white text-sm font-semibold">{call.coin}</span>
                          {call.direction && (
                            <Badge variant="outline" className="text-xs border-orange-400/30 text-orange-200">
                              {call.direction.toUpperCase()}
                            </Badge>
                          )}
                          {call.status && (
                            <Badge className="text-xs bg-orange-500/20 text-orange-200 border-orange-500/30">
                              {call.status}
                            </Badge>
                          )}
                        </div>
                        <div className="text-xs text-orange-200/80">
                          Entry {call.entry_price} • {formatTimeAgo(call.created_at)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              <div className="pt-1">
                <Button size="sm" variant="ghost" className="text-orange-300 hover:text-white hover:bg-orange-900/30" onClick={handleViewAllCalls}>
                  View all degen calls
                  <ExternalLink className="w-3.5 h-3.5 ml-1" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-orange-200/80">
              No recent degen calls
            </div>
          )}
        </div>
      </ModernCardContent>
    </ModernCard>;
}