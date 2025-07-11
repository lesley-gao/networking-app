// frontend/src/components/__tests__/TermsOfService.test.tsx
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { TermsOfService } from '../TermsOfService';
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

describe('TermsOfService', () => {
  beforeEach(() => {
    // Reset language to English for each test
    i18n.changeLanguage('en');
  });

  it('renders the main title and subtitle', () => {
    renderWithProviders(<TermsOfService />);
    
    expect(screen.getByText('Terms of Service')).toBeInTheDocument();
    expect(screen.getByText('Legal agreement for using the NetworkingApp platform')).toBeInTheDocument();
  });

  it('displays both last updated and effective date', () => {
    renderWithProviders(<TermsOfService />);
    
    expect(screen.getByText(/Last updated:/)).toBeInTheDocument();
    expect(screen.getByText(/Effective date:/)).toBeInTheDocument();
  });

  it('shows expand all and collapse all buttons', () => {
    renderWithProviders(<TermsOfService />);
    
    expect(screen.getByText('Expand All')).toBeInTheDocument();
    expect(screen.getByText('Collapse All')).toBeInTheDocument();
  });

  it('displays table of contents with numbered items', () => {
    renderWithProviders(<TermsOfService />);
    
    expect(screen.getByText('Table of Contents')).toBeInTheDocument();
    expect(screen.getByText('1. Acceptance of Terms')).toBeInTheDocument();
    expect(screen.getByText('2. Service Description')).toBeInTheDocument();
    expect(screen.getByText('12. Contact Information')).toBeInTheDocument();
  });

  it('expands all sections when expand all button is clicked', () => {
    renderWithProviders(<TermsOfService />);
    
    const expandAllButton = screen.getByText('Expand All');
    fireEvent.click(expandAllButton);
    
    // Check if sections are expanded (content should be visible)
    expect(screen.getByText('By accessing and using NetworkingApp')).toBeInTheDocument();
  });

  it('collapses all sections when collapse all button is clicked', () => {
    renderWithProviders(<TermsOfService />);
    
    // First expand all
    const expandAllButton = screen.getByText('Expand All');
    fireEvent.click(expandAllButton);
    
    // Then collapse all
    const collapseAllButton = screen.getByText('Collapse All');
    fireEvent.click(collapseAllButton);
    
    // Content should not be visible after collapsing
    expect(screen.queryByText('By accessing and using NetworkingApp')).not.toBeInTheDocument();
  });

  it('displays all 12 terms sections', () => {
    renderWithProviders(<TermsOfService />);
    
    const sections = [
      '1. Acceptance of Terms',
      '2. Service Description',
      '3. User Eligibility',
      '4. User Accounts',
      '5. Prohibited Conduct',
      '6. Payment Terms',
      '7. Limitation of Liability',
      '8. Privacy Policy',
      '9. Termination',
      '10. Changes to Terms',
      '11. Governing Law',
      '12. Contact Information'
    ];
    
    sections.forEach(section => {
      expect(screen.getByText(section)).toBeInTheDocument();
    });
  });

  it('expands individual sections when clicked', async () => {
    renderWithProviders(<TermsOfService />);
    
    const eligibilitySection = screen.getByText('3. User Eligibility');
    fireEvent.click(eligibilitySection);
    
    // Should show eligibility criteria
    expect(await screen.findByText('You must be at least 18 years old to use our services.')).toBeInTheDocument();
    expect(await screen.findByText('You must provide accurate information and complete identity verification.')).toBeInTheDocument();
  });

  it('switches to Chinese language correctly', async () => {
    renderWithProviders(<TermsOfService />);
    
    // Change language to Chinese
    await i18n.changeLanguage('zh');
    
    expect(await screen.findByText('服务条款')).toBeInTheDocument();
    expect(await screen.findByText('使用NetworkingApp平台的法律协议')).toBeInTheDocument();
    expect(await screen.findByText('目录')).toBeInTheDocument();
  });

  it('shows back to top button in footer', () => {
    renderWithProviders(<TermsOfService />);
    
    expect(screen.getByText('Back to Top')).toBeInTheDocument();
  });

  it('displays important legal document message', () => {
    renderWithProviders(<TermsOfService />);
    
    expect(screen.getByText('Important Legal Document')).toBeInTheDocument();
  });

  it('renders with dark theme correctly', () => {
    const darkStore = createMockStore('dark');
    renderWithProviders(<TermsOfService />, { store: darkStore });
    
    expect(screen.getByText('Terms of Service')).toBeInTheDocument();
  });

  it('has proper accessibility attributes', () => {
    renderWithProviders(<TermsOfService />);
    
    // Check for main heading
    const mainHeading = screen.getByRole('heading', { level: 1 });
    expect(mainHeading).toHaveTextContent('Terms of Service');
    
    // Check for buttons
    expect(screen.getByRole('button', { name: 'Expand All' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Collapse All' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Back to Top' })).toBeInTheDocument();
  });

  it('shows contact information in the last section', async () => {
    renderWithProviders(<TermsOfService />);
    
    const contactSection = screen.getByText('12. Contact Information');
    fireEvent.click(contactSection);
    
    expect(await screen.findByText(/legal@networkingapp.co.nz/)).toBeInTheDocument();
  });
});
