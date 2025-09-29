#!/usr/bin/env node

// Test event creation with proper data
const fetch = require('node-fetch');

async function testEventCreation() {
  console.log('🎯 Testing Event Creation...\n');

  try {
    // Test data for event
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

    console.log('📝 Event Data:');
    console.log(JSON.stringify(eventData, null, 2));
    console.log('\n🚀 Sending request to API...\n');

    const response = await fetch('http://localhost:3004/api/events', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(eventData)
    });

    const result = await response.json();

    if (response.ok) {
      console.log('✅ Event created successfully!');
      console.log('Event ID:', result.event?.id);
      console.log('Event Title:', result.event?.title);
      console.log('Venue:', result.event?.venue?.name);
    } else {
      console.log('❌ Error creating event:');
      console.log('Status:', response.status);
      console.log('Error:', result.error);
      if (result.errors) {
        console.log('Validation errors:');
        result.errors.forEach(err => {
          console.log(`  - ${err.field}: ${err.message}`);
        });
      }
    }

  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
}

testEventCreation();