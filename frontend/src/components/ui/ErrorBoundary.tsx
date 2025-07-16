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
import ContentCopyIcon from '@mui/icons-material/ContentCopy';

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

// Elegant Error Fallback Component
const ElegantErrorFallback: React.FC<{
  error?: Error;
  errorInfo?: ErrorInfo;
  onRetry: () => void;
  showDetails: boolean;
  onToggleDetails: () => void;
}> = ({ error, errorInfo, onRetry, showDetails, onToggleDetails }) => {
  const isDevelopment = process.env.NODE_ENV === 'development';
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    if (!error) return;
    const details = [
      `Message: ${error.message}`,
      error.stack ? `\nStack Trace:\n${error.stack}` : '',
      errorInfo?.componentStack ? `\nComponent Stack:\n${errorInfo.componentStack}` : '',
    ].join('\n');
    navigator.clipboard.writeText(details);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Container maxWidth="sm" className="py-16 animate-fade-in">
      <Paper
        elevation={4}
        sx={{
          p: { xs: 3, sm: 6 },
          borderRadius: 4,
          border: theme => `2px solid ${theme.palette.error.light}`,
          textAlign: 'center',
          boxShadow: 6,
          position: 'relative',
          overflow: 'hidden',
        }}
        role="alert"
        aria-live="assertive"
      >
        {/* Airplane Art Image - Bottom Right Corner */}
        <Box
          sx={{
            position: 'absolute',
            bottom: 0,
            right: 0,
            width: { xs: 80, sm: 120 },
            height: { xs: 80, sm: 120 },
            opacity: 0.1,
            zIndex: 0,
            pointerEvents: 'none',
          }}
        >
          <img
            src="/images/airplane-art.png"
            alt="Airplane decoration"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
            }}
          />
        </Box>
        <ErrorIcon sx={{ fontSize: 70, color: 'error.main', mb: 2, opacity: 0.85 }} />
        <Typography variant="h4" fontWeight={700} color="error.main" gutterBottom>
          Something went wrong
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          Sorry, we hit a snag. Try refreshing the page, or contact us if the problem continues.
        </Typography>
        <Box className="flex flex-col sm:flex-row gap-3 justify-center mb-6">
          <Button
            variant="contained"
            color="primary"
            size="large"
            startIcon={<RefreshIcon />}
            onClick={onRetry}
            sx={{ minWidth: 140, fontWeight: 600, boxShadow: 2 }}
            aria-label="Try again"
          >
            Try Again
          </Button>
          <Button
            variant="outlined"
     
            size="large"
            className="bg-[#DC6E6A] text-white border-[#DC6E6A]"
            onClick={() => window.location.href = '/'}
            sx={{ minWidth: 140 }}
            aria-label="Go home"
          >
            Go Home
          </Button>
        </Box>
        {isDevelopment && error && (
          <Box sx={{ textAlign: 'left', mt: 2 }}>
            <Button
              onClick={onToggleDetails}
              startIcon={<BugReportIcon />}
              endIcon={
                <ExpandMoreIcon
                  sx={{
                    transform: showDetails ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.3s',
                  }}
                />
              }
              variant="text"
              size="small"
              sx={{ mb: 1, fontWeight: 500 }}
              aria-label="Toggle technical details"
            >
              {showDetails ? 'Hide' : 'Show'} Technical Details
            </Button>
            <Collapse in={showDetails} timeout={300}>
              <Alert
                severity="error"
                sx={{
                  mt: 2,
                  fontFamily: 'monospace',
                  background: '#fff',
                  borderRadius: 2,
                  boxShadow: 1,
                  border: '1px solid #DC6E6A',
                  wordBreak: 'break-word',
                }}
              >
                <AlertTitle sx={{ fontWeight: 700 }}>Error Details</AlertTitle>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>Message:</strong> {error.message}
                </Typography>
                {error.stack && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2" fontWeight={700} mb={0.5}>
                      Stack Trace:
                    </Typography>
                    <pre style={{ whiteSpace: 'pre-wrap', fontSize: 12, background: '#fbe9e7', padding: 8, borderRadius: 4, overflowX: 'auto' }}>{error.stack}</pre>
                  </Box>
                )}
                {errorInfo?.componentStack && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2" fontWeight={700} mb={0.5}>
                      Component Stack:
                    </Typography>
                    <pre style={{ whiteSpace: 'pre-wrap', fontSize: 12, background: '#fbe9e7', padding: 8, borderRadius: 4, overflowX: 'auto' }}>{errorInfo.componentStack}</pre>
                  </Box>
                )}
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<ContentCopyIcon />}
                  onClick={handleCopy}
                  sx={{ mt: 2 }}
                  aria-label="Copy error details"
                >
                  {copied ? 'Copied!' : 'Copy error details'}
                </Button>
              </Alert>
            </Collapse>
          </Box>
        )}
        <Box sx={{ mt: 6, pt: 3, borderTop: '1px solid', borderColor: 'grey.200' }}>
          <Typography variant="body2" color="text.secondary" mb={1}>
            Need help? Contact our support team
          </Typography>
          <Box className="flex flex-col sm:flex-row gap-2 justify-center">
            <Button
              variant="text"
              size="small"
              href="mailto:support@wingcompanion.co.nz"
              sx={{ color: 'primary.main', fontWeight: 500 }}
              aria-label="Email support"
            >
              Email Support
            </Button>
            <Button
              variant="text"
              size="small"
              href="/help-center"
              sx={{ color: 'primary.main', fontWeight: 500 }}
              aria-label="Help center"
            >
              Help Center
            </Button>
          </Box>
        </Box>
      </Paper>
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
        <ElegantErrorFallback
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