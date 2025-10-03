# Story: SEAT-003 - Real-Time Seat Availability

**Epic**: EPIC-009 - Reserved Seating System
**Story Points**: 8
**Priority**: E1 (High)
**Status**: Draft
**Dependencies**: SEAT-001 (Seating Chart Creator), SEAT-002 (Interactive Seat Selection), WebSocket infrastructure

---

## Story

**As a** customer viewing a seating chart across multiple devices
**I want to** see seat availability update in real-time
**So that** I know immediately when seats become available or unavailable without refreshing

---

## Acceptance Criteria

1. GIVEN multiple users are viewing the same event seating chart
   WHEN one user selects or releases a seat
   THEN all other users should see:
   - Seat status change within 1 second
   - Smooth visual transition (not jarring)
   - Updated availability counter
   - Color change reflecting new status
   - No page refresh required

2. GIVEN I have the seating chart open on multiple devices
   WHEN seat availability changes
   THEN all my devices should:
   - Receive the update simultaneously
   - Show consistent seat status across all screens
   - Sync my own selections across devices
   - Maintain connection even when backgrounded
   - Reconnect automatically after network interruption

3. GIVEN I'm viewing a high-demand event
   WHEN hundreds of users are selecting seats simultaneously
   THEN the system should:
   - Handle 1000+ concurrent WebSocket connections
   - Broadcast updates with <1 second latency
   - Prevent race conditions on seat selection
   - Maintain data consistency across all clients
   - Scale horizontally to handle load
   - Degrade gracefully if WebSocket unavailable

4. GIVEN I select a seat that was just taken
   WHEN the conflict is detected
   THEN the system should:
   - Immediately show "Seat no longer available" message
   - Remove the seat from my selection
   - Revert the visual state to "taken"
   - Suggest 3 similar alternative seats
   - Update my total price accordingly
   - Allow me to continue with remaining selections

5. GIVEN the WebSocket connection is interrupted
   WHEN I experience network issues
   THEN the system should:
   - Show "Connection lost" indicator
   - Attempt automatic reconnection (exponential backoff)
   - Fall back to polling every 5 seconds
   - Sync state upon reconnection
   - Warn me my selections may not be reserved
   - Restore full functionality when reconnected

6. GIVEN I'm on a slow or unstable connection
   WHEN real-time updates are delayed
   THEN the system should:
   - Show connection quality indicator
   - Queue updates and apply in order
   - Prevent out-of-order seat status changes
   - Show loading state for delayed updates
   - Maintain optimistic UI for my selections
   - Validate selections before checkout

---

## Tasks / Subtasks

- [ ] Set up WebSocket infrastructure (AC: 1, 3)
  - [ ] Configure Socket.io server
  - [ ] Set up Redis for horizontal scaling
  - [ ] Create room-based connections per event
  - [ ] Implement connection authentication

- [ ] Implement seat status broadcasting (AC: 1, 2)
  - [ ] Create seat update event emitters
  - [ ] Broadcast to all clients in event room
  - [ ] Filter updates by event ID
  - [ ] Optimize payload size

- [ ] Build client-side WebSocket connection (AC: 1, 2, 5)
  - [ ] Establish Socket.io client connection
  - [ ] Subscribe to event-specific updates
  - [ ] Handle connection lifecycle
  - [ ] Implement reconnection logic

- [ ] Create real-time seat status synchronization (AC: 1, 2)
  - [ ] Update seat state on broadcast receive
  - [ ] Merge server state with local state
  - [ ] Trigger UI re-renders efficiently
  - [ ] Handle batch updates

- [ ] Implement race condition prevention (AC: 3, 4)
  - [ ] Add optimistic locking on seat selection
  - [ ] Use database transactions with locks
  - [ ] Implement conflict detection
  - [ ] Return conflict errors to client

- [ ] Build connection quality monitoring (AC: 5, 6)
  - [ ] Track connection latency
  - [ ] Show connection status indicator
  - [ ] Detect connection degradation
  - [ ] Display warnings to users

- [ ] Implement fallback polling mechanism (AC: 5)
  - [ ] Create polling endpoint for seat status
  - [ ] Activate when WebSocket unavailable
  - [ ] Implement 5-second interval polling
  - [ ] Switch back to WebSocket when available

- [ ] Add automatic reconnection with exponential backoff (AC: 5)
  - [ ] Detect disconnection events
  - [ ] Implement retry with backoff (1s, 2s, 4s, 8s, 16s)
  - [ ] Sync state after reconnection
  - [ ] Notify user of reconnection

- [ ] Create conflict resolution UI (AC: 4)
  - [ ] Detect seat selection conflicts
  - [ ] Show conflict notification
  - [ ] Suggest alternative seats
  - [ ] Update cart and pricing

- [ ] Optimize WebSocket performance for scale (AC: 3)
  - [ ] Implement Redis pub/sub for clustering
  - [ ] Use room-based broadcasting
  - [ ] Compress WebSocket messages
  - [ ] Implement message batching

- [ ] Add multi-device synchronization (AC: 2)
  - [ ] Sync selections across user's devices
  - [ ] Use userId + sessionId for tracking
  - [ ] Broadcast user's own actions
  - [ ] Handle session conflicts

- [ ] Implement ordered update processing (AC: 6)
  - [ ] Add timestamps to updates
  - [ ] Queue out-of-order messages
  - [ ] Apply updates in correct sequence
  - [ ] Handle missed updates

- [ ] Create connection state management (AC: 5, 6)
  - [ ] Track connection state (connected, reconnecting, disconnected, degraded)
  - [ ] Persist state in React context
  - [ ] Show visual indicators
  - [ ] Disable seat selection when disconnected

- [ ] Add load testing and stress testing (AC: 3)
  - [ ] Simulate 1000+ concurrent connections
  - [ ] Test message broadcast latency
  - [ ] Verify race condition prevention
  - [ ] Test graceful degradation

---

## Dev Notes

### Architecture References

**Real-Time Architecture** (`docs/architecture/real-time.md`):
- Socket.io for WebSocket connections
- Redis pub/sub for horizontal scaling
- Room-based connections per event
- Fallback to polling when WebSocket unavailable
- <1 second update latency requirement
- Support 1000+ concurrent users per event

**WebSocket Message Format**:
```typescript
interface SeatUpdateMessage {
  type: 'SEAT_RESERVED' | 'SEAT_RELEASED' | 'SEAT_PURCHASED' | 'SEAT_EXPIRED';
  eventId: string;
  seatIds: string[];
  userId?: string;
  timestamp: string;
  metadata?: {
    section?: string;
    row?: string;
    price?: number;
  };
}

interface SeatStatusResponse {
  eventId: string;
  seats: {
    [seatId: string]: {
      status: 'available' | 'reserved' | 'purchased';
      reservedBy?: string;
      reservedUntil?: string;
    };
  };
  timestamp: string;
}
```

**Race Condition Prevention** (`docs/architecture/concurrency.md`):
- Optimistic locking with version numbers
- Database row-level locks on seat updates
- Atomic compare-and-swap operations
- Conflict detection and client notification
- Transaction isolation level: SERIALIZABLE

**Database Optimization**:
```sql
-- Add optimistic locking
ALTER TABLE Seat ADD COLUMN version INT DEFAULT 0;

-- Update seat with optimistic lock
UPDATE Seat
SET status = 'reserved',
    reservedBy = $userId,
    version = version + 1
WHERE id = $seatId
  AND status = 'available'
  AND version = $expectedVersion;

-- Create index for fast seat lookups
CREATE INDEX idx_seat_event_status ON Seat(eventId, status);
CREATE INDEX idx_seat_reserved_until ON Seat(reservedUntil) WHERE status = 'reserved';
```

**WebSocket Server Setup**:
```typescript
// lib/real-time/socket-server.ts
import { Server } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';

const pubClient = createClient({ url: process.env.REDIS_URL });
const subClient = pubClient.duplicate();

const io = new Server(httpServer, {
  cors: {
    origin: process.env.NEXT_PUBLIC_APP_URL,
    credentials: true,
  },
  transports: ['websocket', 'polling'],
});

io.adapter(createAdapter(pubClient, subClient));

io.on('connection', (socket) => {
  // Authenticate socket connection
  const userId = socket.handshake.auth.userId;
  const eventId = socket.handshake.query.eventId;

  // Join event-specific room
  socket.join(`event:${eventId}`);

  // Send current seat status
  socket.emit('seat:initial', await getSeatStatus(eventId));

  // Handle seat selection
  socket.on('seat:select', async (data) => {
    const result = await reserveSeat(data);
    if (result.success) {
      io.to(`event:${eventId}`).emit('seat:update', {
        type: 'SEAT_RESERVED',
        seatIds: [data.seatId],
        timestamp: new Date().toISOString(),
      });
    } else {
      socket.emit('seat:conflict', {
        seatId: data.seatId,
        reason: result.error,
      });
    }
  });
});
```

**Client-Side WebSocket Hook**:
```typescript
// hooks/useRealTimeSeats.ts
export function useRealTimeSeats(eventId: string) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'reconnecting'>('disconnected');
  const [seatStatus, setSeatStatus] = useState<Map<string, SeatStatus>>(new Map());

  useEffect(() => {
    const newSocket = io(process.env.NEXT_PUBLIC_SOCKET_URL, {
      auth: { userId: session?.user?.id },
      query: { eventId },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 16000,
      reconnectionAttempts: Infinity,
    });

    newSocket.on('connect', () => {
      setConnectionStatus('connected');
    });

    newSocket.on('disconnect', () => {
      setConnectionStatus('disconnected');
    });

    newSocket.on('reconnecting', () => {
      setConnectionStatus('reconnecting');
    });

    newSocket.on('seat:update', (message: SeatUpdateMessage) => {
      updateSeatStatus(message);
    });

    newSocket.on('seat:conflict', (data) => {
      handleConflict(data);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [eventId]);

  return { socket, connectionStatus, seatStatus };
}
```

**Fallback Polling**:
```typescript
// lib/real-time/fallback-polling.ts
export function useFallbackPolling(eventId: string, enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;

    const interval = setInterval(async () => {
      const status = await fetch(`/api/seating/status/${eventId}`);
      const data = await status.json();
      updateSeatStatus(data);
    }, 5000);

    return () => clearInterval(interval);
  }, [eventId, enabled]);
}
```

**Performance Optimization**:
- Use Redis pub/sub for multi-server scaling
- Compress WebSocket messages with permessage-deflate
- Batch multiple seat updates into single message
- Implement virtual scrolling for large venue charts
- Debounce UI updates (max 60fps)
- Use React.memo for seat components

**Source Tree** (`docs/architecture/source-tree.md`):
```
src/
├── app/
│   ├── api/
│   │   └── seating/
│   │       ├── status/[eventId]/route.ts
│   │       └── ws/route.ts
│   └── events/
│       └── [id]/
│           └── seats/page.tsx
├── components/
│   └── seating/
│       ├── RealtimeChart.tsx
│       ├── ConnectionStatus.tsx
│       └── ConflictNotification.tsx
├── lib/
│   └── real-time/
│       ├── socket-server.ts
│       ├── socket-client.ts
│       ├── fallback-polling.ts
│       └── conflict-resolver.ts
└── hooks/
    ├── useRealTimeSeats.ts
    └── useConnectionStatus.ts
```

### Testing

**Testing Requirements for this story**:
- Unit tests for WebSocket message handlers
- Unit tests for conflict detection logic
- Unit tests for fallback polling
- Integration test for seat reservation with race conditions
- Integration test for multi-user seat selection
- E2E test for real-time updates across browsers
- E2E test for connection loss and reconnection
- E2E test for conflict resolution
- Load test with 1000+ concurrent connections
- Stress test with rapid seat selections
- Performance test for update latency (<1 second)
- Test Redis pub/sub scaling
- Test optimistic locking correctness
- Test graceful degradation to polling
- Network partition testing (chaos engineering)

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