# Story: EV-014 - Early Bird Pricing

**Epic**: EPIC-005 - Advanced Event Features
**Story Points**: 3
**Priority**: P2 (Medium)
**Status**: Draft
**Dependencies**: EV-002 (Ticket Types), EV-013 (Tiered Pricing Rules)

---

## Story

**As an** event organizer
**I want to** offer discounted early bird tickets before a specific deadline
**So that** I can incentivize early registrations and improve cash flow

---

## Context & Business Value

**Early Bird Pricing is a Subset of EV-013**:
This story provides a simplified, user-friendly interface specifically for the most common use case: time-limited discounted tickets. While EV-013 provides the flexible pricing engine, this story focuses on ease-of-use for non-technical organizers.

**Why Separate Story**:
- 80% of organizers only need simple early bird pricing
- Dedicated UI is faster and less intimidating than full rule builder
- Quick setup: "Offer $X discount until DATE"
- Can co-exist with advanced pricing rules

**Business Impact**:
- **Cash Flow**: Get revenue 60-90 days before event
- **Planning**: Early sales data helps with venue/catering decisions
- **Marketing**: Creates urgency and incentivizes action
- **Conversion**: 15-25% higher conversion with early bird offers

**Real-World Examples**:
1. Conference: "$100 off until March 1st" - Sells 60% of tickets early
2. Concert: "First 100 tickets at $35, then $50" - Sells out early tier in 48 hours
3. Workshop: "Save 20% if registered by Friday" - Drives weekly registration spikes

---

## Acceptance Criteria

### AC-1: Simple Early Bird Configuration

**GIVEN** I am creating or editing a ticket type
**WHEN** I access the pricing section
**THEN** I should see an "Enable Early Bird Pricing" toggle

**WHEN** I enable early bird pricing
**THEN** I should see a simple form with:
- Regular price (base price)
- Early bird price (discounted price)
- Early bird deadline (date & time)
- Optional: Ticket quantity limit for early bird
- Preview showing savings amount and percentage

**Example Interface**:
```
┌──────────────────────────────────────────────────┐
│ Enable Early Bird Pricing ◉ On ○ Off            │
├──────────────────────────────────────────────────┤
│ Regular Price:          $ 75.00                  │
│                                                  │
│ Early Bird Price:       $ 50.00                  │
│                         ✓ Valid (33% discount)   │
│                                                  │
│ Early Bird Ends:        [Feb 28, 2025] [5:00 PM]│
│                         📅 60 days from now      │
│                                                  │
│ Limit Early Bird Tickets: ☑ Yes                 │
│ Max Early Bird Tickets:   [100]                  │
│                         (Optional capacity limit) │
│                                                  │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│ Preview:                                         │
│ • Before Feb 28: $50 (SAVE $25)                 │
│ • After Feb 28:  $75 (Regular Price)            │
│ • First 100 tickets only                         │
└──────────────────────────────────────────────────┘
```

**Validation Rules**:
- Early bird price must be less than regular price
- Deadline must be before event start date
- If quantity limited, must be less than total ticket quantity
- Warn if discount is less than 10% (recommended minimum)
- Warn if deadline is less than 7 days away (too short)

### AC-2: Automatic Price Transition

**GIVEN** I have configured early bird pricing
**WHEN** the early bird deadline passes
**THEN** system should:
- Automatically switch to regular pricing at exact deadline time
- Update all public-facing price displays
- Show "Early Bird Expired" status in organizer dashboard
- Log the transition for audit purposes

**WHEN** early bird ticket limit is reached (if configured)
**THEN** system should:
- Automatically disable early bird pricing
- Switch remaining tickets to regular price
- Display "Early Bird Sold Out" message to customers
- Notify organizer via email/dashboard notification

**Automated Checks** (Run every 5 minutes):
```
Check 1: Current Time >= Early Bird Deadline
  → YES: Deactivate early bird, activate regular pricing

Check 2: Early Bird Tickets Sold >= Early Bird Limit
  → YES: Deactivate early bird, activate regular pricing

Check 3: Event Sales End Time Passed
  → YES: Deactivate all pricing
```

### AC-3: Customer Early Bird Experience

**GIVEN** I am viewing an event with active early bird pricing
**WHEN** I see the ticket pricing
**THEN** I should see:
- "EARLY BIRD" badge/label prominently displayed
- Discounted price highlighted
- Regular price shown as crossed-out comparison
- Savings amount ($ and %)
- Deadline countdown or date
- Urgency messaging

**Display Example**:
```
╔════════════════════════════════════════════════╗
║ 🎟️ GENERAL ADMISSION                          ║
╠════════════════════════════════════════════════╣
║                                                ║
║     🏷️ EARLY BIRD SPECIAL                     ║
║                                                ║
║     $50.00                                     ║
║     Regular: $75.00                            ║
║     YOU SAVE: $25 (33%)                        ║
║                                                ║
║     ⏰ Ends in 5 days, 12 hours                ║
║     Only 23 Early Bird tickets left!           ║
║                                                ║
║     [Get Early Bird Price] →                   ║
║                                                ║
╚════════════════════════════════════════════════╝
```

**After Early Bird Ends**:
```
╔════════════════════════════════════════════════╗
║ 🎟️ GENERAL ADMISSION                          ║
╠════════════════════════════════════════════════╣
║                                                ║
║     $75.00                                     ║
║                                                ║
║     ⚠️ Early Bird Pricing Ended                ║
║                                                ║
║     [Purchase Ticket] →                        ║
║                                                ║
╚════════════════════════════════════════════════╝
```

### AC-4: Early Bird Analytics Dashboard

**GIVEN** I have active or completed early bird pricing
**WHEN** I view the event analytics
**THEN** I should see dedicated early bird metrics:
- Total early bird tickets sold
- Early bird revenue
- Average days before event for early bird purchases
- Early bird conversion rate
- Regular price tickets sold (for comparison)
- Revenue comparison (early vs regular)

**Dashboard Widget**:
```
┌────────────────────────────────────────────────┐
│ Early Bird Performance                         │
├────────────────────────────────────────────────┤
│ Status: ✓ Ended (Feb 28, 2025)                │
│                                                │
│ Early Bird Sales:                              │
│   Tickets Sold: 87 / 100 limit                │
│   Revenue: $4,350                              │
│   Avg Purchase: 62 days before event          │
│   Conversion Rate: 14.2%                       │
│                                                │
│ Regular Price Sales:                           │
│   Tickets Sold: 45                             │
│   Revenue: $3,375                              │
│   Avg Purchase: 28 days before event          │
│   Conversion Rate: 9.8%                        │
│                                                │
│ Impact:                                        │
│   Total Revenue: $7,725                        │
│   Early Bird %: 56.3% of total revenue         │
│   ✓ Early bird drove 66% of ticket sales      │
│                                                │
│ Insights:                                      │
│   • Early bird sold out 2 days before deadline│
│   • Consider increasing limit to 150 next time│
│   • Strong conversion indicates good price    │
└────────────────────────────────────────────────┘
```

### AC-5: Email Notifications and Marketing

**GIVEN** I have configured early bird pricing
**WHEN** certain events occur
**THEN** system should send automated notifications:

**To Organizer**:
- Early bird period starts (confirmation)
- 80% of early bird tickets sold (warning)
- Early bird tickets sold out (alert)
- 7 days before early bird deadline (reminder to promote)
- 24 hours before deadline (final reminder)
- Early bird period ended (summary with stats)

**To Customers** (Marketing Emails):
- Event announcement with early bird offer
- 7 days before deadline reminder (to waitlist/followers)
- 24 hours before deadline urgency email
- "Last chance" email 3 hours before deadline

**Email Template Example**:
```
Subject: ⏰ Early Bird Pricing Ends in 24 Hours!

Hi [Name],

Don't miss your chance to save $25 on General Admission
tickets for [Event Name]!

🎟️ Early Bird: $50 (Save 33%)
⏰ Ends: Tomorrow at 5:00 PM
🔥 Only 23 tickets left at this price

After the deadline, tickets will be $75.

[Claim Your Early Bird Ticket Now] →

See you at the event!
[Organizer Name]
```

### AC-6: Integration with Discount Codes

**GIVEN** I have both early bird pricing and discount codes
**WHEN** a customer applies a discount code during early bird period
**THEN** system should:
- Allow both to stack (if organizer permits)
- OR apply best discount only (if organizer prefers)
- Clearly show which discount(s) applied
- Calculate correct final price

**Configuration Option**:
```
Early Bird Settings:
☑ Allow discount codes to stack with early bird pricing
☐ Discount codes override early bird pricing
☐ Only allow early bird OR discount code (best price wins)
```

**Example Calculations**:
```
Scenario: Early Bird $50, Discount Code "SAVE10" for 10% off

If Stacking Allowed:
  Early Bird Price: $50
  - 10% Code Discount: -$5
  Final Price: $45 ✓

If Best Price Wins:
  Option A: Early Bird = $50
  Option B: Regular ($75) - 10% = $67.50
  Final Price: $50 (early bird wins) ✓
```

---

## Tasks / Subtasks

### Phase 1: Backend Implementation (6 hours)

- [ ] **Extend Pricing Schema** (AC-1)
  - [ ] Add early bird fields to TicketType model:
    - `earlyBirdEnabled: Boolean`
    - `earlyBirdPrice: Decimal`
    - `earlyBirdDeadline: DateTime`
    - `earlyBirdLimit: Int?`
    - `earlyBirdSold: Int`
  - [ ] Create migration

- [ ] **Early Bird Pricing Service** (AC-1, AC-2)
  - [ ] `EarlyBirdService.ts` with methods:
    - `getCurrentPrice(ticketTypeId)` - Returns current applicable price
    - `isEarlyBirdActive(ticketTypeId)` - Check if early bird still valid
    - `checkAndTransition(ticketTypeId)` - Check for automatic transition
    - `getEarlyBirdStatus(ticketTypeId)` - Get full status info
  - [ ] Integrate with existing PricingEngine from EV-013

- [ ] **Automated Transition Job** (AC-2)
  - [ ] Create scheduled job (runs every 5 minutes)
  - [ ] Check all active early bird deadlines
  - [ ] Check all early bird ticket limits
  - [ ] Transition pricing automatically
  - [ ] Log transitions to audit log

### Phase 2: API Layer (3 hours)

- [ ] **Pricing APIs** (AC-1, AC-4)
  - [ ] Update `GET /api/events/:eventId/ticket-types/:id/pricing` - Include early bird info
  - [ ] `PATCH /api/events/:eventId/ticket-types/:id/early-bird` - Configure early bird
  - [ ] `GET /api/events/:eventId/early-bird/analytics` - Early bird stats

### Phase 3: Organizer UI (6 hours)

- [ ] **Early Bird Configuration Form** (AC-1)
  - [ ] `EarlyBirdPricingForm.tsx` - Simple, focused interface
  - [ ] Add to ticket type creation/edit flow
  - [ ] Real-time validation and preview
  - [ ] Savings calculator
  - [ ] Deadline picker with timezone support

- [ ] **Early Bird Dashboard Widget** (AC-4)
  - [ ] `EarlyBirdMetrics.tsx` - Analytics display
  - [ ] Add to event dashboard overview
  - [ ] Show status and key metrics
  - [ ] Progress bars for ticket limit

### Phase 4: Customer-Facing UI (5 hours)

- [ ] **Early Bird Price Display** (AC-3)
  - [ ] `EarlyBirdBadge.tsx` - Visual indicator
  - [ ] `PriceComparison.tsx` - Show savings
  - [ ] `EarlyBirdCountdown.tsx` - Countdown timer
  - [ ] `QuantityRemaining.tsx` - "Only X left" indicator
  - [ ] Update event listing and detail pages

- [ ] **Urgency Indicators** (AC-3)
  - [ ] Countdown timer (days, hours, minutes)
  - [ ] Low stock warning (< 20% remaining)
  - [ ] "Ending soon" badges (< 48 hours)

### Phase 5: Notifications & Marketing (4 hours)

- [ ] **Email Templates** (AC-5)
  - [ ] Create early bird announcement template
  - [ ] Create reminder email templates
  - [ ] Create deadline urgency template
  - [ ] Create organizer notification templates

- [ ] **Automated Email Triggers** (AC-5)
  - [ ] Set up email sending at key milestones
  - [ ] 7-day reminder automation
  - [ ] 24-hour urgency automation
  - [ ] Sold out notification
  - [ ] Ended notification with stats

### Phase 6: Testing (4 hours)

- [ ] Unit tests for pricing calculation
- [ ] Unit tests for transition logic
- [ ] Integration test: Full early bird lifecycle
- [ ] E2E test: Configure and purchase early bird ticket
- [ ] E2E test: Automatic price transition
- [ ] Test timezone handling
- [ ] Test concurrent purchase edge cases

---

## Technical Design

### Database Schema Extension

```prisma
model TicketType {
  // ... existing fields

  // Early Bird Configuration
  earlyBirdEnabled   Boolean   @default(false)
  earlyBirdPrice     Decimal?  @db.Decimal(10, 2)
  earlyBirdDeadline  DateTime?
  earlyBirdLimit     Int?      // Optional capacity limit for early bird
  earlyBirdSold      Int       @default(0)

  // Computed/Cached
  earlyBirdActive    Boolean   @default(false) // Updated by scheduled job
  lastPriceCheck     DateTime? // Last time pricing was evaluated
}
```

### Early Bird Service Implementation

```typescript
// lib/services/early-bird.service.ts

interface EarlyBirdStatus {
  isActive: boolean;
  price: number;
  regularPrice: number;
  savings: number;
  savingsPercentage: number;
  deadline: Date | null;
  timeRemaining: {
    days: number;
    hours: number;
    minutes: number;
  } | null;
  ticketsRemaining: number | null;
  status: 'ACTIVE' | 'SOLD_OUT' | 'EXPIRED' | 'NOT_CONFIGURED';
}

class EarlyBirdService {
  /**
   * Get current early bird status
   */
  async getStatus(ticketTypeId: string): Promise<EarlyBirdStatus> {
    const ticketType = await prisma.ticketType.findUnique({
      where: { id: ticketTypeId }
    });

    if (!ticketType || !ticketType.earlyBirdEnabled) {
      return {
        isActive: false,
        status: 'NOT_CONFIGURED',
        price: ticketType?.price || 0,
        regularPrice: ticketType?.price || 0,
        savings: 0,
        savingsPercentage: 0,
        deadline: null,
        timeRemaining: null,
        ticketsRemaining: null
      };
    }

    const now = new Date();
    const isBeforeDeadline = ticketType.earlyBirdDeadline
      ? now < ticketType.earlyBirdDeadline
      : false;

    const isUnderLimit = ticketType.earlyBirdLimit
      ? ticketType.earlyBirdSold < ticketType.earlyBirdLimit
      : true;

    const isActive = isBeforeDeadline && isUnderLimit;

    let status: EarlyBirdStatus['status'];
    if (isActive) {
      status = 'ACTIVE';
    } else if (!isUnderLimit) {
      status = 'SOLD_OUT';
    } else {
      status = 'EXPIRED';
    }

    const price = isActive
      ? Number(ticketType.earlyBirdPrice)
      : Number(ticketType.price);

    const savings = Number(ticketType.price) - Number(ticketType.earlyBirdPrice || 0);
    const savingsPercentage = (savings / Number(ticketType.price)) * 100;

    return {
      isActive,
      status,
      price,
      regularPrice: Number(ticketType.price),
      savings,
      savingsPercentage,
      deadline: ticketType.earlyBirdDeadline,
      timeRemaining: isActive && ticketType.earlyBirdDeadline
        ? this.calculateTimeRemaining(ticketType.earlyBirdDeadline)
        : null,
      ticketsRemaining: ticketType.earlyBirdLimit
        ? ticketType.earlyBirdLimit - ticketType.earlyBirdSold
        : null
    };
  }

  /**
   * Check and perform automatic transition if needed
   */
  async checkTransition(ticketTypeId: string): Promise<void> {
    const status = await this.getStatus(ticketTypeId);

    if (status.status !== 'ACTIVE') {
      await prisma.ticketType.update({
        where: { id: ticketTypeId },
        data: {
          earlyBirdActive: false,
          lastPriceCheck: new Date()
        }
      });

      // Log transition
      await this.logTransition(ticketTypeId, status.status);

      // Send notification to organizer
      await this.notifyOrganizer(ticketTypeId, status.status);
    }
  }

  /**
   * Calculate time remaining until deadline
   */
  private calculateTimeRemaining(deadline: Date) {
    const now = new Date();
    const diff = deadline.getTime() - now.getTime();

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    return { days, hours, minutes };
  }

  /**
   * Scheduled job: Check all active early birds for transition
   */
  async runTransitionCheck(): Promise<void> {
    const activeEarlyBirds = await prisma.ticketType.findMany({
      where: {
        earlyBirdEnabled: true,
        earlyBirdActive: true
      }
    });

    for (const ticketType of activeEarlyBirds) {
      await this.checkTransition(ticketType.id);
    }
  }
}
```

### Countdown Timer Component

```typescript
// components/events/EarlyBirdCountdown.tsx

export function EarlyBirdCountdown({ deadline }: { deadline: Date }) {
  const [timeRemaining, setTimeRemaining] = useState(calculateTimeRemaining(deadline));

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeRemaining(calculateTimeRemaining(deadline));
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [deadline]);

  const { days, hours, minutes } = timeRemaining;

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
      <div className="flex items-center gap-2 text-amber-800 mb-2">
        <Clock className="w-5 h-5" />
        <span className="font-semibold">Early Bird Ends In:</span>
      </div>
      <div className="flex gap-4">
        <div className="text-center">
          <div className="text-3xl font-bold text-amber-900">{days}</div>
          <div className="text-xs text-amber-700">days</div>
        </div>
        <div className="text-3xl text-amber-400">:</div>
        <div className="text-center">
          <div className="text-3xl font-bold text-amber-900">{hours}</div>
          <div className="text-xs text-amber-700">hours</div>
        </div>
        <div className="text-3xl text-amber-400">:</div>
        <div className="text-center">
          <div className="text-3xl font-bold text-amber-900">{minutes}</div>
          <div className="text-xs text-amber-700">mins</div>
        </div>
      </div>
    </div>
  );
}
```

---

## Edge Cases & Business Rules

### 1. Timezone Handling
- **Rule**: Deadline is always in event timezone
- **Display**: Show deadline in customer's timezone with conversion
- **Example**: "Ends Feb 28 at 5:00 PM EST (2:00 PM PST for you)"

### 2. Cart Price Locking
- **Rule**: Early bird price locked when added to cart (15 min)
- **Scenario**: Customer adds ticket at 4:55 PM, deadline is 5:00 PM
- **Result**: Customer pays early bird price even if checkout completes at 5:05 PM

### 3. Partial Quantity Scenarios
- **Scenario**: Customer wants 10 tickets, only 3 early bird left
- **Option A**: Prevent purchase, show "Only 3 early bird tickets remaining"
- **Option B**: Allow mixed pricing (3 @ early bird, 7 @ regular)
- **Recommendation**: Option A (cleaner UX)

### 4. Concurrent Purchase Race Conditions
- **Scenario**: 1 early bird ticket left, 2 customers purchase simultaneously
- **Solution**: Database transaction with lock on `earlyBirdSold` counter
- **Result**: One succeeds, one gets regular price

### 5. Organizer Changes After Sales Start
- **Rule**: Cannot change early bird price after first sale
- **Rule**: Can extend deadline but not shorten
- **Protection**: System warnings and confirmations

---

## Integration Points

### Integrates With:
- **EV-013 (Tiered Pricing)**: Uses underlying pricing engine
- **DISC-001 (Discounts)**: Stacking logic
- **PAY-001 (Payments)**: Price calculation
- **EMAIL-001 (Notifications)**: Automated marketing emails
- **AN-001 (Analytics)**: Performance tracking

---

## Success Metrics

- **Adoption**: 60% of events use early bird pricing
- **Early Sales**: 40-50% of tickets sold during early bird period
- **Revenue Impact**: 10-15% revenue increase vs no early bird
- **Conversion**: 20% higher conversion during early bird
- **Email Performance**: 15% open rate, 8% click-through on reminder emails

---

## Change Log

| Date | Version | Description | Author |
|------|---------|-------------|---------|
| 2025-09-30 | 1.0 | Initial story creation | BMAD SM Agent |

---

## Dev Agent Record
*To be populated by dev agent*

---

## QA Results
*To be populated by QA agent*