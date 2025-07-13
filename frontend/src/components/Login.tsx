import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button, TextField, Box, Typography, Snackbar, Alert } from '@mui/material';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { loginUser } from '../store/slices/authSlice';
import { selectAuthError, selectAuthLoading } from '../store/slices/authSelectors';
import { useNavigate } from 'react-router-dom';

const schema = z.object({
  email: z.string().email({ message: 'Invalid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
});

type LoginFormInputs = z.infer<typeof schema>;

const Login: React.FC = () => {
  const dispatch = useAppDispatch();
  const error = useAppSelector(selectAuthError);
  const isLoading = useAppSelector(selectAuthLoading);
  const navigate = useNavigate();
  const [snackbarOpen, setSnackbarOpen] = React.useState(false);
  const [apiError, setApiError] = React.useState<string | null>(null);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormInputs>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: LoginFormInputs) => {
    setApiError(null);
    setSnackbarOpen(false);
    const result = await dispatch(loginUser(data));
    // Redux Toolkit: result.type ends with '/fulfilled' or '/rejected'
    if (result?.type && result.type.endsWith('/fulfilled') && result?.payload?.token) {
      // Login already provides user data, no need to call getCurrentUser
      navigate('/flight-companion'); // Change to your desired route
    } else {
      // Show error from payload, selector, or fallback
      setApiError(result?.payload?.message || error || 'Login failed.');
      setSnackbarOpen(true);
    }
  }

  return (
    <>
      <Snackbar
        open={snackbarOpen && !!apiError}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="error" onClose={() => setSnackbarOpen(false)} sx={{ width: '100%' }}>
          {apiError}
        </Alert>
      </Snackbar>
      <Box maxWidth={400} mx="auto" mt={6} p={3} boxShadow={2} borderRadius={2} bgcolor="background.paper">
        <Typography variant="h5" mb={2}>Login</Typography>
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <TextField
            label="Email"
            fullWidth
            margin="normal"
            {...register('email')}
            error={!!errors.email}
            helperText={errors.email?.message}
          />
          <TextField
            label="Password"
            type="password"
            fullWidth
            margin="normal"
            {...register('password')}
            error={!!errors.password}
            helperText={errors.password?.message}
          />
          <Button type="submit" variant="contained" color="primary" fullWidth disabled={isLoading} sx={{ mt: 2 }}>
            {isLoading ? 'Logging in...' : 'Login'}
          </Button>
        </form>
      </Box>
    </>
)};

export default Login;