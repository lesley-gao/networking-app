// ClientApp/src/components/ui/Button.stories.tsx
import React from 'react';
import { Meta, StoryObj } from '@storybook/react';
import { Button } from './Button';
import { Add, Download, Delete, Save } from '@mui/icons-material';

const meta: Meta<typeof Button> = {
  title: 'UI Components/Button',
  component: Button,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A versatile button component built on MUI Button with enhanced features like loading states and proper link support.',
      },
    },
  },
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['text', 'outlined', 'contained'],
      description: 'Button variant style',
    },
    size: {
      control: { type: 'select' },
      options: ['small', 'medium', 'large'],
      description: 'Button size',
    },
    color: {
      control: { type: 'select' },
      options: ['inherit', 'primary', 'secondary', 'success', 'error', 'info', 'warning'],
      description: 'Button color theme',
    },
    disabled: {
      control: 'boolean',
      description: 'Disable the button',
    },
    loading: {
      control: 'boolean',
      description: 'Show loading state',
    },
    fullWidth: {
      control: 'boolean',
      description: 'Make button full width',
    },
    onClick: {
      action: 'clicked',
      description: 'Click handler',
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Button>;

// Basic variants
export const Primary: Story = {
  args: {
    children: 'Primary Button',
    variant: 'contained',
    color: 'primary',
  },
};

export const Secondary: Story = {
  args: {
    children: 'Secondary Button',
    variant: 'outlined',
    color: 'secondary',
  },
};

export const Text: Story = {
  args: {
    children: 'Text Button',
    variant: 'text',
  },
};

// Sizes
export const Small: Story = {
  args: {
    children: 'Small Button',
    size: 'small',
    variant: 'contained',
  },
};

export const Medium: Story = {
  args: {
    children: 'Medium Button',
    size: 'medium',
    variant: 'contained',
  },
};

export const Large: Story = {
  args: {
    children: 'Large Button',
    size: 'large',
    variant: 'contained',
  },
};

// Colors
export const Success: Story = {
  args: {
    children: 'Success',
    variant: 'contained',
    color: 'success',
  },
};

export const Error: Story = {
  args: {
    children: 'Error',
    variant: 'contained',
    color: 'error',
  },
};

export const Warning: Story = {
  args: {
    children: 'Warning',
    variant: 'contained',
    color: 'warning',
  },
};

export const Info: Story = {
  args: {
    children: 'Info',
    variant: 'contained',
    color: 'info',
  },
};

// States
export const Loading: Story = {
  args: {
    children: 'Loading Button',
    variant: 'contained',
    loading: true,
  },
};

export const Disabled: Story = {
  args: {
    children: 'Disabled Button',
    variant: 'contained',
    disabled: true,
  },
};

export const FullWidth: Story = {
  parameters: {
    layout: 'padded',
  },
  args: {
    children: 'Full Width Button',
    variant: 'contained',
    fullWidth: true,
  },
};

// With icons
export const WithStartIcon: Story = {
  args: {
    children: 'Add Item',
    variant: 'contained',
    startIcon: <Add />,
  },
};

export const WithEndIcon: Story = {
  args: {
    children: 'Download',
    variant: 'outlined',
    endIcon: <Download />,
  },
};

// As link
export const AsLink: Story = {
  args: {
    children: 'Open Link',
    variant: 'contained',
    href: 'https://example.com',
    target: '_blank',
    rel: 'noopener noreferrer',
  },
};

// Application specific examples
export const FlightCompanionActions: Story = {
  name: 'Flight Companion Actions',
  render: () => (
    <div className="space-x-2">
      <Button variant="outlined" startIcon={<Save />}>
        Save Request
      </Button>
      <Button variant="contained" color="primary">
        Find Helper
      </Button>
      <Button variant="text" color="error" startIcon={<Delete />}>
        Cancel
      </Button>
    </div>
  ),
};

export const PickupBookingFlow: Story = {
  name: 'Pickup Booking Flow',
  render: () => (
    <div className="space-y-2 w-64">
      <Button variant="contained" fullWidth>
        Book Pickup
      </Button>
      <Button variant="outlined" fullWidth>
        View Details
      </Button>
      <Button variant="text" fullWidth color="error">
        Cancel Booking
      </Button>
    </div>
  ),
};

// Theme variations
export const DarkTheme: Story = {
  parameters: {
    backgrounds: { default: 'dark' },
  },
  decorators: [
    (Story) => (
      <div className="dark space-x-2">
        <Story />
      </div>
    ),
  ],
  render: () => (
    <>
      <Button variant="contained">Dark Primary</Button>
      <Button variant="outlined">Dark Outlined</Button>
      <Button variant="text">Dark Text</Button>
    </>
  ),
};