import { test, expect } from './fixtures/test-fixtures';
import { TestUtils } from './helpers/test-utils';

test.describe('User Authentication Workflow', () => {
  test.beforeEach(async ({ page, testUtils }) => {
    // Clear storage before each test
    await testUtils.clearStorage();
  });

  test('should register a new user successfully', async ({ 
    registerPage, 
    testUtils, 
    page 
  }) => {
    const testUser = TestUtils.generateTestUser('register');
    
    await registerPage.goto();
    
    // Verify we're on the registration page
    await expect(page).toHaveURL(/.*register/);
    
    // Fill and submit registration form
    await registerPage.register(testUser);
    
    // Wait for registration result
    await page.waitForSelector('[data-testid="registration-result"]', { timeout: 10000 });
    
    // Verify successful registration (could be success message or redirect to verification page)
    const url = page.url();
    const isSuccessPage = url.includes('verification') || url.includes('success');
    const hasSuccessMessage = await registerPage.getSuccessMessage();
    
    expect(isSuccessPage || hasSuccessMessage).toBeTruthy();
  });

  test('should login with valid credentials', async ({ 
    loginPage, 
    dashboardPage, 
    testUtils, 
    page 
  }) => {
    // Use pre-created test user
    const credentials = {
      email: 'test.user1@example.com',
      password: 'TestPassword123!'
    };
    
    await loginPage.goto();
    
    // Verify we're on the login page
    await expect(page).toHaveURL(/.*login/);
    
    // Login with valid credentials
    await loginPage.login(credentials.email, credentials.password);
    
    // Wait for redirect to dashboard
    await testUtils.waitForNavigation('dashboard');
    
    // Verify we're logged in and on dashboard
    await expect(page).toHaveURL(/.*dashboard/);
    
    // Verify user menu is visible
    await expect(dashboardPage.userMenu).toBeVisible();
  });

  test('should show error for invalid login credentials', async ({ 
    loginPage, 
    page 
  }) => {
    await loginPage.goto();
    
    // Attempt login with invalid credentials
    await loginPage.login('invalid@example.com', 'WrongPassword123!');
    
    // Wait for error message
    await page.waitForSelector('[data-testid="error-message"]', { timeout: 5000 });
    
    // Verify error message is displayed
    const errorMessage = await loginPage.getErrorMessage();
    expect(errorMessage).toBeTruthy();
    expect(errorMessage).toContain('Invalid');
    
    // Verify we're still on login page
    await expect(page).toHaveURL(/.*login/);
  });

  test('should logout successfully', async ({ 
    authHelper, 
    loginPage, 
    dashboardPage, 
    testUtils, 
    page 
  }) => {
    // Login first
    await loginPage.goto();
    await loginPage.login('test.user1@example.com', 'TestPassword123!');
    await testUtils.waitForNavigation('dashboard');
    
    // Verify we're logged in
    expect(await authHelper.isLoggedIn()).toBeTruthy();
    
    // Logout
    await dashboardPage.logout();
    
    // Wait for redirect to login page
    await testUtils.waitForNavigation('login');
    
    // Verify we're logged out and on login page
    await expect(page).toHaveURL(/.*login/);
    expect(await authHelper.isLoggedIn()).toBeFalsy();
  });

  test('should navigate between auth pages', async ({ 
    loginPage, 
    registerPage, 
    page 
  }) => {
    // Start on login page
    await loginPage.goto();
    await expect(page).toHaveURL(/.*login/);
    
    // Navigate to register page
    await loginPage.goToRegister();
    await expect(page).toHaveURL(/.*register/);
    
    // Navigate back to login page
    await registerPage.goToLogin();
    await expect(page).toHaveURL(/.*login/);
  });

  test('should validate required fields on registration', async ({ 
    registerPage, 
    page 
  }) => {
    await registerPage.goto();
    
    // Try to submit empty form
    await registerPage.registerButton.click();
    
    // Check for validation errors (exact selectors depend on implementation)
    const emailInput = registerPage.emailInput;
    const passwordInput = registerPage.passwordInput;
    
    // Verify required field validation
    expect(await emailInput.getAttribute('required')).toBeTruthy();
    expect(await passwordInput.getAttribute('required')).toBeTruthy();
  });
});
