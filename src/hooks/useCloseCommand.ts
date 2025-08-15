import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface CloseCommandData {
  ticker: string;
  price?: number;
  reason?: string;
}

export function useCloseCommand() {
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const parseCloseCommand = (message: string): CloseCommandData | null => {
    try {
      console.log('🔍 Parsing close command:', message);
      
      // Remove command trigger and normalize
      const cleanMessage = message.replace(/^[!\/]?close\s*/i, '').trim();
      
      if (!cleanMessage) {
        console.log('❌ Empty command after cleaning');
        return null;
      }

      // Parse close command: !close TICKER [price X] [reason ...]
      const match = cleanMessage.match(/^([A-Za-z0-9\-\.\/]+)(?:\s+(?:price|at)\s+([\d\.]+))?(?:\s+reason\s+(.+))?/i);
      
      if (!match) {
        console.log('❌ No pattern matched for close command:', cleanMessage);
        return null;
      }

      const ticker = match[1].toUpperCase().replace(/^\$/, '');
      const price = match[2] ? parseFloat(match[2]) : undefined;
      const reason = match[3]?.trim();

      const commandData: CloseCommandData = {
        ticker,
        price,
        reason
      };

      console.log('📋 Parsed close command data:', commandData);
      return commandData;

    } catch (error) {
      console.error('❌ Error parsing close command:', error);
      return null;
    }
  };

  const executeCloseCommand = async (commandData: CloseCommandData): Promise<boolean> => {
    try {
      setIsProcessing(true);
      console.log('Closing positions for ticker:', commandData.ticker);

      // Find active signals for this ticker
      const { data: activeSignals, error: fetchError } = await supabase
        .from('live_trading_signals')
        .select('*')
        .eq('ticker', commandData.ticker)
        .eq('status', 'active');

      if (fetchError) {
        console.error('Error fetching active signals:', fetchError);
        toast({
          title: "Error",
          description: `Failed to fetch active signals: ${fetchError.message}`,
          variant: "destructive",
        });
        return false;
      }

      if (!activeSignals || activeSignals.length === 0) {
        toast({
          title: "No Active Positions",
          description: `No active positions found for ${commandData.ticker}`,
          variant: "destructive",
        });
        return false;
      }

      // Close all active signals for this ticker
      const { error: updateError } = await supabase
        .from('live_trading_signals')
        .update({
          status: 'closed',
          // Optionally update current_price if price was provided
          ...(commandData.price && { current_price: commandData.price })
        })
        .eq('ticker', commandData.ticker)
        .eq('status', 'active');

      if (updateError) {
        console.error('Error closing positions:', updateError);
        toast({
          title: "Error",
          description: `Failed to close positions: ${updateError.message}`,
          variant: "destructive",
        });
        return false;
      }

      console.log('✅ Positions closed successfully');
      
      const reasonText = commandData.reason ? ` Reason: ${commandData.reason}` : '';
      const priceText = commandData.price ? ` at $${commandData.price}` : '';
      
      toast({
        title: "Positions Closed",
        description: `Closed ${activeSignals.length} position(s) for ${commandData.ticker}${priceText}.${reasonText}`,
      });

      return true;
    } catch (error) {
      console.error('❌ Unexpected error closing positions:', error);
      toast({
        title: "Error", 
        description: "An unexpected error occurred while closing positions",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    parseCloseCommand,
    executeCloseCommand,
    isProcessing
  };
}