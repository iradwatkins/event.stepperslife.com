#!/usr/bin/env node

// Test authentication endpoint directly
const fetch = require('node-fetch');

async function testAuthentication() {
  try {
    console.log('🔐 Testing authentication endpoint...');

    // First get CSRF token
    const csrfResponse = await fetch('http://localhost:3004/api/auth/csrf');
    const { csrfToken } = await csrfResponse.json();
    console.log('✅ CSRF token obtained:', csrfToken);

    // Test login
    const loginResponse = await fetch('http://localhost:3004/api/auth/callback/credentials', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        email: 'ira@irawatkins.com',
        password: 'Bobby321!',
        csrfToken,
        callbackUrl: 'http://localhost:3004/dashboard'
      })
    });

    console.log('Login response status:', loginResponse.status);
    console.log('Login response headers:', Object.fromEntries(loginResponse.headers.entries()));

    if (loginResponse.status === 200) {
      console.log('✅ Authentication successful!');
    } else {
      console.log('❌ Authentication failed');
      const responseText = await loginResponse.text();
      console.log('Response body:', responseText.substring(0, 500));
    }

    // Test session endpoint
    const sessionResponse = await fetch('http://localhost:3004/api/auth/session');
    const sessionData = await sessionResponse.json();
    console.log('Session data:', sessionData);

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testAuthentication();