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

  async detectAnalystCall(messageText: string, chatId: string, telegramMessageId: string): Promise<AnalystCallDetection | null> {
    try {
      console.log('🔍 Analyzing message for analyst call patterns...');

      // Get channel configuration
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

  private async getActivePatterns(analystId: string) {
    const { data, error } = await this.supabase
      .from('analyst_call_patterns')
      .select('*')
      .eq('analyst_id', analystId)
      .eq('is_active', true)
      .order('priority', { ascending: false });

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
}