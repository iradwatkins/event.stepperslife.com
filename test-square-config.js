#!/usr/bin/env node

// Test Square configuration loading
require('dotenv').config({ path: '.env.local' });

console.log('🔧 Testing Square configuration...');
console.log('Environment variables:');
console.log('- SQUARE_ACCESS_TOKEN:', process.env.SQUARE_ACCESS_TOKEN ? '✅ Set' : '❌ Missing');
console.log('- NEXT_PUBLIC_SQUARE_APPLICATION_ID:', process.env.NEXT_PUBLIC_SQUARE_APPLICATION_ID ? '✅ Set' : '❌ Missing');
console.log('- NEXT_PUBLIC_SQUARE_LOCATION_ID:', process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID ? '✅ Set' : '❌ Missing');
console.log('- SQUARE_ENVIRONMENT:', process.env.SQUARE_ENVIRONMENT || 'not set');

try {
  const { squareClient, SQUARE_CONFIG } = require('./lib/payments/square.config');

  console.log('\n✅ Square configuration loaded successfully!');
  console.log('Configuration:');
  console.log('- Application ID:', SQUARE_CONFIG.applicationId);
  console.log('- Location ID:', SQUARE_CONFIG.locationId);
  console.log('- Environment:', SQUARE_CONFIG.environment);

  // Test API initialization
  console.log('\n🔌 Testing API clients...');
  console.log('- paymentsApi:', squareClient.paymentsApi ? '✅ Available' : '❌ Missing');
  console.log('- locationsApi:', squareClient.locationsApi ? '✅ Available' : '❌ Missing');
  console.log('- customersApi:', squareClient.customersApi ? '✅ Available' : '❌ Missing');

} catch (error) {
  console.error('❌ Failed to load Square configuration:', error.message);
  console.error('Stack trace:', error.stack);
}