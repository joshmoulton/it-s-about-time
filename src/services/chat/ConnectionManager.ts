
import type { ConnectionState, ConnectionCallback, ChatMessage } from './types';
import { ConnectionStateManager } from './connection/ConnectionStateManager';
import { RealtimeConnectionHandler } from './connection/RealtimeConnectionHandler';

export class ConnectionManager {
  private stateManager: ConnectionStateManager;
  private realtimeHandler: RealtimeConnectionHandler;

  constructor() {
    this.stateManager = new ConnectionStateManager();
    this.realtimeHandler = new RealtimeConnectionHandler(this.stateManager);
  }

  setupRealtimeConnection(
    onNewMessage: (message: ChatMessage) => void,
    onMessageUpdate: (message: ChatMessage) => void
  ): void {
    this.realtimeHandler.setupRealtimeConnection(onNewMessage, onMessageUpdate);
  }

  subscribeToConnection(callback: ConnectionCallback): () => void {
    return this.stateManager.subscribeToConnection(callback);
  }

  getConnectionState(): ConnectionState {
    return this.stateManager.getConnectionState();
  }

  updateSyncStatus(status: 'syncing' | 'connected' | 'error', error?: string, lastSyncTime?: Date): void {
    this.stateManager.updateSyncStatus(status, error, lastSyncTime);
  }

  cleanup(): void {
    console.log('🧹 Cleaning up ConnectionManager');
    this.stateManager.markAsCleanedUp();
    this.realtimeHandler.cleanup();
    this.stateManager.cleanup();
  }
}
