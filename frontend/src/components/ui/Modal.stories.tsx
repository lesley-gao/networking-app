// ClientApp/src/components/ui/Modal.stories.tsx
import React from 'react';
import { Meta, StoryObj } from '@storybook/react';
import { Modal } from './Modal';
import { Button } from './Button';
import Input from './Input';
import { useState } from 'react';
import { Warning, CheckCircle, Info } from '@mui/icons-material';

const meta: Meta<typeof Modal> = {
  title: 'UI Components/Modal',
  component: Modal,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A feature-rich modal component with multiple transition effects, compound components, and theme support.',
      },
    },
  },
  argTypes: {
    open: {
      control: 'boolean',
      description: 'Whether the modal is open',
    },
    maxWidth: {
      control: { type: 'select' },
      options: ['xs', 'sm', 'md', 'lg', 'xl', false],
      description: 'Maximum width of the modal',
    },
    transition: {
      control: { type: 'select' },
      options: ['fade', 'slide', 'zoom', 'grow'],
      description: 'Transition animation type',
    },
    fullScreen: {
      control: 'boolean',
      description: 'Make modal full screen',
    },
    showCloseButton: {
      control: 'boolean',
      description: 'Show close button in header',
    },
  },
  tags: ['autodocs'],
};

export default meta;

// Helper component for interactive stories
const ModalStory = ({ children, ...props }: any) => {
  const [open, setOpen] = useState(false);
  
  return (
    <>
      <Button onClick={() => setOpen(true)}>Open Modal</Button>
      <Modal
        {...props}
        open={open}
        onClose={() => setOpen(false)}
      >
        {children}
      </Modal>
    </>
  );
};

// Basic modal
export const Default: StoryObj = {
  render: () => (
    <ModalStory title="Default Modal">
      This is a basic modal with default settings.
    </ModalStory>
  ),
};

export const WithSubtitle: StoryObj = {
  render: () => (
    <ModalStory
      title="Modal with Subtitle"
      subtitle="Additional context information"
    >
      This modal includes both a title and subtitle in the header.
    </ModalStory>
  ),
};

export const WithActions: StoryObj = {
  render: () => (
    <ModalStory
      title="Confirm Action"
      actions={
        <>
          <Button variant="text">Cancel</Button>
          <Button variant="contained" color="primary">Confirm</Button>
        </>
      }
    >
      Are you sure you want to proceed with this action?
    </ModalStory>
  ),
};

// Different transitions
export const SlideTransition: StoryObj = {
  render: () => (
    <ModalStory title="Slide Transition" transition="slide">
      This modal slides in from the bottom.
    </ModalStory>
  ),
};

export const ZoomTransition: StoryObj = {
  render: () => (
    <ModalStory title="Zoom Transition" transition="zoom">
      This modal zooms in from the center.
    </ModalStory>
  ),
};

export const GrowTransition: StoryObj = {
  render: () => (
    <ModalStory title="Grow Transition" transition="grow">
      This modal grows in from the center.
    </ModalStory>
  ),
};

// Sizes
export const SmallModal: StoryObj = {
  render: () => (
    <ModalStory title="Small Modal" maxWidth="xs">
      This is a small modal perfect for confirmations.
    </ModalStory>
  ),
};

export const LargeModal: StoryObj = {
  render: () => (
    <ModalStory title="Large Modal" maxWidth="lg">
      This is a large modal with more space for content and complex forms.
    </ModalStory>
  ),
};

export const FullScreenModal: StoryObj = {
  render: () => (
    <ModalStory title="Full Screen Modal" fullScreen>
      This modal takes up the entire screen, perfect for mobile or complex interfaces.
    </ModalStory>
  ),
};

// Application specific examples
export const ConfirmationDialog: StoryObj = {
  render: () => (
    <ModalStory
      title="Delete Flight Request"
      maxWidth="sm"
      actions={
        <>
          <Button variant="text">Cancel</Button>
          <Button variant="contained" color="error">Delete</Button>
        </>
      }
    >
      <div className="flex items-start space-x-3">
        <Warning className="text-yellow-500 mt-1" />
        <div>
          <p className="text-gray-900 dark:text-white">
            Are you sure you want to delete this flight companion request?
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
            This action cannot be undone. All associated data will be permanently removed.
          </p>
        </div>
      </div>
    </ModalStory>
  ),
};

export const FlightCompanionForm: StoryObj = {
  render: () => (
    <ModalStory
      title="Request Flight Companion"
      subtitle="Fill out the form to find someone to help with your flight"
      maxWidth="md"
      actions={
        <>
          <Button variant="text">Cancel</Button>
          <Button variant="contained" color="primary">Submit Request</Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Input.TextField label="Flight Number" placeholder="e.g., NZ289" fullWidth />
          <Input.TextField label="Airline" placeholder="e.g., Air New Zealand" fullWidth />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <Input.Select
            label="From Airport"
            options={[
              { value: 'AKL', label: 'Auckland (AKL)' },
              { value: 'PVG', label: 'Shanghai (PVG)' },
            ]}
            fullWidth
          />
          <Input.Select
            label="To Airport"
            options={[
              { value: 'AKL', label: 'Auckland (AKL)' },
              { value: 'PVG', label: 'Shanghai (PVG)' },
            ]}
            fullWidth
          />
        </div>
        
        <Input.RadioGroup
          label="Traveler Age"
          options={[
            { value: 'young', label: 'Young Adult' },
            { value: 'adult', label: 'Adult' },
            { value: 'elderly', label: 'Elderly' },
          ]}
          row
        />
        
        <Input.TextField
          label="Special Needs"
          multiline
          rows={3}
          placeholder="Language translation, wheelchair assistance, airport navigation..."
          fullWidth
        />
        
        <Input.TextField
          label="Offered Amount (NZD)"
          type="number"
          placeholder="50"
          fullWidth
        />
      </div>
    </ModalStory>
  ),
};

export const SuccessNotification: StoryObj = {
  render: () => (
    <ModalStory
      title="Request Submitted"
      maxWidth="sm"
      showCloseButton={false}
      actions={
        <Button variant="contained" color="primary" fullWidth>
          View My Requests
        </Button>
      }
    >
      <div className="text-center">
        <CheckCircle className="text-green-500 text-6xl mb-4" />
        <p className="text-gray-900 dark:text-white mb-2">
          Your flight companion request has been submitted successfully!
        </p>
        <p className="text-sm text-gray-600 dark:text-gray-300">
          We'll notify you when potential helpers are found.
        </p>
      </div>
    </ModalStory>
  ),
};

// Compound component usage
export const CompoundComponents: StoryObj = {
  render: () => (
    <ModalStory>
      <Modal.Header onClose={() => {}}>
        <div className="flex items-center space-x-2">
          <Info className="text-blue-500" />
          <span>Custom Header</span>
        </div>
      </Modal.Header>
      <Modal.Content>
        <p>This modal uses the compound component pattern with separate Header, Content, and Actions.</p>
      </Modal.Content>
      <Modal.Actions>
        <Button variant="text">Secondary Action</Button>
        <Button variant="contained">Primary Action</Button>
      </Modal.Actions>
    </ModalStory>
  ),
};

// Dark theme
export const DarkTheme: StoryObj = {
  parameters: {
    backgrounds: { default: 'dark' },
  },
  decorators: [
    (Story) => (
      <div className="dark">
        <Story />
      </div>
    ),
  ],
  render: () => (
    <ModalStory
      title="Dark Theme Modal"
      subtitle="Modal displayed in dark mode"
      actions={
        <>
          <Button variant="text">Cancel</Button>
          <Button variant="contained">Confirm</Button>
        </>
      }
    >
      This modal is displayed with dark theme styling, showcasing how all components adapt to the theme.
    </ModalStory>
  ),
};