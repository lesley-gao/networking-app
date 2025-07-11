// Enhanced Modal component with comprehensive responsive design
// ClientApp/src/components/ui/Modal.tsx
import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  IconButton,
  Slide,
  Fade,
  Zoom,
  Grow,
  Paper,
  Backdrop,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { TransitionProps } from '@mui/material/transitions';
import { styled } from '@mui/material/styles';
import { SxProps, Theme } from '@mui/material/styles';

// TypeScript interfaces
export interface ModalProps {
  open: boolean;
  onClose?: () => void;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | false;
  fullWidth?: boolean;
  fullScreen?: boolean;
  transition?: 'fade' | 'slide' | 'zoom' | 'grow';
  showCloseButton?: boolean;
  className?: string;
  sx?: SxProps<Theme>;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
  disableEscapeKeyDown?: boolean;
  disableBackdropClick?: boolean;
  keepMounted?: boolean;
  responsive?: boolean; // Auto-adapt to mobile
}

export interface ModalHeaderProps {
  children: React.ReactNode;
  onClose?: () => void;
  showCloseButton?: boolean;
  className?: string;
  sx?: SxProps<Theme>;
}

export interface ModalContentProps {
  children: React.ReactNode;
  className?: string;
  sx?: SxProps<Theme>;
  dividers?: boolean;
}

export interface ModalActionsProps {
  children: React.ReactNode;
  className?: string;
  sx?: SxProps<Theme>;
}

// Define the compound component type
interface ModalComponent extends React.FC<ModalProps> {
  Header: React.FC<ModalHeaderProps>;
  Content: React.FC<ModalContentProps>;
  Actions: React.FC<ModalActionsProps>;
}

// Transition components
const SlideTransition = React.forwardRef<unknown, TransitionProps & { children: React.ReactElement }>(
  function Transition(props, ref) {
    return <Slide direction="up" ref={ref} {...props} />;
  }
);

const ZoomTransition = React.forwardRef<unknown, TransitionProps & { children: React.ReactElement }>(
  function Transition(props, ref) {
    return <Zoom ref={ref} {...props} />;
  }
);

const GrowTransition = React.forwardRef<unknown, TransitionProps & { children: React.ReactElement }>(
  function Transition(props, ref) {
    return <Grow ref={ref} {...props} />;
  }
);

// Styled components with enhanced responsive design
const StyledDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiDialog-paper': {
    borderRadius: theme.spacing(1.5), // 12px
    boxShadow: theme.shadows[16],
    margin: theme.spacing(2),
    maxHeight: 'calc(100vh - 32px)',
    width: '100%',
    
    // Enhanced responsive behavior
    [theme.breakpoints.down('sm')]: {
      margin: theme.spacing(1),
      maxHeight: 'calc(100vh - 16px)',
      borderRadius: theme.spacing(1),
    },
    
    // Full screen on very small devices
    [theme.breakpoints.down(400)]: {
      margin: 0,
      maxHeight: '100vh',
      height: '100vh',
      borderRadius: 0,
    },
  },
  
  '& .MuiBackdrop-root': {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    backdropFilter: 'blur(4px)',
  },
}));

const StyledDialogTitle = styled(DialogTitle)(({ theme }) => ({
  padding: theme.spacing(3),
  paddingBottom: theme.spacing(2),
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  borderBottom: `1px solid ${theme.palette.divider}`,
  
  '& .MuiTypography-root': {
    fontWeight: 600,
    fontSize: '1.25rem',
    lineHeight: 1.2,
    
    // Responsive text sizing
    [theme.breakpoints.down('sm')]: {
      fontSize: '1.125rem',
    },
  },
  
  // Responsive padding
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(2),
    paddingBottom: theme.spacing(1.5),
  },
}));

const StyledDialogContent = styled(DialogContent)(({ theme }) => ({
  padding: theme.spacing(3),
  
  '&.MuiDialogContent-dividers': {
    borderTop: `1px solid ${theme.palette.divider}`,
    borderBottom: `1px solid ${theme.palette.divider}`,
  },
  
  // Responsive padding
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(2),
  },
  
  // Enhanced scrolling on mobile
  [theme.breakpoints.down('sm')]: {
    maxHeight: 'calc(100vh - 200px)',
    overflowY: 'auto',
    WebkitOverflowScrolling: 'touch',
  },
}));

const StyledDialogActions = styled(DialogActions)(({ theme }) => ({
  padding: theme.spacing(2, 3, 3),
  gap: theme.spacing(1),
  
  '& .MuiButton-root': {
    minWidth: theme.spacing(10),
    minHeight: theme.spacing(5.5), // Touch-friendly size
  },
  
  // Responsive layout
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(2),
    flexDirection: 'column-reverse',
    '& .MuiButton-root': {
      width: '100%',
      margin: 0,
    },
  },
}));

// Get transition component
const getTransitionComponent = (transition: string) => {
  switch (transition) {
    case 'slide':
      return SlideTransition;
    case 'zoom':
      return ZoomTransition;
    case 'grow':
      return GrowTransition;
    default:
      return Fade;
  }
};

// Modal Header component
const ModalHeader: React.FC<ModalHeaderProps> = ({
  children,
  onClose,
  showCloseButton = true,
  className = '',
  sx,
  ...props
}) => {
  return (
    <StyledDialogTitle
      className={`${className} bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700`.trim()}
      sx={sx}
      {...props}
    >
      <div className="flex-1">{children}</div>
      {showCloseButton && onClose && (
        <IconButton
          onClick={onClose}
          size="small"
          className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 ml-2"
          sx={{ 
            minWidth: 'auto',
            minHeight: { xs: 40, sm: 32 }, // Larger touch target on mobile
            padding: { xs: 1.5, sm: 1 },
          }}
          aria-label="Close dialog"
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      )}
    </StyledDialogTitle>
  );
};

// Modal Content component
const ModalContent: React.FC<ModalContentProps> = ({
  children,
  className = '',
  sx,
  dividers = false,
  ...props
}) => {
  return (
    <StyledDialogContent
      className={`${className} bg-white dark:bg-gray-800 text-gray-900 dark:text-white`.trim()}
      sx={sx}
      dividers={dividers}
      {...props}
    >
      {children}
    </StyledDialogContent>
  );
};

// Modal Actions component
const ModalActions: React.FC<ModalActionsProps> = ({
  children,
  className = '',
  sx,
  ...props
}) => {
  return (
    <StyledDialogActions
      className={`${className} bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700`.trim()}
      sx={sx}
      {...props}
    >
      {children}
    </StyledDialogActions>
  );
};

// Main Modal component with enhanced responsive behavior
const ModalBase: React.FC<ModalProps> = ({
  open,
  onClose,
  title,
  subtitle,
  children,
  actions,
  maxWidth = 'sm',
  fullWidth = true,
  fullScreen = false,
  transition = 'fade',
  showCloseButton = true,
  className = '',
  sx,
  responsive = true,
  disableEscapeKeyDown = false,
  disableBackdropClick = false,
  keepMounted = false,
  ...props
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isExtraSmall = useMediaQuery('(max-width: 400px)');
  
  // Auto-adjust for responsive behavior
  const responsiveFullScreen = responsive && (fullScreen || isExtraSmall);
  const responsiveMaxWidth = responsive && isMobile ? false : maxWidth;
  
  const TransitionComponent = getTransitionComponent(transition);

  const handleClose = (_event: object, reason: string) => {
    if (disableBackdropClick && reason === 'backdropClick') return;
    if (disableEscapeKeyDown && reason === 'escapeKeyDown') return;
    onClose?.();
  };

  return (
    <StyledDialog
      open={open}
      onClose={handleClose}
      maxWidth={responsiveMaxWidth}
      fullWidth={fullWidth}
      fullScreen={responsiveFullScreen}
      TransitionComponent={TransitionComponent}
      keepMounted={keepMounted}
      className={`${className} dialog-responsive`.trim()}
      sx={{
        '& .MuiDialog-paper': {
          // Additional responsive adjustments
          ...(responsive && {
            [theme.breakpoints.up('sm')]: {
              minWidth: '400px',
            },
          }),
        },
        ...sx,
      }}
      aria-labelledby={title ? 'modal-title' : undefined}
      aria-describedby={subtitle ? 'modal-subtitle' : undefined}
      slots={{
        backdrop: Backdrop,
      }}
      slotProps={{
        backdrop: {
          className: 'bg-black/50 backdrop-blur-sm',
        },
      }}
      {...props}
    >
      <Paper className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl">
        {/* Header */}
        {(title || showCloseButton) && (
          <ModalHeader onClose={onClose} showCloseButton={showCloseButton}>
            <div>
              {title && (
                <div 
                  id="modal-title"
                  className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white"
                >
                  {title}
                </div>
              )}
              {subtitle && (
                <DialogContentText 
                  id="modal-subtitle"
                  className="text-sm text-gray-600 dark:text-gray-300 mt-1"
                >
                  {subtitle}
                </DialogContentText>
              )}
            </div>
          </ModalHeader>
        )}

        {/* Content */}
        <ModalContent>
          {children}
        </ModalContent>

        {/* Actions */}
        {actions && (
          <ModalActions>
            {actions}
          </ModalActions>
        )}
      </Paper>
    </StyledDialog>
  );
};

// Create the compound component with proper typing
export const Modal = ModalBase as ModalComponent;

// Attach the sub-components with proper typing
Modal.Header = ModalHeader;
Modal.Content = ModalContent;
Modal.Actions = ModalActions;

export default Modal;