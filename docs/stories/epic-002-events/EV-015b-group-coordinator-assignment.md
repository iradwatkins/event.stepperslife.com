# Story: EV-015b - Group Coordinator & Assignment

**Epic**: EPIC-002 - Event Management Core
**Parent Story**: EV-015 - Group Booking Discounts (5 pts)
**Story Points**: 3
**Priority**: P2 (Important)
**Status**: Draft
**Dependencies**:
- EV-015a (Volume discount logic & API)
- TIX-001 (Ticket validation and check-in)
**Downstream**: None

---

## Story

**As a** group coordinator (team lead, event planner)
**I want to** purchase multiple tickets and assign them to my group members
**So that** I can manage group attendance and each member gets their own ticket

---

## Acceptance Criteria

1. GIVEN I purchase 15+ tickets (qualifying for group discount)
   WHEN I complete checkout
   THEN I should be designated as the "Group Coordinator"
   AND I should receive a confirmation email with:
   - Group booking details
   - Link to group management dashboard
   - Unique group code for ticket assignments

2. GIVEN I am a group coordinator
   WHEN I access the group management dashboard
   THEN I should see:
   - List of all tickets in my group booking
   - Assignment status for each ticket (Assigned/Unassigned)
   - Button to "Assign Ticket" for each unassigned ticket
   - Total tickets purchased and remaining unassigned

3. GIVEN I want to assign a ticket to a group member
   WHEN I click "Assign Ticket"
   THEN I should see a form with:
   - First name (required)
   - Last name (required)
   - Email address (required)
   - Phone number (optional)
   - Dietary restrictions / special needs (optional)
   AND I can submit to assign ticket

4. GIVEN I assign a ticket to a group member
   WHEN I submit the assignment
   THEN ticket should be linked to that person
   AND assignee should receive email with:
   - Their individual ticket QR code
   - Event details
   - Check-in instructions
   AND ticket should show as "Assigned" in my dashboard

5. GIVEN I want to let group members claim their own tickets
   WHEN I share the group claim code
   THEN members can visit claim page with code
   AND enter their details to claim a ticket
   AND claim reduces available unassigned tickets
   AND coordinator sees real-time claim updates

6. GIVEN I need to reassign or cancel a ticket
   WHEN I click on an assigned ticket
   THEN I should see options to:
   - Edit assignee details
   - Unassign ticket (return to unassigned pool)
   - Request refund for specific ticket
   AND changes should update immediately

7. GIVEN a group member arrives at check-in
   WHEN they scan their individual QR code
   THEN their ticket should validate normally
   AND check-in system should show their name
   AND group coordinator should see check-in status update

8. GIVEN I purchase additional tickets for existing group
   WHEN I use the same email address
   THEN new tickets should add to my existing group
   AND same group code should work for new tickets
   AND I should see all tickets in one dashboard

---

## Tasks / Subtasks

- [ ] Create group booking database schema (AC: 1, 2)
  - [ ] Add group_bookings table to Prisma schema
  - [ ] Fields: id, orderId, coordinatorUserId, groupCode, totalTickets, assignedTickets
  - [ ] Add ticket_assignments table
  - [ ] Fields: id, ticketId, groupBookingId, assigneeName, assigneeEmail, assigneePhone, assignedAt
  - [ ] Create relationships and indexes

- [ ] Generate unique group codes (AC: 1, 5)
  - [ ] Create group code generation service
  - [ ] Format: 8 characters, alphanumeric, unique
  - [ ] Store group code in group_bookings table
  - [ ] Add group code to order confirmation email

- [ ] Build group coordinator dashboard (AC: 2, 4, 6)
  - [ ] GroupDashboard component showing all tickets
  - [ ] List view with assignment status
  - [ ] Real-time updates using websockets or polling
  - [ ] Ticket assignment action buttons

- [ ] Create ticket assignment flow (AC: 3, 4)
  - [ ] TicketAssignmentForm component
  - [ ] POST /api/groups/[groupId]/assign endpoint
  - [ ] Validate assignee email uniqueness
  - [ ] Send assignee confirmation email with QR code
  - [ ] Update assignment status

- [ ] Implement ticket claim system (AC: 5)
  - [ ] Ticket claim page at /claim/[groupCode]
  - [ ] ClaimTicketForm component
  - [ ] POST /api/groups/claim endpoint
  - [ ] Verify group code validity
  - [ ] Auto-assign ticket on claim
  - [ ] Send ticket email to claimer

- [ ] Build ticket reassignment logic (AC: 6)
  - [ ] Edit assignee details endpoint
  - [ ] Unassign ticket endpoint (return to pool)
  - [ ] Individual ticket refund request
  - [ ] Update ticket status and send notifications

- [ ] Integrate with check-in system (AC: 7)
  - [ ] Display assignee name at check-in
  - [ ] Link ticket QR code to assignee details
  - [ ] Real-time check-in status in coordinator dashboard
  - [ ] Show checked-in count vs total

- [ ] Add group expansion logic (AC: 8)
  - [ ] Detect existing group by coordinator email
  - [ ] Add new tickets to existing group
  - [ ] Extend group code validity
  - [ ] Combine tickets in single dashboard

- [ ] Create group coordinator API endpoints (AC: 2, 3, 4, 5, 6)
  - [ ] GET /api/groups/[groupId] - Get group details
  - [ ] POST /api/groups/[groupId]/assign - Assign ticket
  - [ ] PUT /api/groups/[groupId]/tickets/[ticketId] - Edit assignment
  - [ ] DELETE /api/groups/[groupId]/tickets/[ticketId]/assignment - Unassign
  - [ ] POST /api/groups/claim - Claim ticket with group code
  - [ ] GET /api/groups/code/[groupCode] - Validate group code

- [ ] Build email notifications (AC: 1, 4, 5)
  - [ ] Group coordinator confirmation email
  - [ ] Ticket assignment notification email
  - [ ] Ticket claim confirmation email
  - [ ] Include group code and dashboard link

- [ ] Add real-time updates (AC: 5, 7)
  - [ ] Websocket connection for coordinator dashboard
  - [ ] Push updates on ticket assignment
  - [ ] Push updates on ticket check-in
  - [ ] Fallback to polling if websockets unavailable

---

## Dev Notes

### Architecture References

**Database Schema** (`prisma/schema.prisma`):
```prisma
model GroupBooking {
  id                String   @id @default(cuid())
  orderId           String   @unique
  order             Order    @relation(fields: [orderId], references: [id])
  coordinatorUserId String
  coordinator       User     @relation(fields: [coordinatorUserId], references: [id])
  groupCode         String   @unique @db.VarChar(8)
  totalTickets      Int
  assignedTickets   Int      @default(0)
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  ticketAssignments TicketAssignment[]

  @@index([groupCode])
  @@index([coordinatorUserId])
}

model TicketAssignment {
  id              String   @id @default(cuid())
  ticketId        String   @unique
  ticket          Ticket   @relation(fields: [ticketId], references: [id])
  groupBookingId  String
  groupBooking    GroupBooking @relation(fields: [groupBookingId], references: [id])
  assigneeName    String   @db.VarChar(200)
  assigneeEmail   String   @db.VarChar(255)
  assigneePhone   String?  @db.VarChar(20)
  dietaryInfo     String?  @db.Text
  assignedAt      DateTime @default(now())

  @@index([groupBookingId])
  @@index([assigneeEmail])
}

model Ticket {
  // ... existing fields
  assignment      TicketAssignment?
}

model Order {
  // ... existing fields
  groupBooking    GroupBooking?
}
```

**Group Code Generation**:
```typescript
function generateGroupCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Exclude confusing chars
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}
```

**API Response Format**:
```json
{
  "groupBooking": {
    "id": "grp_123",
    "groupCode": "ABC12345",
    "totalTickets": 20,
    "assignedTickets": 15,
    "unassignedTickets": 5,
    "coordinator": {
      "name": "Jane Smith",
      "email": "jane@example.com"
    },
    "tickets": [
      {
        "id": "tix_001",
        "status": "ASSIGNED",
        "assignee": {
          "name": "John Doe",
          "email": "john@example.com",
          "assignedAt": "2025-03-15T10:30:00Z"
        },
        "checkedIn": false
      },
      {
        "id": "tix_002",
        "status": "UNASSIGNED",
        "assignee": null,
        "checkedIn": false
      }
    ]
  }
}
```

**Source Tree**:
```
src/
├── app/
│   ├── dashboard/
│   │   └── groups/
│   │       └── [groupId]/page.tsx
│   ├── claim/
│   │   └── [groupCode]/page.tsx
│   └── api/
│       └── groups/
│           ├── [groupId]/
│           │   ├── route.ts
│           │   ├── assign/route.ts
│           │   └── tickets/[ticketId]/route.ts
│           ├── claim/route.ts
│           └── code/[groupCode]/route.ts
├── components/
│   └── groups/
│       ├── GroupDashboard.tsx
│       ├── TicketAssignmentForm.tsx
│       ├── ClaimTicketForm.tsx
│       └── TicketList.tsx
└── lib/
    └── services/
        ├── group-booking.service.ts
        └── ticket-assignment.service.ts
```

**Email Templates**:
- Group Coordinator Confirmation: Include group code, dashboard link, assignment instructions
- Ticket Assignment: Include individual QR code, event details, check-in info
- Ticket Claim Confirmation: Welcome message, QR code, event details

### Testing

**Test Standards**:
- Test file: `__tests__/groups/group-booking.test.ts`
- E2E test: `e2e/groups/group-assignment.spec.ts`

**Testing Requirements**:
- Unit test group code generation (uniqueness)
- Unit test ticket assignment logic
- Unit test claim validation
- Unit test reassignment logic
- Integration test group creation on order
- Integration test ticket assignment API
- E2E test full group coordinator flow
- E2E test ticket claim flow
- E2E test group check-in
- Test concurrent claims (race conditions)

---

## Change Log

| Date | Version | Description | Author |
|------|---------|-------------|---------|
| 2025-09-30 | 1.0 | Sharded from EV-015 (Group Booking Discounts) | SM Agent |

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