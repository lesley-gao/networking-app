import { test, expect } from './fixtures/test-fixtures';
import { TestUtils } from './helpers/test-utils';

test.describe('End-to-End User Journey', () => {
  test.beforeEach(async ({ page, testUtils }) => {
    // Clear storage before each test
    await testUtils.clearStorage();
  });

  test('complete user journey: registration → login → create flight offer → receive booking → payment', async ({ 
    registerPage,
    loginPage, 
    dashboardPage,
    flightHelper,
    paymentHelper,
    testUtils, 
    page 
  }) => {
    // Step 1: Register new user
    const testUser = TestUtils.generateTestUser('e2e-journey');
    
    await registerPage.goto();
    await registerPage.register(testUser);
    
    // Wait for registration completion
    await page.waitForSelector('[data-testid="registration-result"]', { timeout: 10000 });
    
    // Step 2: Login with the new user
    await loginPage.goto();
    await loginPage.login(testUser.email, testUser.password);
    
    // Verify successful login
    await testUtils.waitForNavigation('dashboard');
    await expect(page).toHaveURL(/.*dashboard/);
    
    // Step 3: Create a flight companion offer
    const flightData = TestUtils.generateFlightData();
    
    await flightHelper.createFlightOffer({
      departure: flightData.departure,
      destination: flightData.destination,
      departureDate: flightData.departureDate,
      availableSeats: flightData.availableSeats,
      pricePerSeat: flightData.pricePerSeat,
      description: flightData.description
    });
    
    // Verify offer creation
    await testUtils.waitForElement('[data-testid="offer-created-message"], [data-testid="flight-offer-details"]');
    
    // Step 4: Navigate to dashboard and verify offer appears
    await dashboardPage.goto();
    await dashboardPage.navigateToFlightOffers();
    
    // Step 5: Simulate another user booking (in real test, this would be a separate user)
    // For this test, we'll simulate the booking flow
    await page.goto('/flight-companion/search');
    
    await flightHelper.searchFlightCompanions({
      departure: flightData.departure,
      destination: flightData.destination,
      type: 'offers'
    });
    
    // Step 6: Simulate payment process for a booking
    await page.goto('/payment');
    
    await paymentHelper.processPayment({
      amount: flightData.pricePerSeat
    });
    
    // Step 7: Verify end-to-end completion
    const paymentSuccess = await paymentHelper.verifyPaymentSuccess();
    expect(paymentSuccess).toBeTruthy();
    
    // Verify we completed the full journey
    await testUtils.waitForNavigation('success');
    expect(page.url()).toContain('success');
  });

  test('complete pickup service workflow', async ({ 
    authHelper,
    dashboardPage,
    testUtils, 
    page 
  }) => {
    // Step 1: Login with existing user
    await authHelper.login('test.user1@example.com', 'TestPassword123!');
    
    // Step 2: Create pickup request
    await page.goto('/pickup/create-request');
    
    await page.fill('[data-testid="pickup-location-input"]', 'Auckland Airport');
    await page.fill('[data-testid="destination-input"]', 'Auckland CBD');
    await page.fill('[data-testid="pickup-date-input"]', '2025-08-01');
    await page.fill('[data-testid="pickup-time-input"]', '14:00');
    await page.fill('[data-testid="passengers-input"]', '2');
    await page.fill('[data-testid="luggage-input"]', '2');
    await page.fill('[data-testid="budget-input"]', '50');
    await page.fill('[data-testid="description-textarea"]', 'Need pickup from airport to city center');
    
    await page.click('[data-testid="create-request-button"]');
    
    // Step 3: Verify request creation
    await testUtils.waitForElement('[data-testid="request-created-message"], [data-testid="pickup-request-details"]');
    
    // Step 4: Search for pickup offers
    await page.goto('/pickup/search');
    
    await page.fill('[data-testid="search-pickup-location-input"]', 'Auckland Airport');
    await page.selectOption('[data-testid="search-type-select"]', 'offers');
    await page.click('[data-testid="search-button"]');
    
    await testUtils.waitForElement('[data-testid="search-results"]');
    
    // Step 5: Verify search results
    const searchResults = page.locator('[data-testid="search-results"]');
    await expect(searchResults).toBeVisible();
    
    // Step 6: Navigate to dashboard to see requests
    await dashboardPage.goto();
    await dashboardPage.navigateToPickupRequests();
    
    // Verify we can see the created request
    expect(page.url()).toContain('dashboard');
  });

  test('user communication workflow', async ({ 
    authHelper,
    testUtils, 
    page 
  }) => {
    // Step 1: Login
    await authHelper.login('test.user1@example.com', 'TestPassword123!');
    
    // Step 2: Navigate to messages
    await page.goto('/dashboard/messages');
    
    // Step 3: Send a message (simulate conversation)
    await page.fill('[data-testid="message-input"]', 'Hello, I am interested in your flight companion offer.');
    await page.click('[data-testid="send-message-button"]');
    
    // Step 4: Verify message was sent
    await testUtils.waitForElement('[data-testid="message-sent"]');
    
    // Step 5: Check message appears in conversation
    const messagesList = page.locator('[data-testid="messages-list"]');
    await expect(messagesList).toBeVisible();
    
    expect(page.url()).toContain('messages');
  });

  test('user profile and settings workflow', async ({ 
    authHelper,
    testUtils, 
    page 
  }) => {
    // Step 1: Login
    await authHelper.login('test.user1@example.com', 'TestPassword123!');
    
    // Step 2: Navigate to profile settings
    await page.goto('/profile/settings');
    
    // Step 3: Update profile information
    await page.fill('[data-testid="first-name-input"]', 'Updated');
    await page.fill('[data-testid="last-name-input"]', 'Name');
    await page.fill('[data-testid="phone-input"]', '+1234567890');
    
    // Step 4: Save changes
    await page.click('[data-testid="save-profile-button"]');
    
    // Step 5: Verify changes were saved
    await testUtils.waitForElement('[data-testid="profile-updated-message"]');
    
    const successMessage = page.locator('[data-testid="profile-updated-message"]');
    await expect(successMessage).toBeVisible();
    
    // Step 6: Navigate to theme settings
    await page.goto('/profile/theme');
    
    // Step 7: Change theme
    await page.click('[data-testid="dark-theme-button"]');
    
    // Step 8: Verify theme change applied
    await page.waitForTimeout(1000);
    
    // Check if dark theme class is applied to body or root element
    const body = page.locator('body');
    const hasThemeClass = await body.getAttribute('class');
    
    expect(hasThemeClass).toBeTruthy();
  });

  test('responsive design and mobile workflow', async ({ 
    testUtils, 
    page 
  }) => {
    // Step 1: Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Step 2: Navigate to homepage
    await page.goto('/');
    
    // Step 3: Test mobile navigation
    const mobileMenuButton = page.locator('[data-testid="mobile-menu-button"]');
    if (await mobileMenuButton.count() > 0) {
      await mobileMenuButton.click();
      
      // Verify mobile menu opens
      const mobileMenu = page.locator('[data-testid="mobile-menu"]');
      await expect(mobileMenu).toBeVisible();
    }
    
    // Step 4: Test responsive forms
    await page.goto('/login');
    
    // Verify login form is mobile-friendly
    const loginForm = page.locator('[data-testid="login-form"]');
    await expect(loginForm).toBeVisible();
    
    // Step 5: Test responsive search
    await page.goto('/flight-companion/search');
    
    // Verify search form adapts to mobile
    const searchForm = page.locator('[data-testid="search-form"]');
    await expect(searchForm).toBeVisible();
    
    // Step 6: Reset to desktop viewport
    await page.setViewportSize({ width: 1280, height: 720 });
  });

  test('error handling and edge cases', async ({ 
    authHelper,
    testUtils, 
    page 
  }) => {
    // Step 1: Test network error handling
    await page.route('**/api/**', route => {
      route.abort('failed');
    });
    
    // Step 2: Try to login with network failure
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'password');
    await page.click('[data-testid="login-button"]');
    
    // Step 3: Verify error handling
    await page.waitForTimeout(3000);
    
    // Should show error message or stay on login page
    expect(page.url()).toContain('login');
    
    // Step 4: Remove network failure and test recovery
    await page.unroute('**/api/**');
    
    // Step 5: Test successful login after network recovery
    await authHelper.login('test.user1@example.com', 'TestPassword123!');
    
    // Verify successful recovery
    await testUtils.waitForNavigation('dashboard');
    expect(page.url()).toContain('dashboard');
    
    // Step 6: Test 404 error handling
    await page.goto('/non-existent-page');
    
    // Should show 404 page or redirect to home
    await page.waitForTimeout(2000);
    
    const is404 = page.url().includes('404') || page.url().includes('not-found');
    const isHome = page.url() === page.context().browser()?.contexts()[0]?.pages()[0]?.url();
    
    expect(is404 || isHome).toBeTruthy();
  });
});
