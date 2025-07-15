// ClientApp/src/App.tsx - Fixed Router nesting issue
import React, { useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom'; // Remove BrowserRouter import
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
import PrivacyPolicy from './components/PrivacyPolicy';
import CookiePolicy from './components/CookiePolicy';
import AdminDashboard from './components/admin/AdminDashboard';
import Login from './components/Login';
import Register from './components/Register';
import SignalRTest from './components/SignalRTest';
import FAQ from './components/FAQ';
import HelpCenter from './components/HelpCenter';
import ContactUs from './components/ContactUs';
import Homepage from './components/Homepage';

// App Content Component (needs access to Redux state)
const AppContent: React.FC = () => {
  const dispatch = useAppDispatch();
  const isLoading = useAppSelector((state) => state.ui.isLoading);
  const location = useLocation();

  // Initialize authentication on app load
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      dispatch(getCurrentUser());
    }
  }, [dispatch]);

  // Initialize SignalR
  useSignalR();

  // Routes that should not use Layout wrapper
  const noLayoutRoutes = ['/'];
  const shouldUseLayout = !noLayoutRoutes.includes(location.pathname);

  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        console.error('Application Error:', error, errorInfo);
        // You can log to error reporting service here
      }}
      showDetails={process.env.NODE_ENV === 'development'}
    >
      {shouldUseLayout ? (
        <Layout>
          <Routes>
            <Route path="/flight-companion" element={<FlightCompanion />} />
            <Route path="/pickup" element={<Pickup />} />
            <Route path="/profile" element={<UserProfile />} />
            <Route path="/community-guidelines" element={<CommunityGuidelines />} />
            <Route path="/terms-of-service" element={<TermsOfService />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/cookie-policy" element={<CookiePolicy />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/signalr-test" element={<SignalRTest />} />
            <Route path="/faq" element={<FAQ />} />
            <Route path="/help" element={<HelpCenter />} />
            <Route path="/contact" element={<ContactUs />} />
          </Routes>
        </Layout>
      ) : (
        <Routes>
          <Route path="/" element={<Homepage />} />
        </Routes>
      )}

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