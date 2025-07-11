// ClientApp/src/components/ui/NotificationSystem.tsx
import React from 'react';
import {
  Snackbar,
  Alert,
  Slide,
  Grow,
  Fade,
  IconButton,
  Button,
  Box,
  Typography,
  LinearProgress,
  Chip,
} from '@mui/material';
import {
  Close as CloseIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Undo as UndoIcon,
} from '@mui/icons-material';
import { TransitionProps } from '@mui/material/transitions';
import { styled } from '@mui/material/styles';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { removeNotification, addNotification } from '../../store/slices/uiSlice';

// TypeScript interfaces
export interface NotificationProps {
  id: string;
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
  onClose?: () => void;
}

interface NotificationSystemProps {
  maxNotifications?: number;
  position?: {
    vertical: 'top' | 'bottom';
    horizontal: 'left' | 'center' | 'right';
  };
  transition?: 'slide' | 'grow' | 'fade';
  autoHideDuration?: number;
}

// Transition components
const SlideTransition = React.forwardRef<unknown, TransitionProps & { children: React.ReactElement }>(
  function Transition(props, ref) {
    return <Slide direction="up" ref={ref} {...props} />;
  }
);

const GrowTransition = React.forwardRef<unknown, TransitionProps & { children: React.ReactElement }>(
  function Transition(props, ref) {
    return <Grow ref={ref} {...props} />;
  }
);

const FadeTransition = React.forwardRef<unknown, TransitionProps & { children: React.ReactElement }>(
  function Transition(props, ref) {
    return <Fade ref={ref} {...props} />;
  }
);

// Styled components
const StyledAlert = styled(Alert)(({ theme }) => ({
  minWidth: '320px',
  maxWidth: '600px',
  borderRadius: theme.spacing(1.5),
  boxShadow: theme.shadows[8],
  backdropFilter: 'blur(8px)',
  
  // Enhanced styling
  '& .MuiAlert-icon': {
    fontSize: '1.5rem',
  },
  
  '& .MuiAlert-message': {
    padding: '2px 0',
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(1),
  },
  
  '& .MuiAlert-action': {
    padding: '0 0 0 16px',
    marginRight: 0,
  },
  
  // Responsive
  [theme.breakpoints.down('sm')]: {
    minWidth: '280px',
    maxWidth: '90vw',
    margin: '0 16px',
  },
}));

const StyledNotificationContainer = styled(Box)(({ theme }) => ({
  position: 'fixed',
  zIndex: theme.zIndex.snackbar,
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(1),
  maxHeight: '80vh',
  overflow: 'hidden',
  
  // Different positions
  '&.position-top-right': {
    top: theme.spacing(3),
    right: theme.spacing(3),
  },
  '&.position-top-left': {
    top: theme.spacing(3),
    left: theme.spacing(3),
  },
  '&.position-top-center': {
    top: theme.spacing(3),
    left: '50%',
    transform: 'translateX(-50%)',
  },
  '&.position-bottom-right': {
    bottom: theme.spacing(3),
    right: theme.spacing(3),
  },
  '&.position-bottom-left': {
    bottom: theme.spacing(3),
    left: theme.spacing(3),
  },
  '&.position-bottom-center': {
    bottom: theme.spacing(3),
    left: '50%',
    transform: 'translateX(-50%)',
  },
  
  // Responsive
  [theme.breakpoints.down('sm')]: {
    left: theme.spacing(2),
    right: theme.spacing(2),
    transform: 'none',
    
    '&.position-top-center, &.position-bottom-center': {
      left: theme.spacing(2),
      right: theme.spacing(2),
      transform: 'none',
    },
  },
}));

// Individual Notification Component
const NotificationItem: React.FC<NotificationProps & {
  onDismiss: (id: string) => void;
  transition: string;
  autoHideDuration: number;
}> = ({
  id,
  message,
  type,
  duration,
  persistent = false,
  action,
  undoAction,
  showProgress = false,
  onClose,
  onDismiss,
  transition,
  autoHideDuration,
}) => {
  const [progress, setProgress] = React.useState(100);
  const [isVisible, setIsVisible] = React.useState(true);
  const progressRef = React.useRef<NodeJS.Timeout>();
  const hideTimeoutRef = React.useRef<NodeJS.Timeout>();

  const effectiveDuration = duration ?? autoHideDuration;

  // Memoize handleClose to avoid useEffect dependency issues
  const handleClose = React.useCallback(() => {
    setIsVisible(false);
    setTimeout(() => {
      onDismiss(id);
      onClose?.();
    }, 300); // Wait for exit animation
  }, [id, onDismiss, onClose]);

  // Handle auto-hide with progress
  React.useEffect(() => {
    if (persistent || effectiveDuration <= 0) return;

    if (showProgress) {
      const interval = 50; // Update every 50ms
      const steps = effectiveDuration / interval;
      const progressStep = 100 / steps;
      let currentProgress = 100;

      progressRef.current = setInterval(() => {
        currentProgress -= progressStep;
        if (currentProgress <= 0) {
          currentProgress = 0;
          clearInterval(progressRef.current!);
          handleClose();
        }
        setProgress(currentProgress);
      }, interval);
    } else {
      hideTimeoutRef.current = setTimeout(() => {
        handleClose();
      }, effectiveDuration);
    }

    return () => {
      if (progressRef.current) clearInterval(progressRef.current);
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    };
  }, [effectiveDuration, persistent, showProgress, handleClose]);

  const handleActionClick = () => {
    action?.handler();
    handleClose();
  };

  const handleUndoClick = () => {
    undoAction?.handler();
    handleClose();
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <SuccessIcon />;
      case 'error':
        return <ErrorIcon />;
      case 'warning':
        return <WarningIcon />;
      case 'info':
      default:
        return <InfoIcon />;
    }
  };

  const getTransitionComponent = () => {
    switch (transition) {
      case 'slide':
        return SlideTransition;
      case 'grow':
        return GrowTransition;
      case 'fade':
        return FadeTransition;
      default:
        return SlideTransition;
    }
  };

  const TransitionComponent = getTransitionComponent();

  return (
    <Snackbar
      open={isVisible}
      TransitionComponent={TransitionComponent}
      className="relative"
    >
      <StyledAlert
        severity={type}
        icon={getIcon()}
        action={
          <Box className="flex items-center gap-1">
            {undoAction && (
              <Button
                size="small"
                startIcon={<UndoIcon />}
                onClick={handleUndoClick}
                className="text-current hover:bg-black/10"
              >
                {undoAction.label}
              </Button>
            )}
            {action && (
              <Button
                size="small"
                onClick={handleActionClick}
                className="text-current hover:bg-black/10"
              >
                {action.label}
              </Button>
            )}
            {!persistent && (
              <IconButton
                size="small"
                onClick={handleClose}
                className="text-current hover:bg-black/10"
                aria-label="Close notification"
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            )}
          </Box>
        }
        className="animate-fade-in"
      >
        <Box className="w-full">
          <Typography variant="body2" className="font-medium">
            {message}
          </Typography>
          
          {showProgress && !persistent && effectiveDuration > 0 && (
            <LinearProgress
              variant="determinate"
              value={progress}
              className="mt-2 h-1 rounded-full"
              sx={{
                backgroundColor: 'rgba(255, 255, 255, 0.3)',
                '& .MuiLinearProgress-bar': {
                  backgroundColor: 'rgba(255, 255, 255, 0.7)',
                },
              }}
            />
          )}
        </Box>
      </StyledAlert>
    </Snackbar>
  );
};

// Main Notification System Component
export const NotificationSystem: React.FC<NotificationSystemProps> = ({
  maxNotifications = 5,
  position = { vertical: 'bottom', horizontal: 'right' },
  transition = 'slide',
  autoHideDuration = 6000,
}) => {
  const dispatch = useAppDispatch();
  const notifications = useAppSelector((state) => state.ui.notifications);

  const visibleNotifications = React.useMemo(() => {
    return notifications.slice(-maxNotifications);
  }, [notifications, maxNotifications]);

  const handleDismiss = (id: string) => {
    dispatch(removeNotification(id));
  };

  const positionClass = `position-${position.vertical}-${position.horizontal}`;

  if (visibleNotifications.length === 0) {
    return null;
  }

  return (
    <StyledNotificationContainer className={positionClass}>
      {visibleNotifications.map((notification) => (
        <NotificationItem
          key={notification.id}
          {...notification}
          onDismiss={handleDismiss}
          transition={transition}
          autoHideDuration={autoHideDuration}
        />
      ))}
      
      {/* Show overflow indicator */}
      {notifications.length > maxNotifications && (
        <Chip
          label={`+${notifications.length - maxNotifications} more`}
          size="small"
          className="self-center animate-fade-in"
          onClick={() => {
            // Optionally open a notifications panel
            console.log('Show all notifications');
          }}
        />
      )}
    </StyledNotificationContainer>
  );
};

// Notification Hook for easy usage
export const useNotification = () => {
  const dispatch = useAppDispatch();

  const showNotification = React.useCallback((
    message: string,
    type: 'success' | 'error' | 'warning' | 'info' = 'info',
    options?: {
      duration?: number;
      persistent?: boolean;
      action?: { label: string; handler: () => void };
      undoAction?: { label: string; handler: () => void };
      showProgress?: boolean;
    }
  ) => {
    dispatch(addNotification({
      message,
      type,
      duration: options?.duration,
      ...options,
    }));
  }, [dispatch]);

  const showSuccess = React.useCallback((message: string, options?: Parameters<typeof showNotification>[2]) => {
    showNotification(message, 'success', options);
  }, [showNotification]);

  const showError = React.useCallback((message: string, options?: Parameters<typeof showNotification>[2]) => {
    showNotification(message, 'error', { ...options, persistent: options?.persistent ?? true });
  }, [showNotification]);

  const showWarning = React.useCallback((message: string, options?: Parameters<typeof showNotification>[2]) => {
    showNotification(message, 'warning', options);
  }, [showNotification]);

  const showInfo = React.useCallback((message: string, options?: Parameters<typeof showNotification>[2]) => {
    showNotification(message, 'info', options);
  }, [showNotification]);

  return {
    showNotification,
    showSuccess,
    showError,
    showWarning,
    showInfo,
  };
};

export default NotificationSystem;