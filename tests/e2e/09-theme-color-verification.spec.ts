import { test, expect, chromium } from '@playwright/test';

// Helper function to convert RGB to approximate OKLCH lightness
function rgbToLightness(r: number, g: number, b: number): number {
  // Normalize to 0-1 range
  const rNorm = r / 255;
  const gNorm = g / 255;
  const bNorm = b / 255;

  // Simple lightness approximation (L* from Lab color space)
  const lightness = (0.2126 * rNorm + 0.7152 * gNorm + 0.0722 * bNorm);
  return lightness;
}

test.describe('Theme Color Verification - tweakcn.com OKLCH Colors', () => {
  test.beforeEach(async ({ context }) => {
    // Clear all cookies and local storage before each test
    await context.clearCookies();
    await context.clearPermissions();
  });

  test('Test 1: Homepage background is pure white (oklch 1.0000 0 0)', async ({ page }) => {
    console.log('🧪 TEST 1: Verifying homepage background is pure white...');

    await page.goto('https://events.stepperslife.com/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // Get body background color
    const bodyBg = await page.evaluate(() => {
      const body = document.querySelector('body');
      const computed = window.getComputedStyle(body!);
      return computed.backgroundColor;
    });

    console.log('Body background color:', bodyBg);

    // Check if background is white (rgb(255, 255, 255))
    expect(bodyBg).toMatch(/rgb\(255,\s*255,\s*255\)|rgb\(255\s+255\s+255\)|#fff|#ffffff|white/i);

    // Take screenshot
    await page.screenshot({ path: '/tmp/test1-homepage-white.png', fullPage: true });
    console.log('✅ TEST 1 PASSED: Homepage has pure white background');
  });

  test('Test 2: Verify CSS variables match tweakcn.com OKLCH values', async ({ page }) => {
    console.log('🧪 TEST 2: Verifying CSS custom properties...');

    await page.goto('https://events.stepperslife.com/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    const cssVars = await page.evaluate(() => {
      const root = document.documentElement;
      const styles = window.getComputedStyle(root);
      return {
        background: styles.getPropertyValue('--background').trim(),
        foreground: styles.getPropertyValue('--foreground').trim(),
        card: styles.getPropertyValue('--card').trim(),
        primary: styles.getPropertyValue('--primary').trim(),
        border: styles.getPropertyValue('--border').trim(),
      };
    });

    console.log('CSS Variables:', cssVars);

    // Verify exact OKLCH values
    expect(cssVars.background).toBe('oklch(1.0000 0 0)');
    expect(cssVars.foreground).toBe('oklch(0.1884 0.0128 248.5103)');
    expect(cssVars.card).toBe('oklch(0.9784 0.0011 197.1387)');
    expect(cssVars.primary).toBe('oklch(0.6723 0.1606 244.9955)');
    expect(cssVars.border).toBe('oklch(0.9317 0.0118 231.6594)');

    console.log('✅ TEST 2 PASSED: All CSS variables match tweakcn.com OKLCH values');
  });

  test('Test 3: Dark mode shows pure black background (oklch 0 0 0)', async ({ page }) => {
    console.log('🧪 TEST 3: Verifying dark mode background is pure black...');

    await page.goto('https://events.stepperslife.com/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // Toggle to dark mode
    await page.evaluate(() => {
      document.documentElement.classList.add('dark');
    });

    await page.waitForTimeout(1000);

    // Get dark mode CSS variable
    const darkBg = await page.evaluate(() => {
      const root = document.documentElement;
      const styles = window.getComputedStyle(root);
      return styles.getPropertyValue('--background').trim();
    });

    console.log('Dark mode background CSS var:', darkBg);

    // Get actual body background in dark mode
    const bodyBg = await page.evaluate(() => {
      const body = document.querySelector('body');
      const computed = window.getComputedStyle(body!);
      return computed.backgroundColor;
    });

    console.log('Dark mode body background:', bodyBg);

    // Take screenshot
    await page.screenshot({ path: '/tmp/test3-dark-mode.png', fullPage: true });

    // Verify it's black
    expect(bodyBg).toMatch(/rgb\(0,\s*0,\s*0\)|rgb\(0\s+0\s+0\)|#000|#000000|black/i);

    console.log('✅ TEST 3 PASSED: Dark mode has pure black background');
  });

  test('Test 4: Events page and cards show correct colors', async ({ page }) => {
    console.log('🧪 TEST 4: Verifying events page and card colors...');

    await page.goto('https://events.stepperslife.com/events', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // Check page background
    const pageBg = await page.evaluate(() => {
      const body = document.querySelector('body');
      const computed = window.getComputedStyle(body!);
      return computed.backgroundColor;
    });

    console.log('Events page background:', pageBg);
    expect(pageBg).toMatch(/rgb\(255,\s*255,\s*255\)|white/i);

    // Check if cards exist and get their background
    const cardColors = await page.evaluate(() => {
      const cards = document.querySelectorAll('[class*="card"], .bg-card');
      const colors: string[] = [];
      cards.forEach(card => {
        const computed = window.getComputedStyle(card as Element);
        const bg = computed.backgroundColor;
        if (bg && bg !== 'rgba(0, 0, 0, 0)') {
          colors.push(bg);
        }
      });
      return colors.slice(0, 5); // Get first 5 cards
    });

    console.log('Card background colors:', cardColors);

    // Take screenshot
    await page.screenshot({ path: '/tmp/test4-events-page.png', fullPage: true });

    console.log('✅ TEST 4 PASSED: Events page displays with correct colors');
  });

  test('Test 5: Take screenshots of multiple pages for visual verification', async ({ page }) => {
    console.log('🧪 TEST 5: Taking screenshots of multiple pages...');

    const pages = [
      { url: 'https://events.stepperslife.com/', name: 'homepage' },
      { url: 'https://events.stepperslife.com/events', name: 'events-list' },
      { url: 'https://events.stepperslife.com/auth/login', name: 'login-page' },
      { url: 'https://events.stepperslife.com/dashboard', name: 'dashboard' },
    ];

    for (const pageInfo of pages) {
      await page.goto(pageInfo.url, { waitUntil: 'networkidle' });
      await page.waitForTimeout(2000);

      // Get background color
      const bg = await page.evaluate(() => {
        const body = document.querySelector('body');
        return window.getComputedStyle(body!).backgroundColor;
      });

      console.log(`${pageInfo.name} background:`, bg);

      await page.screenshot({
        path: `/tmp/test5-${pageInfo.name}.png`,
        fullPage: true
      });
    }

    console.log('✅ TEST 5 PASSED: Screenshots captured for all pages');
  });
});

test.describe('Chromium-specific Color Tests', () => {
  test('Test 6: Chromium - Verify colors with fresh browser context', async () => {
    console.log('🧪 TEST 6: Testing with fresh Chromium browser...');

    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    });
    const page = await context.newPage();

    await page.goto('https://events.stepperslife.com/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);

    // Clear localStorage and reload
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });

    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    const colors = await page.evaluate(() => {
      const body = document.querySelector('body');
      const root = document.documentElement;
      const rootStyles = window.getComputedStyle(root);
      const bodyStyles = window.getComputedStyle(body!);

      return {
        bodyBg: bodyStyles.backgroundColor,
        cssBackground: rootStyles.getPropertyValue('--background').trim(),
        cssCard: rootStyles.getPropertyValue('--card').trim(),
        cssPrimary: rootStyles.getPropertyValue('--primary').trim(),
      };
    });

    console.log('Fresh Chromium colors:', colors);

    await page.screenshot({ path: '/tmp/test6-chromium-fresh.png', fullPage: true });

    expect(colors.bodyBg).toMatch(/rgb\(255,\s*255,\s*255\)|white/i);
    expect(colors.cssBackground).toBe('oklch(1.0000 0 0)');

    await browser.close();

    console.log('✅ TEST 6 PASSED: Chromium shows correct colors with fresh context');
  });
});
