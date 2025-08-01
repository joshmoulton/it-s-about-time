import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://cdn.skypack.dev/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseKey);

interface SentimentAnalysisRequest {
  messageText: string;
  messageId?: string;
  telegramMessageId?: string;
  batchMode?: boolean;
  messages?: Array<{
    id: string;
    message_text: string;
    telegram_message_id?: string;
  }>;
}

interface SentimentResult {
  sentiment_score: number;
  sentiment_label: string;
  confidence_score: number;
  emotional_tone: string;
  topic_categories: string[];
  keywords_detected: string[];
  analysis_metadata: any;
}

async function analyzeSentiment(text: string): Promise<SentimentResult> {
  if (!openAIApiKey) {
    throw new Error('OpenAI API key not configured');
  }

  const prompt = `Analyze the sentiment of this message and return a JSON response with the following structure:
{
  "sentiment_score": (number between -1.0 and 1.0, where -1 is very negative, 0 is neutral, 1 is very positive),
  "sentiment_label": ("positive" | "negative" | "neutral"),
  "confidence_score": (number between 0.0 and 1.0 indicating confidence in the analysis),
  "emotional_tone": (primary emotion: "happy", "angry", "fearful", "excited", "sad", "neutral", "bullish", "bearish", "optimistic", "pessimistic"),
  "topic_categories": (array of relevant categories: ["trading", "crypto", "market", "technical_analysis", "news", "community", "price_action", "strategy"]),
  "keywords_detected": (array of important sentiment-driving words/phrases from the message),
  "analysis_metadata": {
    "reasoning": "brief explanation of the sentiment classification",
    "market_relevance": (0.0 to 1.0 score of how relevant this is to trading/market sentiment)
  }
}

Message to analyze: "${text}"

Important: Only return valid JSON, no other text.`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { 
            role: 'system', 
            content: 'You are a sentiment analysis expert specializing in financial and cryptocurrency trading communications. Return only valid JSON responses.' 
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.1,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const analysisText = data.choices[0].message.content.trim();
    
    // Parse JSON response
    const analysis = JSON.parse(analysisText);
    
    // Validate and normalize the response
    return {
      sentiment_score: Math.max(-1, Math.min(1, analysis.sentiment_score || 0)),
      sentiment_label: ['positive', 'negative', 'neutral'].includes(analysis.sentiment_label) 
        ? analysis.sentiment_label : 'neutral',
      confidence_score: Math.max(0, Math.min(1, analysis.confidence_score || 0.5)),
      emotional_tone: analysis.emotional_tone || 'neutral',
      topic_categories: Array.isArray(analysis.topic_categories) ? analysis.topic_categories : [],
      keywords_detected: Array.isArray(analysis.keywords_detected) ? analysis.keywords_detected : [],
      analysis_metadata: analysis.analysis_metadata || {}
    };
  } catch (error) {
    console.error('Error analyzing sentiment:', error);
    // Return neutral sentiment on error
    return {
      sentiment_score: 0,
      sentiment_label: 'neutral',
      confidence_score: 0.1,
      emotional_tone: 'neutral',
      topic_categories: [],
      keywords_detected: [],
      analysis_metadata: { error: error.message }
    };
  }
}

async function saveSentimentAnalysis(messageId: string, analysis: SentimentResult) {
  try {
    // Generate a UUID for the analysis record
    const analysisId = crypto.randomUUID();
    
    const { error } = await supabase
      .from('telegram_sentiment_analysis')
      .insert({
        id: analysisId,
        telegram_message_id: parseInt(messageId), // Store as integer, not UUID
        ...analysis
      });

    if (error) {
      console.error('Error saving sentiment analysis:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error saving sentiment analysis:', error);
    // Don't throw error to prevent function from failing completely
  }
}

async function checkSentimentAlerts(analysis: SentimentResult) {
  // Check for sentiment spikes or drops
  const { data: recentAnalyses } = await supabase
    .from('telegram_sentiment_analysis')
    .select('sentiment_score')
    .gte('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString()) // Last hour
    .order('created_at', { ascending: false })
    .limit(20);

  if (recentAnalyses && recentAnalyses.length >= 5) {
    const avgSentiment = recentAnalyses.reduce((sum, r) => sum + r.sentiment_score, 0) / recentAnalyses.length;
    const sentimentDiff = Math.abs(analysis.sentiment_score - avgSentiment);

    if (sentimentDiff > 0.5) {
      // Significant sentiment change detected
      const alertType = analysis.sentiment_score > avgSentiment ? 'spike' : 'drop';
      const severity = sentimentDiff > 0.8 ? 'critical' : sentimentDiff > 0.7 ? 'high' : 'medium';

      await supabase
        .from('sentiment_alerts')
        .insert({
          alert_type: alertType,
          severity: severity,
          sentiment_threshold: sentimentDiff,
          message_count: recentAnalyses.length,
          avg_sentiment: avgSentiment,
          alert_data: {
            current_sentiment: analysis.sentiment_score,
            previous_avg: avgSentiment,
            topic_categories: analysis.topic_categories,
            emotional_tone: analysis.emotional_tone
          }
        });
    }
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messageText, messageId, telegramMessageId, batchMode, messages }: SentimentAnalysisRequest = await req.json();

    if (batchMode && messages) {
      // Batch processing mode
      const results = [];
      
      for (const message of messages) {
        if (!message.message_text) continue;
        
        const analysis = await analyzeSentiment(message.message_text);
        await saveSentimentAnalysis(message.id, analysis);
        await checkSentimentAlerts(analysis);
        
        results.push({
          messageId: message.id,
          analysis
        });
      }

      return new Response(JSON.stringify({ 
        success: true, 
        processed: results.length,
        results 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } else {
      // Single message processing
      if (!messageText) {
        return new Response(JSON.stringify({ error: 'Message text is required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const analysis = await analyzeSentiment(messageText);
      
      if (messageId || telegramMessageId) {
        await saveSentimentAnalysis(messageId || telegramMessageId!, analysis);
        await checkSentimentAlerts(analysis);
      }

      return new Response(JSON.stringify({ 
        success: true, 
        analysis 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  } catch (error) {
    console.error('Error in sentiment analyzer:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});