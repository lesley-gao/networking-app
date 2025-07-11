import { Page } from '@playwright/test';

/**
 * Flight companion booking helper functions for E2E tests
 */
export class FlightHelper {
  constructor(private page: Page) {}

  /**
   * Create a flight companion request
   */
  async createFlightRequest(requestData: {
    departure: string;
    destination: string;
    departureDate: string;
    returnDate?: string;
    passengers: number;
    budget: number;
    description: string;
  }) {
    await this.page.goto('/flight-companion/create-request');
    
    // Fill flight request form
    await this.page.fill('[data-testid="departure-input"]', requestData.departure);
    await this.page.fill('[data-testid="destination-input"]', requestData.destination);
    await this.page.fill('[data-testid="departure-date-input"]', requestData.departureDate);
    
    if (requestData.returnDate) {
      await this.page.fill('[data-testid="return-date-input"]', requestData.returnDate);
    }
    
    await this.page.fill('[data-testid="passengers-input"]', requestData.passengers.toString());
    await this.page.fill('[data-testid="budget-input"]', requestData.budget.toString());
    await this.page.fill('[data-testid="description-textarea"]', requestData.description);
    
    // Submit form
    await this.page.click('[data-testid="create-request-button"]');
    
    // Wait for success message or redirect
    await this.page.waitForSelector('[data-testid="request-created-message"], [data-testid="flight-request-details"]', { timeout: 10000 });
  }

  /**
   * Create a flight companion offer
   */
  async createFlightOffer(offerData: {
    departure: string;
    destination: string;
    departureDate: string;
    returnDate?: string;
    availableSeats: number;
    pricePerSeat: number;
    description: string;
  }) {
    await this.page.goto('/flight-companion/create-offer');
    
    // Fill flight offer form
    await this.page.fill('[data-testid="departure-input"]', offerData.departure);
    await this.page.fill('[data-testid="destination-input"]', offerData.destination);
    await this.page.fill('[data-testid="departure-date-input"]', offerData.departureDate);
    
    if (offerData.returnDate) {
      await this.page.fill('[data-testid="return-date-input"]', offerData.returnDate);
    }
    
    await this.page.fill('[data-testid="available-seats-input"]', offerData.availableSeats.toString());
    await this.page.fill('[data-testid="price-per-seat-input"]', offerData.pricePerSeat.toString());
    await this.page.fill('[data-testid="description-textarea"]', offerData.description);
    
    // Submit form
    await this.page.click('[data-testid="create-offer-button"]');
    
    // Wait for success message or redirect
    await this.page.waitForSelector('[data-testid="offer-created-message"], [data-testid="flight-offer-details"]', { timeout: 10000 });
  }

  /**
   * Search for flight companions
   */
  async searchFlightCompanions(searchCriteria: {
    departure?: string;
    destination?: string;
    departureDate?: string;
    type?: 'requests' | 'offers';
  }) {
    await this.page.goto('/flight-companion/search');
    
    // Fill search form
    if (searchCriteria.departure) {
      await this.page.fill('[data-testid="search-departure-input"]', searchCriteria.departure);
    }
    
    if (searchCriteria.destination) {
      await this.page.fill('[data-testid="search-destination-input"]', searchCriteria.destination);
    }
    
    if (searchCriteria.departureDate) {
      await this.page.fill('[data-testid="search-date-input"]', searchCriteria.departureDate);
    }
    
    if (searchCriteria.type) {
      await this.page.selectOption('[data-testid="search-type-select"]', searchCriteria.type);
    }
    
    // Submit search
    await this.page.click('[data-testid="search-button"]');
    
    // Wait for results
    await this.page.waitForSelector('[data-testid="search-results"]', { timeout: 10000 });
  }

  /**
   * Apply to a flight companion offer or request
   */
  async applyToFlightCompanion(companionId: string, message?: string) {
    // Navigate to the specific flight companion details page
    await this.page.goto(`/flight-companion/${companionId}`);
    
    // Click apply button
    await this.page.click('[data-testid="apply-button"]');
    
    // Fill application message if provided
    if (message) {
      await this.page.fill('[data-testid="application-message-textarea"]', message);
    }
    
    // Submit application
    await this.page.click('[data-testid="submit-application-button"]');
    
    // Wait for success message
    await this.page.waitForSelector('[data-testid="application-submitted-message"]', { timeout: 10000 });
  }

  /**
   * Accept or reject a flight companion application
   */
  async respondToApplication(applicationId: string, action: 'accept' | 'reject', message?: string) {
    await this.page.goto('/dashboard/applications');
    
    // Find the specific application
    const applicationCard = this.page.locator(`[data-testid="application-${applicationId}"]`);
    
    // Click the appropriate action button
    await applicationCard.locator(`[data-testid="${action}-button"]`).click();
    
    // Add message if provided
    if (message) {
      await this.page.fill('[data-testid="response-message-textarea"]', message);
    }
    
    // Confirm action
    await this.page.click('[data-testid="confirm-response-button"]');
    
    // Wait for success message
    await this.page.waitForSelector('[data-testid="response-sent-message"]', { timeout: 10000 });
  }
}
