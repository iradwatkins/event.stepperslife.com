# Story: TIX-007 - Ticket Cancellation & Refund

**Epic**: EPIC-004 - Digital Ticket System
**Story Points**: 3
**Priority**: P1 (High)
**Status**: Not Started
**Dependencies**: PAY-002 (Payment Processing), TIX-001 (QR Generation)

---

## Story

**As a** ticket holder
**I want to** request a refund for my ticket
**So that** I can get my money back if I can't attend

---

## Acceptance Criteria

1. GIVEN I have a valid ticket
   WHEN I view ticket details
   THEN I should see:
   - "Request Refund" button (if refundable)
   - Refund policy information
   - Refund deadline countdown
   - "Non-refundable" message (if applicable)
   - Partial refund amount if policy applies

2. GIVEN I request a refund
   WHEN I submit refund request
   THEN system should:
   - Verify refund eligibility (time window)
   - Check refund policy rules
   - Calculate refund amount (may be partial)
   - Confirm refund amount with user
   - Process refund via Square
   - Invalidate ticket QR code
   - Send refund confirmation email

3. GIVEN refund policy has fees
   WHEN calculating refund amount
   THEN system should:
   - Deduct applicable cancellation fee
   - Show original purchase price
   - Show deductions (fees, processing)
   - Show final refund amount
   - Explain fee breakdown
   - Require user confirmation

4. GIVEN refund is processed
   WHEN Square confirms refund
   THEN system should:
   - Update order status to REFUNDED
   - Update ticket status to CANCELLED
   - Deactivate QR code immediately
   - Create refund record
   - Notify organizer of cancellation
   - Update event capacity/availability
   - Send confirmation to customer
   - Refund platform fee (if applicable)

5. GIVEN organizer has refund policy
   WHEN customer requests refund
   THEN system should:
   - Enforce event-specific policy
   - Check time-based restrictions
   - Apply percentage-based refunds
   - Handle no-refund periods
   - Allow organizer override (manual)

6. GIVEN refund is denied
   WHEN outside refund window or non-refundable
   THEN system should:
   - Display clear denial reason
   - Show policy that applies
   - Suggest ticket transfer instead
   - Provide organizer contact info
   - Log refund denial for analytics

---

## Tasks / Subtasks

- [ ] Design refund database schema (AC: 4)
  - [ ] Create Refund model
  - [ ] Link to Order and Ticket
  - [ ] Store refund amount and fees
  - [ ] Track refund status
  - [ ] Add timestamps and metadata

- [ ] Build refund request UI (AC: 1, 2, 3)
  - [ ] File: `/app/dashboard/tickets/[ticketId]/refund/page.tsx`
  - [ ] Show refund policy prominently
  - [ ] Display refund amount calculation
  - [ ] Fee breakdown display
  - [ ] Confirmation dialog
  - [ ] Success/error messaging

- [ ] Implement refund service (AC: 2, 3, 4)
  - [ ] File: `/lib/services/refund.service.ts`
  - [ ] `checkRefundEligibility()` method
  - [ ] `calculateRefundAmount()` method
  - [ ] `processRefund()` method
  - [ ] Square refund API integration
  - [ ] Handle partial refunds

- [ ] Create refund API endpoints (AC: All)
  - [ ] POST `/api/tickets/[ticketId]/refund/check` - Check eligibility
  - [ ] POST `/api/tickets/[ticketId]/refund/request` - Request refund
  - [ ] GET `/api/orders/[orderId]/refunds` - List refunds
  - [ ] GET `/api/refunds/[refundId]` - Refund details

- [ ] Integrate Square Refunds API (AC: 2, 4)
  - [ ] Use Square SDK refund methods
  - [ ] Handle full and partial refunds
  - [ ] Process refund confirmation
  - [ ] Handle refund failures
  - [ ] Store Square refund ID

- [ ] Implement refund policy engine (AC: 3, 5)
  - [ ] Time-based policy rules
  - [ ] Percentage-based refunds
  - [ ] Flat fee deductions
  - [ ] No-refund window enforcement
  - [ ] Event-specific overrides

- [ ] Build refund calculation logic (AC: 3)
  - [ ] Original ticket price
  - [ ] Minus platform fee (refund to organizer)
  - [ ] Minus cancellation fee (if policy)
  - [ ] Minus processing fee (non-refundable)
  - [ ] Calculate final refund amount

- [ ] Add ticket invalidation (AC: 4)
  - [ ] Mark ticket as CANCELLED
  - [ ] Deactivate QR code
  - [ ] Update check-in validation
  - [ ] Prevent check-in of refunded tickets

- [ ] Implement refund notifications (AC: 2, 4)
  - [ ] Customer confirmation email
  - [ ] Organizer notification email
  - [ ] Admin alert for monitoring
  - [ ] Include refund details in emails

- [ ] Build refund management UI (AC: 6)
  - [ ] Organizer refund dashboard
  - [ ] View all refund requests
  - [ ] Manual refund approval (if needed)
  - [ ] Refund analytics
  - [ ] Export refund reports

- [ ] Add capacity adjustment (AC: 4)
  - [ ] Return ticket to available inventory
  - [ ] Update sold ticket count
  - [ ] Trigger waitlist notifications
  - [ ] Update event statistics

- [ ] Implement refund policy configuration (AC: 5)
  - [ ] Define refund policy per event
  - [ ] Time-window settings
  - [ ] Fee percentage settings
  - [ ] Non-refundable ticket types
  - [ ] Policy preview for customers

- [ ] Add refund analytics (AC: All)
  - [ ] Track refund rate per event
  - [ ] Monitor refund reasons
  - [ ] Financial impact reporting
  - [ ] Identify high-refund events

---

## Dev Notes

### Architecture References
- **Payment Service**: `/lib/payments/square.config.ts`
- **Email Service**: `/lib/services/email.ts`

### Source Tree
```
lib/services/
  └── refund.service.ts             # NEW
app/api/tickets/[ticketId]/
  └── refund/
      ├── check/route.ts            # NEW
      └── request/route.ts          # NEW
app/api/refunds/
  └── [refundId]/route.ts           # NEW
app/dashboard/tickets/[ticketId]/
  └── refund/page.tsx               # NEW
app/dashboard/events/[eventId]/
  └── refunds/page.tsx              # NEW (organizer view)
prisma/
  └── schema.prisma                 # MODIFY: Add Refund model
```

### Database Schema

```prisma
model Refund {
  id                String    @id @default(uuid())
  orderId           String
  ticketId          String?

  // Refund Details
  refundNumber      String    @unique
  amount            Decimal   @db.Decimal(10, 2)
  originalAmount    Decimal   @db.Decimal(10, 2)
  cancellationFee   Decimal   @db.Decimal(10, 2) @default(0)
  currency          String    @default("USD")

  // Square Integration
  squareRefundId    String?   @unique
  squarePaymentId   String

  // Status
  status            RefundStatus @default(PENDING)
  reason            String?
  requestedBy       String

  // Processing
  requestedAt       DateTime  @default(now())
  processedAt       DateTime?
  completedAt       DateTime?

  // Relations
  order             Order     @relation(fields: [orderId], references: [id])
  ticket            Ticket?   @relation(fields: [ticketId], references: [id])
  requester         User      @relation(fields: [requestedBy], references: [id])

  @@index([orderId])
  @@index([ticketId])
  @@index([status])
  @@map("refunds")
}

enum RefundStatus {
  PENDING
  PROCESSING
  COMPLETED
  FAILED
  DENIED
}
```

### Refund Policy Examples

```typescript
// Event refund policies
interface RefundPolicy {
  enabled: boolean;
  windowDays: number;          // Days before event
  windowHours?: number;        // Or hours before event
  feePercentage: number;       // 0-100
  flatFee?: number;            // Fixed fee amount
  noRefundPeriod?: number;     // Hours before event (no refund)
}

// Example policies:
const FLEXIBLE_POLICY: RefundPolicy = {
  enabled: true,
  windowDays: 7,              // Refund up to 7 days before
  feePercentage: 0,           // No fee
  noRefundPeriod: 24          // But not within 24 hours
};

const MODERATE_POLICY: RefundPolicy = {
  enabled: true,
  windowDays: 14,
  feePercentage: 10,          // 10% cancellation fee
  noRefundPeriod: 48
};

const STRICT_POLICY: RefundPolicy = {
  enabled: true,
  windowDays: 30,
  feePercentage: 25,          // 25% cancellation fee
  noRefundPeriod: 72
};

const NO_REFUND_POLICY: RefundPolicy = {
  enabled: false,
  windowDays: 0,
  feePercentage: 100
};
```

### Refund Calculation

```typescript
function calculateRefund(
  ticketPrice: number,
  platformFee: number,
  processingFee: number,
  policy: RefundPolicy,
  hoursUntilEvent: number
): RefundCalculation {
  // Check if within no-refund period
  if (policy.noRefundPeriod && hoursUntilEvent < policy.noRefundPeriod) {
    return { eligible: false, reason: 'Within no-refund period' };
  }

  // Calculate base refund (original ticket price)
  let refundAmount = ticketPrice;

  // Apply cancellation fee
  const cancellationFee = refundAmount * (policy.feePercentage / 100);
  refundAmount -= cancellationFee;

  // Platform fee goes back to organizer (we don't refund it)
  // Processing fee is non-refundable (Square keeps it)

  return {
    eligible: true,
    originalAmount: ticketPrice,
    cancellationFee,
    processingFeeNote: 'Non-refundable',
    refundAmount,
    platformFeeRefund: platformFee, // Goes to organizer
    breakdown: {
      ticketPrice,
      minusCancellationFee: -cancellationFee,
      finalRefund: refundAmount
    }
  };
}
```

### Square Refund Integration

```typescript
// Process refund via Square
async function processSquareRefund(
  paymentId: string,
  amountMoney: { amount: bigint, currency: string }
) {
  const { result } = await squareClient.refunds.refundPayment({
    paymentId,
    idempotencyKey: `refund-${Date.now()}`,
    amountMoney
  });

  return {
    refundId: result.refund?.id,
    status: result.refund?.status,
    processingFee: result.refund?.processingFee
  };
}
```

### Email Templates

**Refund Confirmation Email**:
```
Subject: Refund Processed for {EventName}

Hi {CustomerName},

Your refund request has been processed.

Event: {EventName}
Date: {EventDate}
Original Amount: ${originalAmount}
Cancellation Fee: ${cancellationFee}
Refund Amount: ${refundAmount}

The refund will appear in your account within 5-10 business days.

Your ticket has been cancelled and can no longer be used for entry.

Questions? Contact support@events.stepperslife.com

Thanks,
SteppersLife Events
```

---

## Testing

### Refund Flow Testing
- Full refund (no fee)
- Partial refund (with fee)
- Refund denial (outside window)
- Failed refund handling
- Concurrent refund requests

### Policy Testing
- Time-based restrictions
- Percentage-based fees
- Flat fee deductions
- No-refund period enforcement
- Event-specific overrides

### Integration Testing
- Square API refund success
- Square API refund failure
- Webhook handling
- Email delivery
- Capacity updates

---

## Change Log

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-09-29 | BMAD SM Agent | Initial story creation |

---

*Generated by BMAD SM Agent*