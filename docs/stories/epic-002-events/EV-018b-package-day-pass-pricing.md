# Story: EV-018b - Package vs Day Pass Pricing

**Epic**: EPIC-002 - Event Management Core
**Parent Story**: EV-018 - Multi-Day Events (5 pts)
**Story Points**: 3
**Priority**: P2 (Important)
**Status**: Draft
**Dependencies**:
- EV-018a (Multi-day date handling & schema)
- EV-002 (Ticket types)
- TIX-001 (Ticket validation)
**Downstream**: None

---

## Story

**As an** event organizer
**I want to** offer both full festival passes and individual day passes
**So that** I can maximize attendance and revenue by accommodating different customer needs

**As a** customer
**I want to** choose between attending all days or specific days
**So that** I can fit the event into my schedule and budget

---

## Acceptance Criteria

1. GIVEN I am creating a multi-day event
   WHEN I configure ticket types
   THEN I should see options to create:
   - Full Festival Pass (all days access)
   - Individual Day Passes (per-day access)
   AND I can set different pricing for each option

2. GIVEN I create a Full Festival Pass
   WHEN I configure the ticket type
   THEN I should set:
   - Pass name (e.g., "3-Day Festival Pass")
   - Full pass price
   - Optional discount vs sum of day passes
   - Quantity available
   AND pass should grant access to all event days

3. GIVEN I create Individual Day Passes
   WHEN I configure day-specific tickets
   THEN I should see a day selector
   AND I can set different prices per day (Friday, Saturday, Sunday)
   AND each day can have separate inventory limits
   AND customers can buy multiple day passes

4. GIVEN a customer views a multi-day event
   WHEN they see ticket options
   THEN they should see:
   - Full Festival Pass with total price and "All Days Access" badge
   - Individual Day Passes listed by date
   - Price comparison showing savings with full pass
   - Clear indication of what's included in each option

5. GIVEN a customer selects day passes
   WHEN they choose specific days
   THEN cart should show selected days clearly
   AND total should calculate sum of selected day passes
   AND system should show potential savings with full pass
   AND display message: "Get 3-Day Pass and save $25!"

6. GIVEN a customer purchases a full festival pass
   WHEN they complete checkout
   THEN ticket should indicate "All Days Access"
   AND QR code should validate for any day of event
   AND ticket should list all event dates
   AND email should include full event schedule

7. GIVEN a customer purchases day-specific passes
   WHEN they complete checkout
   THEN each ticket should show specific date
   AND QR code should only validate on purchased dates
   AND ticket should clearly state: "Valid for Saturday, March 16 only"

8. GIVEN check-in staff scan a ticket
   WHEN they scan on a specific day
   THEN system should validate if ticket is valid for that day
   AND show "Full Pass - Valid All Days" or "Day Pass - Valid Today Only"
   AND prevent entry on wrong days for day passes

9. GIVEN I want to encourage full pass sales
   WHEN I configure pricing
   THEN I can set full pass price < sum of day passes
   AND display savings percentage
   AND show "Best Value!" badge on full pass

---

## Tasks / Subtasks

- [ ] Update TicketType model for day-specific tickets (AC: 1, 2, 3)
  - [ ] Add `passType` enum (FULL_PASS, DAY_PASS, SINGLE_EVENT)
  - [ ] Add `validDates` JSON field for day passes
  - [ ] Add `isFullPass` boolean field
  - [ ] Migration for ticket type changes

- [ ] Create day pass configuration UI (AC: 1, 2, 3)
  - [ ] DayPassConfiguration component
  - [ ] Day selector with calendar view
  - [ ] Per-day pricing inputs
  - [ ] Per-day inventory controls
  - [ ] Full pass configuration section

- [ ] Build ticket selection UI for customers (AC: 4, 5)
  - [ ] MultiDayTicketSelector component
  - [ ] Toggle between "Full Pass" and "Day Passes"
  - [ ] Day pass calendar with pricing
  - [ ] Savings calculator
  - [ ] Price comparison display

- [ ] Implement day pass pricing logic (AC: 2, 3, 5, 9)
  - [ ] Calculate sum of selected day passes
  - [ ] Compare with full pass price
  - [ ] Calculate savings amount and percentage
  - [ ] Apply "Best Value" badges

- [ ] Update checkout flow for day passes (AC: 6, 7)
  - [ ] Create tickets with valid date ranges
  - [ ] Store pass type and valid dates in ticket
  - [ ] Generate appropriate QR codes
  - [ ] Include pass details in confirmation

- [ ] Build day-specific validation (AC: 7, 8)
  - [ ] Validate ticket against current date at check-in
  - [ ] Check if day pass is valid for today
  - [ ] Allow full pass on any event day
  - [ ] Return validation message with pass type

- [ ] Update ticket display (AC: 6, 7)
  - [ ] Show pass type on ticket
  - [ ] Display valid dates clearly
  - [ ] Add "All Days Access" or "Day-Specific" badge
  - [ ] Include daily schedule for full pass

- [ ] Implement check-in validation (AC: 8)
  - [ ] Update check-in API to validate date
  - [ ] Check ticket.validDates against current date
  - [ ] Return clear error for wrong-day entry
  - [ ] Display validation status on check-in UI

- [ ] Create savings messaging system (AC: 5, 9)
  - [ ] Calculate potential savings
  - [ ] Generate dynamic messaging
  - [ ] Show "Upgrade to Full Pass" prompts
  - [ ] Display "Best Value!" badges

- [ ] Update email templates (AC: 6, 7)
  - [ ] Full pass confirmation with all dates
  - [ ] Day pass confirmation with specific date
  - [ ] Include validity restrictions
  - [ ] Add daily schedule details

- [ ] Add analytics for pass types (AC: 9)
  - [ ] Track full pass vs day pass sales
  - [ ] Calculate effective discount rates
  - [ ] Show conversion from day to full pass
  - [ ] Enable organizer pricing optimization

---

## Dev Notes

### Architecture References

**Database Schema** (`prisma/schema.prisma`):
```prisma
model TicketType {
  id              String   @id @default(cuid())
  eventId         String
  event           Event    @relation(fields: [eventId], references: [id])
  name            String   @db.VarChar(100)
  description     String?  @db.Text
  price           Decimal  @db.Decimal(10, 2)

  // Pass type fields
  passType        PassType @default(SINGLE_EVENT)
  isFullPass      Boolean  @default(false)
  validDates      Json?    // Array of dates for day passes

  // ... other existing fields

  @@index([eventId, passType])
}

enum PassType {
  SINGLE_EVENT    // Regular ticket for single-day event
  FULL_PASS       // Full festival pass for multi-day event
  DAY_PASS        // Specific day pass for multi-day event
}

model Ticket {
  id              String   @id @default(cuid())
  // ... existing fields
  passType        PassType @default(SINGLE_EVENT)
  validDates      Json?    // Dates this ticket is valid for
  isFullPass      Boolean  @default(false)

  @@index([passType])
}
```

**Valid Dates JSON Format**:
```json
{
  "validDates": [
    "2025-03-15",
    "2025-03-16",
    "2025-03-17"
  ]
}
```

**Pricing Logic**:
```typescript
function calculatePassPricing(event: Event, dayPrices: number[]) {
  const sumOfDayPasses = dayPrices.reduce((sum, price) => sum + price, 0);
  const fullPassPrice = event.fullPassPrice || sumOfDayPasses * 0.85; // 15% discount
  const savings = sumOfDayPasses - fullPassPrice;
  const savingsPercentage = (savings / sumOfDayPasses) * 100;

  return {
    fullPassPrice,
    sumOfDayPasses,
    savings,
    savingsPercentage,
    isBestValue: savings > 0
  };
}
```

**Check-in Validation Logic**:
```typescript
function validateTicketForDate(ticket: Ticket, checkInDate: Date): ValidationResult {
  if (ticket.isFullPass) {
    return {
      valid: true,
      message: "Full Pass - Valid All Days",
      passType: "FULL_PASS"
    };
  }

  if (ticket.passType === "DAY_PASS") {
    const validDates = ticket.validDates as string[];
    const checkInDateStr = format(checkInDate, 'yyyy-MM-dd');

    if (validDates.includes(checkInDateStr)) {
      return {
        valid: true,
        message: "Day Pass - Valid Today",
        passType: "DAY_PASS"
      };
    }

    return {
      valid: false,
      message: `This pass is valid for ${validDates.join(', ')} only`,
      passType: "DAY_PASS"
    };
  }

  // Single event ticket
  return { valid: true, message: "Valid Ticket", passType: "SINGLE_EVENT" };
}
```

**Source Tree**:
```
src/
├── app/
│   ├── events/
│   │   └── [eventId]/
│   │       └── page.tsx  // Updated ticket selector
│   ├── dashboard/
│   │   └── events/
│   │       └── [eventId]/
│   │           └── tickets/page.tsx  // Day pass config
│   └── api/
│       └── tickets/
│           └── validate-date/route.ts
├── components/
│   └── tickets/
│       ├── MultiDayTicketSelector.tsx
│       ├── DayPassConfiguration.tsx
│       ├── PassTypeDisplay.tsx
│       └── SavingsCalculator.tsx
└── lib/
    └── services/
        ├── day-pass-pricing.service.ts
        └── ticket-date-validation.service.ts
```

**Customer UI - Ticket Selector**:
```
┌─────────────────────────────────────────┐
│ How would you like to attend?          │
├─────────────────────────────────────────┤
│ ⭐ BEST VALUE                           │
│ 3-Day Festival Pass     $99.00          │
│ All Days Access • Save $26!             │
│ [ Select Full Pass ]                    │
├─────────────────────────────────────────┤
│ Individual Day Passes                   │
│ □ Friday, March 15      $45.00          │
│ □ Saturday, March 16    $50.00          │
│ ☑ Sunday, March 17      $30.00          │
│                                         │
│ Selected: 1 day = $30.00                │
│ 💡 Add 2 more days for just $69         │
│    and save $26!                        │
└─────────────────────────────────────────┘
```

### Testing

**Test Standards**:
- Test file: `__tests__/tickets/day-pass.test.ts`
- E2E test: `e2e/tickets/multi-day-purchase.spec.ts`

**Testing Requirements**:
- Unit test day pass pricing calculations
- Unit test savings calculation
- Unit test date validation logic
- Unit test full pass vs day pass comparison
- Integration test day pass purchase flow
- Integration test check-in validation by date
- E2E test full pass purchase
- E2E test day pass purchase
- E2E test wrong-day check-in rejection
- Test date boundary conditions
- Test timezone handling

---

## Change Log

| Date | Version | Description | Author |
|------|---------|-------------|---------|
| 2025-09-30 | 1.0 | Sharded from EV-018 (Multi-Day Events) | SM Agent |

---

## Dev Agent Record

### Agent Model Used
*To be populated by dev agent*

### Debug Log References
*To be populated by dev agent*

### Completion Notes List
*To be populated by dev agent*

### File List
*To be populated by dev agent*

---

## QA Results
*To be populated by QA agent*