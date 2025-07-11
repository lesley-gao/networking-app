import { configureStore } from '@reduxjs/toolkit';
import { paymentApi } from './paymentApi';
// ...other imports

export const store = configureStore({
  reducer: {
    // ...other reducers
    [paymentApi.reducerPath]: paymentApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(paymentApi.middleware),
});