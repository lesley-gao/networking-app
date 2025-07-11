// ClientApp/src/components/ui/Input.tsx
import React from 'react';
import {
  TextField as MuiTextField,
  FormControl,
  FormLabel,
  FormHelperText,
  InputAdornment,
  IconButton,
  //Select as MuiSelect,
  MenuItem,
  Checkbox as MuiCheckbox,
  FormControlLabel,
  Radio,
  RadioGroup as MuiRadioGroup,
  Switch as MuiSwitch,
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { SxProps, Theme } from '@mui/material/styles';

// TypeScript interfaces
export interface BaseInputProps {
  id?: string;
  name?: string;
  label?: string;
  placeholder?: string;
  value?: any;
  defaultValue?: any;
  onChange?: (event: React.ChangeEvent<any>) => void;
  onBlur?: (event: React.FocusEvent<any>) => void;
  onFocus?: (event: React.FocusEvent<any>) => void;
  disabled?: boolean;
  required?: boolean;
  error?: boolean;
  helperText?: string;
  fullWidth?: boolean;
  className?: string;
  sx?: SxProps<Theme>;
  'data-testid'?: string;
}

export interface TextFieldProps extends BaseInputProps {
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'search';
  multiline?: boolean;
  rows?: number;
  maxRows?: number;
  minRows?: number;
  startAdornment?: React.ReactNode;
  endAdornment?: React.ReactNode;
  size?: 'small' | 'medium';
  variant?: 'outlined' | 'filled' | 'standard';
  autoComplete?: string;
  autoFocus?: boolean;
  maxLength?: number;
  minLength?: number;
  pattern?: string;
}

export interface SelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends BaseInputProps {
  options: SelectOption[];
  multiple?: boolean;
  size?: 'small' | 'medium';
  variant?: 'outlined' | 'filled' | 'standard';
  displayEmpty?: boolean;
}

export interface CheckboxProps extends Omit<BaseInputProps, 'value' | 'onChange'> {
  checked?: boolean;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>, checked: boolean) => void;
  indeterminate?: boolean;
  size?: 'small' | 'medium';
  color?: 'primary' | 'secondary' | 'default';
}

export interface RadioOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface RadioGroupProps extends Omit<BaseInputProps, 'onChange'> {
  options: RadioOption[];
  onChange?: (event: React.ChangeEvent<HTMLInputElement>, value: string) => void;
  row?: boolean;
  size?: 'small' | 'medium';
  color?: 'primary' | 'secondary' | 'default';
}

export interface SwitchProps extends Omit<BaseInputProps, 'value' | 'onChange'> {
  checked?: boolean;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>, checked: boolean) => void;
  size?: 'small' | 'medium';
  color?: 'primary' | 'secondary' | 'default';
}

// Styled components
const StyledTextField = styled(MuiTextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    borderRadius: theme.spacing(1), // 8px
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    
    '&:hover': {
      '& .MuiOutlinedInput-notchedOutline': {
        borderColor: theme.palette.primary.main,
      },
    },
    
    '&.Mui-focused': {
      '& .MuiOutlinedInput-notchedOutline': {
        borderWidth: 2,
      },
    },
  },
  
  '& .MuiInputLabel-root': {
    fontWeight: 500,
  },
  
  '& .MuiFormHelperText-root': {
    marginLeft: 0,
    marginTop: theme.spacing(0.5),
  },
}));

// TextField component
export const TextField: React.FC<TextFieldProps> = ({
  type = 'text',
  multiline = false,
  rows,
  maxRows,
  minRows,
  startAdornment,
  endAdornment,
  size = 'medium',
  variant = 'outlined',
  autoComplete,
  autoFocus = false,
  maxLength,
  minLength,
  pattern,
  className = '',
  sx,
  'data-testid': testId,
  ...props
}) => {
  const [showPassword, setShowPassword] = React.useState(false);

  const handleTogglePassword = () => {
    setShowPassword(!showPassword);
  };

  // Auto-add password toggle for password fields
  const getEndAdornment = () => {
    if (type === 'password') {
      return (
        <InputAdornment position="end">
          <IconButton
            onClick={handleTogglePassword}
            edge="end"
            size="small"
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            {showPassword ? <VisibilityOff /> : <Visibility />}
          </IconButton>
          {endAdornment}
        </InputAdornment>
      );
    }
    return endAdornment;
  };

  const getStartAdornment = () => {
    return startAdornment ? (
      <InputAdornment position="start">{startAdornment}</InputAdornment>
    ) : undefined;
  };

  return (
    <StyledTextField
      type={type === 'password' ? (showPassword ? 'text' : 'password') : type}
      multiline={multiline}
      rows={rows}
      maxRows={maxRows}
      minRows={minRows}
      size={size}
      variant={variant}
      autoComplete={autoComplete}
      autoFocus={autoFocus}
      InputProps={{
        startAdornment: getStartAdornment(),
        endAdornment: getEndAdornment(),
        inputProps: {
          maxLength,
          minLength,
          pattern,
        },
      }}
      className={`${className} bg-white dark:bg-gray-700 rounded-lg`.trim()}
      sx={sx}
      data-testid={testId}
      {...props}
    />
  );
};

// Select component
export const Select: React.FC<SelectProps> = ({
  options,
  multiple = false,
  size = 'medium',
  variant = 'outlined',
  displayEmpty = false,
  className = '',
  sx,
  'data-testid': testId,
  ...props
}) => {
  return (
    <FormControl fullWidth={props.fullWidth} error={props.error} disabled={props.disabled}>
      {props.label && <FormLabel component="legend">{props.label}</FormLabel>}
      <MuiTextField
        select
        size={size}
        variant={variant}
        SelectProps={{
          multiple,
          displayEmpty,
        }}
        className={`${className} bg-white dark:bg-gray-700 rounded-lg`.trim()}
        sx={sx}
        data-testid={testId}
        {...props}
      >
        {displayEmpty && (
          <MenuItem value="">
            <em>None</em>
          </MenuItem>
        )}
        {options.map((option) => (
          <MenuItem
            key={option.value}
            value={option.value}
            disabled={option.disabled}
          >
            {option.label}
          </MenuItem>
        ))}
      </MuiTextField>
      {props.helperText && (
        <FormHelperText>{props.helperText}</FormHelperText>
      )}
    </FormControl>
  );
};

// Checkbox component
export const Checkbox: React.FC<CheckboxProps> = ({
  checked,
  onChange,
  indeterminate = false,
  size = 'medium',
  color = 'primary',
  label,
  className = '',
  sx,
  'data-testid': testId,
  ...props
}) => {
  const checkboxElement = (
    <MuiCheckbox
      checked={checked}
      onChange={onChange}
      indeterminate={indeterminate}
      size={size}
      color={color}
      className={`${className} text-blue-600`.trim()}
      sx={sx}
      data-testid={testId}
      {...props}
    />
  );

  if (label) {
    return (
      <FormControlLabel
        control={checkboxElement}
        label={label}
        disabled={props.disabled}
      />
    );
  }

  return checkboxElement;
};

// RadioGroup component
export const RadioGroup: React.FC<RadioGroupProps> = ({
  options,
  onChange,
  row = false,
  size = 'medium',
  color = 'primary',
  className = '',
  sx,
  'data-testid': testId,
  ...props
}) => {
  return (
    <FormControl component="fieldset" error={props.error} disabled={props.disabled}>
      {props.label && <FormLabel component="legend">{props.label}</FormLabel>}
      <MuiRadioGroup
        value={props.value}
        onChange={onChange}
        row={row}
        className={`${className}`.trim()}
        sx={sx}
        data-testid={testId}
      >
        {options.map((option) => (
          <FormControlLabel
            key={option.value}
            value={option.value}
            control={
              <Radio
                size={size}
                color={color}
                disabled={option.disabled}
                className="text-blue-600"
              />
            }
            label={option.label}
            disabled={option.disabled || props.disabled}
          />
        ))}
      </MuiRadioGroup>
      {props.helperText && (
        <FormHelperText>{props.helperText}</FormHelperText>
      )}
    </FormControl>
  );
};

// Switch component
export const Switch: React.FC<SwitchProps> = ({
  checked,
  onChange,
  size = 'medium',
  color = 'primary',
  label,
  className = '',
  sx,
  'data-testid': testId,
  ...props
}) => {
  const switchElement = (
    <MuiSwitch
      checked={checked}
      onChange={onChange}
      size={size}
      color={color}
      className={`${className}`.trim()}
      sx={sx}
      data-testid={testId}
      {...props}
    />
  );

  if (label) {
    return (
      <FormControlLabel
        control={switchElement}
        label={label}
        disabled={props.disabled}
      />
    );
  }

  return switchElement;
};

// Export compound component
const Input = {
  TextField,
  Select,
  Checkbox,
  RadioGroup,
  Switch,
};

export default Input;