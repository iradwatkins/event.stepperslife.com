# Story: EV-001 - Create Basic Event (Single Date)

**Epic**: EPIC-002 - Event Management Core
**Story Points**: 5
**Priority**: P0 (Critical)
**Status**: Draft
**Dependencies**: US-005 (RBAC for organizer permissions)

---

## Story

**As an** event organizer
**I want to** create a single-date event with all essential details
**So that** I can start selling tickets and promote my event

---

## Acceptance Criteria

1. GIVEN I am logged in as an organizer
   WHEN I click "Create Event"
   THEN I should see a multi-step event creation wizard
   AND see progress indicator showing current step

2. GIVEN I am on step 1 (Basic Details)
   WHEN I fill in required information:
   - Event name (3-100 characters, required)
   - Event description (20-5000 characters, required)
   - Event category (dropdown: Music, Sports, Conference, etc.)
   - Event tags (optional, for discovery)
   AND I click "Next"
   THEN form should validate all inputs
   AND I should proceed to step 2

3. GIVEN I am on step 2 (Date & Venue)
   WHEN I fill in:
   - Event date (must be future date)
   - Start time and end time
   - Venue name or address
   - Venue capacity (optional)
   - Accessibility information (optional)
   AND I click "Next"
   THEN date validation should prevent past dates
   AND I should proceed to step 3

4. GIVEN I am on step 3 (Media & Final Details)
   WHEN I optionally add:
   - Event banner image (<5MB, JPG/PNG)
   - Additional event photos
   - Website URL
   - Social media links
   AND I click "Create Event"
   THEN event should be saved with "DRAFT" status
   AND Square catalog item should be created
   AND I should see "Event created successfully"
   AND be redirected to event management page

5. GIVEN I try to create event with past date
   WHEN I select yesterday's date
   THEN I should see "Event date must be in the future"
   AND form should not submit until fixed

6. GIVEN I abandon the form partway through
   WHEN I return to create event page
   THEN my progress should be auto-saved
   AND I can continue from where I left off

---

## Tasks / Subtasks

- [ ] Design multi-step wizard component (AC: 1)
  - [ ] Create wizard shell with step navigation
  - [ ] Implement progress indicator
  - [ ] Add step validation logic

- [ ] Create event creation API endpoints (AC: 2, 3, 4)
  - [ ] POST /api/events/create endpoint
  - [ ] Add input validation with Zod
  - [ ] Implement draft saving logic

- [ ] Implement form validation logic (AC: 2, 3, 5)
  - [ ] Create validation schemas for each step
  - [ ] Add real-time validation feedback
  - [ ] Prevent past date selection

- [ ] Add auto-save functionality (every 30 seconds) (AC: 6)
  - [ ] Implement auto-save timer
  - [ ] Save to localStorage as backup
  - [ ] Restore draft on page load

- [ ] Integrate with Square Catalog API (AC: 4)
  - [ ] Create Square catalog item on event creation
  - [ ] Store Square catalog item ID
  - [ ] Handle Square API errors

- [ ] Create image upload and processing (AC: 4)
  - [ ] Implement image upload component
  - [ ] Add image size validation (<5MB)
  - [ ] Optimize images with Sharp
  - [ ] Store images in designated location

- [ ] Design responsive event creation UI (AC: 1, 2, 3, 4)
  - [ ] Create Step 1: Basic Details form
  - [ ] Create Step 2: Date & Venue form
  - [ ] Create Step 3: Media & Final form
  - [ ] Ensure mobile responsiveness

- [ ] Add URL slug generation from event name (AC: 4)
  - [ ] Generate SEO-friendly slugs
  - [ ] Handle duplicate slugs
  - [ ] Allow custom slug editing

- [ ] Implement draft event storage (AC: 4, 6)
  - [ ] Create Event model in Prisma
  - [ ] Add draft/published status field
  - [ ] Implement draft retrieval

- [ ] Create event preview functionality (AC: 4)
  - [ ] Build event preview component
  - [ ] Show how event will appear to customers
  - [ ] Allow preview from any wizard step

- [ ] Add accessibility form fields (AC: 3)
  - [ ] Create accessibility information input
  - [ ] Add checkbox for wheelchair accessible
  - [ ] Include additional accessibility notes field

- [ ] Implement timezone handling (AC: 3)
  - [ ] Use user's local timezone by default
  - [ ] Allow timezone selection for event
  - [ ] Store dates in UTC in database

---

## Dev Notes

### Architecture References

**Database Schema**:
- Event model with fields: id, title, description, category, date, startTime, endTime, venue, venueAddress, capacity, accessibility, status (DRAFT/PUBLISHED), squareCatalogId, slug, organizerId, createdAt, updatedAt

**API Structure** (`docs/architecture/api-specifications.md`):
- Use tRPC for type-safe API
- Event creation endpoint with file upload support
- Square Catalog API integration

**Source Tree**:
```
src/
├── app/
│   ├── organizer/
│   │   └── events/
│   │       └── create/page.tsx
│   └── api/
│       └── events/route.ts
├── components/
│   └── events/
│       ├── EventWizard.tsx
│       ├── StepOne.tsx
│       ├── StepTwo.tsx
│       └── StepThree.tsx
├── lib/
│   ├── square.ts
│   └── upload.ts
└── prisma/
    └── schema.prisma
```

**Square Integration** (`docs/architecture/square-payment-integration.md`):
- Square Catalog API for event/product creation
- Store Square catalog_item_id in Event model
- Handle Square API rate limits
- Implement error retry logic

**Image Processing**:
- Use Sharp for image optimization
- Resize to multiple sizes (thumbnail, medium, large)
- Store in `/public/uploads/events/{eventId}/`
- Max file size: 5MB
- Supported formats: JPG, PNG, WebP

### Testing

**Test Standards**:
- Test file location: `__tests__/events/event-creation.test.ts`
- E2E test file: `e2e/events/create-event.spec.ts`

**Testing Requirements**:
- Unit test for event validation logic
- Unit test for slug generation
- Integration test for event creation API
- E2E test for complete wizard flow
- E2E test for auto-save functionality
- Test image upload with various file sizes
- Test Square Catalog integration
- Test timezone handling
- Test draft event retrieval

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