// ClientApp/src/components/ui/Card.stories.tsx
import React from 'react';
import { Meta, StoryObj } from '@storybook/react';
import { Card } from './Card';
import { Button } from './Button';
import { Avatar, IconButton } from '@mui/material';
import { MoreVert, Favorite, Share } from '@mui/icons-material';

const meta: Meta<typeof Card> = {
  title: 'UI Components/Card',
  component: Card,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A versatile card component built on MUI Card with Tailwind styling and compound component pattern.',
      },
    },
  },
  argTypes: {
    elevation: {
      control: { type: 'range', min: 0, max: 24, step: 1 },
      description: 'Shadow depth of the card',
    },
    variant: {
      control: { type: 'select' },
      options: ['elevation', 'outlined'],
      description: 'Card variant style',
    },
    hover: {
      control: 'boolean',
      description: 'Enable hover effects',
    },
    onClick: {
      action: 'clicked',
      description: 'Click handler for the card',
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Card>;

// Basic card examples
export const Default: Story = {
  args: {
    children: (
      <>
        <Card.Header title="Default Card" />
        <Card.Content>
          This is a basic card with default styling and no special features.
        </Card.Content>
      </>
    ),
  },
};

export const WithActions: Story = {
  args: {
    children: (
      <>
        <Card.Header title="Card with Actions" subheader="This card has action buttons" />
        <Card.Content>
          Cards can include action buttons in the footer for user interactions.
        </Card.Content>
        <Card.Actions>
          <Button size="small">Learn More</Button>
          <Button size="small" variant="contained">Get Started</Button>
        </Card.Actions>
      </>
    ),
  },
};

export const WithAvatar: Story = {
  args: {
    children: (
      <>
        <Card.Header
          avatar={<Avatar sx={{ bgcolor: 'primary.main' }}>R</Avatar>}
          title="Robert Johnson"
          subheader="Flight Helper"
          action={
            <IconButton>
              <MoreVert />
            </IconButton>
          }
        />
        <Card.Content>
          Experienced traveler offering assistance with airport navigation and language translation.
        </Card.Content>
        <Card.Actions>
          <IconButton>
            <Favorite />
          </IconButton>
          <IconButton>
            <Share />
          </IconButton>
          <Button size="small">Contact</Button>
        </Card.Actions>
      </>
    ),
  },
};

export const Hoverable: Story = {
  args: {
    hover: true,
    onClick: () => console.log('Card clicked'),
    children: (
      <>
        <Card.Header title="Hoverable Card" subheader="Click or hover to see effects" />
        <Card.Content>
          This card has hover effects enabled and responds to clicks.
        </Card.Content>
      </>
    ),
  },
};

export const Outlined: Story = {
  args: {
    variant: 'outlined',
    children: (
      <>
        <Card.Header title="Outlined Card" />
        <Card.Content>
          This card uses the outlined variant instead of elevation.
        </Card.Content>
      </>
    ),
  },
};

export const HighElevation: Story = {
  args: {
    elevation: 16,
    children: (
      <>
        <Card.Header title="High Elevation Card" />
        <Card.Content>
          This card has a high elevation value for a pronounced shadow effect.
        </Card.Content>
      </>
    ),
  },
};

// Flight companion specific examples
export const FlightRequest: Story = {
  args: {
    hover: true,
    children: (
      <>
        <Card.Header
          title="NZ289 - Air New Zealand"
          subheader="Auckland → Shanghai"
          action={<span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-sm">NZD $50</span>}
        />
        <Card.Content>
          <div className="space-y-2 text-sm">
            <div><strong>Date:</strong> July 15, 2025</div>
            <div><strong>Traveler:</strong> Elderly parents</div>
            <div><strong>Help Needed:</strong> Language translation and wheelchair assistance</div>
          </div>
        </Card.Content>
        <Card.Actions>
          <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs">Looking for Helper</span>
          <Button size="small" variant="contained">Contact</Button>
        </Card.Actions>
      </>
    ),
  },
};

export const PickupOffer: Story = {
  args: {
    hover: true,
    children: (
      <>
        <Card.Header
          title="SUV - 7 Seats"
          subheader="Auckland Airport"
          action={<span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-sm">From NZD $45</span>}
        />
        <Card.Content>
          <div className="space-y-2 text-sm">
            <div><strong>Driver:</strong> Michael Chen</div>
            <div><strong>Experience:</strong> 50+ pickups completed</div>
            <div><strong>Languages:</strong> English, Mandarin</div>
            <div><strong>Vehicle:</strong> Clean, comfortable SUV with ample luggage space</div>
          </div>
        </Card.Content>
        <Card.Actions>
          <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs">Available</span>
          <Button size="small" variant="contained">Book Now</Button>
        </Card.Actions>
      </>
    ),
  },
};

// Theme variations
export const DarkTheme: Story = {
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
  args: {
    children: (
      <>
        <Card.Header title="Dark Theme Card" subheader="Card in dark mode" />
        <Card.Content>
          This card is displayed with dark theme styling.
        </Card.Content>
        <Card.Actions>
          <Button size="small">Action</Button>
        </Card.Actions>
      </>
    ),
  },
};