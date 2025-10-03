#!/usr/bin/env node

/**
 * PRODUCTION LOGIN TEST - https://events.stepperslife.com
 * Tests Google OAuth login 5 times with iradwatkins@gmail.com
 */

const puppeteer = require('puppeteer');

async function testProductionLogin(attemptNumber) {
  console.log(`\n🔐 Test Attempt #${attemptNumber} - PRODUCTION LOGIN TEST`);
  console.log('================================================\n');
  
  const browser = await puppeteer.launch({
    headless: false, // Show browser for visual confirmation
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--window-size=1280,800'
    ]
  });

  try {
    const page = await browser.newPage();
    
    // Set user agent to avoid bot detection
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    // Monitor console for errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('❌ Browser Console Error:', msg.text());
      }
    });

    // Monitor network responses
    page.on('response', response => {
      const url = response.url();
      if (url.includes('/api/auth/')) {
        console.log(`📡 Auth API: ${url.replace('https://events.stepperslife.com', '')} - Status: ${response.status()}`);
      }
    });

    console.log('1️⃣ Navigating to https://events.stepperslife.com/auth/login');
    await page.goto('https://events.stepperslife.com/auth/login', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    // Check if we're on the correct domain
    const currentUrl = page.url();
    if (currentUrl.includes('events.stepperslife.com')) {
      console.log('   ✅ On correct production domain');
    } else {
      console.log('   ❌ Wrong domain:', currentUrl);
      throw new Error('Not on production domain');
    }

    console.log('2️⃣ Looking for Google Sign-in button...');
    // Try multiple selectors for Google button
    const googleButton = await page.waitForSelector(
      'button:has-text("Sign in with Google"), button:has-text("Google"), a:has-text("Google"), [class*="google" i], form[action*="google"] button',
      { timeout: 10000 }
    ).catch(() => null);

    if (googleButton) {
      console.log('   ✅ Found Google Sign-in button');
      
      console.log('3️⃣ Clicking Google Sign-in...');
      // Set up navigation promise before clicking
      const navigationPromise = page.waitForNavigation({ 
        waitUntil: 'networkidle0',
        timeout: 30000 
      });

      await googleButton.click();
      
      // Wait for navigation to Google
      await navigationPromise;
      
      const googleUrl = page.url();
      console.log('   📍 Redirected to:', googleUrl.substring(0, 50) + '...');

      if (googleUrl.includes('accounts.google.com')) {
        console.log('   ✅ Successfully reached Google OAuth');
        
        // Check the redirect_uri parameter
        const url = new URL(googleUrl);
        const redirectUri = url.searchParams.get('redirect_uri');
        console.log('   📍 Callback URI:', redirectUri);
        
        if (redirectUri && redirectUri.includes('events.stepperslife.com')) {
          console.log('   ✅ PRODUCTION callback URI configured correctly!');
          
          // Attempt to fill in email (if on email input page)
          console.log('4️⃣ Attempting to enter email: iradwatkins@gmail.com');
          
          const emailInput = await page.waitForSelector('input[type="email"], input#identifierId', {
            timeout: 5000
          }).catch(() => null);
          
          if (emailInput) {
            await emailInput.type('iradwatkins@gmail.com');
            console.log('   ✅ Email entered');
            
            // Click Next button
            const nextButton = await page.$('button:has-text("Next"), div[id="identifierNext"] button, button[jsname="LgbsSe"]');
            if (nextButton) {
              await nextButton.click();
              console.log('   ✅ Clicked Next');
              
              // Wait for password field or profile selection
              await page.waitForTimeout(3000);
              
              // Check if we need to enter password or select account
              const passwordInput = await page.$('input[type="password"]');
              if (passwordInput) {
                console.log('   ℹ️ Password field detected (manual entry required for security)');
              } else {
                console.log('   ℹ️ Account selection or already logged in');
              }
            }
          }
        } else if (redirectUri && redirectUri.includes('localhost')) {
          console.log('   ❌ ERROR: Callback URI still pointing to localhost!');
        }
      } else if (googleUrl.includes('error')) {
        console.log('   ❌ Redirected to error page');
        const errorText = await page.$eval('body', el => el.innerText.substring(0, 200));
        console.log('   Error:', errorText);
      }
    } else {
      console.log('   ❌ Could not find Google Sign-in button');
    }

    console.log('\n✅ Test Attempt #' + attemptNumber + ' Complete');
    
    // Keep browser open for 5 seconds to observe
    await new Promise(resolve => setTimeout(resolve, 5000));

  } catch (error) {
    console.error(`❌ Test #${attemptNumber} failed:`, error.message);
  } finally {
    await browser.close();
  }
}

async function runAllTests() {
  console.log('🚀 STARTING PRODUCTION LOGIN TESTS');
  console.log('Testing: https://events.stepperslife.com');
  console.log('Account: iradwatkins@gmail.com');
  console.log('================================\n');

  for (let i = 1; i <= 5; i++) {
    await testProductionLogin(i);
    
    if (i < 5) {
      console.log('\n⏳ Waiting 3 seconds before next test...\n');
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }

  console.log('\n================================');
  console.log('🎯 ALL 5 TESTS COMPLETED');
  console.log('================================');
  console.log('Summary:');
  console.log('• Domain: https://events.stepperslife.com');
  console.log('• OAuth Provider: Google');
  console.log('• Test Account: iradwatkins@gmail.com');
  console.log('• Callback URL: Should be https://events.stepperslife.com/api/auth/callback/google');
  console.log('\n⚠️ IMPORTANT: The site must be deployed with SSL for production testing!');
}

// Run all tests
runAllTests().catch(console.error);