// frontend/src/components/__tests__/CommunityGuidelines.test.tsx
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { CommunityGuidelines } from '../CommunityGuidelines';
import i18n from '../../i18n';
import uiSlice from '../../store/slices/uiSlice';

// Mock store for testing
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

const renderWithProviders = (
  ui: React.ReactElement,
  { store = createMockStore(), ...options } = {}
) => {
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <Provider store={store}>
      <BrowserRouter>
        <I18nextProvider i18n={i18n}>
          {children}
        </I18nextProvider>
      </BrowserRouter>
    </Provider>
  );

  return render(ui, { wrapper: Wrapper, ...options });
};

describe('CommunityGuidelines', () => {
  beforeEach(() => {
    // Reset language to English for each test
    i18n.changeLanguage('en');
  });

  it('renders the main title and subtitle', () => {
    renderWithProviders(<CommunityGuidelines />);
    
    expect(screen.getByText('Community Guidelines')).toBeInTheDocument();
    expect(screen.getByText('Building a safe and respectful community for Chinese professionals in Auckland')).toBeInTheDocument();
  });

  it('displays the last updated date', () => {
    renderWithProviders(<CommunityGuidelines />);
    
    const lastUpdatedElement = screen.getByText(/Last updated:/);
    expect(lastUpdatedElement).toBeInTheDocument();
  });

  it('shows the overview section', () => {
    renderWithProviders(<CommunityGuidelines />);
    
    expect(screen.getByText('Overview')).toBeInTheDocument();
    expect(screen.getByText(/Our platform connects Chinese professionals/)).toBeInTheDocument();
  });

  it('displays all main sections as expandable accordions', () => {
    renderWithProviders(<CommunityGuidelines />);
    
    expect(screen.getByText('Community Conduct')).toBeInTheDocument();
    expect(screen.getByText('Safety Guidelines')).toBeInTheDocument();
    expect(screen.getByText('Service Standards')).toBeInTheDocument();
    expect(screen.getByText('Reporting and Enforcement')).toBeInTheDocument();
  });

  it('expands accordion sections when clicked', async () => {
    renderWithProviders(<CommunityGuidelines />);
    
    const conductSection = screen.getByText('Community Conduct');
    fireEvent.click(conductSection);
    
    // Wait for content to appear
    expect(await screen.findByText('Respect and Courtesy')).toBeInTheDocument();
    expect(await screen.findByText('Zero Tolerance for Discrimination')).toBeInTheDocument();
    expect(await screen.findByText('No Harassment or Abuse')).toBeInTheDocument();
  });

  it('switches to Chinese language correctly', async () => {
    renderWithProviders(<CommunityGuidelines />);
    
    // Change language to Chinese
    await i18n.changeLanguage('zh');
    
    expect(await screen.findByText('社区指南')).toBeInTheDocument();
    expect(await screen.findByText('为奥克兰的华人专业人士建立安全和谐的社区')).toBeInTheDocument();
  });

  it('displays the footer message', () => {
    renderWithProviders(<CommunityGuidelines />);
    
    expect(screen.getByText("Let's Build a Better Community Together")).toBeInTheDocument();
  });

  it('shows different guideline items with appropriate styling', async () => {
    renderWithProviders(<CommunityGuidelines />);
    
    // Expand safety section
    const safetySection = screen.getByText('Safety Guidelines');
    fireEvent.click(safetySection);
    
    // Check for safety-related content
    expect(await screen.findByText('Identity Verification')).toBeInTheDocument();
    expect(await screen.findByText('Safe Meeting Practices')).toBeInTheDocument();
    expect(await screen.findByText('Personal Information')).toBeInTheDocument();
  });

  it('renders with dark theme correctly', () => {
    const darkStore = createMockStore('dark');
    renderWithProviders(<CommunityGuidelines />, { store: darkStore });
    
    expect(screen.getByText('Community Guidelines')).toBeInTheDocument();
  });

  it('has proper accessibility attributes', () => {
    renderWithProviders(<CommunityGuidelines />);
    
    // Check for main heading
    const mainHeading = screen.getByRole('heading', { level: 1 });
    expect(mainHeading).toHaveTextContent('Community Guidelines');
    
    // Check for section headings
    const sectionHeadings = screen.getAllByRole('heading', { level: 2 });
    expect(sectionHeadings.length).toBeGreaterThan(0);
  });
});
