import { Page, Locator } from '@playwright/test';

/**
 * Page Object Model for the Dashboard page
 */
export class DashboardPage {
  readonly page: Page;
  readonly userMenu: Locator;
  readonly logoutButton: Locator;
  readonly flightRequestsTab: Locator;
  readonly flightOffersTab: Locator;
  readonly pickupRequestsTab: Locator;
  readonly pickupOffersTab: Locator;
  readonly messagesTab: Locator;
  readonly paymentsTab: Locator;
  readonly createFlightRequestButton: Locator;
  readonly createFlightOfferButton: Locator;
  readonly createPickupRequestButton: Locator;
  readonly createPickupOfferButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.userMenu = page.locator('[data-testid="user-menu"]');
    this.logoutButton = page.locator('[data-testid="logout-button"]');
    this.flightRequestsTab = page.locator('[data-testid="flight-requests-tab"]');
    this.flightOffersTab = page.locator('[data-testid="flight-offers-tab"]');
    this.pickupRequestsTab = page.locator('[data-testid="pickup-requests-tab"]');
    this.pickupOffersTab = page.locator('[data-testid="pickup-offers-tab"]');
    this.messagesTab = page.locator('[data-testid="messages-tab"]');
    this.paymentsTab = page.locator('[data-testid="payments-tab"]');
    this.createFlightRequestButton = page.locator('[data-testid="create-flight-request-button"]');
    this.createFlightOfferButton = page.locator('[data-testid="create-flight-offer-button"]');
    this.createPickupRequestButton = page.locator('[data-testid="create-pickup-request-button"]');
    this.createPickupOfferButton = page.locator('[data-testid="create-pickup-offer-button"]');
  }

  async goto() {
    await this.page.goto('/dashboard');
  }

  async logout() {
    await this.userMenu.click();
    await this.logoutButton.click();
  }

  async navigateToFlightRequests() {
    await this.flightRequestsTab.click();
  }

  async navigateToFlightOffers() {
    await this.flightOffersTab.click();
  }

  async navigateToPickupRequests() {
    await this.pickupRequestsTab.click();
  }

  async navigateToPickupOffers() {
    await this.pickupOffersTab.click();
  }

  async navigateToMessages() {
    await this.messagesTab.click();
  }

  async navigateToPayments() {
    await this.paymentsTab.click();
  }

  async createFlightRequest() {
    await this.createFlightRequestButton.click();
  }

  async createFlightOffer() {
    await this.createFlightOfferButton.click();
  }

  async createPickupRequest() {
    await this.createPickupRequestButton.click();
  }

  async createPickupOffer() {
    await this.createPickupOfferButton.click();
  }

  async getUserName(): Promise<string | null> {
    return await this.userMenu.getAttribute('data-user-name');
  }

  async getUserEmail(): Promise<string | null> {
    return await this.userMenu.getAttribute('data-user-email');
  }
}
