import { test, expect } from './fixtures/test-fixtures';
import { TestUtils } from './helpers/test-utils';

/**
 * Authentication End-to-End Tests
 * Tests user registration, login, logout workflows
 */
test.describe('Authentication Workflows', () => {
  test.beforeEach(async ({ page, testUtils }) => {
    // Clear any existing authentication state
    await testUtils.clearStorage();
  });

  test('User Registration Flow', async ({ page, registerPage, loginPage, testUtils }) => {
    // Generate unique test user data
    const userData = TestUtils.generateTestUser('registration');

    // Navigate to registration page
    await registerPage.goto();
    await expect(page).toHaveTitle(/Register/);

    // Fill and submit registration form
    await registerPage.register(userData);

    // Verify successful registration
    await testUtils.waitForElement('[data-testid="registration-success"]');
    const successMessage = await registerPage.getSuccessMessage();
    expect(successMessage).toContain('Registration successful');

    // Verify redirect to login page or dashboard
    await page.waitForURL('**/login');
  });

  test('User Login Flow', async ({ page, loginPage, dashboardPage, authHelper }) => {
    // Use pre-created test user
    const testEmail = 'test.user1@example.com';
    const testPassword = 'TestPassword123!';

    // Navigate to login page
    await loginPage.goto();
    await expect(page).toHaveTitle(/Login/);

    // Perform login
    await loginPage.login(testEmail, testPassword);

    // Verify successful login - should redirect to dashboard
    await expect(page).toHaveURL(/dashboard/);
    
    // Verify user menu is visible
    await expect(dashboardPage.userMenu).toBeVisible();
    
    // Verify user is logged in
    const isLoggedIn = await authHelper.isLoggedIn();
    expect(isLoggedIn).toBe(true);
  });

  test('User Logout Flow', async ({ page, loginPage, dashboardPage, authHelper }) => {
    // Login first
    await authHelper.login('test.user1@example.com', 'TestPassword123!');
    
    // Verify we're on dashboard
    await expect(page).toHaveURL(/dashboard/);
    
    // Perform logout
    await dashboardPage.logout();
    
    // Verify redirect to login page
    await expect(page).toHaveURL(/login/);
    
    // Verify user is logged out
    const isLoggedIn = await authHelper.isLoggedIn();
    expect(isLoggedIn).toBe(false);
  });

  test('Invalid Login Attempt', async ({ page, loginPage }) => {
    await loginPage.goto();
    
    // Try login with invalid credentials
    await loginPage.login('invalid@example.com', 'wrongpassword');
    
    // Verify error message appears
    await expect(loginPage.errorMessage).toBeVisible();
    const errorText = await loginPage.getErrorMessage();
    expect(errorText).toContain('Invalid email or password');
    
    // Verify we stay on login page
    await expect(page).toHaveURL(/login/);
  });

  test('Registration with Duplicate Email', async ({ page, registerPage, testUtils }) => {
    // Try to register with existing email
    const existingUserData = {
      email: 'test.user1@example.com', // This should already exist
      password: 'TestPassword123!',
      firstName: 'Duplicate',
      lastName: 'User',
      phoneNumber: '+1234567892'
    };

    await registerPage.goto();
    await registerPage.register(existingUserData);

    // Verify error message appears
    await testUtils.waitForElement('[data-testid="registration-error"]');
    const errorMessage = await registerPage.getErrorMessage();
    expect(errorMessage).toContain('Email already exists');
  });
});
