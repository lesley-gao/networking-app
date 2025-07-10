import { test, expect } from './fixtures/test-fixtures';

/**
 * Payment and Booking End-to-End Tests
 * Tests payment processing, escrow, and transaction workflows
 */
test.describe('Payment and Booking Workflows', () => {
  test.beforeEach(async ({ page, authHelper }) => {
    // Login before each test
    await authHelper.login('test.user1@example.com', 'TestPassword123!');
    await expect(page).toHaveURL(/dashboard/);
  });

  test('Payment Processing with Test Card', async ({ page, paymentHelper, testUtils }) => {
    // Navigate to a service that requires payment
    await page.goto('/flight-companion/1/book'); // Assuming there's a booking page
    
    // Wait for payment form to load
    await testUtils.waitForElement('[data-testid="payment-form"]', 10000);
    
    // Process payment with test card
    await paymentHelper.processPayment({
      amount: 150,
      cardNumber: '4242424242424242', // Stripe test card
      expiryMonth: '12',
      expiryYear: '2025',
      cvc: '123',
      cardholderName: 'Test User'
    });

    // Verify payment success
    const paymentSuccess = await paymentHelper.verifyPaymentSuccess();
    expect(paymentSuccess).toBe(true);

    // Verify success message
    await testUtils.waitForElement('[data-testid="payment-success"]');
    const successNotification = await testUtils.verifyNotification('Payment processed successfully');
    expect(successNotification).toBe(true);
  });

  test('Payment Processing with Invalid Card', async ({ page, paymentHelper, testUtils }) => {
    await page.goto('/flight-companion/1/book');
    await testUtils.waitForElement('[data-testid="payment-form"]', 10000);
    
    // Process payment with invalid test card
    await paymentHelper.processPayment({
      amount: 150,
      cardNumber: '4000000000000002', // Stripe card that will be declined
      expiryMonth: '12',
      expiryYear: '2025',
      cvc: '123',
      cardholderName: 'Test User'
    });

    // Verify payment failure
    const paymentSuccess = await paymentHelper.verifyPaymentSuccess();
    expect(paymentSuccess).toBe(false);

    // Verify error message
    const errorMessage = await paymentHelper.getPaymentError();
    expect(errorMessage).toContain('declined');
  });

  test('View Payment History', async ({ page, paymentHelper, testUtils }) => {
    // Navigate to payment history
    await paymentHelper.viewPaymentHistory();

    // Verify payment history page loads
    await testUtils.waitForElement('[data-testid="payment-history"]');
    
    // Check if payment records are displayed
    const paymentRecords = page.locator('[data-testid^="payment-"]');
    const recordCount = await paymentRecords.count();
    console.log(`Found ${recordCount} payment records`);

    // If there are payments, verify the first one has required information
    if (recordCount > 0) {
      const firstPayment = paymentRecords.first();
      await expect(firstPayment.locator('[data-testid="payment-amount"]')).toBeVisible();
      await expect(firstPayment.locator('[data-testid="payment-status"]')).toBeVisible();
      await expect(firstPayment.locator('[data-testid="payment-date"]')).toBeVisible();
    }
  });

  test('Escrow Release Workflow', async ({ page, paymentHelper, testUtils }) => {
    // Navigate to a completed service
    await page.goto('/dashboard/services');
    await testUtils.waitForElement('[data-testid="services-list"]');

    // Look for completed services
    const completedServices = page.locator('[data-testid^="service-"][data-status="completed"]');
    const serviceCount = await completedServices.count();

    if (serviceCount > 0) {
      // Click on the first completed service
      const firstService = completedServices.first();
      await firstService.click();

      // Get service ID
      const serviceId = await firstService.getAttribute('data-service-id') || 'test-service-1';

      // Verify escrow status
      const escrowStatus = await paymentHelper.verifyEscrowRelease(serviceId);
      expect(escrowStatus).toContain('released');
    } else {
      console.log('No completed services found for escrow test');
    }
  });

  test('Payment Refund Process', async ({ page, paymentHelper, testUtils }) => {
    await paymentHelper.viewPaymentHistory();
    await testUtils.waitForElement('[data-testid="payment-history"]');

    // Look for payments that can be refunded
    const refundablePayments = page.locator('[data-testid^="payment-"]:has([data-testid="refund-button"])');
    const refundableCount = await refundablePayments.count();

    if (refundableCount > 0) {
      // Get the first refundable payment ID
      const firstPayment = refundablePayments.first();
      const paymentTestId = await firstPayment.getAttribute('data-testid');
      const paymentId = paymentTestId?.replace('payment-', '') || 'test-payment-1';

      // Process refund
      await paymentHelper.processRefund(paymentId, 'Service was cancelled due to flight change');

      // Verify refund success
      await testUtils.waitForElement('[data-testid="refund-success"], [data-testid="refund-error"]');
      const refundSuccess = await page.locator('[data-testid="refund-success"]').isVisible();
      
      if (refundSuccess) {
        const successNotification = await testUtils.verifyNotification('Refund processed successfully');
        expect(successNotification).toBe(true);
      }
    } else {
      console.log('No refundable payments found');
    }
  });

  test('Payment Form Validation', async ({ page, testUtils }) => {
    await page.goto('/flight-companion/1/book');
    await testUtils.waitForElement('[data-testid="payment-form"]');

    // Try to submit without filling required fields
    await page.click('[data-testid="submit-payment-button"]');

    // Verify validation errors appear
    await testUtils.waitForElement('[data-testid="validation-errors"]');
    
    const validationErrors = page.locator('[data-testid="validation-errors"] .error-message');
    const errorCount = await validationErrors.count();
    expect(errorCount).toBeGreaterThan(0);

    // Verify specific field errors
    await expect(page.locator('[data-testid="card-number-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="expiry-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="cvc-error"]')).toBeVisible();
  });

  test('Payment Amount Verification', async ({ page, testUtils }) => {
    await page.goto('/flight-companion/1/book');
    await testUtils.waitForElement('[data-testid="payment-form"]');

    // Verify payment amount is displayed correctly
    const paymentAmount = page.locator('[data-testid="payment-amount"]');
    await expect(paymentAmount).toBeVisible();
    
    const amountText = await paymentAmount.textContent();
    expect(amountText).toMatch(/\$\d+(\.\d{2})?/); // Should match currency format

    // Verify breakdown if available
    const breakdown = page.locator('[data-testid="payment-breakdown"]');
    if (await breakdown.isVisible()) {
      await expect(breakdown.locator('[data-testid="service-fee"]')).toBeVisible();
      await expect(breakdown.locator('[data-testid="total-amount"]')).toBeVisible();
    }
  });
});
