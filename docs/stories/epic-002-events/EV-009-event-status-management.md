# EV-009: Event Status Management

**Epic**: EPIC-002: Event Management Core
**Story Points**: 2
**Priority**: Medium
**Status**: Ready for Development
**Sprint**: TBD

---

## User Story

**As an** event organizer
**I want to** manage my event's status throughout its lifecycle
**So that** I can control event visibility, sales, and properly communicate the event's state to attendees

---

## Business Value

- **User Value**: Clear event lifecycle management reduces confusion and improves organizer control
- **Business Value**: Proper status management ensures events are only visible when appropriate, improving platform quality
- **Impact**: Essential for event workflow from draft to completion
- **Revenue Impact**: Proper status management prevents premature sales and maintains platform trust

---

## INVEST Criteria

- **Independent**: Can be developed with existing Event model and status field
- **Negotiable**: Status transitions and automation rules can be adjusted
- **Valuable**: Critical for event lifecycle management
- **Estimable**: Clear scope with well-defined status states
- **Small**: Can be completed within one sprint
- **Testable**: Clear acceptance criteria with measurable state transitions

---

## Acceptance Criteria

### AC1: Event Status States
**Given** an event exists in the system
**When** I view the event
**Then** it should have one of these statuses:
- **DRAFT**: Event is being created/edited, not visible to public
- **PUBLISHED**: Event is live and visible to public, tickets available
- **CANCELLED**: Event was cancelled, tickets not available, refunds processed
- **COMPLETED**: Event has ended, historical record maintained
- **SOLD_OUT**: All tickets sold, event still published but no purchases allowed

### AC2: Status Visibility Rules
**Given** an event has a specific status
**When** different users view the platform
**Then** visibility should be:
- **DRAFT**: Only visible to organizer and admins
- **PUBLISHED**: Visible to everyone on public pages
- **CANCELLED**: Visible to ticket holders with cancellation notice, hidden from public listings
- **COMPLETED**: Visible in past events archive
- **SOLD_OUT**: Visible on public pages with "Sold Out" badge

### AC3: Manual Status Changes - Publish
**Given** I have a draft event
**When** I click "Publish Event"
**Then** the system should:
- Validate all required fields are complete
- Show confirmation dialog with publish date/time
- Change status from DRAFT to PUBLISHED
- Make event visible on public listings
- Send notification to organizer confirming publication
- Log status change in audit trail

### AC4: Manual Status Changes - Unpublish to Draft
**Given** I have a published event with no ticket sales
**When** I click "Unpublish Event"
**Then** the system should:
- Show confirmation dialog explaining consequences
- Change status from PUBLISHED to DRAFT
- Remove event from public listings
- Keep existing event data intact
- Log status change

### AC5: Manual Status Changes - Cancel Event
**Given** I have a published event
**When** I click "Cancel Event"
**Then** the system should:
- Show cancellation confirmation dialog
- Require cancellation reason (text input)
- Change status to CANCELLED
- Trigger refund process for all ticket holders
- Send cancellation emails to all attendees
- Remove event from public listings (or show as cancelled)
- Prevent new ticket purchases
- Log cancellation with reason

### AC6: Automatic Status Change - Sold Out
**Given** a published event reaches full capacity
**When** the last ticket is purchased
**Then** the system should:
- Automatically change status to SOLD_OUT
- Keep event visible but disable purchase button
- Show "Sold Out" badge on event cards and detail page
- Optionally notify organizer of sellout
- Log automatic status change

### AC7: Automatic Status Change - Event Completion
**Given** an event's end date/time has passed
**When** a scheduled job runs (daily cron)
**Then** the system should:
- Identify events where endDate < current time
- Change status from PUBLISHED/SOLD_OUT to COMPLETED
- Move events to "Past Events" section
- Disable ticket purchases if still somehow active
- Archive event for historical record
- Log automatic status change

### AC8: Status Transition Rules
**Given** I attempt to change an event's status
**When** the status change is processed
**Then** only these transitions should be allowed:
- DRAFT → PUBLISHED (manual)
- PUBLISHED → DRAFT (manual, only if no tickets sold)
- PUBLISHED → CANCELLED (manual)
- PUBLISHED → SOLD_OUT (automatic)
- PUBLISHED → COMPLETED (automatic, when event ends)
- SOLD_OUT → COMPLETED (automatic, when event ends)
- SOLD_OUT → CANCELLED (manual)
- No transitions TO DRAFT from CANCELLED or COMPLETED
- No transitions FROM COMPLETED

### AC9: Status-Based Access Control
**Given** an event has a specific status
**When** I attempt various actions
**Then** permissions should be:
- **DRAFT**: Can edit all fields, can delete event, can publish
- **PUBLISHED**: Can edit most fields (with warnings), cannot delete, can cancel
- **CANCELLED**: Can only view, cannot edit or delete
- **COMPLETED**: Can only view, cannot edit or delete
- **SOLD_OUT**: Can edit non-critical fields, cannot edit capacity, can cancel

### AC10: Status Indicators in UI
**Given** I am viewing events
**When** I see event listings
**Then** each event should clearly show:
- Status badge with color coding (draft=gray, published=green, cancelled=red, completed=blue, sold_out=orange)
- Status icon for quick visual reference
- Status-specific messaging where appropriate
- Last status change timestamp
- Status in event detail page, dashboard, and admin views

---

## Technical Implementation Tasks

### Task 1: Define Event Status Enum
- [ ] Update Event model with status enum
- [ ] Create database migration for status field
- [ ] Add status index for query performance
- [ ] Define allowed status transitions

### Task 2: Create Status Management UI Components
- [ ] Create StatusBadge component with color variants
- [ ] Create StatusChangeModal for confirmations
- [ ] Create CancellationReasonModal
- [ ] Add status indicator to event cards
- [ ] Add status controls to event detail page

### Task 3: Implement Manual Status Change API
- [ ] Create PATCH `/api/events/[eventId]/status` endpoint
- [ ] Implement authorization checks
- [ ] Validate status transitions
- [ ] Handle publish action with validation
- [ ] Handle cancellation with reason
- [ ] Return updated event with new status

### Task 4: Implement Status Transition Validation
- [ ] Create status transition validator function
- [ ] Check current status vs. requested status
- [ ] Validate business rules (e.g., no tickets sold for unpublish)
- [ ] Return clear error messages for invalid transitions

### Task 5: Implement Automatic Sold Out Detection
- [ ] Create event listener for ticket purchases
- [ ] Check remaining capacity after each purchase
- [ ] Trigger status change to SOLD_OUT when capacity reached
- [ ] Send notification to organizer (optional)
- [ ] Log automatic status change

### Task 6: Create Event Completion Cron Job
- [ ] Create cron endpoint `/api/cron/complete-events`
- [ ] Query for events with endDate < now and status not COMPLETED
- [ ] Update status to COMPLETED for qualifying events
- [ ] Log completion actions
- [ ] Configure Vercel Cron or scheduled job

### Task 7: Implement Status-Based Visibility Filters
- [ ] Update public events API to filter by status
- [ ] Exclude DRAFT and CANCELLED from public listings
- [ ] Create separate queries for organizer dashboard (all statuses)
- [ ] Add status filter to search/filter functionality

### Task 8: Add Status-Based Access Control
- [ ] Create middleware for status-based permissions
- [ ] Enforce edit restrictions based on status
- [ ] Prevent invalid operations (delete published event)
- [ ] Add UI-level controls to show/hide actions

### Task 9: Integrate with Cancellation Flow
- [ ] Connect status change to refund processing (EV-010)
- [ ] Trigger cancellation emails when status → CANCELLED
- [ ] Update ticket status when event cancelled
- [ ] Handle partial cancellations (if supported)

### Task 10: Testing
- [ ] Unit tests for status transition validation
- [ ] Unit tests for automatic status changes
- [ ] Component tests for status UI elements
- [ ] Integration tests for status change API
- [ ] E2E tests for manual status changes
- [ ] Test cron job for event completion
- [ ] Test sold out detection
- [ ] Test authorization and access control

---

## Dependencies

### Required Before Starting
- ✅ Event model in Prisma schema
- ✅ Event dashboard pages
- ⏳ Status field added to Event model
- ⏳ Cron job infrastructure (Vercel Cron or similar)

### Blocks
- None - can proceed with status field addition

### Related Stories
- EV-001: Event creation (sets initial DRAFT status)
- EV-008: Event editing (respects status-based permissions)
- EV-010: Event cancellation (uses CANCELLED status)
- PAY-002: Ticket purchase (triggers SOLD_OUT status)

---

## Technical Specifications

### Event Status Enum in Prisma
```prisma
enum EventStatus {
  DRAFT
  PUBLISHED
  CANCELLED
  COMPLETED
  SOLD_OUT
}

model Event {
  id          String      @id @default(cuid())
  title       String
  // ... other fields ...
  status      EventStatus @default(DRAFT)
  statusChangedAt DateTime @default(now())
  cancellationReason String?

  @@index([status])
  @@index([status, startDate])
}
```

### Status Change API Endpoint
```typescript
// PATCH /api/events/[eventId]/status/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const STATUS_TRANSITIONS = {
  DRAFT: ['PUBLISHED'],
  PUBLISHED: ['DRAFT', 'CANCELLED', 'SOLD_OUT', 'COMPLETED'],
  SOLD_OUT: ['CANCELLED', 'COMPLETED'],
  CANCELLED: [],
  COMPLETED: []
};

export async function PATCH(
  req: NextRequest,
  { params }: { params: { eventId: string } }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const event = await prisma.event.findUnique({
    where: { id: params.eventId },
    include: { _count: { select: { orders: true } } }
  });

  if (!event) {
    return NextResponse.json({ error: 'Event not found' }, { status: 404 });
  }

  // Authorization
  if (event.organizerId !== session.user.id && session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { status, reason } = await req.json();

  // Validate status transition
  if (!STATUS_TRANSITIONS[event.status].includes(status)) {
    return NextResponse.json({
      error: `Cannot change status from ${event.status} to ${status}`
    }, { status: 400 });
  }

  // Business rule: Cannot unpublish if tickets sold
  if (event.status === 'PUBLISHED' && status === 'DRAFT' && event._count.orders > 0) {
    return NextResponse.json({
      error: 'Cannot unpublish event with existing ticket sales'
    }, { status: 400 });
  }

  // Require reason for cancellation
  if (status === 'CANCELLED' && !reason) {
    return NextResponse.json({
      error: 'Cancellation reason is required'
    }, { status: 400 });
  }

  // Update status
  const updatedEvent = await prisma.event.update({
    where: { id: params.eventId },
    data: {
      status,
      statusChangedAt: new Date(),
      cancellationReason: status === 'CANCELLED' ? reason : undefined
    }
  });

  // Handle side effects
  if (status === 'CANCELLED') {
    // Trigger refund process
    await processRefundsForEvent(params.eventId);
    // Send cancellation emails
    await sendCancellationNotifications(updatedEvent);
  }

  // Log status change
  await prisma.eventAuditLog.create({
    data: {
      eventId: params.eventId,
      userId: session.user.id,
      action: 'STATUS_CHANGE',
      changes: {
        field: 'status',
        old: event.status,
        new: status,
        reason: reason || undefined
      },
      timestamp: new Date()
    }
  });

  return NextResponse.json({ success: true, event: updatedEvent });
}
```

### Automatic Sold Out Detection
```typescript
// In ticket purchase handler
export async function handleTicketPurchase(eventId: string, quantity: number) {
  // ... purchase logic ...

  // Check if event is now sold out
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      tickets: true,
      _count: { select: { orders: true } }
    }
  });

  const totalCapacity = event.tickets.reduce((sum, ticket) => sum + ticket.quantity, 0);
  const totalSold = await prisma.orderItem.aggregate({
    where: { ticket: { eventId } },
    _sum: { quantity: true }
  });

  if (totalSold._sum.quantity >= totalCapacity && event.status === 'PUBLISHED') {
    await prisma.event.update({
      where: { id: eventId },
      data: {
        status: 'SOLD_OUT',
        statusChangedAt: new Date()
      }
    });

    // Optional: Notify organizer
    await notifyOrganizerSoldOut(event);
  }
}
```

### Event Completion Cron Job
```typescript
// app/api/cron/complete-events/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  // Verify cron secret for security
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const now = new Date();

  // Find events that have ended but not marked as completed
  const eventsToComplete = await prisma.event.findMany({
    where: {
      endDate: { lt: now },
      status: { in: ['PUBLISHED', 'SOLD_OUT'] }
    }
  });

  // Update status to COMPLETED
  const results = await Promise.all(
    eventsToComplete.map(event =>
      prisma.event.update({
        where: { id: event.id },
        data: {
          status: 'COMPLETED',
          statusChangedAt: new Date()
        }
      })
    )
  );

  return NextResponse.json({
    success: true,
    completed: results.length,
    eventIds: results.map(e => e.id)
  });
}
```

### Vercel Cron Configuration
```json
// vercel.json
{
  "crons": [
    {
      "path": "/api/cron/complete-events",
      "schedule": "0 2 * * *"
    }
  ]
}
```

### Status Badge Component
```typescript
// components/ui/StatusBadge.tsx
interface StatusBadgeProps {
  status: EventStatus;
  size?: 'sm' | 'md' | 'lg';
}

const statusConfig = {
  DRAFT: { label: 'Draft', color: 'bg-gray-100 text-gray-800', icon: FileIcon },
  PUBLISHED: { label: 'Published', color: 'bg-green-100 text-green-800', icon: CheckCircleIcon },
  CANCELLED: { label: 'Cancelled', color: 'bg-red-100 text-red-800', icon: XCircleIcon },
  COMPLETED: { label: 'Completed', color: 'bg-blue-100 text-blue-800', icon: ArchiveIcon },
  SOLD_OUT: { label: 'Sold Out', color: 'bg-orange-100 text-orange-800', icon: TicketIcon }
};

export function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
      <Icon className="w-3 h-3" />
      {config.label}
    </span>
  );
}
```

---

## Edge Cases & Error Scenarios

1. **Invalid Status Transition**: Prevent and show clear error message
2. **Concurrent Status Changes**: Use optimistic locking to prevent conflicts
3. **Unpublish with Tickets Sold**: Block with clear explanation
4. **Cancel Event Near Start Time**: Allow but log urgency
5. **Automatic Completion Fails**: Retry on next cron run
6. **Sold Out Calculation Error**: Implement safety checks and logging
7. **Status Change During Active Purchase**: Handle race condition with transactions
8. **Cron Job Authentication Failure**: Log error and alert admin
9. **Refund Processing Failure on Cancel**: Separate concerns, log failure but complete status change
10. **Event Already in Target Status**: Return success without error

---

## Definition of Done

- [ ] All acceptance criteria are met and verified
- [ ] Event status enum defined in Prisma schema
- [ ] Database migration completed for status field
- [ ] Status change API endpoint implemented
- [ ] Status transition validation working
- [ ] Manual status changes working (publish, unpublish, cancel)
- [ ] Automatic sold out detection implemented
- [ ] Event completion cron job implemented and scheduled
- [ ] Status-based visibility filters working
- [ ] Status badges displayed throughout UI
- [ ] Status-based access control enforced
- [ ] Integration with cancellation/refund flow
- [ ] Unit tests written with >80% coverage
- [ ] Component tests for status UI elements
- [ ] Integration tests for status API endpoint
- [ ] E2E tests for status change workflows
- [ ] Cron job tested (manual trigger and scheduled)
- [ ] Authorization tested for all status changes
- [ ] Code reviewed and approved by tech lead
- [ ] Documentation updated (status workflow, API specs)
- [ ] Deployed to staging and validated
- [ ] Product owner approval obtained

---

## Testing Strategy

### Unit Tests
- Status transition validation function
- Sold out detection logic
- Event completion eligibility check
- Status badge rendering

### Component Tests
- StatusBadge component with all statuses
- Status change confirmation modals
- Cancellation reason modal
- Status controls in event dashboard

### Integration Tests
- Status change API endpoint for each transition
- Authorization checks for status changes
- Automatic sold out on ticket purchase
- Cron job execution
- Status-based visibility filtering

### E2E Tests
- Publish draft event
- Unpublish published event (no tickets)
- Cancel published event
- Automatic sold out when capacity reached
- Automatic completion after end date
- View events filtered by status

### Security Tests
- Authorization bypass attempts
- Invalid status transition attempts
- Cron endpoint security
- CSRF protection for status changes

---

## Notes & Considerations

### Future Enhancements
- Add POSTPONED status for rescheduled events
- Add ARCHIVED status for old events to hide from organizer dashboard
- Implement status change scheduling (publish on specific date/time)
- Add approval workflow for publishing (requires admin approval)
- Implement PENDING status for events under review
- Add status change webhooks for integrations
- Track status change history timeline in UI
- Add bulk status changes for multiple events

### Business Rules to Document
- When events automatically complete
- Notification requirements for each status change
- Refund processing timeline for cancellations
- Event visibility rules for each status
- Who can change status (organizer, admin, system)

### Monitoring and Alerts
- Alert if cron job fails to run
- Monitor sold out detection accuracy
- Track status change frequency per event
- Alert on high cancellation rates
- Monitor orphaned events (stuck in wrong status)

### UX Considerations
- Clear visual differentiation between statuses
- Helpful messages explaining each status
- Confirmation dialogs for destructive actions
- Status change history visible to organizer
- Toast notifications for successful status changes

---

**Created**: 2025-09-30
**Last Updated**: 2025-09-30
**Estimated Effort**: 12-14 hours
**Assigned To**: TBD