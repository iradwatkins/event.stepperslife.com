# ORG-004: Basic Attendee List

**Epic:** EPIC-007 - Organizer Dashboard & Analytics
**Story Points:** 2
**Priority:** Medium
**Status:** Ready for Development

## User Story
As an **event organizer**
I want to **view a list of attendees with basic information**
So that **I can see who's coming to my event and contact them if needed**

## Acceptance Criteria

### AC1: Attendee List Display
- [ ] Table displays all attendees for selected event
- [ ] Columns: Name, Email, Ticket Type, Order Date, Check-in Status, Actions
- [ ] Sortable by any column (ascending/descending)
- [ ] Default sort: Order date (newest first)
- [ ] Responsive design (stack columns on mobile)

### AC2: Search and Filter
- [ ] Search bar filters by name or email (real-time)
- [ ] Filter by ticket type (dropdown multi-select)
- [ ] Filter by check-in status (All, Checked-in, Not checked-in)
- [ ] Filter by order date range
- [ ] "Clear all filters" button
- [ ] Display active filter count badge

### AC3: Pagination
- [ ] Display 25, 50, or 100 attendees per page
- [ ] Show total count: "Showing 1-25 of 156 attendees"
- [ ] Previous/Next buttons with page numbers
- [ ] Jump to specific page
- [ ] Persist pagination settings in URL

### AC4: Attendee Details
- [ ] Click row to expand inline details panel
- [ ] Details show: Full name, email, phone (if provided), ticket type, order ID, purchase date, check-in time
- [ ] "View Full Order" button links to order details
- [ ] "Send Email" button opens email modal
- [ ] "Check In" button (if not checked in)

### AC5: Bulk Actions
- [ ] Select individual attendees via checkboxes
- [ ] "Select All" checkbox in header
- [ ] Bulk check-in selected attendees
- [ ] Bulk send email to selected
- [ ] Bulk export selected to CSV
- [ ] Show count of selected attendees

### AC6: Export Functionality
- [ ] "Export CSV" button exports all attendees (respects filters)
- [ ] CSV includes: Name, Email, Phone, Ticket Type, Quantity, Order Date, Check-in Status, Check-in Time
- [ ] File name format: `{event-name}-attendees-{date}.csv`
- [ ] Download starts immediately
- [ ] Handle large exports (10,000+ attendees) without timeout

### AC7: Quick Stats
- [ ] Display summary cards above table:
  - Total Attendees (ticket holders)
  - Checked In count and percentage
  - No-shows count
  - Pending check-ins
- [ ] Stats update when filters applied

## Technical Implementation

### Frontend Components
```typescript
// /components/dashboard/AttendeeList.tsx
interface AttendeeListProps {
  eventId: string;
}

interface Attendee {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone?: string;
  ticketType: string;
  ticketTypeId: string;
  quantity: number;
  orderId: string;
  orderDate: Date;
  isCheckedIn: boolean;
  checkedInAt?: Date;
  qrCode: string;
}

interface AttendeeListFilters {
  searchQuery: string;
  ticketTypes: string[];
  checkInStatus: 'all' | 'checked-in' | 'not-checked-in';
  dateRange?: { start: Date; end: Date };
}

// Component Structure
- AttendeeList (container)
  - AttendeeStats (summary cards)
  - AttendeeFilters
    - SearchBar
    - TicketTypeFilter
    - CheckInStatusFilter
    - DateRangeFilter
  - AttendeeTable
    - AttendeeRow (expandable)
      - AttendeeDetails (inline panel)
    - BulkActions toolbar
  - Pagination
  - ExportButton
```

### Backend API
```typescript
// /app/api/events/[eventId]/attendees/route.ts
GET /api/events/[eventId]/attendees
  ?page=1
  &limit=25
  &search={query}
  &ticketTypes={ids}
  &checkInStatus={status}
  &sortBy={field}
  &sortOrder={asc|desc}

Response: {
  success: true,
  data: {
    attendees: [
      {
        id: "att_123",
        userId: "usr_456",
        name: "John Doe",
        email: "john@example.com",
        phone: "+1234567890",
        ticketType: "VIP",
        ticketTypeId: "tt_789",
        quantity: 2,
        orderId: "ord_321",
        orderDate: "2025-09-15T10:30:00Z",
        isCheckedIn: true,
        checkedInAt: "2025-09-30T18:45:00Z",
        qrCode: "QR_CODE_DATA"
      },
      ...
    ],
    pagination: {
      page: 1,
      limit: 25,
      total: 156,
      totalPages: 7
    },
    stats: {
      totalAttendees: 156,
      checkedIn: 120,
      notCheckedIn: 36,
      checkInRate: 0.769
    }
  }
}
```

### Database Service
```typescript
// /lib/services/attendee.service.ts
export class AttendeeService {
  async getAttendees(
    eventId: string,
    filters: AttendeeListFilters,
    pagination: { page: number; limit: number },
    sort: { field: string; order: 'asc' | 'desc' }
  ) {
    // Build where clause
    const where: Prisma.TicketWhereInput = {
      eventId,
      status: 'ACTIVE',
      ...(filters.searchQuery && {
        OR: [
          { user: { firstName: { contains: filters.searchQuery, mode: 'insensitive' } } },
          { user: { lastName: { contains: filters.searchQuery, mode: 'insensitive' } } },
          { user: { email: { contains: filters.searchQuery, mode: 'insensitive' } } }
        ]
      }),
      ...(filters.ticketTypes.length > 0 && {
        ticketTypeId: { in: filters.ticketTypes }
      }),
      ...(filters.checkInStatus === 'checked-in' && {
        checkIns: { some: {} }
      }),
      ...(filters.checkInStatus === 'not-checked-in' && {
        checkIns: { none: {} }
      })
    };

    // Get total count
    const total = await prisma.ticket.count({ where });

    // Get paginated tickets
    const tickets = await prisma.ticket.findMany({
      where,
      include: {
        user: true,
        ticketType: true,
        order: true,
        checkIns: {
          orderBy: { checkedInAt: 'desc' },
          take: 1
        }
      },
      orderBy: this.buildOrderBy(sort.field, sort.order),
      skip: (pagination.page - 1) * pagination.limit,
      take: pagination.limit
    });

    // Format attendees
    const attendees = tickets.map(ticket => ({
      id: ticket.id,
      userId: ticket.userId,
      name: `${ticket.user.firstName} ${ticket.user.lastName}`,
      email: ticket.user.email,
      phone: ticket.user.phone,
      ticketType: ticket.ticketType.name,
      ticketTypeId: ticket.ticketTypeId,
      quantity: 1, // Each ticket is one attendee
      orderId: ticket.orderId,
      orderDate: ticket.order.createdAt,
      isCheckedIn: ticket.checkIns.length > 0,
      checkedInAt: ticket.checkIns[0]?.checkedInAt,
      qrCode: ticket.qrCode
    }));

    // Calculate stats
    const stats = await this.calculateStats(eventId, where);

    return {
      attendees,
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total,
        totalPages: Math.ceil(total / pagination.limit)
      },
      stats
    };
  }

  private async calculateStats(eventId: string, where: Prisma.TicketWhereInput) {
    const totalAttendees = await prisma.ticket.count({
      where: { eventId, status: 'ACTIVE' }
    });

    const checkedIn = await prisma.ticket.count({
      where: { eventId, status: 'ACTIVE', checkIns: { some: {} } }
    });

    return {
      totalAttendees,
      checkedIn,
      notCheckedIn: totalAttendees - checkedIn,
      checkInRate: totalAttendees > 0 ? checkedIn / totalAttendees : 0
    };
  }

  private buildOrderBy(field: string, order: 'asc' | 'desc') {
    const orderMap: Record<string, any> = {
      name: { user: { firstName: order } },
      email: { user: { email: order } },
      ticketType: { ticketType: { name: order } },
      orderDate: { order: { createdAt: order } },
      checkInStatus: { checkIns: { _count: order } }
    };

    return orderMap[field] || { order: { createdAt: order } };
  }

  async exportAttendees(
    eventId: string,
    filters: AttendeeListFilters
  ): Promise<string> {
    // Get all attendees (no pagination)
    const { attendees } = await this.getAttendees(
      eventId,
      filters,
      { page: 1, limit: 100000 }, // Max export
      { field: 'orderDate', order: 'desc' }
    );

    // Generate CSV
    const csv = this.generateCSV(attendees);
    return csv;
  }

  private generateCSV(attendees: Attendee[]): string {
    const headers = ['Name', 'Email', 'Phone', 'Ticket Type', 'Quantity', 'Order Date', 'Check-in Status', 'Check-in Time'];
    const rows = attendees.map(a => [
      a.name,
      a.email,
      a.phone || '',
      a.ticketType,
      a.quantity,
      format(a.orderDate, 'yyyy-MM-dd HH:mm'),
      a.isCheckedIn ? 'Checked In' : 'Not Checked In',
      a.checkedInAt ? format(a.checkedInAt, 'yyyy-MM-dd HH:mm') : ''
    ]);

    return [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');
  }
}
```

### State Management Hook
```typescript
// /lib/hooks/useAttendeeList.ts
export function useAttendeeList(eventId: string) {
  const [filters, setFilters] = useState<AttendeeListFilters>({
    searchQuery: '',
    ticketTypes: [],
    checkInStatus: 'all',
    dateRange: undefined
  });

  const [pagination, setPagination] = useState({ page: 1, limit: 25 });
  const [sort, setSort] = useState({ field: 'orderDate', order: 'desc' as const });
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Build query parameters
  const queryParams = new URLSearchParams({
    page: pagination.page.toString(),
    limit: pagination.limit.toString(),
    search: filters.searchQuery,
    ticketTypes: filters.ticketTypes.join(','),
    checkInStatus: filters.checkInStatus,
    sortBy: sort.field,
    sortOrder: sort.order
  });

  const { data, error, isLoading, mutate } = useSWR(
    `/api/events/${eventId}/attendees?${queryParams}`,
    fetcher
  );

  const handleSearch = useDebounce((query: string) => {
    setFilters(prev => ({ ...prev, searchQuery: query }));
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to page 1
  }, 300);

  const handleSort = (field: string) => {
    setSort(prev => ({
      field,
      order: prev.field === field && prev.order === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = new Set(data?.attendees.map((a: Attendee) => a.id));
      setSelectedIds(allIds);
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleBulkCheckIn = async () => {
    try {
      await fetch(`/api/events/${eventId}/checkin/bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketIds: Array.from(selectedIds) })
      });
      mutate(); // Refresh data
      setSelectedIds(new Set());
    } catch (error) {
      console.error('Bulk check-in failed:', error);
    }
  };

  const handleExport = async () => {
    try {
      const response = await fetch(`/api/events/${eventId}/attendees/export?${queryParams}`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `attendees-${eventId}-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      a.click();
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  return {
    data,
    error,
    isLoading,
    filters,
    setFilters,
    pagination,
    setPagination,
    sort,
    handleSort,
    selectedIds,
    setSelectedIds,
    handleSelectAll,
    handleBulkCheckIn,
    handleExport,
    handleSearch
  };
}
```

## UI/UX Design

### Layout
```
┌─────────────────────────────────────────────────────────────┐
│ Attendee List - Summer Dance Festival                      │
│                                                              │
│ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐               │
│ │ Total  │ │Checked │ │  Not   │ │Check-in│               │
│ │  156   │ │  120   │ │   36   │ │ 76.9%  │               │
│ └────────┘ └────────┘ └────────┘ └────────┘               │
│                                                              │
│ 🔍 Search by name or email...  [Ticket Type ▼] [Status ▼]│
│ Active Filters: 2  [Clear All]           [Export CSV]     │
│                                                              │
│ Bulk Actions: [✓ Check In] [✉ Send Email]  (3 selected)  │
│                                                              │
│ ┌──────────────────────────────────────────────────────────┐│
│ │☐│Name      │Email         │Ticket│Order Date│Status    ││
│ ├──────────────────────────────────────────────────────────┤│
│ │☑│John Doe  │john@mail.com │VIP   │Sep 15    │✓Checked  ││
│ │☐│Jane Smith│jane@mail.com │Gen   │Sep 16    │○Pending  ││
│ │☑│Bob Wilson│bob@mail.com  │VIP   │Sep 17    │✓Checked  ││
│ │☐│...       │...           │...   │...       │...       ││
│ └──────────────────────────────────────────────────────────┘│
│                                                              │
│ Showing 1-25 of 156 | [< Prev] 1 2 3 4 5 6 7 [Next >]     │
│ Per page: [25 ▼]                                           │
└─────────────────────────────────────────────────────────────┘
```

### Expanded Row Details
```
┌─────────────────────────────────────────────────────────────┐
│ ☑ John Doe | john@example.com | VIP | Sep 15 | ✓Checked   │
├─────────────────────────────────────────────────────────────┤
│ Full Details:                                               │
│ • Full Name: John Michael Doe                              │
│ • Email: john@example.com                                  │
│ • Phone: +1 (555) 123-4567                                 │
│ • Ticket Type: VIP Pass                                    │
│ • Order ID: ORD-2025-001234                                │
│ • Purchase Date: Sep 15, 2025 at 10:30 AM                 │
│ • Check-in Time: Sep 30, 2025 at 6:45 PM                  │
│ • QR Code: [QR Code Image]                                 │
│                                                              │
│ [View Full Order] [Send Email] [Generate Badge]            │
└─────────────────────────────────────────────────────────────┘
```

## Integration Points

### Dependencies
- **EPIC-004**: Ticket data
- **EPIC-003**: Order data
- **EPIC-006**: Check-in system
- **EPIC-002**: Event details

### API Endpoints
```typescript
// Export attendees
GET /api/events/[eventId]/attendees/export

// Bulk check-in
POST /api/events/[eventId]/checkin/bulk
Body: { ticketIds: string[] }

// Send email to attendees
POST /api/events/[eventId]/attendees/email
Body: { attendeeIds: string[], subject: string, message: string }
```

## Performance Requirements

- **Page load**: < 2 seconds for 1,000 attendees
- **Search response**: < 300ms
- **Export**: < 5 seconds for 10,000 attendees
- **Bulk check-in**: < 2 seconds for 100 tickets

### Optimization Strategies
1. **Database Indexing**
   - Index on (eventId, status)
   - Index on (userId, email)
   - Index on ticketTypeId

2. **Virtual Scrolling**
   - Render only visible rows (use react-window)
   - Lazy load row details

3. **Debounced Search**
   - 300ms delay on search input
   - Cancel pending requests

4. **Pagination**
   - Server-side pagination
   - Limit max results to 100 per page

## Testing Requirements

### Unit Tests
```typescript
describe('AttendeeService', () => {
  it('filters attendees by search query', async () => {
    const result = await attendeeService.getAttendees(eventId, {
      searchQuery: 'john',
      ticketTypes: [],
      checkInStatus: 'all'
    }, { page: 1, limit: 25 }, { field: 'name', order: 'asc' });

    expect(result.attendees).toHaveLength(2);
    expect(result.attendees[0].name).toContain('John');
  });

  it('generates CSV export correctly', async () => {
    const csv = await attendeeService.exportAttendees(eventId, {});
    expect(csv).toContain('Name,Email,Phone');
  });
});
```

### Integration Tests
- [ ] Test attendee list API with various filters
- [ ] Test bulk check-in endpoint
- [ ] Test CSV export
- [ ] Test pagination

### E2E Tests
```typescript
test('organizer views and filters attendee list', async ({ page }) => {
  await page.goto(`/dashboard/events/${eventId}/attendees`);

  // Verify attendees loaded
  await expect(page.locator('table tbody tr')).toHaveCount(25);

  // Test search
  await page.fill('input[placeholder*="Search"]', 'john');
  await expect(page.locator('table tbody tr')).toHaveCount(2);

  // Test export
  const downloadPromise = page.waitForEvent('download');
  await page.click('button:has-text("Export CSV")');
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/attendees.*\.csv/);
});
```

## Security Considerations

- [ ] Verify organizer owns event before showing attendees
- [ ] Sanitize search queries to prevent SQL injection
- [ ] Rate limit search requests (20 req/min)
- [ ] Mask sensitive data in logs
- [ ] Validate export file size limits

## Accessibility

- [ ] Table has proper semantic HTML
- [ ] Sortable columns announced to screen readers
- [ ] Keyboard navigation for table rows
- [ ] ARIA labels for filter controls
- [ ] Focus management for expanded rows

## Success Metrics

- **Target**: 75% of organizers view attendee list before event
- **Target**: Average list view duration >2 minutes
- **Target**: 40% use search/filter functionality
- **Target**: 30% export attendee lists

## Definition of Done

- [ ] All acceptance criteria met
- [ ] Table performs well with 10,000+ attendees
- [ ] Search and filters work correctly
- [ ] Export generates valid CSV
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

- Consider adding attendee import functionality
- Future: Advanced filters (age, location, purchase channel)
- Consider adding attendee notes/tags
- Monitor export performance with very large datasets