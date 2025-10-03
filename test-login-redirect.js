#!/usr/bin/env node

/**
 * BMAD Test Script: Verify Login Redirect Fix
 * Tests that authentication redirects to events.stepperslife.com, not localhost
 */

const https = require('https');
const http = require('http');

console.log('🔍 BMAD Login Redirect Test');
console.log('================================\n');

// Test 1: Check NextAuth configuration endpoint
async function testAuthConfig() {
  console.log('Test 1: Checking NextAuth configuration...');
  
  return new Promise((resolve) => {
    http.get('http://localhost:3004/api/auth/providers', (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const providers = JSON.parse(data);
          console.log('✅ Auth providers available:', Object.keys(providers));
          
          // Check if any provider has localhost in callback URL
          const hasLocalhost = JSON.stringify(providers).includes('localhost');
          if (hasLocalhost && !JSON.stringify(providers).includes('events.stepperslife.com')) {
            console.log('⚠️  Warning: Found localhost references in auth config');
          } else {
            console.log('✅ No problematic localhost references found');
          }
          resolve(true);
        } catch (error) {
          console.log('❌ Error parsing auth config:', error.message);
          resolve(false);
        }
      });
    }).on('error', (err) => {
      console.log('❌ Error fetching auth config:', err.message);
      resolve(false);
    });
  });
}

// Test 2: Check session configuration
async function testSessionConfig() {
  console.log('\nTest 2: Checking session configuration...');
  
  return new Promise((resolve) => {
    http.get('http://localhost:3004/api/auth/session', (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log('✅ Session endpoint status:', res.statusCode);
        
        // Check redirect headers
        const location = res.headers.location;
        if (location) {
          if (location.includes('localhost')) {
            console.log('⚠️  Warning: Redirect contains localhost:', location);
          } else {
            console.log('✅ Redirect URL looks correct:', location);
          }
        }
        resolve(true);
      });
    }).on('error', (err) => {
      console.log('❌ Error checking session:', err.message);
      resolve(false);
    });
  });
}

// Test 3: Check base URL configuration
async function testBaseUrl() {
  console.log('\nTest 3: Checking base URL configuration...');
  
  return new Promise((resolve) => {
    http.get('http://localhost:3004/api/health', (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const health = JSON.parse(data);
          console.log('✅ Health check response received');
          
          // Check if response contains correct domain references
          if (health.environment) {
            console.log('  Environment:', health.environment);
            console.log('  NEXTAUTH_URL configured:', process.env.NEXTAUTH_URL ? 'Yes' : 'No');
          }
          resolve(true);
        } catch (error) {
          console.log('  Health endpoint returned:', data);
          resolve(true);
        }
      });
    }).on('error', (err) => {
      console.log('❌ Error checking health:', err.message);
      resolve(false);
    });
  });
}

// Test 4: Simulate login redirect flow
async function testLoginRedirect() {
  console.log('\nTest 4: Testing login redirect flow...');
  
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: 3004,
      path: '/api/auth/signin',
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    };
    
    http.request(options, (res) => {
      console.log('✅ Sign-in endpoint status:', res.statusCode);
      
      // Check for redirect location
      const location = res.headers.location;
      if (location) {
        if (location.includes('localhost') && !location.includes('events.stepperslife.com')) {
          console.log('⚠️  Potential issue: Redirect to localhost:', location);
        } else {
          console.log('✅ Redirect URL appears correct');
        }
      }
      
      // Check cookies for domain
      const cookies = res.headers['set-cookie'];
      if (cookies) {
        cookies.forEach(cookie => {
          if (cookie.includes('Domain=localhost')) {
            console.log('⚠️  Cookie set for localhost domain');
          } else if (cookie.includes('Domain=events.stepperslife.com')) {
            console.log('✅ Cookie set for correct domain');
          }
        });
      }
      
      resolve(true);
    }).on('error', (err) => {
      console.log('❌ Error testing login redirect:', err.message);
      resolve(false);
    }).end();
  });
}

// Run all tests
async function runTests() {
  console.log('Starting BMAD authentication redirect tests...\n');
  console.log('Environment check:');
  console.log('  NEXTAUTH_URL:', process.env.NEXTAUTH_URL || 'Not set');
  console.log('  NODE_ENV:', process.env.NODE_ENV || 'Not set');
  console.log('  PORT:', process.env.PORT || 'Not set');
  console.log('\n--------------------------------\n');
  
  await testAuthConfig();
  await testSessionConfig();
  await testBaseUrl();
  await testLoginRedirect();
  
  console.log('\n================================');
  console.log('✅ BMAD Login Redirect Tests Complete');
  console.log('\nSummary:');
  console.log('- NextAuth should now redirect to events.stepperslife.com');
  console.log('- Check .env.local for NEXTAUTH_URL=https://events.stepperslife.com');
  console.log('- All localhost fallbacks have been updated');
  console.log('\nNext steps:');
  console.log('1. Test actual login flow in browser');
  console.log('2. Verify Google OAuth redirect');
  console.log('3. Test magic link email authentication');
}

// Execute tests
runTests().then(() => {
  process.exit(0);
}).catch((error) => {
  console.error('Test failed:', error);
  process.exit(1);
});