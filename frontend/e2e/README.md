# Playwright E2E Tests for NetworkingApp

This directory contains end-to-end tests for WingCompanion using Playwright with TypeScript.

## Test Structure

```
e2e/
├── fixtures/
│   └── test-fixtures.ts        # Extended test fixtures with helpers and page objects
├── helpers/
│   ├── auth-helper.ts          # Authentication helper functions
│   ├── flight-helper.ts        # Flight companion booking helpers
│   ├── payment-helper.ts       # Payment processing helpers
│   └── test-utils.ts           # Common utility functions
├── pages/
│   ├── login-page.ts           # Login page object model
│   ├── register-page.ts        # Registration page object model
│   └── dashboard-page.ts       # Dashboard page object model
├── global-setup.ts             # Global test setup
├── global-teardown.ts          # Global test cleanup
├── auth-workflow.e2e.ts        # Authentication workflow tests
├── flight-companion-workflow.e2e.ts  # Flight companion tests
├── payment-workflow.e2e.ts     # Payment processing tests
└── complete-user-journey.e2e.ts      # End-to-end user journey tests
```

## Test Scenarios Covered

### Authentication Workflow
- User registration with validation
- Login with valid/invalid credentials
- Logout functionality
- Navigation between auth pages
- Form field validation

### Flight Companion Workflow
- Create flight companion requests
- Create flight companion offers
- Search for flight companions
- Apply to flight companion services
- View dashboard and manage bookings
- Form validation and error handling

### Payment Workflow
- Process successful payments
- Handle payment errors gracefully
- Display payment history
- Validate payment form fields
- Escrow system for service completion
- Process refunds for cancelled services

### Complete User Journey
- Full registration → login → booking → payment flow
- Pickup service workflow
- User communication workflow
- Profile and settings management
- Responsive design and mobile workflow
- Error handling and edge cases

## Running Tests

### Prerequisites
1. Ensure both frontend and backend servers are configured in `playwright.config.ts`
2. Backend should be running on `http://localhost:5000`
3. Frontend should be running on `http://localhost:3000`

### Commands

```bash
# Run all E2E tests
npm run test:e2e

# Run tests with UI mode (interactive)
npm run test:e2e:ui

# Run tests in headed mode (see browser)
npm run test:e2e:headed

# Debug tests
npm run test:e2e:debug

# Show test report
npm run test:e2e:report
```

### Browser Support
Tests run on multiple browsers:
- Chrome (Desktop)
- Firefox (Desktop)
- Safari (Desktop)
- Edge (Desktop)
- Chrome Mobile
- Safari Mobile

## Test Data

### Test Users
- `test.user1@example.com` / `TestPassword123!`
- `test.user2@example.com` / `TestPassword123!`

Additional test users are generated dynamically during test runs.

### Test Data Generation
- Flight data is generated randomly for each test
- User data uses timestamps to ensure uniqueness
- Payment tests use Stripe test card numbers

## Configuration

### Environment Variables
- `BASE_URL`: Frontend URL (default: http://localhost:3000)
- `CI`: Set to true for CI/CD environments

### Test Settings
- Parallel execution enabled (configurable per environment)
- Screenshots on failure
- Video recording on failure
- Trace collection on retry
- HTML reports generated

## Best Practices

### Page Object Model
- Each page has its own page object class
- Locators use `data-testid` attributes for stability
- Methods represent user actions on the page

### Helper Classes
- Business logic abstracted into helper classes
- Reusable functions for common workflows
- Utilities for test data generation and validation

### Test Organization
- Tests grouped by workflow/feature
- Descriptive test names that explain the scenario
- Proper setup and teardown for each test

### Error Handling
- Tests handle both success and failure scenarios
- Network errors and edge cases covered
- Graceful degradation testing

## CI/CD Integration

Tests are configured for GitHub Actions with:
- Retry logic for flaky tests
- Parallel execution optimization
- Artifact collection (screenshots, videos, reports)
- Test result reporting

## Troubleshooting

### Common Issues

1. **Servers not starting**: Check that both frontend and backend are configured correctly
2. **Test timeouts**: Increase timeout values in `playwright.config.ts`
3. **Element not found**: Verify `data-testid` attributes exist in components
4. **Authentication failures**: Check test user credentials and backend auth setup

### Debug Mode
Use `npm run test:e2e:debug` to step through tests interactively.

### Test Reports
HTML reports are generated in `playwright-report/` directory.
