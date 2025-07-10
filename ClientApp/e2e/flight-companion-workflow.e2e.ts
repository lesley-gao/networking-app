import { test, expect } from './fixtures/test-fixtures';
import { TestUtils } from './helpers/test-utils';

test.describe('Flight Companion Workflow', () => {
  test.beforeEach(async ({ page, testUtils, authHelper }) => {
    // Clear storage and login before each test
    await testUtils.clearStorage();
    
    // Login with test user
    await authHelper.login('test.user1@example.com', 'TestPassword123!');
  });

  test('should create a flight companion request', async ({ 
    flightHelper, 
    testUtils, 
    page 
  }) => {
    const flightData = TestUtils.generateFlightData();
    
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
    
    // Verify request was created successfully
    await testUtils.waitForElement('[data-testid="request-created-message"], [data-testid="flight-request-details"]');
    
    // Check if we're on the request details page or got a success message
    const url = page.url();
    const hasSuccessMessage = await page.locator('[data-testid="request-created-message"]').count() > 0;
    const onDetailsPage = url.includes('flight-companion') && url.includes('request');
    
    expect(hasSuccessMessage || onDetailsPage).toBeTruthy();
  });

  test('should create a flight companion offer', async ({ 
    flightHelper, 
    testUtils, 
    page 
  }) => {
    const flightData = TestUtils.generateFlightData();
    
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
    
    // Verify offer was created successfully
    await testUtils.waitForElement('[data-testid="offer-created-message"], [data-testid="flight-offer-details"]');
    
    // Check if we're on the offer details page or got a success message
    const url = page.url();
    const hasSuccessMessage = await page.locator('[data-testid="offer-created-message"]').count() > 0;
    const onDetailsPage = url.includes('flight-companion') && url.includes('offer');
    
    expect(hasSuccessMessage || onDetailsPage).toBeTruthy();
  });

  test('should search for flight companions', async ({ 
    flightHelper, 
    testUtils, 
    page 
  }) => {
    // Search for flight companions
    await flightHelper.searchFlightCompanions({
      departure: 'New York',
      destination: 'Los Angeles',
      type: 'requests'
    });
    
    // Verify search results are displayed
    await testUtils.waitForElement('[data-testid="search-results"]');
    
    // Check that search results container is visible
    const searchResults = page.locator('[data-testid="search-results"]');
    await expect(searchResults).toBeVisible();
    
    // Verify we're on the search results page
    expect(page.url()).toContain('search');
  });

  test('should apply to a flight companion offer', async ({ 
    flightHelper, 
    testUtils, 
    page 
  }) => {
    // First, create an offer to apply to (in real test, this might be pre-existing data)
    const flightData = TestUtils.generateFlightData();
    
    await flightHelper.createFlightOffer({
      departure: flightData.departure,
      destination: flightData.destination,
      departureDate: flightData.departureDate,
      availableSeats: flightData.availableSeats,
      pricePerSeat: flightData.pricePerSeat,
      description: flightData.description
    });
    
    // Get the offer ID from the URL or response (simplified for test)
    const offerId = 'test-offer-id';
    
    // Apply to the offer
    await flightHelper.applyToFlightCompanion(offerId, 'I would like to join this flight companion service.');
    
    // Verify application was submitted
    await testUtils.waitForElement('[data-testid="application-submitted-message"]');
    
    const successMessage = page.locator('[data-testid="application-submitted-message"]');
    await expect(successMessage).toBeVisible();
  });

  test('should view flight companion dashboard', async ({ 
    dashboardPage, 
    page 
  }) => {
    await dashboardPage.goto();
    
    // Navigate to flight requests tab
    await dashboardPage.navigateToFlightRequests();
    
    // Verify we can see flight requests section
    const flightRequestsTab = dashboardPage.flightRequestsTab;
    await expect(flightRequestsTab).toBeVisible();
    
    // Navigate to flight offers tab
    await dashboardPage.navigateToFlightOffers();
    
    // Verify we can see flight offers section
    const flightOffersTab = dashboardPage.flightOffersTab;
    await expect(flightOffersTab).toBeVisible();
  });

  test('should handle form validation errors', async ({ 
    page, 
    testUtils 
  }) => {
    // Navigate to create flight request page
    await page.goto('/flight-companion/create-request');
    
    // Try to submit empty form
    await page.click('[data-testid="create-request-button"]');
    
    // Wait for validation errors
    await page.waitForTimeout(1000);
    
    // Check for validation error indicators (exact implementation depends on form library)
    const form = page.locator('[data-testid="flight-request-form"]');
    await expect(form).toBeVisible();
    
    // Verify required field validation (specific selectors depend on implementation)
    const departureInput = page.locator('[data-testid="departure-input"]');
    const destinationInput = page.locator('[data-testid="destination-input"]');
    
    // These fields should be marked as required
    expect(await departureInput.getAttribute('required')).toBeTruthy();
    expect(await destinationInput.getAttribute('required')).toBeTruthy();
  });

  test('should filter search results', async ({ 
    flightHelper, 
    page, 
    testUtils 
  }) => {
    // Navigate to search page
    await page.goto('/flight-companion/search');
    
    // Apply search filters
    await flightHelper.searchFlightCompanions({
      departure: 'New York',
      destination: 'Los Angeles',
      departureDate: '2025-08-01',
      type: 'offers'
    });
    
    // Verify search was executed
    await testUtils.waitForElement('[data-testid="search-results"]');
    
    // Check that filters are applied
    const departureFilter = page.locator('[data-testid="search-departure-input"]');
    expect(await departureFilter.inputValue()).toBe('New York');
    
    const destinationFilter = page.locator('[data-testid="search-destination-input"]');
    expect(await destinationFilter.inputValue()).toBe('Los Angeles');
  });
});
