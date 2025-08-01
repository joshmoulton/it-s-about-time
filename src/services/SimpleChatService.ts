import type { ChatMessage, ConnectionState, MessageCallback, ConnectionCallback } from './chat/types';
import { MessageManager } from './chat/MessageManager';
import { ConnectionManager } from './chat/ConnectionManager';
import { SyncManager } from './chat/SyncManager';

class SimpleChatService {
  private static instance: SimpleChatService | null = null;
  private messageManager: MessageManager;
  private connectionManager: ConnectionManager;
  private syncManager: SyncManager;
  
  private messageSubscribers: Set<MessageCallback> = new Set();
  private isInitialized = false;
  private isDestroyed = false;
  private initPromise: Promise<void> | null = null;
  private externalBotActive = true; // Python bot is now active

  private constructor() {
    console.log('🚀 SimpleChatService singleton initialized');
    this.messageManager = new MessageManager();
    this.connectionManager = new ConnectionManager();
    this.syncManager = new SyncManager();
    
    // Configure sync manager for external bot usage
    this.syncManager.setExternalBotActive(true);
  }

  static getInstance(): SimpleChatService {
    if (!SimpleChatService.instance || SimpleChatService.instance.isDestroyed) {
      SimpleChatService.instance = new SimpleChatService();
    }
    
    // Auto-initialize on first access
    if (!SimpleChatService.instance.isInitialized && !SimpleChatService.instance.isDestroyed) {
      if (!SimpleChatService.instance.initPromise) {
        SimpleChatService.instance.initPromise = SimpleChatService.instance.initialize();
      }
    }
    
    return SimpleChatService.instance;
  }

  private async initialize(): Promise<void> {
    if (this.isDestroyed) {
      console.log('⚠️ Service is destroyed, skipping initialization');
      return;
    }

    console.log('🔧 Initializing SimpleChatService...');
    try {
      this.connectionManager.updateSyncStatus('syncing');
      
      // Load initial messages first
      await this.loadInitialMessages();
      
      // Setup realtime connection with retry logic (keep this for DB updates)
      this.setupRealtimeConnectionWithRetry();
      
      // Skip background sync since external Python bot is handling it
      if (!this.externalBotActive) {
        this.startAutoSync();
      } else {
        console.log('⚠️ Skipping auto-sync: External Python bot is active');
      }
      
      this.connectionManager.updateSyncStatus('connected', undefined, new Date());
      this.isInitialized = true;
      
      console.log('✅ SimpleChatService initialized successfully (External bot mode)');
    } catch (error) {
      console.error('❌ Failed to initialize SimpleChatService:', error);
      this.connectionManager.updateSyncStatus('error', error.message || 'Initialization failed');
      
      // Retry initialization after delay
      setTimeout(() => {
        if (!this.isDestroyed && !this.isInitialized) {
          console.log('🔄 Retrying SimpleChatService initialization...');
          this.initPromise = this.initialize();
        }
      }, 5000);
    }
  }

  private async loadInitialMessages(): Promise<void> {
    if (this.isDestroyed) return;
    
    console.log('📥 Loading initial messages...');
    const messages = await this.messageManager.loadInitialMessages();
    console.log('📥 Loaded', messages.length, 'initial messages');
    
    // Immediately notify subscribers
    this.notifyMessageSubscribers();
  }

  private setupRealtimeConnectionWithRetry(): void {
    if (this.isDestroyed) return;
    
    console.log('🔄 Setting up realtime connection with retry logic...');
    
    const attemptConnection = () => {
      if (this.isDestroyed) return;
      
      this.connectionManager.setupRealtimeConnection(
        (newMessage: ChatMessage) => {
          if (this.isDestroyed) return;
          console.log('📨 New message received via realtime:', newMessage.id);
          this.messageManager.handleNewMessage(newMessage);
          this.notifyMessageSubscribers();
        },
        (updatedMessage: ChatMessage) => {
          if (this.isDestroyed) return;
          console.log('📝 Message updated via realtime:', updatedMessage.id);
          this.messageManager.handleMessageUpdate(updatedMessage);
          this.notifyMessageSubscribers();
        }
      );
    };

    attemptConnection();
    
    // Retry connection every 30 seconds if not connected
    const connectionRetryInterval = setInterval(() => {
      if (this.isDestroyed) {
        clearInterval(connectionRetryInterval);
        return;
      }
      
      const state = this.connectionManager.getConnectionState();
      if (state.status !== 'connected') {
        console.log('🔄 Retrying realtime connection...');
        attemptConnection();
      }
    }, 30000);
  }

  private startAutoSync(): void {
    if (this.isDestroyed || this.externalBotActive) return;
    
    console.log('⏰ Starting background sync (5 minute interval)...');
    this.syncManager.startAutoSync(async () => {
      if (!this.isDestroyed) {
        console.log('🔄 Background sync triggered');
        await this.triggerTelegramSync();
      }
    });
  }

  public async triggerTelegramSync(): Promise<void> {
    if (this.isDestroyed) return;
    
    // Allow manual sync but warn about external bot
    if (this.externalBotActive) {
      console.warn('⚠️ Manual Telegram sync requested while external Python bot is active');
    }
    
    try {
      console.log('🔄 Starting manual Telegram sync...');
      this.connectionManager.updateSyncStatus('syncing');
      
      await this.syncManager.triggerTelegramSync();
      
      // Reload messages after sync
      await this.loadInitialMessages();
      
      this.connectionManager.updateSyncStatus('connected', undefined, new Date());
      console.log('✅ Manual Telegram sync completed successfully');
    } catch (error) {
      console.error('❌ Sync failed:', error);
      this.connectionManager.updateSyncStatus('error', error.message);
    }
  }

  private notifyMessageSubscribers(): void {
    if (this.isDestroyed) return;
    
    const messages = this.messageManager.getMessages();
    console.log('📢 Notifying', this.messageSubscribers.size, 'subscribers of', messages.length, 'messages');
    
    this.messageSubscribers.forEach(callback => {
      try {
        callback([...messages]);
      } catch (error) {
        console.error('❌ Error in message subscriber callback:', error);
      }
    });
  }

  // Public API
  public subscribeToMessages(callback: MessageCallback): () => void {
    console.log('📝 New message subscriber added');
    this.messageSubscribers.add(callback);
    
    // Immediately call with current messages if available
    const currentMessages = this.messageManager.getMessages();
    if (currentMessages.length > 0) {
      setTimeout(() => callback([...currentMessages]), 0);
    }
    
    return () => {
      console.log('📝 Message subscriber removed');
      this.messageSubscribers.delete(callback);
    };
  }

  public subscribeToConnection(callback: ConnectionCallback): () => void {
    return this.connectionManager.subscribeToConnection(callback);
  }

  public async forceRefresh(): Promise<void> {
    if (this.isDestroyed) return;
    
    console.log('🔄 Force refresh requested');
    try {
      await this.triggerTelegramSync();
    } catch (error) {
      console.error('❌ Force refresh failed:', error);
    }
  }

  public getMessages(): ChatMessage[] {
    return this.messageManager.getMessages();
  }

  public getConnectionState(): ConnectionState {
    return this.connectionManager.getConnectionState();
  }

  public cleanup(): void {
    console.log('🧹 Cleaning up SimpleChatService');
    this.isDestroyed = true;
    this.isInitialized = false;
    this.initPromise = null;
    
    this.connectionManager.cleanup();
    this.syncManager.cleanup();
    this.messageSubscribers.clear();
    
    // Reset singleton instance
    SimpleChatService.instance = null;
  }
}

export default SimpleChatService;
export type { ChatMessage, ConnectionState };
