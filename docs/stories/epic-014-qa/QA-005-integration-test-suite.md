# QA-005: Integration Test Suite

**Epic:** EPIC-014 - QA & Testing
**Story Points:** 5
**Priority:** High
**Status:** To Do

## User Story

**As a** backend developer
**I want** comprehensive API integration tests
**So that** API endpoints work correctly with the database and external services

## Description

Implement a comprehensive integration test suite for all API endpoints using Supertest and a test database. Tests should cover authentication, authorization, request validation, response formatting, database operations, and integration with external services like Square payments and email providers.

## Acceptance Criteria

### 1. Test Infrastructure
- [ ] Supertest configured for API testing
- [ ] Test database setup and teardown
- [ ] Test data fixtures and seeding
- [ ] External service mocking (Square, email)
- [ ] Authentication test helpers
- [ ] Database transaction rollback after tests

### 2. Authentication & Authorization Tests
- [ ] User registration endpoint
- [ ] Login endpoint with valid/invalid credentials
- [ ] JWT token generation and validation
- [ ] Password reset flow
- [ ] Email verification flow
- [ ] OAuth flow (if implemented)
- [ ] Protected route access control
- [ ] Role-based authorization

### 3. Event API Tests
- [ ] Create event (organizer only)
- [ ] Update event (owner only)
- [ ] Delete event (owner only)
- [ ] Get event details (public)
- [ ] List events with filters
- [ ] Search events
- [ ] Publish/unpublish event
- [ ] Event capacity validation

### 4. Ticket & Order API Tests
- [ ] Create order with tickets
- [ ] Get order details
- [ ] List user orders
- [ ] List event orders (organizer only)
- [ ] Ticket generation
- [ ] Ticket validation
- [ ] Ticket transfer
- [ ] Refund processing

### 5. Payment Integration Tests
- [ ] Process payment with valid card
- [ ] Handle declined payment
- [ ] Process refund
- [ ] Webhook handling (Square)
- [ ] Payment status updates
- [ ] Idempotency handling
- [ ] Currency validation

### 6. Check-In API Tests
- [ ] Check-in attendee
- [ ] Validate QR code
- [ ] Prevent duplicate check-ins
- [ ] Get check-in statistics
- [ ] Export attendee list
- [ ] Bulk check-in operations

### 7. Admin API Tests
- [ ] User management (admin only)
- [ ] Platform analytics
- [ ] System configuration
- [ ] Audit log access
- [ ] Database backup triggers

### 8. Error Handling & Validation
- [ ] Invalid request body
- [ ] Missing required fields
- [ ] Type validation errors
- [ ] Database constraint violations
- [ ] Rate limiting responses
- [ ] CORS handling
- [ ] Content-type validation

## Technical Requirements

### Supertest Configuration
```typescript
// test-utils/api-test-helper.ts
import request from 'supertest';
import { NextApiHandler } from 'next';
import { createMocks } from 'node-mocks-http';
import { prisma } from '@/lib/prisma';

// Test database URL
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;

export function createTestRequest(handler: NextApiHandler) {
  return request(handler);
}

// Helper to authenticate requests
export async function authenticatedRequest(
  handler: any,
  user: { email: string; password: string }
) {
  // Login to get token
  const loginRes = await request(handler)
    .post('/api/auth/login')
    .send(user);

  const token = loginRes.body.token;

  // Return configured request
  return (method: 'get' | 'post' | 'put' | 'delete', url: string) =>
    request(handler)[method](url).set('Authorization', `Bearer ${token}`);
}

// Database helpers
export async function setupTestDatabase() {
  // Run migrations
  await prisma.$executeRawUnsafe('DROP SCHEMA public CASCADE; CREATE SCHEMA public;');
  // Run migrations
  // Seed test data
  await seedTestData();
}

export async function cleanupTestDatabase() {
  await prisma.$transaction([
    prisma.order.deleteMany(),
    prisma.ticket.deleteMany(),
    prisma.event.deleteMany(),
    prisma.user.deleteMany(),
  ]);
}

export async function seedTestData() {
  // Create test users
  await prisma.user.createMany({
    data: [
      {
        email: 'organizer@test.com',
        password: await hashPassword('test123'),
        name: 'Test Organizer',
        role: 'organizer',
      },
      {
        email: 'attendee@test.com',
        password: await hashPassword('test123'),
        name: 'Test Attendee',
        role: 'attendee',
      },
    ],
  });

  // Create test event
  const organizer = await prisma.user.findUnique({
    where: { email: 'organizer@test.com' },
  });

  await prisma.event.create({
    data: {
      title: 'Test Event',
      description: 'Integration test event',
      startDate: new Date('2025-07-15'),
      endDate: new Date('2025-07-15'),
      location: 'Test Location',
      organizerId: organizer!.id,
      status: 'published',
      capacity: 100,
    },
  });
}
```

### Example: Event API Integration Tests
```typescript
// __tests__/api/events.test.ts
import request from 'supertest';
import { setupTestDatabase, cleanupTestDatabase } from '@/test-utils/api-test-helper';
import app from '@/app/api/app'; // Your API app

describe('Events API', () => {
  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await cleanupTestDatabase();
  });

  afterEach(async () => {
    // Clean up test data
    await prisma.event.deleteMany({
      where: { title: { startsWith: 'Test' } },
    });
  });

  describe('POST /api/events', () => {
    it('should create event as organizer', async () => {
      // Login as organizer
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'organizer@test.com',
          password: 'test123',
        });

      const token = loginRes.body.token;

      // Create event
      const response = await request(app)
        .post('/api/events')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'Test Integration Event',
          description: 'This is a test event',
          startDate: '2025-08-01T18:00:00Z',
          endDate: '2025-08-01T22:00:00Z',
          location: '123 Test St',
          capacity: 100,
        })
        .expect(201);

      expect(response.body).toMatchObject({
        title: 'Test Integration Event',
        description: 'This is a test event',
        status: 'draft',
      });

      // Verify in database
      const event = await prisma.event.findUnique({
        where: { id: response.body.id },
      });
      expect(event).toBeDefined();
      expect(event!.title).toBe('Test Integration Event');
    });

    it('should reject event creation without authentication', async () => {
      const response = await request(app)
        .post('/api/events')
        .send({
          title: 'Unauthorized Event',
          description: 'Should fail',
        })
        .expect(401);

      expect(response.body.error).toContain('Unauthorized');
    });

    it('should reject event creation with invalid data', async () => {
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'organizer@test.com',
          password: 'test123',
        });

      const token = loginRes.body.token;

      const response = await request(app)
        .post('/api/events')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: '', // Invalid: empty title
          startDate: 'invalid-date', // Invalid: bad date format
        })
        .expect(400);

      expect(response.body.errors).toContainEqual(
        expect.objectContaining({
          field: 'title',
          message: expect.any(String),
        })
      );
    });

    it('should enforce capacity constraints', async () => {
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'organizer@test.com',
          password: 'test123',
        });

      const token = loginRes.body.token;

      const response = await request(app)
        .post('/api/events')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'Capacity Test Event',
          description: 'Testing capacity',
          startDate: '2025-08-01T18:00:00Z',
          endDate: '2025-08-01T22:00:00Z',
          location: 'Test Location',
          capacity: -10, // Invalid: negative capacity
        })
        .expect(400);

      expect(response.body.error).toContain('capacity');
    });
  });

  describe('GET /api/events', () => {
    it('should list all published events', async () => {
      const response = await request(app)
        .get('/api/events')
        .expect(200);

      expect(response.body).toHaveProperty('events');
      expect(Array.isArray(response.body.events)).toBe(true);
      expect(response.body.events[0]).toMatchObject({
        id: expect.any(String),
        title: expect.any(String),
        status: 'published',
      });
    });

    it('should filter events by date', async () => {
      const response = await request(app)
        .get('/api/events')
        .query({
          startDate: '2025-07-01',
          endDate: '2025-07-31',
        })
        .expect(200);

      expect(response.body.events).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            startDate: expect.stringMatching(/2025-07/),
          }),
        ])
      );
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get('/api/events')
        .query({
          page: 1,
          limit: 10,
        })
        .expect(200);

      expect(response.body).toHaveProperty('events');
      expect(response.body).toHaveProperty('pagination');
      expect(response.body.pagination).toMatchObject({
        page: 1,
        limit: 10,
        total: expect.any(Number),
      });
    });
  });

  describe('PUT /api/events/:eventId', () => {
    it('should update event as owner', async () => {
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'organizer@test.com',
          password: 'test123',
        });

      const token = loginRes.body.token;

      // Get event
      const eventsRes = await request(app)
        .get('/api/events')
        .set('Authorization', `Bearer ${token}`);

      const eventId = eventsRes.body.events[0].id;

      // Update event
      const response = await request(app)
        .put(`/api/events/${eventId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'Updated Event Title',
          capacity: 150,
        })
        .expect(200);

      expect(response.body.title).toBe('Updated Event Title');
      expect(response.body.capacity).toBe(150);

      // Verify in database
      const event = await prisma.event.findUnique({
        where: { id: eventId },
      });
      expect(event!.title).toBe('Updated Event Title');
    });

    it('should reject update by non-owner', async () => {
      // Login as attendee
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'attendee@test.com',
          password: 'test123',
        });

      const token = loginRes.body.token;

      const eventsRes = await request(app).get('/api/events');
      const eventId = eventsRes.body.events[0].id;

      const response = await request(app)
        .put(`/api/events/${eventId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'Unauthorized Update',
        })
        .expect(403);

      expect(response.body.error).toContain('permission');
    });
  });

  describe('DELETE /api/events/:eventId', () => {
    it('should delete event as owner', async () => {
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'organizer@test.com',
          password: 'test123',
        });

      const token = loginRes.body.token;

      // Create event first
      const createRes = await request(app)
        .post('/api/events')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'Event to Delete',
          description: 'Will be deleted',
          startDate: '2025-08-01T18:00:00Z',
          endDate: '2025-08-01T22:00:00Z',
          location: 'Test',
        });

      const eventId = createRes.body.id;

      // Delete event
      await request(app)
        .delete(`/api/events/${eventId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      // Verify deletion
      const event = await prisma.event.findUnique({
        where: { id: eventId },
      });
      expect(event).toBeNull();
    });

    it('should not allow deletion of event with orders', async () => {
      // This would require creating orders first
      // Then attempting to delete the event
      // Should return 400 with appropriate error
    });
  });
});
```

### Example: Payment Integration Tests
```typescript
// __tests__/api/payments.test.ts
import request from 'supertest';
import { setupTestDatabase, cleanupTestDatabase } from '@/test-utils/api-test-helper';
import { SquareService } from '@/lib/payments/square.service';

// Mock Square service
jest.mock('@/lib/payments/square.service');

describe('Payment API', () => {
  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await cleanupTestDatabase();
  });

  describe('POST /api/events/:eventId/purchase', () => {
    it('should process payment successfully', async () => {
      const mockSquareService = SquareService as jest.Mocked<typeof SquareService>;
      mockSquareService.prototype.createPayment.mockResolvedValue({
        id: 'payment_123',
        status: 'COMPLETED',
        amount: 5000,
      });

      const eventsRes = await request(app).get('/api/events');
      const eventId = eventsRes.body.events[0].id;

      const response = await request(app)
        .post(`/api/events/${eventId}/purchase`)
        .send({
          sourceId: 'cnon:card-nonce-ok',
          customerEmail: 'customer@test.com',
          customerName: 'Test Customer',
          tickets: [
            {
              ticketTypeId: 'general_admission',
              quantity: 2,
            },
          ],
        })
        .expect(200);

      expect(response.body).toMatchObject({
        orderId: expect.any(String),
        paymentId: 'payment_123',
        status: 'completed',
        tickets: expect.arrayContaining([
          expect.objectContaining({
            qrCode: expect.any(String),
          }),
        ]),
      });

      // Verify order in database
      const order = await prisma.order.findUnique({
        where: { id: response.body.orderId },
        include: { tickets: true },
      });
      expect(order).toBeDefined();
      expect(order!.status).toBe('completed');
      expect(order!.tickets).toHaveLength(2);
    });

    it('should handle payment decline', async () => {
      const mockSquareService = SquareService as jest.Mocked<typeof SquareService>;
      mockSquareService.prototype.createPayment.mockRejectedValue(
        new Error('Card declined')
      );

      const eventsRes = await request(app).get('/api/events');
      const eventId = eventsRes.body.events[0].id;

      const response = await request(app)
        .post(`/api/events/${eventId}/purchase`)
        .send({
          sourceId: 'cnon:card-nonce-declined',
          customerEmail: 'customer@test.com',
          customerName: 'Test Customer',
          tickets: [
            {
              ticketTypeId: 'general_admission',
              quantity: 1,
            },
          ],
        })
        .expect(400);

      expect(response.body.error).toContain('declined');

      // Verify no order was created
      const orders = await prisma.order.findMany({
        where: {
          customerEmail: 'customer@test.com',
        },
      });
      expect(orders).toHaveLength(0);
    });

    it('should enforce event capacity', async () => {
      // Would require setting up event with limited capacity
      // and making purchases to exceed it
    });

    it('should handle idempotency', async () => {
      // Same request twice with idempotency key
      // Should return same result without double-charging
    });
  });

  describe('POST /api/orders/:orderId/refund', () => {
    it('should process refund successfully', async () => {
      const mockSquareService = SquareService as jest.Mocked<typeof SquareService>;
      mockSquareService.prototype.refundPayment.mockResolvedValue({
        id: 'refund_123',
        status: 'COMPLETED',
        amount: 5000,
      });

      // Create order first
      // ... (create order logic)

      const response = await request(app)
        .post(`/api/orders/${orderId}/refund`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          reason: 'Customer request',
        })
        .expect(200);

      expect(response.body).toMatchObject({
        refundId: 'refund_123',
        status: 'refunded',
      });

      // Verify order status updated
      const order = await prisma.order.findUnique({
        where: { id: orderId },
      });
      expect(order!.status).toBe('refunded');
    });
  });
});
```

### Mock External Services
```typescript
// test-utils/mocks/square.mock.ts
export const mockSquareClient = {
  createPayment: jest.fn(),
  refundPayment: jest.fn(),
  listPayments: jest.fn(),
  getPayment: jest.fn(),
};

// test-utils/mocks/email.mock.ts
export const mockEmailService = {
  sendEmail: jest.fn(),
  sendTicketEmail: jest.fn(),
  sendOrderConfirmation: jest.fn(),
};
```

## Implementation Details

### Phase 1: Infrastructure (Day 1)
1. Configure Supertest
2. Set up test database
3. Create test helpers
4. Mock external services
5. Test basic endpoints

### Phase 2: Auth & Events (Day 2)
1. Write authentication tests
2. Write authorization tests
3. Write event CRUD tests
4. Write search and filter tests
5. Test validation and errors

### Phase 3: Payments & Orders (Day 3-4)
1. Write payment processing tests
2. Write order creation tests
3. Write refund tests
4. Write webhook tests
5. Test edge cases

### Phase 4: Additional APIs (Day 5)
1. Write check-in tests
2. Write admin API tests
3. Write analytics tests
4. Improve coverage
5. Document patterns

### File Structure
```
/__tests__/api/
├── auth/
│   ├── login.test.ts
│   ├── register.test.ts
│   └── password-reset.test.ts
├── events/
│   ├── create.test.ts
│   ├── update.test.ts
│   ├── list.test.ts
│   └── search.test.ts
├── orders/
│   ├── purchase.test.ts
│   ├── refund.test.ts
│   └── list.test.ts
├── payments/
│   ├── process.test.ts
│   └── webhooks.test.ts
├── checkin/
│   ├── scan.test.ts
│   └── validate.test.ts
└── admin/
    ├── users.test.ts
    └── analytics.test.ts

/test-utils/mocks/
├── square.mock.ts
├── email.mock.ts
└── storage.mock.ts
```

## Dependencies
- Infrastructure: Test database, mocking tools
- Related: QA-004 (Unit Tests)

## Testing Checklist

### API Endpoints
- [ ] All endpoints tested
- [ ] Authentication works
- [ ] Authorization enforced
- [ ] Validation working
- [ ] Error handling correct

### Database Operations
- [ ] CRUD operations work
- [ ] Transactions handled
- [ ] Constraints enforced
- [ ] Indexes used correctly
- [ ] Data integrity maintained

### External Services
- [ ] Services mocked correctly
- [ ] Error handling tested
- [ ] Retries work
- [ ] Timeouts handled
- [ ] Fallbacks tested

## Performance Metrics
- Test suite execution: < 2 minutes
- Individual test time: < 1 second
- Database setup time: < 5 seconds

## Success Metrics
- API coverage: > 90%
- Test pass rate: 100%
- Integration issues caught: > 80%
- Mean time to debug: < 15 minutes

## Additional Resources
- [Supertest Documentation](https://github.com/visionmedia/supertest)
- [API Testing Best Practices](https://assertible.com/blog/7-http-methods-every-web-developer-should-know-and-how-to-test-them)
- [Testing with Prisma](https://www.prisma.io/docs/guides/testing/unit-testing)

## Notes
- Use test database, never production
- Clean up after each test
- Mock external API calls
- Test happy path and error cases
- Consider contract testing for external APIs