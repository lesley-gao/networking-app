import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { RootState } from './store';

export interface Payment {
  id: number;
  payerId: number;
  receiverId: number;
  requestId: number;
  requestType: string;
  amount: number;
  currency: string;
  status: string;
  stripePaymentIntentId?: string;
  escrowReleaseDate?: string;
  platformFeeAmount: number;
  createdAt: string;
  completedAt?: string;
  escrowId?: number;
}

export const paymentApi = createApi({
  reducerPath: 'paymentApi',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api/payment/',
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.token;
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  endpoints: (builder) => ({
    getPaymentHistory: builder.query<Payment[], void>({
      query: () => 'history',
    }),
  }),
});

export const { useGetPaymentHistoryQuery } = paymentApi;