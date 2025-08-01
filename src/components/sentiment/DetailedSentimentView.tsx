import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ModernCard, ModernCardContent, ModernCardHeader, ModernCardTitle } from '@/components/ui/modern-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, MessageSquare, X, Brain, TrendingUp, TrendingDown, Minus, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface TelegramMessageData {
  id: string;
  message_text: string;
  username: string;
  first_name: string;
  timestamp: string;
  topic_name: string;
  sentiment_analysis: {
    sentiment_score: number;
    sentiment_label: string;
    confidence_score: number;
    keywords_detected: string[];
    emotional_tone: string;
  };
}

interface XPostData {
  id: string;
  post_text: string;
  author_name: string;
  author_username: string;
  posted_at: string;
  like_count: number;
  retweet_count: number;
  sentiment_analysis: {
    sentiment_score: number;
    sentiment_label: string;
    confidence_score: number;
    keywords_detected: string[];
    emotional_tone: string;
  };
}

export function DetailedSentimentView() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const topic = searchParams.get('topic') || '';
  
  const [telegramData, setTelegramData] = useState<TelegramMessageData[]>([]);
  const [xData, setXData] = useState<XPostData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('telegram');

  const fetchTelegramData = async () => {
    try {
      console.log('🔍 Fetching Telegram data for topic:', topic);
      
      // Get sentiment analysis data with proper topic filtering
      const { data: sentimentData, error: sentimentError } = await supabase
        .from('telegram_sentiment_analysis')
        .select(`
          sentiment_score,
          sentiment_label,
          confidence_score,
          keywords_detected,
          emotional_tone,
          topic_categories,
          telegram_message_id,
          created_at
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (sentimentError) {
        console.error('❌ Sentiment analysis error:', sentimentError);
        throw sentimentError;
      }

      console.log('🧠 Found sentiment analyses:', sentimentData?.length || 0);

      // Filter by topic using topic_categories (same logic as main page)
      const filteredSentiment = sentimentData?.filter(item => {
        if (!topic) return true;
        
        // Check if topic matches any of the topic_categories
        return item.topic_categories?.some((cat: string) => 
          cat.toLowerCase().includes(topic.toLowerCase())
        ) || item.keywords_detected?.some((keyword: string) => 
          keyword.toLowerCase().includes(topic.toLowerCase())
        );
      }) || [];

      console.log('🎯 Filtered sentiment data:', filteredSentiment.length, 'items for topic:', topic);

      // Now get the corresponding telegram messages
      const messageIds = filteredSentiment
        .map(s => s.telegram_message_id)
        .filter(Boolean);

      if (messageIds.length === 0) {
        setTelegramData([]);
        return;
      }

      const { data: telegramMessages, error: telegramError } = await supabase
        .from('telegram_messages')
        .select('*')
        .in('id', messageIds.map(String))
        .not('message_text', 'is', null);

      if (telegramError) {
        console.error('❌ Telegram messages error:', telegramError);
        throw telegramError;
      }

      console.log('📨 Found telegram messages:', telegramMessages?.length || 0);

      // Combine message data with sentiment data
      const formattedData = telegramMessages?.map((message: any) => {
        const sentiment = filteredSentiment.find(s => String(s.telegram_message_id) === String(message.id));
        return {
          id: String(message.id),
          message_text: message.message_text,
          username: message.username || 'Unknown',
          first_name: message.first_name || '',
          timestamp: message.message_time || new Date().toISOString(),
          topic_name: message.topic_name || '',
          sentiment_analysis: {
            sentiment_score: sentiment?.sentiment_score || 0,
            sentiment_label: sentiment?.sentiment_label || 'neutral',
            confidence_score: sentiment?.confidence_score || 0,
            keywords_detected: sentiment?.keywords_detected || [],
            emotional_tone: sentiment?.emotional_tone || 'neutral'
          }
        };
      }) || [];

      console.log('✅ Final Telegram data:', formattedData.length, 'items');
      setTelegramData(formattedData);
    } catch (error) {
      console.error('❌ Error fetching Telegram data:', error);
      setTelegramData([]);
    }
  };

  const fetchXData = async () => {
    try {
      console.log('🔍 Fetching X data for topic:', topic);
      
      const { data, error } = await supabase
        .from('x_posts')
        .select(`
          id,
          post_text,
          author_name,
          author_username,
          posted_at,
          like_count,
          retweet_count
        `)
        .not('post_text', 'is', null)
        .order('posted_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      console.log('🐦 Found X posts:', data?.length || 0);

      const formattedData = data
        ?.filter(item => 
          item.post_text && 
          (topic === '' || 
           item.post_text.toLowerCase().includes(topic.toLowerCase()) ||
           item.author_name?.toLowerCase().includes(topic.toLowerCase()))
        )
        .map(item => ({
          ...item,
          sentiment_analysis: {
            sentiment_score: Math.random(), // Mock data - replace with actual sentiment when available
            sentiment_label: Math.random() > 0.5 ? 'positive' : Math.random() > 0.25 ? 'negative' : 'neutral',
            confidence_score: Math.random() * 0.5 + 0.5,
            keywords_detected: item.post_text?.match(/#\w+/g)?.slice(0, 3) || [],
            emotional_tone: ['optimistic', 'neutral', 'concerned', 'excited'][Math.floor(Math.random() * 4)]
          }
        })) || [];

      console.log('✅ Filtered X data:', formattedData.length, 'items for topic:', topic);
      setXData(formattedData);
    } catch (error) {
      console.error('❌ Error fetching X data:', error);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      await Promise.all([fetchTelegramData(), fetchXData()]);
      setIsLoading(false);
    };
    
    fetchData();
  }, [topic]);

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment?.toLowerCase()) {
      case 'positive':
      case 'bullish':
        return 'text-green-500 bg-green-500/10 border-green-500/20';
      case 'negative':
      case 'bearish':
        return 'text-red-500 bg-red-500/10 border-red-500/20';
      default:
        return 'text-gray-500 bg-gray-500/10 border-gray-500/20';
    }
  };

  const getSentimentIcon = (score: number) => {
    if (score > 0.6) return <TrendingUp className="h-4 w-4" />;
    if (score < 0.4) return <TrendingDown className="h-4 w-4" />;
    return <Minus className="h-4 w-4" />;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const refreshData = async () => {
    setIsLoading(true);
    await Promise.all([fetchTelegramData(), fetchXData()]);
    setIsLoading(false);
  };

  return (
    <div className="h-full w-full bg-background">
      {/* Header */}
      <div className="px-8 py-6 border-b border-border/50 flex-shrink-0 bg-gradient-to-r from-background to-muted/20">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/sentiment-analysis')}
                className="hover:bg-muted/50"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Sentiment Analysis
              </Button>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-brand-primary/10 rounded-xl flex items-center justify-center">
                <Brain className="h-6 w-6 text-brand-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground mb-1">
                  Detailed Sentiment: {topic || 'All Topics'}
                </h1>
                <p className="text-muted-foreground">
                  Source data contributing to sentiment analysis
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={refreshData}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden p-8">
        <div className="max-w-6xl mx-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="telegram" className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Telegram ({telegramData.length})
              </TabsTrigger>
              <TabsTrigger value="x" className="flex items-center gap-2">
                <X className="h-4 w-4" />
                ({xData.length})
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="telegram" className="space-y-4 mt-6">
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin h-8 w-8 border-2 border-brand-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Loading Telegram messages...</p>
                </div>
              ) : telegramData.length > 0 ? (
                <div className="space-y-4">
                  {telegramData.map((message) => (
                    <ModernCard key={message.id} variant="elevated">
                      <ModernCardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <ModernCardTitle className="text-base">
                              {message.first_name || message.username || 'Anonymous'}
                            </ModernCardTitle>
                            <p className="text-sm text-muted-foreground">
                              {message.topic_name && `#${message.topic_name} • `}
                              {formatDate(message.timestamp)}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={getSentimentColor(message.sentiment_analysis.sentiment_label)}>
                              {getSentimentIcon(message.sentiment_analysis.sentiment_score)}
                              <span className="ml-1">{message.sentiment_analysis.sentiment_label}</span>
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              {Math.round(message.sentiment_analysis.sentiment_score * 100)}%
                            </span>
                          </div>
                        </div>
                      </ModernCardHeader>
                      <ModernCardContent>
                        <p className="text-foreground mb-3">{message.message_text}</p>
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-4">
                            <span className="text-muted-foreground">
                              Confidence: {Math.round(message.sentiment_analysis.confidence_score * 100)}%
                            </span>
                            {message.sentiment_analysis.emotional_tone && (
                              <span className="text-muted-foreground">
                                Tone: {message.sentiment_analysis.emotional_tone}
                              </span>
                            )}
                          </div>
                          {message.sentiment_analysis.keywords_detected?.length > 0 && (
                            <div className="flex gap-1">
                              {message.sentiment_analysis.keywords_detected.slice(0, 3).map((keyword, idx) => (
                                <Badge key={idx} variant="outline" className="text-xs">
                                  {keyword}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </ModernCardContent>
                    </ModernCard>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No Telegram messages found for this topic</p>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="x" className="space-y-4 mt-6">
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin h-8 w-8 border-2 border-brand-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Loading X posts...</p>
                </div>
              ) : xData.length > 0 ? (
                <div className="space-y-4">
                  {xData.map((post) => (
                    <ModernCard key={post.id} variant="elevated">
                      <ModernCardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <ModernCardTitle className="text-base">
                              {post.author_name} (@{post.author_username})
                            </ModernCardTitle>
                            <p className="text-sm text-muted-foreground">
                              {formatDate(post.posted_at)}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={getSentimentColor(post.sentiment_analysis.sentiment_label)}>
                              {getSentimentIcon(post.sentiment_analysis.sentiment_score)}
                              <span className="ml-1">{post.sentiment_analysis.sentiment_label}</span>
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              {Math.round(post.sentiment_analysis.sentiment_score * 100)}%
                            </span>
                          </div>
                        </div>
                      </ModernCardHeader>
                      <ModernCardContent>
                        <p className="text-foreground mb-3">{post.post_text}</p>
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-4">
                            <span className="text-muted-foreground">
                              Confidence: {Math.round(post.sentiment_analysis.confidence_score * 100)}%
                            </span>
                            {post.sentiment_analysis.emotional_tone && (
                              <span className="text-muted-foreground">
                                Tone: {post.sentiment_analysis.emotional_tone}
                              </span>
                            )}
                            <span className="text-muted-foreground">
                              ❤️ {post.like_count} • 🔄 {post.retweet_count}
                            </span>
                          </div>
                          {post.sentiment_analysis.keywords_detected?.length > 0 && (
                            <div className="flex gap-1">
                              {post.sentiment_analysis.keywords_detected.slice(0, 3).map((keyword, idx) => (
                                <Badge key={idx} variant="outline" className="text-xs">
                                  {keyword}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </ModernCardContent>
                    </ModernCard>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <X className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No posts found for this topic</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}