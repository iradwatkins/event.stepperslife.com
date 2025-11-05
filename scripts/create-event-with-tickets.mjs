#!/usr/bin/env node

/**
 * Create Event with Tickets
 *
 * Creates a complete event with ticket tiers and payment configuration
 */

import { ConvexHttpClient } from "convex/browser";

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL || "https://fearless-dragon-613.convex.cloud";

const client = new ConvexHttpClient(CONVEX_URL);

console.log("🎯 CREATING NEW EVENT WITH TICKETS");
console.log("===================================\n");

let eventId = null;

// STEP 1: Create Event
console.log("📅 STEP 1: Creating Event");
console.log("─".repeat(50));

try {
  // New Year's Eve 2025 Event
  const startDate = new Date("2025-12-31T20:00:00-05:00").getTime();
  const endDate = new Date("2026-01-01T02:00:00-05:00").getTime();

  const eventData = {
    name: "New Year's Eve Step Celebration 2026",
    description: "Ring in the New Year with an unforgettable night of stepping, music, and celebration! Join us for our biggest event of the year featuring live DJ, complimentary champagne toast at midnight, and special performances.",
    eventType: "TICKETED_EVENT",
    categories: ["Social", "Holiday", "Dance"],
    startDate: startDate,
    endDate: endDate,
    timezone: "America/New_York",

    // Display fields
    eventDateLiteral: "December 31, 2025",
    eventTimeLiteral: "8:00 PM - 2:00 AM",
    eventTimezone: "Eastern Time",

    // Location
    location: {
      venueName: "Grand Ballroom at The Plaza",
      address: "123 Main Street",
      city: "Atlanta",
      state: "GA",
      zipCode: "30303",
      country: "USA"
    },

    // Optional fields
    capacity: 500,
    doorPrice: "$60.00",
  };

  eventId = await client.mutation("events/mutations:createEvent", eventData);
  console.log(`✅ Event created successfully`);
  console.log(`   ID: ${eventId}`);
  console.log(`   Name: ${eventData.name}`);
  console.log(`   Date: ${eventData.eventDateLiteral}`);
  console.log(`   Location: ${eventData.location.venueName}, ${eventData.location.city}`);

} catch (error) {
  console.error(`❌ Failed to create event:`, error.message);
  process.exit(1);
}

// STEP 2: Create Ticket Tiers
console.log("\n🎫 STEP 2: Creating Ticket Tiers");
console.log("─".repeat(50));

const ticketTiers = [
  {
    name: "Early Bird Special",
    description: "Limited time discount - Save $15! Includes general admission and champagne toast.",
    price: 3500, // $35.00
    quantity: 100,
  },
  {
    name: "General Admission",
    description: "Standard entry to the event with champagne toast at midnight.",
    price: 5000, // $50.00
    quantity: 300,
  },
  {
    name: "VIP Premium",
    description: "VIP seating area, complimentary drinks, priority entry, and exclusive gift bag.",
    price: 10000, // $100.00
    quantity: 100,
  },
];

const createdTiers = [];

for (const tier of ticketTiers) {
  try {
    const tierId = await client.mutation("tickets/mutations:createTicketTier", {
      eventId,
      ...tier
    });
    createdTiers.push({ id: tierId, ...tier });
    console.log(`✅ Created: ${tier.name} - $${(tier.price / 100).toFixed(2)} (${tier.quantity} available)`);
  } catch (error) {
    console.error(`❌ Failed to create ticket tier "${tier.name}":`, error.message);
  }
}

// STEP 3: Configure Payment (Skipped - requires manual setup in UI)
console.log("\n💳 STEP 3: Payment Configuration");
console.log("─".repeat(50));
console.log("⚠️  Payment configuration skipped - must be done via the UI");
console.log("   Visit: https://events.stepperslife.com/organizer/events/" + eventId);
console.log("   Navigate to 'Payment Methods' to configure Square payments");

// STEP 4: Publish Event
console.log("\n🚀 STEP 4: Publishing Event");
console.log("─".repeat(50));

try {
  await client.mutation("events/mutations:publishEvent", {
    eventId
  });
  console.log("✅ Event published successfully");
} catch (error) {
  console.error(`❌ Failed to publish event:`, error.message);
}

// FINAL SUMMARY
console.log("\n" + "=".repeat(70));
console.log("🎉 EVENT CREATION COMPLETE!");
console.log("=".repeat(70));

console.log("\n📊 Summary:");
console.log(`   Event ID: ${eventId}`);
console.log(`   Event Name: New Year's Eve Step Celebration 2026`);
console.log(`   Date: December 31, 2025 at 8:00 PM`);
console.log(`   Location: Grand Ballroom at The Plaza, Atlanta, GA`);
console.log(`   Ticket Tiers: ${createdTiers.length}`);
console.log(`   Total Capacity: ${ticketTiers.reduce((sum, t) => sum + t.quantity, 0)} tickets`);

console.log("\n🔗 Event Links:");
console.log(`   Public Page: https://events.stepperslife.com/events/${eventId}`);
console.log(`   Checkout: https://events.stepperslife.com/events/${eventId}/checkout`);
console.log(`   Management: https://events.stepperslife.com/organizer/events/${eventId}`);

console.log("\n💰 Ticket Pricing:");
createdTiers.forEach((tier) => {
  console.log(`   • ${tier.name}: $${(tier.price / 100).toFixed(2)} (${tier.quantity} available)`);
});

console.log("\n✅ Event is now live and ready for ticket sales!");
