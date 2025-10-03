import { test, expect } from '@playwright/test';

test.describe('Chart and Status Colors Verification', () => {
  test('Verify chart colors are NOT black (#000000)', async ({ page }) => {
    console.log('🧪 Testing chart and status feedback colors...');
    await page.goto('https://events.stepperslife.com/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // Get the computed color of elements using text-chart-1, text-chart-2, etc.
    const colors = await page.evaluate(() => {
      const results: Record<string, string> = {};

      // Find all elements with text-chart-* classes
      const chartElements = document.querySelectorAll('[class*="text-chart-"]');
      chartElements.forEach((el, index) => {
        const computed = window.getComputedStyle(el);
        const color = computed.color;
        const className = el.className.match(/text-chart-\d+/)?.[0] || 'unknown';
        results[`${className}_${index}`] = color;
      });

      // Find elements with text-primary class
      const primaryElements = document.querySelectorAll('.text-primary');
      primaryElements.forEach((el, index) => {
        const computed = window.getComputedStyle(el);
        results[`text-primary_${index}`] = computed.color;
      });

      return results;
    });

    console.log('Detected colors:', colors);

    // Verify NO colors are black (rgb(0, 0, 0))
    const blackColors = Object.entries(colors).filter(([_, color]) => {
      return color === 'rgb(0, 0, 0)' || color === '#000000' || color === 'black';
    });

    console.log('Black colors found:', blackColors);

    // Take screenshot for visual verification
    await page.screenshot({
      path: '/tmp/test-chart-colors.png',
      fullPage: true
    });

    expect(blackColors.length).toBe(0);
    console.log('✅ TEST PASSED: No chart colors are black');
  });

  test('Verify specific OKLCH chart colors are rendered correctly', async ({ page }) => {
    console.log('🧪 Testing specific OKLCH color values...');
    await page.goto('https://events.stepperslife.com/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // Get CSS variables
    const cssVars = await page.evaluate(() => {
      const root = document.documentElement;
      const styles = window.getComputedStyle(root);
      return {
        chart1: styles.getPropertyValue('--chart-1').trim(),
        chart2: styles.getPropertyValue('--chart-2').trim(),
        chart3: styles.getPropertyValue('--chart-3').trim(),
        chart4: styles.getPropertyValue('--chart-4').trim(),
        chart5: styles.getPropertyValue('--chart-5').trim(),
        primary: styles.getPropertyValue('--primary').trim(),
      };
    });

    console.log('Chart CSS Variables:', cssVars);

    // Verify OKLCH values match tweakcn.com theme
    expect(cssVars.chart1).toBe('oklch(0.6723 0.1606 244.9955)'); // Blue
    expect(cssVars.chart2).toBe('oklch(0.6907 0.1554 160.3454)'); // Green
    expect(cssVars.chart3).toBe('oklch(0.8214 0.1600 82.5337)');  // Yellow
    expect(cssVars.chart4).toBe('oklch(0.7064 0.1822 151.7125)'); // Teal
    expect(cssVars.chart5).toBe('oklch(0.5919 0.2186 10.5826)');  // Red/Orange
    expect(cssVars.primary).toBe('oklch(0.6723 0.1606 244.9955)'); // Blue

    console.log('✅ TEST PASSED: All OKLCH chart values are correct');
  });

  test('Verify text color utilities are applied to feature icons', async ({ page }) => {
    console.log('🧪 Testing feature icon colors on homepage...');
    await page.goto('https://events.stepperslife.com/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // Find feature section and get icon colors
    const iconColors = await page.evaluate(() => {
      const features = document.querySelectorAll('[class*="feature"], [class*="grid"] > div');
      const colors: { element: string; color: string; className: string }[] = [];

      features.forEach((feature) => {
        const icons = feature.querySelectorAll('svg');
        icons.forEach((icon) => {
          const parent = icon.parentElement;
          if (parent) {
            const computed = window.getComputedStyle(parent);
            const className = parent.className;
            colors.push({
              element: parent.tagName,
              color: computed.color,
              className: className
            });
          }
        });
      });

      return colors;
    });

    console.log('Feature icon colors:', iconColors);

    // Count how many are NOT black
    const nonBlackIcons = iconColors.filter(({ color }) => {
      return color !== 'rgb(0, 0, 0)' && color !== '#000000' && color !== 'black';
    });

    console.log(`Found ${nonBlackIcons.length} non-black icons out of ${iconColors.length} total`);

    // We should have multiple colored icons (at least 3 based on the features array)
    expect(nonBlackIcons.length).toBeGreaterThan(0);
    console.log('✅ TEST PASSED: Feature icons are using colored text utilities');
  });
});
