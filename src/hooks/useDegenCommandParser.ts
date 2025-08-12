import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface DegenCommandData {
  ticker: string;
  direction: 'long' | 'short';
  entryPrice?: number;
  stopLoss?: number;
  targets?: number[];
  currentPrice?: number;
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
      const { data, error } = await supabase.functions.invoke('coingecko-proxy', {
        body: { coin: ticker.toUpperCase() }
      });

      if (error) {
        console.error('Error fetching price:', error);
        return null;
      }

      const response = data as CoinGeckoResponse;
      if (response.hasError || !response.price) {
        console.error('Invalid price response:', response);
        return null;
      }

      return response.price;
    } catch (error) {
      console.error('Failed to fetch current price:', error);
      return null;
    }
  };

  const parseDegenCommand = async (message: string): Promise<DegenCommandData | null> => {
    // Clean up the message
    const cleanMessage = message.trim();
    console.log('Parsing degen command:', cleanMessage);
    
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

    // If no entry price provided, fetch current price from CoinGecko
    if (!commandData.entryPrice) {
      const currentPrice = await fetchCurrentPrice(ticker);
      if (currentPrice) {
        commandData.currentPrice = currentPrice;
        commandData.entryPrice = currentPrice;
        toast.success(`Current ${ticker} price: $${currentPrice.toFixed(4)}`);
      } else {
        toast.error(`Could not fetch current price for ${ticker}`);
      }
    }

    return commandData;
  };

  const createSignalFromCommand = async (commandData: DegenCommandData, analystName: string = 'Degen Caller') => {
    setIsProcessing(true);
    try {
      const targets = commandData.targets || [];
      const entryDisplay = commandData.entryPrice?.toString() || 'Market';
      const stopDisplay = commandData.stopLoss?.toString() || 'N/A';
      const targetsDisplay = targets.length > 0 ? targets.join(', ') : 'N/A';

      const formattedOutput = `MARKET: CRYPTO ${commandData.ticker} SPOT ${commandData.direction.toUpperCase()}

Entry: ${entryDisplay}${commandData.currentPrice ? ' (Current Price)' : ''}
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
    isProcessing,
  };
};