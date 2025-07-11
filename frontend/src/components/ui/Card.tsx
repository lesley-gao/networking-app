// ClientApp/src/components/ui/Card.tsx
import React from 'react';
import { 
  Card as MuiCard, 
  CardContent as MuiCardContent, 
  CardActions as MuiCardActions, 
  CardHeader as MuiCardHeader 
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { SxProps, Theme } from '@mui/material/styles';

// TypeScript interfaces
export interface CardProps {
  children?: React.ReactNode;
  className?: string;
  elevation?: number;
  variant?: 'elevation' | 'outlined';
  sx?: SxProps<Theme>;
  hover?: boolean;
  onClick?: () => void;
  'data-testid'?: string;
  loading?: boolean; // Add this line
}

export interface CardHeaderProps {
  title?: React.ReactNode;
  subheader?: React.ReactNode;
  action?: React.ReactNode;
  avatar?: React.ReactNode;
  className?: string;
  sx?: SxProps<Theme>;
}

export interface CardContentProps {
  children: React.ReactNode;
  className?: string;
  sx?: SxProps<Theme>;
}

export interface CardActionsProps {
  children: React.ReactNode;
  className?: string;
  disableSpacing?: boolean;
  sx?: SxProps<Theme>;
}

// Styled components with Tailwind integration
const StyledCard = styled(MuiCard, {
  shouldForwardProp: (prop) => prop !== 'hover',
})<{ hover?: boolean }>(({ theme, hover }) => ({
  borderRadius: theme.spacing(1.5), // 12px
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  border: `1px solid ${theme.palette.divider}`,
  
  ...(hover && {
    cursor: 'pointer',
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: theme.shadows[8],
    },
  }),
  
  // Dark mode support
  [theme.breakpoints.up('xs')]: {
    '.dark &': {
      backgroundColor: theme.palette.mode === 'dark' ? '#1f2937' : theme.palette.background.paper,
      borderColor: theme.palette.mode === 'dark' ? '#374151' : theme.palette.divider,
    },
  },
}));

// Card Header component
const CardHeader: React.FC<CardHeaderProps> = ({
  title,
  subheader,
  action,
  avatar,
  className = '',
  sx,
  ...props
}) => {
  return (
    <MuiCardHeader
      title={title}
      subheader={subheader}
      action={action}
      avatar={avatar}
      className={`${className} bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700`}
      sx={sx}
      {...props}
    />
  );
};

// Card Content component
const CardContent: React.FC<CardContentProps> = ({
  children,
  className = '',
  sx,
  ...props
}) => {
  return (
    <MuiCardContent
      className={`${className} p-6`}
      sx={sx}
      {...props}
    >
      {children}
    </MuiCardContent>
  );
};

// Card Actions component
const CardActions: React.FC<CardActionsProps> = ({
  children,
  className = '',
  disableSpacing = false,
  sx,
  ...props
}) => {
  return (
    <MuiCardActions
      disableSpacing={disableSpacing}
      className={`${className} px-6 py-4 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700`}
      sx={sx}
      {...props}
    >
      {children}
    </MuiCardActions>
  );
};

// Main Card component implementation
const CardComponent: React.FC<CardProps> = ({
  children,
  className = '',
  elevation = 1,
  variant = 'elevation',
  sx,
  hover = false,
  onClick,
  loading = false, // Add this parameter
  'data-testid': testId,
  ...props
}) => {
  // Show loading skeleton when loading is true
  if (loading) {
    return (
      <div data-testid="card-skeleton">
        {/* You could use the CardSkeleton component here */}
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <StyledCard
      elevation={elevation}
      variant={variant}
      hover={hover}
      onClick={onClick}
      className={`${className} bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700`}
      sx={sx}
      data-testid={testId}
      {...props}
    >
      {children}
    </StyledCard>
  );
};

// Create the compound component by adding properties to the main component
export const Card = Object.assign(CardComponent, {
  Header: CardHeader,
  Content: CardContent,
  Actions: CardActions,
});

// Export individual components as well
export { CardHeader, CardContent, CardActions };

export default Card;