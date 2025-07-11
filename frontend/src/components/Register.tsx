import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button, TextField, Box, Typography } from '@mui/material';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { loginUser } from '../store/slices/authSlice';
import { selectAuthError, selectAuthLoading } from '../store/slices/authSelectors';
import { useTranslation } from 'react-i18next';

const Register: React.FC = () => {
  const { t } = useTranslation();
  // Refactor schema to use t() for validation messages
  const schema = React.useMemo(() => z.object({
    fullName: z.string().min(2, { message: t('validation.fullNameRequired') }),
    email: z.string().email({ message: t('validation.invalidEmail') }),
    password: z.string().min(6, { message: t('validation.passwordMin') }),
    confirmPassword: z.string(),
  }).refine((data) => data.password === data.confirmPassword, {
    message: t('validation.passwordsDontMatch'),
    path: ["confirmPassword"],
  }), [t]);
  type RegisterFormInputs = z.infer<typeof schema>;

  const dispatch = useAppDispatch();
  const error = useAppSelector(selectAuthError);
  const isLoading = useAppSelector(selectAuthLoading);
  const { register, handleSubmit, formState: { errors } } = useForm<RegisterFormInputs>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: RegisterFormInputs) => {
    // Call registration API
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: data.email,
        password: data.password,
        confirmPassword: data.confirmPassword,
        fullName: data.fullName,
      }),
    });
    if (response.ok) {
      // Optionally auto-login after registration
      await dispatch(loginUser({ email: data.email, password: data.password }));
    } else {
      // Optionally handle registration error
      // You could dispatch an error to Redux or show a local error
    }
  };

  return (
    <Box maxWidth={400} mx="auto" mt={6} p={3} boxShadow={2} borderRadius={2} bgcolor="background.paper">
      <Typography variant="h5" mb={2}>{t('registerTitle')}</Typography>
      {error && <Typography color="error" mb={2}>{t(error)}</Typography>}
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <TextField
          label={t('fullName')}
          fullWidth
          margin="normal"
          {...register('fullName')}
          error={!!errors.fullName}
          helperText={errors.fullName?.message}
        />
        <TextField
          label={t('email')}
          fullWidth
          margin="normal"
          {...register('email')}
          error={!!errors.email}
          helperText={errors.email?.message}
        />
        <TextField
          label={t('password')}
          type="password"
          fullWidth
          margin="normal"
          {...register('password')}
          error={!!errors.password}
          helperText={errors.password?.message}
        />
        <TextField
          label={t('confirmPassword')}
          type="password"
          fullWidth
          margin="normal"
          {...register('confirmPassword')}
          error={!!errors.confirmPassword}
          helperText={errors.confirmPassword?.message}
        />
        <Button type="submit" variant="contained" color="primary" fullWidth disabled={isLoading} sx={{ mt: 2 }}>
          {isLoading ? t('registering', 'Registering...') : t('register')}
        </Button>
      </form>
    </Box>
  );
};

export default Register;
