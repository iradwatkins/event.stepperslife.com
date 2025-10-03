# Story: EV-012 - Multi-Session Events

**Epic**: EPIC-005 - Advanced Event Features
**Story Points**: 5
**Priority**: P1 (High)
**Status**: Draft
**Dependencies**: EV-001 (Basic Event Creation), EV-002 (Ticket Types), EV-011 (Recurring Events)

---

## Story

**As an** event organizer
**I want to** create events with multiple independent sessions/dates
**So that** I can manage workshops, conferences, or training programs where attendees can choose specific sessions

---

## Context & Business Value

Multi-session events are critical for:
- **Workshop Series**: 3-day photography workshop where each day is independent
- **Conferences**: Multi-track events where attendees pick sessions
- **Training Programs**: Course schedules with multiple class times
- **Film Festivals**: Multiple screenings at different times
- **Fitness Classes**: Same class offered multiple times per week

**Difference from Recurring Events (EV-011)**:
- Recurring events: Same event repeating (Weekly Yoga - every Monday)
- Multi-session: Single event with multiple sub-events (Photography Workshop - Day 1, Day 2, Day 3)

**Revenue Impact**: Multi-session events typically generate 40-60% more revenue than single-session events through:
- Full-package pricing
- Individual session sales
- Upsell opportunities

---

## Acceptance Criteria

### AC-1: Session Configuration During Event Creation

**GIVEN** I am creating a new event
**WHEN** I select "Multi-Session Event" type
**THEN** I should see session management interface with:
- "Add Session" button
- Session list with reorder capability
- Option to set event as "Multi-session required" or "Session-choice"
**AND** Each session should allow configuration of:
- Session name/title (e.g., "Day 1: Basics", "Track A", "Morning Session")
- Session description (optional)
- Start date and time
- End date and time
- Session-specific capacity limit
- Session location (if different from main venue)
- Session-specific media (optional)

**Example Configuration**:
```
Event: "Web Development Bootcamp"
├── Session 1: "HTML & CSS Fundamentals" (Mon 9am-5pm, capacity: 50)
├── Session 2: "JavaScript Essentials" (Wed 9am-5pm, capacity: 50)
└── Session 3: "React Framework" (Fri 9am-5pm, capacity: 40)
```

### AC-2: Session-Based Ticketing Strategy

**GIVEN** I have configured multiple sessions for an event
**WHEN** I set up ticket types
**THEN** I should have the following ticketing options:

**Option A: Full Pass Required**
- Single ticket type grants access to ALL sessions
- Example: "Full Bootcamp Pass - $299 (All 3 Days)"
- Attendee registered for all sessions automatically

**Option B: Individual Session Tickets**
- Separate ticket type for each session
- Example: "Day 1 Only - $120", "Day 2 Only - $120", "Day 3 Only - $120"
- Attendee picks which sessions to attend

**Option C: Hybrid Model (Most Common)**
- "Full Pass" ticket type (discounted bundle)
- Individual session tickets (à la carte pricing)
- Example:
  - Full Pass: $299 (save $61)
  - Day 1: $120
  - Day 2: $120
  - Day 3: $120
- System prevents double-booking same session

**AND** Each ticket type can specify:
- Which sessions it grants access to
- Whether capacity counts toward session limit
- Whether ticket shows all sessions or only purchased ones

### AC-3: Session Capacity Management

**GIVEN** I have sessions with individual capacity limits
**WHEN** tickets are purchased
**THEN** system should:
- Track capacity per session independently
- Prevent overselling individual sessions
- Show "Session Full" for sold-out sessions while other sessions remain available
- Update capacity in real-time during checkout

**GIVEN** I sell both full passes and individual session tickets
**WHEN** calculating available capacity
**THEN** system should:
- Reserve capacity across ALL sessions for full pass purchases
- Reserve capacity only for specific session when individual ticket purchased
- Display accurate "spots remaining" for each session type

**Example Scenario**:
```
Session 1: Capacity 50
- 30 full passes sold (30 spots reserved)
- 15 individual tickets sold
- Available: 5 spots
- Status: Low Availability

Session 2: Capacity 50
- 30 full passes sold (30 spots reserved)
- 5 individual tickets sold
- Available: 15 spots
- Status: Available
```

### AC-4: Customer Session Selection Experience

**GIVEN** I am an attendee viewing a multi-session event
**WHEN** I view the event details page
**THEN** I should see:
- Clear indication this is a multi-session event
- List or calendar view of all sessions
- Capacity status for each session
- Available ticket types (Full Pass vs Individual)
- Pricing comparison (show savings for full pass)

**WHEN** I select ticket type
**THEN** I should see:
- If Full Pass: Confirmation that I'm registered for all sessions
- If Individual: Session selector checkboxes/dropdown
- Real-time price calculation
- Session conflict warnings (if applicable)

**WHEN** I complete purchase
**THEN** I should receive:
- Confirmation showing which sessions I'm registered for
- Individual QR codes for each session (or single QR with session list)
- Calendar invites for each session (optional)
- Session-specific details (location, time, requirements)

### AC-5: Organizer Session Management Dashboard

**GIVEN** I am managing a multi-session event
**WHEN** I view the event dashboard
**THEN** I should see:
- Overview of all sessions with key metrics
- Per-session registration counts
- Per-session capacity utilization
- Revenue breakdown by session
- Full pass vs individual ticket ratio

**AND** I should be able to:
- Modify individual session details
- Cancel/postpone specific sessions
- Add new sessions to existing event
- Adjust per-session capacity
- Export session-specific attendee lists

**Session Dashboard Metrics Example**:
```
╔═══════════════════════════════════════════════╗
║ Web Development Bootcamp - Session Overview  ║
╠═══════════════════════════════════════════════╣
║ Session 1: HTML & CSS                         ║
║ • Registered: 45/50 (90%)                     ║
║ • Full Pass: 30 | Individual: 15              ║
║ • Revenue: $5,100                             ║
║ • Status: ✓ On Schedule                       ║
╠═══════════════════════════════════════════════╣
║ Session 2: JavaScript                         ║
║ • Registered: 35/50 (70%)                     ║
║ • Full Pass: 30 | Individual: 5               ║
║ • Revenue: $3,600                             ║
║ • Status: ✓ On Schedule                       ║
╠═══════════════════════════════════════════════╣
║ Session 3: React Framework                    ║
║ • Registered: 32/40 (80%)                     ║
║ • Full Pass: 30 | Individual: 2               ║
║ • Revenue: $3,240                             ║
║ • Status: ⚠ Low Individual Sales              ║
╚═══════════════════════════════════════════════╝
Total Revenue: $11,940
Full Passes: 30 ($8,970) | Individual: 22 ($2,970)
```

### AC-6: Session Check-In Workflow

**GIVEN** I am checking in attendees at a multi-session event
**WHEN** I scan an attendee's QR code
**THEN** system should:
- Display all sessions attendee is registered for
- Show which sessions already checked in
- Allow check-in for current session only
- Prevent check-in for future sessions
- Flag attendees trying to access sessions they didn't purchase

**WHEN** attendee has full pass
**THEN** check-in should:
- Work for any session at any time
- Track which sessions actually attended
- Update attendance analytics per session

**WHEN** attendee has individual session ticket
**THEN** check-in should:
- Only work for purchased sessions
- Show "Not Registered" warning for other sessions
- Offer on-site upgrade option (if capacity available)

---

## Tasks / Subtasks

### Phase 1: Data Model & Core Logic (8 hours)

- [ ] **Update Event Schema** (AC-1)
  - [ ] Add `isMultiSession` boolean to Event model
  - [ ] Add `sessionSelectionMode` enum (REQUIRED_ALL, CHOOSE_ANY, HYBRID)
  - [ ] Create EventSession model with fields:
    - `id`, `eventId`, `name`, `description`
    - `startTime`, `endTime`, `timezone`
    - `maxCapacity`, `registeredCount`
    - `location` (optional override), `metadata`
  - [ ] Add indexes for performance
  - [ ] Create migration

- [ ] **Update Ticket Type Schema** (AC-2)
  - [ ] Add `sessionIds` array to TicketType (which sessions this ticket grants access to)
  - [ ] Add `isFullPass` boolean flag
  - [ ] Add `requiresSessionSelection` boolean
  - [ ] Update validation rules

- [ ] **Create Session Capacity Service** (AC-3)
  - [ ] `calculateSessionAvailability(sessionId)` - real-time capacity check
  - [ ] `reserveSessionCapacity(sessionId, quantity, ticketTypeId)` - atomic reservation
  - [ ] `releaseSessionCapacity(sessionId, quantity)` - handle cancellations
  - [ ] `getSessionCapacityStatus(eventId)` - dashboard overview
  - [ ] Implement race condition prevention with database locks

### Phase 2: API Endpoints (6 hours)

- [ ] **Session Management APIs** (AC-1, AC-5)
  - [ ] `POST /api/events/:eventId/sessions` - Create session
  - [ ] `GET /api/events/:eventId/sessions` - List all sessions
  - [ ] `PATCH /api/events/:eventId/sessions/:sessionId` - Update session
  - [ ] `DELETE /api/events/:eventId/sessions/:sessionId` - Delete session (with validation)
  - [ ] `GET /api/events/:eventId/sessions/:sessionId/attendees` - Session attendee list

- [ ] **Session Purchase APIs** (AC-4)
  - [ ] Update `POST /api/events/:eventId/purchase` to handle:
    - Session selection payload
    - Session capacity validation
    - Multi-session ticket generation
  - [ ] `GET /api/events/:eventId/sessions/availability` - Real-time availability check

- [ ] **Session Check-In APIs** (AC-6)
  - [ ] Update `POST /api/events/:eventId/checkin` to handle:
    - Session-specific check-in
    - Session access validation
    - Multi-session attendance tracking

### Phase 3: Organizer UI Components (10 hours)

- [ ] **Session Configuration Component** (AC-1)
  - [ ] `SessionManager.tsx` - Main session management interface
  - [ ] `SessionForm.tsx` - Add/edit session form with validation
  - [ ] `SessionList.tsx` - Sortable list with drag-drop reordering
  - [ ] `SessionCapacityInput.tsx` - Capacity configuration with warnings
  - [ ] Add session preview with timeline visualization

- [ ] **Session Ticketing Setup** (AC-2)
  - [ ] Enhance `TicketTypeForm.tsx` to include:
    - Session selection multi-select
    - Full pass toggle
    - Pricing calculator showing per-session value
  - [ ] Add validation for session-ticket mapping

- [ ] **Session Dashboard Components** (AC-5)
  - [ ] `SessionOverviewCard.tsx` - Individual session metrics
  - [ ] `SessionAnalytics.tsx` - Comparative session performance
  - [ ] `SessionAttendeeList.tsx` - Per-session registrations
  - [ ] `SessionRevenueChart.tsx` - Revenue breakdown visualization

### Phase 4: Customer-Facing UI (8 hours)

- [ ] **Event Details Page Enhancements** (AC-4)
  - [ ] `SessionSchedule.tsx` - Display all sessions with timeline
  - [ ] `SessionSelector.tsx` - Interactive session picker for individual tickets
  - [ ] `FullPassComparison.tsx` - Show savings calculator
  - [ ] `SessionCapacityBadge.tsx` - Real-time availability indicators
  - [ ] Add calendar view option

- [ ] **Checkout Flow Updates** (AC-4)
  - [ ] Update `TicketSelection.tsx` to handle session selection
  - [ ] Add session confirmation step
  - [ ] Display selected sessions in cart
  - [ ] Session conflict detection and warnings

- [ ] **Purchase Confirmation** (AC-4)
  - [ ] Display registered sessions clearly
  - [ ] Generate session-specific calendar invites
  - [ ] Show session-specific details (location, requirements)

### Phase 5: Check-In Experience (4 hours)

- [ ] **Session Check-In Interface** (AC-6)
  - [ ] Update `CheckInScanner.tsx` to show session context
  - [ ] `SessionAccessValidator.tsx` - Real-time session access check
  - [ ] `AttendeeSessionList.tsx` - Display attendee's registered sessions
  - [ ] Add session upgrade prompt for unauthorized sessions

### Phase 6: Testing & Polish (6 hours)

- [ ] Write unit tests for session capacity logic
- [ ] Write integration tests for session booking flow
- [ ] E2E test: Create multi-session event end-to-end
- [ ] E2E test: Purchase full pass vs individual sessions
- [ ] E2E test: Session check-in workflow
- [ ] Test edge cases: overselling prevention, concurrent bookings
- [ ] Performance test: Event with 50+ sessions
- [ ] Accessibility audit for session selection UI

---

## Technical Design

### Database Schema Extensions

```prisma
model Event {
  // ... existing fields
  isMultiSession       Boolean  @default(false)
  sessionSelectionMode SessionMode @default(REQUIRED_ALL)
  sessions             EventSession[]
}

model EventSession {
  id               String    @id @default(uuid())
  eventId          String
  event            Event     @relation(fields: [eventId], references: [id], onDelete: Cascade)

  // Session Details
  name             String
  description      String?   @db.Text
  startTime        DateTime
  endTime          DateTime
  timezone         String    @default("America/New_York")

  // Capacity Management
  maxCapacity      Int?
  registeredCount  Int       @default(0)

  // Location (override event location if needed)
  locationName     String?
  locationAddress  String?

  // Metadata
  sortOrder        Int       @default(0)
  metadata         Json?     @default("{}")

  // Status
  isActive         Boolean   @default(true)
  isCancelled      Boolean   @default(false)

  // Relations
  ticketTypes      TicketType[] @relation("SessionTicketTypes")
  checkins         SessionCheckIn[]

  createdAt        DateTime  @default(now())
  updatedAt        DateTime  @updatedAt

  @@index([eventId, startTime])
  @@index([eventId, isActive])
  @@map("event_sessions")
}

// Update TicketType model
model TicketType {
  // ... existing fields
  sessionIds       String[]  @default([])  // IDs of sessions this ticket grants access to
  isFullPass       Boolean   @default(false)
  requiresSessionSelection Boolean @default(false)
  sessions         EventSession[] @relation("SessionTicketTypes")
}

// Update Ticket model for session tracking
model Ticket {
  // ... existing fields
  sessionIds       String[]  @default([])  // Sessions this ticket is valid for
  sessionCheckins  SessionCheckIn[]
}

model SessionCheckIn {
  id               String    @id @default(uuid())
  sessionId        String
  ticketId         String

  session          EventSession @relation(fields: [sessionId], references: [id])
  ticket           Ticket    @relation(fields: [ticketId], references: [id])

  checkedInAt      DateTime  @default(now())
  checkedInBy      String?
  checkInMethod    CheckInMethod?

  @@unique([sessionId, ticketId])
  @@index([sessionId])
  @@index([ticketId])
  @@map("session_checkins")
}

enum SessionMode {
  REQUIRED_ALL      // Must attend all sessions (full pass only)
  CHOOSE_ANY        // Can pick and choose sessions
  HYBRID            // Both full pass and individual options
}
```

### Session Capacity Algorithm

```typescript
// lib/services/session-capacity.service.ts

interface SessionCapacityCheck {
  sessionId: string;
  available: number;
  reserved: number;
  total: number;
  percentage: number;
  status: 'AVAILABLE' | 'LOW' | 'FULL';
}

class SessionCapacityService {
  /**
   * Check real-time availability for a session
   * Accounts for full passes and individual session tickets
   */
  async checkAvailability(sessionId: string): Promise<SessionCapacityCheck> {
    const session = await prisma.eventSession.findUnique({
      where: { id: sessionId },
      include: {
        event: {
          include: {
            ticketTypes: true,
            tickets: {
              where: {
                sessionIds: { has: sessionId },
                status: { in: ['VALID', 'USED'] }
              }
            }
          }
        }
      }
    });

    if (!session || !session.maxCapacity) {
      throw new Error('Session not found or no capacity limit set');
    }

    // Count tickets that grant access to this session
    const reserved = session.event.tickets.filter(ticket =>
      ticket.sessionIds.includes(sessionId)
    ).length;

    const available = session.maxCapacity - reserved;
    const percentage = (reserved / session.maxCapacity) * 100;

    let status: 'AVAILABLE' | 'LOW' | 'FULL';
    if (available === 0) status = 'FULL';
    else if (percentage >= 90) status = 'LOW';
    else status = 'AVAILABLE';

    return {
      sessionId,
      available,
      reserved,
      total: session.maxCapacity,
      percentage,
      status
    };
  }

  /**
   * Atomic reservation of session capacity
   * Uses database transaction to prevent race conditions
   */
  async reserveCapacity(
    sessionIds: string[],
    quantity: number,
    ticketTypeId: string
  ): Promise<boolean> {
    return await prisma.$transaction(async (tx) => {
      // Check all sessions have capacity
      for (const sessionId of sessionIds) {
        const session = await tx.eventSession.findUnique({
          where: { id: sessionId },
          select: { maxCapacity: true, registeredCount: true }
        });

        if (!session) throw new Error(`Session ${sessionId} not found`);

        if (session.maxCapacity) {
          const available = session.maxCapacity - session.registeredCount;
          if (available < quantity) {
            throw new Error(`Insufficient capacity for session ${sessionId}`);
          }
        }
      }

      // Reserve capacity for all sessions
      await tx.eventSession.updateMany({
        where: { id: { in: sessionIds } },
        data: { registeredCount: { increment: quantity } }
      });

      return true;
    });
  }

  /**
   * Release capacity when tickets are cancelled/refunded
   */
  async releaseCapacity(sessionIds: string[], quantity: number): Promise<void> {
    await prisma.eventSession.updateMany({
      where: { id: { in: sessionIds } },
      data: { registeredCount: { decrement: quantity } }
    });
  }
}
```

### Session Selection UI Flow

```typescript
// components/events/SessionSelector.tsx

interface SessionSelectorProps {
  event: Event & { sessions: EventSession[] };
  ticketType: TicketType;
  onSessionsChange: (sessionIds: string[]) => void;
}

export function SessionSelector({ event, ticketType, onSessionsChange }: SessionSelectorProps) {
  const [selectedSessions, setSelectedSessions] = useState<string[]>([]);
  const [availability, setAvailability] = useState<Map<string, SessionCapacityCheck>>(new Map());

  // Load real-time availability
  useEffect(() => {
    async function loadAvailability() {
      const checks = await Promise.all(
        event.sessions.map(s => checkSessionAvailability(s.id))
      );
      setAvailability(new Map(checks.map(c => [c.sessionId, c])));
    }
    loadAvailability();
    // Poll every 30 seconds
    const interval = setInterval(loadAvailability, 30000);
    return () => clearInterval(interval);
  }, [event.sessions]);

  const handleSessionToggle = (sessionId: string) => {
    const capacity = availability.get(sessionId);
    if (capacity?.status === 'FULL') {
      toast.error('This session is sold out');
      return;
    }

    const newSelection = selectedSessions.includes(sessionId)
      ? selectedSessions.filter(id => id !== sessionId)
      : [...selectedSessions, sessionId];

    setSelectedSessions(newSelection);
    onSessionsChange(newSelection);
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Select Sessions</h3>
      {event.sessions.map(session => {
        const capacity = availability.get(session.id);
        const isSelected = selectedSessions.includes(session.id);
        const isFull = capacity?.status === 'FULL';

        return (
          <div key={session.id} className="border rounded-lg p-4">
            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => handleSessionToggle(session.id)}
                disabled={isFull && !isSelected}
                className="mt-1"
              />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">{session.name}</h4>
                  <SessionCapacityBadge capacity={capacity} />
                </div>
                <p className="text-sm text-gray-600">
                  {formatDateTime(session.startTime)} - {formatDateTime(session.endTime)}
                </p>
                {session.description && (
                  <p className="text-sm mt-2">{session.description}</p>
                )}
              </div>
            </label>
          </div>
        );
      })}
    </div>
  );
}
```

---

## Edge Cases & Business Rules

### 1. Session Capacity Conflicts
- **Rule**: Full pass reservations reduce capacity for ALL included sessions
- **Edge Case**: What if Session A is full but full pass includes it?
- **Solution**: Prevent full pass sales when ANY included session is at capacity

### 2. Session Cancellation Mid-Series
- **Rule**: If organizer cancels one session, attendees keep access to other sessions
- **Process**:
  1. Notify all registered attendees for cancelled session
  2. Offer partial refund for cancelled session only
  3. Offer full refund if they want to cancel entire registration
  4. Update ticket metadata to show cancelled session

### 3. Pricing Strategy Validation
- **Rule**: Full pass must be equal to or less than sum of individual sessions
- **Validation**: System warns if full pass price > individual sum
- **Recommendation**: Suggest 10-20% discount for full pass

### 4. Session Time Conflicts
- **Detection**: Check if sessions overlap in time
- **UI**: Show conflict warning but allow (some events have parallel tracks)
- **Option**: Add "track" concept for multi-track events

### 5. Last-Minute Session Changes
- **Rule**: Cannot delete session with existing registrations
- **Alternative**: Mark as cancelled, trigger refund workflow
- **Data Integrity**: Preserve session data for historical records

---

## Integration Points

### Integrates With:
- **EV-001 (Event Creation)**: Extends event creation flow
- **EV-002 (Ticket Types)**: Session-based ticketing
- **EV-011 (Recurring Events)**: Sessions vs recurring series distinction
- **PAY-001 (Payment Processing)**: Multi-session purchase handling
- **TKT-001 (Ticket Generation)**: Session-aware QR codes
- **CHK-001 (Check-In)**: Session-specific check-in logic

### Impacts:
- Event creation wizard
- Ticket purchase flow
- Check-in application
- Event dashboard analytics
- Email notifications
- Calendar integrations

---

## Dev Notes

### Performance Considerations

1. **Session Listing Query Optimization**
   - Use `include` strategically to avoid N+1 queries
   - Index on `eventId + startTime` for sorted session queries
   - Cache session availability for 30-60 seconds

2. **Capacity Check Race Conditions**
   - MUST use database transactions for capacity reservation
   - Implement optimistic locking for high-traffic events
   - Consider Redis for real-time capacity counters

3. **Dashboard Performance**
   - Pre-calculate session metrics in background job
   - Cache dashboard data with 5-minute TTL
   - Use database views for complex session analytics

### Migration Strategy

**For Existing Events**:
1. All existing events have `isMultiSession = false`
2. No breaking changes to existing ticket types
3. Organizers can convert existing event to multi-session (admin only)

**For New Installations**:
- Multi-session is available from day one
- Clear documentation on when to use multi-session vs recurring

### Monitoring & Alerts

- Alert if session capacity conflicts detected
- Monitor session booking latency
- Track session conversion rates (full pass vs individual)
- Alert on session overselling (should never happen)

---

## Testing

### Unit Tests
```typescript
describe('SessionCapacityService', () => {
  it('should calculate available capacity correctly', async () => {
    // Test capacity calculation logic
  });

  it('should prevent overbooking with concurrent requests', async () => {
    // Test race condition prevention
  });

  it('should release capacity on ticket cancellation', async () => {
    // Test capacity release
  });
});
```

### Integration Tests
```typescript
describe('Multi-Session Event Purchase', () => {
  it('should create tickets for all selected sessions', async () => {
    // Test end-to-end session ticket creation
  });

  it('should reject purchase when session is full', async () => {
    // Test capacity enforcement
  });
});
```

### E2E Tests
- Create multi-session event with 3 sessions
- Purchase full pass and verify all sessions assigned
- Purchase individual sessions and verify correct assignment
- Attempt to purchase sold-out session and verify rejection
- Check in to specific session and verify attendance tracking

---

## Success Metrics

- **Adoption Rate**: 20% of events should be multi-session within 3 months
- **Revenue Increase**: Multi-session events generate 40%+ more revenue on average
- **Full Pass Conversion**: 60%+ of multi-session attendees purchase full pass
- **Session Utilization**: Average 80%+ capacity across all sessions
- **Error Rate**: <0.1% capacity conflicts or overselling incidents

---

## Change Log

| Date | Version | Description | Author |
|------|---------|-------------|---------|
| 2025-09-30 | 1.0 | Initial story creation | BMAD SM Agent |

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