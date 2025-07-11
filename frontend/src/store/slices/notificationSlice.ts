// ClientApp/src/store/slices/notificationSlice.ts - Update to integrate with SignalR
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { signalRService, SignalRNotification, SignalRMessage, SignalRSystemNotification } from '../../services/signalRService';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  persistent?: boolean;
  action?: {
    label: string;
    handler: () => void;
  };
  undoAction?: {
    label: string;
    handler: () => void;
  };
  showProgress?: boolean;
  timestamp: number;
  // Add SignalR specific fields
  serverId?: number;
  actionUrl?: string;
  isRead?: boolean;
}

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  isSignalRConnected: boolean;
}

const initialState: NotificationState = {
  notifications: [],
  unreadCount: 0,
  isSignalRConnected: false,
};

const notificationSlice = createSlice({
  name: 'notification',
  initialState,
  reducers: {
    addNotification: (state, action: PayloadAction<Omit<Notification, 'id' | 'timestamp'>>) => {
      const notification: Notification = {
        ...action.payload,
        id: Math.random().toString(36).substr(2, 9),
        timestamp: Date.now(),
      };
      state.notifications.push(notification);
    },
    
    removeNotification: (state, action: PayloadAction<string>) => {
      state.notifications = state.notifications.filter(
        notification => notification.id !== action.payload
      );
    },
    
    clearAllNotifications: (state) => {
      state.notifications = [];
    },
    
    // SignalR specific actions
    addSignalRNotification: (state, action: PayloadAction<SignalRNotification>) => {
      const notification: Notification = {
        id: `signalr_${action.payload.id}`,
        serverId: action.payload.id,
        title: action.payload.title,
        message: action.payload.message,
        type: mapSignalRTypeToNotificationType(action.payload.type),
        actionUrl: action.payload.actionUrl,
        isRead: action.payload.isRead,
        timestamp: new Date(action.payload.createdAt).getTime(),
        duration: action.payload.type === 'Error' ? undefined : 10000,
        persistent: action.payload.type === 'Error',
      };
      state.notifications.push(notification);
      
      if (!action.payload.isRead) {
        state.unreadCount++;
      }
    },
    
    addSignalRMessage: (state, action: PayloadAction<SignalRMessage>) => {
      const notification: Notification = {
        id: `message_${action.payload.senderId}_${Date.now()}`,
        title: `New message from ${action.payload.senderName}`,
        message: action.payload.messagePreview,
        type: 'info',
        timestamp: new Date(action.payload.timestamp).getTime(),
        duration: 8000,
        action: {
          label: 'View',
          handler: () => {
            // Navigate to messages - you'll implement this based on your routing
            window.location.href = `/messages/${action.payload.senderId}`;
          }
        }
      };
      state.notifications.push(notification);
    },
    
    addSystemNotification: (state, action: PayloadAction<SignalRSystemNotification>) => {
      const notification: Notification = {
        id: `system_${Date.now()}`,
        title: action.payload.title,
        message: action.payload.message,
        type: mapSignalRTypeToNotificationType(action.payload.type),
        timestamp: new Date(action.payload.timestamp).getTime(),
        duration: 15000,
        persistent: action.payload.type === 'Error' || action.payload.type === 'Warning',
      };
      state.notifications.push(notification);
    },
    
    setUnreadCount: (state, action: PayloadAction<number>) => {
      state.unreadCount = action.payload;
    },
    
    setSignalRConnectionStatus: (state, action: PayloadAction<boolean>) => {
      state.isSignalRConnected = action.payload;
    },
    
    markNotificationAsRead: (state, action: PayloadAction<number>) => {
      const notification = state.notifications.find(n => n.serverId === action.payload);
      if (notification && !notification.isRead) {
        notification.isRead = true;
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      }
    },
    
    markAllNotificationsAsRead: (state, action: PayloadAction<number>) => {
      state.notifications.forEach(notification => {
        if (notification.serverId && !notification.isRead) {
          notification.isRead = true;
        }
      });
      state.unreadCount = 0;
    },
  },
});

// Helper function to map SignalR notification types to UI types
function mapSignalRTypeToNotificationType(signalRType: string): 'success' | 'error' | 'warning' | 'info' {
  switch (signalRType.toLowerCase()) {
    case 'matchfound':
    case 'paymentreceived':
    case 'servicecompleted':
    case 'success':
      return 'success';
    case 'error':
    case 'paymentfailed':
      return 'error';
    case 'warning':
    case 'servicecancelled':
      return 'warning';
    default:
      return 'info';
  }
}

export const {
  addNotification,
  removeNotification,
  clearAllNotifications,
  addSignalRNotification,
  addSignalRMessage,
  addSystemNotification,
  setUnreadCount,
  setSignalRConnectionStatus,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} = notificationSlice.actions;

export default notificationSlice.reducer;