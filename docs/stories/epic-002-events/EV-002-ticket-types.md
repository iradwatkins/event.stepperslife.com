# Story: EV-002 - Define Ticket Types (GA, VIP)

**Epic**: EPIC-002 - Event Management Core
**Story Points**: 3
**Priority**: P0 (Critical)
**Status**: Draft
**Dependencies**: EV-001 (Basic Event Creation), Square Catalog API integration

---

## Story

**As an** event organizer
**I want to** create multiple ticket types with different prices
**So that** I can offer various options to my attendees

---

## Acceptance Criteria

1. GIVEN I am creating or editing an event
   WHEN I click "Add Ticket Type"
   THEN I should see ticket type creation form with fields:
   - Ticket name (e.g., "General Admission", "VIP")
   - Description (optional, 500 characters max)
   - Price in USD (minimum $0.01)
   - Quantity available (1-10,000)
   - Min/max per order (default 1/10)
   - Sale start date/time (optional)
   - Sale end date/time (optional)

2. GIVEN I create a "General Admission" ticket at $25
   AND set quantity to 100
   AND set max per order to 6
   WHEN I save the ticket type
   THEN it should appear in the ticket type list
   AND create corresponding Square catalog variation
   AND show "100 available" in the listing
   AND enforce max 6 per order during checkout

3. GIVEN I have multiple ticket types
   WHEN I view the event ticket management
   THEN I should see all ticket types with:
   - Current availability (quantity - sold)
   - Current price
   - Status (not on sale, on sale, ended, sold out)
   - Edit and delete actions
   AND be able to reorder ticket types by drag & drop

4. GIVEN tickets have been sold for a type
   WHEN I try to delete that ticket type
   THEN I should see warning dialog:
   - "X tickets already sold for this type"
   - "Deletion will affect sold tickets"
   - Option to "Stop Sales" instead of delete
   AND require confirmation for deletion

5. GIVEN I set sale start/end dates
   WHEN the current time is outside sale window
   THEN ticket type should show "Not on sale" status
   AND be unavailable for purchase
   AND display sale dates to customers

6. GIVEN I set quantity to 0
   WHEN viewing ticket type
   THEN it should show "Sold Out" status
   AND be unavailable for purchase

---

## Tasks / Subtasks

- [ ] Create ticket type database schema (AC: 1, 2)
  - [ ] Define TicketType model in Prisma
  - [ ] Add relationships to Event model
  - [ ] Run database migrations

- [ ] Design ticket type management UI (AC: 1, 3)
  - [ ] Create ticket type list view
  - [ ] Build ticket type form
  - [ ] Add edit/delete actions

- [ ] Implement drag-and-drop reordering (AC: 3)
  - [ ] Install drag-and-drop library (dnd-kit)
  - [ ] Add reorder functionality
  - [ ] Save order to database

- [ ] Add price validation and formatting (AC: 1)
  - [ ] Validate minimum price ($0.01)
  - [ ] Format currency display
  - [ ] Handle decimal precision

- [ ] Create Square catalog variation integration (AC: 2)
  - [ ] Map ticket types to Square variations
  - [ ] Create variations via Square API
  - [ ] Sync pricing and availability

- [ ] Implement sale date/time logic (AC: 5)
  - [ ] Add date/time pickers
  - [ ] Validate date ranges
  - [ ] Calculate on-sale status

- [ ] Add quantity tracking system (AC: 2, 6)
  - [ ] Track total quantity
  - [ ] Track sold quantity
  - [ ] Calculate available quantity

- [ ] Create ticket type deletion safeguards (AC: 4)
  - [ ] Check for existing sales
  - [ ] Show warning dialog
  - [ ] Offer "Stop Sales" alternative

- [ ] Design ticket type display components (AC: 3)
  - [ ] Create ticket type card
  - [ ] Add status badges
  - [ ] Show availability meter

- [ ] Implement availability calculations (AC: 2, 3, 6)
  - [ ] Calculate available = total - sold
  - [ ] Determine sold out status
  - [ ] Update in real-time

- [ ] Add per-order limits enforcement (AC: 2)
  - [ ] Store min/max per order
  - [ ] Validate during checkout
  - [ ] Show limits to customers

- [ ] Create ticket type status indicators (AC: 3, 5, 6)
  - [ ] Not on sale status
  - [ ] On sale status
  - [ ] Ended status
  - [ ] Sold out status

---

## Dev Notes

### Architecture References

**Event Management** (`docs/architecture/system-overview.md`):
- Events can have 1-20 ticket types
- Each ticket type is a Square catalog variation
- Ticket types have independent inventory tracking
- Real-time availability updates

**Square Integration** (`docs/architecture/integrations.md`):
- Ticket types map to Square Catalog Item Variations
- Pricing synchronized with Square
- Inventory managed through Square
- Variations support all ticket type features

**Database Schema** (`prisma/schema.prisma`):
```prisma
model TicketType {
  id              String   @id @default(cuid())
  eventId         String
  event           Event    @relation(fields: [eventId], references: [id])
  name            String
  description     String?
  price           Decimal  @db.Decimal(10, 2)
  quantity        Int
  quantitySold    Int      @default(0)
  minPerOrder     Int      @default(1)
  maxPerOrder     Int      @default(10)
  saleStartDate   DateTime?
  saleEndDate     DateTime?
  displayOrder    Int      @default(0)
  squareVariationId String?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}
```

**Source Tree** (`docs/architecture/source-tree.md`):
```
src/
├── app/
│   ├── api/
│   │   └── events/
│   │       └── [id]/
│   │           └── ticket-types/
│   │               ├── route.ts
│   │               └── [ticketId]/route.ts
│   └── organizer/
│       └── events/
│           └── [id]/
│               └── tickets/page.tsx
├── components/
│   └── events/
│       ├── TicketTypeList.tsx
│       ├── TicketTypeForm.tsx
│       └── TicketTypeCard.tsx
└── lib/
    └── square/
        └── catalog.ts
```

### Testing

**Testing Requirements for this story**:
- Unit tests for price validation
- Unit tests for availability calculations
- Unit tests for status determination
- Integration test for ticket type CRUD APIs
- Integration test for Square catalog sync
- E2E test for creating ticket types
- E2E test for editing ticket types
- E2E test for deleting ticket types with safeguards
- E2E test for drag-and-drop reordering
- Test sale date logic
- Test sold out handling

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