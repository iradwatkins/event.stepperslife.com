# Story: SEAT-004 - Seat Hold and Release Logic

**Epic**: EPIC-009 - Reserved Seating System
**Story Points**: 5
**Priority**: E1 (High)
**Status**: Draft
**Dependencies**: SEAT-002 (Interactive Seat Selection), SEAT-003 (Real-Time Availability), Payment processing

---

## Story

**As a** customer in the checkout process
**I want** my selected seats to be held temporarily
**So that** I have time to complete my purchase without losing my seats to other customers

---

## Acceptance Criteria

1. GIVEN I select seats for an event
   WHEN the selection is confirmed
   THEN the system should:
   - Reserve seats exclusively for me for 10 minutes
   - Start visible countdown timer showing remaining time
   - Mark seats as "held" (not available to others)
   - Store hold with my session ID and user ID
   - Prevent other users from selecting held seats
   - Show seats as "held by you" if I return to page

2. GIVEN I have seats on hold
   WHEN I'm actively completing checkout
   THEN the system should:
   - Display prominent countdown timer
   - Show warnings at 3 minutes remaining
   - Show urgent warning at 1 minute remaining
   - Allow me to extend hold by 5 minutes (once per session)
   - Maintain hold across page navigation
   - Persist hold if I refresh the page

3. GIVEN my seat hold expires
   WHEN the 10-minute timer reaches zero
   THEN the system should:
   - Automatically release all held seats
   - Make seats available to other customers
   - Redirect me to seat selection with "Time expired" message
   - Broadcast seat availability to all connected users
   - Clear my cart and selections
   - Log expiration event for analytics

4. GIVEN I complete my purchase before hold expires
   WHEN payment is successful
   THEN the system should:
   - Convert seat holds to permanent "purchased" status
   - Cancel the countdown timer
   - Release the hold lock
   - Broadcast seat purchase to all users
   - Generate tickets with seat assignments
   - Send confirmation email

5. GIVEN I abandon the checkout process
   WHEN I close the browser or navigate away
   THEN the system should:
   - Keep seats on hold until timer expires
   - Release seats after expiration
   - Clean up orphaned holds with background job
   - Handle edge cases (crashed browser, network loss)

6. GIVEN there are many expired holds in the system
   WHEN the cleanup job runs
   THEN it should:
   - Run every 1 minute
   - Find all holds past expiration time
   - Release seats in batch (atomic operations)
   - Broadcast updates for released seats
   - Log cleanup metrics
   - Handle high volume efficiently (<5 seconds execution)

---

## Tasks / Subtasks

- [ ] Create seat hold database schema (AC: 1, 2)
  - [ ] Add SeatHold model to Prisma schema
  - [ ] Include expiresAt timestamp
  - [ ] Store userId and sessionId
  - [ ] Add indexes for performance

- [ ] Implement seat hold creation logic (AC: 1)
  - [ ] Create hold on seat selection
  - [ ] Set 10-minute expiration
  - [ ] Use atomic database operations
  - [ ] Handle concurrent hold attempts

- [ ] Build countdown timer UI component (AC: 2, 3)
  - [ ] Display minutes and seconds remaining
  - [ ] Update every second
  - [ ] Show warnings at 3 min and 1 min
  - [ ] Prominent placement in checkout

- [ ] Implement hold extension functionality (AC: 2)
  - [ ] Add "Extend time" button
  - [ ] Extend by 5 minutes (once only)
  - [ ] Update expiration in database
  - [ ] Disable button after use

- [ ] Create automatic hold expiration logic (AC: 3)
  - [ ] Background job running every minute
  - [ ] Query expired holds
  - [ ] Release seats in batch
  - [ ] Broadcast updates via WebSocket

- [ ] Build seat release mechanism (AC: 3, 5, 6)
  - [ ] Release hold transaction
  - [ ] Update seat status to available
  - [ ] Broadcast to all users
  - [ ] Clean up hold records

- [ ] Implement hold-to-purchase conversion (AC: 4)
  - [ ] Convert hold on payment success
  - [ ] Atomic transaction with payment
  - [ ] Update seat status to purchased
  - [ ] Cancel timer

- [ ] Add hold persistence across sessions (AC: 2, 5)
  - [ ] Store hold in database with session ID
  - [ ] Restore hold on page refresh
  - [ ] Sync timer with database time
  - [ ] Handle multiple browser tabs

- [ ] Create race condition prevention (AC: 1, 4, 6)
  - [ ] Use database row locks
  - [ ] Optimistic locking with version
  - [ ] Handle concurrent hold/release
  - [ ] Implement retry logic

- [ ] Build hold cleanup background job (AC: 6)
  - [ ] Cron job running every 1 minute
  - [ ] Find expired holds efficiently
  - [ ] Batch release operations
  - [ ] Error handling and logging

- [ ] Implement orphaned hold detection (AC: 5)
  - [ ] Detect abandoned sessions
  - [ ] Clean up stale holds
  - [ ] Handle edge cases
  - [ ] Log cleanup actions

- [ ] Add hold monitoring and metrics (AC: 6)
  - [ ] Track hold duration
  - [ ] Count expirations vs completions
  - [ ] Monitor cleanup job performance
  - [ ] Alert on high failure rate

- [ ] Optimize hold queries for performance (AC: 6)
  - [ ] Index on expiresAt column
  - [ ] Composite index for cleanup query
  - [ ] Use database cursors for large batches
  - [ ] Limit query result size

- [ ] Add hold validation before checkout (AC: 2, 3)
  - [ ] Verify hold is still valid
  - [ ] Check seat availability
  - [ ] Handle expired holds gracefully
  - [ ] Re-prompt seat selection if needed

---

## Dev Notes

### Architecture References

**Seat Hold Architecture** (`docs/architecture/seating-architecture.md`):
- 10-minute hold duration (configurable)
- One-time 5-minute extension allowed
- Background cleanup job every 1 minute
- Atomic operations for race condition prevention
- Hold persists across page refreshes

**Hold Timer Implementation** (`docs/architecture/real-time.md`):
- Server-side timer for accuracy
- Client-side countdown for UX
- Sync client with server time
- WebSocket notification on expiration
- Graceful handling of clock skew

**Database Schema**:
```prisma
model SeatHold {
  id              String   @id @default(cuid())
  eventId         String
  event           Event    @relation(fields: [eventId], references: [id])
  seatIds         String[] // Array of seat IDs
  userId          String?
  user            User?    @relation(fields: [userId], references: [id])
  sessionId       String
  createdAt       DateTime @default(now())
  expiresAt       DateTime
  extendedAt      DateTime?
  hasExtended     Boolean  @default(false)
  status          SeatHoldStatus @default(ACTIVE)

  @@index([expiresAt, status])
  @@index([sessionId])
  @@index([userId])
}

enum SeatHoldStatus {
  ACTIVE
  EXPIRED
  COMPLETED
  CANCELLED
}

// Update Seat model to include hold reference
model Seat {
  id              String   @id @default(cuid())
  // ... existing fields
  status          SeatStatus @default(AVAILABLE)
  holdId          String?
  hold            SeatHold? @relation(fields: [holdId], references: [id])
  version         Int      @default(0) // Optimistic locking

  @@index([status, holdId])
}

enum SeatStatus {
  AVAILABLE
  HELD
  PURCHASED
}
```

**Hold Creation Logic**:
```typescript
// lib/seating/seat-hold.service.ts
export async function createSeatHold(
  eventId: string,
  seatIds: string[],
  userId: string | null,
  sessionId: string
): Promise<{ success: boolean; holdId?: string; error?: string }> {
  try {
    return await prisma.$transaction(async (tx) => {
      // Check if seats are available (with row lock)
      const seats = await tx.seat.findMany({
        where: {
          id: { in: seatIds },
          eventId,
          status: 'AVAILABLE',
        },
        select: { id: true, version: true },
      });

      if (seats.length !== seatIds.length) {
        return { success: false, error: 'Some seats are no longer available' };
      }

      // Create hold with 10-minute expiration
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
      const hold = await tx.seatHold.create({
        data: {
          eventId,
          seatIds,
          userId,
          sessionId,
          expiresAt,
          status: 'ACTIVE',
        },
      });

      // Update seats to HELD status (optimistic locking)
      const updatePromises = seats.map((seat) =>
        tx.seat.updateMany({
          where: {
            id: seat.id,
            version: seat.version,
            status: 'AVAILABLE',
          },
          data: {
            status: 'HELD',
            holdId: hold.id,
            version: { increment: 1 },
          },
        })
      );

      const results = await Promise.all(updatePromises);
      const updatedCount = results.reduce((sum, r) => sum + r.count, 0);

      if (updatedCount !== seatIds.length) {
        throw new Error('Concurrent modification detected');
      }

      return { success: true, holdId: hold.id };
    }, {
      isolationLevel: 'Serializable',
      timeout: 5000,
    });
  } catch (error) {
    console.error('Failed to create seat hold:', error);
    return { success: false, error: 'Failed to hold seats' };
  }
}
```

**Hold Extension Logic**:
```typescript
// lib/seating/extend-hold.ts
export async function extendSeatHold(
  holdId: string
): Promise<{ success: boolean; newExpiresAt?: Date; error?: string }> {
  const hold = await prisma.seatHold.findUnique({
    where: { id: holdId },
  });

  if (!hold) {
    return { success: false, error: 'Hold not found' };
  }

  if (hold.hasExtended) {
    return { success: false, error: 'Hold already extended' };
  }

  if (hold.status !== 'ACTIVE') {
    return { success: false, error: 'Hold is not active' };
  }

  // Extend by 5 minutes
  const newExpiresAt = new Date(hold.expiresAt.getTime() + 5 * 60 * 1000);

  await prisma.seatHold.update({
    where: { id: holdId },
    data: {
      expiresAt: newExpiresAt,
      extendedAt: new Date(),
      hasExtended: true,
    },
  });

  return { success: true, newExpiresAt };
}
```

**Cleanup Background Job**:
```typescript
// lib/cron/cleanup-expired-holds.ts
import { prisma } from '@/lib/prisma';
import { broadcastSeatUpdate } from '@/lib/real-time/socket-server';

export async function cleanupExpiredHolds() {
  const startTime = Date.now();

  try {
    // Find expired holds in batches
    const expiredHolds = await prisma.seatHold.findMany({
      where: {
        status: 'ACTIVE',
        expiresAt: { lt: new Date() },
      },
      take: 100, // Batch size
      select: {
        id: true,
        seatIds: true,
        eventId: true,
      },
    });

    if (expiredHolds.length === 0) {
      return { cleaned: 0, duration: Date.now() - startTime };
    }

    // Release seats in transaction
    await prisma.$transaction(async (tx) => {
      for (const hold of expiredHolds) {
        // Update seats to AVAILABLE
        await tx.seat.updateMany({
          where: {
            id: { in: hold.seatIds },
            holdId: hold.id,
          },
          data: {
            status: 'AVAILABLE',
            holdId: null,
          },
        });

        // Mark hold as EXPIRED
        await tx.seatHold.update({
          where: { id: hold.id },
          data: { status: 'EXPIRED' },
        });

        // Broadcast updates via WebSocket
        broadcastSeatUpdate(hold.eventId, {
          type: 'SEAT_RELEASED',
          seatIds: hold.seatIds,
          timestamp: new Date().toISOString(),
        });
      }
    });

    const duration = Date.now() - startTime;
    console.log(`Cleaned ${expiredHolds.length} expired holds in ${duration}ms`);

    return { cleaned: expiredHolds.length, duration };
  } catch (error) {
    console.error('Hold cleanup failed:', error);
    throw error;
  }
}
```

**Cron Job Configuration**:
```typescript
// app/api/cron/cleanup-holds/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { cleanupExpiredHolds } from '@/lib/cron/cleanup-expired-holds';

export async function GET(req: NextRequest) {
  // Verify cron secret
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await cleanupExpiredHolds();
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
```

**Vercel Cron Configuration** (`vercel.json`):
```json
{
  "crons": [
    {
      "path": "/api/cron/cleanup-holds",
      "schedule": "* * * * *"
    }
  ]
}
```

**Countdown Timer Component**:
```typescript
// components/seating/HoldTimer.tsx
export function HoldTimer({ expiresAt, onExpire, onExtend }: Props) {
  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft(expiresAt));
  const [hasExtended, setHasExtended] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      const newTimeLeft = calculateTimeLeft(expiresAt);
      setTimeLeft(newTimeLeft);

      if (newTimeLeft.total <= 0) {
        onExpire();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [expiresAt]);

  const handleExtend = async () => {
    const result = await extendHold(holdId);
    if (result.success) {
      setHasExtended(true);
      // Update expiresAt
    }
  };

  return (
    <div className="hold-timer">
      <div className={timeLeft.minutes < 3 ? 'text-red-500' : ''}>
        {timeLeft.minutes}:{timeLeft.seconds.toString().padStart(2, '0')}
      </div>
      {timeLeft.minutes < 3 && (
        <div className="text-red-500">⚠️ Time running out!</div>
      )}
      {!hasExtended && timeLeft.total > 0 && (
        <button onClick={handleExtend}>Extend by 5 minutes</button>
      )}
    </div>
  );
}
```

**Source Tree** (`docs/architecture/source-tree.md`):
```
src/
├── app/
│   ├── api/
│   │   ├── seating/
│   │   │   ├── hold/route.ts
│   │   │   ├── extend/route.ts
│   │   │   └── release/route.ts
│   │   └── cron/
│   │       └── cleanup-holds/route.ts
│   └── checkout/
│       └── page.tsx
├── components/
│   └── seating/
│       ├── HoldTimer.tsx
│       └── ExtendHoldButton.tsx
└── lib/
    ├── seating/
    │   ├── seat-hold.service.ts
    │   ├── extend-hold.ts
    │   └── release-hold.ts
    └── cron/
        └── cleanup-expired-holds.ts
```

### Testing

**Testing Requirements for this story**:
- Unit tests for hold creation logic
- Unit tests for hold extension
- Unit tests for hold expiration
- Unit tests for cleanup job
- Integration test for concurrent hold attempts
- Integration test for hold-to-purchase conversion
- E2E test for full hold lifecycle
- E2E test for timer countdown
- E2E test for hold extension
- E2E test for expiration handling
- Load test for cleanup job with 1000+ holds
- Test race conditions (concurrent hold/release)
- Test optimistic locking correctness
- Test timer accuracy
- Test orphaned hold cleanup

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