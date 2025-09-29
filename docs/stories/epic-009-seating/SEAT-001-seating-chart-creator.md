# Story: SEAT-001 - Venue Seating Chart Creator

**Epic**: EPIC-009 - Reserved Seating System
**Story Points**: 13
**Priority**: E2 (Medium)
**Status**: Draft
**Dependencies**: EV-001 (Basic Event Creation), Advanced UI component library

---

## Story

**As an** event organizer with a seated venue
**I want to** create interactive seating charts for my venue
**So that** attendees can choose their specific seats when purchasing tickets

---

## Acceptance Criteria

1. GIVEN I am creating an event for a seated venue
   WHEN I select "Reserved Seating" event type
   THEN I should see seating chart creation tools:
   - Venue template library (theater, stadium, classroom, etc.)
   - Custom chart builder with drag-and-drop tools
   - Section creation tools (Orchestra, Balcony, VIP)
   - Seat row and number configuration
   - Accessibility designation tools

2. GIVEN I start with a theater template
   WHEN I customize the layout
   THEN I should be able to:
   - Add/remove rows with automatic numbering
   - Set seats per row with letter/number schemes
   - Create aisles and spacing
   - Mark accessible seating areas
   - Set different pricing zones/sections
   - Add stage/screen orientation indicator

3. GIVEN I need to create complex seating layouts
   WHEN I use the advanced tools
   THEN I should be able to:
   - Draw custom shaped sections
   - Create multi-level venues (floor, balcony, box seats)
   - Set individual seat properties (accessibility, restricted view)
   - Group seats into pricing tiers
   - Add visual elements (stage, bar, restrooms)
   - Preview from attendee perspective

4. GIVEN I complete my seating chart
   WHEN I save and publish
   THEN the system should:
   - Validate all seats have unique identifiers
   - Ensure all seats assigned to pricing tiers
   - Generate interactive customer-facing chart
   - Create inventory tracking for each seat
   - Enable real-time availability updates
   - Store chart data for future events

5. GIVEN I want to reuse venue layouts
   WHEN I create subsequent events
   THEN I should be able to:
   - Select from my saved venue layouts
   - Copy charts from previous events
   - Modify pricing without changing layout
   - Share venue templates with team members
   - Export/import seating charts

---

## Tasks / Subtasks

- [ ] Design seating chart data model and database schema (AC: 1, 4)
  - [ ] Create Venue model
  - [ ] Create SeatingChart model
  - [ ] Create Seat model with properties

- [ ] Create drag-and-drop chart builder interface (AC: 2, 3)
  - [ ] Build canvas-based editor
  - [ ] Implement drag-and-drop for seats
  - [ ] Add section drawing tools

- [ ] Build venue template library system (AC: 1)
  - [ ] Create pre-built templates
  - [ ] Store templates in database
  - [ ] Allow template selection

- [ ] Implement seat numbering algorithms (AC: 2)
  - [ ] Auto-number rows (1, 2, 3...)
  - [ ] Auto-letter seats (A, B, C... or 1, 2, 3...)
  - [ ] Handle custom numbering schemes

- [ ] Create section and pricing zone management (AC: 2, 3)
  - [ ] Define sections (Orchestra, Balcony, etc.)
  - [ ] Assign pricing to sections
  - [ ] Color-code by price

- [ ] Add accessibility designation tools (AC: 2, 3)
  - [ ] Mark accessible seats
  - [ ] Designate companion seats
  - [ ] Add accessibility metadata

- [ ] Build chart validation and error checking (AC: 4)
  - [ ] Validate unique seat IDs
  - [ ] Check all seats have pricing
  - [ ] Verify no overlapping seats

- [ ] Implement chart preview and customer view (AC: 3, 4)
  - [ ] Generate customer-facing chart
  - [ ] Show seat availability
  - [ ] Implement zoom and pan

- [ ] Create chart saving and template system (AC: 4, 5)
  - [ ] Save charts to database
  - [ ] Create venue templates
  - [ ] Enable chart reuse

- [ ] Add visual chart elements (stage, amenities) (AC: 3)
  - [ ] Add stage/screen element
  - [ ] Add amenity markers
  - [ ] Implement custom shapes

- [ ] Implement chart export/import functionality (AC: 5)
  - [ ] Export to JSON
  - [ ] Import from JSON
  - [ ] Validate imported data

- [ ] Create mobile-responsive chart viewer (AC: 4)
  - [ ] Optimize for mobile
  - [ ] Touch-friendly interactions
  - [ ] Pinch to zoom

- [ ] Add chart collaboration features (AC: 5)
  - [ ] Share charts with team
  - [ ] Set permissions
  - [ ] Track changes

- [ ] Optimize rendering for large venues (AC: 3)
  - [ ] Implement virtualization
  - [ ] Use canvas for performance
  - [ ] Lazy load seat details

---

## Dev Notes

### Architecture References

**Seating System** (`docs/architecture/seating-architecture.md`):
- Canvas-based chart builder for performance
- SVG for customer-facing interactive charts
- Complex venues up to 5000 seats supported
- Real-time seat availability via WebSocket
- Seat reservations integrated with checkout

**Data Model** (`docs/architecture/seating-architecture.md`):
- Venue contains multiple SeatingCharts
- SeatingChart contains Sections
- Section contains Seats
- Seat has position, identifier, properties
- Pricing assigned at section or seat level

**Chart Builder Technology**:
- Fabric.js or Konva.js for canvas manipulation
- React Flow for section relationships
- D3.js for seat positioning algorithms
- Custom WebGL renderer for 5000+ seats

**Database Schema** (`prisma/schema.prisma`):
```prisma
model Venue {
  id              String   @id @default(cuid())
  name            String
  address         String?
  seatingCharts   SeatingChart[]
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

model SeatingChart {
  id              String   @id @default(cuid())
  venueId         String?
  venue           Venue?   @relation(fields: [venueId], references: [id])
  name            String
  isTemplate      Boolean  @default(false)
  chartData       Json     // Canvas data
  sections        Section[]
  totalSeats      Int      @default(0)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

model Section {
  id              String   @id @default(cuid())
  chartId         String
  chart           SeatingChart @relation(fields: [chartId], references: [id])
  name            String   // "Orchestra", "Balcony", etc.
  color           String?
  seats           Seat[]
  pricingTierId   String?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

model Seat {
  id              String   @id @default(cuid())
  sectionId       String
  section         Section  @relation(fields: [sectionId], references: [id])
  row             String
  number          String
  x               Float    // Position on chart
  y               Float
  isAccessible    Boolean  @default(false)
  isCompanion     Boolean  @default(false)
  hasRestrictedView Boolean @default(false)
  metadata        Json?
  ticketTypeId    String?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@unique([sectionId, row, number])
}
```

**Source Tree** (`docs/architecture/source-tree.md`):
```
src/
├── app/
│   ├── api/
│   │   └── seating/
│   │       ├── charts/route.ts
│   │       ├── venues/route.ts
│   │       └── templates/route.ts
│   └── organizer/
│       └── seating/
│           ├── builder/page.tsx
│           └── templates/page.tsx
├── components/
│   └── seating/
│       ├── ChartBuilder.tsx
│       ├── SeatEditor.tsx
│       ├── SectionManager.tsx
│       ├── TemplateLibrary.tsx
│       └── ChartPreview.tsx
└── lib/
    └── seating/
        ├── chart-builder.ts
        ├── seat-numbering.ts
        ├── validation.ts
        └── export-import.ts
```

### Testing

**Testing Requirements for this story**:
- Unit tests for seat numbering algorithms
- Unit tests for chart validation
- Unit tests for export/import
- Integration test for chart creation API
- Integration test for template system
- E2E test for creating simple chart
- E2E test for creating complex multi-level chart
- E2E test for using templates
- E2E test for reusing venue layouts
- Performance test with 5000 seats
- Test accessibility features
- Test chart collaboration
- Visual regression testing for charts

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