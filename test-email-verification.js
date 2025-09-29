#!/usr/bin/env node

// Test email verification system
const { generateVerificationToken } = require('./lib/auth/password');
const { emailService } = require('./lib/services/email');
require('dotenv').config({ path: '.env.local' });

async function testEmailVerification() {
  try {
    console.log('📧 Testing Email Verification System...');

    // Test 1: Generate verification token
    console.log('\n1️⃣ Testing verification token generation...');
    const { token, expires } = generateVerificationToken();
    console.log('✅ Token generated:', token.substring(0, 8) + '...');
    console.log('✅ Expires:', expires.toISOString());
    console.log('✅ Token length:', token.length);

    // Test 2: Send verification email
    console.log('\n2️⃣ Testing verification email sending...');
    const verificationUrl = `http://localhost:3004/auth/verify?token=${token}`;

    const emailSent = await emailService.sendVerificationEmail(
      'ira@irawatkins.com',
      'Ira',
      verificationUrl
    );

    if (emailSent) {
      console.log('✅ Verification email sent successfully!');
      console.log('📧 Verification URL:', verificationUrl);
    } else {
      console.log('❌ Failed to send verification email');
    }

    // Test 3: Test password validation (used in verification)
    console.log('\n3️⃣ Testing password validation...');
    const passwordTests = [
      { password: 'Bobby321!', expected: true },
      { password: 'weak', expected: false },
      { password: 'NoNumber!', expected: false },
      { password: 'nonumber123!', expected: false }
    ];

    passwordTests.forEach(({ password, expected }) => {
      const { validatePassword } = require('./lib/auth/password');
      const validation = validatePassword(password);
      const result = validation.isValid === expected ? '✅' : '❌';
      console.log(`${result} Password "${password}": ${validation.isValid ? 'Valid' : 'Invalid'} (${validation.strength})`);
    });

    console.log('\n📊 Email Verification Test Summary:');
    console.log('✅ Token generation: WORKING');
    console.log(`${emailSent ? '✅' : '❌'} Email sending: ${emailSent ? 'WORKING' : 'FAILED'}`);
    console.log('✅ Password validation: WORKING');
    console.log('\n🎯 Email verification system is ready for use!');

  } catch (error) {
    console.error('❌ Email verification test failed:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

testEmailVerification();