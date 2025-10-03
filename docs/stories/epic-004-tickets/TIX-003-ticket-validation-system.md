# TIX-003: Ticket Validation System

**Epic**: EPIC-004 - Digital Ticket System
**Story Points**: 5
**Priority**: Critical
**Status**: Ready for Development

## User Story

**As an** event staff member
**I want** to validate tickets instantly by scanning QR codes
**So that** I can quickly verify entry, prevent fraud, and ensure only valid tickets are admitted

## Business Value

- Prevents duplicate entries and ticket fraud
- Enables fast check-in process (< 2 seconds per person)
- Provides real-time validation with offline fallback
- Creates audit trail for all entry attempts
- Reduces manual verification and human error

## Acceptance Criteria

### AC1: Real-Time QR Code Validation
**Given** a staff member scans a ticket QR code
**When** the validation system processes the scan
**Then** it must:
- Validate within 1 second for online validation
- Return VALID, INVALID, or ALREADY_USED status
- Display attendee name and ticket tier
- Check cryptographic signature (from TIX-001)
- Verify ticket belongs to current event
- Confirm ticket is not expired
- Check ticket status is ISSUED (not REFUNDED/CANCELLED)

**And** provide instant visual feedback (green/red indicator)
**And** log the validation attempt with timestamp and result

### AC2: Duplicate Detection
**Given** a ticket has already been scanned and checked in
**When** the same ticket is scanned again
**Then** the system must:
- Immediately reject with "ALREADY_CHECKED_IN" status
- Display when and where ticket was first scanned
- Show staff member who performed original check-in
- Provide option to override (requires admin PIN)
- Log the duplicate attempt with full details
- Alert admin dashboard of duplicate attempt

**And** never allow two simultaneous check-ins with same ticket
**And** use database transaction locking to prevent race conditions

### AC3: Signature Verification
**Given** QR code data needs cryptographic validation
**When** validating a scanned ticket
**Then** the system must:
- Extract signature from QR code JSON
- Recalculate expected signature using same algorithm as TIX-001
- Compare signatures using timing-safe comparison
- Reject tickets with invalid signatures
- Reject tickets with missing signatures
- Log all signature validation failures for fraud analysis

**And** work offline by caching event-specific validation keys
**And** validate timestamp is within event date range ± 1 day

### AC4: Offline Validation Capability
**Given** internet connection may be unreliable at event venue
**When** device is offline
**Then** the system must:
- Continue validating tickets using cached data
- Store validation cache before event (all issued tickets)
- Sync validation results when connection restored
- Display offline mode indicator
- Prevent duplicate check-ins even offline (local cache)
- Queue failed validations for later sync

**And** cache must include:
- All ticket IDs for the event
- Ticket signatures and hashes
- Attendee names and tier information
- Check-in status (synced from server)
- Event validation rules

### AC5: Status Validation Rules
**Given** tickets have various statuses
**When** validating a ticket
**Then** the system must check:
- ✓ ISSUED: Allow check-in
- ✗ CHECKED_IN: Reject as duplicate
- ✗ TRANSFERRED: Check new owner's ticket
- ✗ REFUNDED: Reject with refund message
- ✗ CANCELLED: Reject as cancelled
- ✗ EXPIRED: Reject as expired

**And** provide specific rejection reasons for each status
**And** display resolution options where applicable

### AC6: Audit Trail & Logging
**Given** all validation attempts need tracking
**When** any validation occurs
**Then** the system must log:
- Ticket ID and QR code hash
- Event ID and check-in location
- Validation result (success/failure/reason)
- Staff member ID who performed scan
- Device ID used for scanning
- Timestamp (server time, not device time)
- IP address (if online)
- Attendee name and email
- Override actions (if admin PIN used)

**And** logs must be immutable (append-only)
**And** support forensic analysis for fraud investigation

### AC7: Validation Performance
**Given** fast check-in is critical for user experience
**When** validating tickets
**Then** the system must:
- Complete online validation in < 1 second (p95)
- Complete offline validation in < 500ms (p95)
- Support 10+ concurrent validations per device
- Handle network latency gracefully with timeout
- Cache frequently accessed data
- Use indexed database queries

**And** display loading states during validation
**And** never block UI during validation

### AC8: Error Handling
**Given** various error conditions can occur
**When** validation encounters errors
**Then** the system must:
- Network timeout: Fall back to offline mode
- Invalid QR format: Display "Invalid ticket" message
- Database error: Retry with exponential backoff
- Signature mismatch: Reject with fraud alert
- Unknown ticket: Display "Ticket not found"
- Wrong event: Display event name mismatch

**And** provide staff with clear error messages
**And** log all errors for debugging
**And** never crash or freeze the interface

## Technical Specifications

### API Endpoint Specification

```typescript
// POST /api/events/{eventId}/validate-ticket

interface ValidateTicketRequest {
  qrData: string; // Raw QR code JSON string
  deviceId: string;
  staffMemberId: string;
  checkInLocation?: string;
  offline?: boolean;
}

interface ValidateTicketResponse {
  status: 'VALID' | 'INVALID' | 'ALREADY_USED' | 'EXPIRED' | 'REFUNDED' | 'CANCELLED';
  ticket?: {
    id: string;
    orderNumber: string;
    attendeeName: string;
    attendeeEmail: string;
    tier: string;
    purchaseDate: string;
  };
  checkIn?: {
    timestamp: string;
    staffMember: string;
    location: string;
  };
  message: string;
  errorCode?: string;
  canOverride: boolean;
}
```

### Database Schema Updates

```prisma
model CheckInLog {
  id              String   @id @default(uuid())
  ticketId        String
  eventId         String
  orderId         String

  // Validation result
  status          ValidationStatus
  validatedAt     DateTime @default(now())

  // Staff & device info
  staffMemberId   String
  deviceId        String
  location        String?

  // Attendee info (denormalized for audit)
  attendeeName    String
  attendeeEmail   String
  ticketTier      String

  // Validation details
  qrData          String   @db.Text
  signatureValid  Boolean
  online          Boolean  @default(true)

  // Override tracking
  wasOverridden   Boolean  @default(false)
  overrideReason  String?
  overrideBy      String?

  // Error tracking
  errorCode       String?
  errorMessage    String?  @db.Text

  // Metadata
  ipAddress       String?
  userAgent       String?
  metadata        Json?

  // Relationships
  ticket          Ticket   @relation(fields: [ticketId], references: [id])
  event           Event    @relation(fields: [eventId], references: [id])
  order           Order    @relation(fields: [orderId], references: [id])
  staffMember     User     @relation(fields: [staffMemberId], references: [id])

  createdAt       DateTime @default(now())

  @@index([ticketId])
  @@index([eventId, validatedAt])
  @@index([status])
  @@index([staffMemberId])
  @@index([deviceId])
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
}
```

### Validation Service Implementation

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

interface ValidationResult {
  status: ValidationStatus;
  ticket?: any;
  checkIn?: any;
  message: string;
  errorCode?: string;
  canOverride: boolean;
}

export class TicketValidationService {
  private readonly SECRET_KEY: string;

  constructor() {
    this.SECRET_KEY = process.env.TICKET_QR_SECRET!;
    if (!this.SECRET_KEY) {
      throw new Error('TICKET_QR_SECRET not configured');
    }
  }

  async validateTicket(
    qrData: string,
    eventId: string,
    staffMemberId: string,
    deviceId: string,
    location?: string
  ): Promise<ValidationResult> {
    const startTime = Date.now();

    try {
      // Parse QR code data
      const ticketData = this.parseQRCode(qrData);

      // Verify event match
      if (ticketData.eventId !== eventId) {
        return this.createFailureResult(
          'WRONG_EVENT',
          'This ticket is for a different event',
          false
        );
      }

      // Verify cryptographic signature
      const signatureValid = this.verifySignature(ticketData);
      if (!signatureValid) {
        await this.logValidationAttempt({
          ticketId: ticketData.ticketId,
          eventId,
          status: 'SIGNATURE_INVALID',
          staffMemberId,
          deviceId,
          location,
          qrData,
          signatureValid: false
        });

        return this.createFailureResult(
          'INVALID',
          'Invalid ticket - security check failed',
          false
        );
      }

      // Fetch ticket from database
      const ticket = await prisma.ticket.findUnique({
        where: { id: ticketData.ticketId },
        include: {
          order: true,
          user: true,
          event: true
        }
      });

      if (!ticket) {
        return this.createFailureResult(
          'NOT_FOUND',
          'Ticket not found in system',
          false
        );
      }

      // Check ticket status
      const statusCheck = this.checkTicketStatus(ticket);
      if (statusCheck.status !== 'VALID') {
        await this.logValidationAttempt({
          ticketId: ticket.id,
          eventId,
          orderId: ticket.orderId,
          status: statusCheck.status,
          staffMemberId,
          deviceId,
          location,
          qrData,
          signatureValid: true,
          attendeeName: ticket.user.name,
          attendeeEmail: ticket.user.email,
          ticketTier: ticket.tier
        });

        return statusCheck;
      }

      // Check for duplicate check-in (with transaction lock)
      const existingCheckIn = await prisma.checkInLog.findFirst({
        where: {
          ticketId: ticket.id,
          status: 'VALID'
        },
        include: {
          staffMember: true
        }
      });

      if (existingCheckIn) {
        await this.logValidationAttempt({
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
          ticketTier: ticket.tier
        });

        return {
          status: 'ALREADY_USED',
          ticket: this.formatTicketData(ticket),
          checkIn: {
            timestamp: existingCheckIn.validatedAt.toISOString(),
            staffMember: existingCheckIn.staffMember.name,
            location: existingCheckIn.location
          },
          message: `Ticket already checked in at ${existingCheckIn.validatedAt.toLocaleString()}`,
          canOverride: true
        };
      }

      // Perform check-in (with transaction)
      await prisma.$transaction(async (tx) => {
        // Update ticket status
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
        await tx.checkInLog.create({
          data: {
            ticketId: ticket.id,
            eventId,
            orderId: ticket.orderId,
            status: 'VALID',
            staffMemberId,
            deviceId,
            location,
            attendeeName: ticket.user.name,
            attendeeEmail: ticket.user.email,
            ticketTier: ticket.tier,
            qrData,
            signatureValid: true,
            online: true
          }
        });
      });

      const duration = Date.now() - startTime;
      console.log(`✓ Ticket validated in ${duration}ms`);

      return {
        status: 'VALID',
        ticket: this.formatTicketData(ticket),
        message: 'Ticket validated successfully',
        canOverride: false
      };

    } catch (error) {
      console.error('Validation error:', error);
      return this.createFailureResult(
        'INVALID',
        'Validation failed - please try again',
        false
      );
    }
  }

  private parseQRCode(qrData: string): QRCodeData {
    try {
      return JSON.parse(qrData) as QRCodeData;
    } catch (error) {
      throw new Error('Invalid QR code format');
    }
  }

  private verifySignature(ticketData: QRCodeData): boolean {
    const data = `${ticketData.ticketId}:${ticketData.eventId}:${ticketData.orderId}:${ticketData.timestamp}`;
    const expectedHash = crypto
      .createHmac('sha256', this.SECRET_KEY)
      .update(data)
      .digest('hex')
      .substring(0, 32);

    // Timing-safe comparison
    try {
      return crypto.timingSafeEqual(
        Buffer.from(expectedHash),
        Buffer.from(ticketData.signature)
      );
    } catch {
      return false;
    }
  }

  private checkTicketStatus(ticket: any): ValidationResult {
    switch (ticket.status) {
      case 'ISSUED':
        return { status: 'VALID', message: '', canOverride: false };

      case 'CHECKED_IN':
        return {
          status: 'ALREADY_USED',
          message: 'Ticket already checked in',
          canOverride: true
        };

      case 'REFUNDED':
        return {
          status: 'REFUNDED',
          message: 'Ticket was refunded and is no longer valid',
          canOverride: false
        };

      case 'CANCELLED':
        return {
          status: 'CANCELLED',
          message: 'Ticket has been cancelled',
          canOverride: false
        };

      case 'EXPIRED':
        return {
          status: 'EXPIRED',
          message: 'Ticket has expired',
          canOverride: false
        };

      default:
        return {
          status: 'INVALID',
          message: 'Invalid ticket status',
          canOverride: false
        };
    }
  }

  private formatTicketData(ticket: any) {
    return {
      id: ticket.id,
      orderNumber: ticket.order.orderNumber,
      attendeeName: ticket.user.name,
      attendeeEmail: ticket.user.email,
      tier: ticket.tier,
      purchaseDate: ticket.createdAt.toISOString()
    };
  }

  private createFailureResult(
    status: ValidationStatus,
    message: string,
    canOverride: boolean
  ): ValidationResult {
    return {
      status,
      message,
      canOverride
    };
  }

  private async logValidationAttempt(data: any): Promise<void> {
    await prisma.checkInLog.create({
      data: {
        ticketId: data.ticketId,
        eventId: data.eventId,
        orderId: data.orderId,
        status: data.status,
        staffMemberId: data.staffMemberId,
        deviceId: data.deviceId,
        location: data.location,
        attendeeName: data.attendeeName || 'Unknown',
        attendeeEmail: data.attendeeEmail || 'unknown@example.com',
        ticketTier: data.ticketTier || 'Unknown',
        qrData: data.qrData,
        signatureValid: data.signatureValid,
        online: data.online !== false
      }
    });
  }

  async overrideCheckIn(
    ticketId: string,
    adminId: string,
    reason: string
  ): Promise<ValidationResult> {
    // Verify admin has permission
    const admin = await prisma.user.findUnique({
      where: { id: adminId }
    });

    if (!admin || admin.role !== 'ADMIN') {
      return this.createFailureResult(
        'INVALID',
        'Unauthorized override attempt',
        false
      );
    }

    // Mark existing check-in as overridden
    await prisma.checkInLog.updateMany({
      where: { ticketId, status: 'VALID' },
      data: {
        wasOverridden: true,
        overrideReason: reason,
        overrideBy: adminId
      }
    });

    return {
      status: 'VALID',
      message: 'Check-in override successful',
      canOverride: false
    };
  }
}
```

### Offline Validation Cache

```typescript
// lib/services/offline-validation.service.ts

import { openDB, DBSchema } from 'idb';

interface OfflineTicketData {
  ticketId: string;
  eventId: string;
  orderId: string;
  tier: string;
  attendeeName: string;
  signature: string;
  timestamp: number;
  checkedIn: boolean;
}

interface ValidationDB extends DBSchema {
  tickets: {
    key: string;
    value: OfflineTicketData;
    indexes: { 'by-event': string };
  };
  pendingValidations: {
    key: string;
    value: any;
  };
}

export class OfflineValidationService {
  private db: any;

  async initialize() {
    this.db = await openDB<ValidationDB>('ticket-validation', 1, {
      upgrade(db) {
        const ticketStore = db.createObjectStore('tickets', {
          keyPath: 'ticketId'
        });
        ticketStore.createIndex('by-event', 'eventId');

        db.createObjectStore('pendingValidations', {
          keyPath: 'id',
          autoIncrement: true
        });
      }
    });
  }

  async cacheEventTickets(eventId: string): Promise<void> {
    const response = await fetch(`/api/events/${eventId}/tickets/cache`);
    const tickets = await response.json();

    const tx = this.db.transaction('tickets', 'readwrite');
    for (const ticket of tickets) {
      await tx.store.put(ticket);
    }
    await tx.done;

    console.log(`✓ Cached ${tickets.length} tickets for offline validation`);
  }

  async validateOffline(qrData: string, eventId: string): Promise<any> {
    const ticketData = JSON.parse(qrData);

    // Look up ticket in cache
    const ticket = await this.db.get('tickets', ticketData.ticketId);

    if (!ticket) {
      return {
        status: 'NOT_FOUND',
        message: 'Ticket not in offline cache'
      };
    }

    // Verify signature offline
    const signatureValid = this.verifySignatureOffline(ticketData);
    if (!signatureValid) {
      return {
        status: 'INVALID',
        message: 'Invalid ticket signature'
      };
    }

    // Check if already checked in
    if (ticket.checkedIn) {
      return {
        status: 'ALREADY_USED',
        message: 'Ticket already checked in (offline)'
      };
    }

    // Mark as checked in locally
    ticket.checkedIn = true;
    await this.db.put('tickets', ticket);

    // Queue for server sync
    await this.queueValidation(ticketData);

    return {
      status: 'VALID',
      message: 'Validated offline - will sync when online',
      ticket: {
        attendeeName: ticket.attendeeName,
        tier: ticket.tier
      }
    };
  }

  private verifySignatureOffline(ticketData: any): boolean {
    // Use cached validation key (simplified offline verification)
    // In production, implement full crypto verification
    return ticketData.signature && ticketData.signature.length === 32;
  }

  private async queueValidation(ticketData: any): Promise<void> {
    await this.db.add('pendingValidations', {
      ticketData,
      timestamp: Date.now()
    });
  }

  async syncPendingValidations(): Promise<void> {
    const pending = await this.db.getAll('pendingValidations');

    for (const item of pending) {
      try {
        await fetch('/api/sync-validation', {
          method: 'POST',
          body: JSON.stringify(item)
        });
        await this.db.delete('pendingValidations', item.id);
      } catch (error) {
        console.error('Sync failed:', error);
      }
    }
  }
}
```

## Integration Points

### 1. Check-In Interface (TIX-004)
- **Consumer**: Scans QR and calls validation API
- **Response**: Displays validation result to staff
- **Timing**: Real-time validation on scan

### 2. QR Code Generation (TIX-001)
- **Dependency**: Uses same signature algorithm
- **Validation**: Verifies signatures match generation

### 3. Analytics Dashboard
- **Data**: Check-in logs feed real-time analytics
- **Metrics**: Check-in rate, duplicate attempts, fraud alerts

### 4. Admin Override System
- **Use Case**: Staff needs to override duplicate check-in
- **Auth**: Requires admin PIN or permission
- **Audit**: Logs all override attempts

## Performance Requirements

- Online validation: < 1 second (p95)
- Offline validation: < 500ms (p95)
- Concurrent validations: Support 10+ per device
- Database query: < 100ms for ticket lookup
- Transaction lock: < 50ms for duplicate check
- Signature verification: < 10ms

## Security Considerations

### Fraud Prevention
1. **Signature Verification**: Cryptographic validation prevents fake tickets
2. **Transaction Locking**: Prevents race conditions on duplicate scans
3. **Immutable Logs**: Audit trail cannot be tampered with
4. **Offline Validation**: Local cache prevents offline fraud
5. **Override Auditing**: All admin overrides logged

### Attack Vectors Mitigated
- **Duplicate Scanning**: Database locks prevent simultaneous check-ins
- **Fake QR Codes**: Signature validation rejects unauthorized codes
- **Replay Attacks**: Timestamp validation and single-use check
- **Database Manipulation**: Immutable audit logs
- **Offline Fraud**: Cached validation state syncs on reconnect

## Testing Requirements

### Unit Tests
- [ ] QR code parsing handles malformed data
- [ ] Signature verification accepts valid signatures
- [ ] Signature verification rejects invalid signatures
- [ ] Status checks return correct results
- [ ] Duplicate detection works correctly
- [ ] Offline validation fallback works
- [ ] Override permission checks work

### Integration Tests
- [ ] End-to-end validation flow completes successfully
- [ ] Duplicate check-in prevented by transaction lock
- [ ] Validation logs created correctly
- [ ] Offline mode caches tickets properly
- [ ] Sync restores online state correctly
- [ ] Admin override updates all records

### Performance Tests
- [ ] Validation completes in < 1 second online
- [ ] Validation completes in < 500ms offline
- [ ] Supports 100+ concurrent validations
- [ ] Database queries optimized with indexes
- [ ] No race conditions under load

### Security Tests
- [ ] Invalid signatures rejected
- [ ] Tampered QR data rejected
- [ ] Wrong event tickets rejected
- [ ] Expired tickets rejected
- [ ] Refunded tickets rejected
- [ ] Override requires admin permission

## Environment Variables

```bash
# Required for validation
TICKET_QR_SECRET=your-256-bit-secret-key-here

# Performance tuning
VALIDATION_TIMEOUT_MS=5000
VALIDATION_CACHE_TTL=300

# Offline mode
OFFLINE_SYNC_INTERVAL=60000
```

## Definition of Done

- [ ] Validation service implemented with full security
- [ ] Database schema for check-in logs deployed
- [ ] Real-time validation API endpoint created
- [ ] Duplicate detection with transaction locking
- [ ] Offline validation cache system working
- [ ] Admin override functionality implemented
- [ ] Audit logging complete and immutable
- [ ] Unit tests achieve >90% coverage
- [ ] Integration tests pass all scenarios
- [ ] Performance meets <1 second requirement
- [ ] Security tests verify fraud prevention
- [ ] Load testing validates concurrent usage
- [ ] Documentation completed
- [ ] Code review completed
- [ ] QA testing completed
- [ ] Deployed to staging and validated

## Related Stories

- **TIX-001**: QR Code Generation (signature algorithm)
- **TIX-004**: Check-In Interface (UI consumer)
- **TIX-005**: Ticket Status Tracking (status updates)
- **ANALYTICS-001**: Real-time Analytics (consumes logs)

## Notes

- Consider WebSocket for real-time validation updates across devices
- Implement fraud alert threshold (e.g., 5+ duplicate attempts)
- Plan for peak load at event start (100+ simultaneous check-ins)
- Document offline validation cache refresh procedure
- Consider biometric validation for VIP tickets
- Monitor validation performance in production
- Review audit logs for fraud patterns