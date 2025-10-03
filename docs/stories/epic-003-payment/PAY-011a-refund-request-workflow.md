# Story: PAY-011a - Refund Request & Approval Workflow

**Epic**: EPIC-003 - Payment Processing Foundation
**Story Points**: 2
**Priority**: P1 (High)
**Status**: Not Started
**Parent Story**: PAY-011 (Refund Processing - 5 pts)
**Dependencies**: PAY-002 (Card Processing), PAY-003 (Payment Confirmation)

---

## Story

**As a** ticket buyer who needs to cancel their purchase
**I want to** request a refund through a simple process
**So that** I can get my money back according to the event's refund policy

**As an** event organizer
**I want to** approve or deny refund requests with proper validation
**So that** I can maintain control over refunds while providing good customer service

---

## Acceptance Criteria

### AC1: Customer Refund Request Form
**Given** a customer has a valid order
**When** they navigate to their order details
**Then** they should see:
- "Request Refund" button (if refund policy allows)
- Refund policy summary displayed prominently
- Time remaining to request refund
- Refund eligibility indicator (Yes/No with reason)
- Link to full refund terms
- Warning about refund processing time (5-10 business days)

### AC2: Refund Eligibility Validation
**Given** a customer clicks "Request Refund"
**When** the system validates eligibility
**Then** it should check:
- Event date is more than 24 hours away (configurable per event)
- Order status is COMPLETED (not REFUNDED, CANCELLED)
- Tickets have not been checked-in
- No previous refund request pending
- Within refund window (e.g., 7 days or until 24hrs before event)
- Order was not fraudulent (flagged)

**And** display clear rejection reason if ineligible
**And** proceed to request form if eligible

### AC3: Refund Request Form Submission
**Given** a customer is eligible for refund
**When** they submit the refund request form
**Then** they must provide:
- Reason for refund (dropdown: "Can't attend", "Event cancelled", "Other")
- Optional additional comments (500 char max)
- Confirmation checkbox: "I understand refund policy"

**And** the system should:
- Create RefundRequest record with status PENDING
- Send confirmation email to customer
- Notify event organizer via email
- Display "Request Submitted" confirmation
- Show estimated processing time
- Prevent multiple simultaneous requests

### AC4: Automatic vs Manual Approval
**Given** a refund request is created
**When** the system evaluates the request
**Then** it should:
- **Auto-approve** if:
  - Event is more than 7 days away
  - Order value < $500 (configurable)
  - Customer has no fraud flags
  - Organizer has auto-approve enabled
- **Require manual review** if:
  - Event is within 7 days
  - Order value >= $500
  - Customer has multiple refund requests
  - Order flagged for review
  - Organizer requires manual approval for all refunds

**And** send appropriate email to customer (auto-approved or under review)
**And** log approval decision with reason

### AC5: Email Notifications
**Given** a refund request is submitted
**When** customer confirms the request
**Then** they should receive email containing:
- Refund request number
- Order details (order #, event, tickets)
- Refund amount breakdown
- Expected processing time
- Status tracking link
- Next steps instructions
- Customer support contact

**Given** organizer needs to review request
**When** manual approval is required
**Then** organizer receives email with:
- Customer name and order details
- Refund amount and reason
- Time until event
- Quick approve/deny links
- Link to admin dashboard
- Deadline to review (e.g., 48 hours)

### AC6: Refund Reason Categorization
**Given** customer selects refund reason
**When** submitting the request
**Then** available reasons should be:
- "Can't attend the event"
- "Event time/date conflict"
- "Purchased by mistake"
- "Found better alternative"
- "Event cancelled/postponed"
- "Ticket pricing issue"
- "Other (please specify)"

**And** track reason statistics for analytics
**And** use reasons to inform organizer decisions

---

## Tasks / Subtasks

### Customer-Facing Features
- [ ] Create refund request page UI
  - [ ] File: `/app/orders/[orderId]/refund/page.tsx`
  - [ ] Display refund policy summary
  - [ ] Show eligibility status
  - [ ] Add time remaining indicator
  - [ ] Design refund request form

- [ ] Implement eligibility validation logic
  - [ ] File: `/lib/services/refund.service.ts`
  - [ ] Check event date constraints
  - [ ] Validate order status
  - [ ] Check ticket check-in status
  - [ ] Verify refund window
  - [ ] Check for existing requests

- [ ] Build refund request form
  - [ ] Reason dropdown with categories
  - [ ] Comments textarea (500 char limit)
  - [ ] Policy confirmation checkbox
  - [ ] Form validation
  - [ ] Submit handler

- [ ] Create request submission endpoint
  - [ ] POST `/api/orders/[orderId]/refund/request`
  - [ ] Validate eligibility server-side
  - [ ] Create RefundRequest record
  - [ ] Determine approval type (auto vs manual)
  - [ ] Trigger email notifications
  - [ ] Return confirmation data

### Organizer Dashboard Features
- [ ] Build refund request admin page
  - [ ] File: `/app/dashboard/refunds/page.tsx`
  - [ ] List all pending refund requests
  - [ ] Filter by status (pending, approved, denied)
  - [ ] Sort by date, amount, event
  - [ ] Show request details
  - [ ] Quick approve/deny actions

- [ ] Create refund request detail view
  - [ ] File: `/app/dashboard/refunds/[requestId]/page.tsx`
  - [ ] Display full order information
  - [ ] Show customer details
  - [ ] Display refund reason
  - [ ] Show time until event
  - [ ] Approve/Deny action buttons
  - [ ] Add admin notes field

- [ ] Implement approval/denial endpoints
  - [ ] POST `/api/admin/refunds/[requestId]/approve`
  - [ ] POST `/api/admin/refunds/[requestId]/deny`
  - [ ] Validate admin permissions
  - [ ] Update request status
  - [ ] Trigger refund processing (if approved)
  - [ ] Send customer notification

### Automation & Logic
- [ ] Build auto-approval logic
  - [ ] Evaluate auto-approval criteria
  - [ ] Check organizer settings
  - [ ] Process auto-approved requests
  - [ ] Log approval decisions
  - [ ] Queue for Square API (PAY-011b)

- [ ] Implement refund policy engine
  - [ ] File: `/lib/services/refund-policy.service.ts`
  - [ ] Calculate refund eligibility
  - [ ] Apply event-specific rules
  - [ ] Handle partial refunds
  - [ ] Calculate refund amount
  - [ ] Check time-based restrictions

### Email & Notifications
- [ ] Create customer refund request email template
  - [ ] Request confirmation
  - [ ] Auto-approval notification
  - [ ] Manual review notification
  - [ ] Include refund request number
  - [ ] Add status tracking link

- [ ] Create organizer notification email template
  - [ ] Pending request alert
  - [ ] Request details summary
  - [ ] Quick action links
  - [ ] Review deadline reminder

- [ ] Implement email sending service
  - [ ] Use existing email service
  - [ ] Queue emails for delivery
  - [ ] Track delivery status
  - [ ] Handle send failures

---

## Database Schema

```prisma
model RefundRequest {
  id              String           @id @default(cuid())
  orderId         String
  userId          String
  eventId         String

  // Request details
  status          RefundStatus     @default(PENDING)
  reason          RefundReason
  reasonText      String?          @db.Text
  requestedAmount Decimal          @db.Decimal(10, 2)

  // Approval workflow
  approvalType    ApprovalType     // AUTO or MANUAL
  approvedAt      DateTime?
  approvedBy      String?
  deniedAt        DateTime?
  deniedBy        String?
  denialReason    String?          @db.Text
  adminNotes      String?          @db.Text

  // Metadata
  createdAt       DateTime         @default(now())
  updatedAt       DateTime         @updatedAt
  processedAt     DateTime?

  // Relationships
  order           Order            @relation(fields: [orderId], references: [id])
  user            User             @relation(fields: [userId], references: [id])
  event           Event            @relation(fields: [eventId], references: [id])
  approver        User?            @relation("ApprovedBy", fields: [approvedBy], references: [id])
  denier          User?            @relation("DeniedBy", fields: [deniedBy], references: [id])
  refundTransaction RefundTransaction?

  @@index([orderId])
  @@index([userId])
  @@index([eventId])
  @@index([status])
  @@index([createdAt])
}

enum RefundStatus {
  PENDING
  APPROVED
  DENIED
  PROCESSING
  COMPLETED
  FAILED
}

enum RefundReason {
  CANNOT_ATTEND
  TIME_CONFLICT
  PURCHASED_BY_MISTAKE
  FOUND_ALTERNATIVE
  EVENT_CANCELLED
  PRICING_ISSUE
  OTHER
}

enum ApprovalType {
  AUTO
  MANUAL
}

// Add to Event model for refund policy
model Event {
  // ... existing fields

  // Refund policy settings
  refundEnabled         Boolean  @default(true)
  refundDeadlineHours   Int      @default(24) // Hours before event
  refundWindowDays      Int      @default(7)  // Days after purchase
  autoApproveEnabled    Boolean  @default(false)
  autoApproveThreshold  Decimal  @default(500.00) @db.Decimal(10, 2)
  refundPolicyText      String?  @db.Text
}
```

---

## Dev Notes

### Refund Eligibility Logic

```typescript
// lib/services/refund-policy.service.ts

export class RefundPolicyService {
  async checkEligibility(orderId: string): Promise<EligibilityResult> {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        event: true,
        tickets: true,
        refundRequests: true
      }
    });

    if (!order) {
      return { eligible: false, reason: 'Order not found' };
    }

    // Check 1: Event refund enabled
    if (!order.event.refundEnabled) {
      return { eligible: false, reason: 'Refunds not allowed for this event' };
    }

    // Check 2: Time until event
    const hoursUntilEvent = differenceInHours(order.event.startTime, new Date());
    if (hoursUntilEvent < order.event.refundDeadlineHours) {
      return {
        eligible: false,
        reason: `Refunds must be requested at least ${order.event.refundDeadlineHours} hours before event`
      };
    }

    // Check 3: Within refund window
    const daysSincePurchase = differenceInDays(new Date(), order.createdAt);
    if (daysSincePurchase > order.event.refundWindowDays) {
      return {
        eligible: false,
        reason: `Refund window of ${order.event.refundWindowDays} days has expired`
      };
    }

    // Check 4: Order status
    if (order.status !== 'COMPLETED') {
      return { eligible: false, reason: 'Order must be completed to request refund' };
    }

    // Check 5: No checked-in tickets
    const checkedInTickets = order.tickets.filter(t => t.status === 'CHECKED_IN');
    if (checkedInTickets.length > 0) {
      return { eligible: false, reason: 'Cannot refund tickets that have been checked in' };
    }

    // Check 6: No pending refund requests
    const pendingRequest = order.refundRequests.find(r => r.status === 'PENDING');
    if (pendingRequest) {
      return { eligible: false, reason: 'Refund request already pending' };
    }

    return {
      eligible: true,
      refundAmount: order.total,
      deadline: addHours(order.event.startTime, -order.event.refundDeadlineHours)
    };
  }

  async determineApprovalType(order: Order, amount: Decimal): Promise<ApprovalType> {
    const event = order.event;

    // Manual approval if organizer requires it
    if (!event.autoApproveEnabled) {
      return 'MANUAL';
    }

    // Manual approval for high-value orders
    if (amount.greaterThanOrEqualTo(event.autoApproveThreshold)) {
      return 'MANUAL';
    }

    // Manual approval if event is soon
    const daysUntilEvent = differenceInDays(event.startTime, new Date());
    if (daysUntilEvent <= 7) {
      return 'MANUAL';
    }

    // Auto-approve otherwise
    return 'AUTO';
  }
}
```

### Auto-Approval Flow

```typescript
// After refund request created
if (approvalType === 'AUTO') {
  // Immediately approve
  await prisma.refundRequest.update({
    where: { id: refundRequest.id },
    data: {
      status: 'APPROVED',
      approvalType: 'AUTO',
      approvedAt: new Date()
    }
  });

  // Queue for processing (Square API in PAY-011b)
  await refundQueue.add({
    refundRequestId: refundRequest.id
  });

  // Send auto-approval email
  await emailService.sendRefundAutoApproved(refundRequest);
} else {
  // Notify organizer for manual review
  await emailService.sendRefundReviewRequired(refundRequest);
}
```

---

## Testing

### Unit Tests
- [ ] Refund eligibility validation logic
- [ ] Auto-approval decision logic
- [ ] Refund policy calculations
- [ ] Form validation rules

### Integration Tests
- [ ] Refund request submission flow
- [ ] Email notification delivery
- [ ] Approval/denial workflows
- [ ] Policy enforcement

### Edge Cases
- [ ] Request submitted exactly at deadline
- [ ] Multiple simultaneous requests
- [ ] Partially checked-in orders
- [ ] Event cancelled before refund request
- [ ] Organizer changes policy after purchase

---

## Change Log

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-09-30 | BMAD SM Agent | Initial sharded story from PAY-011 |

---

*Sharded from PAY-011 (5 pts) - Part 1 of 2*
*Next: PAY-011b - Square Refund API Integration (3 pts)*
*Generated by BMAD SM Agent*