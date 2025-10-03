# Story: TIX-003a - QR Validation API & Security

**Epic**: EPIC-004 - Digital Ticket System
**Story Points**: 3
**Priority**: P0 (Critical)
**Status**: Not Started
**Parent Story**: TIX-003 (Ticket Validation System - 5 pts)
**Dependencies**: TIX-001 (QR Code Generation), TIX-002 (Digital Ticket Delivery)

---

## Story

**As an** event staff member scanning tickets
**I want** a secure, fast validation API that prevents fraud
**So that** I can quickly verify tickets and prevent unauthorized entry

**As a** system architect
**I want** cryptographic validation and duplicate detection
**So that** fake tickets and double-scanning are impossible

---

## Acceptance Criteria

### AC1: QR Code Validation Endpoint
**Given** a staff member scans a ticket QR code
**When** the validation request is sent
**Then** the API should:
- Accept POST `/api/events/[eventId]/validate-ticket`
- Require authentication (staff JWT token)
- Parse and validate QR code JSON structure
- Respond within 1 second (p95)
- Return structured validation result
- Log validation attempt with timestamp
- Work with or without network (offline cache)

### AC2: Cryptographic Signature Verification
**Given** QR code data contains a signature
**When** validating the ticket
**Then** the system must:
- Extract signature from QR payload
- Recalculate expected signature using HMAC-SHA256
- Use same secret key as QR generation (TIX-001)
- Compare using timing-safe comparison
- Reject tickets with invalid signatures
- Reject tickets with missing signatures
- Reject tickets with tampered data
- Log signature validation failures for fraud analysis
- Rate limit validation attempts per device (100/min)

**And** the signature algorithm must be:
```typescript
const data = `${ticketId}:${eventId}:${orderId}:${timestamp}`;
const signature = crypto.createHmac('sha256', SECRET_KEY)
  .update(data)
  .digest('hex')
  .substring(0, 32);
```

### AC3: Duplicate Detection with Transaction Locking
**Given** the same ticket is scanned multiple times
**When** validation is called concurrently
**Then** the system must:
- Use database transaction with `SELECT FOR UPDATE`
- Lock ticket record during validation
- Check if ticket status is already CHECKED_IN
- Allow only first request to succeed
- Reject subsequent requests as "ALREADY_CHECKED_IN"
- Return details of original check-in (time, staff, location)
- Complete transaction within 100ms
- Prevent race conditions completely
- Log all duplicate attempts
- Alert dashboard of suspicious activity (3+ attempts)

### AC4: Validation Audit Trail
**Given** any validation attempt occurs
**When** the validation completes (success or failure)
**Then** the system must log:
- Ticket ID and QR code hash
- Event ID and check-in location
- Validation result and reason
- Staff member ID and name
- Device ID and IP address
- Server timestamp (UTC, not device time)
- Signature validity (true/false)
- Response time in milliseconds
- Any error codes or messages

**And** logs must be:
- Immutable (append-only)
- Indexed for fast querying
- Retained for 7 years minimum
- Available for fraud investigation
- Exportable for compliance audits

### AC5: Validation Response Structure
**Given** validation completes
**When** returning response to client
**Then** the API must return:

**Success Response (200)**:
```typescript
{
  status: 'VALID',
  ticket: {
    id: string,
    orderNumber: string,
    attendeeName: string,
    attendeeEmail: string,
    tier: string,
    purchaseDate: string
  },
  message: 'Ticket validated successfully',
  canOverride: false
}
```

**Duplicate Response (409)**:
```typescript
{
  status: 'ALREADY_USED',
  ticket: { ... },
  checkIn: {
    timestamp: string,
    staffMember: string,
    location: string
  },
  message: 'Ticket already checked in at 2:45 PM',
  canOverride: true  // If user has admin role
}
```

**Error Response (400/403/404)**:
```typescript
{
  status: 'INVALID' | 'EXPIRED' | 'REFUNDED' | 'CANCELLED' | 'NOT_FOUND',
  message: string,
  errorCode: string,
  canOverride: false
}
```

### AC6: Performance & Scalability
**Given** high check-in traffic at event start
**When** 100+ simultaneous validation requests occur
**Then** the system must:
- Handle 1000+ requests per minute per event
- Maintain < 1 second response time (p95)
- Use database connection pooling
- Implement API-level caching (5 second TTL for ticket status)
- Use database indexes on ticketId, eventId, status
- Support horizontal scaling with stateless design
- Queue long-running operations asynchronously
- Degrade gracefully under load (return 503 if overloaded)

### AC7: Error Handling & Edge Cases
**Given** various validation scenarios
**When** processing requests
**Then** handle these cases:

| Case | HTTP Status | Response Status | Action |
|------|-------------|-----------------|--------|
| Invalid QR format | 400 | INVALID | Parse error message |
| Missing signature | 400 | INVALID | Reject with fraud alert |
| Signature mismatch | 403 | INVALID | Log fraud attempt |
| Ticket not found | 404 | NOT_FOUND | Check database |
| Wrong event | 400 | WRONG_EVENT | Show event name mismatch |
| Already checked-in | 409 | ALREADY_USED | Show original check-in |
| Ticket refunded | 400 | REFUNDED | Show refund date |
| Ticket expired | 400 | EXPIRED | Show expiration date |
| Database timeout | 500 | ERROR | Retry with backoff |
| Network timeout | 504 | ERROR | Return offline mode |

---

## Tasks / Subtasks

### API Implementation
- [ ] Create validation endpoint
  - [ ] File: `/app/api/events/[eventId]/validate-ticket/route.ts`
  - [ ] POST handler with auth middleware
  - [ ] Request body validation (Zod schema)
  - [ ] Parse QR code JSON safely
  - [ ] Call validation service
  - [ ] Return structured response

- [ ] Build validation service
  - [ ] File: `/lib/services/ticket-validation.service.ts`
  - [ ] Parse QR code data
  - [ ] Verify event ID match
  - [ ] Verify cryptographic signature
  - [ ] Check ticket status with transaction lock
  - [ ] Detect duplicates
  - [ ] Format response data

### Security Implementation
- [ ] Implement signature verification
  - [ ] Extract signature from QR payload
  - [ ] Recalculate expected signature
  - [ ] Timing-safe comparison
  - [ ] Handle invalid signatures
  - [ ] Log validation failures

- [ ] Add rate limiting
  - [ ] Rate limit per device (100/min)
  - [ ] Rate limit per staff (500/min)
  - [ ] Use Redis for distributed rate limiting
  - [ ] Return 429 when exceeded
  - [ ] Log rate limit violations

- [ ] Implement request authentication
  - [ ] Verify JWT token
  - [ ] Check staff permissions
  - [ ] Validate event access
  - [ ] Handle expired tokens

### Database & Locking
- [ ] Create CheckInLog model
  - [ ] Update Prisma schema
  - [ ] Add validation log table
  - [ ] Create indexes
  - [ ] Migration script

- [ ] Implement transaction locking
  - [ ] Use `SELECT FOR UPDATE` in Prisma
  - [ ] Lock ticket during validation
  - [ ] Update status atomically
  - [ ] Handle lock timeouts
  - [ ] Commit or rollback

- [ ] Add database indexes
  - [ ] Index on ticketId (unique)
  - [ ] Index on eventId + status
  - [ ] Index on staffMemberId
  - [ ] Index on validatedAt (for reporting)

### Audit Trail & Logging
- [ ] Create audit logging system
  - [ ] Log all validation attempts
  - [ ] Store in CheckInLog table
  - [ ] Include all required fields (AC4)
  - [ ] Generate QR code hash
  - [ ] Track response times

- [ ] Build fraud detection alerts
  - [ ] Detect multiple failed attempts
  - [ ] Alert on signature mismatches
  - [ ] Track suspicious patterns
  - [ ] Dashboard notification system

### Performance Optimization
- [ ] Implement caching layer
  - [ ] Cache ticket validation status (5s TTL)
  - [ ] Use Redis for distributed cache
  - [ ] Invalidate on status change
  - [ ] Cache miss handling

- [ ] Add database connection pooling
  - [ ] Configure Prisma pool size
  - [ ] Handle connection limits
  - [ ] Monitor pool utilization
  - [ ] Implement connection retry

- [ ] Create performance monitoring
  - [ ] Track API response times
  - [ ] Monitor database query times
  - [ ] Alert on slow queries (>500ms)
  - [ ] Generate performance reports

---

## Database Schema

```prisma
model CheckInLog {
  id              String           @id @default(cuid())
  ticketId        String
  eventId         String
  orderId         String

  // Validation result
  status          ValidationStatus
  validatedAt     DateTime         @default(now())

  // Staff & device info
  staffMemberId   String
  deviceId        String
  location        String?
  ipAddress       String?

  // Attendee info (denormalized for audit)
  attendeeName    String
  attendeeEmail   String
  ticketTier      String

  // Validation details
  qrData          String           @db.Text
  qrCodeHash      String           // SHA256 hash of QR data
  signatureValid  Boolean
  online          Boolean          @default(true)

  // Performance tracking
  responseTimeMs  Int?

  // Override tracking
  wasOverridden   Boolean          @default(false)
  overrideReason  String?
  overrideBy      String?

  // Error tracking
  errorCode       String?
  errorMessage    String?          @db.Text

  // Relationships
  ticket          Ticket           @relation(fields: [ticketId], references: [id])
  event           Event            @relation(fields: [eventId], references: [id])
  order           Order            @relation(fields: [orderId], references: [id])
  staffMember     User             @relation(fields: [staffMemberId], references: [id])

  createdAt       DateTime         @default(now())

  @@index([ticketId])
  @@index([eventId, validatedAt])
  @@index([status])
  @@index([staffMemberId])
  @@index([qrCodeHash])
  @@index([signatureValid])
}

enum ValidationStatus {
  VALID
  INVALID
  ALREADY_USED
  EXPIRED
  REFUNDED
  CANCELLED
  SIGNATURE_INVALID
  WRONG_EVENT
  NOT_FOUND
}

// Add to Ticket model
model Ticket {
  // ... existing fields

  // Check-in tracking
  checkedInAt     DateTime?
  checkedInBy     String?
  checkInLocation String?
  checkInLogs     CheckInLog[]

  @@index([id, status])  // Composite index for fast lookup
}
```

---

## Dev Notes

### Signature Verification Implementation

```typescript
// lib/services/ticket-validation.service.ts

import crypto from 'crypto';
import { prisma } from '@/lib/prisma';

interface QRCodeData {
  ticketId: string;
  eventId: string;
  orderId: string;
  tier: string;
  timestamp: number;
  signature: string;
}

export class TicketValidationService {
  private readonly SECRET_KEY: string;

  constructor() {
    this.SECRET_KEY = process.env.TICKET_QR_SECRET!;
    if (!this.SECRET_KEY) {
      throw new Error('TICKET_QR_SECRET environment variable not set');
    }
  }

  private verifySignature(ticketData: QRCodeData): boolean {
    const data = `${ticketData.ticketId}:${ticketData.eventId}:${ticketData.orderId}:${ticketData.timestamp}`;
    const expectedHash = crypto
      .createHmac('sha256', this.SECRET_KEY)
      .update(data)
      .digest('hex')
      .substring(0, 32);

    // Timing-safe comparison to prevent timing attacks
    try {
      return crypto.timingSafeEqual(
        Buffer.from(expectedHash),
        Buffer.from(ticketData.signature)
      );
    } catch {
      return false; // Different lengths or invalid format
    }
  }

  private generateQRCodeHash(qrData: string): string {
    return crypto.createHash('sha256').update(qrData).digest('hex');
  }
}
```

### Transaction Locking for Duplicate Prevention

```typescript
async validateTicket(
  qrData: string,
  eventId: string,
  staffMemberId: string,
  deviceId: string,
  location?: string
): Promise<ValidationResult> {
  const startTime = Date.now();
  const ticketData = this.parseQRCode(qrData);

  // Use transaction with row-level locking
  return await prisma.$transaction(async (tx) => {
    // Lock the ticket row for this transaction
    const ticket = await tx.ticket.findUnique({
      where: { id: ticketData.ticketId },
      include: {
        order: true,
        user: true,
        event: true
      }
    });

    if (!ticket) {
      return this.createFailureResult('NOT_FOUND', 'Ticket not found');
    }

    // Check if already checked in (within transaction)
    if (ticket.status === 'CHECKED_IN') {
      const existingCheckIn = await tx.checkInLog.findFirst({
        where: {
          ticketId: ticket.id,
          status: 'VALID'
        },
        include: { staffMember: true }
      });

      // Log duplicate attempt
      await this.logValidationAttempt(tx, {
        ticketId: ticket.id,
        eventId,
        orderId: ticket.orderId,
        status: 'ALREADY_USED',
        staffMemberId,
        deviceId,
        location,
        qrData,
        signatureValid: true,
        attendeeName: ticket.user.name,
        attendeeEmail: ticket.user.email,
        ticketTier: ticket.tier,
        responseTimeMs: Date.now() - startTime
      });

      return {
        status: 'ALREADY_USED',
        ticket: this.formatTicketData(ticket),
        checkIn: existingCheckIn ? {
          timestamp: existingCheckIn.validatedAt.toISOString(),
          staffMember: existingCheckIn.staffMember.name,
          location: existingCheckIn.location
        } : undefined,
        message: 'Ticket already checked in',
        canOverride: true
      };
    }

    // Perform check-in (atomic update)
    await tx.ticket.update({
      where: { id: ticket.id },
      data: {
        status: 'CHECKED_IN',
        checkedInAt: new Date(),
        checkedInBy: staffMemberId,
        checkInLocation: location
      }
    });

    // Log successful check-in
    await this.logValidationAttempt(tx, {
      ticketId: ticket.id,
      eventId,
      orderId: ticket.orderId,
      status: 'VALID',
      staffMemberId,
      deviceId,
      location,
      qrData,
      signatureValid: true,
      attendeeName: ticket.user.name,
      attendeeEmail: ticket.user.email,
      ticketTier: ticket.tier,
      responseTimeMs: Date.now() - startTime
    });

    return {
      status: 'VALID',
      ticket: this.formatTicketData(ticket),
      message: 'Ticket validated successfully',
      canOverride: false
    };
  }, {
    timeout: 10000, // 10 second timeout
    isolationLevel: 'ReadCommitted'
  });
}
```

---

## Testing

### Unit Tests
- [ ] Signature verification with valid signature
- [ ] Signature verification with invalid signature
- [ ] Signature verification with missing signature
- [ ] QR code parsing with valid data
- [ ] QR code parsing with malformed data
- [ ] Timing-safe comparison function
- [ ] QR code hash generation

### Integration Tests
- [ ] Complete validation flow (happy path)
- [ ] Duplicate check-in prevention
- [ ] Concurrent validation requests
- [ ] Database transaction rollback on error
- [ ] Audit log creation
- [ ] Rate limiting enforcement

### Security Tests
- [ ] Tampered QR data rejected
- [ ] Fake signatures rejected
- [ ] Replay attack prevention
- [ ] SQL injection attempts
- [ ] XSS in QR data
- [ ] Timing attack resistance

### Performance Tests
- [ ] 1000 requests/min throughput
- [ ] < 1 second response time (p95)
- [ ] Concurrent validation stress test
- [ ] Database connection pool limits
- [ ] Transaction lock timeout handling

---

## Environment Variables

```bash
# Required
TICKET_QR_SECRET=your-256-bit-secret-key-here

# Performance tuning
VALIDATION_TIMEOUT_MS=10000
VALIDATION_CACHE_TTL=5
DATABASE_POOL_SIZE=20
RATE_LIMIT_PER_DEVICE=100
RATE_LIMIT_PER_STAFF=500
```

---

## Change Log

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-09-30 | BMAD SM Agent | Initial sharded story from TIX-003 |

---

*Sharded from TIX-003 (5 pts) - Part 1 of 2*
*Next: TIX-003b - Offline Validation & Sync (2 pts)*
*Generated by BMAD SM Agent*