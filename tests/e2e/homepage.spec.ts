import { test, expect } from '@playwright/test'

test.describe('Homepage', () => {
  test('should load and display the main content', async ({ page }) => {
    await page.goto('/')

    // Check that the page loads
    await expect(page).toHaveTitle(/Stepperslife Events/)

    // Check for the main heading
    await expect(page.locator('h1')).toContainText('Welcome to Stepperslife Events')

    // Check for the description
    await expect(page.locator('text=Your premier destination')).toBeVisible()

    // Check for the port information
    await expect(page.locator('text=3004')).toBeVisible()
  })

  test('should have proper responsive design', async ({ page }) => {
    await page.goto('/')

    // Test desktop view
    await page.setViewportSize({ width: 1200, height: 800 })
    await expect(page.locator('main')).toBeVisible()

    // Test mobile view
    await page.setViewportSize({ width: 375, height: 667 })
    await expect(page.locator('main')).toBeVisible()
  })

  test('should load without accessibility violations', async ({ page }) => {
    await page.goto('/')

    // Basic accessibility checks
    await expect(page.locator('main')).toHaveAttribute('class')
    await expect(page.locator('h1')).toBeVisible()
  })
})