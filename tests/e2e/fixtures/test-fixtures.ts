/**
 * Playwright Test Fixtures
 * Provides test helpers and utilities to all E2E tests
 * Includes automatic cleanup after tests
 */

import { test as base, expect, Page } from '@playwright/test';
import { TestDataGenerator } from '../helpers/test-data-generator';
import { DatabaseCleaner } from '../helpers/database-cleaner';
import { AuthHelper } from '../helpers/auth-helper';
import { SquareHelper } from '../helpers/square-helper';
import { PrismaClient } from '@prisma/client';

// Extend Playwright test with custom fixtures
type TestFixtures = {
  testData: TestDataGenerator;
  dbCleaner: DatabaseCleaner;
  authHelper: AuthHelper;
  squareHelper: SquareHelper;
  prisma: PrismaClient;
  authenticatedPage: { page: Page; user: any };
};

export const test = base.extend<TestFixtures>({
  // Test data generator - creates unique data per test
  testData: async ({}, use) => {
    const generator = new TestDataGenerator();
    await use(generator);
  },

  // Database cleaner - cleans up after tests
  dbCleaner: async ({}, use) => {
    const cleaner = new DatabaseCleaner();
    await use(cleaner);
    // Cleanup after each test
    await cleaner.disconnect();
  },

  // Auth helper - handles authentication
  authHelper: async ({}, use) => {
    const helper = new AuthHelper();
    await use(helper);
    await helper.disconnect();
  },

  // Square helper - handles payments
  squareHelper: async ({}, use) => {
    const helper = new SquareHelper();
    await use(helper);
  },

  // Prisma client - direct database access
  prisma: async ({}, use) => {
    const prisma = new PrismaClient();
    await use(prisma);
    await prisma.$disconnect();
  },

  // Authenticated page - page with active session
  authenticatedPage: async ({ page, authHelper, testData }, use) => {
    // Create a test user and log them in
    const user = testData.generateUser('organizer');
    const createdUser = await authHelper.createUserInDatabase(user);
    await authHelper.loginUI(page, user.email, user.password);

    // Provide the authenticated page and user info
    await use({ page, user: createdUser });

    // Cleanup: logout after test
    try {
      await authHelper.logoutUI(page);
    } catch (error) {
      // Ignore logout errors
    }
  },
});

export { expect };

/**
 * Test hooks for global setup/teardown
 */

// Clean up all test data before running test suite
export async function globalSetup() {
  console.log('🧪 E2E Test Suite - Global Setup');
  console.log('=' .repeat(50));

  const cleaner = new DatabaseCleaner();

  try {
    // Check existing test data
    const count = await cleaner.getTestDataCount();
    console.log(`📊 Found ${count.users} test users and ${count.events} test events`);

    if (count.users > 0 || count.events > 0) {
      console.log('🧹 Cleaning up old test data...');
      await cleaner.cleanupTestData();
      console.log('✅ Old test data cleaned up');
    }
  } catch (error) {
    console.error('❌ Error in global setup:', error);
  } finally {
    await cleaner.disconnect();
  }

  console.log('✅ Global setup complete');
  console.log('=' .repeat(50));
}

// Clean up all test data after running test suite
export async function globalTeardown() {
  console.log('🧪 E2E Test Suite - Global Teardown');
  console.log('=' .repeat(50));

  const cleaner = new DatabaseCleaner();

  try {
    // Clean up all test data created during tests
    console.log('🧹 Cleaning up all test data...');
    await cleaner.cleanupTestData();

    // Verify cleanup
    const count = await cleaner.getTestDataCount();
    console.log(`📊 Remaining test data: ${count.users} users, ${count.events} events`);

    if (count.users === 0 && count.events === 0) {
      console.log('✅ All test data cleaned up successfully');
    } else {
      console.warn('⚠️  Some test data may remain in database');
    }
  } catch (error) {
    console.error('❌ Error in global teardown:', error);
  } finally {
    await cleaner.disconnect();
  }

  console.log('✅ Global teardown complete');
  console.log('=' .repeat(50));
}

/**
 * Utility function for test isolation
 * Ensures each test starts with clean state
 */
export async function cleanupTestData(timestamp: string) {
  const cleaner = new DatabaseCleaner();
  try {
    await cleaner.cleanupByTimestamp(timestamp);
  } finally {
    await cleaner.disconnect();
  }
}
