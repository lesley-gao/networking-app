// ClientApp/src/components/forms/PickupOfferForm.tsx
import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import { Button } from '../ui/Button';

// Validation Schema
const pickupOfferSchema = z.object({
  airport: z
    .string()
    .min(3, 'Airport is required')
    .max(10, 'Invalid airport code'),
  
  vehicleType: z
    .string()
    .min(2, 'Vehicle type must be at least 2 characters')
    .max(50, 'Vehicle type must be less than 50 characters')
    .optional(),
  
  maxPassengers: z
    .number()
    .min(1, 'At least 1 passenger required')
    .max(8, 'Maximum 8 passengers allowed'),
  
  canHandleLuggage: z.boolean().default(true),
  
  serviceArea: z
    .string()
    .min(5, 'Service area must be at least 5 characters')
    .max(200, 'Service area must be less than 200 characters')
    .optional(),
  
  baseRate: z
    .number()
    .min(0, 'Base rate cannot be negative')
    .max(200, 'Base rate cannot exceed $200'),
  
  languages: z
    .string()
    .max(200, 'Languages must be less than 200 characters')
    .optional(),
  
  additionalServices: z
    .string()
    .max(500, 'Additional services must be less than 500 characters')
    .optional(),
});

type PickupOfferFormData = z.infer<typeof pickupOfferSchema>;

interface PickupOfferFormProps {
  onSubmit: (data: PickupOfferFormData) => Promise<void>;
  onCancel?: () => void;
  loading?: boolean;
  initialData?: Partial<PickupOfferFormData>;
}

const airportOptions = [
  { value: 'AKL', label: 'Auckland (AKL)' },
  { value: 'WLG', label: 'Wellington (WLG)' },
  { value: 'CHC', label: 'Christchurch (CHC)' },
  { value: 'ZQN', label: 'Queenstown (ZQN)' },
];

const vehicleTypeOptions = [
  { value: 'Sedan', label: 'Sedan (4 passengers)' },
  { value: 'SUV', label: 'SUV (6 passengers)' },
  { value: 'Van', label: 'Van (8 passengers)' },
  { value: 'Luxury', label: 'Luxury Vehicle' },
];

const maxPassengersOptions = [
  { value: 1, label: '1 passenger' },
  { value: 2, label: '2 passengers' },
  { value: 3, label: '3 passengers' },
  { value: 4, label: '4 passengers' },
  { value: 6, label: '6 passengers' },
  { value: 8, label: '8 passengers' },
];

export const PickupOfferForm: React.FC<PickupOfferFormProps> = ({
  onSubmit,
  onCancel,
  loading = false,
  initialData,
}) => {
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<PickupOfferFormData>({
    resolver: zodResolver(pickupOfferSchema),
    defaultValues: {
      airport: 'AKL',
      vehicleType: '',
      maxPassengers: 4,
      canHandleLuggage: true,
      serviceArea: '',
      baseRate: 0,
      languages: '',
      additionalServices: '',
      ...initialData,
    },
  });

  const handleFormSubmit = async (data: PickupOfferFormData) => {
    try {
      await onSubmit(data);
      reset();
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  const handleCancel = () => {
    reset();
    onCancel?.();
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} style={{ marginTop: '12px' }}>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <Controller
            name="airport"
            control={control}
            render={({ field }) => (
              <FormControl fullWidth required error={!!errors.airport}>
                <InputLabel>Airport</InputLabel>
                <Select
                  {...field}
                  label="Airport"
                >
                  {airportOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <Controller
            name="vehicleType"
            control={control}
            render={({ field }) => (
              <FormControl fullWidth error={!!errors.vehicleType}>
                <InputLabel>Vehicle Type</InputLabel>
                <Select
                  {...field}
                  label="Vehicle Type"
                >
                  {vehicleTypeOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <Controller
            name="maxPassengers"
            control={control}
            render={({ field }) => (
              <FormControl fullWidth required error={!!errors.maxPassengers}>
                <InputLabel>Max Passengers</InputLabel>
                <Select
                  {...field}
                  label="Max Passengers"
                >
                  {maxPassengersOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <Controller
            name="baseRate"
            control={control}
            render={({ field: { onChange, value, ...field } }) => (
              <TextField
                {...field}
                value={value || ''}
                onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
                label="Base Rate (NZD)"
                type="number"
                inputProps={{ min: 0, max: 200, step: 5 }}
                placeholder="50"
                error={!!errors.baseRate}
                helperText={errors.baseRate?.message}
                fullWidth
              />
            )}
          />
        </Grid>

        <Grid item xs={12}>
          <Controller
            name="serviceArea"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Service Area"
                placeholder="e.g., Auckland CBD, North Shore, Airport to City"
                error={!!errors.serviceArea}
                helperText={errors.serviceArea?.message}
                fullWidth
              />
            )}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <Controller
            name="languages"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Languages Spoken (Optional)"
                placeholder="e.g., English, Mandarin, Cantonese"
                error={!!errors.languages}
                helperText={errors.languages?.message}
                fullWidth
              />
            )}
          />
        </Grid>

        <Grid item xs={12}>
          <Controller
            name="canHandleLuggage"
            control={control}
            render={({ field: { value, onChange, ...field } }) => (
              <FormControlLabel
                control={
                  <Checkbox
                    {...field}
                    checked={value}
                    onChange={(e) => onChange(e.target.checked)}
                  />
                }
                label="Can handle luggage"
              />
            )}
          />
        </Grid>

        <Grid item xs={12}>
          <Controller
            name="additionalServices"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Additional Services"
                placeholder="e.g., Child seats available, wheelchair accessible, meet and greet service..."
                multiline
                rows={3}
                error={!!errors.additionalServices}
                helperText={errors.additionalServices?.message}
                fullWidth
              />
            )}
          />
        </Grid>
      </Grid>

      <Box style={{ marginTop: '12px', display: 'flex', justifyContent: 'flex-start', gap: '12px' }}>
        <Button
          type="button"
          onClick={handleCancel}
          disabled={loading || isSubmitting}
          variant="text"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant="contained"
          loading={loading || isSubmitting}
          disabled={loading || isSubmitting}
        >
          Create Offer
        </Button>
      </Box>
    </form>
  );
};

export default PickupOfferForm;