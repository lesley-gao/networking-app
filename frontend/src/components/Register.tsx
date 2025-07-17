import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Button,
  TextField,
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Snackbar,
  Alert,
  Grid,
} from "@mui/material";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { loginUser } from "../store/slices/authSlice";
import {
  selectAuthError,
  selectAuthLoading,
} from "../store/slices/authSelectors";
import { useTranslation } from "react-i18next";

const Register: React.FC = () => {
  const { t } = useTranslation();
  const [apiError, setApiError] = React.useState<string | null>(null);
  const [snackbarOpen, setSnackbarOpen] = React.useState(false);
  // Refactor schema to use t() for validation messages
  const schema = React.useMemo(
    () =>
      z
        .object({
          firstName: z
            .string()
            .min(2, { message: t("validation.firstNameRequired") }),
          lastName: z
            .string()
            .min(2, { message: t("validation.lastNameRequired") }),
          email: z.string().email({ message: t("validation.invalidEmail") }),
          password: z.string().min(6, { message: t("validation.passwordMin") }),
          confirmPassword: z.string(),
          phoneNumber: z.string().optional(),
          preferredLanguage: z.string().optional(),
          emergencyContact: z.string().optional(),
          emergencyPhone: z.string().optional(),
        })
        .refine((data) => data.password === data.confirmPassword, {
          message: t("validation.passwordsDontMatch"),
          path: ["confirmPassword"],
        }),
    [t]
  );
  type RegisterFormInputs = z.infer<typeof schema>;

  const dispatch = useAppDispatch();
  const error = useAppSelector(selectAuthError);
  const isLoading = useAppSelector(selectAuthLoading);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormInputs>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: RegisterFormInputs) => {
    setApiError(null);
    setSnackbarOpen(false);
    const response = await fetch("/api/User/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
        phoneNumber: data.phoneNumber || null,
        preferredLanguage: data.preferredLanguage || null,
        emergencyContact: data.emergencyContact || null,
        emergencyPhone: data.emergencyPhone || null,
      }),
    });
    if (response.ok) {
      await dispatch(loginUser({ email: data.email, password: data.password }));
    } else {
      // Always show backend top-level message
      let errorMsg = "Registration failed.";
      try {
        const errorData = await response.json();
        console.error("Registration error:", errorMsg, errorData);
        if (errorData?.Message) {
          errorMsg = errorData.Message;
        } else if (errorData?.message) {
          errorMsg = errorData.message;
        } else if (errorData?.error?.message) {
          errorMsg = errorData.error.message;
        }

        if (errorData?.error?.validationErrors) {
          const valErrs = errorData.error.validationErrors;
          const firstKey = Object.keys(valErrs)[0];
          if (
            Array.isArray(valErrs[firstKey]) &&
            valErrs[firstKey].length > 0
          ) {
            errorMsg = valErrs[firstKey][0];
          }
        }
      } catch {
        // Ignore JSON parse errors from backend response
      }

      setApiError(errorMsg);
      setSnackbarOpen(true);
    }
  };

  return (
    <>
      <Snackbar
        open={snackbarOpen && !!apiError}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          severity="error"
          onClose={() => setSnackbarOpen(false)}
          sx={{ width: "100%" }}
        >
          {apiError}
        </Alert>
      </Snackbar>
      
      <Box
        maxWidth={800}
        mx="auto"
        my={6}
        p={6}
        boxShadow={2}
        borderRadius={2}
        bgcolor="background.paper"
      >
        <Typography variant="h5" mb={2} align="center">
          {t("registerTitle")}
        </Typography>
        {error && (
          <Typography color="error" mb={2}>
            {t(error)}
          </Typography>
        )}

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <Grid container spacing={1}>
            <Grid item xs={12} md={6}>
              <TextField
                label={t("firstName") + " *"}
                fullWidth
                margin="normal"
                placeholder="Maximum 50 characters"
                {...register("firstName")}
                error={!!errors.firstName}
                FormHelperTextProps={{
                  sx: { color: errors.firstName ? "error.main" : "info.main" },
                }}
                helperText={errors.firstName?.message || "Maximum 50 characters"}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label={t("lastName") + " *"}
                fullWidth
                margin="normal"
                placeholder="Maximum 50 characters"
                {...register("lastName")}
                error={!!errors.lastName}
                FormHelperTextProps={{
                  sx: { color: errors.lastName ? "error.main" : "info.main" },
                }}
                helperText={errors.lastName?.message || "Maximum 50 characters"}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label={t("email") + " *"}
                fullWidth
                margin="normal"
                placeholder="Enter a valid email address"
                {...register("email")}
                error={!!errors.email}
                FormHelperTextProps={{
                  sx: { color: errors.email ? "error.main" : "info.main" },
                }}
                helperText={errors.email?.message || "Enter a valid email address"}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label={t("password") + " *"}
                type="password"
                fullWidth
                margin="normal"
                placeholder="Minimum 6 characters, must include letters and at least one number or symbol"
                {...register("password")}
                error={!!errors.password}
                FormHelperTextProps={{
                  sx: { color: errors.password ? "error.main" : "info.main" },
                }}
                helperText={
                  errors.password?.message ||
                  "Minimum 6 characters, must include letters and at least one number or symbol"
                }
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label={t("confirmPassword") + " *"}
                type="password"
                fullWidth
                margin="normal"
                placeholder="Re-enter your password"
                {...register("confirmPassword")}
                error={!!errors.confirmPassword}
                FormHelperTextProps={{
                  sx: {
                    color: errors.confirmPassword ? "error.main" : "info.main",
                  },
                }}
                helperText={
                  errors.confirmPassword?.message || "Re-enter your password"
                }
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label={t("phoneNumber") + " (" + t("optional", "optional") + ")"}
                fullWidth
                margin="normal"
                placeholder="Optional. Enter a valid phone number"
                {...register("phoneNumber")}
                error={!!errors.phoneNumber}
                FormHelperTextProps={{
                  sx: { color: errors.phoneNumber ? "error.main" : "info.main" },
                }}
                helperText={
                  errors.phoneNumber?.message ||
                  "Optional. Enter a valid phone number"
                }
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth margin="normal">
                <InputLabel id="preferred-language-label">
                  Preferred Language (optional)
                </InputLabel>
                <Select
                  labelId="preferred-language-label"
                  id="preferredLanguage"
                  defaultValue=""
                  {...register("preferredLanguage")}
                  label="Preferred Language (optional)"
                  sx={{ textAlign: "left" }}
                  error={!!errors.preferredLanguage}
                >
                  <MenuItem value="">None</MenuItem>
                  <MenuItem value="English">English</MenuItem>
                  <MenuItem value="Chinese">Chinese</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label={
                  t("emergencyContact") + " (" + t("optional", "optional") + ")"
                }
                fullWidth
                margin="normal"
                placeholder="Optional. Maximum 100 characters"
                {...register("emergencyContact")}
                error={!!errors.emergencyContact}
                FormHelperTextProps={{
                  sx: {
                    color: errors.emergencyContact ? "error.main" : "info.main",
                  },
                }}
                helperText={
                  errors.emergencyContact?.message ||
                  "Optional. Maximum 100 characters"
                }
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label={t("emergencyPhone") + " (" + t("optional", "optional") + ")"}
                fullWidth
                margin="normal"
                placeholder="Optional. Enter a valid phone number"
                {...register("emergencyPhone")}
                error={!!errors.emergencyPhone}
                FormHelperTextProps={{
                  sx: { color: errors.emergencyPhone ? "error.main" : "info.main" },
                }}
                helperText={
                  errors.emergencyPhone?.message ||
                  "Optional. Enter a valid phone number"
                }
              />
            </Grid>
            <Grid item xs={12}>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                fullWidth
                disabled={isLoading}
                sx={{ mt: 2, padding: 2, fontSize: 16, fontWeight: "bold" }}
              >
                {isLoading ? t("registering", "Registering...") : t("register")}
              </Button>
            </Grid>
          </Grid>
        </form>
      </Box>
    </>
  );
};

export default Register;
