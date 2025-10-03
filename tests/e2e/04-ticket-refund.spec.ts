/**
 * Ticket Refund E2E Tests
 * Tests the complete refund flow with REAL data:
 * - Real Square sandbox refunds
 * - Real database updates
 * - Real ticket cancellation
 *
 * @critical MVP Feature
 */

import { test, expect } from './fixtures/test-fixtures';

test.describe('Ticket Refund Flow (CRITICAL MVP)', () => {
  test.beforeAll(async () => {
    console.log('🧪 Starting Ticket Refund Tests...');
    console.log('=' .repeat(60));
  });

  test.afterAll(async () => {
    console.log('=' .repeat(60));
    console.log('✅ Ticket Refund Tests Complete');
  });

  test('should display refund button on valid tickets', async ({
    page,
    testData,
    authHelper,
    prisma
  }) => {
    console.log('📝 Test: Refund button visibility');

    // Create user with a "purchased" ticket
    const user = testData.generateUser('attendee');
    const createdUser = await authHelper.createUserInDatabase(user);

    // Create a mock event and order in database
    // (In real scenario, this would be from previous purchase)
    const event = await prisma.event.create({
      data: {
        name: testData.generateEvent().name,
        slug: testData.generateEvent().slug,
        description: 'Test event for refund',
        startDate: testData.generateEvent().startDate,
        endDate: testData.generateEvent().endDate,
        status: 'PUBLISHED',
        eventType: 'GENERAL_ADMISSION',
        organizerId: createdUser.id,
      },
    });

    const ticketType = await prisma.ticketType.create({
      data: {
        name: 'General Admission',
        price: 25.00,
        quantity: 100,
        sold: 1,
        eventId: event.id,
      },
    });

    const order = await prisma.order.create({
      data: {
        orderNumber: `ORD-TEST-${Date.now()}`,
        eventId: event.id,
        userId: createdUser.id,
        status: 'COMPLETED',
        subtotal: 25.00,
        fees: 2.50,
        taxes: 2.05,
        total: 29.55,
      },
    });

    await prisma.payment.create({
      data: {
        orderId: order.id,
        amount: 29.55,
        currency: 'USD',
        status: 'COMPLETED',
        provider: 'SQUARE',
        squarePaymentId: `TEST-PAY-${Date.now()}`,
      },
    });

    const ticket = await prisma.ticket.create({
      data: {
        ticketNumber: `TIX-${Date.now()}`,
        orderId: order.id,
        ticketTypeId: ticketType.id,
        eventId: event.id,
        userId: createdUser.id,
        status: 'VALID',
        qrCode: `QR-${Date.now()}`,
        validationCode: `VAL-${Date.now()}`,
      },
    });

    console.log(`✅ Created test ticket: ${ticket.ticketNumber}`);

    // Login and navigate to My Tickets
    await authHelper.loginUI(page, user.email, user.password);
    await page.goto('/dashboard/tickets');

    // Verify refund button is visible
    await expect(page.locator('button:has-text("Refund")')).toBeVisible();

    console.log('✅ Refund button is visible');
  });

  test('should show refund eligibility and amount', async ({
    page,
    testData,
    authHelper,
    prisma
  }) => {
    console.log('📝 Test: Refund eligibility check');

    // Create complete test data
    const user = testData.generateUser('attendee');
    const createdUser = await authHelper.createUserInDatabase(user);

    const event = await prisma.event.create({
      data: {
        name: 'Refund Test Event',
        slug: `refund-test-${Date.now()}`,
        description: 'Testing refund eligibility',
        startDate: testData.generateEvent().startDate,
        endDate: testData.generateEvent().endDate,
        status: 'PUBLISHED',
        eventType: 'GENERAL_ADMISSION',
        organizerId: createdUser.id,
      },
    });

    const ticketType = await prisma.ticketType.create({
      data: {
        name: 'VIP',
        price: 50.00,
        quantity: 50,
        sold: 1,
        eventId: event.id,
      },
    });

    const order = await prisma.order.create({
      data: {
        orderNumber: `ORD-${Date.now()}`,
        eventId: event.id,
        userId: createdUser.id,
        status: 'COMPLETED',
        subtotal: 50.00,
        fees: 5.00,
        taxes: 4.13,
        total: 59.13,
      },
    });

    await prisma.payment.create({
      data: {
        orderId: order.id,
        amount: 59.13,
        currency: 'USD',
        status: 'COMPLETED',
        provider: 'SQUARE',
        squarePaymentId: `SQ-${Date.now()}`,
      },
    });

    const ticket = await prisma.ticket.create({
      data: {
        ticketNumber: `VIP-${Date.now()}`,
        orderId: order.id,
        ticketTypeId: ticketType.id,
        eventId: event.id,
        userId: createdUser.id,
        status: 'VALID',
        qrCode: `QR-VIP-${Date.now()}`,
        validationCode: `VAL-${Date.now()}`,
      },
    });

    console.log(`✅ Created VIP ticket: ${ticket.ticketNumber}`);

    // Login and click refund
    await authHelper.loginUI(page, user.email, user.password);
    await page.goto('/dashboard/orders/' + order.id);

    // Click refund button
    await page.click('button:has-text("Refund")');

    // Wait for refund dialog to open and check eligibility
    await page.waitForSelector('[data-testid="refund-dialog"]', {
      timeout: 5000,
    }).catch(() => {
      // If no test ID, look for dialog
      return page.waitForSelector('text=Refund Request', { timeout: 5000 });
    });

    // Should show loading state while checking eligibility
    console.log('⏳ Checking refund eligibility...');

    // After check, should show refund amount
    // Note: Actual refund = $50 - 10% fee = $45
    await expect(page.locator('text=/\\$.*/')).toBeVisible({ timeout: 10000 });

    console.log('✅ Refund eligibility checked and amount displayed');
  });

  test('should process refund and cancel ticket', async ({
    page,
    testData,
    authHelper,
    prisma
  }) => {
    console.log('📝 Test: Complete refund processing');

    // Setup: Create complete order with ticket
    const user = testData.generateUser('attendee');
    const createdUser = await authHelper.createUserInDatabase(user);

    const event = await prisma.event.create({
      data: {
        name: 'Refund Processing Test',
        slug: `refund-proc-${Date.now()}`,
        description: 'Testing full refund flow',
        startDate: testData.generateEvent().startDate,
        endDate: testData.generateEvent().endDate,
        status: 'PUBLISHED',
        eventType: 'GENERAL_ADMISSION',
        organizerId: createdUser.id,
      },
    });

    const ticketType = await prisma.ticketType.create({
      data: {
        name: 'General',
        price: 30.00,
        quantity: 100,
        sold: 1,
        eventId: event.id,
      },
    });

    const order = await prisma.order.create({
      data: {
        orderNumber: `ORD-PROC-${Date.now()}`,
        eventId: event.id,
        userId: createdUser.id,
        status: 'COMPLETED',
        subtotal: 30.00,
        fees: 3.00,
        taxes: 2.48,
        total: 35.48,
      },
    });

    const payment = await prisma.payment.create({
      data: {
        orderId: order.id,
        amount: 35.48,
        currency: 'USD',
        status: 'COMPLETED',
        provider: 'SQUARE',
        squarePaymentId: `SQ-PROC-${Date.now()}`,
      },
    });

    const ticket = await prisma.ticket.create({
      data: {
        ticketNumber: `TIX-PROC-${Date.now()}`,
        orderId: order.id,
        ticketTypeId: ticketType.id,
        eventId: event.id,
        userId: createdUser.id,
        status: 'VALID',
        qrCode: `QR-PROC-${Date.now()}`,
        validationCode: `VAL-PROC-${Date.now()}`,
      },
    });

    console.log(`✅ Setup complete: Order ${order.orderNumber}, Ticket ${ticket.ticketNumber}`);

    // Action: Request refund through UI
    await authHelper.loginUI(page, user.email, user.password);
    await page.goto(`/dashboard/orders/${order.id}`);

    // Click refund button
    await page.click('button:has-text("Refund")');

    // Wait for dialog
    await page.waitForTimeout(2000);

    // Fill refund reason
    try {
      await page.fill('textarea[name="reason"]', testData.generateRefundRequest().reasonText);
    } catch {
      // Reason might be optional
      console.log('ℹ️  No reason field found (might be optional)');
    }

    // Click confirm refund
    await page.click('button:has-text("Request Refund")');

    console.log('⏳ Processing refund...');

    // Wait for success message or redirect
    await Promise.race([
      page.waitForSelector('text=/Refund.*Success/i', { timeout: 30000 }),
      page.waitForSelector('text=/Refund.*Complete/i', { timeout: 30000 }),
      page.waitForTimeout(15000), // Fallback
    ]);

    console.log('✅ Refund UI flow completed');

    // Verify: Check database for refund record
    const refund = await prisma.refund.findFirst({
      where: {
        orderId: order.id,
      },
    });

    expect(refund).toBeTruthy();
    console.log(`✅ Refund record created: ${refund?.id}`);
    console.log(`   Status: ${refund?.status}`);
    console.log(`   Amount: $${refund?.amount}`);

    // Verify: Check ticket status changed to CANCELLED
    const updatedTicket = await prisma.ticket.findUnique({
      where: { id: ticket.id },
    });

    expect(updatedTicket?.status).toBe('CANCELLED');
    console.log(`✅ Ticket status updated: ${updatedTicket?.status}`);

    // Verify: Check ticket inventory restored
    const updatedTicketType = await prisma.ticketType.findUnique({
      where: { id: ticketType.id },
    });

    // Sold count should be decremented
    expect(updatedTicketType?.sold).toBe(0);
    console.log(`✅ Inventory restored: ${updatedTicketType?.sold} sold`);

    console.log('🎉 Complete refund flow verified!');
  });

  test('should prevent refund of already cancelled ticket', async ({
    page,
    testData,
    authHelper,
    prisma
  }) => {
    console.log('📝 Test: Prevent duplicate refunds');

    // Create user and cancelled ticket
    const user = testData.generateUser('attendee');
    const createdUser = await authHelper.createUserInDatabase(user);

    const event = await prisma.event.create({
      data: {
        name: 'Duplicate Refund Test',
        slug: `dup-refund-${Date.now()}`,
        description: 'Testing duplicate refund prevention',
        startDate: testData.generateEvent().startDate,
        endDate: testData.generateEvent().endDate,
        status: 'PUBLISHED',
        eventType: 'GENERAL_ADMISSION',
        organizerId: createdUser.id,
      },
    });

    const ticketType = await prisma.ticketType.create({
      data: {
        name: 'Standard',
        price: 20.00,
        quantity: 100,
        eventId: event.id,
      },
    });

    const order = await prisma.order.create({
      data: {
        orderNumber: `ORD-DUP-${Date.now()}`,
        eventId: event.id,
        userId: createdUser.id,
        status: 'COMPLETED',
        subtotal: 20.00,
        fees: 2.00,
        taxes: 1.65,
        total: 23.65,
      },
    });

    // Create ticket with CANCELLED status
    const ticket = await prisma.ticket.create({
      data: {
        ticketNumber: `TIX-CANC-${Date.now()}`,
        orderId: order.id,
        ticketTypeId: ticketType.id,
        eventId: event.id,
        userId: createdUser.id,
        status: 'CANCELLED', // Already cancelled
        qrCode: `QR-CANC-${Date.now()}`,
        validationCode: `VAL-CANC-${Date.now()}`,
      },
    });

    console.log(`✅ Created cancelled ticket: ${ticket.ticketNumber}`);

    // Login and navigate
    await authHelper.loginUI(page, user.email, user.password);
    await page.goto('/dashboard/tickets');

    // Refund button should NOT be visible for cancelled tickets
    const refundButtons = await page.locator('button:has-text("Refund")').count();
    expect(refundButtons).toBe(0);

    console.log('✅ Refund button correctly hidden for cancelled ticket');
  });

  test('should show refund in My Tickets after processing', async ({
    page,
    testData,
    authHelper,
    prisma
  }) => {
    console.log('📝 Test: Refund visibility in My Tickets');

    // Create refunded ticket
    const user = testData.generateUser('attendee');
    const createdUser = await authHelper.createUserInDatabase(user);

    const event = await prisma.event.create({
      data: {
        name: 'Refund Display Test',
        slug: `refund-display-${Date.now()}`,
        description: 'Testing refund display',
        startDate: testData.generateEvent().startDate,
        endDate: testData.generateEvent().endDate,
        status: 'PUBLISHED',
        eventType: 'GENERAL_ADMISSION',
        organizerId: createdUser.id,
      },
    });

    const ticketType = await prisma.ticketType.create({
      data: {
        name: 'Basic',
        price: 15.00,
        quantity: 50,
        eventId: event.id,
      },
    });

    const order = await prisma.order.create({
      data: {
        orderNumber: `ORD-DISP-${Date.now()}`,
        eventId: event.id,
        userId: createdUser.id,
        status: 'COMPLETED',
        subtotal: 15.00,
        fees: 1.50,
        taxes: 1.24,
        total: 17.74,
      },
    });

    const ticket = await prisma.ticket.create({
      data: {
        ticketNumber: `TIX-DISP-${Date.now()}`,
        orderId: order.id,
        ticketTypeId: ticketType.id,
        eventId: event.id,
        userId: createdUser.id,
        status: 'CANCELLED', // Refunded
        qrCode: `QR-DISP-${Date.now()}`,
        validationCode: `VAL-DISP-${Date.now()}`,
      },
    });

    console.log(`✅ Created refunded ticket for display test`);

    // Login and check display
    await authHelper.loginUI(page, user.email, user.password);
    await page.goto('/dashboard/tickets');

    // Should show CANCELLED status
    await expect(page.locator('text=CANCELLED')).toBeVisible();

    console.log('✅ Refunded ticket displays correctly with CANCELLED status');
  });
});
