import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

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
  baseQuery: fetchBaseQuery({ baseUrl: '/api/payment/' }),
  endpoints: (builder) => ({
    getPaymentHistory: builder.query<Payment[], string>({
      query: (userId) => `history/${userId}`,
    }),
  }),
});

export const { useGetPaymentHistoryQuery } = paymentApi;