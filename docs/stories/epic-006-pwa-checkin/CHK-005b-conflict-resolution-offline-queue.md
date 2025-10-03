# Story: CHK-005b - Conflict Resolution & Offline Queue

**Epic**: EPIC-006 - Mobile Check-in PWA
**Story Points**: 2
**Priority**: P1 (High)
**Status**: Not Started
**Parent Story**: CHK-005 (Multi-Device Sync - 5 pts)
**Dependencies**: CHK-005a (WebSocket Sync Infrastructure), TIX-003b (Offline Validation)

---

## Story

**As an** event staff member using offline check-in
**I want** my offline check-ins to sync automatically when online
**So that** all devices have consistent data without manual intervention

**As a** system handling concurrent check-ins
**I want** intelligent conflict resolution
**So that** duplicate check-ins are handled gracefully across devices

---

## Acceptance Criteria

### AC1: Operational Transformation for Conflicts
**Given** two devices check in the same ticket simultaneously
**When** both requests reach the server
**Then** the system should:
- Use server timestamp as authoritative source
- Accept first request to commit transaction (first-write-wins)
- Reject second request with 409 Conflict
- Return conflict details:
  ```typescript
  {
    status: 'CONFLICT',
    winner: {
      deviceId: string,
      staffId: string,
      staffName: string,
      timestamp: string
    },
    rejected: {
      deviceId: string,
      staffId: string,
      timestamp: string
    },
    resolution: 'FIRST_WINS'
  }
  ```
- Log conflict for audit trail
- Broadcast conflict resolution to all devices
- Update losing device's local cache

### AC2: Offline Check-In Queue
**Given** device is offline and check-ins occur
**When** validations succeed offline
**Then** the system should:
- Store each check-in in IndexedDB queue:
  ```typescript
  {
    id: string,
    ticketId: string,
    eventId: string,
    staffId: string,
    deviceId: string,
    clientTimestamp: string,
    location?: string,
    qrData: string,
    validationResult: 'VALID',
    synced: false,
    attempts: 0
  }
  ```
- Maintain queue in chronological order
- Persist across page refreshes
- Show pending count in UI: "3 pending syncs"
- Limit queue to 500 items (warn at 400)
- Prevent duplicate entries (same ticketId)

### AC3: Automatic Sync on Reconnection
**Given** device reconnects after offline period
**When** network is restored
**Then** the system should:
- Detect online state (navigator.onLine + ping test)
- Show "Syncing offline check-ins..." notification
- Process queue in FIFO order
- Send each check-in to validation API
- Handle each response:
  - 200 Success → Remove from queue
  - 409 Conflict → Apply conflict resolution
  - 4xx Error → Log and remove from queue
  - 5xx Error → Retry with backoff
- Update UI with sync progress: "Synced 5 of 12"
- Complete within 2 minutes for 100 items
- Show completion: "All synced ✓" or "3 conflicts resolved"

### AC4: Timestamp-Based Conflict Resolution
**Given** offline check-in syncs and conflicts
**When** ticket was already checked-in
**Then** resolve using timestamps:

**Case 1: Server check-in is earlier**
```typescript
serverTime: '2025-09-30T14:30:00Z'
clientTime: '2025-09-30T14:31:00Z'
→ Server wins (correct state)
→ Discard client check-in
→ Update local cache with server data
```

**Case 2: Client check-in is earlier (edge case)**
```typescript
serverTime: '2025-09-30T14:31:00Z'
clientTime: '2025-09-30T14:30:00Z'
→ Server still wins (trust server time)
→ Client device clock may be wrong
→ Log time discrepancy for review
```

**Always**: Server state is source of truth

### AC5: Conflict Notification System
**Given** conflict occurs during sync
**When** notifying user
**Then** display:

**Toast Notification**:
```
⚠️ Sync Conflict
Ticket #ABC123 already checked in by Jane Doe at 2:30 PM
Your offline check-in at 2:31 PM was discarded
```

**Conflict Log Entry**:
```typescript
{
  type: 'CONFLICT',
  ticketId: 'ABC123',
  attendeeName: 'John Smith',
  localCheckIn: {
    staffName: 'Bob Johnson',
    timestamp: '2025-09-30T14:31:00Z',
    deviceId: 'device-123'
  },
  serverCheckIn: {
    staffName: 'Jane Doe',
    timestamp: '2025-09-30T14:30:00Z',
    deviceId: 'device-456'
  },
  resolution: 'SERVER_WINS',
  resolvedAt: '2025-09-30T14:35:00Z'
}
```

**Manager Dashboard Alert**:
- Show conflict count for event
- List all conflicts with details
- Export conflict report (CSV)

### AC6: Sync Queue Management
**Given** sync queue needs maintenance
**When** managing queue
**Then** provide:

**Queue Operations**:
- View pending items (list view)
- Retry failed items
- Clear synced items
- Cancel specific item
- Force sync now (manual trigger)
- Clear entire queue (requires confirmation)

**Queue Status Display**:
```
Sync Queue (8 items)
├─ 5 pending
├─ 2 syncing...
└─ 1 failed (retry available)

Last synced: 2 minutes ago
Next auto-sync: When online
```

**Queue Limits**:
- Max 500 items
- Warn at 400 items (80%)
- Auto-remove oldest if full
- Log removed items

### AC7: Network State Detection
**Given** device network state changes
**When** detecting connectivity
**Then** implement:

**Detection Methods**:
1. `navigator.onLine` event listener
2. Ping API endpoint every 30s
3. WebSocket connection status
4. Request timeout detection

**State Transitions**:
```
ONLINE → OFFLINE
  → Pause sync
  → Queue check-ins
  → Show offline banner

OFFLINE → ONLINE
  → Start sync process
  → Show syncing indicator
  → Resume normal operation
```

**Connection Quality**:
- Good: < 100ms latency
- Fair: 100-500ms latency
- Poor: > 500ms latency
- Show indicator in UI

---

## Tasks / Subtasks

### Conflict Resolution Logic
- [ ] Implement conflict detector
  - [ ] File: `/lib/sync/conflict-resolver.ts`
  - [ ] Compare timestamps
  - [ ] Determine winner
  - [ ] Format conflict data
  - [ ] Log conflicts

- [ ] Build conflict handler
  - [ ] Apply server state
  - [ ] Update local cache
  - [ ] Remove from queue
  - [ ] Notify user
  - [ ] Track for reporting

### Sync Queue System
- [ ] Create queue manager
  - [ ] File: `/lib/sync/sync-queue.ts`
  - [ ] Add items to queue
  - [ ] Get pending items
  - [ ] Remove synced items
  - [ ] Retry failed items
  - [ ] Clear queue

- [ ] Implement queue storage
  - [ ] Use IndexedDB
  - [ ] Maintain order
  - [ ] Persist data
  - [ ] Handle full queue
  - [ ] Clean old items

- [ ] Build queue processor
  - [ ] Process FIFO
  - [ ] Call API for each item
  - [ ] Handle responses
  - [ ] Update queue status
  - [ ] Track progress

### Network Detection
- [ ] Create network monitor
  - [ ] File: `/lib/sync/network-monitor.ts`
  - [ ] Listen to online/offline events
  - [ ] Ping API endpoint
  - [ ] Measure latency
  - [ ] Update connection status

- [ ] Build reconnection handler
  - [ ] Detect state change
  - [ ] Trigger sync
  - [ ] Show notifications
  - [ ] Update UI indicators

### UI Components
- [ ] Create sync status component
  - [ ] Component: `/components/check-in/SyncStatus.tsx`
  - [ ] Show pending count
  - [ ] Display sync progress
  - [ ] Show conflicts
  - [ ] Manual sync button

- [ ] Build conflict notification
  - [ ] Toast notification
  - [ ] Conflict details modal
  - [ ] Dismiss action
  - [ ] View all conflicts

- [ ] Add queue management UI
  - [ ] Queue list view
  - [ ] Retry button
  - [ ] Clear queue
  - [ ] Item details

### Integration
- [ ] Connect to WebSocket events
  - [ ] Listen for conflicts
  - [ ] Update local state
  - [ ] Broadcast to UI

- [ ] Integrate with validation API
  - [ ] Send queued items
  - [ ] Handle responses
  - [ ] Apply updates

---

## Dev Notes

### Conflict Resolution Service

```typescript
// lib/sync/conflict-resolver.ts

import { prisma } from '@/lib/prisma';

interface ConflictResult {
  hasConflict: boolean;
  winner?: CheckIn;
  loser?: CheckIn;
  resolution: 'SERVER_WINS' | 'CLIENT_WINS' | 'NO_CONFLICT';
}

export class ConflictResolver {
  async resolve(
    clientCheckIn: QueuedCheckIn,
    serverCheckIn?: CheckIn
  ): Promise<ConflictResult> {
    if (!serverCheckIn) {
      return {
        hasConflict: false,
        resolution: 'NO_CONFLICT'
      };
    }

    // Server timestamp is always authoritative
    const serverTime = new Date(serverCheckIn.timestamp);
    const clientTime = new Date(clientCheckIn.clientTimestamp);

    // Log time discrepancy if significant
    const timeDiff = Math.abs(serverTime.getTime() - clientTime.getTime());
    if (timeDiff > 60000) { // 1 minute
      console.warn('Significant time discrepancy:', timeDiff, 'ms');
      await this.logTimeDiscrepancy(clientCheckIn, serverCheckIn, timeDiff);
    }

    // Server always wins
    return {
      hasConflict: true,
      winner: serverCheckIn,
      loser: clientCheckIn,
      resolution: 'SERVER_WINS'
    };
  }

  async applyResolution(result: ConflictResult): Promise<void> {
    if (!result.hasConflict) return;

    // Log conflict
    await prisma.syncConflict.create({
      data: {
        ticketId: result.winner!.ticketId,
        eventId: result.winner!.eventId,
        winnerDeviceId: result.winner!.deviceId,
        winnerStaffId: result.winner!.staffId,
        winnerTimestamp: result.winner!.timestamp,
        loserDeviceId: result.loser!.deviceId,
        loserStaffId: result.loser!.staffId,
        loserTimestamp: result.loser!.clientTimestamp,
        resolution: result.resolution,
        resolvedAt: new Date()
      }
    });

    // Update local cache with server state
    await this.updateLocalCache(result.winner!);

    // Notify user
    this.notifyConflict(result);
  }

  private async updateLocalCache(serverCheckIn: CheckIn): Promise<void> {
    const db = await openOfflineCache();
    const ticket = await db.get('tickets', serverCheckIn.ticketId);

    if (ticket) {
      ticket.checkedIn = true;
      ticket.checkedInAt = serverCheckIn.timestamp;
      ticket.checkedInBy = serverCheckIn.staffId;
      await db.put('tickets', ticket);
    }
  }

  private notifyConflict(result: ConflictResult): void {
    const message = `Ticket already checked in by ${result.winner!.staffName} at ${new Date(result.winner!.timestamp).toLocaleTimeString()}`;

    // Show toast notification
    window.dispatchEvent(new CustomEvent('sync-conflict', {
      detail: {
        message,
        winner: result.winner,
        loser: result.loser
      }
    }));
  }
}
```

### Sync Queue Manager

```typescript
// lib/sync/sync-queue.ts

import { openDB } from 'idb';

export class SyncQueueManager {
  private db: any;
  private readonly MAX_QUEUE_SIZE = 500;

  async initialize(): Promise<void> {
    this.db = await openDB('sync-queue', 1, {
      upgrade(db) {
        db.createObjectStore('queue', {
          keyPath: 'id',
          autoIncrement: true
        });
      }
    });
  }

  async add(item: QueuedCheckIn): Promise<void> {
    const count = await this.count();

    if (count >= this.MAX_QUEUE_SIZE) {
      // Remove oldest item
      const oldest = await this.getOldest();
      if (oldest) {
        await this.remove(oldest.id);
        console.warn('Queue full, removed oldest item:', oldest);
      }
    }

    // Check for duplicate
    const existing = await this.findByTicketId(item.ticketId);
    if (existing) {
      console.warn('Duplicate check-in queued, skipping:', item.ticketId);
      return;
    }

    await this.db.add('queue', {
      ...item,
      queuedAt: new Date().toISOString(),
      synced: false,
      attempts: 0
    });
  }

  async getPending(): Promise<QueuedCheckIn[]> {
    const all = await this.db.getAll('queue');
    return all
      .filter((item: any) => !item.synced)
      .sort((a: any, b: any) =>
        new Date(a.queuedAt).getTime() - new Date(b.queuedAt).getTime()
      );
  }

  async remove(id: number): Promise<void> {
    await this.db.delete('queue', id);
  }

  async markSynced(id: number): Promise<void> {
    const item = await this.db.get('queue', id);
    if (item) {
      item.synced = true;
      item.syncedAt = new Date().toISOString();
      await this.db.put('queue', item);
    }
  }

  async incrementAttempts(id: number): Promise<void> {
    const item = await this.db.get('queue', id);
    if (item) {
      item.attempts++;
      item.lastAttempt = new Date().toISOString();
      await this.db.put('queue', item);
    }
  }

  async count(): Promise<number> {
    return await this.db.count('queue');
  }

  async clear(): Promise<void> {
    await this.db.clear('queue');
  }

  private async findByTicketId(ticketId: string): Promise<any> {
    const all = await this.db.getAll('queue');
    return all.find((item: any) => item.ticketId === ticketId);
  }

  private async getOldest(): Promise<any> {
    const all = await this.db.getAll('queue');
    return all.sort((a: any, b: any) =>
      new Date(a.queuedAt).getTime() - new Date(b.queuedAt).getTime()
    )[0];
  }
}
```

### Sync Processor

```typescript
// lib/sync/sync-processor.ts

import { ConflictResolver } from './conflict-resolver';
import { SyncQueueManager } from './sync-queue';

export class SyncProcessor {
  private queue: SyncQueueManager;
  private resolver: ConflictResolver;
  private isProcessing = false;

  constructor() {
    this.queue = new SyncQueueManager();
    this.resolver = new ConflictResolver();
  }

  async processPendingSync(): Promise<SyncResult> {
    if (this.isProcessing) {
      console.warn('Sync already in progress');
      return { success: false, reason: 'Already processing' };
    }

    this.isProcessing = true;

    try {
      const pending = await this.queue.getPending();

      if (pending.length === 0) {
        return { success: true, processed: 0, conflicts: 0 };
      }

      console.log(`Processing ${pending.length} queued check-ins`);

      let processed = 0;
      let conflicts = 0;
      let errors = 0;

      for (const item of pending) {
        try {
          const response = await fetch('/api/check-in/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(item)
          });

          if (response.ok) {
            // Success
            await this.queue.markSynced(item.id);
            processed++;
          } else if (response.status === 409) {
            // Conflict
            const conflict = await response.json();
            await this.resolver.applyResolution(conflict);
            await this.queue.remove(item.id);
            conflicts++;
          } else {
            // Error
            await this.queue.incrementAttempts(item.id);
            errors++;

            if (item.attempts >= 3) {
              // Max retries, remove from queue
              await this.queue.remove(item.id);
              console.error('Max retries reached for item:', item);
            }
          }

          // Progress update
          this.emitProgress(processed, pending.length);

        } catch (error) {
          console.error('Sync error:', error);
          errors++;
        }
      }

      return {
        success: true,
        processed,
        conflicts,
        errors
      };

    } finally {
      this.isProcessing = false;
    }
  }

  private emitProgress(current: number, total: number): void {
    window.dispatchEvent(new CustomEvent('sync-progress', {
      detail: { current, total }
    }));
  }
}
```

---

## Testing

### Unit Tests
- [ ] Conflict detection logic
- [ ] Timestamp comparison
- [ ] Queue operations (add/remove/update)
- [ ] Network state detection
- [ ] Sync processor logic

### Integration Tests
- [ ] Complete offline → online sync flow
- [ ] Conflict resolution end-to-end
- [ ] Queue processing with errors
- [ ] WebSocket conflict broadcasting
- [ ] Local cache updates

### Edge Cases
- [ ] Two devices offline, same ticket
- [ ] Queue at max capacity
- [ ] Clock skew between devices
- [ ] Network drops during sync
- [ ] Multiple conflicts in batch
- [ ] Browser refresh during sync

---

## Environment Variables

```bash
# Sync configuration
SYNC_BATCH_SIZE=10
SYNC_RETRY_ATTEMPTS=3
SYNC_RETRY_DELAY=1000
MAX_QUEUE_SIZE=500
SYNC_TIMEOUT_MS=30000
```

---

## Change Log

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-09-30 | BMAD SM Agent | Initial sharded story from CHK-005 |

---

*Sharded from CHK-005 (5 pts) - Part 2 of 2*
*Depends on: CHK-005a - WebSocket Sync Infrastructure (3 pts)*
*Generated by BMAD SM Agent*