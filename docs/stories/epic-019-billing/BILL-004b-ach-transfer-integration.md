# BILL-004b: ACH Transfer Integration

**Parent Story:** BILL-004 - Organizer Payout Management
**Epic:** EPIC-019 - Platform Billing & Revenue
**Story Points:** 3
**Priority:** High
**Status:** Ready for Development

## User Story

**As a** platform operator
**I want** to process ACH transfers to organizers via Stripe Connect
**So that** organizers receive their payouts reliably and efficiently

## Acceptance Criteria

### AC1: Stripe Connect Payout API Integration
- [ ] Integrate Stripe Connect Express accounts for organizers
- [ ] Create payout via Stripe API: `POST /v1/payouts`
- [ ] Support payout methods: Standard ACH (3-5 days), Instant (30 min, +1.5% fee)
- [ ] Payout metadata includes: Order IDs, Event IDs, Date range
- [ ] Automatic retries on temporary failures (3 attempts with exponential backoff)
- [ ] Webhook handling for payout status updates

### AC2: 7-Day Rolling Reserve Logic
- [ ] Revenue from ticket sales held for 7 calendar days before payout eligibility
- [ ] Daily cron job calculates available balance:
  ```
  Available = (Revenue from >7 days ago) - (Pending payouts) - (Reserve)
  ```
- [ ] Reserve percentage: 10% held until event completes (fraud prevention)
- [ ] Post-event release: Reserve released 7 days after event end date
- [ ] High-risk organizers: Extended hold period (14-30 days)

### AC3: Payout Status Tracking
- [ ] Status flow: `requested` → `pending` → `in_transit` → `paid` / `failed` / `canceled`
- [ ] Real-time status updates via Stripe webhooks:
  - `payout.created`: Status = pending
  - `payout.paid`: Status = paid, update balance
  - `payout.failed`: Status = failed, refund balance
  - `payout.canceled`: Status = canceled, refund balance
- [ ] Status displayed in UI with color coding and icons
- [ ] Email notifications sent on status changes
- [ ] Estimated arrival date calculated and displayed

### AC4: Payout History & Details
- [ ] Payout list table with columns:
  - Date requested
  - Amount
  - Bank account (last 4 digits)
  - Status (badge)
  - Arrival date
  - Actions (View details, Download receipt)
- [ ] Pagination: 20 payouts per page
- [ ] Filters: Status (All, Pending, Paid, Failed), Date range
- [ ] Search by amount or bank account
- [ ] Sort by: Date (newest/oldest), Amount (highest/lowest)
- [ ] Payout detail page shows:
  - Full transaction breakdown
  - Associated orders and events
  - Timeline of status changes
  - Downloadable payout statement (PDF)

### AC5: Error Handling & Failed Payouts
- [ ] Failed payout reasons captured:
  - Invalid bank account
  - Insufficient Stripe balance (platform)
  - Account closed/frozen
  - ACH rejection
- [ ] Failed payout notifications sent immediately
- [ ] Balance automatically restored on failure
- [ ] "Retry Payout" button in UI (for fixable errors)
- [ ] Support ticket auto-created for persistent failures
- [ ] Admin dashboard flags for manual review

## Technical Implementation

**File:** `/lib/services/stripe-payout.service.ts`
```typescript
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export class StripePayoutService {
  async createPayout(params: {
    organizerId: string;
    amount: number;
    bankAccountId: string;
    speed?: 'standard' | 'instant';
  }): Promise<Payout> {
    const { organizerId, amount, bankAccountId, speed = 'standard' } = params;

    // Get organizer's Stripe Connect account
    const organizer = await prisma.user.findUnique({
      where: { id: organizerId },
      include: { stripeConnectAccount: true },
    });

    if (!organizer.stripeConnectAccount) {
      throw new Error('Organizer has no Stripe Connect account');
    }

    // Convert amount to cents
    const amountCents = Math.round(amount * 100);

    try {
      // Create payout via Stripe API
      const stripePayout = await stripe.payouts.create(
        {
          amount: amountCents,
          currency: 'usd',
          method: speed,
          destination: bankAccountId,
          metadata: {
            organizerId,
            payoutId: generatePayoutId(),
          },
        },
        {
          stripeAccount: organizer.stripeConnectAccount.stripeAccountId,
        }
      );

      // Record payout in database
      const payout = await prisma.payout.create({
        data: {
          organizerId,
          amount,
          bankAccountId,
          status: 'pending',
          stripePayoutId: stripePayout.id,
          speed,
          estimatedArrival: this.calculateArrivalDate(speed),
          metadata: { stripeResponse: stripePayout },
        },
      });

      return payout;
    } catch (error) {
      console.error('Stripe payout failed:', error);
      throw new Error(`Payout failed: ${error.message}`);
    }
  }

  async handleWebhook(event: Stripe.Event): Promise<void> {
    switch (event.type) {
      case 'payout.created':
        await this.handlePayoutCreated(event.data.object as Stripe.Payout);
        break;
      case 'payout.paid':
        await this.handlePayoutPaid(event.data.object as Stripe.Payout);
        break;
      case 'payout.failed':
        await this.handlePayoutFailed(event.data.object as Stripe.Payout);
        break;
    }
  }

  private async handlePayoutPaid(stripePayout: Stripe.Payout): Promise<void> {
    await prisma.payout.update({
      where: { stripePayoutId: stripePayout.id },
      data: {
        status: 'paid',
        paidAt: new Date(stripePayout.arrival_date * 1000),
      },
    });

    // Send confirmation email
    const payout = await prisma.payout.findUnique({
      where: { stripePayoutId: stripePayout.id },
      include: { organizer: true },
    });

    await emailService.sendPayoutConfirmation(payout.organizer.email, payout);
  }

  private calculateArrivalDate(speed: 'standard' | 'instant'): Date {
    const now = new Date();
    return speed === 'instant'
      ? addMinutes(now, 30)
      : addBusinessDays(now, 4); // 3-5 business days
  }
}
```

**File:** `/lib/cron/calculate-available-balance.ts`
```typescript
export async function calculateAvailableBalance(organizerId: string): Promise<number> {
  const sevenDaysAgo = subDays(new Date(), 7);

  // Get revenue older than 7 days
  const eligibleRevenue = await prisma.revenueSplit.aggregate({
    where: {
      organizerId,
      recordedAt: { lte: sevenDaysAgo },
    },
    _sum: { organizerNetRevenue: true },
  });

  // Subtract pending/in-transit payouts
  const pendingPayouts = await prisma.payout.aggregate({
    where: {
      organizerId,
      status: { in: ['pending', 'in_transit'] },
    },
    _sum: { amount: true },
  });

  // Subtract 10% reserve for upcoming events
  const reserve = await calculateReserve(organizerId);

  const available =
    (eligibleRevenue._sum.organizerNetRevenue || 0) -
    (pendingPayouts._sum.amount || 0) -
    reserve;

  return Math.max(0, available);
}

async function calculateReserve(organizerId: string): Promise<number> {
  // 10% of revenue from events happening in next 30 days
  const upcomingEvents = await prisma.event.findMany({
    where: {
      organizerId,
      startDateTime: {
        gte: new Date(),
        lte: addDays(new Date(), 30),
      },
    },
    include: { orders: true },
  });

  const upcomingRevenue = upcomingEvents.reduce((sum, event) => {
    return sum + event.orders.reduce((s, o) => s + o.totalAmount, 0);
  }, 0);

  return upcomingRevenue * 0.10; // 10% reserve
}
```

## Testing Requirements

```typescript
describe('StripePayoutService', () => {
  it('creates payout successfully', async () => {
    const payout = await stripePayoutService.createPayout({
      organizerId: 'org_123',
      amount: 500,
      bankAccountId: 'ba_123',
      speed: 'standard',
    });

    expect(payout.status).toBe('pending');
    expect(payout.amount).toBe(500);
  });

  it('handles payout webhook correctly', async () => {
    const event = createMockStripeEvent('payout.paid');
    await stripePayoutService.handleWebhook(event);

    const payout = await prisma.payout.findUnique({
      where: { stripePayoutId: event.data.object.id },
    });

    expect(payout.status).toBe('paid');
  });

  it('calculates 7-day rolling reserve correctly', async () => {
    const balance = await calculateAvailableBalance('org_123');
    // Assert balance excludes revenue from last 7 days
  });
});
```

## Definition of Done

- [ ] Stripe Connect integration complete
- [ ] ACH transfers working end-to-end
- [ ] 7-day rolling reserve implemented
- [ ] Webhook handling robust
- [ ] Payout status tracking accurate
- [ ] Unit tests pass (>85% coverage)
- [ ] E2E tests pass
- [ ] Code reviewed and approved