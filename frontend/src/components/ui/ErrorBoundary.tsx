// ClientApp/src/components/ui/ErrorBoundary.tsx
import React, { Component, ErrorInfo, ReactNode } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Container,
  Alert,
  AlertTitle,
  Collapse,
} from '@mui/material';
import {
  Error as ErrorIcon,
  Refresh as RefreshIcon,
  ExpandMore as ExpandMoreIcon,
  BugReport as BugReportIcon,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';

// TypeScript interfaces
interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  showDetails?: boolean;
  className?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  showDetails: boolean;
}

// Styled components
const StyledErrorContainer = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  textAlign: 'center',
  borderRadius: theme.spacing(2),
  border: `2px solid ${theme.palette.error.light}`,
  backgroundColor: theme.palette.error.light || '#ffebee',
  
  // Responsive padding
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(3),
    margin: theme.spacing(2),
  },
}));

const StyledErrorIcon = styled(ErrorIcon)(({ theme }) => ({
  fontSize: '4rem',
  color: theme.palette.error.main,
  marginBottom: theme.spacing(2),
  
  [theme.breakpoints.down('sm')]: {
    fontSize: '3rem',
  },
}));

// Error Fallback Component
const ErrorFallback: React.FC<{
  error?: Error;
  errorInfo?: ErrorInfo;
  onRetry: () => void;
  showDetails: boolean;
  onToggleDetails: () => void;
}> = ({ error, errorInfo, onRetry, showDetails, onToggleDetails }) => {
  const isDevelopment = process.env.NODE_ENV === 'development';

  return (
    <Container maxWidth="md" className="py-8">
      <StyledErrorContainer elevation={3} className="animate-fade-in">
        <StyledErrorIcon />
        
        <Typography 
          variant="h4" 
          gutterBottom 
          className="text-red-600 dark:text-red-400 font-bold mb-4"
        >
          Oops! Something went wrong
        </Typography>
        
        <Typography 
          variant="body1" 
          className="text-gray-700 dark:text-gray-300 mb-6 max-w-md mx-auto"
        >
          We're sorry, but an unexpected error occurred. Please try refreshing the page or contact support if the problem persists.
        </Typography>

        {/* Action Buttons */}
        <Box className="flex flex-col sm:flex-row gap-3 justify-center mb-6">
          <Button
            variant="contained"
            color="primary"
            size="large"
            startIcon={<RefreshIcon />}
            onClick={onRetry}
            className="min-w-[140px]"
          >
            Try Again
          </Button>
          
          <Button
            variant="outlined"
            color="secondary"
            size="large"
            onClick={() => window.location.href = '/'}
            className="min-w-[140px]"
          >
            Go Home
          </Button>
        </Box>

        {/* Error Details (Development Mode) */}
        {isDevelopment && error && (
          <Box className="text-left">
            <Button
              onClick={onToggleDetails}
              startIcon={<BugReportIcon />}
              endIcon={
                <ExpandMoreIcon 
                  sx={{ 
                    transform: showDetails ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.3s ease',
                  }} 
                />
              }
              variant="text"
              size="small"
              className="mb-3"
            >
              {showDetails ? 'Hide' : 'Show'} Technical Details
            </Button>

            <Collapse in={showDetails} timeout={300}>
              <Alert 
                severity="error" 
                className="text-left animate-slide-up"
                sx={{ 
                  '& .MuiAlert-message': { 
                    width: '100%',
                    wordBreak: 'break-word',
                  } 
                }}
              >
                <AlertTitle className="font-bold">Error Details</AlertTitle>
                
                <Typography variant="body2" className="font-mono mb-2">
                  <strong>Message:</strong> {error.message}
                </Typography>
                
                {error.stack && (
                  <Box className="mt-3">
                    <Typography variant="body2" className="font-bold mb-1">
                      Stack Trace:
                    </Typography>
                    <pre className="whitespace-pre-wrap text-xs bg-red-50 dark:bg-red-900/20 p-2 rounded overflow-x-auto">
                      {error.stack}
                    </pre>
                  </Box>
                )}
                
                {errorInfo?.componentStack && (
                  <Box className="mt-3">
                    <Typography variant="body2" className="font-bold mb-1">
                      Component Stack:
                    </Typography>
                    <pre className="whitespace-pre-wrap text-xs bg-red-50 dark:bg-red-900/20 p-2 rounded overflow-x-auto">
                      {errorInfo.componentStack}
                    </pre>
                  </Box>
                )}
              </Alert>
            </Collapse>
          </Box>
        )}

        {/* Help Links */}
        <Box className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-600">
          <Typography variant="body2" className="text-gray-500 dark:text-gray-400 mb-2">
            Need help? Contact our support team
          </Typography>
          <Box className="flex flex-col sm:flex-row gap-2 justify-center">
            <Button
              variant="text"
              size="small"
              href="mailto:support@networkingapp.co.nz"
              className="text-blue-600 hover:text-blue-800"
            >
              Email Support
            </Button>
            <Button
              variant="text"
              size="small"
              href="/help"
              className="text-blue-600 hover:text-blue-800"
            >
              Help Center
            </Button>
          </Box>
        </Box>
      </StyledErrorContainer>
    </Container>
  );
};

// Error Boundary Class Component
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      showDetails: false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Call the optional onError callback
    this.props.onError?.(error, errorInfo);
    
    // Update state with error info
    this.setState({
      error,
      errorInfo,
    });

    // Log to error reporting service (e.g., Sentry)
    if (process.env.NODE_ENV === 'production') {
      // window.Sentry?.captureException(error, { contexts: { react: { componentStack: errorInfo.componentStack } } });
    }
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: undefined,
      errorInfo: undefined,
      showDetails: false,
    });
  };

  handleToggleDetails = () => {
    this.setState(prevState => ({
      showDetails: !prevState.showDetails,
    }));
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <ErrorFallback
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          onRetry={this.handleRetry}
          showDetails={this.state.showDetails}
          onToggleDetails={this.handleToggleDetails}
        />
      );
    }

    return this.props.children;
  }
}

// Functional Error Boundary Hook
export const useErrorBoundary = () => {
  const [error, setError] = React.useState<Error | null>(null);

  const resetError = React.useCallback(() => {
    setError(null);
  }, []);

  const captureError = React.useCallback((error: Error) => {
    setError(error);
  }, []);

  React.useEffect(() => {
    if (error) {
      throw error;
    }
  }, [error]);

  return {
    captureError,
    resetError,
  };
};

// Higher-Order Component for Error Boundaries
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
) => {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
};

export default ErrorBoundary;