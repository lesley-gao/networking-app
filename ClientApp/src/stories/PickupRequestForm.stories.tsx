// ClientApp/src/stories/PickupRequestForm.stories.tsx
import React from 'react';
import { Meta, StoryObj } from '@storybook/react';
import { fn } from "@storybook/test";  // Use fn instead of action
import { PickupRequestForm } from "../components/forms/PickupRequestForm";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { AppThemeProvider } from "../themes/ThemeProvider";
import uiSlice, { UIState } from "../store/slices/uiSlice";

// Mock store with proper UIState typing
const mockStore = configureStore({
  reducer: {
    ui: uiSlice,
  },
  preloadedState: {
    ui: {
      theme: "light" as const, // Ensure it's typed as 'light' not string
      isDrawerOpen: false,
      notifications: [], // Empty array of NotificationState[]
      isLoading: false,
      currentPage: "/",
      searchQuery: "",
    } satisfies UIState, // Use satisfies to ensure type safety
  },
});

const meta: Meta<typeof PickupRequestForm> = {
  title: "Forms/PickupRequestForm",
  component: PickupRequestForm,
  parameters: {
    layout: "centered",
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
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    onSubmit: fn(),  // Use fn() instead of action()
    onCancel: fn(),  // Use fn() instead of action()
  },
};

export const WithInitialData: Story = {
  args: {
    onSubmit: fn(),  // Use fn() instead of action()
    onCancel: fn(),  // Use fn() instead of action()
    initialData: {
      flightNumber: "NZ289",
      airport: "AKL",
      destinationAddress: "123 Queen Street, Auckland City",
      passengerCount: 2,
      hasLuggage: true,
      offeredAmount: 45,
    },
  },
};

export const Loading: Story = {
  args: {
    onSubmit: fn(),  // Use fn() instead of action()
    onCancel: fn(),  // Use fn() instead of action()
    loading: true,
  },
};
