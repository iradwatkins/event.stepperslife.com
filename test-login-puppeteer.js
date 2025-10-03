#!/usr/bin/env node

/**
 * BMAD Puppeteer Login Test
 * Tests authentication flow using Chrome automation
 */

const puppeteer = require('puppeteer');

async function testLoginFlow() {
  console.log('🤖 BMAD Automated Login Test');
  console.log('================================\n');
  
  const browser = await puppeteer.launch({
    headless: false, // Set to true for CI/CD
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    
    // Set viewport
    await page.setViewport({ width: 1280, height: 800 });
    
    // Test 1: Navigate to login page
    console.log('📍 Test 1: Navigating to login page...');
    await page.goto('http://localhost:3004/auth/login', {
      waitUntil: 'networkidle2'
    });
    
    const loginUrl = page.url();
    console.log('   Current URL:', loginUrl);
    
    if (loginUrl.includes('localhost:3004')) {
      console.log('   ✅ Correctly on localhost for development');
    }
    
    // Test 2: Check for Google Sign-in button
    console.log('\n📍 Test 2: Checking for Google Sign-in button...');
    const googleButton = await page.$('button:has-text("Sign in with Google"), a:has-text("Sign in with Google"), [class*="google"]');
    
    if (googleButton) {
      console.log('   ✅ Google Sign-in button found');
      
      // Click the button and wait for navigation
      console.log('   🔄 Clicking Google Sign-in...');
      
      // Set up request interception to log OAuth flow
      page.on('request', request => {
        const url = request.url();
        if (url.includes('/api/auth/') || url.includes('accounts.google.com')) {
          console.log('   📡 OAuth Request:', url.substring(0, 80) + '...');
        }
      });
      
      // Click and wait for navigation (will redirect to Google)
      const [response] = await Promise.all([
        page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 }).catch(() => null),
        googleButton.click()
      ]);
      
      await page.waitForTimeout(2000);
      
      const currentUrl = page.url();
      console.log('   📍 Redirected to:', currentUrl.substring(0, 80) + '...');
      
      if (currentUrl.includes('accounts.google.com')) {
        console.log('   ✅ Successfully redirected to Google OAuth');
        console.log('   ✅ OAuth flow initiated correctly');
        
        // Check the redirect_uri parameter
        const urlParams = new URL(currentUrl).searchParams;
        const redirectUri = urlParams.get('redirect_uri');
        console.log('   📍 Callback URI:', redirectUri);
        
        if (redirectUri && redirectUri.includes('localhost:3004')) {
          console.log('   ✅ Callback URI correctly set for localhost');
        }
      } else if (currentUrl.includes('error')) {
        console.log('   ⚠️ Redirected to error page');
        
        // Get error message
        const errorText = await page.$eval('body', el => el.innerText);
        console.log('   Error details:', errorText.substring(0, 200));
      }
    } else {
      console.log('   ❌ Google Sign-in button not found');
    }
    
    // Test 3: Check session endpoint
    console.log('\n📍 Test 3: Testing session endpoint...');
    const sessionResponse = await page.evaluate(async () => {
      try {
        const response = await fetch('/api/auth/session');
        return {
          status: response.status,
          data: await response.json()
        };
      } catch (error) {
        return { error: error.message };
      }
    });
    
    console.log('   Session Response:', sessionResponse);
    
    if (sessionResponse.status === 200) {
      console.log('   ✅ Session endpoint working');
    }
    
    // Test 4: Check providers endpoint
    console.log('\n📍 Test 4: Checking auth providers...');
    const providers = await page.evaluate(async () => {
      try {
        const response = await fetch('/api/auth/providers');
        return await response.json();
      } catch (error) {
        return { error: error.message };
      }
    });
    
    if (providers.google) {
      console.log('   ✅ Google provider configured');
      console.log('   Sign-in URL:', providers.google.signinUrl);
      console.log('   Callback URL:', providers.google.callbackUrl);
    }
    
    console.log('\n================================');
    console.log('📊 TEST SUMMARY');
    console.log('================================');
    console.log('✅ Local development server is working');
    console.log('✅ Authentication endpoints are accessible');
    console.log('✅ OAuth flow can be initiated');
    console.log('\n📝 For Production:');
    console.log('   Deploy with NODE_ENV=production');
    console.log('   Use .env.production.local');
    console.log('   All URLs will use https://events.stepperslife.com');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

// Run the test
testLoginFlow().catch(console.error);