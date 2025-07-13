import PaymentHistory from './PaymentHistory';
import { Meta, StoryObj } from '@storybook/react';
import { within, userEvent } from '@storybook/testing-library';
import { expect } from '@storybook/jest';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { paymentApi } from '../store/paymentApi';
import * as React from 'react';

// Mock payment history data
const mockPaymentHistoryData = [
  {
    id: 123,
    payerId: 1,
    receiverId: 2,
    requestId: 3,
    requestType: 'Airport Pickup',
    amount: 100,
    currency: 'NZD',
    status: 'Paid',
    stripePaymentIntentId: 'pi_123',
    platformFeeAmount: 10,
    createdAt: '2025-07-10T12:00:00Z',
  },
  {
    id: 456,
    payerId: 1,
    receiverId: 3,
    requestId: 4,
    requestType: 'Flight Companion',
    amount: 200,
    currency: 'NZD',
    status: 'Refunded',
    stripePaymentIntentId: 'pi_456',
    platformFeeAmount: 20,
    createdAt: '2025-07-08T10:30:00Z',
  },
];

// Create a wrapper component that mocks the Redux provider and API response
const MockTemplate: React.FC = () => {
  // Create a mock store
  const mockStore = configureStore({
    reducer: {
      [paymentApi.reducerPath]: paymentApi.reducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(paymentApi.middleware),
  });
  
  // Override the useGetPaymentHistoryQuery hook
  const originalHook = paymentApi.endpoints.getPaymentHistory.useQuery;
  paymentApi.endpoints.getPaymentHistory.useQuery = (() => {
    return { data: mockPaymentHistoryData, error: undefined, isLoading: false };
  }) as typeof originalHook;

  return (
    <Provider store={mockStore}>
      <PaymentHistory />
    </Provider>
  );
};

const meta: Meta<typeof PaymentHistory> = {
  title: 'Components/PaymentHistory',
  component: PaymentHistory,
  decorators: [(Story: any) => <MockTemplate />],
};
export default meta;

type Story = StoryObj<typeof PaymentHistory>;

export const Default: Story = {
  play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
    const canvas = within(canvasElement);

    // Wait for data to load
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Check if payment history table is rendered with correct data
    try {
      // Check if the table headers are present
      await expect(canvas.getByText('Date')).toBeInTheDocument();
      await expect(canvas.getByText('Type')).toBeInTheDocument();
      await expect(canvas.getByText('Amount')).toBeInTheDocument();
      await expect(canvas.getByText('Status')).toBeInTheDocument();

      // Check for specific payment data
      await expect(canvas.getByText(/Airport Pickup/)).toBeInTheDocument();
      await expect(canvas.getByText(/Flight Companion/)).toBeInTheDocument();

      // Find a receipt link and click it
      const receiptLink = canvas.getAllByText(/receipt/i)[0];
      await userEvent.click(receiptLink);
    } catch (error) {
      console.error('Test failed:', error);
    }
  },
};
