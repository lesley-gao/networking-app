// ClientApp/src/components/SignalRTest.tsx
import React, { useState, useEffect } from 'react';
import { Button, Card, CardContent, Typography, Alert, Box } from '@mui/material';
import { signalRService } from '../services/signalRService';

const SignalRTest: React.FC = () => {
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const [testMessage, setTestMessage] = useState<string>('');
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    // Initialize SignalR connection
    const initializeSignalR = async () => {
      setConnectionStatus('connecting');
      
      try {
        await signalRService.acquire(); // Use acquire instead of start
        // Set up event handlers
        signalRService.onNotificationReceived((notification) => {
          console.log('Received notification:', notification);
          setNotifications(prev => [...prev, { type: 'notification', data: notification, timestamp: new Date() }]);
        });

        signalRService.onMessageReceived((message) => {
          console.log('Received message:', message);
          setNotifications(prev => [...prev, { type: 'message', data: message, timestamp: new Date() }]);
        });

        signalRService.onSystemNotificationReceived((systemNotification) => {
          console.log('Received system notification:', systemNotification);
          setNotifications(prev => [...prev, { type: 'system', data: systemNotification, timestamp: new Date() }]);
        });

        setConnectionStatus('connected');
        
        console.log('SignalR connected successfully');
      } catch (error) {
        console.error('SignalR connection failed:', error);
        setConnectionStatus('disconnected');
      }
    };

    initializeSignalR();

    // Cleanup on unmount
    return () => {
      signalRService.release(); // Use release instead of stop
    };
  }, []);

  const testConnection = async () => {
    try {
      await signalRService.testConnection('Hello from React frontend!');
      setTestMessage('Test message sent successfully');
    } catch (error) {
      setTestMessage(`Test failed: ${error}`);
    }
  };

  const getConnectionStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return 'success';
      case 'connecting': return 'warning';
      case 'disconnected': return 'error';
    }
  };

  return (
    <Card className="m-4">
      <CardContent>
        <Typography variant="h5" component="h2" gutterBottom>
          SignalR Connection Test
        </Typography>
        
        <Alert severity={getConnectionStatusColor()} className="mb-4">
          Connection Status: {connectionStatus.toUpperCase()}
        </Alert>

        <Box className="mb-4">
          <Button 
            variant="contained" 
            onClick={testConnection}
            disabled={connectionStatus !== 'connected'}
            className="mr-2"
          >
            Test Connection
          </Button>
          
          <Button 
            variant="outlined" 
            onClick={() => setNotifications([])}
          >
            Clear Notifications
          </Button>
        </Box>

        {testMessage && (
          <Alert severity="info" className="mb-4">
            {testMessage}
          </Alert>
        )}

        <Typography variant="h6" gutterBottom>
          Real-time Notifications ({notifications.length})
        </Typography>
        
        <Box className="max-h-96 overflow-y-auto">
          {notifications.length === 0 ? (
            <Typography variant="body2" color="textSecondary">
              No notifications received yet. Create a pickup match or send a message to test.
            </Typography>
          ) : (
            notifications.reverse().map((notification, index) => (
              <Card key={index} variant="outlined" className="mb-2">
                <CardContent className="py-2">
                  <Typography variant="subtitle2" color="primary">
                    {notification.type.toUpperCase()} - {notification.timestamp.toLocaleTimeString()}
                  </Typography>
                  <Typography variant="body2" component="pre" className="whitespace-pre-wrap">
                    {JSON.stringify(notification.data, null, 2)}
                  </Typography>
                </CardContent>
              </Card>
            ))
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default SignalRTest;