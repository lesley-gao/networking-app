import { test, expect } from './fixtures/test-fixtures';
import { TestUtils } from './helpers/test-utils';

/**
 * Complete User Journey End-to-End Tests
 * Tests complete user workflows from registration to service completion
 */
test.describe('Complete User Journey', () => {
  test('End-to-End User Journey: Registration to Service Completion', async ({ 
    page, 
    authHelper, 
    flightHelper, 
    paymentHelper, 
    testUtils,
    registerPage,
    loginPage,
    dashboardPage 
  }) => {
    // Step 1: Register new user
    const userData = TestUtils.generateTestUser('journey');
    
    await registerPage.goto();
    await registerPage.register(userData);
    
    await testUtils.waitForElement('[data-testid="registration-success"]');
    
    // Step 2: Login with new user
    await loginPage.goto();
    await loginPage.login(userData.email, userData.password);
    
    await expect(page).toHaveURL(/dashboard/);
    
    // Step 3: Create a flight companion request
    const flightData = TestUtils.generateFlightData();
    
    await dashboardPage.createFlightRequest();
    await flightHelper.createFlightRequest({
      departure: flightData.departure,
      destination: flightData.destination,
      departureDate: flightData.departureDate,
      passengers: 1,
      budget: 300,
      description: 'End-to-end test flight companion request'
    });
    
    await testUtils.waitForElement('[data-testid="request-created-message"]');
    
    // Step 4: Search for matching offers
    await flightHelper.searchFlightCompanions({
      departure: flightData.departure,
      destination: flightData.destination,
      type: 'offers'
    });
    
    await testUtils.waitForElement('[data-testid="search-results"]');
    
    // Step 5: If matches found, apply to one
    const searchResults = page.locator('[data-testid^="flight-companion-card-"]');
    const resultCount = await searchResults.count();
    
    if (resultCount > 0) {
      await searchResults.first().click();
      
      const companionId = await page.getAttribute('[data-testid="companion-details"]', 'data-companion-id') || 'test-companion-1';
      await flightHelper.applyToFlightCompanion(companionId, 'I would like to join your flight.');
      
      await testUtils.waitForElement('[data-testid="application-submitted-message"]');
    }
    
    // Step 6: View applications in dashboard
    await dashboardPage.goto();
    await dashboardPage.navigateToMessages();
    
    // Verify user can navigate through the platform
    await expect(page.locator('[data-testid="messages-tab"]')).toBeVisible();
    
    // Step 7: Check payment history (even if empty)
    await dashboardPage.navigateToPayments();
    await testUtils.waitForElement('[data-testid="payment-history"]');
    
    console.log('✅ Complete user journey test completed successfully');
  });

  test('Mobile Responsive Journey', async ({ page, authHelper, testUtils }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Test mobile login
    await authHelper.login('test.user1@example.com', 'TestPassword123!');
    await expect(page).toHaveURL(/dashboard/);
    
    // Verify mobile navigation works
    const mobileMenu = page.locator('[data-testid="mobile-menu-button"]');
    if (await mobileMenu.isVisible()) {
      await mobileMenu.click();
      await expect(page.locator('[data-testid="mobile-navigation"]')).toBeVisible();
    }
    
    // Test creating a request on mobile
    await page.goto('/flight-companion/create-request');
    await testUtils.waitForElement('[data-testid="flight-request-form"]');
    
    // Verify form is usable on mobile
    const form = page.locator('[data-testid="flight-request-form"]');
    await expect(form).toBeVisible();
    
    // Test responsive design elements
    const submitButton = page.locator('[data-testid="create-request-button"]');
    await expect(submitButton).toBeVisible();
    
    console.log('✅ Mobile responsive journey test completed');
  });

  test('Theme Switching Journey', async ({ page, authHelper, testUtils }) => {
    // Login
    await authHelper.login('test.user1@example.com', 'TestPassword123!');
    await expect(page).toHaveURL(/dashboard/);
    
    // Test theme switching
    const themeToggle = page.locator('[data-testid="theme-toggle"]');
    
    if (await themeToggle.isVisible()) {
      // Get initial theme
      const initialTheme = await page.getAttribute('html', 'data-theme') || 'light';
      
      // Switch theme
      await themeToggle.click();
      
      // Verify theme changed
      await page.waitForTimeout(500); // Allow animation to complete
      const newTheme = await page.getAttribute('html', 'data-theme');
      expect(newTheme).not.toBe(initialTheme);
      
      // Navigate to different pages and verify theme persists
      await page.goto('/flight-companion/search');
      await testUtils.waitForElement('[data-testid="search-form"]');
      
      const persistedTheme = await page.getAttribute('html', 'data-theme');
      expect(persistedTheme).toBe(newTheme);
    }
    
    console.log('✅ Theme switching journey test completed');
  });

  test('Error Handling Journey', async ({ page, authHelper, testUtils }) => {
    // Test various error scenarios
    
    // 1. Network error simulation
    await page.goto('/login');
    
    // Mock network failure
    await page.route('**/api/**', route => {
      route.abort('internetdisconnected');
    });
    
    // Try to login and verify error handling
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'password');
    await page.click('[data-testid="login-button"]');
    
    // Should show network error
    await testUtils.waitForElement('[data-testid="network-error"]', 5000);
    
    // Clear network mock
    await page.unroute('**/api/**');
    
    // 2. Test 404 error
    await page.goto('/non-existent-page');
    await testUtils.waitForElement('[data-testid="not-found-page"], [data-testid="error-page"]', 5000);
    
    console.log('✅ Error handling journey test completed');
  });

  test('Accessibility Journey', async ({ page, authHelper, testUtils }) => {
    // Login first
    await authHelper.login('test.user1@example.com', 'TestPassword123!');
    await expect(page).toHaveURL(/dashboard/);
    
    // Test keyboard navigation
    await page.keyboard.press('Tab');
    
    // Verify focus is visible
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
    expect(focusedElement).toBeTruthy();
    
    // Test ARIA labels and roles
    const navigationElements = page.locator('[role="navigation"]');
    const navCount = await navigationElements.count();
    expect(navCount).toBeGreaterThan(0);
    
    // Test form labels
    await page.goto('/flight-companion/create-request');
    await testUtils.waitForElement('[data-testid="flight-request-form"]');
    
    const inputs = page.locator('input, select, textarea');
    const inputCount = await inputs.count();
    
    for (let i = 0; i < inputCount; i++) {
      const input = inputs.nth(i);
      const hasLabel = await input.evaluate(el => {
        const id = el.getAttribute('id');
        const ariaLabel = el.getAttribute('aria-label');
        const ariaLabelledBy = el.getAttribute('aria-labelledby');
        const label = id ? document.querySelector(`label[for="${id}"]`) : null;
        
        return !!(label || ariaLabel || ariaLabelledBy);
      });
      
      if (!hasLabel) {
        console.warn(`Input at index ${i} missing accessibility label`);
      }
    }
    
    console.log('✅ Accessibility journey test completed');
  });
});
