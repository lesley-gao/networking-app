import { chromium, type FullConfig } from '@playwright/test';

/**
 * Global setup for Playwright E2E tests
 * This runs once before all tests
 */
async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting global setup for E2E tests...');
  
  // Launch browser for setup tasks
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Wait for servers to be ready
    console.log('⏳ Waiting for servers to be ready...');
    
    // Check backend server health
    const maxRetries = 30;
    let backendReady = false;
    
    for (let i = 0; i < maxRetries; i++) {
      try {
        const response = await page.goto('http://localhost:5000/api/test/health', {
          timeout: 2000,
          waitUntil: 'networkidle'
        });
        
        if (response?.ok()) {
          backendReady = true;
          console.log('✅ Backend server is ready');
          break;
        }
      } catch (error) {
        console.log(`⏳ Backend not ready, attempt ${i + 1}/${maxRetries}`);
        await page.waitForTimeout(1000);
      }
    }

    if (!backendReady) {
      throw new Error('Backend server failed to start within timeout period');
    }

    // Check frontend server health
    let frontendReady = false;
    
    for (let i = 0; i < maxRetries; i++) {
      try {
        const response = await page.goto('http://localhost:3000', {
          timeout: 2000,
          waitUntil: 'networkidle'
        });
        
        if (response?.ok()) {
          frontendReady = true;
          console.log('✅ Frontend server is ready');
          break;
        }
      } catch (error) {
        console.log(`⏳ Frontend not ready, attempt ${i + 1}/${maxRetries}`);
        await page.waitForTimeout(1000);
      }
    }

    if (!frontendReady) {
      throw new Error('Frontend server failed to start within timeout period');
    }

    // Initialize test data if needed
    console.log('🔧 Initializing test environment...');
    
    // Create test users and data via API calls
    await setupTestData(page);
    
    console.log('✅ Global setup completed successfully');
    
  } catch (error) {
    console.error('❌ Global setup failed:', error);
    throw error;
  } finally {
    await context.close();
    await browser.close();
  }
}

/**
 * Setup test data for E2E tests
 */
async function setupTestData(page: any) {
  try {
    // Create test users via API
    const testUsers = [
      {
        email: 'test.user1@example.com',
        password: 'TestPassword123!',
        firstName: 'Test',
        lastName: 'User1',
        phoneNumber: '+1234567890'
      },
      {
        email: 'test.user2@example.com',
        password: 'TestPassword123!',
        firstName: 'Test',
        lastName: 'User2',
        phoneNumber: '+1234567891'
      }
    ];

    for (const user of testUsers) {
      try {
        const response = await page.evaluate(async (userData: any) => {
          const response = await fetch('http://localhost:5000/api/auth/register', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(userData),
          });
          return {
            ok: response.ok,
            status: response.status,
            data: response.ok ? await response.json() : await response.text()
          };
        }, user);

        if (response.ok) {
          console.log(`✅ Created test user: ${user.email}`);
        } else if (response.status === 400 && response.data.includes('already exists')) {
          console.log(`ℹ️ Test user already exists: ${user.email}`);
        } else {
          console.warn(`⚠️ Failed to create test user ${user.email}:`, response.data);
        }
      } catch (error) {
        console.warn(`⚠️ Error creating test user ${user.email}:`, error);
      }
    }
  } catch (error) {
    console.warn('⚠️ Failed to setup test data:', error);
    // Don't throw error here as tests should still be able to run
  }
}

export default globalSetup;
