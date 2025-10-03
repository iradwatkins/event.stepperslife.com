# Story: EV-012b - Session-Based Ticketing & Pricing

**Epic**: EPIC-002 - Event Management Core
**Parent Story**: EV-012 - Multi-Session Events (5 pts)
**Story Points**: 2
**Priority**: P2 (Important)
**Status**: Draft
**Dependencies**:
- EV-012a (Session data model & CRUD)
- EV-002 (Ticket types)
- PAY-001 (Checkout flow)
**Downstream**: EV-015 (Group booking discounts)

---

## Story

**As a** customer
**I want to** purchase tickets for specific sessions or full event passes
**So that** I can attend only the sessions I'm interested in or get a discounted full pass

---

## Acceptance Criteria

1. GIVEN an event has multiple sessions
   WHEN I view the event detail page
   THEN I should see all available sessions listed
   AND each session shows date/time, capacity, and price
   AND I can select "Individual Sessions" or "Full Event Pass"

2. GIVEN I choose "Individual Sessions"
   WHEN I select specific sessions
   THEN I should see per-session pricing
   AND cart should update with total for selected sessions
   AND I cannot select sessions that are sold out

3. GIVEN I choose "Full Event Pass"
   WHEN I select the pass option
   THEN I should see pass pricing (typically discounted)
   AND cart should show "All Sessions Access"
   AND pass ticket grants access to all sessions

4. GIVEN a session has limited capacity
   WHEN I add session ticket to cart
   THEN system should check real-time availability
   AND session capacity should decrease by ticket quantity
   AND I should see "Only 5 spots left!" messaging

5. GIVEN I complete checkout with session tickets
   WHEN payment is successful
   THEN tickets should be linked to specific sessions
   AND each ticket should show session details (date, time, venue)
   AND QR code should include session validation data

6. GIVEN organizer sets session-specific pricing
   WHEN I view sessions
   THEN different sessions can have different prices
   AND pricing should reflect session value (VIP, Standard, etc.)
   AND full pass price should be calculated correctly

---

## Tasks / Subtasks

- [ ] Update ticket model to support sessions (AC: 1, 3, 5)
  - [ ] Add sessionId field to Ticket table (nullable)
  - [ ] Add isFullPass boolean field
  - [ ] Create relationship between tickets and sessions
  - [ ] Migration for existing tickets

- [ ] Create session selection UI (AC: 1, 2, 3)
  - [ ] SessionSelector component with list view
  - [ ] Toggle between "Sessions" and "Full Pass"
  - [ ] Session card with date/time/capacity/price
  - [ ] Multi-select for individual sessions

- [ ] Implement session-specific pricing (AC: 2, 3, 6)
  - [ ] Add price field to EventSession model
  - [ ] Calculate full pass pricing (sum or custom)
  - [ ] Display per-session vs pass pricing comparison
  - [ ] Apply discounts for full pass

- [ ] Add real-time capacity checking (AC: 4)
  - [ ] Check session availability before add-to-cart
  - [ ] Lock capacity during checkout process
  - [ ] Release capacity on cart expiration
  - [ ] Show availability messaging

- [ ] Update checkout flow for sessions (AC: 5)
  - [ ] Validate session selections at checkout
  - [ ] Create tickets with session associations
  - [ ] Generate QR codes with session data
  - [ ] Send session details in confirmation email

- [ ] Create full pass ticket logic (AC: 3, 5)
  - [ ] Full pass grants access to all sessions
  - [ ] Check-in validation for full pass tickets
  - [ ] Display all sessions on full pass ticket
  - [ ] Handle session changes for pass holders

- [ ] Build session capacity enforcement (AC: 4)
  - [ ] Prevent over-booking sessions
  - [ ] Handle concurrent purchases
  - [ ] Transaction-level capacity locking
  - [ ] Waitlist for sold-out sessions (future)

- [ ] Add session details to ticket display (AC: 5)
  - [ ] Show session info on ticket view
  - [ ] Include session venue and time
  - [ ] Display session-specific instructions
  - [ ] Add to calendar with session details

---

## Dev Notes

### Architecture References

**Database Schema Updates** (`prisma/schema.prisma`):
```prisma
model Ticket {
  id              String   @id @default(cuid())
  orderId         String
  order           Order    @relation(fields: [orderId], references: [id])
  eventId         String
  event           Event    @relation(fields: [eventId], references: [id])
  sessionId       String?  // Nullable - null means full pass or no session
  session         EventSession? @relation(fields: [sessionId], references: [id])
  isFullPass      Boolean  @default(false)
  ticketTypeId    String
  ticketType      TicketType @relation(fields: [ticketTypeId], references: [id])
  // ... other fields

  @@index([eventId, sessionId])
  @@index([sessionId, status])
}

model EventSession {
  id              String   @id @default(cuid())
  // ... other fields from EV-012a
  price           Decimal  @db.Decimal(10, 2)
  fullPassPrice   Decimal? @db.Decimal(10, 2) // Optional custom full pass price
  tickets         Ticket[]
}
```

**API Structure**:
- GET /api/events/[eventId]/sessions/availability - Check real-time availability
- POST /api/events/[eventId]/tickets/session-validate - Validate session selections
- POST /api/checkout/session-capacity-lock - Lock capacity during checkout

**Source Tree**:
```
src/
├── app/
│   ├── events/
│   │   └── [eventId]/
│   │       └── page.tsx  // Updated with session selector
│   └── api/
│       └── checkout/
│           └── session-capacity-lock/
│               └── route.ts
├── components/
│   └── events/
│       ├── SessionSelector.tsx
│       ├── SessionCard.tsx
│       └── FullPassOption.tsx
└── lib/
    └── services/
        └── session-capacity.service.ts
```

**Pricing Logic**:
- Individual session pricing: Use EventSession.price
- Full pass pricing: Sum all session prices * 0.85 (15% discount) OR use custom fullPassPrice
- Display savings: "Buy full pass and save $25!"
- Handle dynamic pricing if tiered rules enabled (EV-013)

**Capacity Management**:
- Real-time availability checks before adding to cart
- 10-minute reservation lock during checkout
- Release locks on payment failure or timeout
- Use Redis for distributed locking in production

### Testing

**Test Standards**:
- Test file: `__tests__/events/session-ticketing.test.ts`
- E2E test: `e2e/events/session-purchase.spec.ts`

**Testing Requirements**:
- Unit test session pricing calculations
- Unit test full pass pricing logic
- Integration test capacity locking
- Test concurrent purchase scenarios
- Test session validation in checkout
- E2E test individual session purchase
- E2E test full pass purchase
- Test capacity enforcement edge cases

---

## Change Log

| Date | Version | Description | Author |
|------|---------|-------------|---------|
| 2025-09-30 | 1.0 | Sharded from EV-012 (Multi-Session Events) | SM Agent |

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