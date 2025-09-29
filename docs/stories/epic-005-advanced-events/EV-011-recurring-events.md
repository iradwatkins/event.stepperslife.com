# Story: EV-011 - Recurring Events Support

**Epic**: EPIC-005 - Advanced Event Features
**Story Points**: 5
**Priority**: P1 (High)
**Status**: Draft
**Dependencies**: EV-001 (Basic Event Creation), Notification system

---

## Story

**As an** event organizer
**I want to** create recurring events with flexible schedules
**So that** I can efficiently manage series like weekly classes or monthly meetups

---

## Acceptance Criteria

1. GIVEN I am creating a new event
   WHEN I select "Recurring Event" option
   THEN I should see recurring pattern options:
   - Daily (every N days)
   - Weekly (specific days of week)
   - Monthly (same date or day-of-month)
   - Custom pattern
   AND end condition options:
   - End after N occurrences
   - End by specific date
   - No end date

2. GIVEN I set up a weekly event every Tuesday and Thursday
   WHEN I configure the recurrence
   THEN system should generate individual event instances
   AND each instance should have:
   - Same base event details
   - Correct calculated date/time
   - Independent ticket inventory
   - Individual registration/attendance tracking
   AND I should see preview of next 5 occurrences

3. GIVEN I have a recurring event series
   WHEN I need to modify the series
   THEN I should have options to:
   - Edit single occurrence only
   - Edit this and future occurrences
   - Edit entire series
   AND changes should apply according to selection
   AND existing registrations should be preserved appropriately

4. GIVEN I want to cancel one occurrence in series
   WHEN I select "Cancel This Event" for single occurrence
   THEN only that occurrence should be cancelled
   AND attendees for that specific date should be notified
   AND offered refunds or transfers to other occurrences
   AND series should continue for other dates

5. GIVEN customers are viewing recurring events
   WHEN they see the event listing
   THEN they should clearly see:
   - This is a recurring series
   - Next upcoming occurrence date/time
   - Option to "View All Dates"
   - Ability to purchase for multiple occurrences
   AND series overview page showing all future dates

---

## Tasks / Subtasks

- [ ] Design recurring event data model (AC: 1, 2)
  - [ ] Create RecurringSeries model
  - [ ] Define recurrence pattern schema
  - [ ] Link events to series

- [ ] Create recurrence pattern calculation logic (AC: 1, 2)
  - [ ] Implement daily pattern logic
  - [ ] Implement weekly pattern logic
  - [ ] Implement monthly pattern logic
  - [ ] Calculate occurrence dates

- [ ] Build recurring event creation UI (AC: 1)
  - [ ] Create recurrence configuration form
  - [ ] Add pattern selection interface
  - [ ] Add end condition options

- [ ] Implement series modification workflows (AC: 3)
  - [ ] Create edit scope selector
  - [ ] Handle single occurrence edits
  - [ ] Handle series-wide edits
  - [ ] Handle future occurrences edits

- [ ] Create individual occurrence management (AC: 2, 4)
  - [ ] Generate occurrence instances
  - [ ] Track occurrence status
  - [ ] Manage per-occurrence data

- [ ] Add bulk operations for series management (AC: 3)
  - [ ] Bulk update series events
  - [ ] Bulk cancel series events
  - [ ] Bulk price changes

- [ ] Implement attendance tracking per occurrence (AC: 2)
  - [ ] Track attendance by occurrence
  - [ ] Generate per-occurrence reports
  - [ ] Calculate series statistics

- [ ] Create series cancellation and modification logic (AC: 4)
  - [ ] Cancel single occurrence
  - [ ] Cancel entire series
  - [ ] Handle refund processing

- [ ] Design customer-facing series display (AC: 5)
  - [ ] Create series overview page
  - [ ] Display all future dates
  - [ ] Show series badge on listings

- [ ] Add multi-occurrence purchase flow (AC: 5)
  - [ ] Select multiple dates
  - [ ] Bundle pricing options
  - [ ] Generate tickets for all dates

- [ ] Implement series-aware notifications (AC: 4)
  - [ ] Notify of occurrence cancellations
  - [ ] Send series updates
  - [ ] Reminder notifications

- [ ] Create recurring event analytics (AC: 2, 3)
  - [ ] Track series performance
  - [ ] Attendance trends
  - [ ] Revenue by occurrence

---

## Dev Notes

### Architecture References

**Recurring Events** (`docs/architecture/business-logic.md`):
- Recurring events use parent-child relationship
- Parent series defines pattern and rules
- Child occurrences are individual event instances
- Each occurrence has independent inventory
- Series-level modifications cascade appropriately

**Recurrence Patterns** (`docs/architecture/system-overview.md`):
- Daily: Every N days
- Weekly: Specific days of week (M, T, W, etc.)
- Monthly: Same date each month OR same day of month (first Monday, etc.)
- Custom: Complex patterns via iCalendar RRULE format

**Database Schema** (`prisma/schema.prisma`):
```prisma
model RecurringSeries {
  id              String   @id @default(cuid())
  name            String
  pattern         Json     // Stores recurrence pattern
  patternType     RecurrenceType
  startDate       DateTime
  endDate         DateTime?
  maxOccurrences  Int?
  occurrences     Event[]
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

enum RecurrenceType {
  DAILY
  WEEKLY
  MONTHLY
  CUSTOM
}

model Event {
  // ... existing fields
  seriesId        String?
  series          RecurringSeries? @relation(fields: [seriesId], references: [id])
  occurrenceDate  DateTime?
  isCancelled     Boolean @default(false)
}
```

**Source Tree** (`docs/architecture/source-tree.md`):
```
src/
├── app/
│   ├── api/
│   │   └── events/
│   │       └── recurring/
│   │           ├── route.ts
│   │           └── [seriesId]/
│   │               ├── route.ts
│   │               └── occurrences/route.ts
│   └── organizer/
│       └── events/
│           └── recurring/
│               └── create/page.tsx
├── components/
│   └── events/
│       ├── RecurrenceConfig.tsx
│       ├── SeriesOverview.tsx
│       └── OccurrenceList.tsx
└── lib/
    └── recurrence/
        ├── calculator.ts
        ├── patterns.ts
        └── series-manager.ts
```

### Testing

**Testing Requirements for this story**:
- Unit tests for recurrence calculation logic
- Unit tests for each pattern type
- Unit tests for series modification logic
- Integration test for series creation API
- Integration test for occurrence generation
- E2E test for creating recurring event
- E2E test for editing series
- E2E test for cancelling occurrence
- E2E test for multi-occurrence purchase
- Test edge cases (leap years, DST, etc.)
- Test series-wide operations
- Performance test for large series (100+ occurrences)

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