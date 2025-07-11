import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button, TextField, Box, Typography } from '@mui/material';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { loginUser } from '../store/slices/authSlice';
import { selectAuthError, selectAuthLoading } from '../store/slices/authSelectors';

const schema = z.object({
  email: z.string().email({ message: 'Invalid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
});

type LoginFormInputs = z.infer<typeof schema>;

const Login: React.FC = () => {
  const dispatch = useAppDispatch();
  const error = useAppSelector(selectAuthError);
  const isLoading = useAppSelector(selectAuthLoading);
  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormInputs>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: LoginFormInputs) => {
    await dispatch(loginUser(data));
  };

  return (
    <Box maxWidth={400} mx="auto" mt={6} p={3} boxShadow={2} borderRadius={2} bgcolor="background.paper">
      <Typography variant="h5" mb={2}>Login</Typography>
      {error && <Typography color="error" mb={2}>{error}</Typography>}
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
  );
};

export default Login;