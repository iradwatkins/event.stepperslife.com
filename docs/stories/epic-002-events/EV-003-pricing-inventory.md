# Story: EV-003 - Set Pricing and Inventory Management

**Epic**: EPIC-002 - Event Management Core
**Story Points**: 2
**Priority**: P0 (Critical)
**Status**: Draft
**Dependencies**: EV-002 (Ticket Types), Payment system

---

## Story

**As an** event organizer
**I want to** manage ticket pricing and inventory efficiently
**So that** I can optimize revenue and prevent overselling

---

## Acceptance Criteria

1. GIVEN I am setting up ticket pricing
   WHEN I enter a ticket price
   THEN I should see:
   - Base ticket price
   - Platform fee ($0.29 or $0.75 based on plan)
   - Total customer price
   - My net revenue (price - platform fee)
   - Revenue projection based on full inventory sale

2. GIVEN I set inventory for a ticket type
   WHEN I specify quantity available
   THEN system should track:
   - Total inventory
   - Tickets sold
   - Tickets reserved (in pending transactions)
   - Available for sale
   AND prevent overselling automatically

3. GIVEN someone is purchasing tickets
   WHEN they add tickets to cart
   THEN those tickets should be reserved for 15 minutes
   AND reduce available inventory temporarily
   AND release if payment not completed in time

4. GIVEN I need to adjust inventory after creation
   WHEN I increase available quantity
   THEN new tickets should be available immediately
   AND customers should be notified if on waitlist

5. GIVEN I decrease available quantity below current reservations
   WHEN I try to save changes
   THEN I should see warning about active reservations
   AND system should prevent creating negative inventory

6. GIVEN tickets are sold out
   WHEN inventory reaches zero
   THEN ticket type should automatically show "Sold Out"
   AND be unavailable for new purchases
   AND offer waitlist signup option

---

## Tasks / Subtasks

- [ ] Create inventory tracking system (AC: 2, 5)
  - [ ] Track total, sold, reserved quantities
  - [ ] Calculate available inventory
  - [ ] Prevent negative inventory

- [ ] Implement reservation mechanism with timeout (AC: 3)
  - [ ] Reserve tickets on cart add
  - [ ] Set 15-minute expiration
  - [ ] Auto-release expired reservations

- [ ] Add real-time availability updates (AC: 2, 3)
  - [ ] Update inventory on sale
  - [ ] Update inventory on reservation
  - [ ] Broadcast changes to clients

- [ ] Create pricing calculator component (AC: 1)
  - [ ] Calculate platform fees
  - [ ] Calculate net revenue
  - [ ] Show revenue projections

- [ ] Implement inventory adjustment safeguards (AC: 4, 5)
  - [ ] Validate inventory changes
  - [ ] Check active reservations
  - [ ] Warn about impacts

- [ ] Add sold-out status automation (AC: 6)
  - [ ] Auto-detect sold out state
  - [ ] Update ticket type status
  - [ ] Show sold out badge

- [ ] Create inventory monitoring dashboard (AC: 2)
  - [ ] Display inventory metrics
  - [ ] Show sales velocity
  - [ ] Alert on low inventory

- [ ] Implement waitlist notification triggers (AC: 4, 6)
  - [ ] Notify when inventory added
  - [ ] Send waitlist emails
  - [ ] Track notification status

- [ ] Add inventory history logging (AC: 4, 5)
  - [ ] Log inventory changes
  - [ ] Track who made changes
  - [ ] Store timestamps

- [ ] Create oversell prevention logic (AC: 2, 3, 5)
  - [ ] Use database transactions
  - [ ] Implement pessimistic locking
  - [ ] Handle race conditions

- [ ] Design pricing breakdown display (AC: 1)
  - [ ] Show fee breakdown
  - [ ] Display net revenue
  - [ ] Format currency properly

- [ ] Add revenue projection calculations (AC: 1)
  - [ ] Calculate max revenue
  - [ ] Show current revenue
  - [ ] Display percentage sold

---

## Dev Notes

### Architecture References

**Inventory Management** (`docs/architecture/system-overview.md`):
- Real-time inventory tracking via database
- Pessimistic locking for high-demand events
- 15-minute reservation timeout
- Automatic release of expired reservations
- Prevention of overselling through transactions

**Platform Fees** (`docs/architecture/business-logic.md`):
- Free Plan: $0.75 per ticket
- Pro Plan: $0.29 per ticket
- Enterprise: Custom pricing
- Fees displayed separately to customers
- Organizers see net revenue

**Reservation System** (`docs/architecture/system-overview.md`):
- Tickets reserved on cart add
- 15-minute expiration timer
- Background job releases expired reservations
- WebSocket updates for real-time availability

**Database Schema** (`prisma/schema.prisma`):
```prisma
model TicketReservation {
  id            String   @id @default(cuid())
  ticketTypeId  String
  ticketType    TicketType @relation(fields: [ticketTypeId], references: [id])
  quantity      Int
  sessionId     String
  expiresAt     DateTime
  createdAt     DateTime @default(now())

  @@index([expiresAt])
  @@index([sessionId])
}

model InventoryLog {
  id            String   @id @default(cuid())
  ticketTypeId  String
  ticketType    TicketType @relation(fields: [ticketTypeId], references: [id])
  change        Int
  reason        String
  userId        String?
  createdAt     DateTime @default(now())
}
```

**Source Tree** (`docs/architecture/source-tree.md`):
```
src/
├── app/
│   ├── api/
│   │   └── tickets/
│   │       ├── reserve/route.ts
│   │       └── release/route.ts
│   └── organizer/
│       └── events/
│           └── [id]/
│               └── inventory/page.tsx
├── components/
│   └── inventory/
│       ├── InventoryTracker.tsx
│       ├── PricingCalculator.tsx
│       └── RevenueProjection.tsx
├── lib/
│   └── inventory/
│       ├── reservation.ts
│       └── oversell-prevention.ts
└── jobs/
    └── release-reservations.ts
```

### Testing

**Testing Requirements for this story**:
- Unit tests for inventory calculations
- Unit tests for pricing calculator
- Unit tests for reservation timeout
- Integration test for reservation API
- Integration test for inventory updates
- E2E test for complete purchase flow with reservation
- E2E test for inventory adjustment
- Load test for concurrent purchases (race conditions)
- Test overselling prevention
- Test reservation expiration
- Test sold out detection

---

## Change Log

| Date | Version | Description | Author |
|------|---------|-------------|---------|
| 2024-01-15 | 1.0 | Initial story creation | SM Agent |

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