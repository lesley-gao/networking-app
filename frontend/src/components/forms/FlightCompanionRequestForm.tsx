// ClientApp/src/components/forms/FlightCompanionForm.tsx
import React from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
} from "@mui/material";
import { Button } from "../ui/Button"; // Use your custom Button component

// Validation Schema
const flightCompanionSchema = z.object({
  flightNumber: z
    .string()
    .min(3, "Flight number must be at least 3 characters")
    .max(10, "Flight number must be less than 10 characters")
    .regex(/^[A-Z]{2}\d{2,4}$/, "Invalid flight number format (e.g., NZ289)"),

  airline: z
    .string()
    .min(2, "Airline name is required")
    .max(50, "Airline name must be less than 50 characters"),

  flightDate: z
    .string()
    .min(1, "Flight date is required")
    .refine(
      (date) => new Date(date) > new Date(),
      "Flight date must be in the future"
    ),

  departureAirport: z
    .string()
    .min(3, "Departure airport is required")
    .max(10, "Invalid airport code"),

  arrivalAirport: z
    .string()
    .min(3, "Arrival airport is required")
    .max(10, "Invalid airport code"),

  travelerName: z
    .string()
    .max(100, "Traveler name must be less than 100 characters")
    .optional(),

  travelerAge: z.enum(["Young Adult", "Adult", "Elderly"]).default("Adult"),

  specialNeeds: z
    .string()
    .max(500, "Special needs must be less than 500 characters")
    .optional(),

  offeredAmount: z
    .number()
    .min(0, "Amount cannot be negative")
    .max(500, "Amount cannot exceed $500"),

  additionalNotes: z
    .string()
    .max(1000, "Additional notes must be less than 1000 characters")
    .optional(),
});

type FlightCompanionFormData = z.infer<typeof flightCompanionSchema>;

interface FlightCompanionFormProps {
  onSubmit: (data: FlightCompanionFormData) => Promise<void>;
  onCancel?: () => void;
  loading?: boolean;
  initialData?: Partial<FlightCompanionFormData>;
}

const airportOptions = [
  { value: "AKL", label: "Auckland (AKL)" },
  { value: "PVG", label: "Shanghai (PVG)" },
  { value: "PEK", label: "Beijing (PEK)" },
  { value: "CAN", label: "Guangzhou (CAN)" },
  { value: "CTU", label: "Chengdu (CTU)" },
];

const travelerAgeOptions = [
  { value: "Young Adult", label: "Young Adult (18-30)" },
  { value: "Adult", label: "Adult (31-60)" },
  { value: "Elderly", label: "Elderly (60+)" },
];

export const FlightCompanionForm: React.FC<FlightCompanionFormProps> = ({
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
  } = useForm<FlightCompanionFormData>({
    resolver: zodResolver(flightCompanionSchema),
    defaultValues: {
      flightNumber: "",
      airline: "",
      flightDate: "",
      departureAirport: "",
      arrivalAirport: "",
      travelerName: "",
      travelerAge: "Adult",
      specialNeeds: "",
      offeredAmount: 0,
      additionalNotes: "",
      ...initialData,
    },
  });

  const handleFormSubmit = async (data: FlightCompanionFormData) => {
    try {
      await onSubmit(data);
      reset();
    } catch (error) {
      console.error("Form submission error:", error);
    }
  };

  const handleCancel = () => {
    reset();
    onCancel?.();
  };

  return (
    <Box component="form" onSubmit={handleSubmit(handleFormSubmit)} className="mt-4 mb-6">
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
            name="airline"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Airline"
                placeholder="e.g., Air New Zealand"
                error={!!errors.airline}
                helperText={errors.airline?.message}
                fullWidth
                required
                className="bg-white dark:bg-gray-700"
              />
            )}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <Controller
            name="flightDate"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Flight Date"
                type="datetime-local"
                error={!!errors.flightDate}
                helperText={errors.flightDate?.message}
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
            name="travelerAge"
            control={control}
            render={({ field }) => (
              <FormControl fullWidth error={!!errors.travelerAge}>
                <InputLabel>Traveler Age</InputLabel>
                <Select
                  {...field}
                  label="Traveler Age"
                  className="bg-white dark:bg-gray-700"
                >
                  {travelerAgeOptions.map((option) => (
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
            name="departureAirport"
            control={control}
            render={({ field }) => (
              <FormControl fullWidth required error={!!errors.departureAirport}>
                <InputLabel>From Airport</InputLabel>
                <Select
                  {...field}
                  label="From Airport"
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
            name="arrivalAirport"
            control={control}
            render={({ field }) => (
              <FormControl fullWidth required error={!!errors.arrivalAirport}>
                <InputLabel>To Airport</InputLabel>
                <Select
                  {...field}
                  label="To Airport"
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
            name="travelerName"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Traveler Name (Optional)"
                placeholder="e.g., My parents"
                error={!!errors.travelerName}
                helperText={errors.travelerName?.message}
                fullWidth
                className="bg-white dark:bg-gray-700"
              />
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
                value={value || ""}
                onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
                label="Offered Amount (NZD)"
                type="number"
                inputProps={{ min: 0, max: 500, step: 5 }}
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
            name="specialNeeds"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Special Needs/Help Required"
                placeholder="e.g., Language translation, wheelchair assistance, airport navigation..."
                multiline
                rows={3}
                error={!!errors.specialNeeds}
                helperText={errors.specialNeeds?.message}
                fullWidth
                className="bg-white dark:bg-gray-700"
              />
            )}
          />
        </Grid>

        <Grid item xs={12}>
          <Controller
            name="additionalNotes"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Additional Notes"
                placeholder="Any other information that might be helpful..."
                multiline
                rows={2}
                error={!!errors.additionalNotes}
                helperText={errors.additionalNotes?.message}
                fullWidth
                className="bg-white dark:bg-gray-700"
              />
            )}
          />
        </Grid>
      </Grid>

      <Box className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
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

export default FlightCompanionForm;
