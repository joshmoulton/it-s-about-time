import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

export interface AnalystCallDetection {
  patternId: string;
  extractedData: any;
  confidenceScore: number;
  requiresReview: boolean;
}

export interface ChannelConfig {
  chatId: string;
  analystId: string;
  isMonitoringEnabled: boolean;
  autoProcessCalls: boolean;
  minConfidenceThreshold: number;
}

export class AnalystCallDetector {
  private supabase: ReturnType<typeof createClient>;

  constructor(supabase: ReturnType<typeof createClient>) {
    this.supabase = supabase;
  }

  async detectAnalystCall(messageText: string, chatId: string, telegramMessageId: string, username?: string): Promise<AnalystCallDetection | null> {
    try {
      console.log('🔍 Analyzing message for analyst call patterns...');

      // First check if this is a close command
      if (messageText.trim().toLowerCase().match(/^!close\s+/)) {
        return await this.handleCloseCommand(messageText, chatId, telegramMessageId, username);
      }

      // Check if this is a degen command
      if (messageText.trim().toLowerCase().match(/^!degen\s+/)) {
        return await this.handleDegenCommand(messageText, chatId, telegramMessageId, username);
      }

      // Get channel configuration for regular analyst calls
      const channelConfig = await this.getChannelConfig(chatId);
      if (!channelConfig?.isMonitoringEnabled) {
        console.log('⏭️ Channel monitoring disabled for chat:', chatId);
        return null;
      }

      // Get active patterns for this analyst
      const patterns = await this.getActivePatterns(channelConfig.analystId);
      if (!patterns?.length) {
        console.log('⏭️ No active patterns found for analyst:', channelConfig.analystId);
        return null;
      }

      // Test message against patterns
      let bestMatch: AnalystCallDetection | null = null;
      let highestConfidence = 0;

      for (const pattern of patterns) {
        const detection = await this.testPattern(messageText, pattern, channelConfig);
        if (detection && detection.confidenceScore > highestConfidence) {
          highestConfidence = detection.confidenceScore;
          bestMatch = detection;
        }
      }

      // Only return if confidence meets threshold
      if (bestMatch && bestMatch.confidenceScore >= channelConfig.minConfidenceThreshold) {
        console.log(`✅ Analyst call detected with ${(bestMatch.confidenceScore * 100).toFixed(1)}% confidence`);
        
        // Record the detection
        await this.recordDetection(telegramMessageId, bestMatch, channelConfig);
        
        return bestMatch;
      }

      console.log('⏭️ No high-confidence analyst call detected');
      return null;

    } catch (error) {
      console.error('❌ Error in analyst call detection:', error);
      return null;
    }
  }

  private async getChannelConfig(chatId: string): Promise<ChannelConfig | null> {
    const { data, error } = await this.supabase
      .from('analyst_channel_config')
      .select('*')
      .eq('chat_id', chatId)
      .eq('is_monitoring_enabled', true)
      .single();

    if (error || !data) {
      return null;
    }

    return {
      chatId: data.chat_id,
      analystId: data.analyst_id,
      isMonitoringEnabled: data.is_monitoring_enabled,
      autoProcessCalls: data.auto_process_calls,
      minConfidenceThreshold: data.min_confidence_threshold
    };
  }

  private async getActivePatterns(analystId?: string) {
    let query = this.supabase
      .from('analyst_call_patterns')
      .select('*')
      .eq('is_active', true)
      .order('priority', { ascending: false });

    // If analystId is provided, filter by it, otherwise get all patterns
    if (analystId) {
      query = query.eq('analyst_id', analystId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching patterns:', error);
      return [];
    }

    return data || [];
  }

  private async testPattern(messageText: string, pattern: any, channelConfig: ChannelConfig): Promise<AnalystCallDetection | null> {
    try {
      // Test if message matches the pattern regex
      const regex = new RegExp(pattern.pattern_regex, 'i');
      if (!regex.test(messageText)) {
        return null;
      }

      // Extract trading data using the database function
      const { data: extractedData, error } = await this.supabase
        .rpc('extract_analyst_call_data', {
          message_text: messageText,
          pattern_config: pattern.extraction_config || {}
        });

      if (error) {
        console.error('Error extracting data:', error);
        return null;
      }

      // Calculate confidence score
      const { data: confidenceScore, error: confError } = await this.supabase
        .rpc('calculate_detection_confidence', {
          message_text: messageText,
          extracted_data: extractedData
        });

      if (confError) {
        console.error('Error calculating confidence:', confError);
        return null;
      }

      // For configured analysts with auto-processing enabled, skip review requirement
      const requiresReview = channelConfig.autoProcessCalls ? false : confidenceScore < 0.9;

      return {
        patternId: pattern.id,
        extractedData,
        confidenceScore: confidenceScore || 0,
        requiresReview
      };

    } catch (error) {
      console.error('Error testing pattern:', error);
      return null;
    }
  }

  private async recordDetection(telegramMessageId: string, detection: AnalystCallDetection, channelConfig: ChannelConfig) {
    try {
      // Get the telegram message UUID
      const { data: messageData, error: msgError } = await this.supabase
        .from('telegram_messages')
        .select('id')
        .eq('telegram_message_id', telegramMessageId)
        .single();

      if (msgError || !messageData) {
        console.error('Could not find telegram message:', msgError);
        return;
      }

      // Record the detection
      const { error } = await this.supabase
        .from('analyst_call_detections')
        .insert({
          telegram_message_id: messageData.id,
          pattern_id: detection.patternId,
          extracted_data: detection.extractedData,
          confidence_score: detection.confidenceScore,
          auto_processed: channelConfig.autoProcessCalls && !detection.requiresReview,
          requires_review: detection.requiresReview
        });

      if (error) {
        console.error('Error recording detection:', error);
      } else {
        console.log('✅ Detection recorded successfully');
      }

    } catch (error) {
      console.error('Error recording detection:', error);
    }
  }

  async processDetection(detectionId: string): Promise<string | null> {
    try {
      console.log('🔄 Processing analyst call detection:', detectionId);

      // Get the detection data
      const { data: detection, error } = await this.supabase
        .from('analyst_call_detections')
        .select(`
          *,
          analyst_call_patterns!inner(analyst_id)
        `)
        .eq('id', detectionId)
        .single();

      if (error || !detection) {
        console.error('Detection not found:', error);
        return null;
      }

      // Create analyst signal
      const signalData = {
        analyst_id: detection.analyst_call_patterns.analyst_id,
        ticker: detection.extracted_data.symbol || 'UNKNOWN',
        market: detection.extracted_data.market || 'crypto',
        trade_direction: detection.extracted_data.trade_direction || 'long',
        entry_type: detection.extracted_data.entry_type || 'market',
        entry_price: detection.extracted_data.entry_price,
        stop_loss_price: detection.extracted_data.stop_loss_price,
        targets: detection.extracted_data.targets,
        risk_percentage: detection.extracted_data.risk_percentage || 2,
        full_description: `Auto-detected analyst call with ${(detection.confidence_score * 100).toFixed(1)}% confidence`,
        status: 'active',
        posted_to_telegram: false
      };

      const { data: signal, error: signalError } = await this.supabase
        .from('analyst_signals')
        .insert(signalData)
        .select()
        .single();

      if (signalError || !signal) {
        console.error('Error creating analyst signal:', signalError);
        return null;
      }

      // Update detection with signal reference
      await this.supabase
        .from('analyst_call_detections')
        .update({
          analyst_signal_id: signal.id,
          auto_processed: true
        })
        .eq('id', detectionId);

      console.log('✅ Analyst signal created:', signal.id);
      return signal.id;

    } catch (error) {
      console.error('Error processing detection:', error);
      return null;
    }
  }

  async triggerDegenCallNotification(analystSignalId: string): Promise<boolean> {
    try {
      console.log('📢 Triggering degen call notification for signal:', analystSignalId);

      // Call the existing degen-call-notifier function
      const { data, error } = await this.supabase.functions.invoke('degen-call-notifier', {
        body: {
          analyst_signal_id: analystSignalId,
          trigger_type: 'auto_detected'
        }
      });

      if (error) {
        console.error('Error triggering degen call notification:', error);
        return false;
      }

      console.log('✅ Degen call notification triggered successfully');
      return data?.success || false;

    } catch (error) {
      console.error('Error triggering notification:', error);
      return false;
    }
  }

  private async handleCloseCommand(messageText: string, chatId: string, telegramMessageId: string, username?: string): Promise<AnalystCallDetection | null> {
    try {
      console.log('🚫 Processing close command:', messageText);

      // Extract ticker from close command
      const closeMatch = messageText.trim().match(/^!close\s+([A-Za-z]+)/i);
      if (!closeMatch) {
        console.log('❌ Invalid close command format');
        return null;
      }

      const ticker = closeMatch[1].toUpperCase();
      console.log(`🎯 Looking for active ${ticker} calls to close`);

      // Get close pattern from database
      const { data: closePattern } = await this.supabase
        .from('analyst_call_patterns')
        .select('*')
        .eq('pattern_name', 'Close Command Pattern')
        .eq('is_active', true)
        .single();

      if (!closePattern) {
        console.log('⚠️ No close command pattern found');
        return null;
      }

      // Find active signals for this ticker
      const { data: activeSignals, error: findError } = await this.supabase
        .from('analyst_signals')
        .select('id, ticker, analyst_name, created_at')
        .eq('ticker', ticker)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (findError) {
        console.error('❌ Error finding active signals:', findError);
        return null;
      }

      if (!activeSignals || activeSignals.length === 0) {
        console.log(`⚠️ No active signals found for ticker: ${ticker}`);
        return {
          patternId: closePattern.id,
          extractedData: {
            ticker,
            action: 'close',
            result: 'no_active_signals',
            message: `No active signals found for ${ticker}`
          },
          confidenceScore: 1.0,
          requiresReview: false
        };
      }

      // Check if the user is authorized to close these calls
      // Only the original analyst or the same username can close
      const authorizedSignals = activeSignals.filter(signal => 
        signal.analyst_name === username || 
        signal.analyst_name === `@${username}` ||
        username === 'iamjoshmoulton' // Special case for main analyst
      );

      if (authorizedSignals.length === 0) {
        console.log(`❌ User ${username} not authorized to close ${ticker} calls`);
        return {
          patternId: closePattern.id,
          extractedData: {
            ticker,
            action: 'close',
            result: 'unauthorized',
            message: `Only the original caller can close ${ticker} signals. Found ${activeSignals.length} active signal(s) by: ${activeSignals.map(s => s.analyst_name).join(', ')}`
          },
          confidenceScore: 1.0,
          requiresReview: false
        };
      }

      // Close the authorized signals
      const signalIds = authorizedSignals.map(s => s.id);
      const { data: closedSignals, error: closeError } = await this.supabase
        .from('analyst_signals')
        .update({
          status: 'closed',
          updated_at: new Date().toISOString()
        })
        .in('id', signalIds)
        .select('id, ticker, analyst_name');

      if (closeError) {
        console.error('❌ Error closing signals:', closeError);
        return null;
      }

      const closedCount = closedSignals?.length || 0;
      console.log(`✅ Closed ${closedCount} signals for ${ticker} by ${username}`);

      return {
        patternId: closePattern.id,
        extractedData: {
          ticker,
          action: 'close',
          result: 'success',
          closed_count: closedCount,
          closed_by: username,
          message: `Successfully closed ${closedCount} ${ticker} signal(s)`
        },
        confidenceScore: 1.0,
        requiresReview: false
      };

    } catch (error) {
      console.error('❌ Error handling close command:', error);
      return null;
    }
  }

  private async handleDegenCommand(messageText: string, chatId: string, telegramMessageId: string, username?: string): Promise<AnalystCallDetection | null> {
    try {
      console.log('🎯 Processing degen command:', messageText);

      // Parse degen command format: !degen [direction] TICKER [params in any order]
      // Also support: !degen TICKER [direction] [params]
      const degenMatch = messageText.match(/!degen\s+(?:(long|short)\s+([A-Za-z0-9]+)|([A-Za-z0-9]+)\s*(?:(long|short))?)(?:\s+(.+))?/i);
      
      if (!degenMatch) {
        console.log('❌ Invalid degen command format');
        return null;
      }

      let direction: string, ticker: string, additionalParams: string | undefined;
      
      if (degenMatch[1] && degenMatch[2]) {
        // Format: !degen long/short TICKER [params]
        direction = degenMatch[1];
        ticker = degenMatch[2];
        additionalParams = degenMatch[5];
      } else if (degenMatch[3]) {
        // Format: !degen TICKER [direction] [params]
        ticker = degenMatch[3];
        direction = degenMatch[4] || 'long'; // Default to long
        additionalParams = degenMatch[5];
      } else {
        console.log('❌ Could not parse degen command structure');
        return null;
      }
      const tickerUpper = ticker.toUpperCase();
      console.log(`🎯 Parsed degen command: ${direction} ${tickerUpper}`);
      console.log(`📝 Additional params: ${additionalParams}`);

      // Initialize variables
      let entryPrice: number | undefined;
      let stopLoss: number | undefined;
      let targets: number[] = [];
      let sizeLevel = 'med'; // Default size
      let riskLevel = 2.5; // Default risk percentage

      // Parse additional parameters if provided
      let foundExplicitSize = false;
      if (additionalParams) {
        const params = additionalParams.trim().toLowerCase();
        console.log(`🔍 Parsing params: "${params}"`);
        
        // Look for entry price - matches "entry 3.47"
        const entryMatch = params.match(/entry\s+([0-9.]+)/i);
        if (entryMatch) {
          entryPrice = parseFloat(entryMatch[1]);
          console.log(`📊 Found entry price: ${entryPrice}`);
        }

        // Look for stop loss - matches "stop 2.94"
        const stopMatch = params.match(/stop\s+([0-9.]+)/i);
        if (stopMatch) {
          stopLoss = parseFloat(stopMatch[1]);
          console.log(`🛑 Found stop loss: ${stopLoss}`);
        }

        // Look for targets - matches "target 4.28"
        const targetMatch = params.match(/target\s+([0-9.]+)/i);
        if (targetMatch) {
          targets = [parseFloat(targetMatch[1])];
          console.log(`🎯 Found target: ${targets}`);
        }

        // Look for size - matches "size high", "size med", etc.
        const sizeMatch = params.match(/size\s+(tiny|low|med|high|huge)/i);
        if (sizeMatch) {
          foundExplicitSize = true;
          sizeLevel = sizeMatch[1].toLowerCase();
          console.log(`📏 Found size: ${sizeLevel}`);
          
          // Convert size to risk percentage
          switch (sizeLevel) {
            case 'tiny': riskLevel = 0.5; break;
            case 'low': riskLevel = 1.0; break;
            case 'med': riskLevel = 2.5; break;
            case 'high': riskLevel = 5.0; break;
            case 'huge': riskLevel = 10.0; break;
            default: riskLevel = 2.5;
          }
          console.log(`⚖️ Converted to risk level: ${riskLevel}%`);
        }
      }
      
      // If no explicit size was provided, set to null/undefined for UI
      if (!foundExplicitSize) {
        sizeLevel = 'N/A';
      }

      // Fetch current price if no entry price provided
      let currentPrice: number | undefined;
      if (!entryPrice) {
        try {
          console.log(`💰 Fetching current price for ${ticker}...`);
          
          // Use the GET request format that the crypto-pricing function expects
          const response = await fetch(`https://wrvvlmevpvcenauglcyz.supabase.co/functions/v1/crypto-pricing?ticker=${ticker.toUpperCase()}`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`,
              'Content-Type': 'application/json'
            }
          });
          
          const data = await response.json();

          if (response.ok && data?.price) {
            currentPrice = data.price;
            entryPrice = currentPrice;
            console.log(`✅ Fetched current price for ${ticker}: $${currentPrice}`);
          } else {
            console.error(`❌ Could not fetch price for ${ticker}:`, data);
          }
        } catch (priceError) {
          console.error(`❌ Error fetching price for ${ticker}:`, priceError);
        }
      }

      // Before creating a new signal, close any existing active signals for this ticker
      console.log(`🔍 Checking for existing active signals for ${tickerUpper}...`);
      
      const { data: existingSignals, error: findError } = await this.supabase
        .from('analyst_signals')
        .select('id, analyst_name, created_at')
        .eq('ticker', tickerUpper)
        .eq('status', 'active');

      if (findError) {
        console.error('❌ Error finding existing signals:', findError);
      } else if (existingSignals && existingSignals.length > 0) {
        console.log(`🚫 Found ${existingSignals.length} existing active signal(s) for ${tickerUpper}, closing them...`);
        
        // Close existing signals
        const signalIds = existingSignals.map(s => s.id);
        const { error: closeError } = await this.supabase
          .from('analyst_signals')
          .update({
            status: 'closed',
            updated_at: new Date().toISOString()
          })
          .in('id', signalIds);

        if (closeError) {
          console.error('❌ Error closing existing signals:', closeError);
        } else {
          console.log(`✅ Closed ${existingSignals.length} existing signal(s) for ${tickerUpper}`);
        }
      } else {
        console.log(`✅ No existing active signals found for ${tickerUpper}`);
      }

      // Create analyst signal with size stored in entry_conditions field
      const signalData = {
        analyst_name: username || 'Degen Caller',
        market: 'crypto' as any,
        trade_type: 'spot' as any,
        trade_direction: direction.toLowerCase() as any,
        ticker: tickerUpper,
        risk_percentage: riskLevel,
        entry_type: 'market' as any,
        entry_price: entryPrice,
        risk_management: 'stop_loss' as any,
        stop_loss_price: stopLoss,
        targets: targets.map(t => t.toString()),
        full_description: `Degen call for ${ticker} ${direction}`,
        entry_conditions: foundExplicitSize ? sizeLevel : null, // Only store size if explicitly provided
        formatted_output: this.generateFormattedOutput(ticker, direction, entryPrice, stopLoss, targets, currentPrice),
        status: 'active',
        posted_to_telegram: false
      };

      console.log('📊 Creating analyst signal:', signalData);

      const { data: signal, error: signalError } = await this.supabase
        .from('analyst_signals')
        .insert(signalData)
        .select()
        .single();

      if (signalError || !signal) {
        console.error('❌ Error creating analyst signal:', signalError);
        return null;
      }

      console.log('✅ Degen signal created:', signal.id);

      // Trigger notification and update posted_to_telegram flag
      const notificationResult = await this.triggerDegenCallNotification(signal.id);
      console.log('📱 Notification result:', notificationResult);

      return {
        patternId: 'degen-command',
        extractedData: {
          ticker,
          direction,
          entryPrice: entryPrice,
          stopLoss,
          targets,
          currentPrice,
          signalId: signal.id
        },
        confidenceScore: 1.0,
        requiresReview: false
      };

    } catch (error) {
      console.error('❌ Error handling degen command:', error);
      return null;
    }
  }

  private generateFormattedOutput(ticker: string, direction: string, entryPrice?: number, stopLoss?: number, targets?: number[], currentPrice?: number): string {
    const entryDisplay = entryPrice?.toString() || 'Market';
    const stopDisplay = stopLoss?.toString() || 'N/A';
    const targetsDisplay = targets && targets.length > 0 ? targets.join(', ') : 'N/A';

    return `MARKET: CRYPTO ${ticker} SPOT ${direction.toUpperCase()}

Entry: ${entryDisplay}${currentPrice ? ' (Current Price)' : ''}
Invalidation: ${stopDisplay}
Targets: ${targetsDisplay}

Risk: 2.5%

Degen call for ${ticker} ${direction}`;
  }
}