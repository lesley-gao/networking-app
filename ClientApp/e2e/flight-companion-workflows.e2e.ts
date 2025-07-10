import { test, expect } from './fixtures/test-fixtures';
import { TestUtils } from './helpers/test-utils';

/**
 * Flight Companion End-to-End Tests
 * Tests flight companion request/offer creation, matching, and booking workflows
 */
test.describe('Flight Companion Workflows', () => {
  test.beforeEach(async ({ page, authHelper, testUtils }) => {
    // Login before each test
    await authHelper.login('test.user1@example.com', 'TestPassword123!');
    await expect(page).toHaveURL(/dashboard/);
  });

  test('Create Flight Companion Request', async ({ page, flightHelper, testUtils, dashboardPage }) => {
    // Generate test flight data
    const flightData = TestUtils.generateFlightData();

    // Navigate to create request page
    await dashboardPage.createFlightRequest();
    
    // Create flight companion request
    await flightHelper.createFlightRequest({
      departure: flightData.departure,
      destination: flightData.destination,
      departureDate: flightData.departureDate,
      returnDate: flightData.returnDate,
      passengers: flightData.passengers,
      budget: flightData.budget,
      description: flightData.description
    });

    // Verify request creation success
    await testUtils.waitForElement('[data-testid="request-created-message"]');
    const successNotification = await testUtils.verifyNotification('Flight companion request created successfully');
    expect(successNotification).toBe(true);

    // Verify redirect to request details or dashboard
    await expect(page).toHaveURL(/flight-companion|dashboard/);
  });

  test('Create Flight Companion Offer', async ({ page, flightHelper, testUtils, dashboardPage }) => {
    // Generate test flight data
    const flightData = TestUtils.generateFlightData();

    // Navigate to create offer page
    await dashboardPage.createFlightOffer();
    
    // Create flight companion offer
    await flightHelper.createFlightOffer({
      departure: flightData.departure,
      destination: flightData.destination,
      departureDate: flightData.departureDate,
      returnDate: flightData.returnDate,
      availableSeats: flightData.availableSeats,
      pricePerSeat: flightData.pricePerSeat,
      description: flightData.description
    });

    // Verify offer creation success
    await testUtils.waitForElement('[data-testid="offer-created-message"]');
    const successNotification = await testUtils.verifyNotification('Flight companion offer created successfully');
    expect(successNotification).toBe(true);

    // Verify redirect to offer details or dashboard
    await expect(page).toHaveURL(/flight-companion|dashboard/);
  });

  test('Search Flight Companions', async ({ page, flightHelper, testUtils }) => {
    // Search for flight companions
    await flightHelper.searchFlightCompanions({
      departure: 'New York',
      destination: 'Los Angeles',
      type: 'requests'
    });

    // Verify search results are displayed
    await testUtils.waitForElement('[data-testid="search-results"]');
    
    // Check that results container is visible
    const searchResults = page.locator('[data-testid="search-results"]');
    await expect(searchResults).toBeVisible();

    // Verify search results contain flight companion cards
    const resultCards = page.locator('[data-testid^="flight-companion-card-"]');
    const cardCount = await resultCards.count();
    console.log(`Found ${cardCount} flight companion results`);
  });

  test('Apply to Flight Companion', async ({ page, flightHelper, testUtils }) => {
    // First search for available companions
    await flightHelper.searchFlightCompanions({
      departure: 'New York',
      destination: 'Los Angeles',
      type: 'offers'
    });

    await testUtils.waitForElement('[data-testid="search-results"]');
    
    // Get the first available companion
    const firstResult = page.locator('[data-testid^="flight-companion-card-"]').first();
    
    if (await firstResult.count() > 0) {
      // Click on the first result to view details
      await firstResult.click();
      
      // Apply to the flight companion
      const companionId = await page.getAttribute('[data-testid="companion-details"]', 'data-companion-id') || 'test-companion-1';
      await flightHelper.applyToFlightCompanion(companionId, 'I would like to join your flight. Looking forward to traveling together!');
      
      // Verify application success
      await testUtils.waitForElement('[data-testid="application-submitted-message"]');
      const successNotification = await testUtils.verifyNotification('Application submitted successfully');
      expect(successNotification).toBe(true);
    } else {
      console.log('No flight companions available for application test');
    }
  });

  test('Flight Companion Matching Workflow', async ({ page, flightHelper, authHelper, testUtils }) => {
    // Test the complete matching workflow with two users
    
    // User 1 creates a request
    const flightData = TestUtils.generateFlightData();
    
    await page.goto('/flight-companion/create-request');
    await flightHelper.createFlightRequest({
      departure: flightData.departure,
      destination: flightData.destination,
      departureDate: flightData.departureDate,
      passengers: 1,
      budget: 500,
      description: 'Looking for a travel companion for this route'
    });

    await testUtils.waitForElement('[data-testid="request-created-message"]');
    
    // Logout and login as different user
    await authHelper.logout();
    await authHelper.login('test.user2@example.com', 'TestPassword123!');
    
    // User 2 creates a matching offer
    await page.goto('/flight-companion/create-offer');
    await flightHelper.createFlightOffer({
      departure: flightData.departure,
      destination: flightData.destination,
      departureDate: flightData.departureDate,
      availableSeats: 2,
      pricePerSeat: 400,
      description: 'I have extra seats available on this flight'
    });

    await testUtils.waitForElement('[data-testid="offer-created-message"]');
    
    // Search and verify the match appears
    await flightHelper.searchFlightCompanions({
      departure: flightData.departure,
      destination: flightData.destination,
      type: 'requests'
    });

    await testUtils.waitForElement('[data-testid="search-results"]');
    const matchResults = page.locator('[data-testid^="flight-companion-card-"]');
    const matchCount = await matchResults.count();
    expect(matchCount).toBeGreaterThan(0);
  });

  test('Flight Companion Application Response', async ({ page, flightHelper, authHelper, testUtils }) => {
    // Navigate to applications/dashboard
    await page.goto('/dashboard/applications');
    
    // Check if there are any pending applications
    await testUtils.waitForElement('[data-testid="applications-list"]', 5000);
    
    const pendingApplications = page.locator('[data-testid^="application-"]');
    const applicationCount = await pendingApplications.count();
    
    if (applicationCount > 0) {
      // Get the first application ID
      const firstApplication = pendingApplications.first();
      const applicationId = await firstApplication.getAttribute('data-testid');
      const id = applicationId?.replace('application-', '') || 'test-app-1';
      
      // Accept the application
      await flightHelper.respondToApplication(id, 'accept', 'Welcome! Looking forward to traveling with you.');
      
      // Verify response success
      await testUtils.waitForElement('[data-testid="response-sent-message"]');
      const successNotification = await testUtils.verifyNotification('Response sent successfully');
      expect(successNotification).toBe(true);
    } else {
      console.log('No pending applications found for response test');
    }
  });
});
