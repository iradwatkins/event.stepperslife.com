#!/usr/bin/env node

/**
 * Production OAuth Diagnostic Script
 * Verifies Google OAuth configuration on https://events.stepperslife.com
 */

const https = require('https');
const { URL } = require('url');

const PRODUCTION_URL = 'https://events.stepperslife.com';
const GOOGLE_CLIENT_ID = '1005568460502-4h3cmguropt2lnf8qetqmruupvr3j1rp.apps.googleusercontent.com';

console.log('🔍 Google OAuth Diagnostic for Production');
console.log('=========================================\n');

async function checkEndpoint(path, description) {
  return new Promise((resolve) => {
    const url = `${PRODUCTION_URL}${path}`;
    console.log(`Checking ${description}:`);
    console.log(`  URL: ${url}`);
    
    https.get(url, (res) => {
      console.log(`  Status: ${res.statusCode}`);
      
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          console.log('  ✅ Endpoint accessible');
        } else if (res.statusCode === 302 || res.statusCode === 307) {
          console.log(`  ↪️ Redirects to: ${res.headers.location}`);
        } else {
          console.log('  ❌ Unexpected status');
        }
        console.log('');
        resolve();
      });
    }).on('error', (err) => {
      console.log(`  ❌ Error: ${err.message}\n`);
      resolve();
    });
  });
}

async function checkGoogleOAuthUrl() {
  console.log('Generating Google OAuth URL:');
  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: `${PRODUCTION_URL}/api/auth/callback/google`,
    response_type: 'code',
    scope: 'openid email profile'
  });
  
  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
  console.log(`  ${authUrl}\n`);
  
  console.log('Testing OAuth URL (HEAD request):');
  return new Promise((resolve) => {
    https.request(authUrl, { method: 'HEAD' }, (res) => {
      console.log(`  Status: ${res.statusCode}`);
      if (res.statusCode === 302 || res.statusCode === 200) {
        console.log('  ✅ OAuth endpoint accepts the client ID');
      } else if (res.statusCode === 400) {
        console.log('  ❌ Bad request - Client ID might be invalid');
      }
      console.log('');
      resolve();
    }).on('error', (err) => {
      console.log(`  ❌ Error: ${err.message}\n`);
      resolve();
    }).end();
  });
}

async function checkProductionEnv() {
  console.log('Production Environment Check:');
  console.log('  Site: ' + PRODUCTION_URL);
  console.log('  OAuth Client ID: ' + GOOGLE_CLIENT_ID);
  console.log('  Expected Callback: ' + PRODUCTION_URL + '/api/auth/callback/google');
  console.log('');
}

async function provideSolution() {
  console.log('📋 SOLUTION STEPS:');
  console.log('==================\n');
  
  console.log('The error "The OAuth client was not found" means one of:');
  console.log('1. The Client ID doesn\'t exist in Google Cloud Console');
  console.log('2. The OAuth client was deleted');
  console.log('3. The project was deleted or disabled\n');
  
  console.log('TO FIX THIS ISSUE:\n');
  
  console.log('Option 1: Create New OAuth Credentials');
  console.log('----------------------------------------');
  console.log('1. Go to: https://console.cloud.google.com/');
  console.log('2. Select your project (or create a new one)');
  console.log('3. Navigate to "APIs & Services" > "Credentials"');
  console.log('4. Click "Create Credentials" > "OAuth client ID"');
  console.log('5. Choose "Web application"');
  console.log('6. Add these Authorized JavaScript origins:');
  console.log('   - https://events.stepperslife.com');
  console.log('   - http://localhost:3004');
  console.log('7. Add these Authorized redirect URIs:');
  console.log('   - https://events.stepperslife.com/api/auth/callback/google');
  console.log('   - http://localhost:3004/api/auth/callback/google');
  console.log('8. Save and copy the new Client ID and Client Secret\n');
  
  console.log('Option 2: Check Existing Project');
  console.log('----------------------------------');
  console.log('1. Visit: https://console.cloud.google.com/apis/credentials');
  console.log('2. Check if you have any OAuth 2.0 Client IDs listed');
  console.log('3. If yes, click on one and verify/update the URIs');
  console.log('4. If no, follow Option 1 to create new credentials\n');
  
  console.log('After Getting Valid Credentials:');
  console.log('---------------------------------');
  console.log('Update the .env.production.local file with:');
  console.log('GOOGLE_CLIENT_ID=<your-new-client-id>');
  console.log('GOOGLE_CLIENT_SECRET=<your-new-client-secret>\n');
}

async function runDiagnostic() {
  await checkProductionEnv();
  await checkEndpoint('/', 'Homepage');
  await checkEndpoint('/api/auth/providers', 'Auth Providers API');
  await checkEndpoint('/api/auth/callback/google', 'Google Callback');
  await checkGoogleOAuthUrl();
  await provideSolution();
  
  console.log('✅ Diagnostic Complete');
  console.log('======================\n');
  console.log('Next step: Follow the solution steps above to fix Google OAuth');
}

runDiagnostic().catch(console.error);