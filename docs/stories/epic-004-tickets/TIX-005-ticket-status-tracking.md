# TIX-005: Ticket Status Tracking System

**Epic**: EPIC-004 - Digital Ticket System
**Story Points**: 2
**Priority**: High
**Status**: Ready for Development

## User Story

**As the** system
**I want** to track the complete lifecycle of every ticket from issuance to check-in or refund
**So that** we have a complete audit trail and can accurately report on ticket status

## Business Value

- Complete audit trail for compliance and dispute resolution
- Accurate analytics on ticket usage and refunds
- Enables automated business rules based on ticket status
- Supports customer service with detailed ticket history
- Prevents fraud by tracking all state transitions

## Acceptance Criteria

### AC1: Ticket Status Enum Definition
**Given** tickets move through various states in their lifecycle
**When** the system is designed
**Then** it must support these status values:
- **ISSUED**: Ticket created and sent to customer (initial state)
- **CHECKED_IN**: Ticket used for event entry (terminal state)
- **TRANSFERRED**: Ticket ownership transferred to another user
- **REFUNDED**: Ticket refunded, no longer valid (terminal state)
- **CANCELLED**: Ticket cancelled by admin (terminal state)
- **EXPIRED**: Ticket expired after event end date (terminal state)

**And** each status must have clear definition and business rules
**And** status transitions must be restricted to valid paths only

### AC2: Valid Status Transitions
**Given** ticket statuses have logical progression rules
**When** a status change is attempted
**Then** the system must enforce these valid transitions:

```
ISSUED → CHECKED_IN    (normal check-in)
ISSUED → TRANSFERRED   (owner changes ticket)
ISSUED → REFUNDED      (customer requests refund)
ISSUED → CANCELLED     (admin cancels ticket)
ISSUED → EXPIRED       (event ends, ticket unused)

TRANSFERRED → ISSUED   (transfer completes, new ticket issued)
TRANSFERRED → REFUNDED (refund during transfer)

CHECKED_IN → [terminal] (no further changes allowed)
REFUNDED → [terminal]   (no further changes allowed)
CANCELLED → [terminal]  (no further changes allowed)
EXPIRED → [terminal]    (no further changes allowed)
```

**And** invalid transitions must be rejected with error message
**And** all transitions must be logged in status history

### AC3: Status History Tracking
**Given** we need complete audit trail of ticket lifecycle
**When** ticket status changes
**Then** the system must record:
- Previous status
- New status
- Timestamp of change (server time, not client time)
- Actor who initiated change (user ID, staff ID, system)
- Reason for change (text field)
- IP address of request (if user-initiated)
- Related entity IDs (order ID, refund ID, transfer ID)
- Metadata (JSON field for additional context)

**And** history records must be immutable (no updates/deletes)
**And** support querying full history for any ticket
**And** support filtering history by status, date range, actor

### AC4: Automatic Status Updates
**Given** some status changes are triggered by system events
**When** specific conditions occur
**Then** the system must automatically update status:

- **After successful check-in**: ISSUED → CHECKED_IN
- **After event ends + 24 hours**: ISSUED → EXPIRED (for unchecked tickets)
- **After refund processed**: ISSUED/TRANSFERRED → REFUNDED
- **After transfer completes**: TRANSFERRED → ISSUED (new ticket)
- **Admin cancellation**: any status → CANCELLED (with admin reason)

**And** automatic updates must include system as actor
**And** include trigger reason in history

### AC5: Status-Based Business Rules
**Given** ticket status determines what actions are allowed
**When** performing ticket operations
**Then** the system must enforce:

- **ISSUED tickets**: Can check in, transfer, request refund
- **CHECKED_IN tickets**: Cannot check in again, cannot transfer, cannot refund
- **TRANSFERRED tickets**: Original owner cannot use, new owner can check in
- **REFUNDED tickets**: Cannot check in, cannot transfer
- **CANCELLED tickets**: Cannot check in, cannot transfer
- **EXPIRED tickets**: Cannot check in, may be eligible for refund (policy dependent)

**And** API endpoints must validate status before operations
**And** return clear error messages for invalid operations

### AC6: Status Reporting & Analytics
**Given** management needs visibility into ticket statuses
**When** generating reports
**Then** the system must provide:
- Count of tickets by status for any event
- Status breakdown by ticket tier
- Status change timeline (daily/hourly)
- Average time in each status
- Conversion rates (ISSUED → CHECKED_IN)
- Refund rate by event/tier
- Expiration rate (tickets unused)

**And** reports must be real-time or near-real-time (< 5 min lag)
**And** support exporting data as CSV/JSON

### AC7: Status Display in UI
**Given** users and staff need to see ticket status
**When** viewing tickets
**Then** the interface must display:
- Current status with color coding
- Status badge/icon appropriate for each state
- Human-readable status description
- Timestamp of last status change
- Action buttons based on current status
- Status history timeline (expandable)

**And** use consistent color scheme:
- ISSUED: Blue
- CHECKED_IN: Green
- TRANSFERRED: Orange
- REFUNDED: Gray
- CANCELLED: Red
- EXPIRED: Dark Gray

### AC8: Status Consistency & Data Integrity
**Given** status is critical for business operations
**When** updating ticket status
**Then** the system must ensure:
- Use database transactions for status changes
- Validate transition rules in database constraints
- Prevent concurrent status changes (optimistic locking)
- Rollback on validation failures
- Trigger webhooks/events on status change
- Maintain referential integrity with related records

**And** run daily consistency checks
**And** alert admins of any status anomalies

## Technical Specifications

### Database Schema

```prisma
model Ticket {
  id              String   @id @default(uuid())
  orderId         String
  eventId         String
  userId          String

  // Current status
  status          TicketStatus @default(ISSUED)
  statusChangedAt DateTime @default(now())
  statusChangedBy String?  // User/Staff ID or 'SYSTEM'

  // QR code data
  qrToken         String   @unique
  qrHash          String   @unique @index
  qrCodePNG       String   @db.Text
  qrCodeSVG       String   @db.Text
  qrGeneratedAt   DateTime @default(now())
  qrExpiresAt     DateTime

  // Ticket details
  tier            String
  price           Decimal  @db.Decimal(10, 2)

  // Check-in tracking
  checkedInAt     DateTime?
  checkedInBy     String?
  checkInLocation String?

  // Transfer tracking
  originalOwnerId String?
  transferredAt   DateTime?
  transferredTo   String?

  // Refund tracking
  refundedAt      DateTime?
  refundAmount    Decimal? @db.Decimal(10, 2)
  refundReason    String?

  // Relationships
  order           Order    @relation(fields: [orderId], references: [id])
  event           Event    @relation(fields: [eventId], references: [id])
  user            User     @relation(fields: [userId], references: [id])

  // Status history
  statusHistory   TicketStatusHistory[]
  checkInLogs     CheckInLog[]

  // Timestamps
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@index([status])
  @@index([eventId, status])
  @@index([userId, status])
  @@index([orderId])
}

enum TicketStatus {
  ISSUED
  CHECKED_IN
  TRANSFERRED
  REFUNDED
  CANCELLED
  EXPIRED
}

model TicketStatusHistory {
  id              String   @id @default(uuid())
  ticketId        String
  orderId         String
  eventId         String

  // Status change details
  fromStatus      TicketStatus?
  toStatus        TicketStatus
  changedAt       DateTime @default(now())
  changedBy       String   // User ID, Staff ID, or 'SYSTEM'
  actorType       ActorType @default(SYSTEM)

  // Reason and context
  reason          String?  @db.Text
  metadata        Json?

  // Request details
  ipAddress       String?
  userAgent       String?

  // Related entities
  relatedRefundId String?
  relatedTransferId String?

  // Relationships
  ticket          Ticket   @relation(fields: [ticketId], references: [id])
  order           Order    @relation(fields: [orderId], references: [id])
  event           Event    @relation(fields: [eventId], references: [id])

  createdAt       DateTime @default(now())

  @@index([ticketId, changedAt])
  @@index([toStatus])
  @@index([changedBy])
  @@index([eventId, changedAt])
}

enum ActorType {
  USER
  STAFF
  ADMIN
  SYSTEM
}
```

### Status Management Service

```typescript
// lib/services/ticket-status.service.ts

import { prisma } from '@/lib/prisma';
import { TicketStatus, ActorType } from '@prisma/client';

interface StatusChangeParams {
  ticketId: string;
  newStatus: TicketStatus;
  changedBy: string;
  actorType: ActorType;
  reason?: string;
  metadata?: any;
  ipAddress?: string;
  userAgent?: string;
}

export class TicketStatusService {
  // Valid status transitions
  private static readonly VALID_TRANSITIONS: Record<TicketStatus, TicketStatus[]> = {
    ISSUED: ['CHECKED_IN', 'TRANSFERRED', 'REFUNDED', 'CANCELLED', 'EXPIRED'],
    TRANSFERRED: ['ISSUED', 'REFUNDED'], // Can create new ticket or refund
    CHECKED_IN: [], // Terminal state
    REFUNDED: [], // Terminal state
    CANCELLED: [], // Terminal state
    EXPIRED: [] // Terminal state
  };

  async changeStatus(params: StatusChangeParams): Promise<void> {
    const { ticketId, newStatus, changedBy, actorType, reason, metadata, ipAddress, userAgent } = params;

    // Fetch current ticket with lock
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: { order: true, event: true }
    });

    if (!ticket) {
      throw new Error('Ticket not found');
    }

    // Validate transition
    this.validateTransition(ticket.status, newStatus);

    // Perform status change in transaction
    await prisma.$transaction(async (tx) => {
      // Update ticket status
      await tx.ticket.update({
        where: { id: ticketId },
        data: {
          status: newStatus,
          statusChangedAt: new Date(),
          statusChangedBy: changedBy,
          // Update specific fields based on new status
          ...(newStatus === 'CHECKED_IN' && { checkedInAt: new Date(), checkedInBy: changedBy }),
          ...(newStatus === 'REFUNDED' && { refundedAt: new Date() }),
          ...(newStatus === 'TRANSFERRED' && { transferredAt: new Date() })
        }
      });

      // Create status history record
      await tx.ticketStatusHistory.create({
        data: {
          ticketId,
          orderId: ticket.orderId,
          eventId: ticket.eventId,
          fromStatus: ticket.status,
          toStatus: newStatus,
          changedBy,
          actorType,
          reason,
          metadata,
          ipAddress,
          userAgent
        }
      });
    });

    // Trigger post-status-change actions
    await this.handleStatusChangeEffects(ticket, newStatus);

    console.log(`✓ Ticket ${ticketId} status changed: ${ticket.status} → ${newStatus}`);
  }

  private validateTransition(currentStatus: TicketStatus, newStatus: TicketStatus): void {
    const validTransitions = TicketStatusService.VALID_TRANSITIONS[currentStatus];

    if (!validTransitions.includes(newStatus)) {
      throw new Error(
        `Invalid status transition: ${currentStatus} → ${newStatus}. ` +
        `Valid transitions from ${currentStatus}: ${validTransitions.join(', ')}`
      );
    }
  }

  private async handleStatusChangeEffects(ticket: any, newStatus: TicketStatus): Promise<void> {
    switch (newStatus) {
      case 'CHECKED_IN':
        // Trigger analytics event
        // Send check-in notification
        break;

      case 'REFUNDED':
        // Trigger refund processing
        // Send refund confirmation email
        break;

      case 'CANCELLED':
        // Send cancellation notification
        break;

      case 'EXPIRED':
        // Log expiration
        break;
    }
  }

  async getStatusHistory(ticketId: string): Promise<any[]> {
    return await prisma.ticketStatusHistory.findMany({
      where: { ticketId },
      orderBy: { changedAt: 'desc' },
      include: {
        ticket: {
          select: {
            id: true,
            status: true
          }
        }
      }
    });
  }

  async getStatusSummary(eventId: string): Promise<Record<TicketStatus, number>> {
    const results = await prisma.ticket.groupBy({
      by: ['status'],
      where: { eventId },
      _count: true
    });

    const summary: any = {
      ISSUED: 0,
      CHECKED_IN: 0,
      TRANSFERRED: 0,
      REFUNDED: 0,
      CANCELLED: 0,
      EXPIRED: 0
    };

    results.forEach((result) => {
      summary[result.status] = result._count;
    });

    return summary;
  }

  async expireUnusedTickets(eventId: string): Promise<number> {
    // Find event end date
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { endDate: true }
    });

    if (!event) {
      throw new Error('Event not found');
    }

    // Calculate expiration cutoff (event end + 24 hours)
    const expirationCutoff = new Date(event.endDate);
    expirationCutoff.setHours(expirationCutoff.getHours() + 24);

    // Check if past expiration
    if (new Date() < expirationCutoff) {
      return 0;
    }

    // Find all ISSUED tickets for this event
    const ticketsToExpire = await prisma.ticket.findMany({
      where: {
        eventId,
        status: 'ISSUED'
      },
      select: { id: true, orderId: true }
    });

    // Expire each ticket
    for (const ticket of ticketsToExpire) {
      await this.changeStatus({
        ticketId: ticket.id,
        newStatus: 'EXPIRED',
        changedBy: 'SYSTEM',
        actorType: 'SYSTEM',
        reason: 'Event ended more than 24 hours ago',
        metadata: { expirationCutoff: expirationCutoff.toISOString() }
      });
    }

    console.log(`✓ Expired ${ticketsToExpire.length} unused tickets for event ${eventId}`);
    return ticketsToExpire.length;
  }

  async canPerformAction(ticketId: string, action: string): Promise<{ allowed: boolean; reason?: string }> {
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      select: { status: true }
    });

    if (!ticket) {
      return { allowed: false, reason: 'Ticket not found' };
    }

    // Define action permissions by status
    const permissions: Record<string, TicketStatus[]> = {
      checkIn: ['ISSUED'],
      transfer: ['ISSUED'],
      refund: ['ISSUED', 'TRANSFERRED'],
      view: ['ISSUED', 'CHECKED_IN', 'TRANSFERRED', 'REFUNDED', 'CANCELLED', 'EXPIRED']
    };

    const allowedStatuses = permissions[action];
    if (!allowedStatuses) {
      return { allowed: false, reason: 'Unknown action' };
    }

    const allowed = allowedStatuses.includes(ticket.status);
    const reason = allowed ? undefined : `Cannot ${action} ticket with status ${ticket.status}`;

    return { allowed, reason };
  }
}
```

### Scheduled Task: Expire Tickets

```typescript
// app/api/cron/expire-tickets/route.ts

import { NextResponse } from 'next/server';
import { TicketStatusService } from '@/lib/services/ticket-status.service';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  // Verify cron secret
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const statusService = new TicketStatusService();

  // Find events that ended more than 24 hours ago
  const expirationCutoff = new Date();
  expirationCutoff.setHours(expirationCutoff.getHours() - 24);

  const pastEvents = await prisma.event.findMany({
    where: {
      endDate: {
        lt: expirationCutoff
      }
    },
    select: { id: true, name: true }
  });

  let totalExpired = 0;
  const results = [];

  for (const event of pastEvents) {
    const expired = await statusService.expireUnusedTickets(event.id);
    totalExpired += expired;
    results.push({ eventId: event.id, eventName: event.name, expired });
  }

  return NextResponse.json({
    success: true,
    totalExpired,
    eventsProcessed: pastEvents.length,
    results
  });
}
```

### Status Badge Component

```tsx
// components/tickets/TicketStatusBadge.tsx

import { TicketStatus } from '@prisma/client';

const STATUS_CONFIG: Record<TicketStatus, { label: string; color: string; icon: string }> = {
  ISSUED: { label: 'Issued', color: 'bg-blue-100 text-blue-800', icon: '📧' },
  CHECKED_IN: { label: 'Checked In', color: 'bg-green-100 text-green-800', icon: '✓' },
  TRANSFERRED: { label: 'Transferred', color: 'bg-orange-100 text-orange-800', icon: '↔' },
  REFUNDED: { label: 'Refunded', color: 'bg-gray-100 text-gray-800', icon: '↩' },
  CANCELLED: { label: 'Cancelled', color: 'bg-red-100 text-red-800', icon: '✗' },
  EXPIRED: { label: 'Expired', color: 'bg-gray-100 text-gray-600', icon: '⏱' }
};

interface TicketStatusBadgeProps {
  status: TicketStatus;
  showIcon?: boolean;
}

export function TicketStatusBadge({ status, showIcon = true }: TicketStatusBadgeProps) {
  const config = STATUS_CONFIG[status];

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
      {showIcon && <span className="mr-1">{config.icon}</span>}
      {config.label}
    </span>
  );
}
```

## Integration Points

### 1. Check-In System (TIX-003, TIX-004)
- **Trigger**: Successful ticket validation
- **Action**: Change status ISSUED → CHECKED_IN
- **Actor**: Staff member ID

### 2. Refund Processing (PAY-005)
- **Trigger**: Refund approved and processed
- **Action**: Change status → REFUNDED
- **Actor**: User ID or Admin ID

### 3. Ticket Transfer System (TIX-006)
- **Trigger**: Transfer initiated/completed
- **Action**: Change status ISSUED → TRANSFERRED → ISSUED (new ticket)
- **Actor**: User ID

### 4. Scheduled Jobs
- **Cron**: Daily at 2 AM UTC
- **Action**: Expire unused tickets 24h after event end
- **Actor**: SYSTEM

### 5. Analytics Dashboard
- **Consumer**: Status summary and history
- **Metrics**: Conversion rates, refund rates, expiration rates

## Performance Requirements

- Status change: < 200ms (database transaction)
- Status history query: < 500ms for 1000+ records
- Status summary: < 1 second for 10,000+ tickets
- Transition validation: < 10ms
- Cron job: Process 1000+ tickets in < 5 minutes

## Testing Requirements

### Unit Tests
- [ ] Valid transitions accepted
- [ ] Invalid transitions rejected
- [ ] Status history created correctly
- [ ] Terminal states cannot change
- [ ] Action permissions enforced
- [ ] Expiration logic works correctly

### Integration Tests
- [ ] Status changes persist to database
- [ ] Transactions rollback on error
- [ ] Status history immutable
- [ ] Concurrent changes handled correctly
- [ ] Webhooks triggered on status change

### Data Integrity Tests
- [ ] No orphaned status history records
- [ ] All tickets have valid current status
- [ ] Status timestamps accurate
- [ ] Referential integrity maintained

## Environment Variables

```bash
# Cron job authentication
CRON_SECRET=your-secret-key-for-cron-jobs

# Status change webhooks
STATUS_CHANGE_WEBHOOK_URL=https://analytics.example.com/webhook
```

## Definition of Done

- [ ] Database schema with status enum implemented
- [ ] TicketStatusService with validation logic
- [ ] Status history tracking functional
- [ ] Cron job for ticket expiration deployed
- [ ] Status badge component created
- [ ] API endpoints enforce status rules
- [ ] Unit tests achieve >95% coverage
- [ ] Integration tests pass all scenarios
- [ ] Performance meets <200ms requirement
- [ ] Data integrity checks passing
- [ ] Documentation completed
- [ ] Code review completed
- [ ] QA testing completed
- [ ] Deployed to staging and validated

## Related Stories

- **TIX-003**: Ticket Validation (updates status to CHECKED_IN)
- **TIX-004**: Check-In Interface (displays status)
- **TIX-006**: Ticket Transfer (manages TRANSFERRED status)
- **PAY-005**: Refund Processing (updates to REFUNDED)
- **ANALYTICS-002**: Status Reporting (consumes status data)

## Notes

- Monitor status transition patterns for anomalies
- Consider soft deletes vs CANCELLED status
- Plan for status reason taxonomy (common reasons)
- Document status transition diagrams
- Review terminal state restrictions quarterly
- Consider status-based email notifications
- Plan for status rollback (admin tool)
- Monitor cron job execution and alerts