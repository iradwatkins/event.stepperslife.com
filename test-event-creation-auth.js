#!/usr/bin/env node

// Test event creation with authentication
const fetch = require('node-fetch');

async function testEventCreation() {
  console.log('🎯 Testing Event Creation with Authentication...\n');

  try {
    // First, get CSRF token
    console.log('1️⃣ Getting CSRF token...');
    const csrfResponse = await fetch('http://localhost:3004/api/auth/csrf', {
      credentials: 'include'
    });
    const { csrfToken } = await csrfResponse.json();
    console.log('   ✅ CSRF token received');

    // Login
    console.log('\n2️⃣ Logging in as admin...');
    const loginResponse = await fetch('http://localhost:3004/api/auth/callback/credentials', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'ira@irawatkins.com',
        password: 'Admin123!',
        csrfToken: csrfToken,
        callbackUrl: 'http://localhost:3004'
      }),
      credentials: 'include'
    });

    if (loginResponse.ok) {
      console.log('   ✅ Logged in successfully');

      // Get cookies from login response
      const setCookies = loginResponse.headers.raw()['set-cookie'];
      const cookies = setCookies ? setCookies.join('; ') : '';

      // Test event data
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7); // 7 days from now
      const eventDate = futureDate.toISOString().split('T')[0];

      const eventData = {
        title: 'Saturday Night Steppers Social',
        description: 'Join us for an exciting night of stepping! Live DJ, great music, and amazing vibes.',
        category: 'SOCIAL',
        eventDate: eventDate,
        startTime: '20:00',
        endTime: '23:59',
        venueName: 'Chicago Community Center',
        venueAddress: '123 Main St, Chicago, IL 60601',
        ticketPrice: 25.00,
        earlyBirdPrice: 20.00,
        capacity: 150,
        isPublished: false,
        visibility: 'PUBLIC'
      };

      console.log('\n3️⃣ Creating event...');
      console.log('   Event Title:', eventData.title);
      console.log('   Event Date:', eventData.eventDate);
      console.log('   Venue:', eventData.venueName);

      const eventResponse = await fetch('http://localhost:3004/api/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': cookies
        },
        body: JSON.stringify(eventData),
        credentials: 'include'
      });

      const result = await eventResponse.json();

      if (eventResponse.ok) {
        console.log('\n✅ Event created successfully!');
        console.log('   Event ID:', result.event?.id);
        console.log('   Event Title:', result.event?.title);
        console.log('   Venue:', result.event?.venue?.name);
        console.log('   Status:', result.event?.status);
      } else {
        console.log('\n❌ Error creating event:');
        console.log('   Status:', eventResponse.status);
        console.log('   Error:', result.error);
        if (result.errors) {
          console.log('   Validation errors:');
          result.errors.forEach(err => {
            console.log(`     - ${err.field}: ${err.message}`);
          });
        }
      }
    } else {
      console.log('   ❌ Login failed:', loginResponse.status);
    }

  } catch (error) {
    console.error('❌ Test error:', error.message);
    console.error('Stack:', error.stack);
  }
}

testEventCreation();