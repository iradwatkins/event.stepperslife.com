# ORG-001a: Dashboard Layout & Event Cards

**Parent Story:** ORG-001 - Basic Dashboard Overview
**Epic:** EPIC-007 - Organizer Dashboard & Analytics
**Story Points:** 2
**Priority:** High
**Status:** Ready for Development

## User Story

As an **event organizer**
I want to **see my events displayed as visual cards in a responsive grid layout**
So that **I can quickly scan all my events and take action on each one**

## Acceptance Criteria

### AC1: Responsive Grid Layout
- [ ] Desktop (1280px+): 3-column grid with 24px gap
- [ ] Tablet (768px-1279px): 2-column grid with 16px gap
- [ ] Mobile (<768px): 1-column stack with 12px gap
- [ ] Grid uses CSS Grid or Flexbox with proper wrapping
- [ ] Layout shifts smoothly between breakpoints (no jank)
- [ ] Container has max-width of 1440px and centers on large screens

### AC2: Dashboard Header Component
- [ ] Displays personalized greeting based on time of day:
  - "Good morning, [Name]" (5am-11:59am)
  - "Good afternoon, [Name]" (12pm-4:59pm)
  - "Good evening, [Name]" (5pm-4:59am)
- [ ] Shows current date in organizer's timezone (e.g., "Tuesday, January 15, 2025")
- [ ] Includes notification bell icon with unread count badge
- [ ] Date range selector positioned in header (right side)
- [ ] Header is sticky on scroll (remains visible)

### AC3: Event Card Design
- [ ] **Thumbnail Image:**
  - 16:9 aspect ratio, 100% width
  - Lazy loading with blur-up placeholder
  - Fallback image if no thumbnail uploaded
  - Image hover effect (subtle zoom or brightness)
- [ ] **Event Title:**
  - Truncate to 2 lines with ellipsis
  - Font weight 600, size 18px on desktop
- [ ] **Event Details Section:**
  - Date/Time: Icon + formatted string (e.g., "Jan 15, 2025 at 8:00 PM")
  - Venue: Location icon + venue name (truncate to 1 line)
  - Organizer name badge (if multiple organizers collaborate)
- [ ] **Ticket Sales Progress Bar:**
  - Visual progress bar showing sold/capacity
  - Color coding: Green (>75%), Yellow (25-75%), Red (<25%)
  - Text: "250 / 500 tickets sold (50%)"
  - Separate indicator for "Sold Out" status
- [ ] **Status Badge:**
  - UPCOMING: Blue badge, positioned top-right
  - ONGOING: Green badge with pulse animation
  - PAST: Gray badge
  - CANCELLED: Red badge
  - DRAFT: Yellow badge (if event not published)
- [ ] **Quick Action Buttons:**
  - "View Details" (primary button)
  - "Manage" (secondary button)
  - "Analytics" (icon button with chart icon)
  - Button group with consistent spacing and hover states

### AC4: Event Card Interactions
- [ ] Entire card is clickable, navigates to `/dashboard/events/[eventId]`
- [ ] Quick action buttons have `stopPropagation()` to prevent card click
- [ ] Hover state: Card elevates with box-shadow
- [ ] Focus state: Visible outline for keyboard navigation
- [ ] Long-press on mobile shows context menu (Share, Duplicate, Delete)

### AC5: Event Sorting & Filtering
- [ ] Default sort: Upcoming events first (by startDateTime ASC), then past events (DESC)
- [ ] Secondary sort: Created date if same day
- [ ] Filter options (dropdown):
  - All Events
  - Upcoming Only
  - Past Events
  - Drafts
  - Cancelled
- [ ] Sort options (dropdown):
  - Date (newest first)
  - Date (oldest first)
  - Tickets Sold (highest first)
  - Revenue (highest first)
- [ ] Filter and sort state persists in URL query params

### AC6: Pagination / Infinite Scroll
- [ ] Display 12 events per page initially
- [ ] Infinite scroll triggered 200px before bottom of list
- [ ] Loading skeleton shows while fetching more events
- [ ] "Load More" button fallback if JavaScript disabled
- [ ] Total event count displayed: "Showing 12 of 45 events"
- [ ] Jump to page controls for large lists (1, 2, 3... 10)

### AC7: Empty States
- [ ] No events created yet:
  - Large illustration (empty state graphic)
  - Headline: "Create Your First Event"
  - Subtitle: "Start selling tickets in minutes"
  - Primary CTA: "Create Event" button → `/dashboard/events/create`
- [ ] No events match filters:
  - Icon + "No events found"
  - Button to clear filters
- [ ] Loading state:
  - 6 skeleton cards with shimmer animation
  - Matches actual card dimensions

## Technical Implementation

### Frontend Components

**File:** `/components/dashboard/DashboardLayout.tsx`
```typescript
interface DashboardLayoutProps {
  children: React.ReactNode;
  organizerName: string;
  notificationCount: number;
}

export function DashboardLayout({
  children,
  organizerName,
  notificationCount
}: DashboardLayoutProps) {
  const greeting = useGreeting();
  const currentDate = useFormattedDate();

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader
        greeting={greeting}
        organizerName={organizerName}
        currentDate={currentDate}
        notificationCount={notificationCount}
      />
      <main className="max-w-[1440px] mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  );
}
```

**File:** `/components/dashboard/EventCard.tsx`
```typescript
interface EventCardProps {
  event: {
    id: string;
    title: string;
    startDateTime: Date;
    endDateTime: Date;
    venue: string;
    thumbnailUrl?: string;
    ticketsSold: number;
    capacity: number;
    status: 'UPCOMING' | 'ONGOING' | 'PAST' | 'CANCELLED' | 'DRAFT';
    revenue: number;
  };
  onClick: (eventId: string) => void;
}

export function EventCard({ event, onClick }: EventCardProps) {
  const progress = (event.ticketsSold / event.capacity) * 100;
  const progressColor = progress > 75 ? 'green' : progress > 25 ? 'yellow' : 'red';

  return (
    <article
      className="bg-white rounded-lg shadow-sm hover:shadow-lg transition-shadow cursor-pointer"
      onClick={() => onClick(event.id)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick(event.id)}
    >
      {/* Thumbnail */}
      <div className="relative aspect-video overflow-hidden rounded-t-lg">
        <Image
          src={event.thumbnailUrl || '/placeholder-event.jpg'}
          alt={event.title}
          fill
          className="object-cover hover:scale-105 transition-transform"
          loading="lazy"
        />
        <StatusBadge status={event.status} className="absolute top-2 right-2" />
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-lg line-clamp-2 mb-2">{event.title}</h3>

        <div className="space-y-1 text-sm text-gray-600 mb-3">
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-4 h-4" />
            <span>{formatEventDate(event.startDateTime)}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPinIcon className="w-4 h-4" />
            <span className="truncate">{event.venue}</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-3">
          <ProgressBar
            value={progress}
            color={progressColor}
            label={`${event.ticketsSold} / ${event.capacity} tickets sold`}
          />
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            variant="primary"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/dashboard/events/${event.id}`);
            }}
          >
            View Details
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/dashboard/events/${event.id}/manage`);
            }}
          >
            Manage
          </Button>
          <IconButton
            icon={<ChartBarIcon />}
            aria-label="Analytics"
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/dashboard/events/${event.id}/analytics`);
            }}
          />
        </div>
      </div>
    </article>
  );
}
```

**File:** `/components/dashboard/EventsGrid.tsx`
```typescript
interface EventsGridProps {
  events: Event[];
  isLoading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
}

export function EventsGrid({ events, isLoading, hasMore, onLoadMore }: EventsGridProps) {
  const { ref: loadMoreRef } = useInView({
    threshold: 0,
    rootMargin: '200px',
    onChange: (inView) => {
      if (inView && hasMore && !isLoading) {
        onLoadMore();
      }
    },
  });

  if (events.length === 0 && !isLoading) {
    return <EmptyState />;
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {events.map((event) => (
          <EventCard key={event.id} event={event} onClick={handleEventClick} />
        ))}
      </div>

      {isLoading && <LoadingSkeleton count={6} />}

      {hasMore && <div ref={loadMoreRef} className="h-20" />}
    </>
  );
}
```

## Testing Requirements

### Unit Tests
```typescript
describe('EventCard', () => {
  it('renders event information correctly', () => {
    render(<EventCard event={mockEvent} onClick={mockOnClick} />);
    expect(screen.getByText(mockEvent.title)).toBeInTheDocument();
    expect(screen.getByText(mockEvent.venue)).toBeInTheDocument();
  });

  it('calculates progress bar color based on ticket sales', () => {
    const event = { ...mockEvent, ticketsSold: 400, capacity: 500 };
    render(<EventCard event={event} onClick={mockOnClick} />);
    // Assert progress bar has yellow color (80% sold)
  });

  it('handles card click navigation', () => {
    render(<EventCard event={mockEvent} onClick={mockOnClick} />);
    fireEvent.click(screen.getByRole('button'));
    expect(mockOnClick).toHaveBeenCalledWith(mockEvent.id);
  });

  it('prevents event propagation on action buttons', () => {
    render(<EventCard event={mockEvent} onClick={mockOnClick} />);
    fireEvent.click(screen.getByText('Manage'));
    expect(mockOnClick).not.toHaveBeenCalled();
  });
});

describe('DashboardLayout', () => {
  it('displays correct greeting based on time of day', () => {
    jest.setSystemTime(new Date('2025-01-15T09:00:00'));
    render(<DashboardLayout organizerName="Sarah" notificationCount={3} />);
    expect(screen.getByText(/Good morning, Sarah/)).toBeInTheDocument();
  });

  it('shows notification count badge', () => {
    render(<DashboardLayout organizerName="Sarah" notificationCount={5} />);
    expect(screen.getByText('5')).toBeInTheDocument();
  });
});
```

### Integration Tests
- [ ] Test grid layout responsiveness across breakpoints
- [ ] Test infinite scroll loading behavior
- [ ] Test filtering and sorting with URL state sync
- [ ] Test keyboard navigation through event cards

### E2E Tests
```typescript
test('organizer views and interacts with event cards', async ({ page }) => {
  await page.goto('/dashboard');

  // Verify cards rendered
  const cards = page.locator('[data-testid="event-card"]');
  await expect(cards).toHaveCount(12);

  // Test card click
  await cards.first().click();
  await expect(page).toHaveURL(/\/dashboard\/events\/[a-z0-9-]+$/);

  // Go back and test quick actions
  await page.goBack();
  await page.click('[data-testid="manage-button"]');
  await expect(page).toHaveURL(/\/dashboard\/events\/[a-z0-9-]+\/manage$/);
});
```

## Performance Requirements

- [ ] First Contentful Paint: < 1.2 seconds
- [ ] Largest Contentful Paint: < 2.5 seconds
- [ ] Image lazy loading reduces initial payload
- [ ] Skeleton loading prevents layout shift (CLS < 0.1)
- [ ] Smooth 60fps animations for hover effects

## Accessibility (WCAG 2.1 AA)

- [ ] Event cards have proper semantic HTML (`<article>`)
- [ ] All interactive elements keyboard accessible
- [ ] Status badges have aria-labels: "Event status: Upcoming"
- [ ] Progress bars have aria-valuenow, aria-valuemin, aria-valuemax
- [ ] Focus indicators visible on all clickable elements
- [ ] Screen reader announces card content properly

## Definition of Done

- [ ] All acceptance criteria met
- [ ] Responsive design tested on mobile, tablet, desktop
- [ ] Unit tests pass (>80% coverage)
- [ ] Integration tests pass
- [ ] E2E tests pass
- [ ] Accessibility audit passed (WCAG 2.1 AA)
- [ ] Performance benchmarks met
- [ ] Code reviewed and approved
- [ ] QA sign-off received