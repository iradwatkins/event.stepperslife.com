# Story: CHK-004 - Manual Search and Check-in

**Epic**: EPIC-006 - Mobile Check-in PWA
**Story Points**: 3
**Priority**: P1 (High)
**Status**: Draft
**Dependencies**: CHK-001 (PWA Framework), CHK-002 (Offline Mode)

---

## Story

**As an** event staff member
**I want to** search for attendees by name or email when QR codes are unavailable
**So that** I can check in guests even without scannable tickets

---

## Acceptance Criteria

1. GIVEN I'm on the check-in screen
   WHEN I tap "Manual Search" option
   THEN I should see:
   - Large, touch-friendly search input field
   - Search by name or email placeholder
   - Clear button (X) to reset search
   - Recent searches list (last 5)
   - Keyboard opens automatically
   - Search works in both online and offline modes

2. GIVEN I start typing in search field
   WHEN I enter 2+ characters
   THEN the system should:
   - Wait 300ms (debounced) before searching
   - Search across names and emails
   - Use fuzzy matching for typos
   - Display matching results in real-time
   - Show result count ("5 results found")
   - Highlight matching text
   - Sort by relevance

3. GIVEN search returns matching attendees
   WHEN results are displayed
   THEN I should see for each result:
   - Full name (prominently)
   - Email address
   - Ticket type
   - Check-in status (checked-in or pending)
   - Profile photo if available
   - Quick "Check In" button
   - Tap anywhere on card to expand details

4. GIVEN I tap on a search result
   WHEN attendee card expands
   THEN I should see complete details:
   - Full name and email
   - Ticket type and number
   - Order date and time
   - Special notes if any
   - Dietary restrictions (if applicable)
   - Check-in timestamp (if already checked-in)
   - Large "Check In" or "Already Checked-In" button

5. GIVEN I tap "Check In" button for an attendee
   WHEN check-in is processed
   THEN the system should:
   - Show loading state on button
   - Process check-in (online or queue offline)
   - Display success confirmation
   - Update status to "Checked-In"
   - Provide haptic feedback
   - Auto-close result after 2 seconds
   - Return to search for next attendee

6. GIVEN attendee is already checked-in
   WHEN I find them in search
   THEN I should see:
   - "Already Checked-In" badge
   - Timestamp of check-in
   - Which staff member checked them in
   - Option to "Check Out" (if enabled)
   - Warning before duplicate check-in
   - Manager override option (if authorized)

---

## Tasks / Subtasks

- [ ] Create search interface component (AC: 1)
  - [ ] Design mobile-optimized search input
  - [ ] Add clear button
  - [ ] Implement keyboard handling
  - [ ] Add recent searches

- [ ] Implement fuzzy search logic (AC: 2)
  - [ ] Install Fuse.js library
  - [ ] Configure fuzzy matching settings
  - [ ] Search across name and email
  - [ ] Handle special characters

- [ ] Add search debouncing (AC: 2)
  - [ ] Implement 300ms debounce
  - [ ] Show loading indicator
  - [ ] Cancel previous searches
  - [ ] Handle rapid typing

- [ ] Create attendee result cards (AC: 3)
  - [ ] Design result card layout
  - [ ] Display key information
  - [ ] Add check-in status indicator
  - [ ] Make cards tappable

- [ ] Build result highlighting (AC: 2)
  - [ ] Highlight matching characters
  - [ ] Style highlighted text
  - [ ] Handle multiple matches
  - [ ] Accessible highlighting

- [ ] Implement expandable result details (AC: 4)
  - [ ] Expand/collapse animation
  - [ ] Show complete attendee info
  - [ ] Display ticket details
  - [ ] Add action buttons

- [ ] Add check-in from search (AC: 5)
  - [ ] Integrate with check-in API
  - [ ] Handle online check-in
  - [ ] Queue offline check-in
  - [ ] Show success feedback

- [ ] Handle already checked-in status (AC: 6)
  - [ ] Display check-in timestamp
  - [ ] Show staff member who checked in
  - [ ] Add warning for duplicates
  - [ ] Implement manager override

- [ ] Optimize offline search (AC: 1, 2)
  - [ ] Cache attendee list in IndexedDB
  - [ ] Perform local fuzzy search
  - [ ] Update cache on sync
  - [ ] Handle large attendee lists

- [ ] Add recent searches (AC: 1)
  - [ ] Store recent searches locally
  - [ ] Display recent searches list
  - [ ] Tap to reuse search
  - [ ] Clear recent searches

- [ ] Implement result sorting (AC: 2)
  - [ ] Sort by relevance score
  - [ ] Prioritize exact matches
  - [ ] Show unchecked-in first
  - [ ] Configurable sort options

- [ ] Add keyboard shortcuts (AC: 1, 2)
  - [ ] Enter to check-in first result
  - [ ] ESC to clear search
  - [ ] Arrow keys to navigate
  - [ ] Tab for accessibility

- [ ] Create loading and empty states (AC: 2)
  - [ ] Search loading indicator
  - [ ] No results found message
  - [ ] Search tips for no results
  - [ ] Suggest QR scan alternative

- [ ] Add search analytics (AC: 2, 5)
  - [ ] Track search usage
  - [ ] Log common searches
  - [ ] Measure search performance
  - [ ] Monitor search accuracy

---

## Dev Notes

### Architecture References

**Fuzzy Search Implementation** (`docs/architecture/search-strategy.md`):
- Use Fuse.js for fuzzy matching
- Score threshold: 0.4 (60% match)
- Search fields: name (weight: 0.7), email (weight: 0.3)
- Maximum 50 results displayed
- Cache search results for repeated queries

**Fuse.js Configuration**:
```typescript
const fuseOptions = {
  keys: [
    { name: 'name', weight: 0.7 },
    { name: 'email', weight: 0.3 }
  ],
  threshold: 0.4, // Lower = stricter matching
  distance: 100,
  minMatchCharLength: 2,
  includeScore: true,
  includeMatches: true,
  shouldSort: true
};
```

**Debouncing Strategy** (`docs/architecture/performance.md`):
- 300ms debounce for search input
- Cancel previous searches on new input
- Show loading indicator after 200ms
- Cache results for 30 seconds
- Minimum 2 characters to trigger search

**Offline Search** (`docs/architecture/pwa-architecture.md`):
- Pre-load all attendees to IndexedDB
- Use Fuse.js on cached data
- Update cache on each sync
- Compressed storage: ~1KB per attendee
- Index by name and email for fast lookup

**Search Component Architecture**:
```typescript
// components/check-in/AttendeeSearch.tsx
interface AttendeeSearchProps {
  eventId: string;
  onCheckIn: (attendeeId: string) => void;
  offline?: boolean;
}

interface SearchResult {
  attendee: Attendee;
  score: number; // Fuse.js relevance score
  matches: string[]; // Matched fields
}
```

**Search Result Display**:
```typescript
interface AttendeeResult {
  id: string;
  name: string;
  email: string;
  ticketType: string;
  ticketNumber: string;
  checkedIn: boolean;
  checkInTime?: Date;
  checkInBy?: string; // Staff member
  photoUrl?: string;
  specialNotes?: string;
}
```

**Source Tree** (`docs/architecture/source-tree.md`):
```
src/
├── app/
│   └── check-in/
│       └── search/page.tsx
├── components/
│   └── check-in/
│       ├── AttendeeSearch.tsx
│       ├── SearchInput.tsx
│       ├── SearchResults.tsx
│       ├── AttendeeCard.tsx
│       └── CheckInButton.tsx
├── lib/
│   └── search/
│       ├── fuzzy-search.ts
│       ├── search-cache.ts
│       └── search-utils.ts
└── hooks/
    ├── useAttendeeSearch.ts
    └── useDebounce.ts
```

**Performance Optimizations**:
- Virtual scrolling for large result lists (>100)
- Lazy load profile photos
- Memoize search function
- Debounce input to reduce searches
- Cache Fuse.js index
- Web Worker for large searches (1000+ attendees)

**Mobile UX Considerations**:
- Large tap targets (minimum 48px)
- Auto-focus search input
- Dismiss keyboard on scroll
- Pull-to-refresh for data update
- Swipe-to-dismiss keyboard
- Voice input support (future)

**Accessibility**:
- ARIA labels for search input
- Keyboard navigation support
- Screen reader announcements
- High contrast result cards
- Focus management

**Search Analytics**:
- Track search terms
- Measure time-to-result
- Monitor search success rate
- Log "no results" queries
- Identify common misspellings

### Testing

**Testing Requirements for this story**:
- Unit tests for fuzzy search logic
- Unit tests for debouncing
- Unit tests for result filtering
- Integration test for search component
- Integration test with check-in flow
- Integration test for offline search
- E2E test for complete search workflow
- E2E test for checking-in from search
- Test with large attendee lists (5000+)
- Test fuzzy matching accuracy
- Test special character handling
- Test empty search results
- Test already checked-in status
- Test keyboard navigation
- Performance test for search speed
- Test offline search functionality
- Test cache updates
- Accessibility testing

---

## Change Log

| Date | Version | Description | Author |
|------|---------|-------------|---------|
| 2025-09-30 | 1.0 | Initial story creation | SM Agent |

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