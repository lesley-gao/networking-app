// ClientApp/src/stories/FlightCompanionForm.stories.tsx
import React from 'react';
import { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';  // Use fn instead of action
import { FlightCompanionForm } from '../components/forms/FlightCompanionRequestForm';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { AppThemeProvider } from '../themes/ThemeProvider';
import uiSlice, { UIState } from '../store/slices/uiSlice';

// Mock store with proper UIState typing
const mockStore = configureStore({
  reducer: {
    ui: uiSlice,
  },
  preloadedState: {
    ui: {
      theme: 'light' as const,
      isDrawerOpen: false,
      notifications: [],
      isLoading: false,
      currentPage: '/',
      searchQuery: '',
    } satisfies UIState,
  },
});

const meta: Meta<typeof FlightCompanionForm> = {
  title: 'Forms/FlightCompanionForm',
  component: FlightCompanionForm,
  parameters: {
    layout: 'centered',
  },
  decorators: [
    (Story) => (
      <Provider store={mockStore}>
        <AppThemeProvider>
          <div className="w-full max-w-4xl p-6">
            <Story />
          </div>
        </AppThemeProvider>
      </Provider>
    ),
  ],
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    onSubmit: fn(),
    onCancel: fn(),
  },
};

export const WithInitialData: Story = {
  args: {
    onSubmit: fn(),
    onCancel: fn(),
    initialData: {
      flightNumber: 'NZ289',
      airline: 'Air New Zealand',
      departureAirport: 'AKL',
      arrivalAirport: 'PVG',
      travelerAge: 'Elderly',
      offeredAmount: 80,
    },
  },
};

export const Loading: Story = {
  args: {
    onSubmit: fn(),
    onCancel: fn(),
    loading: true,
  },
};

export const DarkTheme: Story = {
  parameters: {
    backgrounds: { default: 'dark' },
  },
  decorators: [
    (Story) => {
      const darkStore = configureStore({
        reducer: {
          ui: uiSlice,
        },
        preloadedState: {
          ui: {
            theme: 'dark' as const,
            isDrawerOpen: false,
            notifications: [],
            isLoading: false,
            currentPage: '/',
            searchQuery: '',
          } satisfies UIState,
        },
      });
      
      return (
        <Provider store={darkStore}>
          <AppThemeProvider>
            <div className="dark w-full max-w-4xl p-6">
              <Story />
            </div>
          </AppThemeProvider>
        </Provider>
      );
    },
  ],
  args: {
    onSubmit: fn(),
    onCancel: fn(),
  },
};