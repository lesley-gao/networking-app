import { test as base } from '@playwright/test';
import { AuthHelper } from '../helpers/auth-helper';
import { FlightHelper } from '../helpers/flight-helper';
import { PaymentHelper } from '../helpers/payment-helper';
import { TestUtils } from '../helpers/test-utils';
import { LoginPage } from '../pages/login-page';
import { RegisterPage } from '../pages/register-page';
import { DashboardPage } from '../pages/dashboard-page';

/**
 * Extended test fixtures with helper classes and page objects
 */
type TestFixtures = {
  authHelper: AuthHelper;
  flightHelper: FlightHelper;
  paymentHelper: PaymentHelper;
  testUtils: TestUtils;
  loginPage: LoginPage;
  registerPage: RegisterPage;
  dashboardPage: DashboardPage;
};

export const test = base.extend<TestFixtures>({
  authHelper: async ({ page }, use) => {
    await use(new AuthHelper(page));
  },

  flightHelper: async ({ page }, use) => {
    await use(new FlightHelper(page));
  },

  paymentHelper: async ({ page }, use) => {
    await use(new PaymentHelper(page));
  },

  testUtils: async ({ page }, use) => {
    await use(new TestUtils(page));
  },

  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },

  registerPage: async ({ page }, use) => {
    await use(new RegisterPage(page));
  },

  dashboardPage: async ({ page }, use) => {
    await use(new DashboardPage(page));
  },
});

export { expect } from '@playwright/test';
