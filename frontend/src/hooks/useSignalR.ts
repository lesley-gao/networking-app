// ClientApp/src/hooks/useSignalR.ts
import { useEffect } from "react";
import { useAppDispatch } from "../store/hooks";
import {
  addSignalRNotification,
  addSignalRMessage,
  addSystemNotification,
  //setUnreadCount,
  setSignalRConnectionStatus,
  markNotificationAsRead,
  //markAllNotificationsAsRead
} from "../store/slices/notificationSlice";
import { signalRService } from "../services/signalRService";

export const useSignalR = () => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    let isSubscribed = true;

    const initializeSignalR = async () => {
      try {
        // Set up event handlers - using the correct method names from signalRService
        signalRService.onNotificationReceived((notification) => {
          if (isSubscribed) {
            dispatch(addSignalRNotification(notification));
          }
        });

        signalRService.onMessageReceived((message) => {
          if (isSubscribed) {
            dispatch(addSignalRMessage(message));
          }
        });

        signalRService.onSystemNotificationReceived((notification) => {
          if (isSubscribed) {
            dispatch(addSystemNotification(notification));
          }
        });

        signalRService.onNotificationMarkedAsRead((data) => {
          if (isSubscribed && data.notificationId) {
            dispatch(markNotificationAsRead(data.notificationId));
          }
        });

        // Set up test response handler for debugging
        signalRService.onTestResponse((response) => {
          console.log("SignalR Test Response:", response);
        });

        // Start the connection
        await signalRService.start();

        if (isSubscribed) {
          dispatch(setSignalRConnectionStatus(true));
          console.log("SignalR connected and ready");
        }
      } catch (error) {
        console.error("Failed to initialize SignalR:", error);
        if (isSubscribed) {
          dispatch(setSignalRConnectionStatus(false));
        }
      }
    };

    initializeSignalR();

    // Cleanup function
    return () => {
      isSubscribed = false;
      signalRService.stop();
      dispatch(setSignalRConnectionStatus(false));
    };
  }, [dispatch]);

  return {
    markNotificationAsRead: (notificationId: number) =>
      signalRService.markNotificationAsRead(notificationId),
    sendTypingIndicator: (receiverId: number, isTyping: boolean) =>
      signalRService.sendTypingIndicator(receiverId, isTyping),
    testConnection: (message: string) => signalRService.testConnection(message),
    joinGroup: (groupName: string) => signalRService.joinGroup(groupName),
    leaveGroup: (groupName: string) => signalRService.leaveGroup(groupName),
    isConnected: () => signalRService.isConnected(),
    getConnectionState: () => signalRService.getConnectionState(),
  };
};
