
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// Data structures
interface DegenCommandData {
  symbol: string;
  direction: 'long' | 'short';
  entry_price?: number;
  stop_loss_price?: number;
  targets: number[];
  size_level?: 'tiny' | 'low' | 'med' | 'high' | 'huge';
  entry_type?: 'market' | 'limit' | 'conditional' | 'trigger';
  reasoning?: string;
}

export function useDegenCommandParser() {
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  // Fetch current price from Supabase function
  const fetchCurrentPrice = async (symbol: string): Promise<number | null> => {
    try {
      const { data, error } = await supabase.functions.invoke('crypto-pricing', {
        body: { 
          action: 'fetch_prices',
          tickers: [symbol.toUpperCase()] 
        }
      });

      if (error) {
        console.error('Error fetching price:', error);
        return null;
      }

      if (data.success && data.prices && data.prices.length > 0) {
        const priceData = data.prices[0];
        console.log('✅ Fetched current price for', symbol, ':', priceData.price);
        return priceData.price;
      }

      console.error('No price data found for symbol:', symbol);
      return null;
    } catch (error) {
      console.error('Failed to fetch current price:', error);
      return null;
    }
  };

  // Normalize to our canonical set: tiny | low | med | high | huge
  const SIZE_ALIASES: Record<string, 'tiny' | 'low' | 'med' | 'high' | 'huge'> = {
    tiny: 'tiny',
    small: 'low', low: 'low',
    med: 'med', medium: 'med', avg: 'med',
    high: 'high',
    huge: 'huge', xl: 'huge', xlarge: 'huge'
  };

  const normalizeSize = (val: string | null): 'tiny' | 'low' | 'med' | 'high' | 'huge' => {
    if (!val) return 'med';
    const normalized = val.toLowerCase();
    return SIZE_ALIASES[normalized] ?? 'med';
  };

  // Parse different command formats
  const parseDegenCommand = async (message: string): Promise<DegenCommandData | null> => {
    try {
      console.log('🔍 Parsing command:', message);
      
      // Remove command trigger and normalize
      const cleanMessage = message.replace(/^[!\/]?(degen|official)\s*/i, '').trim();
      
      if (!cleanMessage) {
        console.log('❌ Empty command after cleaning');
        return null;
      }

      // Enhanced regex patterns to match Python bot capabilities
      const patterns = [
        // Pattern 1: !degen long/short TICKER [market/limit/conditional] [entry X] [stop X] [targets X, Y, Z] [size X] [reason ...]
        /^(long|short)\s+([A-Za-z0-9\-\.\/]+)(?:\s+(market|limit|conditional))?(?:\s+entry\s+([\d\.]+))?(?:\s+stop\s+([\d\.]+))?(?:\s+targets?\s+([\d\.,\s]+))?(?:\s+size\s+(tiny|small|low|med|medium|avg|high|huge|xl))?(?:\s+(?:reason|because)\s+(.+))?/i,
        
        // Pattern 2: !degen TICKER long/short [market/limit/conditional] [entry X] [stop X] [targets X, Y, Z] [size X] [reason ...]
        /^([A-Za-z0-9\-\.\/]+)\s+(long|short)(?:\s+(market|limit|conditional))?(?:\s+entry\s+([\d\.]+))?(?:\s+stop\s+([\d\.]+))?(?:\s+targets?\s+([\d\.,\s]+))?(?:\s+size\s+(tiny|small|low|med|medium|avg|high|huge|xl))?(?:\s+(?:reason|because)\s+(.+))?/i,
      ];

      let match = null;
      let patternIndex = -1;
      
      for (let i = 0; i < patterns.length; i++) {
        match = cleanMessage.match(patterns[i]);
        if (match) {
          patternIndex = i;
          break;
        }
      }

      if (!match) {
        console.log('❌ No pattern matched for:', cleanMessage);
        return null;
      }

      console.log('✅ Pattern', patternIndex + 1, 'matched:', match);

      let direction: 'long' | 'short';
      let symbol: string;
      let entryType: 'market' | 'limit' | 'conditional' | undefined;
      let entryPriceStr: string | undefined;
      let stopLossStr: string | undefined;  
      let targetsStr: string | undefined;
      let sizeStr: string | undefined;
      let reasoning: string | undefined;

      // Extract data based on pattern  
      if (patternIndex === 0) { // long/short TICKER
        direction = match[1].toLowerCase() as 'long' | 'short';
        symbol = match[2].toUpperCase();
        entryType = match[3]?.toLowerCase() as 'market' | 'limit' | 'conditional' | undefined;
        entryPriceStr = match[4];
        stopLossStr = match[5];
        targetsStr = match[6];
        sizeStr = match[7];
        reasoning = match[8]?.trim();
      } else { // TICKER long/short
        symbol = match[1].toUpperCase();
        direction = match[2].toLowerCase() as 'long' | 'short';
        entryType = match[3]?.toLowerCase() as 'market' | 'limit' | 'conditional' | undefined;
        entryPriceStr = match[4];
        stopLossStr = match[5];
        targetsStr = match[6];
        sizeStr = match[7];
        reasoning = match[8]?.trim();
      }

      // Clean symbol (remove leading $ if present)
      symbol = symbol.replace(/^\$/, '');

      // Default to market entry type if not specified
      if (!entryType) {
        entryType = 'market';
      }

      // Parse entry price (fetch current price if not provided)
      let entry_price: number | undefined;
      if (entryPriceStr) {
        entry_price = parseFloat(entryPriceStr);
      } else {
        // Fetch current price
        const currentPrice = await fetchCurrentPrice(symbol);
        if (currentPrice) {
          entry_price = currentPrice;
          console.log(`📈 Fetched current price for ${symbol}: $${currentPrice}`);
        }
      }

      // Parse stop loss
      const stop_loss_price = stopLossStr ? parseFloat(stopLossStr) : undefined;

      // Parse targets
      const targets: number[] = [];
      if (targetsStr) {
        const targetMatches = targetsStr.match(/[\d\.]+/g);
        if (targetMatches) {
          targets.push(...targetMatches.map(t => parseFloat(t)));
        }
      }

      // Parse size level
      const size_level = normalizeSize(sizeStr);

      const commandData: DegenCommandData = {
        symbol,
        direction,
        entry_price,
        stop_loss_price,
        targets,
        size_level,
        entry_type: entryType,
        reasoning
      };

      console.log('📋 Parsed command data:', commandData);
      return commandData;

    } catch (error) {
      console.error('❌ Error parsing degen command:', error);
      return null;
    }
  };

  // Create official signal from command data
  const createOfficialSignal = async (commandData: DegenCommandData, analystName: string = 'Official Analyst'): Promise<any> => {
    try {
      setIsProcessing(true);
      console.log('Creating official signal with data:', commandData);

      // Map to correct database field names for live_trading_signals table
      const signalData = {
        id: crypto.randomUUID(),            // ✅ required by types
        ticker: commandData.symbol,
        direction: commandData.direction,
        entry_type: commandData.entry_type || 'market',
        entry_price: commandData.entry_price || 0,
        current_price: commandData.entry_price || 0,
        stop_loss_price: commandData.stop_loss_price || 0,
        targets: commandData.targets || [],
        size_level: commandData.size_level || 'med',
        risk_score: 5, // Medium risk for official signals
        reasoning: commandData.reasoning || `${commandData.direction.toUpperCase()} ${commandData.symbol} - Official signal generated from command`,
        status: 'active' as const,
        // Additional fields that may be required by the schema
        analyst_id: null,
        confidence_score: 85,
        current_profit_pct: 0,
        targets_hit: 0,
        is_active: true,
        created_by_bot: true,
        telegram_message_id: null,
        close_price: null,
        close_reason: null,
        profit_loss: 0,
        profit_loss_pct: 0,
        max_profit_pct: 0,
        max_loss_pct: 0,
        duration_minutes: null,
        notes: null,
        metadata: {}
      };

      const { data: signalResult, error } = await supabase
        .from('live_trading_signals')
        .insert(signalData)
        .select()
        .single();

      if (error) {
        console.error('Error creating official signal:', error);
        toast({
          title: "Error",
          description: `Failed to create official signal: ${error.message}`,
          variant: "destructive",
        });
        return null;
      }

      console.log('✅ Official signal created successfully:', signalResult);
      
      toast({
        title: "Official Signal Created",
        description: `${commandData.direction.toUpperCase()} ${commandData.symbol} signal created successfully`,
      });

      return signalResult;
    } catch (error) {
      console.error('❌ Unexpected error creating official signal:', error);
      toast({
        title: "Error", 
        description: "An unexpected error occurred while creating the official signal",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsProcessing(false);
    }
  };

  // Close position by symbol
  const closePosition = async (symbol: string): Promise<void> => {
    try {
      setIsProcessing(true);
      console.log('Closing positions for symbol:', symbol);

      // Find active signals for this symbol
      const { data: activeSignals, error: fetchError } = await supabase
        .from('live_trading_signals')
        .select('*')
        .eq('ticker', symbol.toUpperCase()) // Use ticker field
        .eq('status', 'active');

      if (fetchError) {
        console.error('Error fetching active signals:', fetchError);
        toast({
          title: "Error",
          description: `Failed to fetch active signals: ${fetchError.message}`,
          variant: "destructive",
        });
        return;
      }

      if (!activeSignals || activeSignals.length === 0) {
        toast({
          title: "No Active Positions",
          description: `No active positions found for ${symbol}`,
          variant: "destructive",
        });
        return;
      }

      // Close all active signals for this symbol
      const { error: updateError } = await supabase
        .from('live_trading_signals')
        .update({
          status: 'closed',
          close_reason: 'Manual close command',
        })
        .eq('ticker', symbol.toUpperCase()) // Use ticker field
        .eq('status', 'active');

      if (updateError) {
        console.error('Error closing positions:', updateError);
        toast({
          title: "Error",
          description: `Failed to close positions: ${updateError.message}`,
          variant: "destructive",
        });
        return;
      }

      console.log('✅ Positions closed successfully');
      
      toast({
        title: "Positions Closed",
        description: `Closed ${activeSignals.length} position(s) for ${symbol} successfully`,
      });

    } catch (error) {
      console.error('❌ Unexpected error closing positions:', error);
      toast({
        title: "Error", 
        description: "An unexpected error occurred while closing positions",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Create signal from degen command data  
  const createSignalFromCommand = async (commandData: DegenCommandData, analystName: string = 'Degen Caller'): Promise<any> => {
    try {
      setIsProcessing(true);
      console.log('Creating signal with data:', commandData);

      // Map to correct database field names for live_trading_signals table
      const signalData = {
        id: crypto.randomUUID(),            // ✅ required by types
        ticker: commandData.symbol,
        direction: commandData.direction,
        entry_type: commandData.entry_type || 'market',
        entry_price: commandData.entry_price || 0,
        current_price: commandData.entry_price || 0,
        stop_loss_price: commandData.stop_loss_price || 0,
        targets: commandData.targets || [],
        size_level: commandData.size_level || 'med',
        risk_score: 10, // High risk for degen calls
        reasoning: commandData.reasoning || `${commandData.direction.toUpperCase()} ${commandData.symbol} - Degen call generated from command`,
        status: 'active' as const,
        // Additional fields that may be required by the schema
        analyst_id: null,
        confidence_score: 70,
        current_profit_pct: 0,
        targets_hit: 0,
        is_active: true,
        created_by_bot: true,
        telegram_message_id: null,
        close_price: null,
        close_reason: null,
        profit_loss: 0,
        profit_loss_pct: 0,
        max_profit_pct: 0,
        max_loss_pct: 0,
        duration_minutes: null,
        notes: null,
        metadata: {}
      };

      const { data: signalResult, error } = await supabase
        .from('live_trading_signals')
        .insert(signalData)
        .select()
        .single();

      if (error) {
        console.error('Error creating signal:', error);
        toast({
          title: "Error",
          description: `Failed to create signal: ${error.message}`,
          variant: "destructive",
        });
        return null;
      }

      console.log('✅ Signal created successfully:', signalResult);
      
      // Send notification to Telegram
      await supabase.functions.invoke('send-degen-notification', {
        body: { 
          signalId: signalResult.id,
          symbol: commandData.symbol,
          direction: commandData.direction,
          entryPrice: commandData.entry_price,
          stopLoss: commandData.stop_loss_price,
          targets: commandData.targets,
          sizeLevel: commandData.size_level,
          entryType: commandData.entry_type,
          reasoning: commandData.reasoning
        }
      });
      
      toast({
        title: "Degen Signal Created & Sent",
        description: `${commandData.direction.toUpperCase()} ${commandData.symbol} signal sent to Telegram successfully`,
      });

      return signalResult;
    } catch (error) {
      console.error('❌ Unexpected error creating signal:', error);
      toast({
        title: "Error", 
        description: "An unexpected error occurred while creating the signal",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    parseDegenCommand,
    createSignalFromCommand,
    createOfficialSignal,
    fetchCurrentPrice,
    closePosition,
    isProcessing,
  };
}
