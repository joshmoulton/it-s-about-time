
import type { ChatMessage, ConnectionState, MessageCallback, ConnectionCallback } from './chat/types';
import { MessageManager } from './chat/MessageManager';
import { SyncManager } from './chat/SyncManager';
import { ConnectionManager } from './chat/ConnectionManager';

class UnifiedChatService {
  private static instance: UnifiedChatService | null = null;
  private messageSubscribers = new Set<MessageCallback>();
  private isInitialized = false;
  
  // Component managers
  private messageManager = new MessageManager();
  private syncManager = new SyncManager();
  private connectionManager = new ConnectionManager();

  static getInstance(): UnifiedChatService {
    if (!UnifiedChatService.instance) {
      UnifiedChatService.instance = new UnifiedChatService();
    }
    return UnifiedChatService.instance;
  }

  async initialize() {
    if (this.isInitialized) return;
    
    console.log('🚀 Initializing UnifiedChatService with 15-second direct polling...');
    this.connectionManager.updateSyncStatus('syncing');
    
    try {
      // Load initial messages
      await this.messageManager.loadInitialMessages();
      
      // Setup realtime connection for new messages
      this.connectionManager.setupRealtimeConnection(
        (message) => this.handleNewMessage(message),
        (message) => this.handleMessageUpdate(message)
      );
      
      // Start aggressive direct API polling every 15 seconds
      this.syncManager.startAutoSync(() => this.triggerDirectSync());
      
      this.isInitialized = true;
      this.connectionManager.updateSyncStatus('connected', undefined, new Date());
      
      console.log('✅ UnifiedChatService initialized with 15-second polling');
    } catch (error) {
      console.error('❌ Failed to initialize UnifiedChatService:', error);
      this.connectionManager.updateSyncStatus('error', error.message);
    }
  }

  private handleNewMessage(message: ChatMessage): void {
    this.messageManager.handleNewMessage(message);
    this.notifyMessageSubscribers();
  }

  private handleMessageUpdate(message: ChatMessage): void {
    this.messageManager.handleMessageUpdate(message);
    this.notifyMessageSubscribers();
  }

  async triggerDirectSync() {
    try {
      console.log('🔄 Triggering direct Telegram API sync...');
      this.connectionManager.updateSyncStatus('syncing');
      
      await this.syncManager.triggerTelegramSync();
      
      // Reload messages after sync
      await this.messageManager.loadInitialMessages();
      this.notifyMessageSubscribers();
      
      this.connectionManager.updateSyncStatus('connected', undefined, new Date());
    } catch (error) {
      console.error('❌ Direct sync failed:', error);
      this.connectionManager.updateSyncStatus('error', error.message);
    }
  }

  private notifyMessageSubscribers(): void {
    const messages = this.messageManager.getMessages();
    this.messageSubscribers.forEach(callback => {
      try {
        callback([...messages]);
      } catch (error) {
        console.error('❌ Error in message subscriber:', error);
      }
    });
  }

  // Public API
  subscribeToMessages(callback: MessageCallback): () => void {
    this.messageSubscribers.add(callback);
    
    // Immediately call with current messages
    const messages = this.messageManager.getMessages();
    if (messages.length > 0) {
      setTimeout(() => callback([...messages]), 0);
    }
    
    return () => {
      this.messageSubscribers.delete(callback);
    };
  }

  subscribeToConnection(callback: ConnectionCallback): () => void {
    return this.connectionManager.subscribeToConnection(callback);
  }

  getMessages(): ChatMessage[] {
    return this.messageManager.getMessages();
  }

  getConnectionState(): ConnectionState {
    return this.connectionManager.getConnectionState();
  }

  async triggerSync() {
    return this.triggerDirectSync();
  }

  cleanup() {
    console.log('🧹 Cleaning up UnifiedChatService');
    
    this.connectionManager.cleanup();
    this.syncManager.cleanup();
    
    this.messageSubscribers.clear();
    this.isInitialized = false;
    
    UnifiedChatService.instance = null;
  }
}

export default UnifiedChatService;
export type { ChatMessage, ConnectionState };
