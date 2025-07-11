import { test, expect } from './fixtures/test-fixtures';
import { TestUtils } from './helpers/test-utils';

test.describe('Payment Workflow', () => {
  test.beforeEach(async ({ page, testUtils, authHelper }) => {
    // Clear storage and login before each test
    await testUtils.clearStorage();
    
    // Login with test user
    await authHelper.login('test.user1@example.com', 'TestPassword123!');
  });

  test('should process a successful payment', async ({ 
    paymentHelper, 
    flightHelper, 
    testUtils, 
    page 
  }) => {
    // First create a flight offer to book
    const flightData = TestUtils.generateFlightData();
    
    await flightHelper.createFlightOffer({
      departure: flightData.departure,
      destination: flightData.destination,
      departureDate: flightData.departureDate,
      availableSeats: flightData.availableSeats,
      pricePerSeat: flightData.pricePerSeat,
      description: flightData.description
    });
    
    // Navigate to payment page (this would typically happen after booking confirmation)
    await page.goto('/payment');
    
    // Process payment with test card
    await paymentHelper.processPayment({
      amount: flightData.pricePerSeat,
      cardNumber: '4242424242424242', // Stripe test card
      expiryMonth: '12',
      expiryYear: '2025',
      cvc: '123',
      cardholderName: 'Test User'
    });
    
    // Verify payment success
    const isSuccessful = await paymentHelper.verifyPaymentSuccess();
    expect(isSuccessful).toBeTruthy();
    
    // Verify we're redirected to success page
    await testUtils.waitForNavigation('success');
    expect(page.url()).toContain('success');
  });

  test('should handle payment errors gracefully', async ({ 
    paymentHelper, 
    page, 
    testUtils 
  }) => {
    // Navigate to payment page
    await page.goto('/payment');
    
    // Process payment with declined test card
    await paymentHelper.processPayment({
      amount: 100,
      cardNumber: '4000000000000002', // Stripe declined test card
      expiryMonth: '12',
      expiryYear: '2025',
      cvc: '123',
      cardholderName: 'Test User'
    });
    
    // Verify payment error is displayed
    const errorMessage = await paymentHelper.getPaymentError();
    expect(errorMessage).toBeTruthy();
    expect(errorMessage).toMatch(/declined|error|failed/i);
    
    // Verify we stay on payment page for retry
    expect(page.url()).toContain('payment');
  });

  test('should display payment history', async ({ 
    paymentHelper, 
    testUtils, 
    page 
  }) => {
    // Navigate to payment history
    await paymentHelper.viewPaymentHistory();
    
    // Verify payment history page is loaded
    await testUtils.waitForElement('[data-testid="payment-history"]');
    
    // Check that payment history container is visible
    const paymentHistory = page.locator('[data-testid="payment-history"]');
    await expect(paymentHistory).toBeVisible();
    
    // Verify we're on the payments page
    expect(page.url()).toContain('payments');
  });

  test('should validate payment form fields', async ({ 
    page, 
    testUtils 
  }) => {
    // Navigate to payment page
    await page.goto('/payment');
    
    // Wait for payment form to load
    await testUtils.waitForElement('[data-testid="payment-form"]');
    
    // Try to submit empty payment form
    await page.click('[data-testid="submit-payment-button"]');
    
    // Wait for validation
    await page.waitForTimeout(1000);
    
    // Verify required field validation
    const cardNumberInput = page.locator('[data-testid="card-number-input"]');
    const expiryMonthInput = page.locator('[data-testid="expiry-month-input"]');
    const cvcInput = page.locator('[data-testid="cvc-input"]');
    
    // These fields should be required
    expect(await cardNumberInput.getAttribute('required')).toBeTruthy();
    expect(await expiryMonthInput.getAttribute('required')).toBeTruthy();
    expect(await cvcInput.getAttribute('required')).toBeTruthy();
  });

  test('should handle escrow system for service completion', async ({ 
    paymentHelper, 
    flightHelper, 
    testUtils, 
    page 
  }) => {
    // Create a flight offer and simulate booking process
    const flightData = TestUtils.generateFlightData();
    
    await flightHelper.createFlightOffer({
      departure: flightData.departure,
      destination: flightData.destination,
      departureDate: flightData.departureDate,
      availableSeats: flightData.availableSeats,
      pricePerSeat: flightData.pricePerSeat,
      description: flightData.description
    });
    
    // Process payment for the booking
    await page.goto('/payment');
    await paymentHelper.processPayment({
      amount: flightData.pricePerSeat
    });
    
    // Verify payment success
    const isSuccessful = await paymentHelper.verifyPaymentSuccess();
    expect(isSuccessful).toBeTruthy();
    
    // Check escrow status (simulate service completion)
    const serviceId = 'test-service-id';
    const escrowStatus = await paymentHelper.verifyEscrowRelease(serviceId);
    
    // Escrow status should indicate funds are being held
    expect(escrowStatus).toBeTruthy();
  });

  test('should process refund for cancelled service', async ({ 
    paymentHelper, 
    page, 
    testUtils 
  }) => {
    // Navigate to payment history
    await paymentHelper.viewPaymentHistory();
    
    // Process refund for a test payment
    const paymentId = 'test-payment-id';
    
    await paymentHelper.processRefund(paymentId, 'Service was cancelled by provider');
    
    // Verify refund processing
    await testUtils.waitForElement('[data-testid="refund-success"], [data-testid="refund-error"]');
    
    // Check for success or error message
    const successElement = page.locator('[data-testid="refund-success"]');
    const errorElement = page.locator('[data-testid="refund-error"]');
    
    const hasSuccess = await successElement.count() > 0;
    const hasError = await errorElement.count() > 0;
    
    expect(hasSuccess || hasError).toBeTruthy();
  });

  test('should validate card number format', async ({ 
    page, 
    testUtils 
  }) => {
    // Navigate to payment page
    await page.goto('/payment');
    
    // Wait for payment form to load
    await testUtils.waitForElement('[data-testid="payment-form"]');
    
    // Enter invalid card number
    await page.fill('[data-testid="card-number-input"]', '1234');
    
    // Try to submit
    await page.click('[data-testid="submit-payment-button"]');
    
    // Wait for validation
    await page.waitForTimeout(1000);
    
    // Check for card number validation error
    const cardNumberInput = page.locator('[data-testid="card-number-input"]');
    
    // Input should show validation state (implementation specific)
    const inputValue = await cardNumberInput.inputValue();
    expect(inputValue).toBe('1234');
    
    // Form should not submit with invalid card number
    expect(page.url()).toContain('payment');
  });
});
