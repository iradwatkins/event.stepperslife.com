# Story: EV-018a - Multi-Day Date Handling & Schema

**Epic**: EPIC-002 - Event Management Core
**Parent Story**: EV-018 - Multi-Day Events (5 pts)
**Story Points**: 2
**Priority**: P2 (Important)
**Status**: Draft
**Dependencies**:
- EV-001 (Basic event creation)
**Downstream**: EV-018b (Package vs day pass pricing)

---

## Story

**As an** event organizer
**I want to** create events that span multiple days
**So that** I can manage festivals, conferences, and multi-day workshops

---

## Acceptance Criteria

1. GIVEN I am creating a new event
   WHEN I toggle "Multi-day event" option
   THEN single date field should change to date range picker
   AND I should see "Start Date" and "End Date" fields
   AND end date must be after start date

2. GIVEN I select a date range for an event
   WHEN I choose start date and end date
   THEN system should validate end date is after start date
   AND calculate total event duration in days
   AND display duration (e.g., "3-day event")
   AND both dates should be stored in database

3. GIVEN I create a multi-day event
   WHEN event is saved
   THEN database should store startDate and endDate
   AND event listing should show date range format
   AND search/filter should find event by any date in range

4. GIVEN I view a multi-day event in listings
   WHEN event card displays
   THEN I should see date range format: "March 15-17, 2025"
   AND event card should indicate "3-Day Festival"
   AND hover should show detailed schedule

5. GIVEN I edit a multi-day event
   WHEN I change the date range
   THEN system should validate new dates
   AND warn if date change affects existing bookings
   AND update all related data (tickets, sessions, etc.)

6. GIVEN I integrate with calendar applications
   WHEN customer adds event to calendar
   THEN calendar entry should span full date range
   AND show as multi-day event in calendar view
   AND include daily schedule if available

---

## Tasks / Subtasks

- [ ] Update Event database schema (AC: 1, 2, 3)
  - [ ] Rename `date` field to `startDate`
  - [ ] Add `endDate` field (nullable for backward compatibility)
  - [ ] Add `isMultiDay` boolean field
  - [ ] Add `durationDays` computed field
  - [ ] Create migration for existing events

- [ ] Update event creation form (AC: 1, 2)
  - [ ] Add "Multi-day event" toggle
  - [ ] Implement date range picker component
  - [ ] Show/hide single date vs date range fields
  - [ ] Add date range validation logic

- [ ] Implement date range validation (AC: 2, 5)
  - [ ] Validate endDate > startDate
  - [ ] Calculate duration in days
  - [ ] Prevent past date ranges
  - [ ] Validate reasonable duration (max 365 days)

- [ ] Update event listing display (AC: 4)
  - [ ] Format date range display (e.g., "Mar 15-17")
  - [ ] Show duration badge ("3-Day Event")
  - [ ] Add hover tooltip with full schedule
  - [ ] Handle single-day vs multi-day formatting

- [ ] Update event detail page display (AC: 4)
  - [ ] Show date range prominently
  - [ ] Display start and end dates separately
  - [ ] Show duration and event type
  - [ ] Include daily breakdown section

- [ ] Implement search/filter for date ranges (AC: 3)
  - [ ] Update search to find events by any date in range
  - [ ] Filter events "happening this weekend"
  - [ ] Filter events "happening in March"
  - [ ] Handle date range overlaps

- [ ] Add calendar integration (AC: 6)
  - [ ] Generate .ics files with date ranges
  - [ ] Set calendar entry as multi-day
  - [ ] Include DTSTART and DTEND
  - [ ] Add daily schedule to calendar notes

- [ ] Handle event date updates (AC: 5)
  - [ ] Check for existing bookings on date change
  - [ ] Warn organizer if bookings exist
  - [ ] Update all dependent records
  - [ ] Send notifications to ticket holders if dates change

- [ ] Update Event model and types (AC: 2, 3)
  - [ ] Update TypeScript types for Event
  - [ ] Add date range utility functions
  - [ ] Add duration calculation helpers
  - [ ] Update validation schemas

- [ ] Create data migration for existing events (AC: 3)
  - [ ] Migrate single date events to startDate
  - [ ] Set endDate = startDate for single-day events
  - [ ] Set isMultiDay = false for existing events
  - [ ] Verify data integrity

---

## Dev Notes

### Architecture References

**Database Schema** (`prisma/schema.prisma`):
```prisma
model Event {
  id              String   @id @default(cuid())
  // ... other existing fields

  // Date fields
  startDate       DateTime // Renamed from 'date'
  endDate         DateTime // New field
  isMultiDay      Boolean  @default(false)

  // Time fields
  startTime       String?  @db.VarChar(10) // e.g., "09:00 AM"
  endTime         String?  @db.VarChar(10) // e.g., "05:00 PM"

  // ... other fields

  @@index([startDate, endDate])
  @@index([isMultiDay])
}
```

**Migration Strategy**:
```sql
-- Rename date to startDate
ALTER TABLE Event RENAME COLUMN date TO startDate;

-- Add endDate (default to same as startDate for existing events)
ALTER TABLE Event ADD COLUMN endDate TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP;
UPDATE Event SET endDate = startDate WHERE endDate = CURRENT_TIMESTAMP;

-- Add isMultiDay (default false)
ALTER TABLE Event ADD COLUMN isMultiDay BOOLEAN NOT NULL DEFAULT false;
```

**Date Range Utility Functions**:
```typescript
export function calculateDuration(startDate: Date, endDate: Date): number {
  const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays + 1; // Include both start and end days
}

export function formatDateRange(startDate: Date, endDate: Date): string {
  const start = format(startDate, 'MMM d');
  const end = format(endDate, 'd, yyyy');

  if (isSameDay(startDate, endDate)) {
    return format(startDate, 'MMM d, yyyy');
  }

  if (isSameMonth(startDate, endDate)) {
    return `${start}-${end}`;
  }

  return `${start} - ${format(endDate, 'MMM d, yyyy')}`;
}

export function isEventHappeningOn(event: Event, date: Date): boolean {
  return isWithinInterval(date, {
    start: event.startDate,
    end: event.endDate
  });
}
```

**API Updates**:
- GET /api/events - Returns events with startDate/endDate
- GET /api/events/search - Filters by date range overlaps
- POST /api/events - Accepts startDate and endDate
- PUT /api/events/[eventId] - Validates date range changes

**Source Tree**:
```
src/
├── app/
│   ├── dashboard/
│   │   └── events/
│   │       └── create/page.tsx  // Updated form
│   └── api/
│       └── events/
│           └── route.ts  // Updated API
├── components/
│   └── events/
│       ├── DateRangePicker.tsx
│       ├── EventCard.tsx  // Updated display
│       └── EventDateDisplay.tsx
├── lib/
│   └── utils/
│       └── date-range.utils.ts
└── prisma/
    └── migrations/
        └── [timestamp]_add_multi_day_support.sql
```

**Display Formats**:
- Event card: "March 15-17, 2025" + "3-Day Festival" badge
- Event detail:
  - "Start: Friday, March 15, 2025 at 9:00 AM"
  - "End: Sunday, March 17, 2025 at 6:00 PM"
  - "Duration: 3 days"
- Calendar: Multi-day event spanning full range

### Testing

**Test Standards**:
- Test file: `__tests__/events/multi-day.test.ts`
- Integration test: `__tests__/events/date-range.test.ts`

**Testing Requirements**:
- Unit test date range validation
- Unit test duration calculation
- Unit test date formatting
- Test date range search/filter
- Test single-day to multi-day conversion
- Integration test event creation with date range
- Integration test date range updates
- E2E test multi-day event creation
- Test migration script
- Test calendar integration

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