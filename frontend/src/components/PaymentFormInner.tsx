import React, { useState } from 'react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Button, CircularProgress, Box, Typography } from '@mui/material';
import Receipt from './Receipt';

export interface PaymentFormInnerProps {
  paymentIntentClientSecret: string;
  onPaymentSuccess?: () => void;
  onPaymentError?: (error: string) => void;
  isLoading?: boolean;
}

const PaymentFormInner: React.FC<PaymentFormInnerProps> = ({
  paymentIntentClientSecret,
  onPaymentSuccess,
  onPaymentError,
  isLoading = false,
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<any>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    if (!stripe || !elements) {
      setError('Stripe has not loaded yet.');
      setLoading(false);
      return;
    }
    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      setError('Card element not found.');
      setLoading(false);
      return;
    }
    const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(paymentIntentClientSecret, {
      payment_method: {
        card: cardElement,
      },
    });
    if (stripeError) {
      setError(stripeError.message || 'Payment failed.');
      onPaymentError?.(stripeError.message || 'Payment failed.');
    } else if (paymentIntent && paymentIntent.status === 'succeeded') {
      onPaymentSuccess?.();
    } else {
      setError('Payment was not successful.');
      onPaymentError?.('Payment was not successful.');
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md mx-auto p-4 bg-white dark:bg-gray-800 rounded shadow">
      <Typography variant="h6" className="mb-2">Payment Details</Typography>
      <Box className="border rounded p-2 bg-gray-50 dark:bg-gray-900">
        <CardElement options={{ hidePostalCode: true }} />
      </Box>
      {error && <Typography color="error">{error}</Typography>}
      <Button
        type="submit"
        variant="contained"
        color="primary"
        disabled={!stripe || loading || isLoading}
        className="w-full mt-2"
      >
        {(loading || isLoading) ? <CircularProgress size={24} /> : 'Pay Now'}
      </Button>
      {receipt && <Receipt receipt={receipt} />}
    </form>
  );
};

export default PaymentFormInner;