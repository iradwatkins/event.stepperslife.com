#!/usr/bin/env node

/**
 * FORCE DELETE ALL EVENTS
 *
 * ⚠️  DANGER! This will delete ALL events in the database,
 * including events with tickets sold, orders, etc.
 *
 * Use only for testing/cleanup purposes.
 */

import { ConvexHttpClient } from "convex/browser";

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL || "https://fearless-dragon-613.convex.cloud";

const client = new ConvexHttpClient(CONVEX_URL);

console.log("⚠️  FORCE DELETE ALL EVENTS - DANGER!");
console.log("=====================================\n");

async function forceDeleteAll() {
  try {
    // Get count of events first
    console.log("📋 Checking database...");
    const events = await client.query("events/queries:getOrganizerEvents");
    console.log(`Found ${events.length} total events in database\n`);

    if (events.length === 0) {
      console.log("✅ Database is already clean (no events found)");
      return;
    }

    // Show what will be deleted
    console.log("Events to be FORCE DELETED:\n");
    events.forEach((event, index) => {
      console.log(`  ${index + 1}. ${event.name}`);
      console.log(`     ID: ${event._id}`);
      console.log(`     Status: ${event.status}`);
      console.log(`     Type: ${event.eventType}`);
      console.log("");
    });

    console.log("⚠️  WARNING: About to FORCE DELETE all events!");
    console.log("⚠️  This includes events with tickets sold!");
    console.log("⚠️  This action cannot be undone!\n");

    // Execute force delete
    console.log("🗑️  Executing FORCE DELETE...\n");
    const result = await client.mutation("events/mutations:forceDeleteAllEvents", {});

    console.log("\n" + "=".repeat(50));
    console.log("📊 FORCE DELETE SUMMARY");
    console.log("=".repeat(50));
    console.log(`✅ Successfully deleted: ${result.deletedCount} events`);

    if (result.failedCount > 0) {
      console.log(`❌ Failed to delete: ${result.failedCount} events\n`);
      console.log("Failed events:");
      result.failedEvents.forEach(({ eventId, reason }) => {
        const event = events.find(e => e._id === eventId);
        console.log(`  - ${event?.name || eventId}: ${reason}`);
      });
    }

    if (result.deletedCount > 0) {
      console.log("\n✅ All events have been FORCE DELETED from the database!");
    }

  } catch (error) {
    console.error("\n❌ Error during force delete:", error);
    if (error.message) {
      console.error(`   Details: ${error.message}`);
    }
    process.exit(1);
  }
}

await forceDeleteAll();
