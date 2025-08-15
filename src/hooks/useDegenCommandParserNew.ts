import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// Data structures
interface DegenCommandData {
  ticker: string;
  direction: 'long' | 'short';
  entry_price?: number;
  stop_loss?: number;
  targets: number[];
  size_level?: string;
  entry_type?: 'market' | 'limit' | 'conditional';
  reasoning?: string;
}

interface CoinGeckoResponse {
  price: number;
  change24h: number;
  coinGeckoId: string;
  hasError: boolean;
  lastUpdated: string;
  cached: boolean;
}

export function useDegenCommandParser() {
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  // Fetch current price from Supabase function
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

  // Size level mapping
  const SIZE_ALIASES = {
    "tiny": "tiny",
    "small": "low", 
    "low": "low",
    "med": "med",
    "medium": "med", 
    "avg": "med",
    "high": "high",
    "huge": "huge",
    "xl": "huge"
  };

  const normalizeSize = (val: string | null): string | undefined => {
    if (!val) return undefined;
    const normalized = val.toLowerCase();
    return SIZE_ALIASES[normalized as keyof typeof SIZE_ALIASES] || undefined;
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
        // Pattern 1: !degen supporting long/short TICKER [market/limit/conditional] [entry X] [stop X] [targets X, Y, Z] [size tiny/low/med/high/huge] [reason ...]
        /^supporting\s+(long|short)\s+([A-Za-z0-9\-\.\/]+)(?:\s+(market|limit|conditional))?(?:\s+entry\s+([\d\.]+))?(?:\s+stop\s+([\d\.]+))?(?:\s+targets?\s+([\d\.,\s]+))?(?:\s+size\s+(tiny|small|low|med|medium|avg|high|huge|xl))?(?:\s+(?:reason|because)\s+(.+))?/i,
        
        // Pattern 2: !degen long/short TICKER [market/limit/conditional] [entry X] [stop X] [targets X, Y, Z] [size X] [reason ...]
        /^(long|short)\s+([A-Za-z0-9\-\.\/]+)(?:\s+(market|limit|conditional))?(?:\s+entry\s+([\d\.]+))?(?:\s+stop\s+([\d\.]+))?(?:\s+targets?\s+([\d\.,\s]+))?(?:\s+size\s+(tiny|small|low|med|medium|avg|high|huge|xl))?(?:\s+(?:reason|because)\s+(.+))?/i,
        
        // Pattern 3: !degen TICKER long/short [market/limit/conditional] [entry X] [stop X] [targets X, Y, Z] [size X] [reason ...]
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
      let ticker: string;
      let entryType: 'market' | 'limit' | 'conditional' | undefined;
      let entryPriceStr: string | undefined;
      let stopLossStr: string | undefined;  
      let targetsStr: string | undefined;
      let sizeStr: string | undefined;
      let reasoning: string | undefined;

      // Extract data based on pattern
      if (patternIndex === 0) { // supporting long/short TICKER
        direction = match[1].toLowerCase() as 'long' | 'short';
        ticker = match[2].toUpperCase();
        entryType = match[3]?.toLowerCase() as 'market' | 'limit' | 'conditional' | undefined;
        entryPriceStr = match[4];
        stopLossStr = match[5];
        targetsStr = match[6];
        sizeStr = match[7];
        reasoning = match[8]?.trim();
      } else if (patternIndex === 1) { // long/short TICKER  
        direction = match[1].toLowerCase() as 'long' | 'short';
        ticker = match[2].toUpperCase();
        entryType = match[3]?.toLowerCase() as 'market' | 'limit' | 'conditional' | undefined;
        entryPriceStr = match[4];
        stopLossStr = match[5];
        targetsStr = match[6];
        sizeStr = match[7];
        reasoning = match[8]?.trim();
      } else { // TICKER long/short
        ticker = match[1].toUpperCase();
        direction = match[2].toLowerCase() as 'long' | 'short';
        entryType = match[3]?.toLowerCase() as 'market' | 'limit' | 'conditional' | undefined;
        entryPriceStr = match[4];
        stopLossStr = match[5];
        targetsStr = match[6];
        sizeStr = match[7];
        reasoning = match[8]?.trim();
      }

      // Clean ticker (remove leading $ if present)
      ticker = ticker.replace(/^\$/, '');

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
        const currentPrice = await fetchCurrentPrice(ticker);
        if (currentPrice) {
          entry_price = currentPrice;
          console.log(`📈 Fetched current price for ${ticker}: $${currentPrice}`);
        }
      }

      // Parse stop loss
      const stop_loss = stopLossStr ? parseFloat(stopLossStr) : undefined;

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
        ticker,
        direction,
        entry_price,
        stop_loss,
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

      const { data: signalData, error } = await supabase
        .from('live_trading_signals')
        .insert({
          ticker: commandData.ticker,
          direction: commandData.direction,
          entry_type: commandData.entry_type || 'market',
          entry_price: commandData.entry_price,
          current_price: commandData.entry_price,
          stop_loss_price: commandData.stop_loss,
          targets: commandData.targets,
          risk_score: 5,
          reasoning: commandData.reasoning || `${commandData.direction.toUpperCase()} ${commandData.ticker} - Official signal generated from command`,
          status: 'active',
        })
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

      console.log('✅ Official signal created successfully:', signalData);
      
      toast({
        title: "Official Signal Created",
        description: `${commandData.direction.toUpperCase()} ${commandData.ticker} signal created successfully`,
      });

      return signalData;
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

  // Close position by ticker
  const closePosition = async (ticker: string): Promise<void> => {
    try {
      setIsProcessing(true);
      console.log('Closing positions for ticker:', ticker);

      // Find active signals for this ticker
      const { data: activeSignals, error: fetchError } = await supabase
        .from('live_trading_signals')
        .select('*')
        .eq('ticker', ticker.toUpperCase())
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
          description: `No active positions found for ${ticker}`,
          variant: "destructive",
        });
        return;
      }

      // Close all active signals for this ticker
      const { error: updateError } = await supabase
        .from('live_trading_signals')
        .update({
          status: 'closed',
        })
        .eq('ticker', ticker.toUpperCase())
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
        description: `Closed ${activeSignals.length} position(s) for ${ticker} successfully`,
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

      const { data: signalData, error } = await supabase
        .from('live_trading_signals')
        .insert({
          ticker: commandData.ticker,
          direction: commandData.direction,
          entry_type: commandData.entry_type || 'market',
          entry_price: commandData.entry_price,
          current_price: commandData.entry_price,
          stop_loss_price: commandData.stop_loss,
          targets: commandData.targets,
          risk_score: 10,
          reasoning: commandData.reasoning || `${commandData.direction.toUpperCase()} ${commandData.ticker} - Degen call generated from command`,
          status: 'active',
        })
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

      console.log('✅ Signal created successfully:', signalData);
      
      // Send notification to Telegram
      await supabase.functions.invoke('send-degen-notification', {
        body: { 
          signalId: signalData.id,
          ticker: commandData.ticker,
          direction: commandData.direction,
          entryPrice: commandData.entry_price,
          stopLoss: commandData.stop_loss,
          targets: commandData.targets,
          sizeLevel: commandData.size_level,
          entryType: commandData.entry_type,
          reasoning: commandData.reasoning
        }
      });
      
      toast({
        title: "Degen Signal Created & Sent",
        description: `${commandData.direction.toUpperCase()} ${commandData.ticker} signal sent to Telegram successfully`,
      });

      return signalData;
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