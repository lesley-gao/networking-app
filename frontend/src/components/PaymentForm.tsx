import React, { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import { Button, CircularProgress, Box, Typography } from '@mui/material';
import Receipt from './Receipt';

// TODO: Replace with your actual Stripe publishable key (use env variable in production)
const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY || 'pk_test_12345');

interface PaymentFormProps {
  paymentIntentClientSecret: string;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

const PaymentFormInner: React.FC<PaymentFormProps> = ({ paymentIntentClientSecret, onSuccess, onError }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [receipt, setReceipt] = useState(null);

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
      onError?.(stripeError.message || 'Payment failed.');
    } else if (paymentIntent && paymentIntent.status === 'succeeded') {
      onSuccess?.();
    } else {
      setError('Payment was not successful.');
      onError?.('Payment was not successful.');
    }
    setLoading(false);
  };

  const confirmPayment = async () => {
    const res = await fetch('/api/payment/confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paymentIntentId: '', userId: '' }), // TODO: Pass actual paymentIntentId and userId
    });
    if (res.ok) {
      const data = await res.json();
      setReceipt(data);
    } else {
      // handle error
    }
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
        disabled={!stripe || loading}
        className="w-full mt-2"
      >
        {loading ? <CircularProgress size={24} /> : 'Pay Now'}
      </Button>
      {receipt && <Receipt receipt={receipt} />}
    </form>
  );
};

const PaymentForm: React.FC<PaymentFormProps> = (props) => (
  <Elements stripe={stripePromise} options={{ clientSecret: props.paymentIntentClientSecret }}>
    <PaymentFormInner {...props} />
  </Elements>
);

export default PaymentForm;