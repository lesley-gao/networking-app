// ClientApp/src/components/ui/Loading.tsx
import React from 'react';
import {
  CircularProgress,
  LinearProgress,
  Skeleton,
  Box,
  Typography,
  Fade,
} from '@mui/material';
import { styled } from '@mui/material/styles';

// TypeScript interfaces
export interface LoadingSpinnerProps {
  size?: number | 'small' | 'medium' | 'large';
  color?: 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' | 'inherit';
  thickness?: number;
  className?: string;
  overlay?: boolean;
  message?: string;
}

export interface LoadingBarProps {
  variant?: 'determinate' | 'indeterminate' | 'buffer' | 'query';
  value?: number;
  valueBuffer?: number;
  color?: 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' | 'inherit';
  className?: string;
  showPercentage?: boolean;
}

export interface LoadingSkeletonProps {
  variant?: 'text' | 'rectangular' | 'rounded' | 'circular';
  width?: string | number;
  height?: string | number;
  className?: string;
  animation?: 'pulse' | 'wave' | false;
  count?: number;
}

export interface LoadingOverlayProps {
  open: boolean;
  message?: string;
  backdrop?: boolean;
  children?: React.ReactNode;
}

// Styled components
const StyledOverlay = styled(Box)(({ theme }) => ({
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
  backdropFilter: 'blur(4px)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: theme.zIndex.modal,
  flexDirection: 'column',
  gap: theme.spacing(2),
}));

const StyledLoadingContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: theme.spacing(2),
  padding: theme.spacing(3),
  backgroundColor: theme.palette.background.paper,
  borderRadius: theme.spacing(2),
  boxShadow: theme.shadows[8],
  minWidth: '200px',
  
  // Responsive sizing
  [theme.breakpoints.down('sm')]: {
    margin: theme.spacing(2),
    minWidth: '160px',
    padding: theme.spacing(2),
  },
}));

// Loading Spinner Component
export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'medium',
  color = 'primary',
  thickness = 3.6,
  className = '',
  overlay = false,
  message,
}) => {
  const spinner = (
    <CircularProgress
      size={size}
      color={color}
      thickness={thickness}
      className={`${className} animate-fade-in`.trim()}
    />
  );

  if (overlay) {
    return (
      <Fade in timeout={300}>
        <StyledOverlay>
          <StyledLoadingContainer>
            {spinner}
            {message && (
              <Typography 
                variant="body2" 
                className="text-gray-600 dark:text-gray-300 text-center"
              >
                {message}
              </Typography>
            )}
          </StyledLoadingContainer>
        </StyledOverlay>
      </Fade>
    );
  }

  return (
    <Box className="flex flex-col items-center gap-2">
      {spinner}
      {message && (
        <Typography 
          variant="body2" 
          className="text-gray-600 dark:text-gray-300 text-center"
        >
          {message}
        </Typography>
      )}
    </Box>
  );
};

// Loading Bar Component
export const LoadingBar: React.FC<LoadingBarProps> = ({
  variant = 'indeterminate',
  value,
  valueBuffer,
  color = 'primary',
  className = '',
  showPercentage = false,
}) => {
  return (
    <Box className={`w-full ${className}`.trim()}>
      <LinearProgress
        variant={variant}
        value={value}
        valueBuffer={valueBuffer}
        color={color}
        className="h-2 rounded-full animate-fade-in"
        sx={{
          backgroundColor: 'rgba(0, 0, 0, 0.1)',
          '& .MuiLinearProgress-bar': {
            borderRadius: '4px',
          },
        }}
      />
      {showPercentage && value !== undefined && (
        <Typography 
          variant="caption" 
          className="text-gray-500 dark:text-gray-400 mt-1 text-center block"
        >
          {Math.round(value)}%
        </Typography>
      )}
    </Box>
  );
};

// Loading Skeleton Component
export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
  variant = 'text',
  width,
  height,
  className = '',
  animation = 'wave',
  count = 1,
}) => {
  const skeletons = Array.from({ length: count }, (_, index) => (
    <Skeleton
      key={index}
      variant={variant}
      width={width}
      height={height}
      animation={animation}
      className={`${className} animate-fade-in`.trim()}
      sx={{
        backgroundColor: 'rgba(0, 0, 0, 0.06)',
        '&::after': {
          background: 'linear-gradient(90deg, transparent, rgba(0, 0, 0, 0.04), transparent)',
        },
      }}
    />
  ));

  return count > 1 ? (
    <Box className="space-y-2">
      {skeletons}
    </Box>
  ) : (
    skeletons[0]
  );
};

// Loading Overlay Component
export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  open,
  message = 'Loading...',
  backdrop = true,
  children,
}) => {
  if (!open) return null;

  return (
    <Fade in={open} timeout={300}>
      <StyledOverlay 
        className={backdrop ? 'bg-black/50 backdrop-blur-sm' : 'bg-transparent'}
      >
        {children || (
          <StyledLoadingContainer className="animate-scale-in">
            <LoadingSpinner size={48} />
            <Typography 
              variant="body1" 
              className="text-gray-700 dark:text-gray-200 font-medium"
            >
              {message}
            </Typography>
          </StyledLoadingContainer>
        )}
      </StyledOverlay>
    </Fade>
  );
};

// Card Loading Skeleton
export const CardSkeleton: React.FC<{ count?: number }> = ({ count = 1 }) => {
  const skeleton = (
    <Box className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg animate-fade-in">
      <Box className="flex items-center space-x-3 mb-3">
        <LoadingSkeleton variant="circular" width={40} height={40} />
        <Box className="flex-1">
          <LoadingSkeleton variant="text" width="60%" height={20} />
          <LoadingSkeleton variant="text" width="40%" height={16} />
        </Box>
      </Box>
      <LoadingSkeleton variant="rectangular" width="100%" height={120} className="mb-3" />
      <LoadingSkeleton variant="text" width="80%" />
      <LoadingSkeleton variant="text" width="60%" />
    </Box>
  );

  return count > 1 ? (
    <Box className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }, (_, index) => (
        <Box key={index}>{skeleton}</Box>
      ))}
    </Box>
  ) : (
    skeleton
  );
};

// Table Loading Skeleton
export const TableSkeleton: React.FC<{ rows?: number; columns?: number }> = ({ 
  rows = 5, 
  columns = 4 
}) => {
  return (
    <Box className="space-y-2 animate-fade-in">
      {/* Header */}
      <Box className="flex space-x-4 p-4 border-b">
        {Array.from({ length: columns }, (_, index) => (
          <LoadingSkeleton key={index} variant="text" width="100%" height={20} />
        ))}
      </Box>
      
      {/* Rows */}
      {Array.from({ length: rows }, (_, rowIndex) => (
        <Box key={rowIndex} className="flex space-x-4 p-4">
          {Array.from({ length: columns }, (_, colIndex) => (
            <LoadingSkeleton key={colIndex} variant="text" width="100%" height={16} />
          ))}
        </Box>
      ))}
    </Box>
  );
};

export default {
  Spinner: LoadingSpinner,
  Bar: LoadingBar,
  Skeleton: LoadingSkeleton,
  Overlay: LoadingOverlay,
  CardSkeleton,
  TableSkeleton,
};