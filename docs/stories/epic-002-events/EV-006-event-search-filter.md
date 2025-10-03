# EV-006: Event Search and Filtering

**Epic**: EPIC-002: Event Management Core
**Story Points**: 3
**Priority**: High
**Status**: Ready for Development
**Sprint**: TBD

---

## User Story

**As an** event attendee
**I want to** search and filter events by various criteria
**So that** I can quickly find events that match my interests, schedule, and budget

---

## Business Value

- **User Value**: Reduces time to find relevant events, improving user experience and satisfaction
- **Business Value**: Higher engagement and conversion rates when users find events matching their interests
- **Impact**: Critical discovery feature - 60% of users utilize search/filter to find events
- **Revenue Impact**: Improved event discovery increases ticket sales by 30-40%

---

## INVEST Criteria

- **Independent**: Can be developed independently with existing Event model and API
- **Negotiable**: Filter options and UI layout can be adjusted based on user feedback
- **Valuable**: Essential for event discovery and user engagement
- **Estimable**: Clear scope with well-defined technical requirements
- **Small**: Can be completed within one sprint with focused effort
- **Testable**: Clear acceptance criteria with measurable search/filter accuracy

---

## Acceptance Criteria

### AC1: Text Search Functionality
**Given** I am on the events listing page
**When** I enter text in the search box
**Then**:
- Search is performed across event title, description, and organizer name
- Results update in real-time with debouncing (300ms delay)
- Search is case-insensitive
- Partial word matching is supported
- Minimum 2 characters required to trigger search
- Clear button appears to reset search

### AC2: Date Range Filter
**Given** I want to find events within a specific timeframe
**When** I use the date range filter
**Then** I should be able to:
- Select a start date and end date using a date picker
- See preset options (Today, This Weekend, This Week, This Month, Next 3 Months)
- Filter events where event start date falls within the selected range
- Clear date filters individually or together
- See filter applied in URL query parameters

### AC3: Category/Type Filter
**Given** I want to find events of a specific type
**When** I select category filters
**Then** I should be able to:
- See all available event categories (Workshop, Performance, Social, Competition, etc.)
- Select multiple categories (OR logic - shows events matching any selected category)
- See event count for each category
- Deselect categories to remove filter
- See selected categories highlighted

### AC4: Location/Venue Filter
**Given** I want to find events in a specific location
**When** I use the location filter
**Then** I should be able to:
- Enter city or venue name
- See autocomplete suggestions based on existing venues
- Select "Online Events Only" option
- Filter by proximity (if geolocation enabled - future enhancement)
- See location filter applied and active

### AC5: Price Range Filter
**Given** I want to find events within my budget
**When** I use the price range filter
**Then** I should be able to:
- Select from preset price ranges (Free, Under $25, $25-$50, $50-$100, $100+)
- See custom price range slider option
- Filter events where minimum ticket price falls within range
- See "Free Events Only" as a quick filter option
- Clear price filter to show all events

### AC6: Filter Combination
**Given** I have applied multiple filters
**When** the results are displayed
**Then**:
- All filters work together with AND logic
- Result count updates dynamically as filters change
- URL query parameters reflect all active filters
- Filters are preserved on page refresh
- Clear All Filters button removes all active filters at once

### AC7: Search Results Display
**Given** search/filter results are returned
**When** I view the results
**Then** I should see:
- Total count of matching events
- Relevant events displayed in grid/list view
- "No results found" message with suggestions if query returns empty
- Results sorted by relevance (for text search) or date (for filters)
- Pagination if results exceed 20 events per page

### AC8: URL State Management
**Given** I have applied filters and performed a search
**When** I copy and share the URL
**Then**:
- All filter states are encoded in URL query parameters
- Opening the shared URL applies the same filters
- Browser back/forward buttons work correctly
- URL is shareable and bookmarkable

### AC9: Performance Requirements
**Given** I use search and filters
**When** queries are executed
**Then**:
- Search results return in < 500ms for typical queries
- Filter changes update results in < 300ms
- Debounced search prevents excessive API calls
- Database queries are optimized with proper indexing
- No UI blocking during search operations

### AC10: Mobile Responsiveness
**Given** I access filters on a mobile device
**When** the page renders
**Then**:
- Filters are accessible via collapsible panel or drawer
- Filter button shows count of active filters
- Touch-friendly controls (minimum 44x44px targets)
- Date picker optimized for mobile input
- Search box is easily accessible

---

## Technical Implementation Tasks

### Task 1: Create Search UI Components
- [ ] Create SearchBar component with debounced input
- [ ] Add clear search button
- [ ] Implement search icon and loading indicator
- [ ] Add keyboard navigation (Enter to search, Escape to clear)
- [ ] Style for desktop and mobile

### Task 2: Implement Filter Panel Component
- [ ] Create FilterPanel container component
- [ ] Design collapsible filter sections
- [ ] Add "Clear All Filters" button
- [ ] Show active filter count badge
- [ ] Implement mobile drawer for filters

### Task 3: Create Individual Filter Components
- [ ] DateRangeFilter with date picker
- [ ] CategoryFilter with multi-select checkboxes
- [ ] LocationFilter with autocomplete
- [ ] PriceRangeFilter with range slider and presets
- [ ] QuickFilters for common selections (Free, This Weekend, etc.)

### Task 4: Implement URL Query Parameter Management
- [ ] Create utility functions for encoding/decoding filters to URL params
- [ ] Implement useSearchParams hook usage
- [ ] Add router.push for updating URL without page reload
- [ ] Handle browser back/forward navigation
- [ ] Parse URL params on initial page load

### Task 5: Build Search API Endpoint Enhancement
- [ ] Enhance existing `/api/events/search` endpoint
- [ ] Add support for text search query
- [ ] Add support for date range filtering
- [ ] Add support for category filtering
- [ ] Add support for location filtering
- [ ] Add support for price range filtering
- [ ] Implement proper SQL query building with Prisma

### Task 6: Optimize Database Queries
- [ ] Add database indexes for frequently queried fields (title, category, startDate, price)
- [ ] Implement full-text search indexing (consider PostgreSQL's tsvector)
- [ ] Optimize Prisma query with proper select and include
- [ ] Add query result caching strategy
- [ ] Implement pagination efficiently

### Task 7: Implement Debouncing and Performance
- [ ] Add debounce utility for search input (300ms)
- [ ] Implement React Query or SWR for API caching
- [ ] Add loading states for all filter operations
- [ ] Optimize re-renders with React.memo where appropriate
- [ ] Implement virtual scrolling for large result sets (future)

### Task 8: Create Results Display Component
- [ ] Implement EventsGrid/EventsList toggle
- [ ] Add result count display
- [ ] Create "No Results" empty state with suggestions
- [ ] Implement pagination controls
- [ ] Add sorting options (date, price, relevance)

### Task 9: Testing
- [ ] Unit tests for search/filter utility functions
- [ ] Unit tests for URL param encoding/decoding
- [ ] Component tests for all filter components
- [ ] Integration tests for combined filter scenarios
- [ ] E2E tests for search and filter workflows
- [ ] Performance testing for query response times
- [ ] Accessibility testing for all interactive elements

### Task 10: Documentation
- [ ] Document filter API query parameters
- [ ] Add code comments for complex query logic
- [ ] Create user guide for search/filter features
- [ ] Document database indexing strategy

---

## Dependencies

### Required Before Starting
- ✅ Event model in Prisma schema (completed)
- ✅ Events listing page structure
- ✅ Public events API endpoint
- ⏳ Database indexes configured

### Blocks
- None - can proceed independently

### Related Stories
- EV-005: Event detail page (receives traffic from search results)
- EV-001: Event creation (provides event data for search)
- EV-003: Event categories setup (provides category taxonomy)

---

## Technical Specifications

### API Endpoint Structure
```typescript
// GET /api/events/search
interface SearchParams {
  q?: string;              // Text search query
  dateFrom?: string;       // ISO date string
  dateTo?: string;         // ISO date string
  categories?: string[];   // Array of category IDs
  location?: string;       // City or venue name
  priceMin?: number;       // Minimum price
  priceMax?: number;       // Maximum price
  page?: number;           // Pagination
  limit?: number;          // Results per page
  sortBy?: 'date' | 'price' | 'relevance';
}

interface SearchResponse {
  events: Event[];
  total: number;
  page: number;
  totalPages: number;
  filters: {
    categories: { id: string; name: string; count: number }[];
    priceRange: { min: number; max: number };
  };
}
```

### Prisma Query Pattern
```typescript
const events = await prisma.event.findMany({
  where: {
    AND: [
      // Text search
      q ? {
        OR: [
          { title: { contains: q, mode: 'insensitive' } },
          { description: { contains: q, mode: 'insensitive' } },
          { organizer: { name: { contains: q, mode: 'insensitive' } } }
        ]
      } : {},

      // Date range
      dateFrom || dateTo ? {
        startDate: {
          gte: dateFrom ? new Date(dateFrom) : undefined,
          lte: dateTo ? new Date(dateTo) : undefined
        }
      } : {},

      // Category filter
      categories?.length ? {
        category: { in: categories }
      } : {},

      // Location filter
      location ? {
        OR: [
          { venue: { city: { contains: location, mode: 'insensitive' } } },
          { venue: { name: { contains: location, mode: 'insensitive' } } }
        ]
      } : {},

      // Price range
      priceMin !== undefined || priceMax !== undefined ? {
        tickets: {
          some: {
            price: {
              gte: priceMin,
              lte: priceMax
            }
          }
        }
      } : {},

      // Only published events
      { status: 'PUBLISHED' },
      { startDate: { gte: new Date() } } // Future events only
    ]
  },
  include: {
    organizer: { select: { name: true, id: true } },
    venue: { select: { name: true, city: true, state: true } },
    tickets: { select: { price: true }, orderBy: { price: 'asc' }, take: 1 }
  },
  orderBy: sortBy === 'date' ? { startDate: 'asc' } :
           sortBy === 'price' ? { tickets: { _min: { price: 'asc' } } } :
           undefined,
  skip: (page - 1) * limit,
  take: limit
});
```

### URL Query Parameter Format
```
/events?q=salsa&dateFrom=2025-10-01&dateTo=2025-10-31&categories=workshop,social&priceMax=50
```

### Database Indexes
```prisma
model Event {
  // ... fields ...

  @@index([title]) // For text search
  @@index([startDate]) // For date filtering
  @@index([category]) // For category filtering
  @@index([status, startDate]) // Composite for published future events
}

model Venue {
  @@index([city]) // For location filtering
}

model Ticket {
  @@index([eventId, price]) // For price filtering
}
```

---

## Edge Cases & Error Scenarios

1. **No Search Results**: Display helpful message with suggestions to broaden search
2. **Invalid Date Range**: Validate that end date is after start date, show error
3. **Empty Filter Options**: Handle case where no events exist for certain categories
4. **Malformed Query Parameters**: Sanitize and validate all URL params, ignore invalid ones
5. **Special Characters in Search**: Properly escape special characters to prevent SQL injection
6. **Very Long Search Queries**: Limit search query length to 200 characters
7. **Concurrent Filter Changes**: Debounce and cancel previous requests to prevent race conditions
8. **Slow Query Performance**: Implement timeout and show "Search taking longer than expected" message
9. **Zero Price Events**: Handle free events (price = 0) correctly in price range filter
10. **Multiple Venues Same City**: Group by city but show venue-specific results
11. **Past Events in Results**: Always filter out events with startDate < now
12. **Pagination Edge Cases**: Handle last page with fewer results gracefully

---

## Definition of Done

- [ ] All acceptance criteria are met and verified
- [ ] Search functionality works with debouncing
- [ ] All filter types implemented and working
- [ ] Multiple filters can be combined with AND logic
- [ ] URL query parameters properly encode/decode filter state
- [ ] Browser back/forward navigation works correctly
- [ ] Mobile responsive filter UI implemented
- [ ] Database queries optimized with proper indexes
- [ ] API response time < 500ms for typical queries
- [ ] Unit tests written with >80% coverage
- [ ] Component tests cover all filter interactions
- [ ] Integration tests validate combined filter scenarios
- [ ] E2E tests validate full search and filter workflows
- [ ] Accessibility audit passes WCAG 2.1 AA standards
- [ ] Performance testing validates query speed requirements
- [ ] Code reviewed and approved by tech lead
- [ ] Documentation updated (API specs, user guide)
- [ ] Deployed to staging and validated
- [ ] Product owner approval obtained

---

## Testing Strategy

### Unit Tests
- Debounce utility function
- URL param encoding/decoding utilities
- Filter state management logic
- Query builder functions

### Component Tests
- SearchBar component with various inputs
- Each filter component independently
- FilterPanel open/close behavior
- Clear filters functionality
- Active filter badge count

### Integration Tests
- Search with no filters
- Single filter applied
- Multiple filters combined
- URL state sync with filter state
- Pagination with filters

### E2E Tests
- User enters search query and sees results
- User applies date range filter
- User selects multiple categories
- User combines all filters
- User clears all filters
- User shares URL with filters applied
- User navigates back/forward with filters

### Performance Tests
- Query execution time with various filter combinations
- API response time under load
- Database query explain plans
- Frontend rendering performance with large result sets

---

## Notes & Considerations

### Future Enhancements
- Implement geolocation-based "Near Me" filtering
- Add saved searches functionality for logged-in users
- Implement advanced search with boolean operators (AND, OR, NOT)
- Add faceted search with dynamic filter options based on current results
- Implement search suggestions/autocomplete
- Add "Recently Searched" history
- Consider Elasticsearch or Algolia for advanced full-text search at scale
- Add filter presets for common searches (e.g., "Free Events This Weekend")

### Technical Debt Considerations
- Monitor query performance as database grows
- Consider implementing search result caching layer
- May need to add search analytics to track popular queries
- Evaluate need for separate search service/microservice at scale

### UX Considerations
- Consider adding filter tooltips to explain options
- Show "Filtering..." loading state during query execution
- Add filter animation/transitions for better UX
- Consider sticky filter panel on scroll (desktop)
- Add "Refine Search" suggestions when no results found

---

**Created**: 2025-09-30
**Last Updated**: 2025-09-30
**Estimated Effort**: 18-22 hours
**Assigned To**: TBD