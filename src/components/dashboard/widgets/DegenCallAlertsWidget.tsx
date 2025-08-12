import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ModernCard, ModernCardHeader, ModernCardTitle, ModernCardContent } from '@/components/ui/modern-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Zap, ExternalLink, TrendingUp, DollarSign, Clock, ArrowUp, ArrowDown } from 'lucide-react';
import { useDegenCallAlerts } from '@/hooks/useDegenCallAlerts';
import { useCryptoPrices } from '@/hooks/useCryptoPrices';
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
  } = useDegenCallAlerts(1); // Last 1 call for consistent height with other widgets

  // Get tickers for price fetching
  const tickers = degenCalls?.map(call => call.coin) || [];
  const {
    data: cryptoPrices
  } = useCryptoPrices(tickers);
  const queryClient = useQueryClient();
  useEffect(() => {
    const KEY = 'ww_backfill_degen_2025_08_11';
    if (sessionStorage.getItem(KEY)) return;
    sessionStorage.setItem(KEY, '1');
    (async () => {
      try {
        console.log('🧩 Triggering degen backfill...');
        const res = await supabase.functions.invoke('telegram-bot', {
          body: {
            action: 'backfill_degen_calls',
            limit: 500
          }
        });
        if ((res as any).error) {
          console.error('❌ Backfill error:', (res as any).error);
        } else {
          console.log('✅ Backfill result:', (res as any).data || res);
        }

        // Fallback: scan recent !degen messages client-side and upsert via insert_degen_call
        const {
          data: msgs,
          error: msgsErr
        } = await supabase.from('telegram_messages').select('telegram_message_id, chat_id, message_thread_id, user_id, username, first_name, last_name, message_text, timestamp').not('message_text', 'is', null).ilike('message_text', '!degen%').order('timestamp', {
          ascending: true
        }).limit(50);
        if (msgsErr) {
          // Suppress RLS access errors for free users (expected behavior)
          if (msgsErr.code === 'PGRST301' || msgsErr.message?.includes('RLS')) {
            console.log('ℹ️ Premium chat access restricted for current user tier');
          } else {
            console.error('❌ Fetch telegram_messages error:', msgsErr);
          }
        } else if (msgs && msgs.length) {
          const re = /^\s*!degen\s+(\$?[A-Za-z]{2,15})(?:\s+(here))?(?:\s+entry\s+([0-9]+(?:\.[0-9]+)?))?(?:\s+stop\s+([0-9]+(?:\.[0-9]+)?))?(?:\s+target\s+([0-9]+(?:\.[0-9]+)?))?(?:\s+size\s+(tiny|low|med|high|huge))?/i;
          const toNum = (v: any) => {
            const n = typeof v === 'number' ? v : parseFloat(String(v));
            return Number.isFinite(n) ? n : null;
          };
          for (const m of msgs) {
            const text = m.message_text || '';
            const match = text.match(re);
            if (!match) continue;
            const rawTicker = match[1] || '';
            const ticker = rawTicker.replace(/^\$/, '').toUpperCase().trim();
            const entry = toNum(match[3]);
            const stop = toNum(match[4]);
            const target = toNum(match[5]);
            const size = match[6] || null;
            await supabase.functions.invoke('telegram-bot', {
              body: {
                action: 'insert_degen_call',
                degen_call: {
                  ticker,
                  entry,
                  stop,
                  target,
                  size,
                  risk: size // Map size to risk field for compatibility
                },
                message: {
                  message_id: m.telegram_message_id,
                  chat_id: m.chat_id,
                  thread_id: m.message_thread_id || 0,
                  from_user: {
                    id: m.user_id,
                    username: m.username,
                    first_name: m.first_name,
                    last_name: m.last_name || null
                  },
                  text,
                  timestamp: Math.floor(new Date(m.timestamp).getTime() / 1000)
                }
              }
            });
          }
        }

        // Refresh the degen calls list
        queryClient.invalidateQueries({
          queryKey: ['degenCallAlerts', 1]
        });
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

  // Convert size to display labels
  const formatSizeLevel = (size?: string): string => {
    if (!size) return 'N/A';
    const sizeStr = size.toLowerCase();
    if (sizeStr === 'tiny') return 'Tiny';
    if (sizeStr === 'low') return 'Low';
    if (sizeStr === 'med') return 'Med';
    if (sizeStr === 'high') return 'High';
    if (sizeStr === 'huge') return 'Huge';
    return size; // Return original if not recognized
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
  const formatPrice = (price: number) => {
    if (price >= 1) return `$${price.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
    if (price >= 0.01) return `$${price.toFixed(4)}`;
    return `$${price.toFixed(8)}`;
  };
  const getPriceForTicker = (ticker: string) => {
    return cryptoPrices?.find(p => p.ticker === ticker.toUpperCase());
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
          {/* Testing notice - centered and attention-grabbing */}
          <div className="w-full flex justify-center">
            <Badge variant="outline" className="px-3 py-1.5 text-sm font-extrabold uppercase tracking-wider bg-orange-400/20 border-orange-300/60 text-orange-100 shadow-md backdrop-blur-sm animate-pulse" aria-live="polite">
              TESTING ONLY — DISREGARD
            </Badge>
          </div>

            {isLoading ? <div className="flex-1 flex items-center justify-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500" />
            </div> : degenCalls && degenCalls.length > 0 ? <div className="space-y-3">
              {degenCalls.map(call => <div key={call.id} className="bg-orange-900/25 border border-orange-500/30 rounded-md px-2.5 py-2 hover:border-orange-400/40 hover:bg-orange-900/35 transition-all duration-200 shadow-sm space-y-2">
                  {/* Header with ticker, direction, and timestamp */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 bg-gradient-to-br from-orange-500 to-red-500 rounded-md flex items-center justify-center">
                        <Zap className="w-2.5 h-2.5 text-white" />
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-white text-sm font-bold">{call.coin}</span>
                        {call.direction && <Badge variant="outline" className={`text-xs px-1.5 py-0.5 border ${call.direction.toLowerCase() === 'long' ? 'border-green-400/50 text-green-200 bg-green-500/10' : 'border-red-400/50 text-red-200 bg-red-500/10'}`}>
                            {call.direction.toUpperCase()}
                          </Badge>}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1 text-xs text-orange-200/80">
                        <Clock className="w-2.5 h-2.5" />
                        <span>{formatTimeAgo(call.created_at)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Caller name */}
                  {call.analyst_name && <div className="flex items-center gap-1.5 pb-1.5 border-b border-orange-500/20">
                      <span className="text-xs text-orange-300">Called by:</span>
                      <span className="text-xs text-white font-medium">{call.analyst_name}</span>
                    </div>}

                  {/* Current Price Section */}
                  <div className="bg-black/20 rounded-md p-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <DollarSign className="w-3 h-3 text-blue-400" />
                        <span className="text-xs text-orange-200/80">Current Price:</span>
                      </div>
                      {(() => {
                  const priceData = getPriceForTicker(call.coin);
                  if (priceData) {
                    return <span className="text-white font-semibold text-sm">
                                {formatPrice(priceData.price_usd)}
                              </span>;
                  }
                  return <span className="text-orange-300 font-medium text-xs">Loading...</span>;
                })()}
                    </div>
                  </div>

                  {/* Trading details */}
                  <div className="space-y-1">
                    {/* Entry */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span className="text-xs text-orange-200/80">Entry:</span>
                      </div>
                      <span className="text-white font-medium text-xs">
                        {call.entry_price && call.entry_price !== 'Market' ? `$${Number(call.entry_price).toLocaleString()}` : 'Market'}
                      </span>
                    </div>

                    {/* Stop Loss */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                        <span className="text-xs text-orange-200/80">Stop Loss:</span>
                      </div>
                      <span className="text-white font-medium text-xs">
                        {call.stop_loss ? `$${Number(call.stop_loss).toLocaleString()}` : 'N/A'}
                      </span>
                    </div>

                    {/* Target */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <TrendingUp className="w-2.5 h-2.5 text-green-400" />
                        <span className="text-xs text-orange-200/80">Target:</span>
                      </div>
                      <span className="text-white font-medium text-xs">
                        {call.targets && call.targets.length > 0 ? `$${Number(call.targets[0]).toLocaleString()}` : 'N/A'}
                      </span>
                    </div>

                    {/* Size */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                        <span className="text-xs text-orange-200/80">Size:</span>
                      </div>
                      <span className="text-white font-medium text-xs">
                        {formatSizeLevel(call.size || call.risk_management)}
                      </span>
                    </div>
                  </div>
                </div>)}

              <div className="pt-1">
                <Button size="sm" className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white rounded-xl h-12 text-sm font-medium shadow-sm transition-all duration-200" onClick={handleViewAllCalls}>
                  <ExternalLink className="h-4 w-4 mr-2 flex-shrink-0" />
                  View All Degen Calls
                </Button>
              </div>
            </div> : <div className="flex-1 flex items-center justify-center text-orange-200/80">
              No recent degen calls
            </div>}
        </div>
      </ModernCardContent>
    </ModernCard>;
}