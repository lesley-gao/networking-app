import { chromium, type FullConfig } from '@playwright/test';

/**
 * Global teardown for Playwright E2E tests
 * This runs once after all tests complete
 */
async function globalTeardown(config: FullConfig) {
  console.log('🧹 Starting global teardown for E2E tests...');
  
  // Launch browser for cleanup tasks
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Clean up test data
    console.log('🧹 Cleaning up test data...');
    await cleanupTestData(page);
    
    console.log('✅ Global teardown completed successfully');
    
  } catch (error) {
    console.error('❌ Global teardown failed:', error);
    // Don't throw error as cleanup failures shouldn't fail the test run
  } finally {
    await context.close();
    await browser.close();
  }
}

/**
 * Clean up test data after E2E tests
 */
async function cleanupTestData(page: any) {
  try {
    // Clean up test users and data via API calls
    // Note: In a real application, you might want to implement a cleanup endpoint
    // or use a test database that can be easily reset
    console.log('ℹ️ Test data cleanup completed (manual cleanup may be required)');
    
    // If you have a cleanup endpoint, you could call it here:
    // const testEmails = ['test.user1@example.com', 'test.user2@example.com'];
    // await page.evaluate(async (emails) => {
    //   const response = await fetch('http://localhost:5000/api/test/cleanup', {
    //     method: 'POST',
    //     headers: { 'Content-Type': 'application/json' },
    //     body: JSON.stringify({ emails }),
    //   });
    //   return response.ok;
    // }, testEmails);
    
  } catch (error) {
    console.warn('⚠️ Failed to cleanup test data:', error);
  }
}

export default globalTeardown;
