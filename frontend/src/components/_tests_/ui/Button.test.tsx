import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import Button from '../../ui/Button';

const theme = createTheme();

const renderWithTheme = (ui: React.ReactElement) => {
  return render(
    <ThemeProvider theme={theme}>
      {ui}
    </ThemeProvider>
  );
};

describe('Button Component', () => {
  describe('Basic Functionality', () => {
    it('renders button with text', () => {
      renderWithTheme(<Button>Click me</Button>);
      expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();
    });

    it('handles click events', () => {
      const handleClick = jest.fn();
      renderWithTheme(<Button onClick={handleClick}>Click me</Button>);
      
      fireEvent.click(screen.getByRole('button'));
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('applies disabled state', () => {
      renderWithTheme(<Button disabled>Disabled</Button>);
      expect(screen.getByRole('button')).toBeDisabled();
    });

    it('prevents click when disabled', () => {
      const handleClick = jest.fn();
      renderWithTheme(<Button disabled onClick={handleClick}>Disabled</Button>);
      
      fireEvent.click(screen.getByRole('button'));
      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe('Variants', () => {
    it('applies primary variant styles', () => {
      renderWithTheme(<Button variant="contained" color="primary">Primary</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('MuiButton-contained');
      expect(button).toHaveClass('MuiButton-containedPrimary');
    });

    it('applies secondary variant styles', () => {
      renderWithTheme(<Button variant="outlined" color="secondary">Secondary</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('MuiButton-outlined');
      expect(button).toHaveClass('MuiButton-outlinedSecondary');
    });

    it('applies text variant styles', () => {
      renderWithTheme(<Button variant="text">Text Button</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('MuiButton-text');
    });
  });

  describe('Sizes', () => {
    it('applies small size', () => {
      renderWithTheme(<Button size="small">Small</Button>);
      expect(screen.getByRole('button')).toHaveClass('MuiButton-sizeSmall');
    });

    it('applies large size', () => {
      renderWithTheme(<Button size="large">Large</Button>);
      expect(screen.getByRole('button')).toHaveClass('MuiButton-sizeLarge');
    });
  });

  describe('Loading State', () => {
    it('shows loading indicator when loading prop is true', () => {
      renderWithTheme(<Button loading>Loading</Button>);
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('disables button when loading', () => {
      renderWithTheme(<Button loading>Loading</Button>);
      expect(screen.getByRole('button')).toBeDisabled();
    });

    it('does not trigger click when loading', () => {
      const handleClick = jest.fn();
      renderWithTheme(<Button loading onClick={handleClick}>Loading</Button>);
      
      fireEvent.click(screen.getByRole('button'));
      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe('Icons', () => {
    it('renders start icon', () => {
      const StartIcon = () => <span data-testid="start-icon">→</span>;
      renderWithTheme(<Button startIcon={<StartIcon />}>With Icon</Button>);
      expect(screen.getByTestId('start-icon')).toBeInTheDocument();
    });

    it('renders end icon', () => {
      const EndIcon = () => <span data-testid="end-icon">←</span>;
      renderWithTheme(<Button endIcon={<EndIcon />}>With Icon</Button>);
      expect(screen.getByTestId('end-icon')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('supports ARIA attributes', () => {
      renderWithTheme(
        <Button aria-label="Custom label" aria-describedby="description">
          Button
        </Button>
      );
      
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-label', 'Custom label');
      expect(button).toHaveAttribute('aria-describedby', 'description');
    });

    it('supports keyboard navigation', () => {
      renderWithTheme(<Button>Focusable</Button>);
      const button = screen.getByRole('button');
      
      button.focus();
      expect(button).toHaveFocus();
    });
  });

  describe('Custom Props', () => {
    it('forwards custom props to underlying button', () => {
      renderWithTheme(<Button data-testid="custom-button" {...({ title: "Custom title" } as any)}>Custom</Button>);    
      const button = screen.getByTestId('custom-button');
      expect(button).toHaveAttribute('title', 'Custom title');
    });

    it('accepts custom className', () => {
      renderWithTheme(<Button className="custom-class">Custom Class</Button>);
      expect(screen.getByRole('button')).toHaveClass('custom-class');
    });
  });
});