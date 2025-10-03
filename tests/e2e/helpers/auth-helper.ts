/**
 * Authentication Helper
 * Handles user authentication in E2E tests
 * Provides utilities for registration, login, and session management
 */

import { Page } from '@playwright/test';
import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

export class AuthHelper {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  /**
   * Register a new user through the UI
   */
  async registerUserUI(page: Page, userData: UserData) {
    await page.goto('/auth/register');

    // Fill in registration form
    await page.fill('input[name="name"]', userData.name);
    await page.fill('input[name="email"]', userData.email);
    await page.fill('input[name="password"]', userData.password);
    await page.fill('input[name="confirmPassword"]', userData.password);

    // Submit form
    await page.click('button[type="submit"]');

    // Wait for redirect or success message
    await page.waitForURL(/\/auth\/(verify|login)/, { timeout: 10000 });

    return userData;
  }

  /**
   * Create user directly in database (bypassing UI for speed)
   * IMPORTANT: This creates real database records!
   */
  async createUserInDatabase(userData: UserData) {
    try {
      // Hash password
      const passwordHash = await bcrypt.hash(userData.password, 10);

      // Split name into firstName and lastName
      const nameParts = userData.name.split(' ');
      const firstName = nameParts[0] || 'Test';
      const lastName = nameParts.slice(1).join(' ') || 'User';

      // Create user
      const user = await this.prisma.user.create({
        data: {
          firstName,
          lastName,
          email: userData.email,
          passwordHash,
          emailVerified: new Date(), // Auto-verify for testing
          role: (userData.role as UserRole) || UserRole.ATTENDEE,
          status: 'ACTIVE',
        },
      });

      console.log(`✅ Created test user: ${user.email} (ID: ${user.id})`);

      return {
        ...userData,
        id: user.id,
      };
    } catch (error) {
      console.error('❌ Error creating user in database:', error);
      throw error;
    }
  }

  /**
   * Login through the UI
   */
  async loginUI(page: Page, email: string, password: string) {
    await page.goto('/auth/login');

    // Fill in login form
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', password);

    // Submit form
    await page.click('button[type="submit"]');

    // Wait for redirect to dashboard
    await page.waitForURL('/dashboard', { timeout: 10000 });

    console.log(`✅ Logged in as: ${email}`);
  }

  /**
   * Get auth session from page
   */
  async getSession(page: Page) {
    // Execute JavaScript in the page to get session
    return await page.evaluate(() => {
      return (window as any).__NEXT_DATA__?.props?.pageProps?.session;
    });
  }

  /**
   * Check if user is logged in
   */
  async isLoggedIn(page: Page): Promise<boolean> {
    try {
      // Check for user menu or dashboard link
      const userMenu = await page.locator('[data-testid="user-menu"]').count();
      return userMenu > 0;
    } catch {
      return false;
    }
  }

  /**
   * Logout through UI
   */
  async logoutUI(page: Page) {
    try {
      // Click user menu
      await page.click('[data-testid="user-menu"]');

      // Click logout button
      await page.click('button:has-text("Log out")');

      // Wait for redirect to home or login
      await page.waitForURL(/\/(auth\/login)?$/, { timeout: 5000 });

      console.log('✅ Logged out successfully');
    } catch (error) {
      // If logout fails, just navigate to logout URL
      await page.goto('/api/auth/signout');
      await page.click('button:has-text("Sign out")');
    }
  }

  /**
   * Verify user email in database
   */
  async verifyUserEmail(email: string) {
    await this.prisma.user.update({
      where: { email },
      data: { emailVerified: new Date() },
    });

    console.log(`✅ Verified email for: ${email}`);
  }

  /**
   * Get user by email
   */
  async getUserByEmail(email: string) {
    return await this.prisma.user.findUnique({
      where: { email },
    });
  }

  /**
   * Update user role
   */
  async updateUserRole(email: string, role: UserRole) {
    return await this.prisma.user.update({
      where: { email },
      data: { role },
    });
  }

  /**
   * Setup authenticated session for tests
   * Returns a page with active session
   */
  async setupAuthenticatedSession(page: Page, userData: UserData) {
    // Create user in database
    const user = await this.createUserInDatabase(userData);

    // Login through UI
    await this.loginUI(page, userData.email, userData.password);

    return user;
  }

  /**
   * Disconnect from database
   */
  async disconnect() {
    await this.prisma.$disconnect();
  }
}

// Type definitions
interface UserData {
  name: string;
  email: string;
  password: string;
  role?: string;
  id?: string;
}

// Export singleton instance
export const authHelper = new AuthHelper();
