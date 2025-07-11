import Receipt from './Receipt';
import { Meta, StoryObj } from '@storybook/react';
import { within, userEvent } from '@storybook/testing-library';
import { expect } from '@storybook/jest';

const meta: Meta<typeof Receipt> = {
  title: 'Components/Receipt',
  component: Receipt,
};
export default meta;

type Story = StoryObj<typeof Receipt>;

export const Default: Story = {
  args: {
    receipt: {
      receiptId: 'rcpt_123',
      paymentIntentId: 'pi_123',
      userEmail: 'alice@example.com',
      amount: 100,
      currency: 'NZD',
      paidAt: '2025-07-10T12:00:00Z',
      serviceType: 'Airport Pickup',
      pdfUrl: undefined,
    },
  },
};

export const Paid: Story = {
  args: {
    receipt: {
      receiptId: 'rcpt_456',
      paymentIntentId: 'pi_456',
      userEmail: 'charlie@example.com',
      amount: 200,
      currency: 'NZD',
      paidAt: '2025-07-10T15:00:00Z',
      serviceType: 'Flight Companion',
      pdfUrl: undefined,
    },
  },
};

export const WithPdfDownload: Story = {
  args: {
    receipt: {
      receiptId: 'rcpt_789',
      paymentIntentId: 'pi_789',
      userEmail: 'bob@example.com',
      amount: 150,
      currency: 'NZD',
      paidAt: '2025-07-09T10:30:00Z',
      serviceType: 'Airport Pickup',
      pdfUrl: 'https://example.com/receipt.pdf',
    },
  },
  play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
    const canvas = within(canvasElement);

    // Check if receipt details are displayed
    await expect(canvas.getByText(/Airport Pickup/)).toBeInTheDocument();
    await expect(canvas.getByText(/150 NZD/)).toBeInTheDocument();

    // Find the PDF download link
    const pdfLink = canvas.getByText('Download PDF');
    await expect(pdfLink).toHaveAttribute('href', 'https://example.com/receipt.pdf');
    await expect(pdfLink).toHaveAttribute('target', '_blank');

    // Simulate clicking the download link
    // Note: In Storybook, the actual navigation won't happen
    await userEvent.click(pdfLink);
  },
};
