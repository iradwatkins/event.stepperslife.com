# ORG-005: Event Management Interface

**Epic:** EPIC-007 - Organizer Dashboard & Analytics
**Story Points:** 3
**Priority:** High
**Status:** Ready for Development

## User Story
As an **event organizer**
I want to **manage all aspects of my events from a central interface**
So that **I can efficiently create, edit, monitor, and control my events without navigating through multiple pages**

## Acceptance Criteria

### AC1: Event List View
- [ ] Display all organizer's events in card or table layout (toggle view)
- [ ] Each event shows: thumbnail, name, date/time, venue, status badge, quick stats (tickets sold/capacity)
- [ ] Filter by status: All, Upcoming, Ongoing, Past, Draft, Cancelled
- [ ] Sort by: Date, Name, Tickets Sold, Revenue
- [ ] Search events by name or venue
- [ ] View toggles: Grid view (cards) or List view (table)

### AC2: Event Status Indicators
- [ ] **Draft**: Gray badge - Event created but not published
- [ ] **Published**: Blue badge - Event live and accepting registrations
- [ ] **Upcoming**: Green badge - Event scheduled in future
- [ ] **Ongoing**: Orange badge - Event happening now
- [ ] **Past**: Gray badge - Event completed
- [ ] **Cancelled**: Red badge - Event cancelled
- [ ] **Sold Out**: Purple badge - All tickets sold
- [ ] Visual progress bar for ticket sales

### AC3: Quick Actions Menu
- [ ] Each event card has action dropdown menu with:
  - **Edit Event**: Navigate to event edit form
  - **View Public Page**: Open event detail page (new tab)
  - **View Analytics**: Navigate to event analytics
  - **Manage Tickets**: Navigate to ticket management
  - **Check-in Attendees**: Navigate to check-in interface
  - **Duplicate Event**: Create copy of event
  - **Publish/Unpublish**: Toggle event visibility
  - **Cancel Event**: Cancel event with confirmation
  - **Delete Event**: Delete draft events only
- [ ] Actions disabled based on event status (can't edit past events)
- [ ] Confirmation modals for destructive actions

### AC4: Create New Event Button
- [ ] Prominent "Create Event" button (top right)
- [ ] Opens event creation form
- [ ] Option to "Start from Template" or "Start from Scratch"
- [ ] Recent templates appear in dropdown
- [ ] Keyboard shortcut: Ctrl+N (or Cmd+N)

### AC5: Bulk Operations
- [ ] Select multiple events via checkboxes
- [ ] Bulk actions toolbar appears when events selected:
  - Publish/unpublish selected
  - Export selected events data
  - Delete selected (drafts only)
  - Duplicate selected
- [ ] "Select All" checkbox in header
- [ ] Show count of selected events

### AC6: Event Templates
- [ ] "Save as Template" option in event action menu
- [ ] Template library accessible from create button
- [ ] Templates include: event details, ticket types, pricing, settings
- [ ] Edit and delete templates
- [ ] Share templates within organization (future)

### AC7: Quick Stats Dashboard
- [ ] Summary cards above event list:
  - **Total Events**: count of all events
  - **Upcoming Events**: count of future events
  - **Total Tickets Sold**: across all events
  - **Total Revenue**: gross revenue all-time
- [ ] Click stat card to filter list by that category
- [ ] Stats update in real-time

### AC8: Event Navigation
- [ ] Breadcrumb navigation: Dashboard > Events > Event Name
- [ ] Back button returns to previous view
- [ ] Deep linking to specific event tabs
- [ ] Browser back/forward works correctly
- [ ] URL structure: `/dashboard/events` → `/dashboard/events/[eventId]/manage`

## Technical Implementation

### Frontend Components
```typescript
// /components/dashboard/EventManagementInterface.tsx
interface EventManagementInterfaceProps {
  organizerId: string;
}

interface Event {
  id: string;
  name: string;
  slug: string;
  description: string;
  startDateTime: Date;
  endDateTime: Date;
  venue: string;
  thumbnailUrl: string;
  status: EventStatus;
  publishedAt?: Date;
  capacity: number;
  ticketsSold: number;
  revenue: number;
  isTemplate: boolean;
}

enum EventStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  UPCOMING = 'UPCOMING',
  ONGOING = 'ONGOING',
  PAST = 'PAST',
  CANCELLED = 'CANCELLED',
  SOLD_OUT = 'SOLD_OUT'
}

interface EventFilters {
  status: EventStatus | 'ALL';
  searchQuery: string;
  sortBy: 'date' | 'name' | 'tickets' | 'revenue';
  sortOrder: 'asc' | 'desc';
}

// Component Structure
- EventManagementInterface (container)
  - EventsHeader
    - QuickStatsCards
    - CreateEventButton (with template dropdown)
    - ViewToggle (grid/list)
  - EventFilters
    - StatusFilter (tabs)
    - SearchBar
    - SortDropdown
  - BulkActionsToolbar (when items selected)
  - EventsGrid (card view)
    - EventCard
      - StatusBadge
      - ProgressBar
      - QuickActionsMenu
  - EventsTable (list view)
    - EventRow
      - QuickActionsMenu
  - Pagination
  - TemplateManager (modal)
```

### Backend API
```typescript
// /app/api/events/route.ts
GET /api/events
  ?organizerId={id}
  &status={status}
  &search={query}
  &sortBy={field}
  &sortOrder={order}
  &page=1
  &limit=20

Response: {
  success: true,
  data: {
    events: [
      {
        id: "evt_123",
        name: "Summer Dance Festival",
        slug: "summer-dance-festival-2025",
        startDateTime: "2025-07-15T19:00:00Z",
        endDateTime: "2025-07-15T23:00:00Z",
        venue: "Downtown Convention Center",
        thumbnailUrl: "https://cdn.example.com/event-thumb.jpg",
        status: "UPCOMING",
        capacity: 500,
        ticketsSold: 387,
        revenue: 19350.00,
        salesProgress: 77.4,
        isPublished: true,
        publishedAt: "2025-06-01T10:00:00Z"
      },
      ...
    ],
    pagination: {
      page: 1,
      limit: 20,
      total: 45,
      totalPages: 3
    },
    stats: {
      totalEvents: 45,
      upcomingEvents: 12,
      totalTicketsSold: 8756,
      totalRevenue: 456789.00
    }
  }
}

// Duplicate event
POST /api/events/[eventId]/duplicate
Response: { success: true, data: { newEventId: "evt_456" } }

// Publish/unpublish event
PATCH /api/events/[eventId]/publish
Body: { published: boolean }

// Cancel event
PATCH /api/events/[eventId]/cancel
Body: { reason: string, notifyAttendees: boolean }

// Save as template
POST /api/events/[eventId]/save-as-template
Body: { templateName: string }

// Get templates
GET /api/events/templates?organizerId={id}
Response: { success: true, data: { templates: [...] } }
```

### Event Status Logic
```typescript
// /lib/utils/eventStatus.ts
export function calculateEventStatus(event: Event): EventStatus {
  const now = new Date();
  const start = new Date(event.startDateTime);
  const end = new Date(event.endDateTime);

  // Check cancelled first
  if (event.isCancelled) {
    return EventStatus.CANCELLED;
  }

  // Check draft
  if (!event.publishedAt) {
    return EventStatus.DRAFT;
  }

  // Check sold out
  if (event.ticketsSold >= event.capacity) {
    return EventStatus.SOLD_OUT;
  }

  // Check ongoing
  if (now >= start && now <= end) {
    return EventStatus.ONGOING;
  }

  // Check past
  if (now > end) {
    return EventStatus.PAST;
  }

  // Check upcoming
  if (now < start) {
    return EventStatus.UPCOMING;
  }

  // Default to published
  return EventStatus.PUBLISHED;
}

export function getStatusColor(status: EventStatus): string {
  const colorMap: Record<EventStatus, string> = {
    [EventStatus.DRAFT]: 'gray',
    [EventStatus.PUBLISHED]: 'blue',
    [EventStatus.UPCOMING]: 'green',
    [EventStatus.ONGOING]: 'orange',
    [EventStatus.PAST]: 'gray',
    [EventStatus.CANCELLED]: 'red',
    [EventStatus.SOLD_OUT]: 'purple'
  };

  return colorMap[status] || 'gray';
}
```

### Quick Actions Component
```typescript
// /components/dashboard/EventQuickActions.tsx
interface EventQuickActionsProps {
  event: Event;
  onAction: (action: string, eventId: string) => void;
}

export function EventQuickActions({ event, onAction }: EventQuickActionsProps) {
  const [isOpen, setIsOpen] = useState(false);

  const actions = [
    {
      label: 'Edit Event',
      icon: <EditIcon />,
      action: 'edit',
      href: `/dashboard/events/${event.id}/manage`,
      disabled: event.status === 'PAST'
    },
    {
      label: 'View Public Page',
      icon: <ExternalLinkIcon />,
      action: 'view',
      href: `/events/${event.slug}`,
      target: '_blank'
    },
    {
      label: 'View Analytics',
      icon: <ChartIcon />,
      action: 'analytics',
      href: `/dashboard/events/${event.id}/analytics`
    },
    {
      label: 'Manage Tickets',
      icon: <TicketIcon />,
      action: 'tickets',
      href: `/dashboard/events/${event.id}/manage#tickets`
    },
    {
      label: 'Check-in Attendees',
      icon: <CheckIcon />,
      action: 'checkin',
      href: `/dashboard/events/${event.id}/checkin`,
      disabled: event.status === 'DRAFT'
    },
    { divider: true },
    {
      label: 'Duplicate Event',
      icon: <CopyIcon />,
      action: 'duplicate',
      onClick: () => onAction('duplicate', event.id)
    },
    {
      label: event.isPublished ? 'Unpublish' : 'Publish',
      icon: <PublishIcon />,
      action: 'publish',
      onClick: () => onAction('publish', event.id),
      disabled: event.status === 'PAST'
    },
    {
      label: 'Save as Template',
      icon: <TemplateIcon />,
      action: 'template',
      onClick: () => onAction('save-template', event.id)
    },
    { divider: true },
    {
      label: 'Cancel Event',
      icon: <CancelIcon />,
      action: 'cancel',
      onClick: () => onAction('cancel', event.id),
      disabled: event.status === 'PAST' || event.status === 'CANCELLED',
      className: 'text-red-600'
    },
    {
      label: 'Delete Event',
      icon: <TrashIcon />,
      action: 'delete',
      onClick: () => onAction('delete', event.id),
      disabled: event.status !== 'DRAFT',
      className: 'text-red-600'
    }
  ];

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm">
          <MoreVerticalIcon />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {actions.map((action, index) => {
          if (action.divider) {
            return <DropdownMenuSeparator key={index} />;
          }

          if (action.href) {
            return (
              <DropdownMenuItem key={action.action} asChild disabled={action.disabled}>
                <Link href={action.href} target={action.target}>
                  {action.icon}
                  <span className="ml-2">{action.label}</span>
                </Link>
              </DropdownMenuItem>
            );
          }

          return (
            <DropdownMenuItem
              key={action.action}
              onClick={action.onClick}
              disabled={action.disabled}
              className={action.className}
            >
              {action.icon}
              <span className="ml-2">{action.label}</span>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

### State Management Hook
```typescript
// /lib/hooks/useEventManagement.ts
export function useEventManagement(organizerId: string) {
  const [filters, setFilters] = useState<EventFilters>({
    status: 'ALL',
    searchQuery: '',
    sortBy: 'date',
    sortOrder: 'desc'
  });

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [pagination, setPagination] = useState({ page: 1, limit: 20 });

  const queryParams = new URLSearchParams({
    organizerId,
    status: filters.status,
    search: filters.searchQuery,
    sortBy: filters.sortBy,
    sortOrder: filters.sortOrder,
    page: pagination.page.toString(),
    limit: pagination.limit.toString()
  });

  const { data, error, isLoading, mutate } = useSWR(
    `/api/events?${queryParams}`,
    fetcher
  );

  const handleAction = async (action: string, eventId: string) => {
    try {
      switch (action) {
        case 'duplicate':
          await duplicateEvent(eventId);
          break;
        case 'publish':
          await togglePublish(eventId);
          break;
        case 'cancel':
          await cancelEvent(eventId);
          break;
        case 'delete':
          await deleteEvent(eventId);
          break;
        case 'save-template':
          await saveAsTemplate(eventId);
          break;
      }
      mutate(); // Refresh data
    } catch (error) {
      console.error(`Action ${action} failed:`, error);
    }
  };

  const handleBulkAction = async (action: string) => {
    const eventIds = Array.from(selectedIds);
    try {
      await fetch('/api/events/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, eventIds })
      });
      mutate();
      setSelectedIds(new Set());
    } catch (error) {
      console.error('Bulk action failed:', error);
    }
  };

  return {
    events: data?.events || [],
    stats: data?.stats,
    pagination: data?.pagination,
    isLoading,
    error,
    filters,
    setFilters,
    viewMode,
    setViewMode,
    selectedIds,
    setSelectedIds,
    handleAction,
    handleBulkAction,
    refetch: mutate
  };
}
```

## UI/UX Design

### Grid View Layout
```
┌─────────────────────────────────────────────────────────────┐
│ Event Management                                            │
│                                                              │
│ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐  [+ Create Event ▼]   │
│ │Total │ │Coming│ │Sold  │ │Revenue│                        │
│ │  45  │ │  12  │ │8,756 │ │$457k │                        │
│ └──────┘ └──────┘ └──────┘ └──────┘                        │
│                                                              │
│ [All][Upcoming][Ongoing][Past][Draft] 🔍Search  [Grid][List]│
│                                                              │
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐           │
│ │[Image]  🟢  │ │[Image]  🟠  │ │[Image]  ⚫  │           │
│ │Summer Dance │ │Winter Gala  │ │Spring Party │           │
│ │Jul 15, 7PM  │ │Dec 20, 8PM  │ │Apr 10, 9PM  │           │
│ │Convention Ctr│ │Grand Hotel  │ │City Park    │           │
│ │████████░ 77%│ │██████░░░ 65%│ │████░░░░ 45%│           │
│ │387/500 sold │ │325/500 sold │ │225/500 sold │           │
│ │$19,350      │ │$24,375      │ │$11,250      │           │
│ │[⋮Actions]   │ │[⋮Actions]   │ │[⋮Actions]   │           │
│ └─────────────┘ └─────────────┘ └─────────────┘           │
│                                                              │
│ Page 1 of 3  [< Prev] 1 2 3 [Next >]                       │
└─────────────────────────────────────────────────────────────┘
```

### Action Menu Dropdown
```
┌─────────────────────────┐
│ Edit Event              │
│ View Public Page     ↗  │
│ View Analytics          │
│ Manage Tickets          │
│ Check-in Attendees      │
├─────────────────────────┤
│ Duplicate Event         │
│ Publish Event           │
│ Save as Template        │
├─────────────────────────┤
│ Cancel Event        🔴  │
│ Delete Event        🔴  │
└─────────────────────────┘
```

## Integration Points

### Dependencies
- **EPIC-002**: Event CRUD operations
- **EPIC-004**: Ticket management
- **EPIC-006**: Check-in system
- **EPIC-007 (ORG-006)**: Analytics dashboard

### Navigation Flow
```
/dashboard/events (list)
  → /dashboard/events/create (create new)
  → /dashboard/events/[eventId]/manage (edit)
  → /dashboard/events/[eventId]/analytics (analytics)
  → /dashboard/events/[eventId]/checkin (check-in)
  → /events/[slug] (public page)
```

## Performance Requirements

- **Page load**: < 2 seconds for 100 events
- **Search response**: < 300ms
- **Action execution**: < 1 second
- **Grid/List view toggle**: < 100ms

## Testing Requirements

### Unit Tests
```typescript
describe('calculateEventStatus', () => {
  it('returns UPCOMING for future events', () => {
    const event = { startDateTime: addDays(new Date(), 7) };
    expect(calculateEventStatus(event)).toBe('UPCOMING');
  });

  it('returns ONGOING for current events', () => {
    const event = {
      startDateTime: subHours(new Date(), 1),
      endDateTime: addHours(new Date(), 2)
    };
    expect(calculateEventStatus(event)).toBe('ONGOING');
  });
});
```

### E2E Tests
```typescript
test('organizer manages events', async ({ page }) => {
  await page.goto('/dashboard/events');

  // Verify events loaded
  await expect(page.locator('.event-card')).toHaveCount(6);

  // Test duplicate action
  await page.click('[data-testid="event-actions-evt_123"]');
  await page.click('text=Duplicate Event');
  await expect(page.locator('.toast')).toContainText('Event duplicated');

  // Test create event
  await page.click('text=Create Event');
  await expect(page).toHaveURL(/\/dashboard\/events\/create/);
});
```

## Security Considerations

- [ ] Verify organizer owns events before showing/editing
- [ ] Validate event IDs in all API calls
- [ ] Prevent unauthorized event deletion
- [ ] Rate limit bulk operations (5 req/min)
- [ ] Audit log for all event modifications

## Accessibility

- [ ] Keyboard shortcuts documented
- [ ] Screen reader announces action results
- [ ] Focus management for modals
- [ ] ARIA labels for status badges
- [ ] High contrast mode for status indicators

## Success Metrics

- **Target**: 90% of organizers use management interface weekly
- **Target**: Average time to create event <5 minutes
- **Target**: 60% use quick actions menu
- **Target**: 40% use duplicate/template features

## Definition of Done

- [ ] All acceptance criteria met
- [ ] All actions work correctly
- [ ] Unit tests pass (>80% coverage)
- [ ] Integration tests pass
- [ ] E2E tests pass
- [ ] Performance benchmarks met
- [ ] Security audit completed
- [ ] Accessibility audit passed
- [ ] Code reviewed and approved
- [ ] QA sign-off received
- [ ] Product Owner acceptance

## Notes

- Consider adding drag-and-drop event reordering
- Future: Event series management
- Consider adding event cloning across organizations
- Monitor bulk operation performance