import PaymentFormInner from './PaymentFormInner';
import { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof PaymentFormInner> = {
  title: 'Components/PaymentFormInner',
  component: PaymentFormInner,
};
export default meta;

type Story = StoryObj<typeof PaymentFormInner>;

export const Default: Story = {
  args: {
    onPaymentSuccess: () => alert('Payment Success!'),
    onPaymentError: () => alert('Payment Error!'),
    isLoading: false,
  },
};

export const Loading: Story = {
  args: {
    onPaymentSuccess: () => {},
    onPaymentError: () => {},
    isLoading: true,
  },
};
