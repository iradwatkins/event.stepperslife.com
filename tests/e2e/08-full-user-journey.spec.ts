/**
 * Full User Journey E2E Tests
 * Tests complete end-to-end scenarios with REAL data:
 * - Complete attendee journey: register → browse → purchase → manage tickets
 * - Complete organizer journey: register → create event → publish → manage
 * - Complex scenarios: cancellations, refunds, transfers in realistic context
 *
 * @integration End-to-End Scenarios
 */

import { test, expect } from './fixtures/test-fixtures';

test.describe('Full User Journey (END-TO-END)', () => {
  test.beforeAll(async () => {
    console.log('🧪 Starting Full User Journey Tests...');
    console.log('='.repeat(60));
  });

  test.afterAll(async () => {
    console.log('='.repeat(60));
    console.log('✅ Full User Journey Tests Complete');
  });

  test('complete attendee journey: register → browse → purchase → refund', async ({
    page,
    testData,
    authHelper,
    squareHelper,
    prisma
  }) => {
    console.log('📝 Test: Complete attendee journey');
    console.log('🎭 Scenario: New user discovers event, purchases ticket, then requests refund');
    console.log('='.repeat(60));

    // SETUP: Create organizer and published event
    const organizer = testData.generateUser('organizer');
    const createdOrganizer = await authHelper.createUserInDatabase(organizer);

    const event = await prisma.event.create({
      data: {
        name: 'Summer Music Festival 2025',
        slug: `summer-festival-${Date.now()}`,
        description: 'The biggest music festival of the summer!',
        startDate: new Date(Date.now() + 30 * 86400000), // 30 days from now
        endDate: new Date(Date.now() + 32 * 86400000),
        status: 'PUBLISHED',
        eventType: 'GENERAL_ADMISSION',
        organizerId: createdOrganizer.id,
      },
    });

    await prisma.ticketType.create({
      data: {
        name: 'Weekend Pass',
        price: 150.00,
        quantity: 500,
        sold: 0,
        eventId: event.id,
      },
    });

    console.log(`✅ Event created and published: ${event.name}`);
    console.log('');

    // STEP 1: User Registration
    console.log('👤 STEP 1: New user registers');
    console.log('-'.repeat(60));

    const attendee = testData.generateUser('attendee');

    await page.goto('/auth/register');
    await page.fill('input[name="name"]', attendee.name);
    await page.fill('input[name="email"]', attendee.email);
    await page.fill('input[name="password"]', attendee.password);
    await page.fill('input[name="confirmPassword"]', attendee.password);
    await page.click('button[type="submit"]');

    await page.waitForTimeout(5000);

    console.log(`   ✅ Registered: ${attendee.email}`);

    // Verify user in database
    const createdUser = await prisma.user.findUnique({
      where: { email: attendee.email },
    });

    expect(createdUser).toBeTruthy();
    console.log(`   ✅ User ID: ${createdUser?.id}`);
    console.log('');

    // STEP 2: Browse and discover event
    console.log('🔍 STEP 2: Browse events and find Summer Festival');
    console.log('-'.repeat(60));

    await page.goto('/events');
    await expect(page.locator(`text=${event.name}`)).toBeVisible();

    console.log(`   ✅ Event found on events page`);

    // Click event to view details
    await page.click(`text=${event.name}`);
    await page.waitForTimeout(2000);

    console.log(`   ✅ Viewing event details`);
    console.log('');

    // STEP 3: Purchase ticket
    console.log('💳 STEP 3: Purchase Weekend Pass ticket');
    console.log('-'.repeat(60));

    await page.click('button:has-text("Get Tickets")');
    await page.waitForTimeout(3000);

    // Fill payment
    await squareHelper.fillPaymentForm(page, 'success');
    await squareHelper.submitPayment(page);

    console.log(`   ⏳ Processing payment...`);

    const success = await squareHelper.waitForPaymentSuccess(page, 45000);
    expect(success).toBe(true);

    console.log(`   ✅ Payment successful`);

    // Verify order created
    const order = await prisma.order.findFirst({
      where: {
        userId: createdUser?.id,
        eventId: event.id,
      },
      include: {
        tickets: true,
        payment: true,
      },
    });

    expect(order).toBeTruthy();
    expect(order?.status).toBe('COMPLETED');

    console.log(`   ✅ Order created: ${order?.orderNumber}`);
    console.log(`   ✅ Total paid: $${order?.total}`);
    console.log(`   ✅ Ticket generated: ${order?.tickets[0]?.ticketNumber}`);
    console.log('');

    // STEP 4: View tickets in dashboard
    console.log('🎫 STEP 4: View purchased tickets');
    console.log('-'.repeat(60));

    await page.goto('/dashboard/tickets');
    await expect(page.locator(`text=${event.name}`)).toBeVisible();

    console.log(`   ✅ Ticket visible in My Tickets dashboard`);
    console.log('');

    // STEP 5: Request refund
    console.log('↩️  STEP 5: Change of plans - request refund');
    console.log('-'.repeat(60));

    await page.goto(`/dashboard/orders/${order?.id}`);
    await page.click('button:has-text("Refund")');
    await page.waitForTimeout(2000);

    try {
      await page.fill('textarea[name="reason"]', 'Change of plans, cannot attend');
    } catch {
      console.log('   ℹ️  Reason field optional');
    }

    await page.click('button:has-text("Request Refund")');

    console.log(`   ⏳ Processing refund...`);

    await page.waitForTimeout(10000);

    // Verify refund created
    const refund = await prisma.refund.findFirst({
      where: { orderId: order?.id },
    });

    expect(refund).toBeTruthy();
    console.log(`   ✅ Refund created: ${refund?.id}`);
    console.log(`   ✅ Refund amount: $${refund?.amount}`);
    console.log(`   ✅ Refund status: ${refund?.status}`);

    // Verify ticket cancelled
    const updatedTicket = await prisma.ticket.findUnique({
      where: { id: order?.tickets[0]?.id },
    });

    expect(updatedTicket?.status).toBe('CANCELLED');
    console.log(`   ✅ Ticket status: ${updatedTicket?.status}`);
    console.log('');

    console.log('🎉 COMPLETE ATTENDEE JOURNEY VERIFIED!');
    console.log('   ✅ Registration → Discovery → Purchase → Refund');
    console.log('='.repeat(60));
  });

  test('complete organizer journey: register → create → publish → sell → cancel', async ({
    page,
    testData,
    authHelper,
    prisma
  }) => {
    console.log('📝 Test: Complete organizer journey');
    console.log('🎭 Scenario: New organizer creates event, sells tickets, then cancels');
    console.log('='.repeat(60));

    // STEP 1: Organizer Registration
    console.log('👤 STEP 1: New organizer registers');
    console.log('-'.repeat(60));

    const organizer = testData.generateUser('organizer');

    await page.goto('/auth/register');
    await page.fill('input[name="name"]', organizer.name);
    await page.fill('input[name="email"]', organizer.email);
    await page.fill('input[name="password"]', organizer.password);
    await page.fill('input[name="confirmPassword"]', organizer.password);
    await page.click('button[type="submit"]');

    await page.waitForTimeout(5000);

    console.log(`   ✅ Registered organizer: ${organizer.email}`);

    const createdOrganizer = await prisma.user.findUnique({
      where: { email: organizer.email },
    });

    expect(createdOrganizer).toBeTruthy();
    console.log(`   ✅ Organizer ID: ${createdOrganizer?.id}`);
    console.log('');

    // STEP 2: Create draft event
    console.log('📝 STEP 2: Create new event');
    console.log('-'.repeat(60));

    const eventName = `Tech Conference ${Date.now()}`;
    const eventData = testData.generateEvent();

    await page.goto('/dashboard/events/create');
    await page.fill('input[name="name"]', eventName);
    await page.fill('textarea[name="description"]', 'Annual tech conference for developers');

    const startDateTime = new Date(Date.now() + 60 * 86400000).toISOString().slice(0, 16);
    const endDateTime = new Date(Date.now() + 61 * 86400000).toISOString().slice(0, 16);

    await page.fill('input[name="startDate"]', startDateTime);
    await page.fill('input[name="endDate"]', endDateTime);

    await page.click('button[type="submit"]');

    console.log(`   ⏳ Creating event...`);

    await page.waitForTimeout(5000);

    const createdEvent = await prisma.event.findFirst({
      where: {
        name: eventName,
        organizerId: createdOrganizer?.id,
      },
    });

    expect(createdEvent).toBeTruthy();
    expect(createdEvent?.status).toBe('DRAFT');

    console.log(`   ✅ Event created: ${createdEvent?.name}`);
    console.log(`   ✅ Status: ${createdEvent?.status}`);
    console.log(`   ✅ Slug: ${createdEvent?.slug}`);
    console.log('');

    // STEP 3: Add ticket types
    console.log('🎫 STEP 3: Configure ticket types');
    console.log('-'.repeat(60));

    await page.goto(`/dashboard/events/${createdEvent?.id}/manage`);
    await page.click('button:has-text("Add Ticket Type")');
    await page.waitForTimeout(2000);

    await page.fill('input[name="ticketName"]', 'Early Bird');
    await page.fill('input[name="price"]', '99.00');
    await page.fill('input[name="quantity"]', '50');

    await page.click('button:has-text("Save Ticket Type")');

    console.log(`   ⏳ Adding ticket type...`);

    await page.waitForTimeout(5000);

    const ticketType = await prisma.ticketType.findFirst({
      where: { eventId: createdEvent?.id },
    });

    expect(ticketType).toBeTruthy();

    console.log(`   ✅ Ticket type created: ${ticketType?.name}`);
    console.log(`   ✅ Price: $${ticketType?.price}`);
    console.log(`   ✅ Quantity: ${ticketType?.quantity}`);
    console.log('');

    // STEP 4: Publish event
    console.log('🚀 STEP 4: Publish event to go live');
    console.log('-'.repeat(60));

    await page.click('button:has-text("Publish")');

    console.log(`   ⏳ Publishing event...`);

    await page.waitForTimeout(5000);

    const publishedEvent = await prisma.event.findUnique({
      where: { id: createdEvent?.id },
    });

    expect(publishedEvent?.status).toBe('PUBLISHED');

    console.log(`   ✅ Event published: ${publishedEvent?.status}`);
    console.log(`   ✅ Now visible to public`);
    console.log('');

    // STEP 5: Simulate ticket sales (create orders directly in DB)
    console.log('💰 STEP 5: Tickets are selling!');
    console.log('-'.repeat(60));

    // Create 3 attendees who purchased tickets
    const attendees = [];
    for (let i = 0; i < 3; i++) {
      const attendee = testData.generateUser('attendee');
      const created = await authHelper.createUserInDatabase(attendee);
      attendees.push(created);

      const order = await prisma.order.create({
        data: {
          orderNumber: `ORD-TECH-${Date.now()}-${i}`,
          eventId: createdEvent?.id!,
          userId: created.id,
          status: 'COMPLETED',
          subtotal: 99.00,
          fees: 9.90,
          taxes: 8.17,
          total: 117.07,
        },
      });

      await prisma.payment.create({
        data: {
          orderId: order.id,
          amount: 117.07,
          currency: 'USD',
          status: 'COMPLETED',
          provider: 'SQUARE',
          squarePaymentId: `SQ-TECH-${Date.now()}-${i}`,
        },
      });

      await prisma.ticket.create({
        data: {
          ticketNumber: `TIX-TECH-${Date.now()}-${i}`,
          orderId: order.id,
          ticketTypeId: ticketType?.id!,
          eventId: createdEvent?.id!,
          userId: created.id,
          status: 'VALID',
          qrCode: `QR-TECH-${Date.now()}-${i}`,
          validationCode: `VAL-TECH-${Date.now()}-${i}`,
        },
      });
    }

    // Update sold count
    await prisma.ticketType.update({
      where: { id: ticketType?.id },
      data: { sold: 3 },
    });

    console.log(`   ✅ 3 tickets sold!`);
    console.log(`   ✅ Revenue: $${117.07 * 3}`);
    console.log('');

    // STEP 6: Venue cancels - organizer must cancel event
    console.log('🚫 STEP 6: Venue cancels - must cancel event');
    console.log('-'.repeat(60));

    await page.goto(`/dashboard/events/${createdEvent?.id}/manage`);
    await page.click('button:has-text("Cancel Event")');
    await page.waitForTimeout(2000);

    try {
      await page.fill('textarea[name="reason"]', 'Venue unexpectedly unavailable');
    } catch {
      console.log('   ℹ️  Reason field optional');
    }

    await page.click('button:has-text("Confirm Cancellation")');

    console.log(`   ⏳ Cancelling event and processing refunds...`);

    await page.waitForTimeout(10000);

    // Verify event cancelled
    const cancelledEvent = await prisma.event.findUnique({
      where: { id: createdEvent?.id },
    });

    expect(cancelledEvent?.status).toBe('CANCELLED');

    console.log(`   ✅ Event cancelled: ${cancelledEvent?.status}`);

    // Verify refunds processed for all 3 attendees
    const refunds = await prisma.refund.findMany({
      where: {
        order: {
          eventId: createdEvent?.id,
        },
      },
    });

    expect(refunds.length).toBe(3);

    console.log(`   ✅ Bulk refunds processed: ${refunds.length} refunds`);

    refunds.forEach((refund, index) => {
      console.log(`      - Refund ${index + 1}: ${refund.status} - $${refund.amount}`);
    });

    // Verify all tickets cancelled
    const cancelledTickets = await prisma.ticket.findMany({
      where: {
        eventId: createdEvent?.id,
        status: 'CANCELLED',
      },
    });

    expect(cancelledTickets.length).toBe(3);

    console.log(`   ✅ All tickets cancelled: ${cancelledTickets.length} tickets`);
    console.log('');

    console.log('🎉 COMPLETE ORGANIZER JOURNEY VERIFIED!');
    console.log('   ✅ Registration → Create → Publish → Sales → Cancellation');
    console.log('='.repeat(60));
  });

  test('ticket transfer between users journey', async ({
    page,
    testData,
    authHelper,
    squareHelper,
    prisma
  }) => {
    console.log('📝 Test: Ticket transfer journey');
    console.log('🎭 Scenario: User buys ticket, transfers to friend');
    console.log('='.repeat(60));

    // SETUP: Create event
    const organizer = testData.generateUser('organizer');
    const createdOrganizer = await authHelper.createUserInDatabase(organizer);

    const event = await prisma.event.create({
      data: {
        name: 'Comedy Show',
        slug: `comedy-show-${Date.now()}`,
        description: 'Stand-up comedy night',
        startDate: new Date(Date.now() + 14 * 86400000),
        endDate: new Date(Date.now() + 14 * 86400000 + 3600000),
        status: 'PUBLISHED',
        eventType: 'GENERAL_ADMISSION',
        organizerId: createdOrganizer.id,
      },
    });

    const ticketType = await prisma.ticketType.create({
      data: {
        name: 'General Admission',
        price: 45.00,
        quantity: 100,
        sold: 0,
        eventId: event.id,
      },
    });

    console.log(`✅ Event setup: ${event.name}`);
    console.log('');

    // STEP 1: Original buyer purchases ticket
    console.log('👤 STEP 1: Original buyer purchases ticket');
    console.log('-'.repeat(60));

    const buyer = testData.generateUser('attendee');
    const createdBuyer = await authHelper.createUserInDatabase(buyer);

    await authHelper.loginUI(page, buyer.email, buyer.password);
    await page.goto(`/events/${event.slug}`);
    await page.click('button:has-text("Get Tickets")');
    await page.waitForTimeout(3000);

    await squareHelper.fillPaymentForm(page, 'success');
    await squareHelper.submitPayment(page);

    console.log(`   ⏳ Processing purchase...`);

    await squareHelper.waitForPaymentSuccess(page, 45000);

    const order = await prisma.order.findFirst({
      where: {
        userId: createdBuyer.id,
        eventId: event.id,
      },
      include: { tickets: true },
    });

    expect(order).toBeTruthy();

    console.log(`   ✅ Ticket purchased: ${order?.tickets[0]?.ticketNumber}`);
    console.log(`   ✅ Original owner: ${buyer.email}`);

    const originalQrCode = order?.tickets[0]?.qrCode;
    console.log(`   ✅ Original QR: ${originalQrCode}`);
    console.log('');

    // STEP 2: Create recipient user
    console.log('👥 STEP 2: Create friend account (transfer recipient)');
    console.log('-'.repeat(60));

    const friend = testData.generateUser('attendee');
    const createdFriend = await authHelper.createUserInDatabase(friend);

    console.log(`   ✅ Friend registered: ${friend.email}`);
    console.log('');

    // STEP 3: Initiate transfer
    console.log('📤 STEP 3: Buyer transfers ticket to friend');
    console.log('-'.repeat(60));

    // Still logged in as buyer
    await page.goto(`/dashboard/orders/${order?.id}`);
    await page.click('button:has-text("Transfer")');
    await page.waitForTimeout(2000);

    await page.fill('input[name="recipientEmail"]', friend.email);
    await page.fill('textarea[name="message"]', 'Cannot make it, enjoy the show!');

    await page.click('button:has-text("Send Transfer")');

    console.log(`   ⏳ Sending transfer request...`);

    await page.waitForTimeout(5000);

    const transfer = await prisma.ticketTransfer.findFirst({
      where: {
        ticketId: order?.tickets[0]?.id,
        fromUserId: createdBuyer.id,
        toUserId: createdFriend.id,
      },
    });

    expect(transfer).toBeTruthy();
    expect(transfer?.status).toBe('PENDING');

    console.log(`   ✅ Transfer request sent: ${transfer?.id}`);
    console.log(`   ✅ Status: ${transfer?.status}`);
    console.log('');

    // STEP 4: Friend accepts transfer
    console.log('✅ STEP 4: Friend accepts transfer');
    console.log('-'.repeat(60));

    // Logout buyer, login friend
    await authHelper.logoutUI(page);
    await authHelper.loginUI(page, friend.email, friend.password);

    await page.goto('/dashboard/transfers');
    await page.waitForTimeout(2000);

    await page.click('button:has-text("Accept")');

    console.log(`   ⏳ Processing transfer acceptance...`);

    await page.waitForTimeout(8000);

    // Verify transfer completed
    const completedTransfer = await prisma.ticketTransfer.findUnique({
      where: { id: transfer?.id },
    });

    expect(completedTransfer?.status).toBe('COMPLETED');

    console.log(`   ✅ Transfer status: ${completedTransfer?.status}`);

    // Verify ownership changed
    const transferredTicket = await prisma.ticket.findUnique({
      where: { id: order?.tickets[0]?.id },
    });

    expect(transferredTicket?.userId).toBe(createdFriend.id);

    console.log(`   ✅ New owner: ${friend.email}`);

    // Verify QR code regenerated (security)
    expect(transferredTicket?.qrCode).not.toBe(originalQrCode);

    console.log(`   ✅ QR code regenerated: ${transferredTicket?.qrCode}`);
    console.log(`      (Original: ${originalQrCode})`);
    console.log('');

    // STEP 5: Friend can see ticket in their dashboard
    console.log('🎫 STEP 5: Friend views ticket in their dashboard');
    console.log('-'.repeat(60));

    await page.goto('/dashboard/tickets');
    await expect(page.locator(`text=${event.name}`)).toBeVisible();

    console.log(`   ✅ Ticket visible in friend's dashboard`);
    console.log('');

    console.log('🎉 COMPLETE TRANSFER JOURNEY VERIFIED!');
    console.log('   ✅ Purchase → Transfer Request → Accept → New Ownership');
    console.log('='.repeat(60));
  });
});
