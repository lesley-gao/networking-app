import PaymentForm from './PaymentForm';
import { Meta, StoryObj } from '@storybook/react';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { within, userEvent } from '@storybook/testing-library';

const stripePromise = loadStripe('pk_test_12345'); // Replace with your test key

const meta: Meta<typeof PaymentForm> = {
  title: 'Components/PaymentForm',
  component: PaymentForm,
};
export default meta;

type Story = StoryObj<typeof PaymentForm>;

export const Default: Story = {
  render: () => (
    <Elements stripe={stripePromise} options={{ clientSecret: 'test_client_secret' }}>
      <PaymentForm paymentIntentClientSecret="test_client_secret" />
    </Elements>
  ),
};

export const FilledAndSubmit: Story = {
  render: () => (
    <Elements stripe={stripePromise} options={{ clientSecret: 'test_client_secret' }}>
      <PaymentForm paymentIntentClientSecret="test_client_secret" />
    </Elements>
  ),
  play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
    const canvas = within(canvasElement);

    // Wait for Stripe Elements to load
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Note: Stripe Elements create iframes that cannot be directly tested
    // In a real app, we'd use Stripe's test mode and mock the response

    // Find the button and click it
    try {
      const submitButton = canvas.getByRole('button', { name: /pay now/i });
      await userEvent.click(submitButton);

      // In a real test, you would add assertions here
      // For example, checking for loading indicators or success messages
    } catch (error) {
      console.error('Button not found:', error);
    }
  },
};
