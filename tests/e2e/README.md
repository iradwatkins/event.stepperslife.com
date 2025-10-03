# E2E Test Suite - Events SteppersLife

## Overview

This directory contains **50 comprehensive end-to-end tests** for the Events SteppersLife platform, all using **REAL DATA** (no mocks).

### Test Philosophy

✅ **REAL DATABASE** - All tests create and verify actual PostgreSQL records
✅ **REAL PAYMENTS** - Square Sandbox API for actual payment processing
✅ **REAL EMAILS** - Resend API for actual email delivery (test mode)
✅ **REAL UI** - Playwright browser automation for actual user flows
✅ **REAL API CALLS** - All backend routes tested with actual HTTP requests

❌ **NO MOCKS** - We test the real system, not a simulation
❌ **NO FAKE DATA** - Every test creates unique timestamped data
❌ **NO SHORTCUTS** - Complete flows from start to finish

---

## Test Suites

### 1️⃣ User Authentication (`01-user-auth.spec.ts`)
**12 tests** covering the complete authentication system:

- ✅ Registration form display and validation
- ✅ User registration with database record creation
- ✅ Duplicate email prevention
- ✅ Login with valid/invalid credentials
- ✅ Logout and session clearing
- ✅ Password reset flow
- ✅ Password complexity enforcement
- ✅ Email verification
- ✅ Protected route access control
- ✅ Session persistence across reloads

**What's tested:** Complete auth flow from registration through session management.

---

### 2️⃣ Event Creation (`02-event-creation.spec.ts`)
**9 tests** covering the organizer event management workflow:

- ✅ Event creation form display
- ✅ Create event and save to database
- ✅ Unique slug generation
- ✅ Add ticket types to events
- ✅ Publish draft events
- ✅ Update existing event details
- ✅ Delete draft events
- ✅ Prevent deletion of published events with tickets
- ✅ Display organizer events list

**What's tested:** Complete organizer workflow from event creation to publishing.

---

### 3️⃣ Ticket Purchase (`03-ticket-purchase.spec.ts`)
**7 tests** covering the complete purchase flow:

- ✅ Display event with ticket pricing
- ✅ Add tickets to cart and show order summary
- ✅ Complete purchase with Square payment
- ✅ Handle payment failure gracefully
- ✅ Enforce ticket quantity limits
- ✅ Show sold out status when unavailable
- ✅ Send confirmation email after purchase

**What's tested:** End-to-end purchase flow with real Square Sandbox payments.

---

### 4️⃣ Ticket Refund (`04-ticket-refund.spec.ts`)
**6 tests** covering the refund system:

- ✅ Display refund button on valid tickets
- ✅ Show refund eligibility and amount
- ✅ Process refund and cancel ticket
- ✅ Prevent refund of already cancelled tickets
- ✅ Show refund in My Tickets after processing
- ✅ Verify database updates (refund records, ticket status, inventory)

**What's tested:** Complete refund flow including Square refund processing and database updates.

---

### 5️⃣ Ticket Transfer (`05-ticket-transfer.spec.ts`)
**6 tests** covering the transfer system:

- ✅ Display transfer button on valid tickets
- ✅ Initiate transfer request with recipient email
- ✅ Complete transfer when recipient accepts
- ✅ Prevent transfer of cancelled tickets
- ✅ Allow recipient to reject transfer
- ✅ Send email notifications for transfer events
- ✅ Verify QR code regeneration (security requirement)

**What's tested:** Complete transfer flow including ownership change and security measures.

---

### 6️⃣ Event Cancellation (`06-event-cancellation.spec.ts`)
**7 tests** covering event cancellation:

- ✅ Display cancel button on published events
- ✅ Show confirmation dialog with warning
- ✅ Cancel event and update status
- ✅ Process bulk refunds for all ticket holders
- ✅ Update all ticket statuses to CANCELLED
- ✅ Prevent cancellation of already cancelled events
- ✅ Send email notifications to all attendees

**What's tested:** Complete cancellation flow with bulk refund processing.

---

### 7️⃣ Full User Journeys (`08-full-user-journey.spec.ts`)
**3 comprehensive integration tests**:

#### Test 1: Complete Attendee Journey
`Register → Browse Events → Purchase Ticket → Request Refund`

- Creates new user account
- Discovers and views event
- Completes purchase with Square
- Requests and receives refund
- Verifies all database updates

#### Test 2: Complete Organizer Journey
`Register → Create Event → Publish → Sell Tickets → Cancel Event`

- Creates organizer account
- Creates draft event with ticket types
- Publishes event
- Simulates ticket sales (3 attendees)
- Cancels event and processes bulk refunds

#### Test 3: Ticket Transfer Journey
`Purchase → Transfer to Friend → Friend Accepts → New Ownership`

- User purchases ticket
- Initiates transfer to friend
- Friend accepts transfer
- Verifies ownership change and QR regeneration

**What's tested:** Complete real-world scenarios combining multiple features.

---

## Test Infrastructure

### Helper Files

Located in `/tests/e2e/helpers/`:

#### `test-data-generator.ts`
Generates unique timestamped test data:
- Users (attendee, organizer, admin)
- Events with realistic data
- Square test cards (success, decline, insufficient funds)
- Refund requests
- Transfer requests

**Every test run uses unique data** to ensure test isolation.

#### `database-cleaner.ts`
Handles test data cleanup:
- Deletes test data in correct order (respects foreign keys)
- Identifies test data by email pattern (`@e2etest.com`)
- Can clean by timestamp for specific test runs
- Provides cleanup count verification

#### `auth-helper.ts`
Handles authentication:
- Create users directly in database (bypasses UI for speed)
- Login/logout through UI
- Session management
- Email verification
- Role management

#### `square-helper.ts`
Handles Square payment testing:
- Fill payment forms (handles Square iframes)
- Submit payments
- Wait for success/failure
- Multiple test card types

#### `test-fixtures.ts`
Playwright fixtures with automatic cleanup:
- `testData` - Data generator instance
- `dbCleaner` - Database cleaner instance
- `authHelper` - Auth helper instance
- `squareHelper` - Square helper instance
- `prisma` - Direct database access
- `authenticatedPage` - Pre-authenticated page with user

---

## Running the Tests

### Prerequisites

1. **Database running** - PostgreSQL on port 5435
2. **Environment variables** - `.env.local` configured with:
   - `DATABASE_URL`
   - `SQUARE_ACCESS_TOKEN` (Sandbox)
   - `SQUARE_LOCATION_ID` (Sandbox)
   - `RESEND_API_KEY`
   - `NEXTAUTH_SECRET`
   - `NEXTAUTH_URL=http://localhost:3004`

3. **Dependencies installed**:
   ```bash
   npm install
   npx playwright install chromium
   ```

### Run All Tests

```bash
# Run all 50 tests
npx playwright test

# Run all tests with UI
npx playwright test --ui

# Run all tests with debug mode
npx playwright test --debug
```

### Run Specific Test Suite

```bash
# Run only auth tests
npx playwright test 01-user-auth

# Run only purchase tests
npx playwright test 03-ticket-purchase

# Run only full journey tests
npx playwright test 08-full-user-journey
```

### Run Single Test

```bash
# Run specific test by name
npx playwright test -g "should complete purchase with Square payment"
```

### View Test Report

```bash
# Open HTML report
npx playwright show-report

# Report will show:
# - Test results with pass/fail status
# - Screenshots of failures
# - Video recordings of failures
# - Execution traces for debugging
```

---

## Test Data Management

### Test Data Identification

All test data is identified by:
- **Email pattern**: `test.{role}.{timestamp}@e2etest.com`
- **Event slug pattern**: `e2e-test-event-{timestamp}-{description}`

This ensures:
1. ✅ Unique data per test run
2. ✅ Easy cleanup after tests
3. ✅ No conflicts between parallel test runs (if enabled)
4. ✅ No pollution of production data

### Cleanup

Automatic cleanup happens:
- **After each test**: Individual test cleanup via fixtures
- **After test suite**: Global teardown removes all test data

Manual cleanup:
```bash
# Clean all test data
npx ts-node -e "
  import { DatabaseCleaner } from './tests/e2e/helpers/database-cleaner';
  const cleaner = new DatabaseCleaner();
  await cleaner.cleanupTestData();
  await cleaner.disconnect();
"
```

---

## Understanding Test Output

### Console Output

Tests use descriptive console logging:

```
🧪 Starting Ticket Purchase Tests...
============================================================
📝 Test: Complete purchase flow
✅ Created event: Purchase Flow Test
⏳ Proceeding to checkout...
💳 Payment details filled
⏳ Processing payment...
✅ Payment processed successfully
✅ Order created: ORD-TRANS-1234567890
   Status: COMPLETED
   Total: $47.30
✅ Payment recorded: sq_sandbox_abc123
✅ Ticket generated: TIX-TRANS-1234567890
   QR Code: QR-TRANS-1234567890
   Status: VALID
🎉 Complete purchase flow verified!
============================================================
✅ Ticket Purchase Tests Complete
```

### Test Results

After running tests, check:
- **playwright-report/** - HTML report with screenshots
- **test-results/** - JSON results for CI/CD
- **videos/** - Recorded videos of failed tests
- **traces/** - Execution traces for debugging

---

## Debugging Failed Tests

### Step 1: Check the Error Message
```bash
npx playwright test --reporter=list
```
Shows detailed error messages and stack traces.

### Step 2: View Screenshots
Failed tests automatically capture screenshots.
```bash
npx playwright show-report
```
Click on failed test → View screenshot.

### Step 3: Watch Video Replay
Failed tests record video.
```bash
# Videos are in test-results/{test-name}/video.webm
```

### Step 4: Inspect Trace
Traces capture full browser state.
```bash
npx playwright show-trace test-results/{test-name}/trace.zip
```

### Step 5: Run in Debug Mode
```bash
npx playwright test --debug -g "specific test name"
```
Opens Playwright Inspector for step-by-step debugging.

### Step 6: Check Database State
All tests log database IDs. Use these to inspect:
```bash
PGPASSWORD=events_password psql -h localhost -p 5435 -U events_user -d events_stepperslife -c "
  SELECT * FROM users WHERE email LIKE '%@e2etest.com';
"
```

---

## CI/CD Integration

### GitHub Actions Example

```yaml
name: E2E Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: events_password
        ports:
          - 5435:5432

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: 18

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright
        run: npx playwright install chromium

      - name: Run E2E tests
        run: npx playwright test
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
          SQUARE_ACCESS_TOKEN: ${{ secrets.SQUARE_SANDBOX_TOKEN }}
          RESEND_API_KEY: ${{ secrets.RESEND_API_KEY }}

      - name: Upload test report
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: playwright-report/
```

---

## Performance Considerations

### Test Duration

Expected duration (sequential execution):
- **01-user-auth**: ~3-5 minutes (12 tests)
- **02-event-creation**: ~2-4 minutes (9 tests)
- **03-ticket-purchase**: ~5-8 minutes (7 tests, includes Square API)
- **04-ticket-refund**: ~4-6 minutes (6 tests, includes Square API)
- **05-ticket-transfer**: ~3-5 minutes (6 tests)
- **06-event-cancellation**: ~5-7 minutes (7 tests, bulk operations)
- **08-full-user-journey**: ~8-12 minutes (3 comprehensive tests)

**Total**: ~30-45 minutes for all 50 tests

### Optimization Tips

1. **Run critical tests first** during development:
   ```bash
   npx playwright test 08-full-user-journey
   ```

2. **Focus on specific feature** you're working on:
   ```bash
   npx playwright test 05-ticket-transfer
   ```

3. **Use test.only** during development:
   ```typescript
   test.only('specific test', async ({ page }) => {
     // Only runs this test
   });
   ```

4. **Database cleanup** - Periodically clean test data:
   ```bash
   npm run db:clean-test-data
   ```

---

## Contributing

### Adding New Tests

1. **Follow naming convention**: `{number}-{feature}.spec.ts`
2. **Use real data**: Import fixtures, create actual database records
3. **Add descriptive logging**: Use console.log with emojis for clarity
4. **Test complete flows**: Don't just test API responses, test full UX
5. **Verify in database**: Always check database state, not just UI

### Test Template

```typescript
import { test, expect } from './fixtures/test-fixtures';

test.describe('Feature Name (CATEGORY)', () => {
  test.beforeAll(async () => {
    console.log('🧪 Starting Feature Tests...');
    console.log('='.repeat(60));
  });

  test('should do something specific', async ({
    page,
    testData,
    authHelper,
    prisma
  }) => {
    console.log('📝 Test: Specific functionality');

    // STEP 1: Setup
    const user = testData.generateUser('attendee');
    await authHelper.createUserInDatabase(user);
    console.log(`✅ Setup complete`);

    // STEP 2: Action
    await authHelper.loginUI(page, user.email, user.password);
    await page.click('button:has-text("Do Something")');
    console.log('⏳ Processing...');

    // STEP 3: Verify
    const record = await prisma.someModel.findFirst({
      where: { userId: user.id },
    });
    expect(record).toBeTruthy();
    console.log(`✅ Verified: ${record?.id}`);

    console.log('🎉 Test complete!');
  });
});
```

---

## Troubleshooting

### Tests timing out

**Cause**: Real API calls can be slow
**Solution**: Increase timeout in test or config:
```typescript
test.setTimeout(180000); // 3 minutes for this test
```

### Database connection errors

**Cause**: Database not running or wrong credentials
**Solution**: Check PostgreSQL is running on port 5435:
```bash
docker ps | grep postgres
```

### Square payment failures

**Cause**: Invalid sandbox credentials
**Solution**: Verify `.env.local` has correct `SQUARE_ACCESS_TOKEN` for sandbox

### Test data not cleaning up

**Cause**: Tests interrupted before cleanup
**Solution**: Run manual cleanup:
```bash
npx ts-node scripts/clean-test-data.ts
```

---

## Summary

This E2E test suite provides **comprehensive coverage** of all critical MVP features:

✅ **50 tests** covering complete user flows
✅ **Real data** - no mocks, no simulations
✅ **Real APIs** - Square, Resend, PostgreSQL
✅ **Automatic cleanup** - no test data pollution
✅ **Descriptive output** - easy to understand results
✅ **Debugging tools** - screenshots, videos, traces

**Test with confidence** - these tests verify the actual system works as expected in real-world scenarios.
