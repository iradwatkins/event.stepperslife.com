/**
 * Event Creation E2E Tests
 * Tests the complete event creation flow with REAL data:
 * - Real organizer creating events
 * - Real event data in database
 * - Real ticket type configuration
 * - Real event publishing workflow
 *
 * @critical Organizer Feature
 */

import { test, expect } from './fixtures/test-fixtures';

test.describe('Event Creation Flow (ORGANIZER)', () => {
  test.beforeAll(async () => {
    console.log('🧪 Starting Event Creation Tests...');
    console.log('='.repeat(60));
  });

  test.afterAll(async () => {
    console.log('='.repeat(60));
    console.log('✅ Event Creation Tests Complete');
  });

  test('should display event creation form for organizers', async ({
    page,
    testData,
    authHelper
  }) => {
    console.log('📝 Test: Event creation form display');

    // Create organizer
    const organizer = testData.generateUser('organizer');
    await authHelper.createUserInDatabase(organizer);

    // Login as organizer
    await authHelper.loginUI(page, organizer.email, organizer.password);

    console.log(`✅ Logged in as organizer: ${organizer.email}`);

    // Navigate to create event page
    await page.goto('/dashboard/events/create');

    // Verify form fields present
    await expect(page.locator('input[name="name"]')).toBeVisible();
    await expect(page.locator('textarea[name="description"]')).toBeVisible();
    await expect(page.locator('input[name="startDate"]')).toBeVisible();
    await expect(page.locator('input[name="endDate"]')).toBeVisible();

    // Verify submit button
    await expect(page.locator('button[type="submit"]')).toBeVisible();

    console.log('✅ Event creation form displayed correctly');
  });

  test('should create event and save to database', async ({
    page,
    testData,
    authHelper,
    prisma
  }) => {
    console.log('📝 Test: Create event');

    // Create organizer
    const organizer = testData.generateUser('organizer');
    const createdOrganizer = await authHelper.createUserInDatabase(organizer);

    // Login
    await authHelper.loginUI(page, organizer.email, organizer.password);

    console.log(`✅ Organizer logged in: ${organizer.email}`);

    // Generate event data
    const eventData = testData.generateEvent();

    // Navigate to create page
    await page.goto('/dashboard/events/create');

    // Fill event form
    await page.fill('input[name="name"]', eventData.name);
    await page.fill('textarea[name="description"]', eventData.description);

    // Fill dates (format: YYYY-MM-DDTHH:mm)
    const startDateTime = new Date(eventData.startDate).toISOString().slice(0, 16);
    const endDateTime = new Date(eventData.endDate).toISOString().slice(0, 16);

    await page.fill('input[name="startDate"]', startDateTime);
    await page.fill('input[name="endDate"]', endDateTime);

    // Select event type
    await page.selectOption('select[name="eventType"]', 'GENERAL_ADMISSION').catch(() => {
      console.log('ℹ️  Event type field might use different selector');
    });

    console.log(`📝 Filled event form: ${eventData.name}`);

    // Submit form
    await page.click('button[type="submit"]');

    console.log('⏳ Creating event...');

    // Wait for redirect or success
    await page.waitForTimeout(5000);

    // Verify event created in database
    const createdEvent = await prisma.event.findFirst({
      where: {
        name: eventData.name,
        organizerId: createdOrganizer.id,
      },
    });

    expect(createdEvent).toBeTruthy();
    expect(createdEvent?.name).toBe(eventData.name);
    expect(createdEvent?.description).toBe(eventData.description);
    expect(createdEvent?.organizerId).toBe(createdOrganizer.id);

    console.log(`✅ Event created: ${createdEvent?.id}`);
    console.log(`   Name: ${createdEvent?.name}`);
    console.log(`   Slug: ${createdEvent?.slug}`);
    console.log(`   Status: ${createdEvent?.status}`);

    console.log('🎉 Event creation verified!');
  });

  test('should generate unique slug from event name', async ({
    page,
    testData,
    authHelper,
    prisma
  }) => {
    console.log('📝 Test: Slug generation');

    // Create organizer
    const organizer = testData.generateUser('organizer');
    const createdOrganizer = await authHelper.createUserInDatabase(organizer);

    await authHelper.loginUI(page, organizer.email, organizer.password);

    // Create event
    const eventName = `Test Event ${Date.now()}`;

    await page.goto('/dashboard/events/create');
    await page.fill('input[name="name"]', eventName);
    await page.fill('textarea[name="description"]', 'Test description');

    const startDateTime = new Date(Date.now() + 86400000).toISOString().slice(0, 16);
    const endDateTime = new Date(Date.now() + 172800000).toISOString().slice(0, 16);

    await page.fill('input[name="startDate"]', startDateTime);
    await page.fill('input[name="endDate"]', endDateTime);

    await page.click('button[type="submit"]');

    console.log('⏳ Creating event...');

    await page.waitForTimeout(5000);

    // Verify slug generated
    const createdEvent = await prisma.event.findFirst({
      where: {
        name: eventName,
        organizerId: createdOrganizer.id,
      },
    });

    expect(createdEvent?.slug).toBeTruthy();
    expect(createdEvent?.slug).toMatch(/test-event-\d+/);

    console.log(`✅ Slug generated: ${createdEvent?.slug}`);
  });

  test('should add ticket types to event', async ({
    page,
    testData,
    authHelper,
    prisma
  }) => {
    console.log('📝 Test: Add ticket types');

    // Create organizer and event
    const organizer = testData.generateUser('organizer');
    const createdOrganizer = await authHelper.createUserInDatabase(organizer);

    const event = await prisma.event.create({
      data: {
        name: 'Ticket Type Test Event',
        slug: `ticket-type-${Date.now()}`,
        description: 'Testing ticket type addition',
        startDate: testData.generateEvent().startDate,
        endDate: testData.generateEvent().endDate,
        status: 'DRAFT',
        eventType: 'WORKSHOP',
        organizerId: createdOrganizer.id,
      },
    });

    console.log(`✅ Created draft event: ${event.name}`);

    // Login and navigate to event management
    await authHelper.loginUI(page, organizer.email, organizer.password);
    await page.goto(`/dashboard/events/${event.id}/manage`);

    // Add ticket type
    await page.click('button:has-text("Add Ticket Type")');

    await page.waitForTimeout(2000);

    // Fill ticket type form
    await page.fill('input[name="ticketName"]', 'General Admission');
    await page.fill('input[name="price"]', '25.00');
    await page.fill('input[name="quantity"]', '100');

    await page.click('button:has-text("Save Ticket Type")');

    console.log('⏳ Adding ticket type...');

    await page.waitForTimeout(5000);

    // Verify ticket type created in database
    const ticketTypes = await prisma.ticketType.findMany({
      where: { eventId: event.id },
    });

    expect(ticketTypes.length).toBeGreaterThan(0);

    const ticketType = ticketTypes[0];
    expect(ticketType.name).toBe('General Admission');
    expect(Number(ticketType.price)).toBe(25.00);
    expect(ticketType.quantity).toBe(100);

    console.log(`✅ Ticket type created: ${ticketType.id}`);
    console.log(`   Name: ${ticketType.name}`);
    console.log(`   Price: $${ticketType.price}`);
    console.log(`   Quantity: ${ticketType.quantity}`);

    console.log('🎉 Ticket type creation verified!');
  });

  test('should publish draft event', async ({
    page,
    testData,
    authHelper,
    prisma
  }) => {
    console.log('📝 Test: Publish event');

    // Create organizer
    const organizer = testData.generateUser('organizer');
    const createdOrganizer = await authHelper.createUserInDatabase(organizer);

    // Create DRAFT event with ticket type
    const event = await prisma.event.create({
      data: {
        name: 'Publish Test Event',
        slug: `publish-test-${Date.now()}`,
        description: 'Testing event publishing',
        startDate: testData.generateEvent().startDate,
        endDate: testData.generateEvent().endDate,
        status: 'DRAFT', // Draft status
        eventType: 'WORKSHOP',
        organizerId: createdOrganizer.id,
      },
    });

    await prisma.ticketType.create({
      data: {
        name: 'Standard',
        price: 30.00,
        quantity: 50,
        sold: 0,
        eventId: event.id,
      },
    });

    console.log(`✅ Created draft event: ${event.name} (Status: ${event.status})`);

    // Login and navigate to event
    await authHelper.loginUI(page, organizer.email, organizer.password);
    await page.goto(`/dashboard/events/${event.id}/manage`);

    // Click publish button
    await page.click('button:has-text("Publish")');

    console.log('⏳ Publishing event...');

    await page.waitForTimeout(5000);

    // Verify event status updated to PUBLISHED
    const updatedEvent = await prisma.event.findUnique({
      where: { id: event.id },
    });

    expect(updatedEvent?.status).toBe('PUBLISHED');

    console.log(`✅ Event published: ${updatedEvent?.status}`);

    // Verify event now visible on public events page
    await page.goto('/events');

    // Should see event listed
    await expect(page.locator(`text=${event.name}`)).toBeVisible();

    console.log('✅ Published event visible on public events page');

    console.log('🎉 Event publishing verified!');
  });

  test('should update existing event details', async ({
    page,
    testData,
    authHelper,
    prisma
  }) => {
    console.log('📝 Test: Update event');

    // Create organizer and event
    const organizer = testData.generateUser('organizer');
    const createdOrganizer = await authHelper.createUserInDatabase(organizer);

    const originalName = `Original Event ${Date.now()}`;
    const event = await prisma.event.create({
      data: {
        name: originalName,
        slug: `original-${Date.now()}`,
        description: 'Original description',
        startDate: testData.generateEvent().startDate,
        endDate: testData.generateEvent().endDate,
        status: 'DRAFT',
        eventType: 'WORKSHOP',
        organizerId: createdOrganizer.id,
      },
    });

    console.log(`✅ Created event: ${event.name}`);

    // Login and navigate to edit
    await authHelper.loginUI(page, organizer.email, organizer.password);
    await page.goto(`/dashboard/events/${event.id}/manage`);

    // Click edit button
    await page.click('button:has-text("Edit Details")').catch(async () => {
      // Alternative: edit might be inline
      console.log('ℹ️  Using inline editing');
    });

    await page.waitForTimeout(2000);

    // Update event name and description
    const updatedName = `Updated Event ${Date.now()}`;
    await page.fill('input[name="name"]', updatedName);
    await page.fill('textarea[name="description"]', 'Updated description');

    // Save changes
    await page.click('button:has-text("Save")');

    console.log('⏳ Updating event...');

    await page.waitForTimeout(5000);

    // Verify updates in database
    const updatedEvent = await prisma.event.findUnique({
      where: { id: event.id },
    });

    expect(updatedEvent?.name).toBe(updatedName);
    expect(updatedEvent?.description).toBe('Updated description');

    console.log(`✅ Event updated:`);
    console.log(`   Old name: ${originalName}`);
    console.log(`   New name: ${updatedEvent?.name}`);

    console.log('🎉 Event update verified!');
  });

  test('should delete draft event', async ({
    page,
    testData,
    authHelper,
    prisma
  }) => {
    console.log('📝 Test: Delete draft event');

    // Create organizer and DRAFT event (no tickets sold)
    const organizer = testData.generateUser('organizer');
    const createdOrganizer = await authHelper.createUserInDatabase(organizer);

    const event = await prisma.event.create({
      data: {
        name: 'Delete Test Event',
        slug: `delete-test-${Date.now()}`,
        description: 'Testing event deletion',
        startDate: testData.generateEvent().startDate,
        endDate: testData.generateEvent().endDate,
        status: 'DRAFT', // Must be draft to delete
        eventType: 'WORKSHOP',
        organizerId: createdOrganizer.id,
      },
    });

    const eventId = event.id;

    console.log(`✅ Created draft event: ${event.name}`);

    // Login and navigate to event
    await authHelper.loginUI(page, organizer.email, organizer.password);
    await page.goto(`/dashboard/events/${event.id}/manage`);

    // Click delete button
    await page.click('button:has-text("Delete")');

    // Confirm deletion
    await page.waitForTimeout(2000);
    await page.click('button:has-text("Confirm Delete")');

    console.log('⏳ Deleting event...');

    await page.waitForTimeout(5000);

    // Verify event deleted from database
    const deletedEvent = await prisma.event.findUnique({
      where: { id: eventId },
    });

    expect(deletedEvent).toBeNull();

    console.log('✅ Event deleted from database');

    console.log('🎉 Event deletion verified!');
  });

  test('should prevent deletion of published event with tickets', async ({
    page,
    testData,
    authHelper,
    prisma
  }) => {
    console.log('📝 Test: Prevent deletion of published event');

    // Create organizer
    const organizer = testData.generateUser('organizer');
    const createdOrganizer = await authHelper.createUserInDatabase(organizer);

    // Create attendee
    const attendee = testData.generateUser('attendee');
    const createdAttendee = await authHelper.createUserInDatabase(attendee);

    // Create PUBLISHED event with sold tickets
    const event = await prisma.event.create({
      data: {
        name: 'No Delete Test Event',
        slug: `no-delete-${Date.now()}`,
        description: 'Testing deletion prevention',
        startDate: testData.generateEvent().startDate,
        endDate: testData.generateEvent().endDate,
        status: 'PUBLISHED', // Published
        eventType: 'WORKSHOP',
        organizerId: createdOrganizer.id,
      },
    });

    const ticketType = await prisma.ticketType.create({
      data: {
        name: 'General',
        price: 20.00,
        quantity: 100,
        sold: 1, // Tickets sold!
        eventId: event.id,
      },
    });

    // Create order with ticket
    const order = await prisma.order.create({
      data: {
        orderNumber: `ORD-NODELETE-${Date.now()}`,
        eventId: event.id,
        userId: createdAttendee.id,
        status: 'COMPLETED',
        subtotal: 20.00,
        fees: 2.00,
        taxes: 1.65,
        total: 23.65,
      },
    });

    await prisma.ticket.create({
      data: {
        ticketNumber: `TIX-NODELETE-${Date.now()}`,
        orderId: order.id,
        ticketTypeId: ticketType.id,
        eventId: event.id,
        userId: createdAttendee.id,
        status: 'VALID',
        qrCode: `QR-NODELETE-${Date.now()}`,
        validationCode: `VAL-NODELETE-${Date.now()}`,
      },
    });

    console.log(`✅ Created published event with 1 ticket sold`);

    // Login as organizer
    await authHelper.loginUI(page, organizer.email, organizer.password);
    await page.goto(`/dashboard/events/${event.id}/manage`);

    // Delete button should be disabled or hidden
    const deleteButton = page.locator('button:has-text("Delete")');
    const isDisabled = await deleteButton.isDisabled().catch(() => true);
    const isVisible = await deleteButton.isVisible().catch(() => false);

    if (isVisible) {
      expect(isDisabled).toBe(true);
      console.log('✅ Delete button is disabled for published event');
    } else {
      console.log('✅ Delete button is hidden for published event');
    }

    console.log('ℹ️  Use "Cancel Event" instead to handle published events with tickets');
  });

  test('should display organizer events list', async ({
    page,
    testData,
    authHelper,
    prisma
  }) => {
    console.log('📝 Test: Organizer events list');

    // Create organizer with multiple events
    const organizer = testData.generateUser('organizer');
    const createdOrganizer = await authHelper.createUserInDatabase(organizer);

    // Create 3 events
    for (let i = 0; i < 3; i++) {
      await prisma.event.create({
        data: {
          name: `List Test Event ${i + 1}`,
          slug: `list-test-${Date.now()}-${i}`,
          description: `Event ${i + 1} for testing list`,
          startDate: testData.generateEvent().startDate,
          endDate: testData.generateEvent().endDate,
          status: i === 0 ? 'PUBLISHED' : 'DRAFT',
          eventType: 'WORKSHOP',
          organizerId: createdOrganizer.id,
        },
      });
    }

    console.log(`✅ Created 3 events for organizer`);

    // Login and navigate to events list
    await authHelper.loginUI(page, organizer.email, organizer.password);
    await page.goto('/dashboard/events');

    // Verify all 3 events displayed
    await expect(page.locator('text=List Test Event 1')).toBeVisible();
    await expect(page.locator('text=List Test Event 2')).toBeVisible();
    await expect(page.locator('text=List Test Event 3')).toBeVisible();

    // Verify status badges
    await expect(page.locator('text=PUBLISHED')).toBeVisible();
    await expect(page.locator('text=DRAFT').first()).toBeVisible();

    console.log('✅ All events displayed in organizer dashboard');

    console.log('🎉 Events list verified!');
  });
});
