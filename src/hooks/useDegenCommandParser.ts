import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface DegenCommandData {
  ticker: string;
  direction: 'long' | 'short';
  entryPrice?: number;
  stopLoss?: number;
  targets?: number[];
  callPrice?: number; // Price at time of call creation
}

export interface CoinGeckoResponse {
  price: number;
  change24h: number;
  coinGeckoId: string;
  hasError: boolean;
  lastUpdated: string;
  cached: boolean;
}

export const useDegenCommandParser = () => {
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchCurrentPrice = async (ticker: string): Promise<number | null> => {
    try {
      const { data, error } = await supabase.functions.invoke('crypto-pricing', {
        body: { 
          action: 'fetch_prices',
          tickers: [ticker.toUpperCase()] 
        }
      });

      if (error) {
        console.error('Error fetching price:', error);
        return null;
      }

      if (data.success && data.prices && data.prices.length > 0) {
        const priceData = data.prices[0];
        console.log('✅ Fetched current price for', ticker, ':', priceData.price);
        return priceData.price;
      }

      console.error('No price data found for ticker:', ticker);
      return null;
    } catch (error) {
      console.error('Failed to fetch current price:', error);
      return null;
    }
  };

  const parseDegenCommand = async (message: string): Promise<DegenCommandData | null> => {
    // Clean up the message
    const cleanMessage = message.trim();
    console.log('Parsing degen command:', cleanMessage);
    
    // Check for close command first
    const closeFormat = /!close\s+([A-Za-z0-9]+)/i;
    const closeMatch = cleanMessage.match(closeFormat);
    
    if (closeMatch) {
      const ticker = closeMatch[1].toUpperCase();
      console.log('Close command detected for ticker:', ticker);
      await closePosition(ticker);
      return null; // Return null to indicate this was a close command, not a new degen call
    }
    
    // Match patterns: 
    // !degen supporting long|short TICKER (optional entry/stop/target)
    // !degen long|short TICKER [entry] (optional stop/target)
    const supportingFormat = /!degen\s+supporting\s+(long|short)\s+([A-Za-z0-9]+)(?:\s+(.+))?/i;
    const directFormat = /!degen\s+(long|short)\s+([A-Za-z0-9]+)(?:\s+([0-9.]+))?(?:\s+(.+))?/i;
    
    let match = cleanMessage.match(supportingFormat);
    let isDirectFormat = false;
    
    if (!match) {
      match = cleanMessage.match(directFormat);
      isDirectFormat = true;
    }

    if (!match) {
      console.log('No match found for degen command');
      return null;
    }

    console.log('Regex match:', match);

    let direction: string, ticker: string, entryPrice: string | undefined, additionalParams: string | undefined;
    
    if (isDirectFormat) {
      [, direction, ticker, entryPrice, additionalParams] = match;
      console.log('Direct format parsed:', { direction, ticker, entryPrice, additionalParams });
    } else {
      [, direction, ticker, additionalParams] = match;
      console.log('Supporting format parsed:', { direction, ticker, additionalParams });
    }
    
    const commandData: DegenCommandData = {
      ticker: ticker.toUpperCase(),
      direction: direction.toLowerCase() as 'long' | 'short',
    };

    console.log('Base command data:', commandData);

    // Set entry price if provided in direct format
    if (isDirectFormat && entryPrice) {
      commandData.entryPrice = parseFloat(entryPrice);
      console.log('Set entry price:', commandData.entryPrice);
    }

    // Parse additional parameters if provided
    if (additionalParams) {
      const params = additionalParams.toLowerCase();
      
      // Look for entry price
      const entryMatch = params.match(/entry[:\s]+([0-9.]+)/);
      if (entryMatch) {
        commandData.entryPrice = parseFloat(entryMatch[1]);
      }

      // Look for stop loss
      const stopMatch = params.match(/stop[:\s]+([0-9.]+)/);
      if (stopMatch) {
        commandData.stopLoss = parseFloat(stopMatch[1]);
      }

      // Look for targets
      const targetMatch = params.match(/target[s]?[:\s]+([0-9.,\s]+)/);
      if (targetMatch) {
        const targets = targetMatch[1]
          .split(/[,\s]+/)
          .map(t => parseFloat(t.trim()))
          .filter(t => !isNaN(t));
        if (targets.length > 0) {
          commandData.targets = targets;
        }
      }
    }

    // Fetch call price once at creation time
    const callPrice = await fetchCurrentPrice(ticker);
    if (callPrice) {
      commandData.callPrice = callPrice;
      
      // If no entry price provided, use call price as entry
      if (!commandData.entryPrice) {
        commandData.entryPrice = callPrice;
        toast.success(`${ticker} call price: $${callPrice.toFixed(4)} (set as entry)`);
      } else {
        toast.success(`${ticker} call price: $${callPrice.toFixed(4)}, entry: $${commandData.entryPrice.toFixed(4)}`);
      }
    } else {
      toast.error(`Could not fetch current price for ${ticker}`);
      // Still allow creation if entry price was manually specified
      if (!commandData.entryPrice) {
        return null;
      }
    }

    return commandData;
  };

  const closePosition = async (ticker: string) => {
    setIsProcessing(true);
    try {
      // Get current price for final calculations
      const currentPrice = await fetchCurrentPrice(ticker);
      
      // Find active signals for this ticker
      const { data: activeSignals, error: fetchError } = await supabase
        .from('analyst_signals')
        .select('*')
        .eq('ticker', ticker)
        .eq('status', 'active');

      if (fetchError) throw fetchError;

      if (!activeSignals || activeSignals.length === 0) {
        toast.error(`No active ${ticker} position found to close`);
        return;
      }

      // Close all active positions for this ticker
      for (const signal of activeSignals) {
        const finalPrice = currentPrice || signal.entry_price;
        const profitPct = signal.entry_price ? 
          ((finalPrice - signal.entry_price) / signal.entry_price) * 100 : 0;

        // Update signal status to closed
        const { error: updateError } = await supabase
          .from('analyst_signals')
          .update({
            status: 'closed',
            updated_at: new Date().toISOString()
          })
          .eq('id', signal.id);

        if (updateError) throw updateError;

        // Log the manual close event using 'note' type
        const { error: eventError } = await supabase
          .from('signal_events')
          .insert({
            id: crypto.randomUUID(),
            signal_id: signal.id,
            event: 'note',
            detail: { 
              type: 'manual_close',
              price: finalPrice, 
              profit_pct: profitPct,
              closed_by: 'user_command'
            }
          });

        if (eventError) {
          console.error('Failed to log close event:', eventError);
        }

        // Send notification
        try {
          const { error: notifyError } = await supabase.functions.invoke('degen-call-notifier', {
            body: {
              type: 'live_trading_event',
              ticker,
              kind: 'position_closed',
              reason: 'manual_close',
              price: finalPrice,
              signal_id: signal.id,
              entry_price: signal.entry_price,
              profit_pct: profitPct
            }
          });

          if (notifyError) {
            console.error('Failed to send close notification:', notifyError);
          }
        } catch (notifyError) {
          console.error('Error sending close notification:', notifyError);
        }
      }

      const profit = activeSignals[0]?.entry_price && currentPrice ? 
        ((currentPrice - activeSignals[0].entry_price) / activeSignals[0].entry_price) * 100 : 0;
      
      const profitText = profit > 0 ? `+${profit.toFixed(2)}%` : `${profit.toFixed(2)}%`;
      
      toast.success(`${ticker} position closed manually at $${currentPrice?.toFixed(6) || 'market'} (${profitText})`);
      
    } catch (error) {
      console.error('Error closing position:', error);
      toast.error(`Failed to close ${ticker} position`);
    } finally {
      setIsProcessing(false);
    }
  };

  const createSignalFromCommand = async (commandData: DegenCommandData, analystName: string = 'Degen Caller') => {
    setIsProcessing(true);
    try {
      const targets = commandData.targets || [];
      const entryDisplay = commandData.entryPrice?.toString() || 'Market';
      const stopDisplay = commandData.stopLoss?.toString() || 'N/A';
      const targetsDisplay = targets.length > 0 ? targets.join(', ') : 'N/A';

      const callPriceDisplay = commandData.callPrice ? `$${commandData.callPrice.toFixed(4)}` : 'N/A';
      
      const formattedOutput = `MARKET: CRYPTO ${commandData.ticker} SPOT ${commandData.direction.toUpperCase()}

Call Price: ${callPriceDisplay}
Entry: ${entryDisplay}
Invalidation: ${stopDisplay}
Targets: ${targetsDisplay}

Risk: 2.5%

Degen call for ${commandData.ticker} ${commandData.direction}`;

      // Insert the signal
      const { data: signalData, error } = await supabase
        .from('analyst_signals')
        .insert({
          analyst_name: analystName,
          market: 'crypto' as any,
          trade_type: 'spot' as any,
          trade_direction: commandData.direction as any,
          ticker: commandData.ticker,
          risk_percentage: 2.5,
          entry_type: 'market' as any,
          entry_price: commandData.entryPrice,
          risk_management: 'stop_loss' as any,
          stop_loss_price: commandData.stopLoss,
          targets: targets.map(t => t.toString()),
          full_description: `Degen call for ${commandData.ticker} ${commandData.direction}`,
          formatted_output: formattedOutput,
        })
        .select()
        .single();

      if (error) throw error;

      // Send to Telegram
      const { error: notificationError } = await supabase.functions.invoke('degen-call-notifier', {
        body: {
          analyst_signal_id: signalData.id,
          trigger_type: 'degen_command'
        }
      });

      if (notificationError) {
        console.error('Failed to send Telegram notification:', notificationError);
        toast.success('Degen signal created but failed to send to Telegram');
      } else {
        toast.success('Degen signal created and sent to Telegram!');
      }

      return signalData;
    } catch (error) {
      console.error('Error creating degen signal:', error);
      toast.error('Failed to create degen signal');
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    parseDegenCommand,
    createSignalFromCommand,
    fetchCurrentPrice,
    closePosition,
    isProcessing,
  };
};