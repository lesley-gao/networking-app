import { Page } from '@playwright/test';

/**
 * Payment helper functions for E2E tests
 */
export class PaymentHelper {
  constructor(private page: Page) {}

  /**
   * Process a payment using test card details
   */
  async processPayment(paymentData: {
    amount: number;
    cardNumber?: string;
    expiryMonth?: string;
    expiryYear?: string;
    cvc?: string;
    cardholderName?: string;
  }) {
    const testCard = {
      cardNumber: paymentData.cardNumber || '4242424242424242', // Stripe test card
      expiryMonth: paymentData.expiryMonth || '12',
      expiryYear: paymentData.expiryYear || '2025',
      cvc: paymentData.cvc || '123',
      cardholderName: paymentData.cardholderName || 'Test User'
    };

    // Wait for payment form to load
    await this.page.waitForSelector('[data-testid="payment-form"]', { timeout: 10000 });

    // Fill payment form
    await this.page.fill('[data-testid="card-number-input"]', testCard.cardNumber);
    await this.page.fill('[data-testid="expiry-month-input"]', testCard.expiryMonth);
    await this.page.fill('[data-testid="expiry-year-input"]', testCard.expiryYear);
    await this.page.fill('[data-testid="cvc-input"]', testCard.cvc);
    await this.page.fill('[data-testid="cardholder-name-input"]', testCard.cardholderName);

    // Verify amount
    const displayedAmount = await this.page.textContent('[data-testid="payment-amount"]');
    console.log(`Processing payment of ${displayedAmount} for amount ${paymentData.amount}`);

    // Submit payment
    await this.page.click('[data-testid="submit-payment-button"]');

    // Wait for payment processing
    await this.page.waitForSelector('[data-testid="payment-processing"]', { timeout: 5000 });

    // Wait for payment result
    await this.page.waitForSelector('[data-testid="payment-success"], [data-testid="payment-error"]', { timeout: 30000 });
  }

  /**
   * Verify payment success
   */
  async verifyPaymentSuccess(): Promise<boolean> {
    try {
      await this.page.waitForSelector('[data-testid="payment-success"]', { timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get payment error message
   */
  async getPaymentError(): Promise<string | null> {
    try {
      const errorElement = await this.page.waitForSelector('[data-testid="payment-error"]', { timeout: 5000 });
      return await errorElement.textContent();
    } catch {
      return null;
    }
  }

  /**
   * Navigate to payment history
   */
  async viewPaymentHistory() {
    await this.page.goto('/dashboard/payments');
    await this.page.waitForSelector('[data-testid="payment-history"]', { timeout: 10000 });
  }

  /**
   * Get payment details from history
   */
  async getPaymentFromHistory(paymentId: string) {
    await this.viewPaymentHistory();
    
    const paymentRow = this.page.locator(`[data-testid="payment-${paymentId}"]`);
    
    if (await paymentRow.count() === 0) {
      throw new Error(`Payment ${paymentId} not found in history`);
    }

    const amount = await paymentRow.locator('[data-testid="payment-amount"]').textContent();
    const status = await paymentRow.locator('[data-testid="payment-status"]').textContent();
    const date = await paymentRow.locator('[data-testid="payment-date"]').textContent();

    return { amount, status, date };
  }

  /**
   * Process refund (if applicable)
   */
  async processRefund(paymentId: string, reason?: string) {
    await this.viewPaymentHistory();
    
    const paymentRow = this.page.locator(`[data-testid="payment-${paymentId}"]`);
    await paymentRow.locator('[data-testid="refund-button"]').click();
    
    if (reason) {
      await this.page.fill('[data-testid="refund-reason-textarea"]', reason);
    }
    
    await this.page.click('[data-testid="confirm-refund-button"]');
    
    // Wait for refund confirmation
    await this.page.waitForSelector('[data-testid="refund-success"], [data-testid="refund-error"]', { timeout: 30000 });
  }

  /**
   * Verify escrow release for completed service
   */
  async verifyEscrowRelease(serviceId: string) {
    await this.page.goto(`/dashboard/services/${serviceId}`);
    
    // Check escrow status
    const escrowStatus = await this.page.locator('[data-testid="escrow-status"]').textContent();
    console.log(`Escrow status for service ${serviceId}: ${escrowStatus}`);
    
    return escrowStatus;
  }
}
