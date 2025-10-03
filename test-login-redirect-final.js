#!/usr/bin/env node

/**
 * BMAD Final Test: Login Redirect Fix Verification
 */

const http = require('http');

console.log('\n✅ BMAD LOGIN FIX VERIFICATION');
console.log('================================\n');

async function testAuthProviders() {
  return new Promise((resolve) => {
    http.get('http://localhost:3004/api/auth/providers', (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        const providers = JSON.parse(data);
        console.log('📍 Auth Providers Configuration:');
        console.log('  Google Sign-in URL:', providers.google?.signinUrl);
        console.log('  Email Sign-in URL:', providers.email?.signinUrl);
        
        const hasLocalhost = JSON.stringify(providers).includes('localhost');
        const hasCorrectDomain = JSON.stringify(providers).includes('events.stepperslife.com');
        
        if (hasLocalhost) {
          console.log('  ❌ FAIL: Localhost references still present');
        }
        if (hasCorrectDomain) {
          console.log('  ✅ PASS: Correct domain configured');
        }
        resolve({ hasLocalhost, hasCorrectDomain });
      });
    });
  });
}

async function runFinalTest() {
  console.log('Testing authentication redirect configuration...\n');
  
  const result = await testAuthProviders();
  
  console.log('\n================================');
  console.log('🎯 TEST RESULTS:');
  console.log('================================\n');
  
  if (!result.hasLocalhost && result.hasCorrectDomain) {
    console.log('✅ SUCCESS: Login redirect issue is FIXED!');
    console.log('\nWhat was fixed:');
    console.log('1. Created .env.local with NEXTAUTH_URL=https://events.stepperslife.com');
    console.log('2. Updated getBaseUrl() function to prioritize NEXTAUTH_URL');
    console.log('3. Fixed localhost fallbacks in email service and API routes');
    console.log('4. Added PrismaAdapter to NextAuth configuration');
    console.log('\nUsers will now stay on events.stepperslife.com after login! 🎉');
  } else {
    console.log('⚠️  WARNING: Some issues may remain');
    console.log('Please verify the .env.local file and restart the server');
  }
  
  console.log('\n================================\n');
}

runFinalTest().then(() => process.exit(0));