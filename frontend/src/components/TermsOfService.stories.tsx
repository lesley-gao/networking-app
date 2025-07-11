// frontend/src/components/TermsOfService.stories.tsx
import React from 'react';
import { Meta, StoryObj } from '@storybook/react';
import { BrowserRouter } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { AppThemeProvider } from '../themes/ThemeProvider';
import { TermsOfService } from './TermsOfService';
import i18n from '../i18n';
import uiSlice from '../store/slices/uiSlice';

// Mock store for Storybook
const createMockStore = (theme: 'light' | 'dark' = 'light') => configureStore({
  reducer: {
    ui: uiSlice,
  },
  preloadedState: {
    ui: {
      theme,
      isDrawerOpen: false,
      notifications: [],
      isLoading: false,
      currentPage: '',
      searchQuery: '',
    },
  },
});

const meta: Meta<typeof TermsOfService> = {
  title: 'Pages/TermsOfService',
  component: TermsOfService,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Terms of Service page with bilingual support (English/Chinese) for the NetworkingApp platform.',
      },
    },
  },
  decorators: [
    (Story) => (
      <Provider store={createMockStore()}>
        <BrowserRouter>
          <I18nextProvider i18n={i18n}>
            <AppThemeProvider>
              <Story />
            </AppThemeProvider>
          </I18nextProvider>
        </BrowserRouter>
      </Provider>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof TermsOfService>;

export const Default: Story = {
  name: 'Terms of Service (English)',
  parameters: {
    docs: {
      description: {
        story: 'Default view of the Terms of Service page in English.',
      },
    },
  },
  play: async () => {
    // Ensure English is selected
    await i18n.changeLanguage('en');
  },
};

export const Chinese: Story = {
  name: 'Terms of Service (Chinese)',
  parameters: {
    docs: {
      description: {
        story: 'Terms of Service page displayed in Chinese language.',
      },
    },
  },
  play: async () => {
    // Switch to Chinese
    await i18n.changeLanguage('zh');
  },
};

export const DarkMode: Story = {
  name: 'Terms of Service (Dark Mode)',
  parameters: {
    docs: {
      description: {
        story: 'Terms of Service page in dark theme mode.',
      },
    },
    backgrounds: {
      default: 'dark',
    },
  },
  decorators: [
    (Story) => (
      <Provider store={createMockStore('dark')}>
        <BrowserRouter>
          <I18nextProvider i18n={i18n}>
            <AppThemeProvider>
              <Story />
            </AppThemeProvider>
          </I18nextProvider>
        </BrowserRouter>
      </Provider>
    ),
  ],
};

export const ChineseDarkMode: Story = {
  name: 'Terms of Service (Chinese + Dark Mode)',
  parameters: {
    docs: {
      description: {
        story: 'Terms of Service page in Chinese language with dark theme.',
      },
    },
    backgrounds: {
      default: 'dark',
    },
  },
  decorators: [
    (Story) => (
      <Provider store={createMockStore('dark')}>
        <BrowserRouter>
          <I18nextProvider i18n={i18n}>
            <AppThemeProvider>
              <Story />
            </AppThemeProvider>
          </I18nextProvider>
        </BrowserRouter>
      </Provider>
    ),
  ],
  play: async () => {
    // Switch to Chinese
    await i18n.changeLanguage('zh');
  },
};
