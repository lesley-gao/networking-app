// ClientApp/src/services/signalRService.ts
import { HubConnection, HubConnectionBuilder, LogLevel } from '@microsoft/signalr';

export interface SignalRNotification {
  id: number;
  title: string;
  message: string;
  type: string;
  actionUrl?: string;
  isRead: boolean;
  createdAt: string;
}

export interface SignalRMessage {
  senderId: number;
  senderName: string;
  messagePreview: string;
  timestamp: string;
}

export interface SignalRSystemNotification {
  title: string;
  message: string;
  type: string;
  timestamp: string;
}

class SignalRService {
  private connection: HubConnection | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private usageCount = 0; // Reference count for connection usage

  constructor() {
    this.connection = new HubConnectionBuilder()
      .withUrl('https://localhost:5001/notificationHub', {
        accessTokenFactory: () => localStorage.getItem('token') || '',
        withCredentials: true,
      })
      .withAutomaticReconnect({
        nextRetryDelayInMilliseconds: (retryContext) => {
          if (retryContext.previousRetryCount < this.maxReconnectAttempts) {
            return Math.min(1000 * Math.pow(2, retryContext.previousRetryCount), 30000);
          }
          return null; // Stop retrying
        }
      })
      .configureLogging(LogLevel.Information)
      .build();

    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    if (!this.connection) return;

    this.connection.onreconnecting(() => {
      console.log('SignalR: Attempting to reconnect...');
    });

    this.connection.onreconnected(() => {
      console.log('SignalR: Reconnected successfully');
      this.reconnectAttempts = 0;
    });

    this.connection.onclose((error) => {
      if (error) {
        console.error('SignalR: Connection closed with error:', error);
      } else {
        console.log('SignalR: Connection closed');
      }
    });
  }

  async start(): Promise<void> {
    if (!this.connection) {
      throw new Error('SignalR connection not initialized');
    }

    if (this.connection.state !== 'Disconnected') {
      console.log(`SignalR: Connection is already in state: ${this.connection.state}`);
      return;
    }

    try {
      await this.connection.start();
      console.log('SignalR: Connected successfully');
    } catch (error) {
      console.error('SignalR: Failed to connect:', error);
      throw error;
    }
  }

  async stop(): Promise<void> {
    if (this.connection) {
      await this.connection.stop();
      console.log('SignalR: Disconnected');
    }
  }

  async acquire(): Promise<void> {
    this.usageCount++;
    if (!this.isConnected()) {
      // Wait until the connection is fully Disconnected before starting
      while (this.connection && this.connection.state === 'Disconnecting') {
        await new Promise((resolve) => setTimeout(resolve, 50));
      }
      await this.start();
    }
  }

  async release(): Promise<void> {
    this.usageCount = Math.max(0, this.usageCount - 1);
    if (this.usageCount === 0) {
      await this.stop();
    }
  }

  // Event handlers
  onNotificationReceived(callback: (notification: SignalRNotification) => void): void {
    this.connection?.on('ReceiveNotification', callback);
  }

  onMessageReceived(callback: (message: SignalRMessage) => void): void {
    this.connection?.on('ReceiveMessage', callback);
  }

  onSystemNotificationReceived(callback: (notification: SignalRSystemNotification) => void): void {
    this.connection?.on('ReceiveSystemNotification', callback);
  }

  onTestResponse(callback: (response: any) => void): void {
    this.connection?.on('TestResponse', callback);
  }

  onNotificationMarkedAsRead(callback: (data: { notificationId: number, userId: string, markedAt: string }) => void): void {
    this.connection?.on('NotificationMarkedAsRead', callback);
  }

  onTypingIndicator(callback: (data: { senderId: number, isTyping: boolean, timestamp: string }) => void): void {
    this.connection?.on('TypingIndicator', callback);
  }

  // Hub methods
  async joinGroup(groupName: string): Promise<void> {
    if (this.connection?.state === 'Connected') {
      await this.connection.invoke('JoinGroup', groupName);
    }
  }

  async leaveGroup(groupName: string): Promise<void> {
    if (this.connection?.state === 'Connected') {
      await this.connection.invoke('LeaveGroup', groupName);
    }
  }

  async markNotificationAsRead(notificationId: number): Promise<void> {
    if (this.connection?.state === 'Connected') {
      await this.connection.invoke('MarkNotificationAsRead', notificationId);
    }
  }

  async sendTypingIndicator(receiverId: number, isTyping: boolean): Promise<void> {
    if (this.connection?.state === 'Connected') {
      await this.connection.invoke('SendTypingIndicator', receiverId, isTyping);
    }
  }

  async testConnection(message: string): Promise<void> {
    if (this.connection?.state === 'Connected') {
      await this.connection.invoke('TestConnection', message);
    } else {
      throw new Error('SignalR connection is not active');
    }
  }

  // Utility methods
  isConnected(): boolean {
    return this.connection?.state === 'Connected';
  }

  getConnectionState(): string {
    return this.connection?.state || 'Disconnected';
  }
}

export const signalRService = new SignalRService();