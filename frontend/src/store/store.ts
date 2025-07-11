import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import authSlice from './slices/authSlice';
import flightCompanionSlice from './slices/flightCompanionSlice';
import pickupSlice from './slices/pickupSlice';
import uiSlice from './slices/uiSlice';
import { baseApi } from './api/baseApi';

export const store = configureStore({
  reducer: {
    auth: authSlice,
    flightCompanion: flightCompanionSlice,
    pickup: pickupSlice,
    ui: uiSlice,
    [baseApi.reducerPath]: baseApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    })
    .concat(baseApi.middleware),
  devTools: process.env.NODE_ENV !== 'production',
});

// Enable listener behavior for the store
setupListeners(store.dispatch);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;