import React from 'react';
import { useGetPaymentHistoryQuery } from '../store/paymentApi';

interface PaymentHistoryProps {}

const PaymentHistory: React.FC<PaymentHistoryProps> = () => {
  // Query will use the JWT token to get the current user's payment history
  const { data, error, isLoading } = useGetPaymentHistoryQuery();

  if (isLoading) return <div>Loading payment history...</div>;
  if (error) {
    console.error('Payment history error:', error);
    // Log detailed error information for debugging
    if ('status' in error) {
      console.error('Error status:', error.status);
      console.error('Error data:', error.data);
    }
    return <div>Error loading payment history. Check console for details.</div>;
  }
  if (!data || data.length === 0) return <div>No payment history found.</div>;

  try {
    return (
      <div className="bg-white p-4 rounded shadow">
        <h2 className="text-lg font-bold mb-2">Payment History</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm border-collapse border border-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="border border-gray-200 px-4 py-2 text-left">Date</th>
                <th className="border border-gray-200 px-4 py-2 text-left">Type</th>
                <th className="border border-gray-200 px-4 py-2 text-left">Amount</th>
                <th className="border border-gray-200 px-4 py-2 text-left">Status</th>
                <th className="border border-gray-200 px-4 py-2 text-left">Receipt</th>
              </tr>
            </thead>
            <tbody>
              {data.map((payment) => (
                <tr key={payment.id} className="hover:bg-gray-50">
                  <td className="border border-gray-200 px-4 py-2">
                    {payment.createdAt ? new Date(payment.createdAt).toLocaleString() : '-'}
                  </td>
                  <td className="border border-gray-200 px-4 py-2">
                    {payment.requestType || '-'}
                  </td>
                  <td className="border border-gray-200 px-4 py-2">
                    {payment.amount ? `${payment.amount} ${payment.currency || 'NZD'}` : '-'}
                  </td>
                  <td className="border border-gray-200 px-4 py-2">
                    {payment.status || '-'}
                  </td>
                  <td className="border border-gray-200 px-4 py-2">
                    {payment.stripePaymentIntentId ? (
                      <a
                        href={`/api/payment/receipt/${payment.stripePaymentIntentId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 underline hover:text-blue-800"
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
      </div>
    );
  } catch (error) {
    console.error('Error rendering PaymentHistory:', error);
    return (
      <div className="bg-red-50 border border-red-200 p-4 rounded">
        <h2 className="text-lg font-bold mb-2 text-red-800">Payment History</h2>
        <p className="text-red-600">Unable to display payment history. Please try again later.</p>
      </div>
    );
  }
};

export default PaymentHistory;