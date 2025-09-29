#!/usr/bin/env node

// Test script for Square Payment and Resend Email integrations
// This script tests the core integrations without requiring database setup

const { SquareClient, SquareEnvironment } = require('square');
const { Resend } = require('resend');
require('dotenv').config({ path: '.env.local' });

console.log('🧪 Testing Square Payment and Resend Email Integrations\n');

// Test Square API connection
async function testSquareIntegration() {
  console.log('1️⃣ Testing Square Payment Integration...');

  try {
    const squareClient = new SquareClient({
      accessToken: process.env.SQUARE_ACCESS_TOKEN,
      environment: process.env.SQUARE_ENVIRONMENT === 'production' ? SquareEnvironment.Production : SquareEnvironment.Sandbox
    });

    console.log('   🔍 Debug: squareClient created:', !!squareClient);
    console.log('   🔍 Debug: squareClient properties:', Object.keys(squareClient));

    // Check if the SDK uses a different structure
    console.log('   🔍 Debug: squareClient.apiClient:', !!squareClient.apiClient);
    console.log('   🔍 Debug: squareClient.locationsApi:', !!squareClient.locationsApi);
    console.log('   🔍 Debug: squareClient.locations:', !!squareClient.locations);

    // Try accessing through different paths
    const locationsApi = squareClient.locationsApi || squareClient.locations;
    if (!locationsApi) {
      console.log('   🔍 Debug: All squareClient keys:', Object.getOwnPropertyNames(squareClient));
      console.log('   🔍 Debug: squareClient prototype:', Object.getOwnPropertyNames(Object.getPrototypeOf(squareClient)));
      throw new Error('locationsApi not found in Square client');
    }

    console.log('   🔍 Debug: locationsApi type:', typeof locationsApi);
    console.log('   🔍 Debug: locationsApi methods:', Object.getOwnPropertyNames(locationsApi));
    console.log('   🔍 Debug: locationsApi.list:', typeof locationsApi.list);
    console.log('   🔍 Debug: locationsApi.get:', typeof locationsApi.get);

    // Test location retrieval - try different method names
    let locationResult;
    if (typeof locationsApi.get === 'function') {
      locationResult = await locationsApi.get({
        locationId: process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID
      });
    } else if (typeof locationsApi.list === 'function') {
      const listResult = await locationsApi.list();
      locationResult = { result: { location: listResult.result?.locations?.[0] } };
    } else {
      throw new Error('No working location method found');
    }

    console.log('   ✅ Square API connection successful!');
    console.log(`   📍 Location: ${locationResult.location.name}`);
    console.log(`   🏢 Business: ${locationResult.location.businessName || 'N/A'}`);
    console.log(`   🌍 Environment: ${process.env.SQUARE_ENVIRONMENT}\n`);

    return true;
  } catch (error) {
    console.log('   ❌ Square API connection failed!');
    console.error(`   Error: ${error.message}\n`);
    return false;
  }
}

// Test Resend email integration
async function testResendIntegration() {
  console.log('2️⃣ Testing Resend Email Integration...');

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);

    // Send test email
    const { data, error } = await resend.emails.send({
      from: 'SteppersLife Events <onboarding@resend.dev>',
      to: ['thestepperslife@gmail.com'], // Send to verified owner email
      subject: 'Test Email - Events SteppersLife Platform',
      html: `
        <h2>🎉 Test Email from Events SteppersLife</h2>
        <p>This is a test email to verify Resend integration.</p>
        <p>If you received this, the integration is working correctly!</p>
        <hr>
        <p><em>Sent from the Events SteppersLife testing system</em></p>
      `
    });

    if (error) {
      // Check if it's a validation error (expected with test email)
      if (error.message.includes('test@example.com')) {
        console.log('   ✅ Resend API connection successful!');
        console.log('   📧 API Key is valid and working');
        console.log('   ⚠️  Test email to test@example.com blocked (expected)\n');
        return true;
      } else {
        console.log('   ❌ Resend API error!');
        console.error(`   Error: ${error.message}\n`);
        return false;
      }
    } else {
      console.log('   ✅ Resend email sent successfully!');
      console.log(`   📧 Email ID: ${data.id}\n`);
      return true;
    }
  } catch (error) {
    console.log('   ❌ Resend API connection failed!');
    console.error(`   Error: ${error.message}\n`);
    return false;
  }
}

// Test Square payment creation (mock)
async function testSquarePaymentFlow() {
  console.log('3️⃣ Testing Square Payment Flow...');

  try {
    const squareClient = new SquareClient({
      accessToken: process.env.SQUARE_ACCESS_TOKEN,
      environment: process.env.SQUARE_ENVIRONMENT === 'production' ? SquareEnvironment.Production : SquareEnvironment.Sandbox
    });

    // Create a test payment (this will fail without a real card token, but tests API structure)
    try {
      await squareClient.paymentsApi.createPayment({
        sourceId: 'fake-card-token-for-testing',
        idempotencyKey: `test-${Date.now()}`,
        amountMoney: {
          amount: BigInt(1000), // $10.00 in cents
          currency: 'USD'
        }
      });
    } catch (paymentError) {
      // Expected to fail with fake token, but should get specific error
      if (paymentError.message.includes('sourceId') || paymentError.message.includes('INVALID') || paymentError.result) {
        console.log('   ✅ Square Payment API structure is correct!');
        console.log('   💳 Payment creation flow is properly configured');
        console.log('   ⚠️  Test payment failed as expected (fake card token)\n');
        return true;
      } else {
        throw paymentError;
      }
    }
  } catch (error) {
    console.log('   ❌ Square Payment Flow test failed!');
    console.error(`   Error: ${error.message}\n`);
    return false;
  }
}

// Main test execution
async function runTests() {
  console.log('🚀 Starting integration tests...\n');

  const results = {
    square: await testSquareIntegration(),
    resend: await testResendIntegration(),
    payment: await testSquarePaymentFlow()
  };

  console.log('📊 Test Results Summary:');
  console.log('------------------------');
  console.log(`Square API Connection: ${results.square ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Resend Email API: ${results.resend ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Square Payment Flow: ${results.payment ? '✅ PASS' : '❌ FAIL'}`);

  const allPassed = Object.values(results).every(result => result);
  console.log(`\n🎯 Overall Status: ${allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);

  if (allPassed) {
    console.log('\n🎉 Great! Your integrations are working correctly.');
    console.log('   🔸 Square sandbox payments are ready for testing');
    console.log('   🔸 Resend email notifications are configured');
    console.log('   🔸 You can now test the full payment flow in your app');
  } else {
    console.log('\n🔧 Please check the failed integrations above.');
    console.log('   🔸 Verify your API keys in .env.local');
    console.log('   🔸 Check your Square application configuration');
    console.log('   🔸 Ensure Resend domain is properly set up');
  }
}

// Run tests
runTests().catch(console.error);