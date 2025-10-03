# Story: CHK-005 - Multi-Device Real-Time Synchronization

**Epic**: EPIC-006 - Mobile Check-in PWA
**Story Points**: 5
**Priority**: P1 (High)
**Status**: Draft
**Dependencies**: CHK-001 (PWA Framework), CHK-002 (Offline Mode), TIX-003 (Ticket Validation)

---

## Story

**As an** event organizer with multiple staff members checking in attendees
**I want to** have all devices synchronized in real-time
**So that** we prevent duplicate check-ins and maintain accurate counts across all entry points

---

## Acceptance Criteria

1. GIVEN multiple staff devices are online and checking in attendees
   WHEN any device performs a check-in
   THEN all other devices should:
   - Receive update within 2 seconds
   - Update attendee status to "Checked-In"
   - Update check-in statistics
   - Show real-time notification of change
   - Prevent that attendee from being checked-in again
   - Reflect changes in search results immediately

2. GIVEN I'm checking in an attendee on my device
   WHEN another staff member checks in the same person simultaneously
   THEN the system should:
   - Use server timestamp as authoritative source
   - Accept the first check-in to reach server
   - Reject the second as "Already Checked-In"
   - Show clear conflict message to second staff
   - Display who checked in the attendee
   - Log conflict for audit trail
   - Provide override option for managers

3. GIVEN my device was offline and I performed check-ins
   WHEN connection is restored
   THEN the system should:
   - Upload all queued check-ins automatically
   - Process them in chronological order
   - Detect any conflicts with other devices
   - Resolve conflicts using timestamp priority
   - Update my device with current server state
   - Show sync completion notification
   - Display any conflicts that occurred

4. GIVEN real-time sync is active
   WHEN I view the attendee list
   THEN I should see:
   - Live updates as others check in attendees
   - Animated status changes (pending → checked-in)
   - Timestamp of last check-in action
   - Which staff member performed check-in
   - Sync status indicator ("Live", "Syncing", "Offline")
   - Number of devices currently connected

5. GIVEN multiple devices are in poor network conditions
   WHEN intermittent connectivity occurs
   THEN the system should:
   - Automatically reconnect when possible
   - Buffer updates during disconnection
   - Apply buffered updates on reconnection
   - Maintain optimistic UI updates
   - Never lose check-in data
   - Show connection quality indicator

6. GIVEN I'm a manager viewing the check-in dashboard
   WHEN I access real-time monitoring
   THEN I should see:
   - All active check-in devices
   - Which staff member is on each device
   - Check-in rate per device
   - Last activity timestamp per device
   - Total synchronized check-ins
   - Any pending sync conflicts
   - Network status of all devices

---

## Tasks / Subtasks

- [ ] Implement WebSocket connection (AC: 1, 4)
  - [ ] Set up Socket.io server
  - [ ] Create WebSocket client
  - [ ] Handle connection lifecycle
  - [ ] Auto-reconnect on disconnect

- [ ] Create real-time event broadcasting (AC: 1)
  - [ ] Broadcast check-in events
  - [ ] Broadcast check-out events
  - [ ] Broadcast status updates
  - [ ] Room-based broadcasting per event

- [ ] Build conflict resolution system (AC: 2, 3)
  - [ ] Detect simultaneous check-ins
  - [ ] Use server timestamp as authority
  - [ ] Implement first-write-wins
  - [ ] Log all conflicts

- [ ] Implement optimistic UI updates (AC: 1, 5)
  - [ ] Update UI immediately
  - [ ] Queue action for sync
  - [ ] Rollback on failure
  - [ ] Show pending state

- [ ] Add sync queue management (AC: 3, 5)
  - [ ] Queue offline actions
  - [ ] Process queue on reconnection
  - [ ] Handle queue failures
  - [ ] Retry failed syncs

- [ ] Create sync status indicators (AC: 4, 5)
  - [ ] Show connection status
  - [ ] Display sync progress
  - [ ] Show last sync time
  - [ ] Connection quality indicator

- [ ] Build device monitoring dashboard (AC: 6)
  - [ ] Track active devices
  - [ ] Show device activity
  - [ ] Display device statistics
  - [ ] Real-time device list

- [ ] Implement operational transformation (AC: 2, 3)
  - [ ] Transform concurrent operations
  - [ ] Maintain consistency
  - [ - [ ] Handle order dependencies
  - [ ] Apply transformations correctly

- [ ] Add conflict notification system (AC: 2, 3)
  - [ ] Notify staff of conflicts
  - [ ] Show conflict details
  - [ ] Provide resolution options
  - [ ] Log for audit

- [ ] Create reconnection handling (AC: 5)
  - [ ] Detect disconnection
  - [ ] Attempt reconnection
  - [ ] Exponential backoff
  - [ ] Sync on reconnection

- [ ] Implement heartbeat mechanism (AC: 4, 6)
  - [ ] Send periodic heartbeats
  - [ ] Track device liveness
  - [ ] Timeout inactive devices
  - [ ] Update device status

- [ ] Add sync analytics (AC: 6)
  - [ ] Track sync events
  - [ ] Measure sync latency
  - [ ] Monitor conflict rate
  - [ ] Log sync failures

- [ ] Build manager override system (AC: 2)
  - [ ] Implement override permission
  - [ ] Force duplicate check-in
  - [ ] Log override actions
  - [ ] Require reason/note

- [ ] Create sync testing tools (AC: 3, 5)
  - [ ] Simulate network issues
  - [ ] Test conflict scenarios
  - [ ] Verify sync correctness
  - [ ] Load testing

---

## Dev Notes

### Architecture References

**Real-Time Sync Architecture** (`docs/architecture/sync-strategy.md`):
- WebSocket (Socket.io) for bidirectional communication
- Event-based broadcasting per event room
- Optimistic UI with server reconciliation
- Conflict resolution using server timestamps
- Automatic reconnection with exponential backoff

**WebSocket Events** (`docs/architecture/websocket-protocol.md`):
```typescript
// Client → Server
interface CheckInEvent {
  type: 'CHECK_IN';
  ticketId: string;
  staffId: string;
  timestamp: string;
  deviceId: string;
}

// Server → Clients
interface CheckInBroadcast {
  type: 'CHECK_IN_SUCCESS';
  ticketId: string;
  attendeeId: string;
  staffId: string;
  staffName: string;
  timestamp: string;
  deviceId: string;
}

interface ConflictEvent {
  type: 'CHECK_IN_CONFLICT';
  ticketId: string;
  existingCheckIn: CheckInData;
  attemptedCheckIn: CheckInData;
  resolution: 'FIRST_WINS' | 'OVERRIDE';
}
```

**Conflict Resolution Rules** (`docs/architecture/sync-strategy.md`):
1. Server timestamp is authoritative
2. First check-in to reach server wins
3. Later attempts receive conflict error
4. Manager can override with reason
5. All conflicts logged for audit
6. No silent failures

**Sync Queue Structure** (`docs/architecture/offline-sync.md`):
```typescript
interface SyncQueueItem {
  id: string;
  action: 'CHECK_IN' | 'CHECK_OUT';
  ticketId: string;
  clientTimestamp: string;
  serverTimestamp?: string;
  synced: boolean;
  attempts: number;
  lastAttempt?: string;
  error?: string;
}
```

**Optimistic UI Pattern**:
```typescript
// 1. Update UI immediately
setAttendeeStatus('checked-in');

// 2. Send to server
const result = await checkIn(ticketId);

// 3. Reconcile
if (result.conflict) {
  // Rollback UI
  setAttendeeStatus('pending');
  showConflictDialog(result.conflict);
} else {
  // Confirm success
  confirmCheckIn(result.data);
}
```

**WebSocket Connection Management**:
```typescript
// lib/sync/websocket-manager.ts
class WebSocketManager {
  private socket: Socket;
  private reconnectAttempts = 0;
  private maxReconnectDelay = 30000; // 30 seconds

  connect(eventId: string) {
    this.socket = io('/check-in', {
      query: { eventId },
      transports: ['websocket', 'polling'],
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 30000,
      timeout: 10000
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    this.socket.on('connect', this.onConnect);
    this.socket.on('disconnect', this.onDisconnect);
    this.socket.on('reconnect', this.onReconnect);
    this.socket.on('check-in', this.onCheckIn);
    this.socket.on('conflict', this.onConflict);
  }
}
```

**Source Tree** (`docs/architecture/source-tree.md`):
```
src/
├── app/
│   ├── api/
│   │   └── check-in/
│   │       └── sync/route.ts
│   └── check-in/
│       └── devices/page.tsx
├── components/
│   └── check-in/
│       ├── SyncStatus.tsx
│       ├── DeviceMonitor.tsx
│       ├── ConflictDialog.tsx
│       └── SyncIndicator.tsx
├── lib/
│   └── sync/
│       ├── websocket-manager.ts
│       ├── sync-queue.ts
│       ├── conflict-resolver.ts
│       └── operational-transform.ts
├── hooks/
│   ├── useRealtimeSync.ts
│   └── useDeviceMonitoring.ts
└── server/
    └── websocket/
        ├── socket-server.ts
        └── event-handlers.ts
```

**Network Resilience**:
- Heartbeat every 30 seconds
- Detect disconnection within 5 seconds
- Exponential backoff: 1s, 2s, 4s, 8s, 16s, 30s (max)
- Buffer up to 100 events during disconnection
- Sync buffered events on reconnection
- Fallback to polling if WebSocket fails

**Performance Considerations**:
- Use Socket.io rooms per event (prevent cross-event broadcasts)
- Throttle broadcasts (max 100/second per room)
- Compress large payloads
- Binary transport for QR data
- Connection pooling on server
- Redis adapter for horizontal scaling

**Security**:
- Authenticate WebSocket connections
- Validate staff permissions per event
- Encrypt sensitive data in transit
- Rate limit per device
- Audit all sync actions

**Device Monitoring**:
```typescript
interface DeviceStatus {
  deviceId: string;
  staffId: string;
  staffName: string;
  lastSeen: Date;
  checkInCount: number;
  averageCheckInTime: number;
  networkQuality: 'excellent' | 'good' | 'fair' | 'poor';
  online: boolean;
}
```

### Testing

**Testing Requirements for this story**:
- Unit tests for sync queue
- Unit tests for conflict resolution
- Unit tests for operational transform
- Integration test for WebSocket connection
- Integration test for real-time broadcasts
- Integration test for conflict scenarios
- E2E test for multi-device sync
- E2E test for offline-to-online sync
- E2E test for simultaneous check-ins
- Test network disconnection/reconnection
- Test conflict resolution flows
- Test manager override
- Load test with 50+ concurrent devices
- Stress test with rapid check-ins
- Test WebSocket failover to polling
- Test queue processing
- Test device monitoring
- Chaos engineering (random disconnects)

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