// ClientApp/src/stories/UserProfile.stories.tsx
import React from 'react';
import { Meta, StoryObj } from '@storybook/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import UserProfile from '../components/UserProfile';

// Mock store for Storybook
const mockStore = configureStore({
  reducer: {
    auth: (state = {
      user: {
        id: 1,
        email: 'john.doe@email.com',
        firstName: 'John',
        lastName: 'Doe',
        phoneNumber: '+64211234567',
        preferredLanguage: 'English',
        isVerified: true,
        emergencyContact: 'Jane Doe',
        emergencyPhone: '+64211234568',
        rating: 4.5,
        totalRatings: 12,
      },
      isAuthenticated: true,
      isLoading: false,
      error: null,
    }) => state,
  },
});

const mockUnverifiedStore = configureStore({
  reducer: {
    auth: (state = {
      user: {
        id: 2,
        email: 'new.user@email.com',
        firstName: 'New',
        lastName: 'User',
        phoneNumber: '',
        preferredLanguage: 'Chinese',
        isVerified: false,
        emergencyContact: '',
        emergencyPhone: '',
        rating: 0,
        totalRatings: 0,
      },
      isAuthenticated: true,
      isLoading: false,
      error: null,
    }) => state,
  },
});

const theme = createTheme();

// Mock fetch for API calls
const mockFetch = (url: string, options?: any) => {
  if (url.includes('/api/user/profile') && options?.method === 'PUT') {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({
        id: 1,
        email: 'john.doe@email.com',
        firstName: 'John',
        lastName: 'Doe',
        phoneNumber: '+64211234567',
        preferredLanguage: 'English',
        isVerified: true,
        emergencyContact: 'Jane Doe',
        emergencyPhone: '+64211234568',
        rating: 4.5,
        totalRatings: 12,
        createdAt: '2024-01-01T00:00:00Z',
        lastLoginAt: '2024-12-01T10:00:00Z',
      }),
    });
  }
  
  if (url.includes('/api/user/profile')) {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({
        id: 1,
        email: 'john.doe@email.com',
        firstName: 'John',
        lastName: 'Doe',
        phoneNumber: '+64211234567',
        preferredLanguage: 'English',
        isVerified: true,
        emergencyContact: 'Jane Doe',
        emergencyPhone: '+64211234568',
        rating: 4.5,
        totalRatings: 12,
        createdAt: '2024-01-01T00:00:00Z',
        lastLoginAt: '2024-12-01T10:00:00Z',
      }),
    });
  }
  
  if (url.includes('/api/user/stats')) {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({
        totalFlightCompanionRequests: 3,
        totalFlightCompanionOffers: 5,
        totalPickupRequests: 2,
        totalPickupOffers: 4,
        completedServices: 8,
        averageRating: 4.5,
        totalRatings: 12,
      }),
    });
  }
  
  if (url.includes('/api/user/submit-verification')) {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ message: 'Verification submitted' }),
    });
  }
  
  return Promise.reject(new Error('Not found'));
};

// Setup global fetch mock
beforeEach(() => {
  global.fetch = mockFetch as any;
});

const meta: Meta<typeof UserProfile> = {
  title: 'Pages/UserProfile',
  component: UserProfile,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'User profile management component with form validation using React Hook Form and Zod.',
      },
    },
  },
  decorators: [
    (Story, { parameters }) => (
      <BrowserRouter>
        <Provider store={parameters.store || mockStore}>
          <ThemeProvider theme={theme}>
            <CssBaseline />
            <div style={{ padding: '1rem', minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
              <Story />
            </div>
          </ThemeProvider>
        </Provider>
      </BrowserRouter>
    ),
  ],
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof UserProfile>;

export const VerifiedUser: Story = {
  name: 'Verified User Profile',
  parameters: {
    store: mockStore,
    docs: {
      description: {
        story: 'Profile view for a verified user with complete information and activity statistics.',
      },
    },
  },
};

export const UnverifiedUser: Story = {
  name: 'Unverified User Profile',
  parameters: {
    store: mockUnverifiedStore,
    docs: {
      description: {
        story: 'Profile view for an unverified user with minimal information and verification prompt.',
      },
    },
  },
};

export const EditMode: Story = {
  name: 'Profile Edit Mode',
  parameters: {
    store: mockStore,
    docs: {
      description: {
        story: 'Profile component in edit mode showing form validation and input controls.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    // Auto-click edit button to show edit mode
    const canvas = canvasElement.ownerDocument;
    setTimeout(() => {
      const editButton = canvas.querySelector('button[type="button"]') as HTMLButtonElement;
      if (editButton && editButton.textContent?.includes('Edit')) {
        editButton.click();
      }
    }, 500);
  },
};

export const LoadingState: Story = {
  name: 'Loading State',
  parameters: {
    store: configureStore({
      reducer: {
        auth: (state = {
          user: null,
          isAuthenticated: true,
          isLoading: true,
          error: null,
        }) => state,
      },
    }),
    docs: {
      description: {
        story: 'Profile component showing loading state while fetching user data.',
      },
    },
  },
};

export const UnauthenticatedState: Story = {
  name: 'Unauthenticated State',
  parameters: {
    store: configureStore({
      reducer: {
        auth: (state = {
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
        }) => state,
      },
    }),
    docs: {
      description: {
        story: 'Profile component showing message for unauthenticated users.',
      },
    },
  },
};