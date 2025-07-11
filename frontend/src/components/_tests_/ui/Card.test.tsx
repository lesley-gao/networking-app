import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import Card from '../../ui/Card';

const theme = createTheme();

const renderWithTheme = (ui: React.ReactElement) => {
  return render(
    <ThemeProvider theme={theme}>
      {ui}
    </ThemeProvider>
  );
};

describe('Card Component', () => {
  describe('Basic Functionality', () => {
    it('renders card with content', () => {
      renderWithTheme(
        <Card>
          <Card.Content>
            <div>Card content</div>
          </Card.Content>
        </Card>
      );
      expect(screen.getByText('Card content')).toBeInTheDocument();
    });

    it('renders card with header', () => {
      renderWithTheme(
        <Card>
          <Card.Header title="Test Title" />
          <Card.Content>
            <div>Card content</div>
          </Card.Content>
        </Card>
      );
      expect(screen.getByText('Test Title')).toBeInTheDocument();
      expect(screen.getByText('Card content')).toBeInTheDocument();
    });

    it('renders card with actions', () => {
      renderWithTheme(
        <Card>
          <Card.Content>
            <div>Card content</div>
          </Card.Content>
          <Card.Actions>
            <button>Action Button</button>
          </Card.Actions>
        </Card>
      );
      
      expect(screen.getByText('Card content')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /action button/i })).toBeInTheDocument();
    });
  });

  describe('Interactive Features', () => {
    it('handles click events when clickable', () => {
      const handleClick = jest.fn();
      renderWithTheme(
        <Card onClick={handleClick} data-testid="clickable-card">
          <Card.Content>
            <div>Clickable card</div>
          </Card.Content>
        </Card>
      );
      
      fireEvent.click(screen.getByTestId('clickable-card'));
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('adds hover effect when hover prop is true', () => {
      renderWithTheme(
        <Card hover data-testid="hover-card">
          <Card.Content>
            <div>Hover card</div>
          </Card.Content>
        </Card>
      );
      
      const cardElement = screen.getByTestId('hover-card');
      expect(cardElement).toBeInTheDocument();
    });

    it('does not add hover effect when hover prop is false', () => {
      renderWithTheme(
        <Card hover={false} data-testid="no-hover-card">
          <Card.Content>
            <div>Non-hover card</div>
          </Card.Content>
        </Card>
      );
      
      const cardElement = screen.getByTestId('no-hover-card');
      expect(cardElement).toBeInTheDocument();
    });
  });

  describe('Elevation and Variants', () => {
    it('applies custom elevation', () => {
      renderWithTheme(
        <Card elevation={8} data-testid="elevated-card">
          <Card.Content>
            <div>Elevated card</div>
          </Card.Content>
        </Card>
      );
      
      const cardElement = screen.getByTestId('elevated-card');
      expect(cardElement).toBeInTheDocument();
    });

    it('applies outlined variant', () => {
      renderWithTheme(
        <Card variant="outlined" data-testid="outlined-card">
          <Card.Content>
            <div>Outlined card</div>
          </Card.Content>
        </Card>
      );
      
      const cardElement = screen.getByTestId('outlined-card');
      expect(cardElement).toBeInTheDocument();
    });
  });

  describe('Layout and Styling', () => {
    it('applies custom className', () => {
      renderWithTheme(
        <Card className="custom-card-class" data-testid="custom-card">
          <Card.Content>
            <div>Custom card</div>
          </Card.Content>
        </Card>
      );
      
      const cardElement = screen.getByTestId('custom-card');
      expect(cardElement).toHaveClass('custom-card-class');
    });

    it('applies custom styles', () => {
      const customStyle = { backgroundColor: 'red' };
      renderWithTheme(
        <Card sx={customStyle} data-testid="styled-card">
          <Card.Content>
            <div>Styled card</div>
          </Card.Content>
        </Card>
      );
      
      const cardElement = screen.getByTestId('styled-card');
      expect(cardElement).toBeInTheDocument();
    });
  });

  describe('Content Structure', () => {
    it('renders complex content structure', () => {
      renderWithTheme(
        <Card>
          <Card.Header title="Flight Companion" subheader="Help Request" />
          <Card.Content>
            <div>
              <p>Flight: NZ001</p>
              <p>Date: 2024-12-15</p>
            </div>
          </Card.Content>
        </Card>
      );
      
      expect(screen.getByText('Flight Companion')).toBeInTheDocument();
      expect(screen.getByText('Help Request')).toBeInTheDocument();
      expect(screen.getByText('Flight: NZ001')).toBeInTheDocument();
      expect(screen.getByText('Date: 2024-12-15')).toBeInTheDocument();
    });

    it('renders card with avatar in header', () => {
      const avatar = <div data-testid="user-avatar">Avatar</div>;
      renderWithTheme(
        <Card>
          <Card.Header title="User Card" avatar={avatar} />
          <Card.Content>
            <div>Card with avatar</div>
          </Card.Content>
        </Card>
      );
      
      expect(screen.getByTestId('user-avatar')).toBeInTheDocument();
      expect(screen.getByText('Card with avatar')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('supports ARIA attributes', () => {
      renderWithTheme(
        <Card 
          aria-label="Flight companion card"
          data-testid="accessible-card"
        >
          <Card.Content>
            <div>Accessible card</div>
          </Card.Content>
        </Card>
      );
      
      const cardElement = screen.getByTestId('accessible-card');
      expect(cardElement).toHaveAttribute('aria-label', 'Flight companion card');
    });

    it('supports keyboard navigation when clickable', () => {
      const handleClick = jest.fn();
      renderWithTheme(
        <Card onClick={handleClick} data-testid="focusable-card">
          <Card.Content>
            <div>Focusable card</div>
          </Card.Content>
        </Card>
      );
      
      const cardElement = screen.getByTestId('focusable-card');
      
      // Test keyboard activation
      fireEvent.keyDown(cardElement, { key: 'Enter' });
      expect(handleClick).toHaveBeenCalledTimes(1);
      
      fireEvent.keyDown(cardElement, { key: ' ' });
      expect(handleClick).toHaveBeenCalledTimes(2);
    });
  });

  describe('Loading State', () => {
    it('shows loading skeleton when loading', () => {
      renderWithTheme(
        <Card loading>
          <div>Loading card</div>
        </Card>
      );
      
      expect(screen.getByTestId('card-skeleton')).toBeInTheDocument();
      expect(screen.queryByText('Loading card')).not.toBeInTheDocument();
    });

    it('shows content when not loading', () => {
      renderWithTheme(
        <Card loading={false}>
          <div>Loaded card</div>
        </Card>
      );
      
      expect(screen.queryByTestId('card-skeleton')).not.toBeInTheDocument();
      expect(screen.getByText('Loaded card')).toBeInTheDocument();
    });
  });
});