// ClientApp/src/components/forms/PickupRequestForm.tsx
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
  Typography,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import { Button } from '../ui/Button'; // Use your custom Button component

// Validation Schema
const pickupRequestSchema = z.object({
  flightNumber: z
    .string()
    .min(3, 'Flight number must be at least 3 characters')
    .max(10, 'Flight number must be less than 10 characters')
    .regex(/^[A-Z]{2}\d{2,4}$/, 'Invalid flight number format (e.g., NZ289)'),
  
  arrivalDate: z
    .string()
    .min(1, 'Arrival date is required')
    .refine((date) => new Date(date) >= new Date(), 'Arrival date cannot be in the past'),
  
  arrivalTime: z
    .string()
    .min(1, 'Arrival time is required')
    .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'),
  
  airport: z
    .string()
    .min(3, 'Airport is required')
    .max(10, 'Invalid airport code'),
  
  destinationAddress: z
    .string()
    .min(5, 'Destination address is required')
    .max(200, 'Address must be less than 200 characters'),
  
  passengerName: z
    .string()
    .max(100, 'Passenger name must be less than 100 characters')
    .optional(),
  
  passengerPhone: z
    .string()
    .regex(/^(\+64|0)[2-9]\d{7,9}$/, 'Invalid New Zealand phone number')
    .optional()
    .or(z.literal('')),
  
  passengerCount: z
    .number()
    .min(1, 'At least 1 passenger required')
    .max(8, 'Maximum 8 passengers allowed'),
  
  hasLuggage: z.boolean().default(true),
  
  offeredAmount: z
    .number()
    .min(0, 'Amount cannot be negative')
    .max(200, 'Amount cannot exceed $200'),
  
  specialRequests: z
    .string()
    .max(500, 'Special requests must be less than 500 characters')
    .optional(),
});

type PickupRequestFormData = z.infer<typeof pickupRequestSchema>;

interface PickupRequestFormProps {
  onSubmit: (data: PickupRequestFormData) => Promise<void>;
  onCancel?: () => void;
  loading?: boolean;
  initialData?: Partial<PickupRequestFormData>;
}

const airportOptions = [
  { value: 'AKL', label: 'Auckland (AKL)' },
  { value: 'WLG', label: 'Wellington (WLG)' },
  { value: 'CHC', label: 'Christchurch (CHC)' },
  { value: 'ZQN', label: 'Queenstown (ZQN)' },
];

const passengerCountOptions = [
  { value: 1, label: '1 person' },
  { value: 2, label: '2 people' },
  { value: 3, label: '3 people' },
  { value: 4, label: '4+ people' },
];

export const PickupRequestForm: React.FC<PickupRequestFormProps> = ({
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
  } = useForm<PickupRequestFormData>({
    resolver: zodResolver(pickupRequestSchema),
    defaultValues: {
      flightNumber: '',
      arrivalDate: '',
      arrivalTime: '',
      airport: 'AKL',
      destinationAddress: '',
      passengerName: '',
      passengerPhone: '',
      passengerCount: 1,
      hasLuggage: true,
      offeredAmount: 0,
      specialRequests: '',
      ...initialData,
    },
  });

  const handleFormSubmit = async (data: PickupRequestFormData) => {
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
    <Box component="form" onSubmit={handleSubmit(handleFormSubmit)}>
      <Typography variant="h6" className="mb-4 text-gray-800 dark:text-white">
        Request Airport Pickup
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6}>
          <Controller
            name="flightNumber"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Flight Number"
                placeholder="e.g., NZ289"
                error={!!errors.flightNumber}
                helperText={errors.flightNumber?.message}
                fullWidth
                required
                className="bg-white dark:bg-gray-700"
              />
            )}
          />
        </Grid>

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
                  className="bg-white dark:bg-gray-700"
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
            name="arrivalDate"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Arrival Date"
                type="date"
                error={!!errors.arrivalDate}
                helperText={errors.arrivalDate?.message}
                fullWidth
                required
                InputLabelProps={{ shrink: true }}
                className="bg-white dark:bg-gray-700"
              />
            )}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <Controller
            name="arrivalTime"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Arrival Time"
                type="time"
                error={!!errors.arrivalTime}
                helperText={errors.arrivalTime?.message}
                fullWidth
                required
                InputLabelProps={{ shrink: true }}
                className="bg-white dark:bg-gray-700"
              />
            )}
          />
        </Grid>

        <Grid item xs={12}>
          <Controller
            name="destinationAddress"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Destination Address"
                placeholder="e.g., 123 Queen Street, Auckland City"
                error={!!errors.destinationAddress}
                helperText={errors.destinationAddress?.message}
                fullWidth
                required
                className="bg-white dark:bg-gray-700"
              />
            )}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <Controller
            name="passengerName"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Passenger Name (Optional)"
                placeholder="Name of person being picked up"
                error={!!errors.passengerName}
                helperText={errors.passengerName?.message}
                fullWidth
                className="bg-white dark:bg-gray-700"
              />
            )}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <Controller
            name="passengerPhone"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Passenger Phone (Optional)"
                type="tel"
                placeholder="+64 21 123 4567"
                error={!!errors.passengerPhone}
                helperText={errors.passengerPhone?.message}
                fullWidth
                className="bg-white dark:bg-gray-700"
              />
            )}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <Controller
            name="passengerCount"
            control={control}
            render={({ field }) => (
              <FormControl fullWidth required error={!!errors.passengerCount}>
                <InputLabel>Number of Passengers</InputLabel>
                <Select
                  {...field}
                  label="Number of Passengers"
                  className="bg-white dark:bg-gray-700"
                >
                  {passengerCountOptions.map((option) => (
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
            name="offeredAmount"
            control={control}
            render={({ field: { onChange, value, ...field } }) => (
              <TextField
                {...field}
                value={value || ''}
                onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
                label="Offered Amount (NZD)"
                type="number"
                inputProps={{ min: 0, max: 200, step: 5 }}
                placeholder="50"
                error={!!errors.offeredAmount}
                helperText={errors.offeredAmount?.message}
                fullWidth
                className="bg-white dark:bg-gray-700"
              />
            )}
          />
        </Grid>

        <Grid item xs={12}>
          <Controller
            name="hasLuggage"
            control={control}
            render={({ field: { value, onChange, ...field } }) => (
              <FormControlLabel
                control={
                  <Checkbox
                    {...field}
                    checked={value}
                    onChange={(e) => onChange(e.target.checked)}
                    className="text-blue-600"
                  />
                }
                label="Has luggage"
                className="text-gray-700 dark:text-gray-300"
              />
            )}
          />
        </Grid>

        <Grid item xs={12}>
          <Controller
            name="specialRequests"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Special Requests"
                placeholder="e.g., Elderly passengers, large luggage, Chinese speaking driver preferred..."
                multiline
                rows={3}
                error={!!errors.specialRequests}
                helperText={errors.specialRequests?.message}
                fullWidth
                className="bg-white dark:bg-gray-700"
              />
            )}
          />
        </Grid>
      </Grid>

      <Box className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
        <Button
          type="button"
          onClick={handleCancel}
          disabled={loading || isSubmitting}
          variant="text"
          className="text-gray-600 hover:text-gray-800"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant="contained"
          loading={loading || isSubmitting}
          disabled={loading || isSubmitting}
          className="bg-blue-600 hover:bg-blue-700 min-w-[120px]"
        >
          Create Request
        </Button>
      </Box>
    </Box>
  );
};

export default PickupRequestForm;