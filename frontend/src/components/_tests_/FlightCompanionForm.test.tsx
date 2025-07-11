// ClientApp/src/components/forms/__tests__/FlightCompanionForm.test.tsx
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { FlightCompanionForm } from '../forms/FlightCompanionForm';

const theme = createTheme();

const renderWithTheme = (ui: React.ReactElement) => {
  return render(
    <ThemeProvider theme={theme}>
      {ui}
    </ThemeProvider>
  );
};

const mockOnSubmit = jest.fn();
const mockOnCancel = jest.fn();

describe('FlightCompanionForm Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Form Rendering', () => {
    it('renders all form fields', () => {
      renderWithTheme(
        <FlightCompanionForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
      );

      expect(screen.getByLabelText(/Flight Number/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Airline/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Flight Date/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/From Airport/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/To Airport/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Traveler Age/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Offered Amount/i)).toBeInTheDocument();
    });

    it('renders action buttons', () => {
      renderWithTheme(
        <FlightCompanionForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
      );

      expect(screen.getByText(/Cancel/i)).toBeInTheDocument();
      expect(screen.getByText(/Create Request/i)).toBeInTheDocument();
    });

    it('shows form title', () => {
      renderWithTheme(
        <FlightCompanionForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
      );

      expect(screen.getByText('Request Flight Companion Help')).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('validates required fields', async () => {
      const user = userEvent.setup();
      
      renderWithTheme(
        <FlightCompanionForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
      );

      // Try to submit empty form
      await user.click(screen.getByText(/Create Request/i));

      // Should not call onSubmit
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('validates flight number format', async () => {
      const user = userEvent.setup();
      
      renderWithTheme(
        <FlightCompanionForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
      );

      const flightNumberInput = screen.getByLabelText(/Flight Number/i);
      
      // Enter invalid flight number
      await user.type(flightNumberInput, 'invalid');
      await user.click(screen.getByText(/Create Request/i));

      await waitFor(() => {
        expect(screen.getByText(/Invalid flight number format/i)).toBeInTheDocument();
      });

      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('validates future date requirement', async () => {
      const user = userEvent.setup();
      
      renderWithTheme(
        <FlightCompanionForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
      );

      const dateInput = screen.getByLabelText(/Flight Date/i);
      
      // Enter past date
      await user.type(dateInput, '2020-01-01T10:00');
      await user.click(screen.getByText(/Create Request/i));

      await waitFor(() => {
        expect(screen.getByText(/Flight date must be in the future/i)).toBeInTheDocument();
      });
    });

    it('validates offered amount range', async () => {
      const user = userEvent.setup();
      
      renderWithTheme(
        <FlightCompanionForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
      );

      const amountInput = screen.getByLabelText(/Offered Amount/i);
      
      // Enter negative amount
      await user.type(amountInput, '-10');
      await user.click(screen.getByText(/Create Request/i));

      await waitFor(() => {
        expect(screen.getByText(/Amount cannot be negative/i)).toBeInTheDocument();
      });
    });

    it('validates text field lengths', async () => {
      const user = userEvent.setup();
      
      renderWithTheme(
        <FlightCompanionForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
      );

      const airlineInput = screen.getByLabelText(/Airline/i);
      
      // Enter text that's too long
      await user.type(airlineInput, 'A'.repeat(60));
      await user.click(screen.getByText(/Create Request/i));

      await waitFor(() => {
        expect(screen.getByText(/Airline name must be less than 50 characters/i)).toBeInTheDocument();
      });
    });
  });

  describe('Form Submission', () => {
    it('submits form with valid data', async () => {
      const user = userEvent.setup();
      
      renderWithTheme(
        <FlightCompanionForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
      );

      // Fill form with valid data
      await user.type(screen.getByLabelText(/Flight Number/i), 'NZ289');
      await user.type(screen.getByLabelText(/Airline/i), 'Air New Zealand');
      
      const dateInput = screen.getByLabelText(/Flight Date/i);
      // Use a future date
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);
      const formattedDate = futureDate.toISOString().slice(0, 16);
      await user.type(dateInput, formattedDate);

      // Select airports
      const fromAirportSelect = screen.getByLabelText(/From Airport/i);
      await user.click(fromAirportSelect);
      await user.click(screen.getByText('Auckland (AKL)'));

      const toAirportSelect = screen.getByLabelText(/To Airport/i);
      await user.click(toAirportSelect);
      await user.click(screen.getByText('Shanghai (PVG)'));

      // Fill offered amount
      await user.type(screen.getByLabelText(/Offered Amount/i), '50');

      // Submit form
      await user.click(screen.getByText(/Create Request/i));

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          flightNumber: 'NZ289',
          airline: 'Air New Zealand',
          flightDate: formattedDate,
          departureAirport: 'AKL',
          arrivalAirport: 'PVG',
          travelerName: '',
          travelerAge: 'Adult',
          specialNeeds: '',
          offeredAmount: 50,
          additionalNotes: '',
        });
      });
    });

    it('resets form after successful submission', async () => {
      const user = userEvent.setup();
      mockOnSubmit.mockResolvedValue(undefined);
      
      renderWithTheme(
        <FlightCompanionForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
      );

      // Fill and submit form
      await user.type(screen.getByLabelText(/Flight Number/i), 'NZ289');
      await user.click(screen.getByText(/Create Request/i));

      await waitFor(() => {
        expect(screen.getByLabelText(/Flight Number/i)).toHaveValue('');
      });
    });

    it('handles submission errors', async () => {
      const user = userEvent.setup();
      const consoleError = jest.spyOn(console, 'error').mockImplementation();
      mockOnSubmit.mockRejectedValue(new Error('Submission failed'));
      
      renderWithTheme(
        <FlightCompanionForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
      );

      // Fill minimal valid data
      await user.type(screen.getByLabelText(/Flight Number/i), 'NZ289');
      await user.type(screen.getByLabelText(/Airline/i), 'Air New Zealand');
      
      // Submit form
      await user.click(screen.getByText(/Create Request/i));

      await waitFor(() => {
        expect(consoleError).toHaveBeenCalledWith('Form submission error:', expect.any(Error));
      });

      consoleError.mockRestore();
    });
  });

  describe('Form Cancellation', () => {
    it('calls onCancel when cancel button is clicked', async () => {
      const user = userEvent.setup();
      
      renderWithTheme(
        <FlightCompanionForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
      );

      await user.click(screen.getByText(/Cancel/i));

      expect(mockOnCancel).toHaveBeenCalledTimes(1);
    });

    it('resets form when cancelled', async () => {
      const user = userEvent.setup();
      
      renderWithTheme(
        <FlightCompanionForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
      );

      // Fill some data
      await user.type(screen.getByLabelText(/Flight Number/i), 'NZ289');
      
      // Cancel form
      await user.click(screen.getByText(/Cancel/i));

      // Form should be reset
      expect(screen.getByLabelText(/Flight Number/i)).toHaveValue('');
    });
  });

  describe('Loading States', () => {
    it('disables submit button when loading', () => {
      renderWithTheme(
        <FlightCompanionForm 
          onSubmit={mockOnSubmit} 
          onCancel={mockOnCancel} 
          loading={true}
        />
      );

      const submitButton = screen.getByText(/Create Request/i);
      expect(submitButton).toBeDisabled();
    });

    it('disables cancel button when loading', () => {
      renderWithTheme(
        <FlightCompanionForm 
          onSubmit={mockOnSubmit} 
          onCancel={mockOnCancel} 
          loading={true}
        />
      );

      const cancelButton = screen.getByText(/Cancel/i);
      expect(cancelButton).toBeDisabled();
    });

    it('shows loading state on submit button', () => {
      renderWithTheme(
        <FlightCompanionForm 
          onSubmit={mockOnSubmit} 
          onCancel={mockOnCancel} 
          loading={true}
        />
      );

      // Should show loading indicator
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });
  });

  describe('Initial Data', () => {
    it('populates form with initial data', () => {
      const initialData = {
        flightNumber: 'NZ289',
        airline: 'Air New Zealand',
        travelerName: 'John Doe',
        offeredAmount: 100,
      };

      renderWithTheme(
        <FlightCompanionForm 
          onSubmit={mockOnSubmit} 
          onCancel={mockOnCancel}
          initialData={initialData}
        />
      );

      expect(screen.getByDisplayValue('NZ289')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Air New Zealand')).toBeInTheDocument();
      expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
      expect(screen.getByDisplayValue('100')).toBeInTheDocument();
    });
  });

  describe('Airport Selection', () => {
    it('provides airport options', async () => {
      const user = userEvent.setup();
      
      renderWithTheme(
        <FlightCompanionForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
      );

      const fromAirportSelect = screen.getByLabelText(/From Airport/i);
      await user.click(fromAirportSelect);

      expect(screen.getByText('Auckland (AKL)')).toBeInTheDocument();
      expect(screen.getByText('Shanghai (PVG)')).toBeInTheDocument();
      expect(screen.getByText('Beijing (PEK)')).toBeInTheDocument();
    });

    it('allows different departure and arrival airports', async () => {
      const user = userEvent.setup();
      
      renderWithTheme(
        <FlightCompanionForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
      );

      // Select different airports
      const fromAirportSelect = screen.getByLabelText(/From Airport/i);
      await user.click(fromAirportSelect);
      await user.click(screen.getByText('Auckland (AKL)'));

      const toAirportSelect = screen.getByLabelText(/To Airport/i);
      await user.click(toAirportSelect);
      await user.click(screen.getByText('Shanghai (PVG)'));

      // Verify selections
      expect(screen.getByDisplayValue('AKL')).toBeInTheDocument();
      expect(screen.getByDisplayValue('PVG')).toBeInTheDocument();
    });
  });

  describe('Traveler Age Selection', () => {
    it('provides age group options', async () => {
      const user = userEvent.setup();
      
      renderWithTheme(
        <FlightCompanionForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
      );

      const ageSelect = screen.getByLabelText(/Traveler Age/i);
      await user.click(ageSelect);

      expect(screen.getByText('Young Adult (18-30)')).toBeInTheDocument();
      expect(screen.getByText('Adult (31-60)')).toBeInTheDocument();
      expect(screen.getByText('Elderly (60+)')).toBeInTheDocument();
    });

    it('defaults to Adult age group', () => {
      renderWithTheme(
        <FlightCompanionForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
      );

      expect(screen.getByDisplayValue('Adult')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper form labels', () => {
      renderWithTheme(
        <FlightCompanionForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
      );

      // All form fields should have associated labels
      expect(screen.getByLabelText(/Flight Number/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Airline/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Flight Date/i)).toBeInTheDocument();
    });

    it('displays validation errors for screen readers', async () => {
      const user = userEvent.setup();
      
      renderWithTheme(
        <FlightCompanionForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
      );

      // Enter invalid data and trigger validation
      await user.type(screen.getByLabelText(/Flight Number/i), 'invalid');
      await user.click(screen.getByText(/Create Request/i));

      // Wait for the error message to appear
      await waitFor(() => {
        expect(screen.getByText(/Invalid flight number format/i)).toBeInTheDocument();
      });

      // Then check the aria-invalid attribute
      const input = screen.getByLabelText(/Flight Number/i);
      expect(input).toHaveAttribute('aria-invalid', 'true');
    });

    it('supports keyboard navigation', async () => {
      const user = userEvent.setup();
      
      renderWithTheme(
        <FlightCompanionForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
      );

      const firstInput = screen.getByLabelText(/Flight Number/i);
      firstInput.focus();
      expect(firstInput).toHaveFocus();

      // Tab through form fields
      await user.tab();
      expect(screen.getByLabelText(/Airline/i)).toHaveFocus();
    });
  });
});