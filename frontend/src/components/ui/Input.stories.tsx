// ClientApp/src/components/ui/Input.stories.tsx
import React from 'react';
import { Meta, StoryObj } from '@storybook/react';
import Input from './Input';
import { Email, Search} from '@mui/icons-material';

const meta: Meta<typeof Input.TextField> = {
  title: 'UI Components/Input',
  component: Input.TextField,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A comprehensive input system with TextField, Select, Checkbox, RadioGroup, and Switch components.',
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;

// TextField stories
export const TextField: StoryObj = {
  render: () => (
    <div className="space-y-4 w-80">
      <Input.TextField
        label="Basic TextField"
        placeholder="Enter your name"
        fullWidth
      />
      <Input.TextField
        label="Email"
        type="email"
        placeholder="Enter your email"
        startAdornment={<Email />}
        fullWidth
      />
      <Input.TextField
        label="Password"
        type="password"
        placeholder="Enter your password"
        fullWidth
      />
      <Input.TextField
        label="Search"
        type="search"
        placeholder="Search flights..."
        startAdornment={<Search />}
        fullWidth
      />
    </div>
  ),
};

export const TextFieldStates: StoryObj = {
  name: 'TextField States',
  render: () => (
    <div className="space-y-4 w-80">
      <Input.TextField
        label="Required Field"
        required
        fullWidth
      />
      <Input.TextField
        label="Disabled Field"
        disabled
        value="Cannot edit this"
        fullWidth
      />
      <Input.TextField
        label="Error State"
        error
        helperText="This field has an error"
        fullWidth
      />
      <Input.TextField
        label="Success State"
        helperText="This looks good!"
        fullWidth
      />
    </div>
  ),
};

export const Multiline: StoryObj = {
  render: () => (
    <div className="w-80">
      <Input.TextField
        label="Special Needs"
        multiline
        rows={4}
        placeholder="Describe any special assistance needed..."
        fullWidth
      />
    </div>
  ),
};

// Select stories
export const Select: StoryObj = {
  render: () => (
    <div className="space-y-4 w-80">
      <Input.Select
        label="Airport"
        options={[
          { value: 'AKL', label: 'Auckland (AKL)' },
          { value: 'CHC', label: 'Christchurch (CHC)' },
          { value: 'WLG', label: 'Wellington (WLG)' },
        ]}
        fullWidth
      />
      <Input.Select
        label="Traveler Age"
        options={[
          { value: 'young', label: 'Young Adult (18-30)' },
          { value: 'adult', label: 'Adult (31-60)' },
          { value: 'elderly', label: 'Elderly (60+)' },
        ]}
        displayEmpty
        fullWidth
      />
    </div>
  ),
};

// Checkbox stories
export const Checkbox: StoryObj = {
  render: () => (
    <div className="space-y-2">
      <Input.Checkbox label="I agree to the terms and conditions" />
      <Input.Checkbox label="Send me email notifications" />
      <Input.Checkbox label="I have luggage" />
      <Input.Checkbox label="Wheelchair accessible vehicle needed" />
    </div>
  ),
};

// RadioGroup stories
export const RadioGroup: StoryObj = {
  render: () => (
    <div className="space-y-4">
      <Input.RadioGroup
        label="Service Type"
        options={[
          { value: 'request', label: 'I need help' },
          { value: 'offer', label: 'I can help others' },
        ]}
      />
      <Input.RadioGroup
        label="Vehicle Preference"
        options={[
          { value: 'sedan', label: 'Sedan (1-4 passengers)' },
          { value: 'suv', label: 'SUV (1-7 passengers)' },
          { value: 'van', label: 'Van (1-8 passengers)' },
        ]}
        row
      />
    </div>
  ),
};

// Switch stories
export const Switch: StoryObj = {
  render: () => (
    <div className="space-y-2">
      <Input.Switch label="Enable notifications" />
      <Input.Switch label="Dark mode" />
      <Input.Switch label="Available for pickup" />
    </div>
  ),
};

// Application specific examples
export const FlightCompanionForm: StoryObj = {
  name: 'Flight Companion Form',
  render: () => (
    <div className="space-y-4 w-96 p-6 border rounded-lg">
      <h3 className="text-lg font-semibold mb-4">Request Flight Companion</h3>
      
      <Input.TextField
        label="Flight Number"
        placeholder="e.g., NZ289"
        fullWidth
      />
      
      <Input.TextField
        label="Airline"
        placeholder="e.g., Air New Zealand"
        fullWidth
      />
      
      <Input.Select
        label="From Airport"
        options={[
          { value: 'AKL', label: 'Auckland (AKL)' },
          { value: 'PVG', label: 'Shanghai (PVG)' },
          { value: 'PEK', label: 'Beijing (PEK)' },
        ]}
        fullWidth
      />
      
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
        placeholder="Language translation, wheelchair assistance, etc."
        fullWidth
      />
      
      <Input.TextField
        label="Offered Amount (NZD)"
        type="number"
        placeholder="50"
        fullWidth
      />
    </div>
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
    <div className="space-y-4 w-80">
      <Input.TextField
        label="Dark Theme TextField"
        placeholder="Type something..."
        fullWidth
      />
      <Input.Select
        label="Dark Theme Select"
        options={[
          { value: '1', label: 'Option 1' },
          { value: '2', label: 'Option 2' },
        ]}
        fullWidth
      />
      <Input.Checkbox label="Dark theme checkbox" />
    </div>
  ),
};