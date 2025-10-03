/**
 * Test Data Generator
 * Generates realistic test data for E2E tests
 * All data is timestamped to ensure uniqueness
 */

export class TestDataGenerator {
  private timestamp: string;

  constructor() {
    // Use timestamp to make all data unique per test run
    this.timestamp = Date.now().toString();
  }

  /**
   * Generate unique test user data
   */
  generateUser(role: 'organizer' | 'attendee' | 'admin' = 'attendee') {
    const rolePrefix = role.charAt(0).toUpperCase() + role.slice(1);

    return {
      name: `Test ${rolePrefix} ${this.timestamp}`,
      email: `test.${role}.${this.timestamp}@e2etest.com`,
      password: 'TestPassword123!',
      role: role === 'admin' ? 'ADMIN' : role === 'organizer' ? 'ORGANIZER' : 'USER',
    };
  }

  /**
   * Generate unique event data
   */
  generateEvent(overrides: Partial<EventData> = {}) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(19, 0, 0, 0); // 7 PM tomorrow

    const endTime = new Date(tomorrow);
    endTime.setHours(23, 0, 0, 0); // 11 PM same day

    const twoWeeksFromNow = new Date();
    twoWeeksFromNow.setDate(twoWeeksFromNow.getDate() + 14);

    return {
      name: `E2E Test Stepping Event ${this.timestamp}`,
      slug: `e2e-test-event-${this.timestamp}`,
      description: `This is an automated test event created at ${new Date().toISOString()}. This event is part of the E2E test suite and will be automatically cleaned up after testing.`,
      shortDescription: `E2E Test Event - ${this.timestamp}`,
      startDate: tomorrow,
      endDate: endTime,
      timezone: 'America/New_York',
      eventType: 'GENERAL_ADMISSION' as const,
      status: 'DRAFT' as const,
      isVirtual: false,
      isFeatured: false,
      requiresApproval: false,
      maxCapacity: 100,
      ticketTypes: [
        {
          name: 'General Admission',
          description: 'Standard entry ticket',
          price: 25.00,
          quantity: 100,
          salesStartDate: new Date(),
          salesEndDate: tomorrow,
          minQuantityPerOrder: 1,
          maxQuantityPerOrder: 10,
        },
      ],
      venue: {
        name: 'E2E Test Venue',
        address: '123 Test Street, Test City, TC 12345',
        city: 'Test City',
        state: 'TC',
        zipCode: '12345',
        country: 'USA',
      },
      ...overrides,
    };
  }

  /**
   * Generate ticket purchase data
   */
  generatePurchaseData(ticketTypeId: string, quantity: number = 1) {
    return {
      ticketTypeId,
      quantity,
      attendeeInfo: {
        firstName: `Test`,
        lastName: `Attendee ${this.timestamp}`,
        email: `attendee.${this.timestamp}@e2etest.com`,
        phone: '555-0100',
      },
    };
  }

  /**
   * Generate Square test card data
   */
  getSquareTestCard(type: 'success' | 'decline' | 'cvv_fail' = 'success') {
    const cards = {
      success: {
        number: '4111 1111 1111 1111',
        cvv: '123',
        expMonth: '12',
        expYear: '25',
        postalCode: '12345',
      },
      decline: {
        number: '4000 0000 0000 0002',
        cvv: '123',
        expMonth: '12',
        expYear: '25',
        postalCode: '12345',
      },
      cvv_fail: {
        number: '4111 1111 1111 1111',
        cvv: '200',
        expMonth: '12',
        expYear: '25',
        postalCode: '12345',
      },
    };

    return cards[type];
  }

  /**
   * Generate refund request data
   */
  generateRefundRequest(reason?: string) {
    return {
      reason: reason || 'CUSTOMER_REQUEST' as const,
      reasonText: `E2E test refund requested at ${new Date().toISOString()}`,
    };
  }

  /**
   * Generate ticket transfer data
   */
  generateTransferData(recipientEmail?: string) {
    return {
      toEmail: recipientEmail || `recipient.${this.timestamp}@e2etest.com`,
      message: `This is an E2E test ticket transfer sent at ${new Date().toISOString()}. Please accept to complete the test.`,
    };
  }

  /**
   * Generate event cancellation data
   */
  generateCancellationData() {
    return {
      reason: `E2E test cancellation at ${new Date().toISOString()}`,
      refundAll: true,
      notifyAttendees: true,
    };
  }

  /**
   * Generate random data for variety
   */
  randomEventName() {
    const adjectives = ['Amazing', 'Incredible', 'Fantastic', 'Spectacular', 'Epic'];
    const nouns = ['Stepping', 'Dance', 'Performance', 'Showcase', 'Competition'];
    const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];
    return `${adj} ${noun} Event ${this.timestamp}`;
  }

  /**
   * Get timestamp for this test run
   */
  getTimestamp() {
    return this.timestamp;
  }
}

// Type definitions
interface EventData {
  name: string;
  slug: string;
  description: string;
  shortDescription: string;
  startDate: Date;
  endDate: Date;
  timezone: string;
  eventType: 'GENERAL_ADMISSION' | 'RESERVED_SEATING';
  status: 'DRAFT' | 'PUBLISHED' | 'CANCELLED';
  isVirtual: boolean;
  isFeatured: boolean;
  requiresApproval: boolean;
  maxCapacity: number;
  ticketTypes: Array<{
    name: string;
    description: string;
    price: number;
    quantity: number;
    salesStartDate: Date;
    salesEndDate: Date;
    minQuantityPerOrder: number;
    maxQuantityPerOrder: number;
  }>;
  venue: {
    name: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
}

// Export singleton instance
export const testDataGenerator = new TestDataGenerator();
