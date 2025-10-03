# QA-001: E2E Test Suite

**Epic:** EPIC-014 - QA & Testing
**Story Points:** 8
**Priority:** Critical
**Status:** To Do

## User Story

**As a** QA engineer
**I want** comprehensive end-to-end test coverage with Playwright
**So that** critical user flows are automatically tested and regressions are prevented

## Description

Implement a comprehensive end-to-end (E2E) testing suite using Playwright that covers all critical user journeys including event browsing, ticket purchasing, payment processing, check-in flows, and admin functionality. Tests should run on all pull requests and nightly for full regression coverage.

## Acceptance Criteria

### 1. Testing Infrastructure Setup
- [ ] Playwright installed and configured
- [ ] Test database setup/teardown automation
- [ ] Test data fixtures and seeding
- [ ] Environment variables for test environment
- [ ] Parallel test execution configuration
- [ ] Screenshot and video capture on failure
- [ ] CI/CD integration (GitHub Actions)

### 2. User Authentication Flows
- [ ] User registration with email verification
- [ ] Login with valid credentials
- [ ] Login with invalid credentials (error handling)
- [ ] Password reset flow
- [ ] OAuth login (Google/Facebook if implemented)
- [ ] Session persistence and logout
- [ ] Protected route redirection

### 3. Event Discovery & Browsing
- [ ] Browse public events list
- [ ] Search events by keyword
- [ ] Filter events by date, location, category
- [ ] View event details page
- [ ] Check event availability
- [ ] Navigate between events
- [ ] Responsive design on mobile/tablet

### 4. Ticket Purchase Flow (Critical)
- [ ] Add tickets to cart
- [ ] Update ticket quantities
- [ ] Remove tickets from cart
- [ ] Apply discount codes
- [ ] Enter customer information
- [ ] Complete Square payment (test mode)
- [ ] Receive order confirmation
- [ ] Receive email with tickets (check email in test)
- [ ] View order in user dashboard

### 5. Organizer Dashboard Flows
- [ ] Create new event with all details
- [ ] Edit existing event
- [ ] Publish/unpublish event
- [ ] Create ticket tiers
- [ ] View event analytics
- [ ] View attendee list
- [ ] Export attendee data
- [ ] Cancel event

### 6. Check-In Flows
- [ ] Scan QR code for check-in
- [ ] Manual attendee search and check-in
- [ ] View check-in status
- [ ] Handle duplicate check-in attempts
- [ ] Offline check-in mode
- [ ] Check-in analytics

### 7. Admin Functions
- [ ] View all users
- [ ] Manage user roles
- [ ] View platform analytics
- [ ] Manage system settings
- [ ] Backup/restore functionality
- [ ] View audit logs

### 8. Error Handling & Edge Cases
- [ ] Payment failure handling
- [ ] Network error scenarios
- [ ] Sold-out event handling
- [ ] Invalid QR code scanning
- [ ] Expired sessions
- [ ] Form validation errors
- [ ] API rate limiting responses

### 9. Performance & Accessibility
- [ ] Page load time assertions (< 3s)
- [ ] Lighthouse performance scores
- [ ] WCAG 2.1 accessibility compliance
- [ ] Keyboard navigation testing
- [ ] Screen reader compatibility

### 10. Cross-Browser & Device Testing
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Safari (iOS)
- [ ] Chrome Mobile (Android)

## Technical Requirements

### Playwright Configuration
```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 4 : undefined,
  reporter: [
    ['html'],
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/junit.xml' }],
  ],
  use: {
    baseURL: process.env.TEST_BASE_URL || 'http://localhost:3004',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'mobile-safari',
      use: { ...devices['iPhone 13'] },
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3004',
    reuseExistingServer: !process.env.CI,
  },
});
```

### Test Fixtures and Helpers
```typescript
// e2e/fixtures/test-data.ts
export const testUsers = {
  organizer: {
    email: 'organizer@test.com',
    password: 'Test123!@#',
    name: 'Test Organizer',
    role: 'organizer',
  },
  attendee: {
    email: 'attendee@test.com',
    password: 'Test123!@#',
    name: 'Test Attendee',
    role: 'attendee',
  },
  admin: {
    email: 'admin@test.com',
    password: 'Test123!@#',
    name: 'Test Admin',
    role: 'admin',
  },
};

export const testEvent = {
  title: 'E2E Test Event',
  description: 'This is a test event for E2E testing',
  startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
  endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000), // +4 hours
  location: '123 Test St, Test City, TC 12345',
  capacity: 100,
  ticketTypes: [
    { name: 'General Admission', price: 2500, quantity: 80 },
    { name: 'VIP', price: 5000, quantity: 20 },
  ],
};

export const testPaymentCard = {
  number: '4532015112830366', // Square test card
  cvv: '123',
  expMonth: '12',
  expYear: '2025',
  postalCode: '12345',
};
```

### Example Test: Complete Purchase Flow
```typescript
// e2e/purchase-flow.spec.ts
import { test, expect } from '@playwright/test';
import { testUsers, testEvent, testPaymentCard } from './fixtures/test-data';

test.describe('Complete Ticket Purchase Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Seed test data
    await seedDatabase();
    await page.goto('/');
  });

  test('should complete full purchase flow successfully', async ({ page }) => {
    // 1. Browse and find event
    await page.goto('/events');
    await expect(page.locator('h1')).toContainText('Upcoming Events');

    await page.getByPlaceholder('Search events...').fill('E2E Test Event');
    await page.getByRole('button', { name: 'Search' }).click();

    await expect(page.locator('[data-testid="event-card"]')).toBeVisible();
    await page.locator('[data-testid="event-card"]').first().click();

    // 2. View event details
    await expect(page.locator('h1')).toContainText(testEvent.title);
    await expect(page.locator('[data-testid="event-date"]')).toBeVisible();

    // 3. Select tickets
    await page.locator('[data-testid="ticket-quantity-general"]').fill('2');
    await page.locator('[data-testid="ticket-quantity-vip"]').fill('1');
    await page.getByRole('button', { name: 'Add to Cart' }).click();

    // 4. Review cart
    await expect(page.locator('[data-testid="cart-item"]')).toHaveCount(2);
    await expect(page.locator('[data-testid="cart-total"]')).toContainText('$100.00');

    // 5. Proceed to checkout
    await page.getByRole('button', { name: 'Checkout' }).click();

    // 6. Fill customer information
    await page.getByLabel('Email').fill('customer@test.com');
    await page.getByLabel('Full Name').fill('Test Customer');
    await page.getByLabel('Phone').fill('555-123-4567');

    // 7. Enter payment details
    await page.frameLocator('iframe[name="square-payment-form"]').getByLabel('Card Number').fill(testPaymentCard.number);
    await page.frameLocator('iframe[name="square-payment-form"]').getByLabel('CVV').fill(testPaymentCard.cvv);
    await page.frameLocator('iframe[name="square-payment-form"]').getByLabel('Expiration').fill(`${testPaymentCard.expMonth}/${testPaymentCard.expYear}`);
    await page.frameLocator('iframe[name="square-payment-form"]').getByLabel('Postal Code').fill(testPaymentCard.postalCode);

    // 8. Submit payment
    await page.getByRole('button', { name: 'Complete Purchase' }).click();

    // 9. Wait for confirmation
    await expect(page.locator('[data-testid="order-confirmation"]')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('h1')).toContainText('Order Confirmed!');

    // 10. Verify order details
    const orderNumber = await page.locator('[data-testid="order-number"]').textContent();
    expect(orderNumber).toMatch(/ORD-\d+/);

    await expect(page.locator('[data-testid="ticket-count"]')).toContainText('3 tickets');

    // 11. Verify tickets are in user dashboard
    await page.goto('/dashboard');
    await expect(page.locator('[data-testid="purchased-ticket"]')).toHaveCount(3);
  });

  test('should handle payment failure gracefully', async ({ page }) => {
    // Use a card that will decline
    const declinedCard = {
      number: '4000000000000002', // Square test card that declines
      cvv: '123',
      expMonth: '12',
      expYear: '2025',
      postalCode: '12345',
    };

    // Navigate to checkout
    await page.goto(`/events/${testEvent.id}`);
    await page.locator('[data-testid="ticket-quantity-general"]').fill('1');
    await page.getByRole('button', { name: 'Add to Cart' }).click();
    await page.getByRole('button', { name: 'Checkout' }).click();

    // Fill customer info and payment
    await page.getByLabel('Email').fill('customer@test.com');
    await page.getByLabel('Full Name').fill('Test Customer');

    await page.frameLocator('iframe[name="square-payment-form"]').getByLabel('Card Number').fill(declinedCard.number);
    await page.frameLocator('iframe[name="square-payment-form"]').getByLabel('CVV').fill(declinedCard.cvv);

    await page.getByRole('button', { name: 'Complete Purchase' }).click();

    // Verify error message
    await expect(page.locator('[data-testid="payment-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="payment-error"]')).toContainText('Payment declined');

    // Verify user can retry
    await expect(page.getByRole('button', { name: 'Try Again' })).toBeEnabled();
  });

  test.afterEach(async () => {
    // Clean up test data
    await cleanupDatabase();
  });
});
```

### Authentication Helper
```typescript
// e2e/helpers/auth.ts
import { Page } from '@playwright/test';

export async function login(page: Page, email: string, password: string) {
  await page.goto('/auth/login');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Sign In' }).click();
  await page.waitForURL('/dashboard', { timeout: 10000 });
}

export async function logout(page: Page) {
  await page.getByRole('button', { name: 'Account' }).click();
  await page.getByRole('menuitem', { name: 'Logout' }).click();
  await page.waitForURL('/auth/login');
}
```

### Database Helpers
```typescript
// e2e/helpers/database.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: { db: { url: process.env.TEST_DATABASE_URL } },
});

export async function seedDatabase() {
  // Create test users
  await prisma.user.createMany({
    data: [testUsers.organizer, testUsers.attendee, testUsers.admin],
    skipDuplicates: true,
  });

  // Create test event
  const organizer = await prisma.user.findUnique({
    where: { email: testUsers.organizer.email },
  });

  await prisma.event.create({
    data: {
      ...testEvent,
      organizerId: organizer.id,
      status: 'published',
    },
  });
}

export async function cleanupDatabase() {
  await prisma.order.deleteMany({});
  await prisma.ticket.deleteMany({});
  await prisma.event.deleteMany({});
  await prisma.user.deleteMany({
    where: {
      email: { contains: '@test.com' },
    },
  });
}

export async function resetDatabase() {
  await cleanupDatabase();
  await seedDatabase();
}
```

### CI/CD GitHub Actions
```yaml
# .github/workflows/e2e-tests.yml
name: E2E Tests

on:
  pull_request:
    branches: [main, master]
  push:
    branches: [main, master]
  schedule:
    - cron: '0 2 * * *' # Run nightly at 2 AM

jobs:
  e2e-tests:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: test
          POSTGRES_DB: events_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright browsers
        run: npx playwright install --with-deps

      - name: Setup test database
        run: |
          npm run db:migrate:test
          npm run db:seed:test
        env:
          TEST_DATABASE_URL: postgresql://postgres:test@localhost:5432/events_test

      - name: Run E2E tests
        run: npm run test:e2e
        env:
          TEST_DATABASE_URL: postgresql://postgres:test@localhost:5432/events_test
          TEST_BASE_URL: http://localhost:3004
          SQUARE_ENVIRONMENT: sandbox

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: playwright-report/

      - name: Upload test videos
        if: failure()
        uses: actions/upload-artifact@v3
        with:
          name: test-videos
          path: test-results/
```

## Implementation Details

### Phase 1: Infrastructure Setup (Day 1-2)
1. Install and configure Playwright
2. Set up test database and fixtures
3. Create test helpers and utilities
4. Configure CI/CD pipeline
5. Test basic page navigation

### Phase 2: Core User Flows (Day 3-4)
1. Implement authentication tests
2. Build event browsing tests
3. Create purchase flow tests
4. Test payment scenarios
5. Verify email confirmations

### Phase 3: Advanced Flows (Day 5-6)
1. Implement organizer dashboard tests
2. Build check-in flow tests
3. Create admin function tests
4. Test error scenarios
5. Add performance tests

### Phase 4: Cross-Browser & Optimization (Day 7-8)
1. Run tests on all browsers
2. Add mobile device tests
3. Optimize test performance
4. Fix flaky tests
5. Document test patterns

### File Structure
```
/e2e/
├── fixtures/
│   ├── test-data.ts
│   └── mock-responses.ts
├── helpers/
│   ├── auth.ts
│   ├── database.ts
│   ├── navigation.ts
│   └── assertions.ts
├── tests/
│   ├── auth/
│   │   ├── login.spec.ts
│   │   ├── registration.spec.ts
│   │   └── password-reset.spec.ts
│   ├── events/
│   │   ├── browsing.spec.ts
│   │   ├── search.spec.ts
│   │   └── details.spec.ts
│   ├── purchase/
│   │   ├── cart.spec.ts
│   │   ├── checkout.spec.ts
│   │   └── payment.spec.ts
│   ├── organizer/
│   │   ├── event-creation.spec.ts
│   │   ├── event-management.spec.ts
│   │   └── analytics.spec.ts
│   ├── checkin/
│   │   ├── qr-scan.spec.ts
│   │   └── manual-checkin.spec.ts
│   └── admin/
│       ├── user-management.spec.ts
│       └── platform-analytics.spec.ts
└── playwright.config.ts
```

## Dependencies
- Infrastructure: Test database, CI/CD
- Related: All user-facing features

## Testing Checklist

### Test Quality
- [ ] All tests are deterministic (no flaky tests)
- [ ] Tests are isolated (no dependencies between tests)
- [ ] Tests clean up after themselves
- [ ] Tests use descriptive names
- [ ] Tests have clear assertions

### Coverage
- [ ] All critical user paths covered
- [ ] Error scenarios tested
- [ ] Edge cases handled
- [ ] Cross-browser compatibility verified
- [ ] Mobile responsive tested

### CI/CD
- [ ] Tests run on every PR
- [ ] Nightly full regression suite
- [ ] Test results published
- [ ] Screenshots/videos on failure
- [ ] Test performance tracked

## Performance Metrics
- Test suite completion time: < 20 minutes
- Individual test duration: < 60 seconds
- Parallel execution: 4+ workers
- Flakiness rate: < 1%

## Success Metrics
- Test coverage: > 80% of user flows
- Pass rate: > 98%
- Regression detection: < 1 hour
- False positive rate: < 2%
- Mean time to debug: < 30 minutes

## Additional Resources
- [Playwright Documentation](https://playwright.dev/docs/intro)
- [Best Practices for E2E Testing](https://playwright.dev/docs/best-practices)
- [Playwright CI Configuration](https://playwright.dev/docs/ci)

## Notes
- Consider visual regression testing with Percy or Chromatic
- Implement test data factories for easier test setup
- Add API mocking for external services when needed
- Monitor test flakiness and fix proactively
- Keep tests maintainable with page object patterns