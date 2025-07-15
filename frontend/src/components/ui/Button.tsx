// ClientApp/src/components/ui/Button.tsx
import React from 'react';
import { Button as MuiButton, CircularProgress } from '@mui/material';
import { styled } from '@mui/material/styles';
import { SxProps, Theme } from '@mui/material/styles';

// TypeScript interfaces
export interface ButtonProps {
  children: React.ReactNode;
  variant?: 'text' | 'outlined' | 'contained';
  size?: 'small' | 'medium' | 'large';
  color?: 'inherit' | 'primary' | 'secondary' | 'success' | 'error' | 'info' | 'warning';
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
  sx?: SxProps<Theme>;
  'data-testid'?: string;
  // For link functionality - will render as <a> instead of <button>
  href?: string;
  target?: string;
  rel?: string;
  component?: React.ElementType;
}

// Styled button with Tailwind integration
const StyledButton = styled(MuiButton, {
  shouldForwardProp: (prop) => prop !== 'loading',
})<{ loading?: boolean }>(({ theme, loading }) => ({
  borderRadius: theme.spacing(1), // 8px
  fontWeight: 500,
  textTransform: 'none',
  boxShadow: 'none',
  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
  
  '&:hover': {
    boxShadow: theme.shadows[4],
    transform: 'translateY(-1px)',
  },
  
  '&:active': {
    transform: 'translateY(0)',
  },
  
  '&.Mui-disabled': {
    opacity: 0.6,
    cursor: 'not-allowed',
  },
  
  // Loading state
  ...(loading && {
    pointerEvents: 'none',
  }),
  
  // Size variants with Tailwind spacing
  '&.MuiButton-sizeSmall': {
    padding: theme.spacing(0.75, 2), // py-3 px-8
    fontSize: '0.875rem', // text-sm
    minHeight: theme.spacing(4), // h-8
  },
  
  '&.MuiButton-sizeMedium': {
    padding: theme.spacing(1, 3), // py-4 px-12
    fontSize: '0.9375rem', // text-base
    minHeight: theme.spacing(5), // h-10
  },
  
  '&.MuiButton-sizeLarge': {
    padding: theme.spacing(1.5, 4), // py-6 px-16
    fontSize: '1rem', // text-lg
    minHeight: theme.spacing(6), // h-12
  },
}));

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'contained',
  size = 'medium',
  color = 'primary',
  disabled = false,
  loading = false,
  fullWidth = false,
  startIcon,
  endIcon,
  onClick,
  type = 'button',
  className = '',
  sx,
  'data-testid': testId,
  href,
  target,
  rel,
  component,
  ...props
}) => {
  // Handle loading state
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (loading || disabled) {
      event.preventDefault();
      return;
    }
    onClick?.(event);
  };

  // Loading spinner
  const loadingSpinner = loading ? (
    <CircularProgress size={16} color="inherit" className="mr-2" />
  ) : null;

  // Tailwind classes based on variant and color
  const getTailwindClasses = () => {
    const baseClasses = 'font-medium transition-all duration-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2';
    
    if (variant === 'contained') {
      switch (color) {
        case 'primary':
          return `${baseClasses} bg-[var(--color-primary)] hover:bg-[var(--color-primary)]/90 text-white focus:ring-[var(--color-primary)]`;
        case 'secondary':
          return `${baseClasses} bg-[var(--color-secondary)] hover:bg-[var(--color-secondary)]/80 text-[var(--color-primary)] focus:ring-[var(--color-secondary)]`;
        case 'success':
          return `${baseClasses} bg-green-600 hover:bg-green-700 text-white focus:ring-green-500`;
        case 'error':
          return `${baseClasses} bg-red-600 hover:bg-red-700 text-white focus:ring-red-500`;
        case 'warning':
          return `${baseClasses} bg-yellow-600 hover:bg-yellow-700 text-white focus:ring-yellow-500`;
        case 'info':
          return `${baseClasses} bg-cyan-600 hover:bg-cyan-700 text-white focus:ring-cyan-500`;
        default:
          return `${baseClasses} bg-gray-600 hover:bg-gray-700 text-white focus:ring-gray-500`;
      }
    } else if (variant === 'outlined') {
      switch (color) {
        case 'primary':
          return `${baseClasses} border border-[var(--color-primary)] text-[var(--color-primary)] hover:bg-[var(--color-primary)]/10 dark:hover:bg-[var(--color-primary)]/20 focus:ring-[var(--color-primary)]`;
        case 'secondary':
          return `${baseClasses} border border-[var(--color-secondary)] text-[var(--color-secondary)] hover:bg-[var(--color-secondary)]/10 dark:hover:bg-[var(--color-secondary)]/20 focus:ring-[var(--color-secondary)]`;
        case 'success':
          return `${baseClasses} border border-green-600 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 focus:ring-green-500`;
        case 'error':
          return `${baseClasses} border border-red-600 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 focus:ring-red-500`;
        case 'warning':
          return `${baseClasses} border border-yellow-600 text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 focus:ring-yellow-500`;
        case 'info':
          return `${baseClasses} border border-cyan-600 text-cyan-600 hover:bg-cyan-50 dark:hover:bg-cyan-900/20 focus:ring-cyan-500`;
        default:
          return `${baseClasses} border border-gray-600 text-gray-600 hover:bg-gray-50 dark:hover:bg-gray-900/20 focus:ring-gray-500`;
      }
    } else { // text variant
      switch (color) {
        case 'primary':
          return `${baseClasses} text-[var(--color-primary)] hover:bg-[var(--color-primary)]/10 dark:hover:bg-[var(--color-primary)]/20 focus:ring-[var(--color-primary)]`;
        case 'secondary':
          return `${baseClasses} text-[var(--color-secondary)] hover:bg-[var(--color-secondary)]/10 dark:hover:bg-[var(--color-secondary)]/20 focus:ring-[var(--color-secondary)]`;
        case 'success':
          return `${baseClasses} text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 focus:ring-green-500`;
        case 'error':
          return `${baseClasses} text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 focus:ring-red-500`;
        case 'warning':
          return `${baseClasses} text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 focus:ring-yellow-500`;
        case 'info':
          return `${baseClasses} text-cyan-600 hover:bg-cyan-50 dark:hover:bg-cyan-900/20 focus:ring-cyan-500`;
        default:
          return `${baseClasses} text-gray-600 hover:bg-gray-50 dark:hover:bg-gray-900/20 focus:ring-gray-500`;
      }
    }
  };

  // Prepare props for MUI Button
  const buttonProps: any = {
    variant,
    size,
    color,
    disabled: disabled || loading,
    fullWidth,
    startIcon: loading ? loadingSpinner : startIcon,
    endIcon,
    onClick: handleClick,
    type,
    className: `${getTailwindClasses()} ${className}`.trim(),
    sx,
    'data-testid': testId,
    ...props
  };

  // If href is provided, render as link
  if (href) {
    buttonProps.component = component || 'a';
    buttonProps.href = href;
    if (target) buttonProps.target = target;
    if (rel) buttonProps.rel = rel;
    // Remove button-specific props when rendering as link
    delete buttonProps.type;
    delete buttonProps.onClick;
  }

  return (
    <StyledButton {...buttonProps}>
      {children}
    </StyledButton>
  );
};

export default Button;