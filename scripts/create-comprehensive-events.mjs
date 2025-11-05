#!/usr/bin/env node

/**
 * Create Comprehensive Event Portfolio
 *
 * Creates a variety of events to showcase all features:
 * 1. Single-day event with standard tickets
 * 2. Multi-day event with day-specific tickets
 * 3. Event with ticket bundles (3-day pass)
 */

import { ConvexHttpClient } from "convex/browser";

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL || "https://fearless-dragon-613.convex.cloud";
const client = new ConvexHttpClient(CONVEX_URL);

console.log("🎯 CREATING COMPREHENSIVE EVENT PORTFOLIO");
console.log("==========================================\n");

const createdEvents = [];

// ==============================================================================
// EVENT 1: SINGLE-DAY EVENT WITH STANDARD TICKETS
// ==============================================================================

console.log("📅 EVENT 1: Single-Day Event with Standard Tickets");
console.log("─".repeat(70));

try {
  const startDate = new Date("2026-02-14T19:00:00-05:00").getTime();
  const endDate = new Date("2026-02-15T01:00:00-05:00").getTime();

  const event1Id = await client.mutation("events/mutations:createEvent", {
    name: "Valentine's Day Steppers Social",
    description: "Celebrate love and dance at our annual Valentine's Day social! Enjoy an evening of romantic stepping, live DJ, complimentary rose for all attendees, and special couple's dance showcase. Dress code: Dressy casual or red/pink attire encouraged.",
    eventType: "TICKETED_EVENT",
    categories: ["Social", "Holiday", "Romance"],
    startDate,
    endDate,
    timezone: "America/New_York",
    eventDateLiteral: "February 14, 2026",
    eventTimeLiteral: "7:00 PM - 1:00 AM",
    eventTimezone: "Eastern Time",
    location: {
      venueName: "The Velvet Room",
      address: "456 Love Lane",
      city: "Charlotte",
      state: "NC",
      zipCode: "28202",
      country: "USA"
    },
    capacity: 300,
    doorPrice: "$40.00",
  });

  console.log(`✅ Event created: ${event1Id}`);
  console.log(`   Name: Valentine's Day Steppers Social`);
  console.log(`   Location: Charlotte, NC`);

  // Create ticket tiers for Event 1
  const event1Tiers = [
    { name: "Early Bird", price: 3000, quantity: 100, description: "Limited early bird pricing - Save $10!" },
    { name: "General Admission", price: 4000, quantity: 150, description: "Standard entry with complimentary rose" },
    { name: "VIP Couples Package", price: 7500, quantity: 50, description: "VIP seating, champagne toast, and professional photo" },
  ];

  for (const tier of event1Tiers) {
    const tierId = await client.mutation("tickets/mutations:createTicketTier", {
      eventId: event1Id,
      ...tier
    });
    console.log(`   ✓ Ticket: ${tier.name} - $${(tier.price / 100).toFixed(2)}`);
  }

  // Configure PREPAY payment (cash model) for testing
  await client.mutation("paymentConfig/mutations:configurePrepayForTesting", {
    eventId: event1Id,
  });
  console.log(`   ✓ Payment configured (PREPAY/Cash)`);

  await client.mutation("events/mutations:publishEvent", { eventId: event1Id });
  console.log(`   ✓ Published\n`);

  createdEvents.push({
    id: event1Id,
    name: "Valentine's Day Steppers Social",
    type: "Single-Day Event",
    tiers: event1Tiers.length,
  });

} catch (error) {
  console.error(`❌ Failed to create Event 1:`, error.message);
}

// ==============================================================================
// EVENT 2: MULTI-DAY EVENT WITH DAY-SPECIFIC TICKETS
// ==============================================================================

console.log("📅 EVENT 2: Multi-Day Event with Day-Specific Tickets");
console.log("─".repeat(70));

try {
  const startDate = new Date("2026-07-04T10:00:00-05:00").getTime();
  const endDate = new Date("2026-07-06T23:00:00-05:00").getTime();

  const event2Id = await client.mutation("events/mutations:createEvent", {
    name: "Independence Day Steppers Festival 2026",
    description: "Join us for the biggest stepping event of the summer! Three days of non-stop stepping, featuring national instructors, competitions, live performances, and evening socials. Workshops during the day, parties at night. Don't miss this epic celebration!",
    eventType: "TICKETED_EVENT",
    categories: ["Festival", "Workshop", "Competition", "Social"],
    startDate,
    endDate,
    timezone: "America/Chicago",
    eventDateLiteral: "July 4-6, 2026",
    eventTimeLiteral: "All Weekend",
    eventTimezone: "Central Time",
    location: {
      venueName: "Chicago Convention Center",
      address: "789 Festival Drive",
      city: "Chicago",
      state: "IL",
      zipCode: "60601",
      country: "USA"
    },
    capacity: 1000,
    doorPrice: "$60.00 per day",
  });

  console.log(`✅ Event created: ${event2Id}`);
  console.log(`   Name: Independence Day Steppers Festival 2026`);
  console.log(`   Location: Chicago, IL`);

  // Create day-specific tickets for Event 2
  const event2Tiers = [
    // Day 1 - Friday
    { name: "Friday Only Pass", price: 4500, quantity: 200, dayNumber: 1, description: "Friday workshops + evening social" },
    { name: "Friday VIP", price: 7500, quantity: 50, dayNumber: 1, description: "Friday VIP access with premium seating" },

    // Day 2 - Saturday
    { name: "Saturday Only Pass", price: 5500, quantity: 200, dayNumber: 2, description: "Saturday workshops, competition, & social" },
    { name: "Saturday VIP", price: 8500, quantity: 50, dayNumber: 2, description: "Saturday VIP with competition front-row seating" },

    // Day 3 - Sunday
    { name: "Sunday Only Pass", price: 4000, quantity: 200, dayNumber: 3, description: "Sunday workshops + farewell social" },
    { name: "Sunday VIP", price: 7000, quantity: 50, dayNumber: 3, description: "Sunday VIP with farewell brunch included" },
  ];

  for (const tier of event2Tiers) {
    const tierId = await client.mutation("tickets/mutations:createTicketTier", {
      eventId: event2Id,
      ...tier
    });
    console.log(`   ✓ Ticket: ${tier.name} - $${(tier.price / 100).toFixed(2)} (Day ${tier.dayNumber})`);
  }

  // Configure PREPAY payment (cash model) for testing
  await client.mutation("paymentConfig/mutations:configurePrepayForTesting", {
    eventId: event2Id,
  });
  console.log(`   ✓ Payment configured (PREPAY/Cash)`);

  await client.mutation("events/mutations:publishEvent", { eventId: event2Id });
  console.log(`   ✓ Published\n`);

  createdEvents.push({
    id: event2Id,
    name: "Independence Day Steppers Festival 2026",
    type: "Multi-Day Event",
    tiers: event2Tiers.length,
  });

} catch (error) {
  console.error(`❌ Failed to create Event 2:`, error.message);
}

// ==============================================================================
// EVENT 3: EVENT WITH TICKET BUNDLE (3-DAY PASS)
// ==============================================================================

console.log("📅 EVENT 3: Multi-Day Event with Bundle Package");
console.log("─".repeat(70));

try {
  const startDate = new Date("2026-09-18T09:00:00-04:00").getTime();
  const endDate = new Date("2026-09-20T22:00:00-04:00").getTime();

  const event3Id = await client.mutation("events/mutations:createEvent", {
    name: "Atlanta Steppers Convention 2026",
    description: "The premier stepping convention returns to Atlanta! Three days of intensive workshops, masterclasses, competitions, and legendary evening socials. Learn from the best instructors in the nation and party with steppers from across the country. Early bird discounts available!",
    eventType: "TICKETED_EVENT",
    categories: ["Convention", "Workshop", "Competition", "Social"],
    startDate,
    endDate,
    timezone: "America/New_York",
    eventDateLiteral: "September 18-20, 2026",
    eventTimeLiteral: "All Weekend",
    eventTimezone: "Eastern Time",
    location: {
      venueName: "Atlanta Marriott Marquis",
      address: "265 Peachtree Center Ave NE",
      city: "Atlanta",
      state: "GA",
      zipCode: "30303",
      country: "USA"
    },
    capacity: 800,
    doorPrice: "$65.00 per day",
  });

  console.log(`✅ Event created: ${event3Id}`);
  console.log(`   Name: Atlanta Steppers Convention 2026`);
  console.log(`   Location: Atlanta, GA`);

  // Create individual day tickets and store their IDs
  const event3Tiers = [
    { name: "Friday Pass", price: 5000, quantity: 150, dayNumber: 1, description: "Friday workshops + opening social" },
    { name: "Saturday Pass", price: 6500, quantity: 150, dayNumber: 2, description: "Saturday workshops, competition + main event social" },
    { name: "Sunday Pass", price: 4500, quantity: 150, dayNumber: 3, description: "Sunday workshops + closing brunch social" },
    { name: "VIP Friday", price: 8000, quantity: 40, dayNumber: 1, description: "VIP Friday with premium seating & meet-and-greet" },
    { name: "VIP Saturday", price: 9500, quantity: 40, dayNumber: 2, description: "VIP Saturday with competition reserved seating" },
    { name: "VIP Sunday", price: 7500, quantity: 40, dayNumber: 3, description: "VIP Sunday with instructor Q&A session" },
  ];

  const createdTierIds = [];
  for (const tier of event3Tiers) {
    const tierId = await client.mutation("tickets/mutations:createTicketTier", {
      eventId: event3Id,
      ...tier
    });
    createdTierIds.push({ id: tierId, ...tier });
    console.log(`   ✓ Ticket: ${tier.name} - $${(tier.price / 100).toFixed(2)}`);
  }

  // Create weekend bundles
  console.log(`\n   Creating bundles...`);

  // Full Weekend Pass Bundle
  const bundle1Id = await client.mutation("bundles/mutations:createTicketBundle", {
    eventId: event3Id,
    name: "Full Weekend Pass",
    description: "All 3 days - Friday, Saturday & Sunday. Save $30 with this bundle!",
    price: 13000, // $130 (individual total would be $160)
    totalQuantity: 200,
    includedTiers: [
      { tierId: createdTierIds[0].id, tierName: createdTierIds[0].name, quantity: 1 }, // Friday
      { tierId: createdTierIds[1].id, tierName: createdTierIds[1].name, quantity: 1 }, // Saturday
      { tierId: createdTierIds[2].id, tierName: createdTierIds[2].name, quantity: 1 }, // Sunday
    ],
  });
  console.log(`   ✓ Bundle: Full Weekend Pass - $130.00 (Save $30!)`);

  // VIP Weekend Bundle
  const bundle2Id = await client.mutation("bundles/mutations:createTicketBundle", {
    eventId: event3Id,
    name: "VIP All-Access Weekend",
    description: "VIP access for all 3 days with exclusive perks. Save $50!",
    price: 20000, // $200 (individual total would be $250)
    totalQuantity: 100,
    includedTiers: [
      { tierId: createdTierIds[3].id, tierName: createdTierIds[3].name, quantity: 1 }, // VIP Friday
      { tierId: createdTierIds[4].id, tierName: createdTierIds[4].name, quantity: 1 }, // VIP Saturday
      { tierId: createdTierIds[5].id, tierName: createdTierIds[5].name, quantity: 1 }, // VIP Sunday
    ],
  });
  console.log(`   ✓ Bundle: VIP All-Access Weekend - $200.00 (Save $50!)`);

  // Configure PREPAY payment (cash model) for testing
  await client.mutation("paymentConfig/mutations:configurePrepayForTesting", {
    eventId: event3Id,
  });
  console.log(`   ✓ Payment configured (PREPAY/Cash)`);

  await client.mutation("events/mutations:publishEvent", { eventId: event3Id });
  console.log(`   ✓ Published\n`);

  createdEvents.push({
    id: event3Id,
    name: "Atlanta Steppers Convention 2026",
    type: "Multi-Day Event with Bundles",
    tiers: event3Tiers.length,
    bundles: 2,
  });

} catch (error) {
  console.error(`❌ Failed to create Event 3:`, error.message);
  console.error(error);
}

// ==============================================================================
// FINAL SUMMARY
// ==============================================================================

console.log("=".repeat(70));
console.log("🎉 EVENT CREATION COMPLETE!");
console.log("=".repeat(70));

console.log(`\n📊 Created ${createdEvents.length} events:\n`);

createdEvents.forEach((event, index) => {
  console.log(`${index + 1}. ${event.name}`);
  console.log(`   Type: ${event.type}`);
  console.log(`   Ticket Tiers: ${event.tiers}`);
  if (event.bundles) console.log(`   Bundles: ${event.bundles}`);
  console.log(`   🔗 View: https://events.stepperslife.com/events/${event.id}`);
  console.log(``);
});

console.log("✅ All events are now LIVE on your website!");
console.log("📱 Visit: https://events.stepperslife.com/events");
console.log("\n⚠️  Note: Payment configuration must be set up via the UI for each event");
console.log("   to enable ticket purchases.");
