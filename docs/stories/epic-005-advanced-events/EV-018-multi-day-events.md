# Story: EV-018 - Multi-Day Events

**Epic**: EPIC-005 - Advanced Event Features
**Story Points**: 5
**Priority**: P1 (High)
**Status**: Draft
**Dependencies**: EV-001 (Basic Event Creation), EV-002 (Ticket Types), EV-012 (Multi-Session Events)

---

## Story

**As an** event organizer
**I want to** create events that span multiple consecutive days
**So that** I can manage festivals, conferences, and multi-day experiences with flexible ticketing

**As an** attendee
**I want to** purchase full passes or individual day passes for multi-day events
**So that** I can attend the entire event or just specific days that interest me

---

## Context & Business Value

**Multi-Day Event Types**:
1. **Music Festivals**: 3-day festival with different headliners each day
2. **Conferences**: 2-4 day professional conferences with daily tracks
3. **Trade Shows**: Multi-day exhibitions with rotating exhibits
4. **Outdoor Adventures**: Weekend camping/hiking experiences
5. **Retreats**: Wellness retreats, yoga workshops, spiritual gatherings
6. **Tournaments**: Sports competitions spanning multiple days
7. **Conventions**: Comic cons, gaming conventions, fan events

**Difference from Multi-Session (EV-012)**:
- **Multi-Session**: Single event with sub-events (Workshop Day 1, Day 2, Day 3)
- **Multi-Day**: Event spans consecutive days, treated as unified experience
- **Hybrid Ticketing**: Full weekend pass vs individual day passes

**Business Value**:
- **Higher AOV**: Full passes generate 40-60% more revenue than single-day
- **Attendance**: Multi-day events drive 3-5x more engagement
- **Planning**: Better resource allocation across multiple days
- **Flexibility**: Customers appreciate day-pass options
- **Premium Positioning**: Multi-day events perceived as premium experiences

**Revenue Examples**:
```
Single-Day Festival:
- 500 attendees × $75 = $37,500

3-Day Festival (Traditional):
- 500 attendees × $75 × 3 days = $112,500 (unrealistic)

3-Day Festival (Smart Pricing):
- 300 full passes × $180 = $54,000 (save $45)
- 150 Friday-only × $75 = $11,250
- 100 Saturday-only × $75 = $7,500
- 50 Sunday-only × $75 = $3,750
Total: $76,500 (104% increase over single-day)
```

---

## Acceptance Criteria

### AC-1: Multi-Day Event Configuration

**GIVEN** I am creating a new event
**WHEN** I select "Multi-Day Event" type
**THEN** I should be able to configure:
- Event start date and end date
- Number of days (auto-calculated)
- Per-day details (name, description, schedule)
- Per-day capacity (optional)
- Ticketing strategy (full pass, day passes, or both)
- Per-day pricing structure

**Multi-Day Configuration Interface**:
```
┌─────────────────────────────────────────────────┐
│ Multi-Day Event Setup                            │
├─────────────────────────────────────────────────┤
│ Event Duration:                                  │
│ Start Date: [Aug 15, 2025] [6:00 PM]            │
│ End Date:   [Aug 17, 2025] [11:00 PM]           │
│ Duration: 3 days                                 │
│                                                  │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│ Day Configuration:                               │
│                                                  │
│ ┌─────────────────────────────────────────────┐ │
│ │ Day 1: Friday, August 15                    │ │
│ │ Name: [Opening Night___________________]    │ │
│ │ Time: [6:00 PM] - [12:00 AM]               │ │
│ │ Description: [________________________]      │ │
│ │ Capacity: [2000] (optional per-day limit)   │ │
│ │ [Featured Acts: Rock Legends...]            │ │
│ └─────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────┐ │
│ │ Day 2: Saturday, August 16                  │ │
│ │ Name: [Main Festival Day_______________]    │ │
│ │ Time: [12:00 PM] - [12:00 AM]              │ │
│ │ Capacity: [3000]                            │ │
│ │ [Featured Acts: Pop Stars...]               │ │
│ └─────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────┐ │
│ │ Day 3: Sunday, August 17                    │ │
│ │ Name: [Finale Day______________________]    │ │
│ │ Time: [2:00 PM] - [11:00 PM]               │ │
│ │ Capacity: [2500]                            │ │
│ │ [Featured Acts: Indie Bands...]             │ │
│ └─────────────────────────────────────────────┘ │
│                                                  │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│ Ticketing Strategy:                              │
│ ☑ Full Weekend Pass (all 3 days)                │
│ ☑ Individual Day Passes                         │
│ ☐ 2-Day Combo Passes                            │
└─────────────────────────────────────────────────┘
```

### AC-2: Flexible Ticket Type Configuration

**GIVEN** I have configured a multi-day event
**WHEN** I set up ticket types
**THEN** I should be able to create:

**A. Full Pass (All Days)**
```
Ticket Type: Weekend Pass
Access: All 3 days
Price: $180 (save $45 vs buying separately)
Quantity: 500
Benefits:
  - Full access to all days
  - VIP entry lanes
  - Commemorative wristband
  - Free parking
```

**B. Individual Day Passes**
```
Ticket Type: Friday Only Pass
Access: Day 1 only (Aug 15)
Price: $75
Quantity: 500

Ticket Type: Saturday Only Pass
Access: Day 2 only (Aug 16)
Price: $75
Quantity: 1000 (higher demand)

Ticket Type: Sunday Only Pass
Access: Day 3 only (Aug 17)
Price: $75
Quantity: 300
```

**C. Combo Passes (Optional)**
```
Ticket Type: Friday + Saturday Combo
Access: Days 1 & 2
Price: $135 (save $15)
Quantity: 200
```

**Ticket Type Configuration Form**:
```
┌─────────────────────────────────────────────────┐
│ Create Ticket Type                               │
├─────────────────────────────────────────────────┤
│ Name: [Weekend Pass_____________________]        │
│                                                  │
│ Type:                                            │
│ ◉ Full Pass (All Days)                          │
│ ○ Single Day Pass                                │
│ ○ Combo Pass (Select Days)                      │
│                                                  │
│ If Full Pass selected:                           │
│ ✓ Includes all 3 days                           │
│                                                  │
│ If Single Day selected:                          │
│ Access Day: [Day 1: Friday ▾]                   │
│                                                  │
│ If Combo Pass selected:                          │
│ Days Included: ☑ Day 1  ☑ Day 2  ☐ Day 3       │
│                                                  │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│ Pricing:                                         │
│ Price: [$180.00]                                 │
│                                                  │
│ Compare at price: [$225.00]                      │
│ (Show "Save $45" to customers)                   │
│                                                  │
│ Quantity: [500]                                  │
│                                                  │
│ [Save Ticket Type]                               │
└─────────────────────────────────────────────────┘
```

### AC-3: Daily Schedule and Lineup Display

**GIVEN** I have configured a multi-day event
**WHEN** customers view the event details
**THEN** they should see:
- Multi-day calendar view
- Per-day highlights and lineups
- Schedule overview
- Day-specific capacity status
- Easy comparison between day passes and full pass

**Customer Event Details Page**:
```
╔════════════════════════════════════════════════╗
║ 🎵 SUMMER MUSIC FESTIVAL 2025                  ║
║ August 15-17, 2025 • Central Park, NYC         ║
╠════════════════════════════════════════════════╣
║                                                ║
║ 3 DAYS | 50+ ARTISTS | EPIC EXPERIENCE        ║
║                                                ║
║ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ ║
║                                                ║
║ DAILY LINEUP:                                  ║
║                                                ║
║ 🎸 FRIDAY, AUGUST 15                          ║
║ Opening Night • 6:00 PM - 12:00 AM             ║
║ ────────────────────────────────────────────  ║
║ Headliner: THE ROCK LEGENDS                    ║
║ + Electric Soul, Neon Dreams, 3 more...        ║
║ Capacity: ⚠ 85% full                          ║
║                                                ║
║ 🎵 SATURDAY, AUGUST 16                         ║
║ Main Festival Day • 12:00 PM - 12:00 AM        ║
║ ────────────────────────────────────────────  ║
║ Headliners: POP SUPERSTAR, INDIE ICONS         ║
║ + 15 more incredible acts                      ║
║ Capacity: ⚠ 92% full (HIGH DEMAND!)           ║
║                                                ║
║ 🌟 SUNDAY, AUGUST 17                           ║
║ Finale Day • 2:00 PM - 11:00 PM                ║
║ ────────────────────────────────────────────  ║
║ Headliner: ELECTRONIC MASTERS                  ║
║ + Acoustic Vibes, Jazz Collective, 5 more...   ║
║ Capacity: ✓ 60% full                          ║
║                                                ║
║ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ ║
║                                                ║
║ TICKET OPTIONS:                                ║
║                                                ║
║ ┌────────────────────────────────────────────┐║
║ │ 🏆 WEEKEND PASS - BEST VALUE               │║
║ │ $180 (Save $45)                            │║
║ │ • Full access all 3 days                   │║
║ │ • VIP entry lanes                          │║
║ │ • Commemorative wristband                  │║
║ │ [Get Weekend Pass] →                       │║
║ └────────────────────────────────────────────┘║
║                                                ║
║ ┌────────────────────────────────────────────┐║
║ │ SINGLE DAY PASSES - $75 each               │║
║ │ [Friday] [Saturday] [Sunday]               │║
║ └────────────────────────────────────────────┘║
║                                                ║
╚════════════════════════════════════════════════╝
```

### AC-4: Multi-Day Check-In System

**GIVEN** I am attending a multi-day event
**WHEN** I check in each day
**THEN** system should:
- Validate my ticket for current day
- Track which days I've attended
- Support multiple check-ins across days
- Prevent check-in on wrong days

**Check-In Interface (Staff View)**:
```
╔════════════════════════════════════════════════╗
║ 📱 Check-In Scanner                            ║
║ Summer Music Festival 2025                     ║
╠════════════════════════════════════════════════╣
║ Current Day: Saturday, August 16 (Day 2)       ║
║                                                ║
║ [Scan QR Code]                                 ║
║                                                ║
║ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ ║
║ Last Scanned:                                  ║
║                                                ║
║ ✓ Sarah Johnson                                ║
║ Ticket: Weekend Pass (#SL-2025-1234)           ║
║                                                ║
║ Access Granted ✓                               ║
║ Valid for: All 3 days                          ║
║                                                ║
║ Previous Check-Ins:                            ║
║ • Day 1 (Fri): ✓ Checked in at 6:42 PM        ║
║ • Day 2 (Sat): ✓ Checked in at 12:15 PM       ║
║ • Day 3 (Sun): Upcoming                        ║
║                                                ║
║ [✓ Confirm Entry]                              ║
╚════════════════════════════════════════════════╝
```

**Wrong Day Check-In Attempt**:
```
╔════════════════════════════════════════════════╗
║ ⚠️ CHECK-IN ERROR                              ║
╠════════════════════════════════════════════════╣
║ Ticket holder: Mike Chen                       ║
║ Ticket: Sunday Only Pass                       ║
║                                                ║
║ ❌ Invalid for Today                           ║
║                                                ║
║ This ticket is only valid for:                 ║
║ • Sunday, August 17 (Day 3)                    ║
║                                                ║
║ Today is: Saturday, August 16 (Day 2)          ║
║                                                ║
║ Options:                                       ║
║ [Upgrade to Full Pass] ($105 more)             ║
║ [Purchase Saturday Pass] ($75)                 ║
║ [Return Sunday]                                ║
╚════════════════════════════════════════════════╝
```

### AC-5: Per-Day Analytics and Reporting

**GIVEN** I am organizing a multi-day event
**WHEN** I view analytics
**THEN** I should see:
- Per-day attendance figures
- Per-day revenue breakdown
- Full pass vs day pass distribution
- Daily capacity utilization
- No-show rates per day
- Peak attendance times per day

**Multi-Day Analytics Dashboard**:
```
╔══════════════════════════════════════════════════╗
║ Multi-Day Event Analytics                       ║
║ Summer Music Festival 2025                       ║
╠══════════════════════════════════════════════════╣
║ Overall Performance:                             ║
║ • Total Tickets Sold: 1,287                      ║
║ • Total Revenue: $182,520                        ║
║ • Average Per Day: 1,089 attendees              ║
║ • Total Unique Attendees: 987                    ║
╠══════════════════════════════════════════════════╣
║ Daily Breakdown:                                 ║
║                                                  ║
║ ┌────────────────────────────────────────────┐  ║
║ │ DAY 1: FRIDAY                              │  ║
║ │ Capacity: 1,700 / 2,000 (85%)              │  ║
║ │ Revenue: $51,750                            │  ║
║ │ ├─ Weekend Passes: 450 ($81,000)           │  ║
║ │ ├─ Friday Only: 320 ($24,000)              │  ║
║ │ └─ Fri+Sat Combo: 150 ($20,250)            │  ║
║ │ Peak Time: 8:00 PM (1,580 attendees)       │  ║
║ │ No-Shows: 25 (1.5%)                        │  ║
║ └────────────────────────────────────────────┘  ║
║                                                  ║
║ ┌────────────────────────────────────────────┐  ║
║ │ DAY 2: SATURDAY (Best Day!)                │  ║
║ │ Capacity: 2,760 / 3,000 (92%)              │  ║
║ │ Revenue: $87,450                            │  ║
║ │ ├─ Weekend Passes: 450 (included)          │  ║
║ │ ├─ Saturday Only: 650 ($48,750)            │  ║
║ │ └─ Fri+Sat Combo: 150 (included)           │  ║
║ │ Peak Time: 7:30 PM (2,580 attendees)       │  ║
║ │ No-Shows: 40 (1.4%)                        │  ║
║ └────────────────────────────────────────────┘  ║
║                                                  ║
║ ┌────────────────────────────────────────────┐  ║
║ │ DAY 3: SUNDAY                              │  ║
║ │ Capacity: 1,500 / 2,500 (60%)              │  ║
║ │ Revenue: $43,320                            │  ║
║ │ ├─ Weekend Passes: 450 (included)          │  ║
║ │ └─ Sunday Only: 280 ($21,000)              │  ║
║ │ Peak Time: 5:00 PM (1,320 attendees)       │  ║
║ │ No-Shows: 38 (2.5%)                        │  ║
║ └────────────────────────────────────────────┘  ║
╠══════════════════════════════════════════════════╣
║ Ticket Distribution:                             ║
║ • Weekend Passes: 450 (46% of revenue)           ║
║ • Single Day: 1,250 (48% of revenue)            ║
║ • Combo Passes: 150 (6% of revenue)             ║
╠══════════════════════════════════════════════════╣
║ Insights:                                        ║
║ ✓ Saturday highest demand - consider premium    ║
║ ⚠ Sunday underutilized - add special acts?      ║
║ ✓ Weekend passes performing well (46% revenue)   ║
║ 💡 300 people bought multiple single days        ║
║    (could have been weekend passes)              ║
╚══════════════════════════════════════════════════╝
```

### AC-6: Multi-Day Ticket Management

**GIVEN** I am a customer with a multi-day ticket
**WHEN** I view my ticket details
**THEN** I should see:
- Which days my ticket covers
- Check-in status for each day
- QR code (single code valid for all days)
- Day-specific information
- Ability to add days (upgrade)

**Customer Ticket View**:
```
╔════════════════════════════════════════════════╗
║ Your Ticket                                    ║
║ Summer Music Festival 2025                     ║
╠════════════════════════════════════════════════╣
║                                                ║
║          [QR CODE]                             ║
║                                                ║
║ Weekend Pass                                   ║
║ Ticket #SL-2025-1234                           ║
║                                                ║
║ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ ║
║                                                ║
║ Your Access:                                   ║
║                                                ║
║ ✓ Day 1: Friday, Aug 15 (6:00 PM)             ║
║   Status: ✓ Checked in at 6:42 PM             ║
║                                                ║
║ ✓ Day 2: Saturday, Aug 16 (12:00 PM)          ║
║   Status: ✓ Checked in at 12:15 PM            ║
║                                                ║
║ ✓ Day 3: Sunday, Aug 17 (2:00 PM)             ║
║   Status: ⏳ Upcoming - Get Ready!             ║
║                                                ║
║ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ ║
║                                                ║
║ Includes:                                      ║
║ • Full festival access all 3 days             ║
║ • VIP entry lanes                              ║
║ • Commemorative wristband                      ║
║ • Free parking                                 ║
║                                                ║
║ [Download Ticket] [Add to Wallet]              ║
║ [View Full Schedule]                           ║
╚════════════════════════════════════════════════╝
```

---

## Tasks / Subtasks

### Phase 1: Data Model & Core Logic (10 hours)

- [ ] **Multi-Day Event Schema** (AC-1)
  - [ ] Add to Event model:
    - `isMultiDay: Boolean`
    - `startDate: DateTime` (first day start)
    - `endDate: DateTime` (last day end)
    - `totalDays: Int` (computed)
  - [ ] Create `EventDay` model:
    - Event reference, day number, date
    - Name, description, schedule
    - Capacity, lineup/features
  - [ ] Create migration

- [ ] **Multi-Day Ticket Schema** (AC-2)
  - [ ] Update TicketType:
    - `ticketScope: TicketScope` (FULL_PASS, SINGLE_DAY, COMBO)
    - `dayIds: String[]` (which days ticket grants access)
  - [ ] Update Ticket:
    - `allowedDays: String[]`
    - Track check-ins per day

- [ ] **Day Access Logic** (AC-4)
  - [ ] `DayAccessService.ts`:
    - `validateAccess(ticketId, dayId)` - Check if ticket valid for day
    - `checkInForDay(ticketId, dayId)` - Process check-in
    - `getCheckInHistory(ticketId)` - Per-day check-in log
  - [ ] Multi-day check-in tracking

### Phase 2: API Layer (6 hours)

- [ ] **Event Day Management APIs** (AC-1, AC-3)
  - [ ] `POST /api/events/:eventId/days` - Create day
  - [ ] `GET /api/events/:eventId/days` - List days
  - [ ] `PATCH /api/events/:eventId/days/:dayId` - Update day
  - [ ] `DELETE /api/events/:eventId/days/:dayId` - Remove day

- [ ] **Multi-Day Analytics APIs** (AC-5)
  - [ ] `GET /api/events/:eventId/analytics/daily` - Per-day metrics
  - [ ] `GET /api/events/:eventId/analytics/attendance` - Daily attendance

### Phase 3: Organizer UI (10 hours)

- [ ] **Multi-Day Configuration** (AC-1)
  - [ ] `MultiDayEventSetup.tsx` - Main setup wizard
  - [ ] `DayConfiguration.tsx` - Per-day details form
  - [ ] `DayScheduler.tsx` - Visual day scheduler
  - [ ] Add to event creation flow

- [ ] **Multi-Day Ticket Setup** (AC-2)
  - [ ] `MultiDayTicketForm.tsx` - Ticket type with day selection
  - [ ] `DaySelector.tsx` - UI for selecting which days
  - [ ] `PassComparison.tsx` - Compare full pass vs day passes
  - [ ] Pricing suggestions (full pass discount calculator)

- [ ] **Multi-Day Analytics** (AC-5)
  - [ ] `DailyAnalytics.tsx` - Per-day performance
  - [ ] `AttendanceTrends.tsx` - Daily attendance graphs
  - [ ] `RevenueBreakdown.tsx` - Daily revenue charts
  - [ ] `TicketDistribution.tsx` - Pass type distribution

### Phase 4: Customer-Facing UI (10 hours)

- [ ] **Multi-Day Event Display** (AC-3)
  - [ ] `MultiDayEventDetails.tsx` - Enhanced event page
  - [ ] `DailyLineup.tsx` - Per-day schedule display
  - [ ] `DaySelector.tsx` - Interactive day picker
  - [ ] `TicketComparison.tsx` - Compare ticket options
  - [ ] Calendar view of multi-day event

- [ ] **Multi-Day Ticket Purchase** (AC-2)
  - [ ] Update checkout to handle day selection
  - [ ] Show savings for full pass
  - [ ] Display per-day access in cart

- [ ] **Customer Ticket View** (AC-6)
  - [ ] `MultiDayTicket.tsx` - Ticket display with day breakdown
  - [ ] `CheckInStatus.tsx` - Per-day check-in tracker
  - [ ] `DayUpgrade.tsx` - Add additional days

### Phase 5: Check-In System (6 hours)

- [ ] **Multi-Day Check-In** (AC-4)
  - [ ] Update `CheckInScanner.tsx` for day validation
  - [ ] `DayValidation.tsx` - Display day-specific access
  - [ ] `CheckInHistory.tsx` - Show previous check-ins
  - [ ] Wrong-day error handling and upgrade prompts

### Phase 6: Testing (6 hours)

- [ ] Unit tests for day access validation
- [ ] Unit tests for multi-day capacity tracking
- [ ] Integration test: Multi-day event creation
- [ ] Integration test: Full pass purchase
- [ ] Integration test: Day pass purchase
- [ ] E2E test: Check-in across multiple days
- [ ] E2E test: Wrong day check-in attempt
- [ ] Test edge cases (timezone handling, midnight transitions)

---

## Technical Design

### Database Schema

```prisma
model Event {
  // ... existing fields

  // Multi-Day Configuration
  isMultiDay       Boolean   @default(false)
  totalDays        Int?      @default(1)
  days             EventDay[]
}

model EventDay {
  id               String    @id @default(uuid())
  eventId          String
  event            Event     @relation(fields: [eventId], references: [id], onDelete: Cascade)

  // Day Details
  dayNumber        Int       // 1, 2, 3, etc.
  name             String    // "Opening Night", "Main Day", etc.
  description      String?   @db.Text
  date             DateTime  // Specific date for this day
  startTime        DateTime
  endTime          DateTime

  // Capacity (optional per-day limit)
  maxCapacity      Int?
  currentAttendance Int      @default(0)

  // Features
  lineup           Json?     // Artists, speakers, activities
  schedule         Json?     // Detailed schedule for the day
  highlights       String[]  @default([])

  // Status
  isActive         Boolean   @default(true)
  isCancelled      Boolean   @default(false)

  // Relations
  ticketTypes      TicketType[] @relation("DayTickets")
  checkIns         DayCheckIn[]

  createdAt        DateTime  @default(now())
  updatedAt        DateTime  @updatedAt

  @@unique([eventId, dayNumber])
  @@index([eventId, date])
  @@map("event_days")
}

model TicketType {
  // ... existing fields

  // Multi-Day Config
  ticketScope      TicketScope @default(FULL_PASS)
  dayIds           String[]    @default([]) // Which days this ticket grants access
  days             EventDay[]  @relation("DayTickets")
}

model Ticket {
  // ... existing fields

  // Multi-Day Tracking
  allowedDayIds    String[]    @default([]) // Days this ticket can access
  dayCheckIns      DayCheckIn[]
}

model DayCheckIn {
  id               String    @id @default(uuid())
  ticketId         String
  ticket           Ticket    @relation(fields: [ticketId], references: [id])
  dayId            String
  day              EventDay  @relation(fields: [dayId], references: [id])

  checkedInAt      DateTime  @default(now())
  checkedInBy      String?
  checkInMethod    CheckInMethod?
  checkInLocation  String?

  @@unique([ticketId, dayId]) // Prevent duplicate check-ins for same day
  @@index([ticketId])
  @@index([dayId])
  @@map("day_checkins")
}

enum TicketScope {
  FULL_PASS     // All days
  SINGLE_DAY    // One specific day
  COMBO         // Selected days
}
```

### Day Access Validation Service

```typescript
// lib/services/day-access.service.ts

interface DayAccessCheck {
  hasAccess: boolean;
  ticket: Ticket;
  day: EventDay;
  previousCheckIns: DayCheckIn[];
  reason?: string;
}

class DayAccessService {
  /**
   * Validate if ticket grants access to specific day
   */
  async validateAccess(ticketId: string, dayId: string): Promise<DayAccessCheck> {
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        ticketType: {
          include: {
            event: {
              include: { days: true }
            }
          }
        },
        dayCheckIns: {
          include: { day: true }
        }
      }
    });

    if (!ticket) {
      return {
        hasAccess: false,
        reason: 'TICKET_NOT_FOUND'
      } as any;
    }

    const day = ticket.ticketType.event.days.find(d => d.id === dayId);

    if (!day) {
      return {
        hasAccess: false,
        ticket,
        day: day!,
        previousCheckIns: ticket.dayCheckIns,
        reason: 'DAY_NOT_FOUND'
      };
    }

    // Check if ticket allows access to this day
    const hasAccess = ticket.allowedDayIds.includes(dayId);

    if (!hasAccess) {
      return {
        hasAccess: false,
        ticket,
        day,
        previousCheckIns: ticket.dayCheckIns,
        reason: 'NOT_VALID_FOR_DAY'
      };
    }

    // Check if already checked in today
    const alreadyCheckedIn = ticket.dayCheckIns.some(
      checkIn => checkIn.dayId === dayId
    );

    return {
      hasAccess: true,
      ticket,
      day,
      previousCheckIns: ticket.dayCheckIns,
      reason: alreadyCheckedIn ? 'ALREADY_CHECKED_IN' : undefined
    };
  }

  /**
   * Process check-in for specific day
   */
  async checkInForDay(
    ticketId: string,
    dayId: string,
    staffId?: string
  ): Promise<DayCheckIn> {
    const validation = await this.validateAccess(ticketId, dayId);

    if (!validation.hasAccess) {
      throw new Error(`Access denied: ${validation.reason}`);
    }

    // Check if already checked in (allow re-entry)
    const existing = await prisma.dayCheckIn.findUnique({
      where: {
        ticketId_dayId: {
          ticketId,
          dayId
        }
      }
    });

    if (existing) {
      // Return existing check-in (allow re-entry)
      return existing;
    }

    // Create new check-in
    const checkIn = await prisma.dayCheckIn.create({
      data: {
        ticketId,
        dayId,
        checkedInBy: staffId,
        checkInMethod: 'QR_SCAN'
      }
    });

    // Update day attendance count
    await prisma.eventDay.update({
      where: { id: dayId },
      data: { currentAttendance: { increment: 1 } }
    });

    return checkIn;
  }

  /**
   * Get check-in history for ticket
   */
  async getCheckInHistory(ticketId: string): Promise<DayCheckIn[]> {
    return prisma.dayCheckIn.findMany({
      where: { ticketId },
      include: { day: true },
      orderBy: { checkedInAt: 'asc' }
    });
  }

  /**
   * Get daily attendance stats
   */
  async getDailyAttendance(eventId: string): Promise<any> {
    const days = await prisma.eventDay.findMany({
      where: { eventId },
      include: {
        checkIns: {
          select: { ticketId: true, checkedInAt: true }
        }
      },
      orderBy: { dayNumber: 'asc' }
    });

    return days.map(day => ({
      dayNumber: day.dayNumber,
      name: day.name,
      date: day.date,
      capacity: day.maxCapacity,
      totalCheckIns: day.checkIns.length,
      uniqueAttendees: new Set(day.checkIns.map(c => c.ticketId)).size,
      utilizationRate: day.maxCapacity
        ? (day.checkIns.length / day.maxCapacity) * 100
        : null
    }));
  }
}
```

---

## Edge Cases & Business Rules

### 1. Same Day Multiple Entries
- **Rule**: Allow re-entry on same day (check-in idempotent)
- **Tracking**: Log first check-in time only
- **Display**: Show "Re-entry" status at gate

### 2. Day Order Enforcement
- **Question**: Can someone with Sunday pass check in on Friday?
- **Decision**: NO - strict day validation
- **Alternative**: Offer on-site upgrade option

### 3. Full Pass Value Calculation
- **Rule**: Full pass should be 10-30% cheaper than sum of day passes
- **Recommendation**: System suggests optimal discount
- **Validation**: Warn if full pass more expensive than individual

### 4. Partial Day Cancellation
- **Scenario**: Organizer cancels Day 2 of 3-day event
- **Process**: Refund only Day 2 portion for full pass holders
- **Calculation**: Pro-rated refund based on day value

### 5. Midnight Transitions
- **Challenge**: Event runs past midnight (11:59 PM to 2:00 AM)
- **Solution**: Day boundaries based on event definition, not calendar date
- **Example**: Friday 6PM-2AM still considered "Day 1"

---

## Integration Points

### Integrates With:
- **EV-001 (Event Creation)**: Multi-day event type
- **EV-002 (Ticket Types)**: Day-based ticketing
- **EV-012 (Multi-Session)**: Related but different concept
- **CHK-001 (Check-In)**: Day-specific check-in
- **AN-001 (Analytics)**: Daily performance tracking

---

## Success Metrics

- **Adoption**: 20% of events are multi-day format
- **Full Pass Sales**: 40-50% of multi-day attendees buy full pass
- **Revenue Increase**: 80-120% higher revenue vs single-day equivalent
- **Attendance**: 70% of full pass holders attend all days
- **Check-In Accuracy**: 99.5% correct day validation
- **Customer Satisfaction**: 4.5+ rating for multi-day event experience

---

## Change Log

| Date | Version | Description | Author |
|------|---------|-------------|---------|
| 2025-09-30 | 1.0 | Initial story creation | BMAD SM Agent |

---

## Dev Agent Record
*To be populated by dev agent*

---

## QA Results
*To be populated by QA agent*