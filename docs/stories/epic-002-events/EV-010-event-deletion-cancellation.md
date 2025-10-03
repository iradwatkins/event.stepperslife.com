# EV-010: Event Deletion and Cancellation

**Epic**: EPIC-002: Event Management Core
**Story Points**: 3
**Priority**: High
**Status**: Ready for Development
**Sprint**: TBD

---

## User Story

**As an** event organizer
**I want to** cancel or delete my events when necessary
**So that** I can handle unforeseen circumstances and properly manage refunds and attendee communications

---

## Business Value

- **User Value**: Flexibility to cancel events builds trust and reduces organizer risk
- **Business Value**: Proper cancellation handling maintains platform reputation and customer satisfaction
- **Impact**: Critical for handling unforeseen circumstances and maintaining user trust
- **Revenue Impact**: Proper refund processing prevents chargebacks and maintains positive user relationships

---

## INVEST Criteria

- **Independent**: Can be developed with existing Event model and payment integration
- **Negotiable**: Refund rules and notification timing can be adjusted
- **Valuable**: Essential for complete event lifecycle management
- **Estimable**: Clear scope with well-defined cancellation requirements
- **Small**: Can be completed within one sprint
- **Testable**: Clear acceptance criteria with measurable outcomes

---

## Acceptance Criteria

### AC1: Delete Draft Events
**Given** I have a draft event with no ticket sales
**When** I click "Delete Event" in the dashboard
**Then** the system should:
- Show confirmation dialog "Are you sure you want to delete this draft?"
- Permanently delete event from database (hard delete)
- Remove all associated data (images, audit logs)
- Show success message "Event deleted successfully"
- Redirect to events dashboard
- Not allow recovery after deletion

### AC2: Cancel Published Event - No Tickets Sold
**Given** I have a published event with no ticket sales
**When** I click "Cancel Event"
**Then** the system should:
- Show cancellation confirmation dialog
- Require cancellation reason (text input, optional but recommended)
- Change event status to CANCELLED
- Remove event from public listings
- Show cancellation message on event page
- Allow option to delete event entirely
- Log cancellation action

### AC3: Cancel Published Event - With Tickets Sold
**Given** I have a published event with active ticket sales
**When** I click "Cancel Event"
**Then** the system should:
- Show detailed cancellation confirmation with ticket holder count
- Require mandatory cancellation reason
- Display refund policy and estimated processing time
- Show preview of cancellation email
- Require explicit confirmation checkbox "I understand all ticket holders will be refunded"
- Change event status to CANCELLED
- Trigger automatic refund process for all tickets
- Send cancellation notification to all ticket holders
- Prevent new ticket purchases
- Keep event data for historical records (soft delete)

### AC4: Automatic Refund Processing
**Given** an event is cancelled with ticket sales
**When** the cancellation is confirmed
**Then** the system should:
- Identify all paid orders for the event
- Calculate refund amounts (full ticket price + fees)
- Process refunds through payment provider (Square)
- Update order status to REFUNDED
- Invalidate all QR codes for tickets
- Log each refund transaction
- Handle refund failures gracefully with retry mechanism
- Send refund confirmation emails to attendees

### AC5: Cancellation Notifications
**Given** an event is cancelled with ticket holders
**When** refunds are processed
**Then** attendees should receive:
- Immediate cancellation email with event details
- Cancellation reason (if provided by organizer)
- Refund amount and estimated timeline (5-10 business days)
- Organizer contact information for questions
- Apology and acknowledgment of inconvenience
- Link to browse other events (if applicable)

### AC6: Partial Cancellation - Not Supported (Future)
**Given** an event has multiple sessions or dates
**When** I want to cancel only one session
**Then** the system should:
- Currently not support partial cancellations (full event only)
- Display message "To cancel individual sessions, please contact support"
- Future enhancement to support multi-session events

### AC7: Cancellation Restrictions
**Given** I am attempting to cancel an event
**When** certain conditions exist
**Then** the system should:
- Allow cancellation at any time before event end
- Prevent cancellation after event has ended (use COMPLETED status)
- Warn if cancelling within 24 hours of event start
- Prevent cancellation if already cancelled
- Show clear error messages for invalid actions

### AC8: Organizer Cancellation Dashboard
**Given** I have cancelled an event
**When** I view the event in my dashboard
**Then** I should see:
- CANCELLED status badge
- Cancellation date and time
- Cancellation reason (if provided)
- Number of refunds processed
- Total refund amount
- List of refunded orders with status
- Option to view cancellation email sent
- Link to download refund report

### AC9: Attendee View of Cancelled Event
**Given** I am a ticket holder for a cancelled event
**When** I try to access the event page
**Then** I should see:
- Clear "EVENT CANCELLED" banner
- Cancellation reason
- Refund status and timeline
- Organizer contact information
- Message that tickets are no longer valid
- Link to my orders page
- No option to purchase tickets

### AC10: Data Retention for Cancelled Events
**Given** an event is cancelled
**When** the cancellation is processed
**Then** the system should:
- Use soft delete (keep data in database)
- Mark event as CANCELLED status (not delete record)
- Preserve all order and ticket data for financial records
- Keep audit logs for compliance
- Maintain data for minimum retention period (7 years for financial records)
- Allow admin/organizer to access cancelled event history

---

## Technical Implementation Tasks

### Task 1: Create Event Deletion Flow
- [ ] Add "Delete Event" button to draft events
- [ ] Create confirmation dialog component
- [ ] Implement DELETE `/api/events/[eventId]` endpoint
- [ ] Add authorization checks (organizer or admin only)
- [ ] Validate event has no ticket sales before deletion
- [ ] Implement hard delete with cascade (images, audit logs)

### Task 2: Create Event Cancellation UI
- [ ] Add "Cancel Event" button to published events
- [ ] Create CancellationModal component
- [ ] Add cancellation reason text area (required for events with sales)
- [ ] Show ticket holder count and refund estimate
- [ ] Add confirmation checkbox for events with sales
- [ ] Show cancellation email preview

### Task 3: Implement Cancellation API Endpoint
- [ ] Create POST `/api/events/[eventId]/cancel` endpoint
- [ ] Implement authorization checks
- [ ] Validate event can be cancelled
- [ ] Update event status to CANCELLED
- [ ] Store cancellation reason and timestamp
- [ ] Return cancellation confirmation

### Task 4: Build Refund Processing Service
- [ ] Create RefundService class
- [ ] Implement getEventRefunds(eventId) method
- [ ] Integrate with Square Refunds API
- [ ] Calculate refund amounts (ticket price + fees)
- [ ] Process refunds for all orders
- [ ] Update order status to REFUNDED
- [ ] Handle partial refund failures
- [ ] Implement retry mechanism for failed refunds

### Task 5: Implement Ticket Invalidation
- [ ] Update ticket status to CANCELLED when event cancelled
- [ ] Invalidate QR codes for all tickets
- [ ] Prevent check-in for cancelled event tickets
- [ ] Update ticket display to show cancellation

### Task 6: Create Cancellation Email Templates
- [ ] Design cancellation notification email template
- [ ] Include event details, reason, refund information
- [ ] Add organizer contact information
- [ ] Create refund confirmation email template
- [ ] Add personalization (attendee name, order number)
- [ ] Make templates mobile-responsive

### Task 7: Implement Cancellation Notification System
- [ ] Create email sending service for bulk notifications
- [ ] Send cancellation email to all ticket holders
- [ ] Send refund confirmation emails
- [ ] Implement queuing for large numbers of emails
- [ ] Add retry logic for failed email deliveries
- [ ] Log all notification attempts

### Task 8: Build Cancellation Dashboard View
- [ ] Create cancellation details component
- [ ] Show cancellation metadata (date, reason)
- [ ] Display refund processing status
- [ ] List all refunded orders
- [ ] Add export functionality for refund report
- [ ] Show cancellation email log

### Task 9: Update Event Display for Cancelled Events
- [ ] Show CANCELLED banner on event detail page
- [ ] Display cancellation reason to ticket holders
- [ ] Remove "Buy Tickets" button
- [ ] Update event card in listings
- [ ] Hide from public search results
- [ ] Maintain access for organizer and attendees

### Task 10: Testing
- [ ] Unit tests for refund calculation logic
- [ ] Unit tests for cancellation validation
- [ ] Component tests for cancellation UI
- [ ] Integration tests for cancellation API
- [ ] Integration tests for refund processing
- [ ] E2E tests for full cancellation workflow
- [ ] Test email delivery and templates
- [ ] Test error scenarios and retry logic
- [ ] Test authorization and access control

---

## Dependencies

### Required Before Starting
- ✅ Event model with status field (EV-009)
- ✅ Order and ticket models
- ✅ Square payment integration
- ⏳ Square Refunds API integration
- ⏳ Email notification system
- ⏳ Refund processing service

### Blocks
- Square Refunds API must be configured and tested

### Related Stories
- EV-009: Event status management (provides CANCELLED status)
- PAY-001: Ticket purchase (creates orders to refund)
- PAY-005: Payment processing (Square integration)
- EV-008: Event editing (triggers cancellation flow)

---

## Technical Specifications

### Event Cancellation API Endpoint
```typescript
// POST /api/events/[eventId]/cancel/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { RefundService } from '@/lib/services/refund.service';
import { sendCancellationNotifications } from '@/lib/services/email';

export async function POST(
  req: NextRequest,
  { params }: { params: { eventId: string } }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const event = await prisma.event.findUnique({
    where: { id: params.eventId },
    include: {
      orders: {
        where: { status: 'COMPLETED' },
        include: { user: true, items: { include: { ticket: true } } }
      },
      _count: { select: { orders: true } }
    }
  });

  if (!event) {
    return NextResponse.json({ error: 'Event not found' }, { status: 404 });
  }

  // Authorization check
  if (event.organizerId !== session.user.id && session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Validate event can be cancelled
  if (event.status === 'CANCELLED') {
    return NextResponse.json({ error: 'Event already cancelled' }, { status: 400 });
  }

  if (event.status === 'COMPLETED') {
    return NextResponse.json({ error: 'Cannot cancel completed event' }, { status: 400 });
  }

  const { reason } = await req.json();

  // Require reason if tickets sold
  if (event._count.orders > 0 && !reason) {
    return NextResponse.json({
      error: 'Cancellation reason required for events with ticket sales'
    }, { status: 400 });
  }

  // Update event status to CANCELLED
  const updatedEvent = await prisma.event.update({
    where: { id: params.eventId },
    data: {
      status: 'CANCELLED',
      statusChangedAt: new Date(),
      cancellationReason: reason,
      cancelledAt: new Date()
    }
  });

  // Process refunds if there are orders
  let refundResults = [];
  if (event.orders.length > 0) {
    const refundService = new RefundService();
    refundResults = await refundService.processEventRefunds(params.eventId);

    // Invalidate all tickets
    await prisma.ticket.updateMany({
      where: { eventId: params.eventId },
      data: { status: 'CANCELLED' }
    });

    // Send cancellation notifications
    await sendCancellationNotifications(updatedEvent, event.orders, reason);
  }

  // Log cancellation
  await prisma.eventAuditLog.create({
    data: {
      eventId: params.eventId,
      userId: session.user.id,
      action: 'CANCEL',
      changes: {
        status: 'CANCELLED',
        reason,
        ticketHolders: event.orders.length,
        refundsProcessed: refundResults.length
      },
      timestamp: new Date()
    }
  });

  return NextResponse.json({
    success: true,
    event: updatedEvent,
    refunds: {
      processed: refundResults.filter(r => r.success).length,
      failed: refundResults.filter(r => !r.success).length,
      total: refundResults.length
    }
  });
}
```

### Refund Service Implementation
```typescript
// lib/services/refund.service.ts
import { Client, Environment } from 'square';
import { prisma } from '@/lib/prisma';

const squareClient = new Client({
  accessToken: process.env.SQUARE_ACCESS_TOKEN,
  environment: process.env.NODE_ENV === 'production'
    ? Environment.Production
    : Environment.Sandbox
});

export class RefundService {
  async processEventRefunds(eventId: string) {
    const orders = await prisma.order.findMany({
      where: {
        eventId,
        status: 'COMPLETED',
        paymentStatus: 'PAID'
      },
      include: { items: { include: { ticket: true } } }
    });

    const refundResults = [];

    for (const order of orders) {
      try {
        const result = await this.refundOrder(order);
        refundResults.push(result);
      } catch (error) {
        console.error(`Failed to refund order ${order.id}:`, error);
        refundResults.push({
          orderId: order.id,
          success: false,
          error: error.message
        });
      }
    }

    return refundResults;
  }

  async refundOrder(order: Order) {
    // Calculate full refund amount
    const refundAmount = order.totalAmount;

    // Process refund with Square
    const { result } = await squareClient.refundsApi.refundPayment({
      idempotencyKey: `refund-${order.id}-${Date.now()}`,
      amountMoney: {
        amount: BigInt(refundAmount * 100), // Convert to cents
        currency: 'USD'
      },
      paymentId: order.squarePaymentId,
      reason: 'Event cancellation'
    });

    // Update order status
    await prisma.order.update({
      where: { id: order.id },
      data: {
        status: 'REFUNDED',
        paymentStatus: 'REFUNDED',
        refundedAt: new Date(),
        refundAmount: refundAmount,
        squareRefundId: result.refund.id
      }
    });

    // Log refund transaction
    await prisma.refund.create({
      data: {
        orderId: order.id,
        amount: refundAmount,
        reason: 'Event cancellation',
        squareRefundId: result.refund.id,
        status: result.refund.status,
        processedAt: new Date()
      }
    });

    return {
      orderId: order.id,
      success: true,
      refundId: result.refund.id,
      amount: refundAmount
    };
  }
}
```

### Cancellation Email Template
```typescript
// lib/email/templates/cancellation.ts
export const cancellationEmailTemplate = (
  event: Event,
  order: Order,
  reason: string
) => `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #dc3545; color: white; padding: 30px; text-align: center; }
    .content { padding: 30px; background-color: #f8f9fa; }
    .alert { background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
    .refund-info { background-color: #d1ecf1; border-left: 4px solid #17a2b8; padding: 15px; margin: 20px 0; }
    .footer { padding: 20px; text-align: center; font-size: 12px; color: #6c757d; }
    .button { display: inline-block; padding: 12px 24px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px; margin: 10px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Event Cancelled</h1>
    </div>
    <div class="content">
      <p>Dear ${order.user.name},</p>

      <p>We regret to inform you that the following event has been cancelled:</p>

      <div class="alert">
        <h3>${event.title}</h3>
        <p>Date: ${formatDate(event.startDate)}</p>
        <p>Location: ${event.venue.name}</p>
        <p>Order Number: ${order.orderNumber}</p>
      </div>

      ${reason ? `
        <p><strong>Reason for cancellation:</strong></p>
        <p>${reason}</p>
      ` : ''}

      <div class="refund-info">
        <h3>Refund Information</h3>
        <p><strong>Refund Amount:</strong> $${order.totalAmount.toFixed(2)}</p>
        <p>Your refund has been processed and will appear in your original payment method within 5-10 business days.</p>
        <p>All tickets for this event are now invalid.</p>
      </div>

      <p>We sincerely apologize for any inconvenience this may cause.</p>

      <p>If you have any questions, please contact the event organizer:</p>
      <p>
        <strong>${event.organizer.name}</strong><br>
        Email: ${event.organizer.email}<br>
        ${event.organizer.phone ? `Phone: ${event.organizer.phone}` : ''}
      </p>

      <a href="${process.env.NEXT_PUBLIC_URL}/events" class="button">Browse Other Events</a>
    </div>
    <div class="footer">
      <p>This is an automated notification from Events SteppersLife</p>
      <p>&copy; ${new Date().getFullYear()} Events SteppersLife. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
`;
```

### Database Schema Updates
```prisma
model Event {
  // ... existing fields ...
  cancellationReason String?
  cancelledAt        DateTime?
}

model Order {
  // ... existing fields ...
  refundedAt    DateTime?
  refundAmount  Float?
  squareRefundId String?
  refunds       Refund[]
}

model Refund {
  id              String   @id @default(cuid())
  orderId         String
  order           Order    @relation(fields: [orderId], references: [id])
  amount          Float
  reason          String
  squareRefundId  String   @unique
  status          String   // PENDING, COMPLETED, FAILED
  processedAt     DateTime @default(now())

  @@index([orderId])
  @@index([squareRefundId])
}

model Ticket {
  // ... existing fields ...
  status   String @default("ACTIVE") // ACTIVE, USED, CANCELLED, EXPIRED
}
```

---

## Edge Cases & Error Scenarios

1. **Event Already Cancelled**: Return error message, prevent duplicate cancellation
2. **Completed Event**: Prevent cancellation, suggest archiving instead
3. **Refund API Failure**: Log error, queue for retry, notify admin
4. **Partial Refund Failure**: Process successful refunds, log failures, notify organizer
5. **Email Delivery Failure**: Queue for retry, log failures, provide manual notification option
6. **Square API Timeout**: Implement retry with exponential backoff
7. **Concurrent Cancellation Attempts**: Use database transaction to prevent race condition
8. **Very Large Number of Ticket Holders**: Process refunds in batches, implement queue
9. **Organizer Cancels During Active Purchase**: Handle edge case with transaction locks
10. **Deleted Payment Method**: Handle Square error gracefully, manual refund process
11. **Event Cancelled After Start Time**: Allow but log as late cancellation
12. **Missing Cancellation Reason**: Prompt organizer to provide reason

---

## Definition of Done

- [ ] All acceptance criteria are met and verified
- [ ] Event deletion working for draft events
- [ ] Event cancellation working for published events
- [ ] Refund processing service implemented
- [ ] Square Refunds API integration complete
- [ ] Automatic refund processing for all orders
- [ ] Ticket invalidation on cancellation
- [ ] Cancellation email notifications sent to all attendees
- [ ] Refund confirmation emails sent
- [ ] Cancellation dashboard view implemented
- [ ] Cancelled event display updated
- [ ] Soft delete implemented (data retention)
- [ ] Unit tests written with >80% coverage
- [ ] Integration tests for cancellation API
- [ ] Integration tests for refund processing
- [ ] E2E tests for full cancellation workflow
- [ ] Email templates tested and verified
- [ ] Error handling and retry logic tested
- [ ] Authorization and access control tested
- [ ] Performance tested with large number of orders
- [ ] Code reviewed and approved by tech lead
- [ ] Documentation updated (cancellation policy, API specs)
- [ ] Deployed to staging and validated
- [ ] Product owner approval obtained

---

## Testing Strategy

### Unit Tests
- Refund amount calculation
- Cancellation validation logic
- Email template rendering
- Ticket invalidation logic

### Component Tests
- Cancellation modal with various scenarios
- Deletion confirmation dialog
- Cancellation dashboard view
- Cancelled event banner

### Integration Tests
- Cancellation API endpoint
- Refund processing service
- Square Refunds API integration
- Email notification delivery
- Order status updates

### E2E Tests
- Delete draft event
- Cancel published event with no tickets
- Cancel published event with tickets sold
- Full refund processing workflow
- Attendee receives cancellation email
- View cancelled event as organizer
- View cancelled event as attendee

### Error Scenario Tests
- Handle Square API failure
- Handle email delivery failure
- Handle partial refund failures
- Handle network timeout
- Handle concurrent cancellation attempts

---

## Notes & Considerations

### Future Enhancements
- Partial refund option (keep processing fee)
- Refund to store credit instead of original payment method
- Reschedule event instead of cancel (preserve orders)
- Cancellation insurance for organizers
- Automated cancellation for events with low sales
- Bulk cancellation for multiple events
- Cancellation analytics and reporting

### Legal and Compliance
- Retain financial records for 7 years (soft delete)
- Comply with consumer protection laws
- Clear refund policy displayed to organizers
- Cancellation terms in organizer agreement
- GDPR compliance for personal data handling

### Business Rules to Document
- Full refund policy for all cancellations
- Refund processing timeline (5-10 business days)
- Cancellation deadline (none - can cancel anytime before event)
- Organizer penalties for frequent cancellations
- Minimum notice period recommendations

### Monitoring and Alerts
- Alert on refund processing failures
- Monitor cancellation rate across platform
- Alert on high cancellation rate for specific organizer
- Track refund success rate
- Monitor email delivery success rate
- Alert on Square API errors

### Cost Considerations
- Square refund fees (refund processing)
- Email delivery costs for mass notifications
- Customer support costs for cancellation inquiries
- Impact on platform revenue from cancelled events

---

**Created**: 2025-09-30
**Last Updated**: 2025-09-30
**Estimated Effort**: 18-24 hours
**Assigned To**: TBD