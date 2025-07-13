// ClientApp/src/App.tsx - Fixed Router nesting issue
import React, { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom'; // Remove BrowserRouter import
import { Provider } from 'react-redux';
import { store } from './store/store';
import { AppThemeProvider } from './themes/ThemeProvider';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { NotificationSystem } from './components/ui/NotificationSystem';
import { LoadingOverlay } from './components/ui/Loading';
import { Layout } from './components/Layout';
import { useAppSelector, useAppDispatch } from './store/hooks';
import { useSignalR } from './hooks/useSignalR';
import { getCurrentUser } from './store/slices/authSlice';

// Pages
import FlightCompanion from './components/FlightCompanion';
import Pickup from './components/Pickup';
import UserProfile from './components/UserProfile';
import CommunityGuidelines from './components/CommunityGuidelines';
import TermsOfService from './components/TermsOfService';
import AdminDashboard from './components/admin/AdminDashboard';
import Login from './components/Login';
import Register from './components/Register';
import { FetchData } from './components/FetchData';
import SignalRTest from './components/SignalRTest';

// App Content Component (needs access to Redux state)
const AppContent: React.FC = () => {
  const dispatch = useAppDispatch();
  const isLoading = useAppSelector((state) => state.ui.isLoading);

  // Initialize authentication on app load
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      dispatch(getCurrentUser());
    }
  }, [dispatch]);

  // Initialize SignalR
  useSignalR();

  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        console.error('Application Error:', error, errorInfo);
        // You can log to error reporting service here
      }}
      showDetails={process.env.NODE_ENV === 'development'}
    >
      <Layout>
        <Routes>
          <Route path="/" element={<FlightCompanion />} />
          <Route path="/flight-companion" element={<FlightCompanion />} />
          <Route path="/pickup" element={<Pickup />} />
          <Route path="/profile" element={<UserProfile />} />
          <Route path="/community-guidelines" element={<CommunityGuidelines />} />
          <Route path="/terms-of-service" element={<TermsOfService />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/fetch-data" element={<FetchData />} />
          <Route path="/signalr-test" element={<SignalRTest />} />
        </Routes>
      </Layout>

      {/* Global Loading Overlay */}
      <LoadingOverlay 
        open={isLoading} 
        message="Please wait..."
      />

      {/* Global Notification System */}
      <NotificationSystem
        maxNotifications={5}
        position={{ vertical: 'bottom', horizontal: 'right' }}
        transition="slide"
        autoHideDuration={6000}
      />
    </ErrorBoundary>
  );
};

// Main App Component
const App: React.FC = () => {
  return (
    <Provider store={store}>
      <AppThemeProvider>
        <AppContent />
      </AppThemeProvider>
    </Provider>
  );
};

export default App;