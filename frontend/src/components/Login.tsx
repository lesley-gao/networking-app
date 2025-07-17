import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Button,
  TextField,
  Box,
  Typography,
  Snackbar,
  Alert,
} from "@mui/material";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { loginUser } from "../store/slices/authSlice";
import {
  selectAuthError,
  selectAuthLoading,
} from "../store/slices/authSelectors";
import { useNavigate } from "react-router-dom";

const schema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  password: z
    .string()
    .min(6, { message: "Password must be at least 6 characters" }),
});

type LoginFormInputs = z.infer<typeof schema>;

const Login: React.FC = () => {
  const dispatch = useAppDispatch();
  const error = useAppSelector(selectAuthError);
  const isLoading = useAppSelector(selectAuthLoading);
  const navigate = useNavigate();
  const [snackbarOpen, setSnackbarOpen] = React.useState(false);
  const [apiError, setApiError] = React.useState<string | null>(null);

  const savedEmail = localStorage.getItem("savedEmail") || "";
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<LoginFormInputs>({
    resolver: zodResolver(schema),
    defaultValues: { email: savedEmail },
  });

  // Watch email field and update localStorage on change
  React.useEffect(() => {
    const subscription = watch((value) => {
      if (value.email !== undefined) {
        localStorage.setItem("savedEmail", value.email);
      }
    });
    return () => subscription.unsubscribe();
  }, [watch]);

  const onSubmit = async (data: LoginFormInputs) => {
    setApiError(null);
    setSnackbarOpen(false);
    // Save email to localStorage on submit (in case browser autofill bypasses watch)
    localStorage.setItem("savedEmail", data.email);
    const result = await dispatch(loginUser(data));
    if (
      result?.type &&
      result.type.endsWith("/fulfilled") &&
      result?.payload?.token
    ) {
      navigate("/flight-companion");
    } else {
      setApiError(result?.payload?.message || error || "Login failed.");
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
        maxWidth={400}
        mx="auto"
        my={20}
        p={3}
        boxShadow={2}
        borderRadius={2}
        bgcolor="background.paper"
      >
        <Typography variant="h5" mb={2}>
          Login
        </Typography>
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <TextField
            label="Email"
            fullWidth
            margin="normal"
            {...register("email")}
            error={!!errors.email}
            helperText={errors.email?.message}
          />
          <TextField
            label="Password"
            type="password"
            fullWidth
            margin="normal"
            {...register("password")}
            error={!!errors.password}
            helperText={errors.password?.message}
          />
          <Button
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
            disabled={isLoading}
            sx={{ mt: 2, padding: 2, fontSize: 16, fontWeight: "bold" }}
          >
            {isLoading ? "Logging in..." : "Login"}
          </Button>
        </form>
      </Box>
    </>
  );
};

export default Login;
