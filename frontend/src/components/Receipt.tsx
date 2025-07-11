import React from "react";

interface ReceiptProps {
  receipt: {
    receiptId: string;
    paymentIntentId: string;
    userEmail: string;
    amount: number;
    currency: string;
    paidAt: string;
    serviceType: string;
    pdfUrl?: string;
  };
}

const Receipt: React.FC<ReceiptProps> = ({ receipt }) => (
  <div className="bg-white p-4 rounded shadow">
    <h2 className="text-lg font-bold mb-2">Payment Receipt</h2>
    <div>Receipt ID: {receipt.receiptId}</div>
    <div>
      Amount: {receipt.amount} {receipt.currency}
    </div>
    <div>Paid At: {new Date(receipt.paidAt).toLocaleString()}</div>
    <div>Service: {receipt.serviceType}</div>
    <div>
      {receipt.pdfUrl ? (
        <a
          href={receipt.pdfUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 underline"
        >
          Download PDF
        </a>
      ) : (
        <span>Receipt sent to your email: {receipt.userEmail}</span>
      )}
    </div>
  </div>
);

export default Receipt;