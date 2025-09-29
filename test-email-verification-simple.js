#!/usr/bin/env node

// Simple test for email verification endpoint
const fetch = require('node-fetch');
require('dotenv').config({ path: '.env.local' });

async function testEmailVerificationEndpoint() {
  try {
    console.log('📧 Testing Email Verification Endpoint...');

    // Test the registration endpoint (which should trigger verification email)
    console.log('\n1️⃣ Testing user registration endpoint...');

    const registerData = {
      email: 'test-user@example.com',
      password: 'TestPassword123!',
      firstName: 'Test',
      lastName: 'User',
      confirmPassword: 'TestPassword123!'
    };

    const registerResponse = await fetch('http://localhost:3004/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(registerData)
    });

    console.log('Registration response status:', registerResponse.status);
    const registerResult = await registerResponse.text();
    console.log('Registration response:', registerResult.substring(0, 200));

    // Test verification email endpoint
    console.log('\n2️⃣ Testing verification email request...');

    const verifyEmailData = {
      email: 'ira@irawatkins.com'
    };

    const verifyResponse = await fetch('http://localhost:3004/api/auth/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(verifyEmailData)
    });

    console.log('Verify email response status:', verifyResponse.status);
    const verifyResult = await verifyResponse.text();
    console.log('Verify email response:', verifyResult.substring(0, 200));

    // Test password reset request (also uses email)
    console.log('\n3️⃣ Testing password reset email...');

    const resetData = {
      email: 'ira@irawatkins.com'
    };

    const resetResponse = await fetch('http://localhost:3004/api/auth/reset-password/request', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(resetData)
    });

    console.log('Reset email response status:', resetResponse.status);
    const resetResult = await resetResponse.text();
    console.log('Reset email response:', resetResult.substring(0, 200));

    console.log('\n📊 Email Verification Endpoint Test Summary:');
    console.log(`Registration endpoint: ${registerResponse.status === 200 ? '✅' : '❌'} (${registerResponse.status})`);
    console.log(`Verification endpoint: ${verifyResponse.status === 200 ? '✅' : '❌'} (${verifyResponse.status})`);
    console.log(`Reset email endpoint: ${resetResponse.status === 200 ? '✅' : '❌'} (${resetResponse.status})`);

  } catch (error) {
    console.error('❌ Email verification endpoint test failed:', error.message);
  }
}

testEmailVerificationEndpoint();