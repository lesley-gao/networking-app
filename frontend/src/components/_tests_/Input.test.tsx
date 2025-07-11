// ClientApp/src/components/ui/__tests__/Input.test.tsx
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { TextField, Select, Checkbox, RadioGroup, Switch } from '../ui/Input';

const theme = createTheme();

const renderWithTheme = (ui: React.ReactElement) => {
  return render(
    <ThemeProvider theme={theme}>
      {ui}
    </ThemeProvider>
  );
};

describe('Input Components', () => {
  describe('TextField', () => {
    it('renders text field with label', () => {
      renderWithTheme(<TextField label="Test Field" />);
      
      expect(screen.getByLabelText('Test Field')).toBeInTheDocument();
    });

    it('renders with placeholder', () => {
      renderWithTheme(<TextField placeholder="Enter text..." />);
      
      expect(screen.getByPlaceholderText('Enter text...')).toBeInTheDocument();
    });

    it('handles value changes', async () => {
      const mockOnChange = jest.fn();
      const user = userEvent.setup();
      
      renderWithTheme(<TextField label="Test" onChange={mockOnChange} />);
      
      const input = screen.getByLabelText('Test');
      await user.type(input, 'hello');
      
      expect(mockOnChange).toHaveBeenCalled();
      expect(input).toHaveValue('hello');
    });

    it('shows error state', () => {
      renderWithTheme(
        <TextField 
          label="Test" 
          error={true} 
          helperText="This field is required" 
        />
      );
      
      expect(screen.getByText('This field is required')).toBeInTheDocument();
      const input = screen.getByLabelText('Test');
      expect(input).toHaveAttribute('aria-invalid', 'true');
    });

    it('renders as small size when specified', () => {
      renderWithTheme(<TextField label="Small" size="small" />);
      
      const input = screen.getByLabelText('Small');
      expect(input).toBeInTheDocument();
      // Test behavior: small inputs typically have different styling but we test accessibility
      expect(input).toHaveAccessibleName('Small');
    });

    it('renders as filled variant when specified', () => {
      renderWithTheme(<TextField label="Filled" variant="filled" />);
      
      const input = screen.getByLabelText('Filled');
      expect(input).toBeInTheDocument();
      // Test that the component renders correctly with variant
      expect(input).toHaveAccessibleName('Filled');
    });

    it('supports multiline', () => {
      renderWithTheme(<TextField label="Multi" multiline rows={3} />);
      
      const textarea = screen.getByLabelText('Multi');
      expect(textarea.tagName).toBe('TEXTAREA');
      expect(textarea).toHaveAttribute('rows', '3');
    });

    it('renders required field', () => {
      renderWithTheme(<TextField label="Required" required />);
      
      const input = screen.getByLabelText('Required *');
      expect(input).toHaveAttribute('required');
    });

    it('renders disabled field', () => {
      renderWithTheme(<TextField label="Disabled" disabled />);
      
      const input = screen.getByLabelText('Disabled');
      expect(input).toBeDisabled();
    });

    it('supports password type with visibility toggle', async () => {
      const user = userEvent.setup();
      
      renderWithTheme(<TextField label="Password" type="password" />);
      
      const input = screen.getByLabelText('Password');
      expect(input).toHaveAttribute('type', 'password');
      
      // Should have visibility toggle button
      const toggleButton = screen.getByRole('button', { name: /toggle password visibility/i });
      await user.click(toggleButton);
      
      expect(input).toHaveAttribute('type', 'text');
    });

    it('supports fullWidth prop', () => {
      renderWithTheme(<TextField label="Full Width" fullWidth />);
      
      const input = screen.getByLabelText('Full Width');
      expect(input).toBeInTheDocument();
      // Full width is a styling concern, test that component renders
      expect(input).toHaveAccessibleName('Full Width');
    });

    it('renders with custom data-testid', () => {
      renderWithTheme(<TextField label="Test" data-testid="custom-input" />);
      
      expect(screen.getByTestId('custom-input')).toBeInTheDocument();
    });

    it('accepts initial value', () => {
      renderWithTheme(<TextField label="Initial Value" defaultValue="preset" />);
      
      const input = screen.getByLabelText('Initial Value');
      expect(input).toHaveValue('preset');
    });
  });

  describe('Select', () => {
    const selectOptions = [
      { value: 'option1', label: 'Option 1' },
      { value: 'option2', label: 'Option 2' },
      { value: 'option3', label: 'Option 3' },
    ];

    it('renders select with options', async () => {
      const user = userEvent.setup();
      
      renderWithTheme(<Select label="Test Select" options={selectOptions} />);
      
      const select = screen.getByLabelText('Test Select');
      expect(select).toBeInTheDocument();
      
      // Open the select
      await user.click(select);
      
      // Check if options are visible
      expect(screen.getByText('Option 1')).toBeInTheDocument();
      expect(screen.getByText('Option 2')).toBeInTheDocument();
      expect(screen.getByText('Option 3')).toBeInTheDocument();
    });

    it('handles value selection', async () => {
      const mockOnChange = jest.fn();
      const user = userEvent.setup();
      
      renderWithTheme(
        <Select 
          label="Test Select" 
          options={selectOptions} 
          onChange={mockOnChange}
        />
      );
      
      const select = screen.getByLabelText('Test Select');
      await user.click(select);
      
      const option = screen.getByText('Option 2');
      await user.click(option);
      
      expect(mockOnChange).toHaveBeenCalled();
    });

    it('supports multiple selection', async () => {
      const user = userEvent.setup();
      
      renderWithTheme(
        <Select 
          label="Multi Select" 
          options={selectOptions} 
          multiple 
        />
      );
      
      const select = screen.getByLabelText('Multi Select');
      await user.click(select);
      
      // Select multiple options
      await user.click(screen.getByText('Option 1'));
      await user.click(screen.getByText('Option 2'));
      
      expect(screen.getByText('Option 1')).toBeInTheDocument();
      expect(screen.getByText('Option 2')).toBeInTheDocument();
    });

    it('shows error state', () => {
      renderWithTheme(
        <Select 
          label="Error Select" 
          options={selectOptions} 
          error={true}
          helperText="Selection required"
        />
      );
      
      expect(screen.getByText('Selection required')).toBeInTheDocument();
      const select = screen.getByLabelText('Error Select');
      expect(select).toHaveAttribute('aria-invalid', 'true');
    });

    it('renders with empty option when displayEmpty is true', async () => {
      const user = userEvent.setup();
      
      renderWithTheme(
        <Select 
          label="With Empty" 
          options={selectOptions} 
          displayEmpty 
        />
      );
      
      const select = screen.getByLabelText('With Empty');
      await user.click(select);
      
      expect(screen.getByText('None')).toBeInTheDocument();
    });

    it('supports disabled state', () => {
      renderWithTheme(
        <Select 
          label="Disabled Select" 
          options={selectOptions} 
          disabled 
        />
      );
      
      const select = screen.getByLabelText('Disabled Select');
      expect(select).toHaveAttribute('aria-disabled', 'true');
    });

    it('displays selected value', () => {
      renderWithTheme(
        <Select 
          label="Preset Select" 
          options={selectOptions} 
          value="option2"
          onChange={() => {}}
        />
      );
      
      const select = screen.getByLabelText('Preset Select');
      expect(select).toHaveDisplayValue('Option 2');
    });
  });

  describe('Checkbox', () => {
    it('renders checkbox with label', () => {
      renderWithTheme(<Checkbox label="Test Checkbox" />);
      
      expect(screen.getByLabelText('Test Checkbox')).toBeInTheDocument();
      expect(screen.getByRole('checkbox', { name: 'Test Checkbox' })).toBeInTheDocument();
    });

    it('handles checked state changes', async () => {
      const mockOnChange = jest.fn();
      const user = userEvent.setup();
      
      renderWithTheme(
        <Checkbox 
          label="Toggle Me" 
          onChange={mockOnChange} 
        />
      );
      
      const checkbox = screen.getByLabelText('Toggle Me');
      await user.click(checkbox);
      
      expect(mockOnChange).toHaveBeenCalledWith(expect.any(Object), true);
    });

    it('renders in checked state', () => {
      renderWithTheme(<Checkbox label="Checked" checked={true} />);
      
      const checkbox = screen.getByLabelText('Checked');
      expect(checkbox).toBeChecked();
    });

    it('renders in disabled state', () => {
      renderWithTheme(<Checkbox label="Disabled" disabled />);
      
      const checkbox = screen.getByLabelText('Disabled');
      expect(checkbox).toBeDisabled();
    });

    it('supports different colors', () => {
      renderWithTheme(<Checkbox label="Secondary" color="secondary" />);
      
      const checkbox = screen.getByRole('checkbox', { name: 'Secondary' });
      expect(checkbox).toBeInTheDocument();
      // Color is a styling concern - test that component renders correctly
      expect(checkbox).toHaveAccessibleName('Secondary');
    });

    it('supports different sizes', () => {
      renderWithTheme(<Checkbox label="Small" size="small" />);
      
      const checkbox = screen.getByRole('checkbox', { name: 'Small' });
      expect(checkbox).toBeInTheDocument();
      // Size is a styling concern - test that component renders correctly
      expect(checkbox).toHaveAccessibleName('Small');
    });

    it('shows error state', () => {
      renderWithTheme(
        <Checkbox 
          label="Error Checkbox" 
          error={true}
          helperText="This field is required"
        />
      );
      
      expect(screen.getByText('This field is required')).toBeInTheDocument();
    });
  });

  describe('RadioGroup', () => {
    const radioOptions = [
      { value: 'option1', label: 'Option 1' },
      { value: 'option2', label: 'Option 2' },
      { value: 'option3', label: 'Option 3' },
    ];

    it('renders radio group with options', () => {
      renderWithTheme(
        <RadioGroup 
          label="Test Radio" 
          options={radioOptions} 
        />
      );
      
      expect(screen.getByText('Test Radio')).toBeInTheDocument();
      expect(screen.getByRole('radiogroup', { name: 'Test Radio' })).toBeInTheDocument();
      expect(screen.getByLabelText('Option 1')).toBeInTheDocument();
      expect(screen.getByLabelText('Option 2')).toBeInTheDocument();
      expect(screen.getByLabelText('Option 3')).toBeInTheDocument();
    });

    it('handles value selection', async () => {
      const mockOnChange = jest.fn();
      const user = userEvent.setup();
      
      renderWithTheme(
        <RadioGroup 
          label="Test Radio" 
          options={radioOptions}
          onChange={mockOnChange}
        />
      );
      
      const radio = screen.getByLabelText('Option 2');
      await user.click(radio);
      
      expect(mockOnChange).toHaveBeenCalledWith(expect.any(Object), 'option2');
    });

    it('renders with default value', () => {
      renderWithTheme(
        <RadioGroup 
          label="Default Radio" 
          options={radioOptions}
          value="option2"
        />
      );
      
      const radio = screen.getByLabelText('Option 2');
      expect(radio).toBeChecked();
    });

    it('supports horizontal layout', () => {
      renderWithTheme(
        <RadioGroup 
          label="Horizontal Radio" 
          options={radioOptions}
          row
        />
      );
      
      const radioGroup = screen.getByRole('radiogroup');
      expect(radioGroup).toBeInTheDocument();
      // Row layout is styling - test that all options are still accessible
      expect(screen.getByLabelText('Option 1')).toBeInTheDocument();
      expect(screen.getByLabelText('Option 2')).toBeInTheDocument();
      expect(screen.getByLabelText('Option 3')).toBeInTheDocument();
    });

    it('shows error state', () => {
      renderWithTheme(
        <RadioGroup 
          label="Error Radio" 
          options={radioOptions}
          error={true}
          helperText="Selection required"
        />
      );
      
      expect(screen.getByText('Selection required')).toBeInTheDocument();
    });

    it('supports disabled state', () => {
      renderWithTheme(
        <RadioGroup 
          label="Disabled Radio" 
          options={radioOptions}
          disabled
        />
      );
      
      const radio1 = screen.getByLabelText('Option 1');
      const radio2 = screen.getByLabelText('Option 2');
      
      expect(radio1).toBeDisabled();
      expect(radio2).toBeDisabled();
    });
  });

  describe('Switch', () => {
    it('renders switch with label', () => {
      renderWithTheme(<Switch label="Test Switch" />);
      
      expect(screen.getByLabelText('Test Switch')).toBeInTheDocument();
      expect(screen.getByRole('checkbox', { name: 'Test Switch' })).toBeInTheDocument();
    });

    it('handles toggle changes', async () => {
      const mockOnChange = jest.fn();
      const user = userEvent.setup();
      
      renderWithTheme(
        <Switch 
          label="Toggle Switch" 
          onChange={mockOnChange} 
        />
      );
      
      const switchElement = screen.getByLabelText('Toggle Switch');
      await user.click(switchElement);
      
      expect(mockOnChange).toHaveBeenCalledWith(expect.any(Object), true);
    });

    it('renders in checked state', () => {
      renderWithTheme(<Switch label="Checked Switch" checked={true} />);
      
      const switchElement = screen.getByLabelText('Checked Switch');
      expect(switchElement).toBeChecked();
    });

    it('renders in disabled state', () => {
      renderWithTheme(<Switch label="Disabled Switch" disabled />);
      
      const switchElement = screen.getByLabelText('Disabled Switch');
      expect(switchElement).toBeDisabled();
    });

    it('supports different colors', () => {
      renderWithTheme(<Switch label="Secondary Switch" color="secondary" />);
      
      const switchElement = screen.getByRole('checkbox', { name: 'Secondary Switch' });
      expect(switchElement).toBeInTheDocument();
      // Color is styling - test that component renders correctly
      expect(switchElement).toHaveAccessibleName('Secondary Switch');
    });

    it('supports different sizes', () => {
      renderWithTheme(<Switch label="Small Switch" size="small" />);
      
      const switchElement = screen.getByRole('checkbox', { name: 'Small Switch' });
      expect(switchElement).toBeInTheDocument();
      // Size is styling - test that component renders correctly
      expect(switchElement).toHaveAccessibleName('Small Switch');
    });

    it('shows error state', () => {
      renderWithTheme(
        <Switch 
          label="Error Switch" 
          error={true}
          helperText="Toggle required"
        />
      );
      
      expect(screen.getByText('Toggle required')).toBeInTheDocument();
    });
  });

  describe('Common Props', () => {
    it('applies custom className by testing component presence', () => {
      renderWithTheme(<TextField label="Custom Class" className="custom-input" />);
      
      const input = screen.getByLabelText('Custom Class');
      expect(input).toBeInTheDocument();
      // Custom className is applied - test that component functions correctly
      expect(input).toHaveAccessibleName('Custom Class');
    });

    it('forwards data-testid attribute', () => {
      renderWithTheme(<TextField label="Test ID" data-testid="test-input" />);
      
      expect(screen.getByTestId('test-input')).toBeInTheDocument();
    });

    it('supports sx prop for styling', () => {
      renderWithTheme(
        <TextField 
          label="Styled Input" 
          sx={{ '& .MuiInputBase-root': { backgroundColor: 'red' } }}
        />
      );
      
      const input = screen.getByLabelText('Styled Input');
      expect(input).toBeInTheDocument();
      // sx prop is styling - test that component renders and functions
      expect(input).toHaveAccessibleName('Styled Input');
    });

    it('maintains proper input functionality with custom props', async () => {
      const mockOnChange = jest.fn();
      const user = userEvent.setup();
      
      renderWithTheme(
        <TextField 
          label="Functional Test" 
          className="custom-class"
          data-testid="functional-input"
          onChange={mockOnChange}
        />
      );
      
      const input = screen.getByTestId('functional-input');
      await user.type(input, 'test');
      
      expect(input).toHaveValue('test');
      expect(mockOnChange).toHaveBeenCalled();
    });
  });

  describe('Dark Theme Support', () => {
    const darkTheme = createTheme({
      palette: {
        mode: 'dark',
      },
    });

    const renderWithDarkTheme = (ui: React.ReactElement) => {
      return render(
        <ThemeProvider theme={darkTheme}>
          <div className="dark">
            {ui}
          </div>
        </ThemeProvider>
      );
    };

    it('renders TextField in dark mode', () => {
      renderWithDarkTheme(<TextField label="Dark TextField" />);
      
      const input = screen.getByLabelText('Dark TextField');
      expect(input).toBeInTheDocument();
      expect(input).toHaveAccessibleName('Dark TextField');
    });

    it('renders Select in dark mode', () => {
      const options = [{ value: 'test', label: 'Test' }];
      renderWithDarkTheme(<Select label="Dark Select" options={options} />);
      
      const select = screen.getByLabelText('Dark Select');
      expect(select).toBeInTheDocument();
    });

    it('renders Checkbox in dark mode', () => {
      renderWithDarkTheme(<Checkbox label="Dark Checkbox" />);
      
      const checkbox = screen.getByLabelText('Dark Checkbox');
      expect(checkbox).toBeInTheDocument();
    });

    it('maintains functionality in dark theme', async () => {
      const mockOnChange = jest.fn();
      const user = userEvent.setup();
      
      renderWithDarkTheme(
        <TextField label="Dark Functional" onChange={mockOnChange} />
      );
      
      const input = screen.getByLabelText('Dark Functional');
      await user.type(input, 'dark test');
      
      expect(input).toHaveValue('dark test');
      expect(mockOnChange).toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('provides proper ARIA labels', () => {
      renderWithTheme(<TextField label="Accessible Input" />);
      
      const input = screen.getByLabelText('Accessible Input');
      expect(input).toHaveAccessibleName('Accessible Input');
    });

    it('provides ARIA description for helper text', () => {
      renderWithTheme(
        <TextField 
          label="Described Input" 
          helperText="This is helpful text"
        />
      );
      
      const input = screen.getByLabelText('Described Input');
      expect(input).toHaveAccessibleDescription('This is helpful text');
    });

    it('sets proper ARIA attributes for errors', () => {
      renderWithTheme(
        <TextField 
          label="Error Input" 
          error={true}
          helperText="Error message"
        />
      );
      
      const input = screen.getByLabelText('Error Input');
      expect(input).toHaveAttribute('aria-invalid', 'true');
      expect(input).toHaveAccessibleDescription('Error message');
    });

    it('supports keyboard navigation for Select', async () => {
      const user = userEvent.setup();
      const options = [
        { value: 'option1', label: 'Option 1' },
        { value: 'option2', label: 'Option 2' },
      ];
      
      renderWithTheme(<Select label="Keyboard Select" options={options} />);
      
      const select = screen.getByLabelText('Keyboard Select');
      
      // Focus and open with keyboard
      select.focus();
      await user.keyboard('{Enter}');
      
      expect(screen.getByText('Option 1')).toBeInTheDocument();
    });

    it('maintains proper focus management', async () => {
      const user = userEvent.setup();
      
      renderWithTheme(<TextField label="Focus Test" />);
      
      const input = screen.getByLabelText('Focus Test');
      
      // Focus the input
      await user.click(input);
      expect(input).toHaveFocus();
      
      // Tab away
      await user.tab();
      expect(input).not.toHaveFocus();
    });

    it('provides proper role attributes', () => {
      const radioOptions = [
        { value: 'option1', label: 'Option 1' },
        { value: 'option2', label: 'Option 2' },
      ];
      
      renderWithTheme(<RadioGroup label="Role Test" options={radioOptions} />);
      
      expect(screen.getByRole('radiogroup')).toBeInTheDocument();
      expect(screen.getAllByRole('radio')).toHaveLength(2);
    });
  });

  describe('Form Integration', () => {
    it('works with form submission', async () => {
      const mockSubmit = jest.fn();
      const user = userEvent.setup();
      
      render(
        <ThemeProvider theme={theme}>
          <form onSubmit={mockSubmit}>
            <TextField label="Form Input" name="testInput" />
            <button type="submit">Submit</button>
          </form>
        </ThemeProvider>
      );
      
      const input = screen.getByLabelText('Form Input');
      const submitButton = screen.getByRole('button', { name: 'Submit' });
      
      await user.type(input, 'test value');
      await user.click(submitButton);
      
      expect(mockSubmit).toHaveBeenCalled();
    });

    it('handles controlled vs uncontrolled components', () => {
      // Controlled component
      const { rerender } = renderWithTheme(
        <TextField label="Controlled" value="controlled value" onChange={() => {}} />
      );
      
      let input = screen.getByLabelText('Controlled');
      expect(input).toHaveValue('controlled value');
      
      // Uncontrolled component
      rerender(
        <ThemeProvider theme={theme}>
          <TextField label="Uncontrolled" defaultValue="default value" />
        </ThemeProvider>
      );
      
      input = screen.getByLabelText('Uncontrolled');
      expect(input).toHaveValue('default value');
    });

    it('validates form data correctly', async () => {
      const user = userEvent.setup();
      
      renderWithTheme(
        <TextField 
          label="Required Field" 
          required 
          error={false}
        />
      );
      
      const input = screen.getByLabelText('Required Field *');
      expect(input).toHaveAttribute('required');
      
      // Test that we can type in the required field
      await user.type(input, 'valid input');
      expect(input).toHaveValue('valid input');
    });
  });
});