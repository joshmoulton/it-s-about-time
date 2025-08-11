
import { supabase } from '@/integrations/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

export interface ChatMessage {
  id: string;
  first_name?: string;
  last_name?: string;
  username?: string;
  message_text?: string;
  timestamp: string;
  topic_name?: string;
  message_thread_id?: number;
  likes_count?: number;
  message_type?: string;
  auto_highlights?: Array<{
    id: string;
    rule_id: string;
    priority_score: number;
    highlight_color: string;
    highlight_style: string;
    rule_name: string;
  }>;
}

export interface ConnectionState {
  status: 'disconnected' | 'connecting' | 'connected' | 'error';
  lastConnected: Date | null;
  reconnectAttempts: number;
  error: string | null;
}

type MessageCallback = (messages: ChatMessage[]) => void;
type ConnectionCallback = (state: ConnectionState) => void;

class ChatServiceManager {
  private static instance: ChatServiceManager;
  private messages: ChatMessage[] = [];
  private connectionState: ConnectionState = {
    status: 'disconnected',
    lastConnected: null,
    reconnectAttempts: 0,
    error: null
  };
  
  private messageSubscribers: Set<MessageCallback> = new Set();
  private connectionSubscribers: Set<ConnectionCallback> = new Set();
  private realtimeChannel: RealtimeChannel | null = null;
  private reconnectTimer: NodeJS.Timeout | null = null;

  private constructor() {
    console.log('🚀 ChatServiceManager initialized');
  }

  static getInstance(): ChatServiceManager {
    if (!ChatServiceManager.instance) {
      ChatServiceManager.instance = new ChatServiceManager();
      // Auto-initialize on first access
      ChatServiceManager.instance.initialize();
    }
    return ChatServiceManager.instance;
  }

  private async initialize(): Promise<void> {
    console.log('🔧 Initializing ChatServiceManager...');
    try {
      await this.loadInitialMessages();
      this.setupRealtimeConnection();
    } catch (error) {
      console.error('❌ Failed to initialize ChatServiceManager:', error);
      this.updateConnectionState({
        status: 'error',
        error: error.message || 'Initialization failed'
      });
    }
  }

  private async loadInitialMessages(): Promise<void> {
    try {
      console.log('📨 Loading initial messages...');
      
      // 1) Fetch latest messages only (no joins to avoid RLS/FK issues)
      const { data: msgRows, error: msgErr } = await supabase
        .from('telegram_messages')
        .select(`
          id,
          first_name,
          last_name,
          username,
          message_text,
          timestamp,
          topic_name,
          message_thread_id,
          likes_count,
          message_type
        `)
        .order('timestamp', { ascending: false })
        .limit(50);

      if (msgErr) {
        console.error('❌ Error loading messages:', msgErr);
        throw msgErr;
      }

      const messageIds = (msgRows || []).map((m: any) => m.id);

      // 2) Fetch auto_highlights for these messages (separate query)
      let highlightMap: Record<string, any[]> = {};
      if (messageIds.length > 0) {
        const { data: highlights, error: hlErr } = await supabase
          .from('auto_highlights')
          .select('id, rule_id, priority_score, telegram_message_id')
          .in('telegram_message_id', messageIds);
        if (hlErr) {
          console.warn('⚠️ auto_highlights fetch skipped due to error:', hlErr.message);
        } else if (highlights && highlights.length > 0) {
          // 3) Fetch rules metadata for color/style
          const ruleIds = [...new Set(highlights.map(h => h.rule_id).filter(Boolean))];
          let rulesMap: Record<string, any> = {};
          if (ruleIds.length > 0) {
            const { data: rules, error: rulesErr } = await supabase
              .from('chat_highlight_rules')
              .select('id, rule_name, highlight_color, highlight_style')
              .in('id', ruleIds);
            if (!rulesErr && rules) {
              rules.forEach((r: any) => { rulesMap[r.id] = r; });
            }
          }
          highlights.forEach((h: any) => {
            const arr = highlightMap[h.telegram_message_id] || (highlightMap[h.telegram_message_id] = []);
            const rule = rulesMap[h.rule_id] || {};
            arr.push({
              id: h.id,
              rule_id: h.rule_id,
              priority_score: h.priority_score,
              highlight_color: rule.highlight_color || '#fbbf24',
              highlight_style: rule.highlight_style || 'background',
              rule_name: rule.rule_name || 'Highlight'
            });
          });
        }
      }

      // 4) Transform messages and attach highlights
      const transformedMessages: ChatMessage[] = (msgRows || []).map((msg: any) => ({
        ...msg,
        auto_highlights: highlightMap[msg.id] || []
      }));

      this.messages = transformedMessages;
      this.notifyMessageSubscribers();
      
      console.log(`✅ Loaded ${this.messages.length} messages (with ${Object.keys(highlightMap).length} highlight sets)`);
    } catch (error) {
      console.error('❌ Failed to load initial messages:', error);
      throw error;
    }
  }

  private setupRealtimeConnection(): void {
    if (this.realtimeChannel) {
      this.cleanupRealtimeConnection();
    }

    this.updateConnectionState({
      ...this.connectionState,
      status: 'connecting'
    });

    console.log('🔌 Setting up real-time connection...');
    
    this.realtimeChannel = supabase
      .channel(`chat-${Date.now()}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'telegram_messages'
        },
        (payload) => {
          console.log('📩 New message received:', payload.new);
          this.handleNewMessage(payload.new as ChatMessage);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'telegram_messages'
        },
        (payload) => {
          console.log('📝 Message updated:', payload.new);
          this.handleMessageUpdate(payload.new as ChatMessage);
        }
      )
      .subscribe((status) => {
        console.log('📡 Real-time connection status:', status);
        
        if (status === 'SUBSCRIBED') {
          this.updateConnectionState({
            status: 'connected',
            lastConnected: new Date(),
            reconnectAttempts: 0,
            error: null
          });
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          this.handleConnectionError(`Connection failed: ${status}`);
        } else if (status === 'CLOSED') {
          this.updateConnectionState({
            ...this.connectionState,
            status: 'disconnected'
          });
        }
      });
  }

  private handleNewMessage(newMessage: ChatMessage): void {
    // Add to the beginning of the array (newest first)
    this.messages = [newMessage, ...this.messages];
    
    // Maintain reasonable message limit
    if (this.messages.length > 100) {
      this.messages = this.messages.slice(0, 100);
    }
    
    this.notifyMessageSubscribers();
  }

  private handleMessageUpdate(updatedMessage: ChatMessage): void {
    const index = this.messages.findIndex(msg => msg.id === updatedMessage.id);
    if (index !== -1) {
      this.messages[index] = updatedMessage;
      this.notifyMessageSubscribers();
    }
  }

  private handleConnectionError(error: string): void {
    console.error('❌ Connection error:', error);
    
    this.updateConnectionState({
      ...this.connectionState,
      status: 'error',
      error,
      reconnectAttempts: this.connectionState.reconnectAttempts + 1
    });

    // Attempt reconnection with exponential backoff
    if (this.connectionState.reconnectAttempts < 5) {
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }

    const delay = Math.min(1000 * Math.pow(2, this.connectionState.reconnectAttempts), 30000);
    console.log(`🔄 Scheduling reconnect in ${delay}ms`);
    
    this.reconnectTimer = setTimeout(() => {
      this.setupRealtimeConnection();
    }, delay);
  }

  private updateConnectionState(newState: Partial<ConnectionState>): void {
    this.connectionState = { ...this.connectionState, ...newState };
    this.notifyConnectionSubscribers();
  }

  private notifyMessageSubscribers(): void {
    this.messageSubscribers.forEach(callback => {
      try {
        callback([...this.messages]);
      } catch (error) {
        console.error('❌ Error in message subscriber callback:', error);
      }
    });
  }

  private notifyConnectionSubscribers(): void {
    this.connectionSubscribers.forEach(callback => {
      try {
        callback({ ...this.connectionState });
      } catch (error) {
        console.error('❌ Error in connection subscriber callback:', error);
      }
    });
  }

  private cleanupRealtimeConnection(): void {
    if (this.realtimeChannel) {
      console.log('🧹 Cleaning up real-time connection');
      supabase.removeChannel(this.realtimeChannel);
      this.realtimeChannel = null;
    }
    
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  // Public API
  public subscribeToMessages(callback: MessageCallback): () => void {
    this.messageSubscribers.add(callback);
    
    // Immediately call with current messages
    callback([...this.messages]);
    
    return () => {
      this.messageSubscribers.delete(callback);
    };
  }

  public subscribeToConnection(callback: ConnectionCallback): () => void {
    this.connectionSubscribers.add(callback);
    
    // Immediately call with current state
    callback({ ...this.connectionState });
    
    return () => {
      this.connectionSubscribers.delete(callback);
    };
  }

  public async forceRefresh(): Promise<void> {
    console.log('🔄 Force refresh requested');
    try {
      await this.loadInitialMessages();
    } catch (error) {
      console.error('❌ Force refresh failed:', error);
    }
  }

  public reconnect(): void {
    console.log('🔄 Manual reconnect requested');
    this.cleanupRealtimeConnection();
    this.setupRealtimeConnection();
  }

  public getMessages(): ChatMessage[] {
    return [...this.messages];
  }

  public getConnectionState(): ConnectionState {
    return { ...this.connectionState };
  }

  public cleanup(): void {
    console.log('🧹 Cleaning up ChatServiceManager');
    this.cleanupRealtimeConnection();
    this.messageSubscribers.clear();
    this.connectionSubscribers.clear();
  }
}

export default ChatServiceManager;
