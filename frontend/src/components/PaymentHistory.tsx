import React from 'react';
import { useGetPaymentHistoryQuery } from '../store/paymentApi';

interface PaymentHistoryProps {
  userId: string;
}

const PaymentHistory: React.FC<PaymentHistoryProps> = ({ userId }) => {
  const { data, error, isLoading } = useGetPaymentHistoryQuery(userId);

  if (isLoading) return <div>Loading payment history...</div>;
  if (error) return <div>Error loading payment history.</div>;
  if (!data || data.length === 0) return <div>No payment history found.</div>;

  return (
    <div className="bg-white p-4 rounded shadow">
      <h2 className="text-lg font-bold mb-2">Payment History</h2>
      <table className="min-w-full text-sm">
        <thead>
          <tr>
            <th>Date</th>
            <th>Type</th>
            <th>Amount</th>
            <th>Status</th>
            <th>Receipt</th>
          </tr>
        </thead>
        <tbody>
          {data.map((payment) => (
            <tr key={payment.id}>
              <td>{new Date(payment.createdAt).toLocaleString()}</td>
              <td>{payment.requestType}</td>
              <td>
                {payment.amount} {payment.currency}
              </td>
              <td>{payment.status}</td>
              <td>
                {payment.stripePaymentIntentId ? (
                  <a
                    href={`/api/payment/receipt/${payment.stripePaymentIntentId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 underline"
                  >
                    View Receipt
                  </a>
                ) : (
                  '-'
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default PaymentHistory;