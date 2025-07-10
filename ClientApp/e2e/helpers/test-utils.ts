import { Page } from '@playwright/test';

/**
 * Common utility functions for E2E tests
 */
export class TestUtils {
  constructor(private page: Page) {}

  /**
   * Wait for element to be visible and stable
   */
  async waitForElement(selector: string, timeout: number = 10000) {
    await this.page.waitForSelector(selector, { timeout, state: 'visible' });
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Generate random test data
   */
  static generateTestUser(prefix: string = 'e2e') {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    
    return {
      email: `${prefix}.test.${timestamp}.${random}@example.com`,
      password: 'TestPassword123!',
      firstName: 'Test',
      lastName: 'User',
      phoneNumber: `+1${Math.floor(Math.random() * 9000000000) + 1000000000}`
    };
  }

  /**
   * Generate random flight data
   */
  static generateFlightData() {
    const cities = ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia'];
    const departure = cities[Math.floor(Math.random() * cities.length)];
    let destination = cities[Math.floor(Math.random() * cities.length)];
    
    // Ensure destination is different from departure
    while (destination === departure) {
      destination = cities[Math.floor(Math.random() * cities.length)];
    }

    const departureDate = new Date();
    departureDate.setDate(departureDate.getDate() + Math.floor(Math.random() * 30) + 1);
    
    const returnDate = new Date(departureDate);
    returnDate.setDate(returnDate.getDate() + Math.floor(Math.random() * 14) + 1);

    return {
      departure,
      destination,
      departureDate: departureDate.toISOString().split('T')[0],
      returnDate: returnDate.toISOString().split('T')[0],
      passengers: Math.floor(Math.random() * 4) + 1,
      budget: Math.floor(Math.random() * 1000) + 200,
      availableSeats: Math.floor(Math.random() * 3) + 1,
      pricePerSeat: Math.floor(Math.random() * 500) + 100,
      description: 'Test flight companion booking created by E2E tests'
    };
  }

  /**
   * Take screenshot with timestamp
   */
  async takeScreenshot(name: string) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    await this.page.screenshot({ 
      path: `e2e/screenshots/${name}-${timestamp}.png`,
      fullPage: true 
    });
  }

  /**
   * Wait for API call to complete
   */
  async waitForApiCall(urlPattern: string, method: string = 'GET', timeout: number = 10000) {
    return this.page.waitForResponse(
      response => response.url().includes(urlPattern) && response.request().method() === method,
      { timeout }
    );
  }

  /**
   * Mock API response
   */
  async mockApiResponse(urlPattern: string, response: any, method: string = 'GET') {
    await this.page.route(`**/*${urlPattern}*`, route => {
      if (route.request().method() === method) {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(response)
        });
      } else {
        route.continue();
      }
    });
  }

  /**
   * Clear browser storage
   */
  async clearStorage() {
    await this.page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    
    // Clear cookies
    const context = this.page.context();
    await context.clearCookies();
  }

  /**
   * Get console logs
   */
  async getConsoleLogs(): Promise<string[]> {
    const logs: string[] = [];
    
    this.page.on('console', msg => {
      logs.push(`${msg.type()}: ${msg.text()}`);
    });
    
    return logs;
  }

  /**
   * Check for JavaScript errors
   */
  async checkForJSErrors(): Promise<string[]> {
    const errors: string[] = [];
    
    this.page.on('pageerror', error => {
      errors.push(error.message);
    });
    
    return errors;
  }

  /**
   * Wait for navigation to complete
   */
  async waitForNavigation(urlPattern?: string, timeout: number = 10000) {
    if (urlPattern) {
      await this.page.waitForURL(`**/${urlPattern}**`, { timeout });
    } else {
      await this.page.waitForLoadState('networkidle', { timeout });
    }
  }

  /**
   * Fill form and submit
   */
  async fillFormAndSubmit(formData: Record<string, string>, submitButtonSelector: string) {
    for (const [field, value] of Object.entries(formData)) {
      await this.page.fill(`[data-testid="${field}"]`, value);
    }
    
    await this.page.click(submitButtonSelector);
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Verify notification message
   */
  async verifyNotification(expectedMessage: string, type: 'success' | 'error' | 'info' = 'success') {
    const notificationSelector = `[data-testid="notification-${type}"]`;
    await this.waitForElement(notificationSelector);
    
    const notificationText = await this.page.textContent(notificationSelector);
    return notificationText?.includes(expectedMessage) || false;
  }
}
