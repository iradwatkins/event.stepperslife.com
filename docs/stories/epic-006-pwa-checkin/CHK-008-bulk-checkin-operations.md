# Story: CHK-008 - Bulk Check-in Operations

**Epic**: EPIC-006 - Mobile Check-in PWA
**Story Points**: 5
**Priority**: P2 (Medium)
**Status**: Draft
**Dependencies**: CHK-001 (PWA Framework), CHK-003 (QR Scanner), CHK-007 (Staff Roles), TIX-003 (Ticket Validation)

---

## Story

**As an** event staff member handling groups
**I want to** check in multiple attendees at once
**So that** I can efficiently process tour groups, VIP lists, and families without individual scans

---

## Acceptance Criteria

1. GIVEN I'm checking in a group of attendees
   WHEN I access bulk check-in mode
   THEN I should see:
   - Toggle to "Bulk Mode" from normal check-in
   - Multi-select interface for attendees
   - Search/filter options for group finding
   - Selected count display
   - "Check In All" action button
   - Clear selection option

2. GIVEN I have a VIP list to check in
   WHEN I select "VIP Fast Track" option
   THEN the system should:
   - Display all VIP ticket holders
   - Allow selection of all or subset
   - Show special VIP indicator
   - Enable one-tap check-in for all selected
   - Confirm before processing
   - Process all within 3 seconds
   - Show success count

3. GIVEN I'm checking in a family/group ticket
   WHEN I scan the primary ticket
   THEN the system should:
   - Detect it's a group ticket
   - Show all associated attendees
   - Pre-select all group members
   - Allow individual deselection if needed
   - Check in entire group with one confirmation
   - Show individual success for each member
   - Handle partial failures gracefully

4. GIVEN I'm processing a bulk check-in
   WHEN I confirm the action
   THEN the system should:
   - Show progress indicator (X of Y)
   - Process check-ins in parallel (where possible)
   - Handle errors individually without stopping batch
   - Display results summary (success/failed)
   - List any failures with reasons
   - Offer to retry failed check-ins
   - Log all operations for audit

5. GIVEN some check-ins in the batch fail
   WHEN bulk operation completes
   THEN I should see:
   - Success count with green indicator
   - Failure count with red indicator
   - Expandable list of failed check-ins
   - Reason for each failure (already checked-in, invalid ticket, etc.)
   - Option to retry failed items
   - Option to override (if Manager+)
   - Export error report option

6. GIVEN I made a mistake with bulk check-in
   WHEN I need to undo the operation
   THEN I should be able to:
   - Access "Undo Last Bulk Check-in" (5-minute window)
   - See list of attendees that will be checked-out
   - Confirm undo action
   - Receive confirmation of undo
   - See audit log of undo operation
   - Require Manager+ permission for undo

---

## Tasks / Subtasks

- [ ] Create bulk mode toggle and UI (AC: 1)
  - [ ] Design bulk mode interface
  - [ ] Add mode toggle switch
  - [ ] Create multi-select component
  - [ ] Show selection count

- [ ] Implement multi-select attendee list (AC: 1)
  - [ ] Design selectable attendee cards
  - [ ] Add checkbox selection
  - [ ] Enable select all/none
  - [ ] Filter selected items

- [ ] Build VIP fast-track feature (AC: 2)
  - [ ] Filter VIP ticket holders
  - [ ] Create VIP badge indicator
  - [ ] Quick-select all VIPs
  - [ ] Fast processing logic

- [ ] Implement group ticket detection (AC: 3)
  - [ ] Identify group tickets
  - [ ] Fetch associated attendees
  - [ ] Auto-select group members
  - [ ] Allow deselection

- [ ] Create bulk processing engine (AC: 4)
  - [ ] Parallel processing (max 10 concurrent)
  - [ ] Progress tracking
  - [ ] Error handling per item
  - [ ] Transaction management

- [ ] Add progress indicator (AC: 4)
  - [ ] Show processing progress
  - [ ] Display count (X of Y)
  - [ ] Animated progress bar
  - [ ] Prevent interruption

- [ ] Build results summary view (AC: 4, 5)
  - [ ] Success/failure counts
  - [ ] Color-coded indicators
  - [ ] Detailed failure list
  - [ ] Export option

- [ ] Implement error handling (AC: 5)
  - [ ] Capture individual errors
  - [ ] Display error reasons
  - [ ] Allow selective retry
  - [ ] Manager override option

- [ ] Create undo functionality (AC: 6)
  - [ ] Track bulk operations
  - [ ] 5-minute undo window
  - [ ] Batch check-out
  - [ ] Audit logging

- [ ] Add permission checks (AC: 6)
  - [ ] Manager+ for bulk operations
  - [ ] Manager+ for undo
  - [ ] Manager+ for override
  - [ ] Log permission checks

- [ ] Build confirmation dialogs (AC: 2, 3, 6)
  - [ ] Confirm before bulk check-in
  - [ ] Show impact summary
  - [ ] Confirm undo action
  - [ ] Prevent accidental actions

- [ ] Implement audit logging (AC: 4, 6)
  - [ ] Log bulk operations
  - [ ] Track individual check-ins
  - [ ] Log undo operations
  - [ ] Searchable audit trail

- [ ] Add offline support (AC: 4)
  - [ ] Queue bulk operations offline
  - [ ] Sync when online
  - [ ] Handle conflicts
  - [ ] Show offline indicator

- [ ] Create bulk export/report (AC: 5)
  - [ ] Export results to CSV
  - [ ] Include timestamps
  - [ ] Show staff member
  - [ ] List errors

---

## Dev Notes

### Architecture References

**Bulk Processing Architecture** (`docs/architecture/bulk-operations.md`):
- Parallel processing with concurrency limit (10 concurrent)
- Individual transaction per check-in (atomic)
- Rollback capability (soft delete + undo)
- Progress tracking with WebSocket updates
- Error isolation (one failure doesn't stop batch)

**Batch Processing Strategy**:
```typescript
// lib/check-in/bulk-processor.ts
class BulkCheckInProcessor {
  private readonly CONCURRENCY_LIMIT = 10;
  private readonly UNDO_WINDOW_MS = 5 * 60 * 1000; // 5 minutes

  async processBulkCheckIn(
    ticketIds: string[],
    staffId: string
  ): Promise<BulkResult> {
    const operationId = generateOperationId();
    const results: CheckInResult[] = [];

    // Process in batches with concurrency limit
    for (let i = 0; i < ticketIds.length; i += this.CONCURRENCY_LIMIT) {
      const batch = ticketIds.slice(i, i + this.CONCURRENCY_LIMIT);

      const batchResults = await Promise.allSettled(
        batch.map(ticketId =>
          this.checkInTicket(ticketId, staffId, operationId)
        )
      );

      results.push(...this.processBatchResults(batchResults));

      // Update progress
      this.emitProgress(operationId, results.length, ticketIds.length);
    }

    // Store for potential undo
    await this.storeBulkOperation(operationId, results);

    return this.summarizeResults(results);
  }

  private async checkInTicket(
    ticketId: string,
    staffId: string,
    operationId: string
  ): Promise<CheckInResult> {
    try {
      const result = await db.checkIn.create({
        data: {
          ticketId,
          staffId,
          bulkOperationId: operationId,
          timestamp: new Date()
        }
      });

      return { success: true, ticketId, result };
    } catch (error) {
      return {
        success: false,
        ticketId,
        error: this.formatError(error)
      };
    }
  }

  async undoBulkOperation(operationId: string): Promise<void> {
    const operation = await this.getBulkOperation(operationId);

    if (!operation || this.isExpired(operation)) {
      throw new Error('Undo window expired');
    }

    // Soft delete all check-ins from this operation
    await db.checkIn.updateMany({
      where: { bulkOperationId: operationId },
      data: { deleted: true, deletedAt: new Date() }
    });

    // Log undo
    await this.logUndo(operationId);
  }

  private isExpired(operation: BulkOperation): boolean {
    const elapsed = Date.now() - operation.createdAt.getTime();
    return elapsed > this.UNDO_WINDOW_MS;
  }
}
```

**Bulk Operation Data Model**:
```prisma
model BulkCheckInOperation {
  id          String   @id @default(cuid())
  staffId     String
  eventId     String
  operationType String  // 'VIP_FAST_TRACK', 'GROUP', 'MANUAL_BULK'
  totalCount  Int
  successCount Int
  failureCount Int
  createdAt   DateTime @default(now())
  undone      Boolean  @default(false)
  undoneAt    DateTime?
  undoneBy    String?

  checkIns    CheckIn[]
  staff       User      @relation(fields: [staffId], references: [id])
  event       Event     @relation(fields: [eventId], references: [id])

  @@index([eventId])
  @@index([staffId])
  @@index([createdAt])
}

model CheckIn {
  id              String    @id @default(cuid())
  ticketId        String    @unique
  staffId         String
  bulkOperationId String?
  timestamp       DateTime  @default(now())
  deleted         Boolean   @default(false)
  deletedAt       DateTime?

  ticket          Ticket    @relation(fields: [ticketId], references: [id])
  staff           User      @relation(fields: [staffId], references: [id])
  bulkOperation   BulkCheckInOperation? @relation(fields: [bulkOperationId], references: [id])

  @@index([ticketId])
  @@index([bulkOperationId])
}
```

**Group Ticket Detection**:
```typescript
// lib/tickets/group-detector.ts
interface GroupTicket {
  primaryTicketId: string;
  memberTickets: Ticket[];
  groupSize: number;
  groupType: 'FAMILY' | 'TOUR' | 'CORPORATE';
}

async function detectGroupTicket(
  ticketId: string
): Promise<GroupTicket | null> {
  const ticket = await db.ticket.findUnique({
    where: { id: ticketId },
    include: { order: { include: { tickets: true } } }
  });

  if (!ticket) return null;

  // Check if part of multi-ticket order
  const orderTickets = ticket.order.tickets;
  if (orderTickets.length > 1) {
    return {
      primaryTicketId: ticketId,
      memberTickets: orderTickets,
      groupSize: orderTickets.length,
      groupType: ticket.order.groupType || 'FAMILY'
    };
  }

  // Check if part of named group (tour, corporate)
  if (ticket.groupId) {
    const groupTickets = await db.ticket.findMany({
      where: { groupId: ticket.groupId }
    });

    return {
      primaryTicketId: ticketId,
      memberTickets: groupTickets,
      groupSize: groupTickets.length,
      groupType: ticket.groupType
    };
  }

  return null; // Not a group ticket
}
```

**VIP Fast Track Implementation**:
```typescript
// components/check-in/VIPFastTrack.tsx
function VIPFastTrack({ eventId }: Props) {
  const { data: vipTickets } = useQuery({
    queryKey: ['vip-tickets', eventId],
    queryFn: () => fetchVIPTickets(eventId)
  });

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const { mutate: bulkCheckIn } = useBulkCheckIn();

  const handleSelectAll = () => {
    const uncheckedVIPs = vipTickets
      .filter(t => !t.checkedIn)
      .map(t => t.id);
    setSelected(new Set(uncheckedVIPs));
  };

  const handleCheckInAll = async () => {
    if (selected.size === 0) return;

    const confirmed = await confirm({
      title: 'Check in VIP guests?',
      message: `This will check in ${selected.size} VIP guests.`
    });

    if (!confirmed) return;

    bulkCheckIn({
      ticketIds: Array.from(selected),
      operationType: 'VIP_FAST_TRACK'
    });
  };

  return (
    <div>
      <h2>VIP Fast Track</h2>
      <button onClick={handleSelectAll}>Select All Unchecked</button>
      <button onClick={handleCheckInAll} disabled={selected.size === 0}>
        Check In {selected.size} VIPs
      </button>
      {/* VIP list with checkboxes */}
    </div>
  );
}
```

**Progress Tracking with WebSocket**:
```typescript
// Real-time progress updates
socket.on('bulk-progress', (data) => {
  const { operationId, processed, total, percentage } = data;

  updateProgress({
    processed,
    total,
    percentage,
    message: `Processing: ${processed} of ${total}`
  });
});

socket.on('bulk-complete', (data) => {
  const { operationId, results } = data;

  showResults({
    success: results.success,
    failed: results.failed,
    total: results.total
  });
});
```

**Source Tree** (`docs/architecture/source-tree.md`):
```
src/
├── app/
│   ├── api/
│   │   └── check-in/
│   │       ├── bulk/route.ts
│   │       ├── bulk/undo/route.ts
│   │       └── vip-fast-track/route.ts
│   └── check-in/
│       └── bulk/page.tsx
├── components/
│   └── check-in/
│       ├── BulkModeToggle.tsx
│       ├── BulkCheckInList.tsx
│       ├── VIPFastTrack.tsx
│       ├── GroupCheckIn.tsx
│       ├── BulkProgress.tsx
│       ├── BulkResults.tsx
│       └── UndoBulkOperation.tsx
├── lib/
│   └── check-in/
│       ├── bulk-processor.ts
│       ├── group-detector.ts
│       └── bulk-undo.ts
└── hooks/
    ├── useBulkCheckIn.ts
    └── useBulkUndo.ts
```

**Performance Considerations**:
- Concurrency limit prevents server overload
- Individual transactions ensure atomicity
- Progress updates via WebSocket (not polling)
- Optimistic UI updates for responsiveness
- Database connection pooling
- Indexed queries for fast lookups

**Mobile UX**:
- Large checkboxes for easy selection
- Swipe to select multiple
- Haptic feedback on selection
- Clear visual feedback
- Prevent accidental undo
- Confirmation dialogs for bulk actions

**Error Handling**:
- Isolate failures (continue processing)
- Clear error messages per ticket
- Categorize errors (already checked-in, invalid, network)
- Retry mechanism for transient failures
- Partial success handling
- Rollback on critical failures

**Audit Trail**:
```typescript
interface BulkAuditLog {
  operationId: string;
  staffId: string;
  eventId: string;
  operationType: string;
  ticketIds: string[];
  results: {
    success: number;
    failed: number;
    errors: Array<{ ticketId: string; error: string }>;
  };
  timestamp: Date;
  undone: boolean;
  undoneAt?: Date;
  undoneBy?: string;
}
```

### Testing

**Testing Requirements for this story**:
- Unit tests for bulk processor
- Unit tests for group detection
- Unit tests for undo logic
- Integration test for bulk check-in
- Integration test for VIP fast track
- Integration test for group check-in
- Integration test for undo
- E2E test for complete bulk workflow
- E2E test for error handling
- E2E test for undo flow
- Test concurrency limits
- Test partial failures
- Test undo window expiration
- Test permission enforcement
- Performance test with large batches (100+ tickets)
- Test offline bulk operations
- Test WebSocket progress updates
- Stress test concurrent bulk operations
- Test database transaction isolation

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