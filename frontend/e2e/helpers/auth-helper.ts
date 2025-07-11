import { Page } from '@playwright/test';

/**
 * Authentication helper functions for E2E tests
 */
export class AuthHelper {
  constructor(private page: Page) {}

  /**
   * Register a new user
   */
  async register(userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phoneNumber: string;
  }) {
    await this.page.goto('/register');
    
    // Fill registration form
    await this.page.fill('[data-testid="email-input"]', userData.email);
    await this.page.fill('[data-testid="password-input"]', userData.password);
    await this.page.fill('[data-testid="confirm-password-input"]', userData.password);
    await this.page.fill('[data-testid="first-name-input"]', userData.firstName);
    await this.page.fill('[data-testid="last-name-input"]', userData.lastName);
    await this.page.fill('[data-testid="phone-input"]', userData.phoneNumber);
    
    // Submit form
    await this.page.click('[data-testid="register-button"]');
    
    // Wait for success or error message
    await this.page.waitForSelector('[data-testid="registration-result"]', { timeout: 5000 });
  }

  /**
   * Login with email and password
   */
  async login(email: string, password: string) {
    await this.page.goto('/login');
    
    await this.page.fill('[data-testid="email-input"]', email);
    await this.page.fill('[data-testid="password-input"]', password);
    await this.page.click('[data-testid="login-button"]');
    
    // Wait for redirect to dashboard or error message
    await this.page.waitForLoadState('networkidle');
    
    // Verify login success by checking for user menu or dashboard elements
    await this.page.waitForSelector('[data-testid="user-menu"], [data-testid="dashboard"]', { timeout: 10000 });
  }

  /**
   * Logout the current user
   */
  async logout() {
    // Click user menu
    await this.page.click('[data-testid="user-menu"]');
    
    // Click logout button
    await this.page.click('[data-testid="logout-button"]');
    
    // Wait for redirect to login page
    await this.page.waitForURL('**/login');
  }

  /**
   * Check if user is logged in
   */
  async isLoggedIn(): Promise<boolean> {
    try {
      await this.page.waitForSelector('[data-testid="user-menu"]', { timeout: 3000 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get current user info from the page
   */
  async getCurrentUserInfo() {
    const userMenu = this.page.locator('[data-testid="user-menu"]');
    const userName = await userMenu.getAttribute('data-user-name');
    const userEmail = await userMenu.getAttribute('data-user-email');
    
    return { userName, userEmail };
  }
}
