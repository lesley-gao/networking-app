// ClientApp/src/stories/Navigation.stories.tsx
import React from 'react';
import { Meta, StoryObj } from '@storybook/react';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { Navigation } from '../components/Navigation';
import { AppThemeProvider } from '../themes/ThemeProvider';
import uiSlice, { UIState } from '../store/slices/uiSlice';

// Mock store
const mockStore = configureStore({
  reducer: {
    ui: uiSlice,
  },
  preloadedState: {
    ui: {
      theme: 'light' as const,  // <- Add 'as const' to ensure literal type
      isDrawerOpen: false,
      notifications: [],
      isLoading: false,
      currentPage: '',
      searchQuery: '',
    } satisfies UIState,  // <- Add 'satisfies UIState' for type safety
  },
});

const meta: Meta<typeof Navigation> = {
  title: 'Components/Navigation',
  component: Navigation,
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [
    (Story) => (
      <Provider store={mockStore}>
        <AppThemeProvider>
          <BrowserRouter>
            <Story />
          </BrowserRouter>
        </AppThemeProvider>
      </Provider>
    ),
  ],
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
};

export const CustomTitle: Story = {
  args: {
    title: "Flight Companion Platform",
  },
};

export const MobileView: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
  args: {
    mobileOpen: true,
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
            theme: 'dark' as const,  // <- Add 'as const' here too
            isDrawerOpen: false,
            notifications: [],
            isLoading: false,
            currentPage: '',
            searchQuery: '',
          } satisfies UIState,  // <- Add 'satisfies UIState' here too
        },
      });
      
      return (
        <Provider store={darkStore}>
          <AppThemeProvider>
            <BrowserRouter>
              <div className="dark">
                <Story />
              </div>
            </BrowserRouter>
          </AppThemeProvider>
        </Provider>
      );
    },
  ],
};