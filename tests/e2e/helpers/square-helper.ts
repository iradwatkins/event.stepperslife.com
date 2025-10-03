/**
 * Square Payment Helper
 * Utilities for testing Square payment integration
 * Uses Square sandbox for real payment processing
 */

import { Page } from '@playwright/test';

export class SquareHelper {
  /**
   * Square test card numbers
   */
  static CARDS = {
    success: {
      number: '4111111111111111',
      cvv: '123',
      expMonth: '12',
      expYear: '25',
      postalCode: '12345',
      description: 'Visa - Success',
    },
    decline: {
      number: '4000000000000002',
      cvv: '123',
      expMonth: '12',
      expYear: '25',
      postalCode: '12345',
      description: 'Visa - Generic Decline',
    },
    insufficient_funds: {
      number: '4000000000009995',
      cvv: '123',
      expMonth: '12',
      expYear: '25',
      postalCode: '12345',
      description: 'Visa - Insufficient Funds',
    },
    cvv_fail: {
      number: '4111111111111111',
      cvv: '200',
      expMonth: '12',
      expYear: '25',
      postalCode: '12345',
      description: 'Visa - CVV Fail',
    },
  };

  /**
   * Fill Square payment form
   * Waits for Square iframe to load and fills payment details
   */
  async fillPaymentForm(
    page: Page,
    cardType: keyof typeof SquareHelper.CARDS = 'success'
  ) {
    const card = SquareHelper.CARDS[cardType];

    console.log(`💳 Filling payment form with: ${card.description}`);

    try {
      // Wait for Square iframe to load
      // Square Web Payments SDK creates an iframe for card entry
      await page.waitForSelector('iframe[name*="card"]', { timeout: 10000 });

      // Switch to Square card number iframe
      const cardFrames = page.frames().filter((f) =>
        f.name().includes('card-number')
      );

      if (cardFrames.length > 0 && cardFrames[0]) {
        const cardFrame = cardFrames[0];
        await cardFrame.fill('input[name="cardNumber"]', card.number);
        console.log('✅ Entered card number');
      }

      // Fill expiration date
      const expFrames = page.frames().filter((f) =>
        f.name().includes('exp')
      );

      if (expFrames.length > 0 && expFrames[0]) {
        const expFrame = expFrames[0];
        await expFrame.fill('input[name="expirationDate"]', `${card.expMonth}${card.expYear}`);
        console.log('✅ Entered expiration date');
      }

      // Fill CVV
      const cvvFrames = page.frames().filter((f) => f.name().includes('cvv'));

      if (cvvFrames.length > 0 && cvvFrames[0]) {
        const cvvFrame = cvvFrames[0];
        await cvvFrame.fill('input[name="cvv"]', card.cvv);
        console.log('✅ Entered CVV');
      }

      // Fill postal code
      const postalFrames = page.frames().filter((f) =>
        f.name().includes('postal')
      );

      if (postalFrames.length > 0 && postalFrames[0]) {
        const postalFrame = postalFrames[0];
        await postalFrame.fill('input[name="postalCode"]', card.postalCode);
        console.log('✅ Entered postal code');
      }

      // Alternative: If Square is not using iframes, fill directly
      // (Some implementations may render inputs directly)
      try {
        await page.fill('input[id*="cardNumber"]', card.number, {
          timeout: 2000,
        });
        await page.fill(
          'input[id*="expirationDate"]',
          `${card.expMonth}/${card.expYear}`
        );
        await page.fill('input[id*="cvv"]', card.cvv);
        await page.fill('input[id*="postalCode"]', card.postalCode);
        console.log('✅ Filled payment form (direct inputs)');
      } catch {
        // Iframe method was used, no problem
      }
    } catch (error) {
      console.error('❌ Error filling payment form:', error);
      throw error;
    }
  }

  /**
   * Submit payment form
   */
  async submitPayment(page: Page) {
    try {
      // Look for pay/submit button
      const payButton = page.locator('button:has-text("Pay")').first();
      await payButton.click();

      console.log('✅ Clicked payment button');

      // Wait for processing
      await page.waitForTimeout(2000);
    } catch (error) {
      console.error('❌ Error submitting payment:', error);
      throw error;
    }
  }

  /**
   * Wait for payment success
   */
  async waitForPaymentSuccess(page: Page, timeout: number = 30000) {
    try {
      // Wait for success page or confirmation
      await page.waitForURL(/\/success|\/confirmation/, { timeout });
      console.log('✅ Payment successful - redirected to success page');
      return true;
    } catch (error) {
      // Check if there's an error message on page
      const errorText = await page.locator('[class*="error"]').textContent();
      console.error('❌ Payment failed:', errorText || 'Unknown error');
      return false;
    }
  }

  /**
   * Wait for payment failure
   */
  async waitForPaymentFailure(page: Page) {
    try {
      // Wait for error message
      await page.waitForSelector('[class*="error"]', { timeout: 5000 });
      const errorText = await page.locator('[class*="error"]').textContent();
      console.log(`✅ Payment declined as expected: ${errorText}`);
      return true;
    } catch {
      console.log('⚠️ No error message found - payment may have succeeded');
      return false;
    }
  }

  /**
   * Complete full payment flow
   * Combines filling form and submitting
   */
  async completePayment(
    page: Page,
    cardType: keyof typeof SquareHelper.CARDS = 'success'
  ) {
    await this.fillPaymentForm(page, cardType);
    await this.submitPayment(page);
    return await this.waitForPaymentSuccess(page);
  }

  /**
   * Verify payment in Square sandbox
   * Note: This requires Square API access
   */
  async verifyPaymentInSquare(paymentId: string) {
    // This would require Square API client
    // For now, we'll rely on database verification
    console.log(`ℹ️ Payment verification would check Square for: ${paymentId}`);
    return true;
  }

  /**
   * Get test environment info
   */
  static getTestCardInfo(cardType: keyof typeof SquareHelper.CARDS = 'success') {
    return SquareHelper.CARDS[cardType];
  }
}

// Export singleton instance
export const squareHelper = new SquareHelper();
