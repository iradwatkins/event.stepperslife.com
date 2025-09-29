# Story: EV-004 - Event Listing Page

**Epic**: EPIC-002 - Event Management Core
**Story Points**: 3
**Priority**: P0 (Critical)
**Status**: Draft
**Dependencies**: EV-001 (Basic Event Creation), Event publishing workflow

---

## Story

**As an** event attendee
**I want to** browse available events in an organized list
**So that** I can discover events I might want to attend

---

## Acceptance Criteria

1. GIVEN I visit the events page
   WHEN the page loads
   THEN I should see a grid/list of published events showing:
   - Event banner image (with fallback if none)
   - Event name and category
   - Date and time
   - Venue name/location
   - Starting price ("From $X")
   - Organizer name
   - Quick "Get Tickets" button

2. GIVEN there are many events
   WHEN I scroll down the page
   THEN events should load more automatically (infinite scroll)
   OR show pagination with reasonable page sizes (20 events)
   AND maintain good performance

3. GIVEN I want to filter events
   WHEN I use filter options
   THEN I should be able to filter by:
   - Date range (today, this week, this month, custom)
   - Category (music, sports, conference, etc.)
   - Location/distance from me (if location shared)
   - Price range
   - Event status (upcoming, this weekend)
   AND results should update immediately

4. GIVEN I want to search for specific events
   WHEN I enter search terms
   THEN search should work on:
   - Event name
   - Event description
   - Organizer name
   - Venue name
   - Event tags
   AND show relevant results with highlighting

5. GIVEN an event is sold out
   WHEN viewing the event listing
   THEN it should clearly show "SOLD OUT" badge
   AND "Join Waitlist" instead of "Get Tickets"

6. GIVEN I'm viewing on mobile
   WHEN I browse events
   THEN layout should be mobile-optimized
   AND filters should be easily accessible
   AND event cards should be touch-friendly

---

## Tasks / Subtasks

- [ ] Design responsive event listing layout (AC: 1, 6)
  - [ ] Create grid/list view toggle
  - [ ] Design event card component
  - [ ] Implement mobile-responsive layout

- [ ] Implement infinite scroll or pagination (AC: 2)
  - [ ] Add infinite scroll with intersection observer
  - [ ] Implement loading states
  - [ ] Optimize performance for large lists

- [ ] Create event search functionality (AC: 4)
  - [ ] Build search API endpoint
  - [ ] Implement full-text search
  - [ ] Add search result highlighting

- [ ] Add filtering system with multiple criteria (AC: 3)
  - [ ] Create filter UI components
  - [ ] Build filter API endpoint
  - [ ] Implement filter state management

- [ ] Implement event card components (AC: 1)
  - [ ] Design event card UI
  - [ ] Add image lazy loading
  - [ ] Show pricing and availability

- [ ] Add image lazy loading for performance (AC: 1, 2)
  - [ ] Implement lazy loading library
  - [ ] Add blur placeholder
  - [ ] Optimize image sizes

- [ ] Create sold-out status display (AC: 5)
  - [ ] Add sold out badge
  - [ ] Show waitlist CTA
  - [ ] Hide Get Tickets button

- [ ] Implement location-based filtering (AC: 3)
  - [ ] Request user location permission
  - [ ] Calculate distance from events
  - [ ] Filter by radius

- [ ] Add search result highlighting (AC: 4)
  - [ ] Highlight matching terms
  - [ ] Show search context
  - [ ] Rank results by relevance

- [ ] Create mobile-optimized filter interface (AC: 6)
  - [ ] Build drawer/modal for filters
  - [ ] Add touch-friendly controls
  - [ ] Show active filter count

- [ ] Implement caching for better performance (AC: 2)
  - [ ] Cache event listings
  - [ ] Implement stale-while-revalidate
  - [ ] Add Redis caching layer

- [ ] Add event sorting options (AC: 3)
  - [ ] Sort by date (upcoming first)
  - [ ] Sort by popularity
  - [ ] Sort by price
  - [ ] Sort by distance

---

## Dev Notes

### Architecture References

**Event Discovery** (`docs/architecture/system-overview.md`):
- Public events shown in listing
- Draft/unpublished events hidden
- Sold out events included with badge
- Events sorted by date by default
- 20 events per page/batch

**Search & Filtering** (`docs/architecture/system-overview.md`):
- PostgreSQL full-text search for event discovery
- ElasticSearch for advanced search (future enhancement)
- Real-time filter updates via client-side filtering
- Location-based filtering uses PostGIS

**Performance Optimization** (`docs/architecture/performance.md`):
- Image CDN for fast delivery
- Lazy loading for images below fold
- Redis caching for event listings
- Database query optimization with indexes
- Stale-while-revalidate caching strategy

**Database Indexes** (`prisma/schema.prisma`):
```prisma
model Event {
  // ... other fields

  @@index([status, startDate])
  @@index([category])
  @@index([location])
  @@fulltext([name, description])
}
```

**Source Tree** (`docs/architecture/source-tree.md`):
```
src/
├── app/
│   ├── api/
│   │   └── events/
│   │       ├── route.ts
│   │       └── search/route.ts
│   └── events/
│       └── page.tsx
├── components/
│   └── events/
│       ├── EventList.tsx
│       ├── EventCard.tsx
│       ├── EventFilters.tsx
│       ├── EventSearch.tsx
│       └── InfiniteScroll.tsx
└── lib/
    ├── search.ts
    └── filters.ts
```

### Testing

**Testing Requirements for this story**:
- Unit tests for filter logic
- Unit tests for search functionality
- Integration test for event listing API
- Integration test for search API
- E2E test for browsing events
- E2E test for filtering events
- E2E test for searching events
- E2E test for infinite scroll
- Performance test for large event lists
- Mobile responsiveness testing
- Test sold out badge display
- Test image lazy loading

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