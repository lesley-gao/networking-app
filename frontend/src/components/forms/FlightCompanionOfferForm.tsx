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
import { Button } from "../ui/Button";

const offerSchema = z.object({
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
  availableServices: z
    .string()
    .max(500, "Services must be less than 500 characters"),
  languages: z.string().max(200, "Languages must be less than 200 characters"),
  helpedCount: z
    .number()
    .min(0, "Must be 0 or more")
    .max(100, "Unrealistic helped count"),
  additionalNotes: z
    .string()
    .max(1000, "Additional notes must be less than 1000 characters")
    .optional(),
});

type FlightCompanionOfferFormData = z.infer<typeof offerSchema>;

interface FlightCompanionOfferFormProps {
  onSubmit: (data: FlightCompanionOfferFormData) => Promise<void>;
  onCancel?: () => void;
  loading?: boolean;
  initialData?: Partial<FlightCompanionOfferFormData>;
}

const airportOptions = [
  { value: "AKL", label: "Auckland (AKL)" },
  { value: "PVG", label: "Shanghai (PVG)" },
  { value: "PEK", label: "Beijing (PEK)" },
  { value: "CAN", label: "Guangzhou (CAN)" },
  { value: "CTU", label: "Chengdu (CTU)" },
];

export const FlightCompanionOfferForm: React.FC<
  FlightCompanionOfferFormProps
> = ({ onSubmit, onCancel, loading = false, initialData }) => {
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<FlightCompanionOfferFormData>({
    resolver: zodResolver(offerSchema),
    defaultValues: {
      flightNumber: "",
      airline: "",
      flightDate: "",
      departureAirport: "",
      arrivalAirport: "",
      availableServices: "",
      languages: "",
      helpedCount: 0,
      additionalNotes: "",
      ...initialData,
    },
  });

  const handleFormSubmit = async (data: FlightCompanionOfferFormData) => {
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
    <Box 
      component="form" 
      onSubmit={handleSubmit(handleFormSubmit)}
      sx={{ 
        marginTop: 1, 
        marginBottom: 1,
        paddingTop: 1,
        paddingBottom: 1
      }}
    >
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
            name="availableServices"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Available Services"
                placeholder="e.g., Language translation, wheelchair assistance, airport navigation..."
                multiline
                rows={2}
                error={!!errors.availableServices}
                helperText={errors.availableServices?.message}
                fullWidth
                className="bg-white dark:bg-gray-700"
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
                label="Languages Spoken"
                placeholder="e.g., English, Mandarin, Cantonese"
                error={!!errors.languages}
                helperText={errors.languages?.message}
                fullWidth
                className="bg-white dark:bg-gray-700"
              />
            )}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <Controller
            name="helpedCount"
            control={control}
            render={({ field: { onChange, value, ...field } }) => (
              <TextField
                {...field}
                value={value || ""}
                onChange={(e) => onChange(parseInt(e.target.value) || 0)}
                label="Number of Travelers Helped"
                type="number"
                inputProps={{ min: 0, max: 100, step: 1 }}
                placeholder="0"
                error={!!errors.helpedCount}
                helperText={errors.helpedCount?.message}
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
          className="bg-green-600 hover:bg-green-700 min-w-[120px]"
        >
          Offer Help
        </Button>
      </Box>
    </Box>
  );
};

export default FlightCompanionOfferForm;
