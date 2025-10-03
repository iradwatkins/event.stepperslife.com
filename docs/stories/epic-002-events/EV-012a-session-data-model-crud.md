# Story: EV-012a - Session Data Model & CRUD Operations

**Epic**: EPIC-002 - Event Management Core
**Parent Story**: EV-012 - Multi-Session Events (5 pts)
**Story Points**: 3
**Priority**: P2 (Important)
**Status**: Draft
**Dependencies**:
- EV-001 (Basic event creation)
- EV-003 (Pricing and inventory)
**Downstream**: EV-012b (Session-based ticketing)

---

## Story

**As an** event organizer
**I want to** create and manage multiple sessions within a single event
**So that** I can offer workshops, classes, or performances at different times

---

## Acceptance Criteria

1. GIVEN I am creating/editing an event
   WHEN I toggle "Multi-session event" option
   THEN I should see a session management interface
   AND the single date/time fields should be disabled

2. GIVEN I am adding a session
   WHEN I click "Add Session"
   THEN I should see a form with fields:
   - Session name (required, 3-100 characters)
   - Session description (optional, up to 500 characters)
   - Session date and time (required)
   - Session duration (required, in hours/minutes)
   - Session venue/room (optional)
   - Session capacity (required, min 1)
   AND all sessions must fall within event start/end dates

3. GIVEN I have multiple sessions
   WHEN I view the session list
   THEN sessions should be sorted by date/time
   AND show session name, date/time, capacity, and status
   AND I can edit, duplicate, or delete each session

4. GIVEN I am editing a session
   WHEN I update session details
   THEN changes should validate against existing bookings
   AND I should see warning if capacity reduced below sold tickets
   AND updated session should sync to database

5. GIVEN I try to delete a session with sold tickets
   WHEN I click "Delete Session"
   THEN I should see "Cannot delete - 15 tickets sold"
   AND session should not be deleted
   AND I should be offered option to cancel session instead

6. GIVEN I duplicate a session
   WHEN I click "Duplicate"
   THEN a new session should be created with same details
   AND session name should append " (Copy)"
   AND capacity should match original
   AND I can immediately edit date/time

---

## Tasks / Subtasks

- [ ] Create event_sessions database schema (AC: 1, 2)
  - [ ] Add event_sessions table to Prisma schema
  - [ ] Fields: id, eventId, name, description, startDateTime, endDateTime, venue, capacity, sortOrder, status
  - [ ] Add foreign key relationship to events table
  - [ ] Create migration file

- [ ] Build session CRUD API endpoints (AC: 2, 3, 4, 5)
  - [ ] POST /api/events/[eventId]/sessions - Create session
  - [ ] GET /api/events/[eventId]/sessions - List sessions
  - [ ] PUT /api/events/[eventId]/sessions/[sessionId] - Update session
  - [ ] DELETE /api/events/[eventId]/sessions/[sessionId] - Delete session
  - [ ] POST /api/events/[eventId]/sessions/[sessionId]/duplicate - Duplicate session

- [ ] Implement session validation logic (AC: 2, 4, 5)
  - [ ] Validate session dates within event date range
  - [ ] Check capacity reduction against sold tickets
  - [ ] Prevent deletion of sessions with bookings
  - [ ] Validate session time overlaps

- [ ] Create session management UI component (AC: 1, 2, 3)
  - [ ] SessionManager component with list view
  - [ ] "Add Session" form modal
  - [ ] Session edit modal
  - [ ] Session list with sort by date/time

- [ ] Add session capacity tracking (AC: 4, 5)
  - [ ] Calculate tickets_sold per session
  - [ ] Show capacity warnings on edit
  - [ ] Prevent capacity below sold count
  - [ ] Display availability percentage

- [ ] Implement session duplication feature (AC: 6)
  - [ ] Clone session with " (Copy)" suffix
  - [ ] Duplicate all session attributes
  - [ ] Open edit modal after duplication
  - [ ] Update sort order

- [ ] Add multi-session toggle in event form (AC: 1)
  - [ ] Toggle switch in event creation/edit
  - [ ] Show/hide single date fields
  - [ ] Show/hide session manager
  - [ ] Handle conversion between single/multi-session

- [ ] Create session service layer (AC: 2, 3, 4, 5)
  - [ ] session.service.ts with CRUD operations
  - [ ] Session validation functions
  - [ ] Capacity enforcement logic
  - [ ] Transaction handling for session updates

---

## Dev Notes

### Architecture References

**Database Schema** (`prisma/schema.prisma`):
```prisma
model EventSession {
  id              String   @id @default(cuid())
  eventId         String
  event           Event    @relation(fields: [eventId], references: [id], onDelete: Cascade)
  name            String   @db.VarChar(100)
  description     String?  @db.VarChar(500)
  startDateTime   DateTime
  endDateTime     DateTime
  venue           String?  @db.VarChar(200)
  capacity        Int      @default(0)
  sortOrder       Int      @default(0)
  status          SessionStatus @default(ACTIVE)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  tickets         Ticket[]

  @@index([eventId, startDateTime])
  @@index([eventId, status])
}

enum SessionStatus {
  ACTIVE
  CANCELLED
  COMPLETED
}
```

**API Structure**:
- RESTful endpoints under `/api/events/[eventId]/sessions`
- Use Zod for request validation
- Return session with ticket count and availability

**Source Tree**:
```
src/
├── app/
│   └── api/
│       └── events/
│           └── [eventId]/
│               └── sessions/
│                   ├── route.ts
│                   └── [sessionId]/
│                       └── route.ts
├── components/
│   └── events/
│       ├── SessionManager.tsx
│       ├── SessionForm.tsx
│       └── SessionList.tsx
├── lib/
│   └── services/
│       └── session.service.ts
└── types/
    └── session.types.ts
```

**Session Validation Rules**:
- Session start/end must be within event date range
- Session capacity cannot be reduced below sold tickets
- Session name must be unique within event
- End time must be after start time
- Cannot delete sessions with sold tickets (must cancel)

### Testing

**Test Standards**:
- Test file: `__tests__/events/sessions.test.ts`
- E2E test: `e2e/events/multi-session.spec.ts`

**Testing Requirements**:
- Unit test session validation logic
- Unit test capacity enforcement
- Integration test for session CRUD API
- Test session deletion with/without bookings
- Test session duplication
- Test date range validation
- E2E test for complete session management flow

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