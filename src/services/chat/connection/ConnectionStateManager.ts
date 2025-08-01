
import type { ConnectionState, ConnectionCallback } from '../types';

export class ConnectionStateManager {
  private connectionState: ConnectionState = {
    status: 'disconnected',
    lastConnected: null,
    lastSyncTime: null,
    error: null
  };
  
  private connectionSubscribers: Set<ConnectionCallback> = new Set();
  private isCleanedUp = false;

  updateConnectionState(newState: Partial<ConnectionState>): void {
    if (this.isCleanedUp) return;
    
    this.connectionState = { ...this.connectionState, ...newState };
    this.notifyConnectionSubscribers();
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

  subscribeToConnection(callback: ConnectionCallback): () => void {
    this.connectionSubscribers.add(callback);
    
    // Immediately call with current state
    callback({ ...this.connectionState });
    
    return () => {
      this.connectionSubscribers.delete(callback);
    };
  }

  getConnectionState(): ConnectionState {
    return { ...this.connectionState };
  }

  updateSyncStatus(status: 'syncing' | 'connected' | 'error', error?: string, lastSyncTime?: Date): void {
    this.updateConnectionState({
      status,
      error: error || null,
      lastSyncTime: lastSyncTime || (status === 'connected' ? new Date() : this.connectionState.lastSyncTime)
    });
  }

  markAsCleanedUp(): void {
    this.isCleanedUp = true;
  }

  isConnectionCleanedUp(): boolean {
    return this.isCleanedUp;
  }

  cleanup(): void {
    console.log('🧹 Cleaning up ConnectionStateManager');
    this.isCleanedUp = true;
    this.connectionSubscribers.clear();
  }
}
