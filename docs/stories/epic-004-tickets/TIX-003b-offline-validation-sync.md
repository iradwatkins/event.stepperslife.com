# Story: TIX-003b - Offline Validation & Sync

**Epic**: EPIC-004 - Digital Ticket System
**Story Points**: 2
**Priority**: P0 (Critical)
**Status**: Not Started
**Parent Story**: TIX-003 (Ticket Validation System - 5 pts)
**Dependencies**: TIX-003a (QR Validation API & Security), CHK-002 (Offline Mode)

---

## Story

**As an** event staff member at a venue with poor connectivity
**I want** to validate tickets even when offline
**So that** check-in continues smoothly regardless of network issues

**As a** system architect
**I want** validated offline check-ins to sync when online
**So that** all devices have consistent ticket status and no duplicates occur

---

## Acceptance Criteria

### AC1: Pre-Event Ticket Cache Download
**Given** event check-in begins soon (within 24 hours)
**When** staff device has internet connection
**Then** the system should:
- Auto-download all issued tickets for the event
- Store in IndexedDB (browser-based offline storage)
- Cache ticket IDs, signatures, attendee names, tiers
- Include event validation rules and policies
- Show download progress (X of Y tickets)
- Complete within 30 seconds for 500 tickets
- Indicate cache is ready for offline use
- Update cache when new tickets are issued
- Compress cached data to save storage

**And** cached data should include:
```typescript
{
  ticketId: string,
  signature: string,
  attendeeName: string,
  attendeeEmail: string,
  tier: string,
  eventId: string,
  orderId: string,
  timestamp: number,
  checkedIn: boolean  // Initially false
}
```

### AC2: Offline Validation Logic
**Given** device is offline or API request times out
**When** staff scans a ticket
**Then** the system should:
- Detect offline state (network timeout after 3 seconds)
- Look up ticket in IndexedDB cache
- Verify signature using cached validation algorithm
- Check if ticket was already checked-in (in cache)
- Update local cache with check-in status
- Display validation result immediately (<500ms)
- Show "OFFLINE MODE" indicator prominently
- Add check-in to sync queue for later upload
- Work identically to online mode from user perspective

### AC3: Sync Queue Management
**Given** check-ins occur while offline
**When** validations are successful
**Then** the system should:
- Add each check-in to sync queue in IndexedDB
- Store complete validation details:
  - ticketId, staffMemberId, deviceId
  - timestamp (device time)
  - location, validation result
  - QR code data
- Maintain queue order (FIFO)
- Persist queue across page refreshes
- Show count of pending syncs in UI
- Limit queue size to 1000 items
- Warn if approaching limit

### AC4: Automatic Sync on Reconnection
**Given** device was offline and has queued check-ins
**When** internet connection is restored
**Then** the system should:
- Detect online state (ping API endpoint)
- Display "Syncing..." indicator
- Process sync queue in chronological order
- Send each queued check-in to API
- Handle conflicts (ticket already checked-in by another device)
- Update local cache with server response
- Remove successfully synced items from queue
- Retry failed syncs (3 attempts with backoff)
- Complete all syncs within 2 minutes
- Show sync completion notification

### AC5: Conflict Resolution
**Given** offline check-in syncs to server
**When** ticket was already checked-in by another device
**Then** the system should:
- Detect conflict from API response (409 status)
- Keep server version as source of truth
- Update local cache with server state
- Log conflict for admin review
- Show conflict notification to staff:
  - "Ticket was already checked-in by [staff name] at [time]"
  - "Your offline check-in at [time] was rejected"
- Remove conflicting item from sync queue
- Continue syncing remaining items
- Generate conflict report for organizer

### AC6: Cache Validity & Updates
**Given** cached ticket data may become stale
**When** connection is available
**Then** the system should:
- Refresh cache every 5 minutes while online
- Pull only changed tickets (incremental update)
- Update check-in statuses from server
- Invalidate cache after 24 hours
- Force refresh if cache version mismatch
- Handle tickets added after cache download
- Warn if cache is older than 1 hour
- Provide manual refresh button

### AC7: Offline Mode User Experience
**Given** device is in offline mode
**When** staff is checking in attendees
**Then** the UI should:
- Show persistent "OFFLINE MODE" banner (orange)
- Display cached ticket count
- Show sync queue count
- Disable features that require connectivity
- Update sync status in real-time
- Show last sync timestamp
- Provide "Force Sync" button
- Indicate when back online (green)

---

## Tasks / Subtasks

### IndexedDB Cache Implementation
- [ ] Create offline cache database
  - [ ] File: `/lib/services/offline-validation.service.ts`
  - [ ] Initialize IndexedDB with `idb` library
  - [ ] Create object stores: `tickets`, `syncQueue`, `metadata`
  - [ ] Define indexes for fast lookups
  - [ ] Handle database upgrades

- [ ] Build cache download functionality
  - [ ] API endpoint: GET `/api/events/[eventId]/tickets/cache`
  - [ ] Fetch all issued tickets
  - [ ] Transform for offline storage
  - [ ] Write to IndexedDB in batches
  - [ ] Show progress indicator

- [ ] Implement cache refresh logic
  - [ ] Incremental update endpoint
  - [ ] Compare cache version with server
  - [ ] Fetch only changed tickets
  - [ ] Update IndexedDB atomically
  - [ ] Handle cache invalidation

### Offline Validation
- [ ] Create offline validation function
  - [ ] Check ticket exists in cache
  - [ ] Verify signature offline (simplified)
  - [ ] Check local check-in status
  - [ ] Update cache with check-in
  - [ ] Return validation result

- [ ] Add offline mode detection
  - [ ] Ping API endpoint periodically
  - [ ] Detect request timeout (3s)
  - [ ] Set offline state flag
  - [ ] Update UI indicators
  - [ ] Listen for online event

### Sync Queue System
- [ ] Build sync queue management
  - [ ] Add items to IndexedDB queue
  - [ ] Store complete validation data
  - [ ] Maintain FIFO order
  - [ ] Prevent duplicates
  - [ ] Handle queue full scenario

- [ ] Implement sync processor
  - [ ] Process queue on reconnection
  - [ ] Send POST to validation API
  - [ ] Handle API responses
  - [ ] Retry failed syncs (3x)
  - [ ] Remove successful items
  - [ ] Log sync results

- [ ] Create conflict handler
  - [ ] Detect 409 conflict responses
  - [ ] Update local cache
  - [ ] Remove from sync queue
  - [ ] Log conflict details
  - [ ] Notify user

### UI Components
- [ ] Build offline mode banner
  - [ ] Component: `OfflineModeIndicator.tsx`
  - [ ] Show online/offline status
  - [ ] Display cache status
  - [ ] Show sync queue count
  - [ ] Color-coded states

- [ ] Create sync status component
  - [ ] Show "Syncing..." progress
  - [ ] Display sync completion
  - [ ] Show conflicts
  - [ ] Manual sync trigger
  - [ ] Last sync timestamp

- [ ] Add cache management UI
  - [ ] Show cached ticket count
  - [ ] Display cache age
  - [ ] Manual refresh button
  - [ ] Clear cache option
  - [ ] Cache storage usage

### API Endpoints
- [ ] Create cache download endpoint
  - [ ] GET `/api/events/[eventId]/tickets/cache`
  - [ ] Return all issued tickets
  - [ ] Include validation data
  - [ ] Compress response
  - [ ] Cache headers

- [ ] Build incremental update endpoint
  - [ ] GET `/api/events/[eventId]/tickets/cache/updates`
  - [ ] Query param: `since=[timestamp]`
  - [ ] Return only changed tickets
  - [ ] Include deletions/refunds
  - [ ] Version tracking

- [ ] Create sync upload endpoint
  - [ ] POST `/api/check-in/sync`
  - [ ] Accept batch of check-ins
  - [ ] Validate each item
  - [ ] Return conflicts
  - [ ] Update database

---

## Database Schema

```prisma
// No additional models needed for offline sync
// Uses existing CheckInLog model from TIX-003a

// Add field to Event model
model Event {
  // ... existing fields

  cacheVersion    Int      @default(1)
  cacheUpdatedAt  DateTime @default(now())
}
```

### IndexedDB Schema

```typescript
// lib/db/offline-cache.ts

import { openDB, DBSchema } from 'idb';

interface OfflineCacheDB extends DBSchema {
  tickets: {
    key: string; // ticketId
    value: {
      ticketId: string;
      eventId: string;
      orderId: string;
      signature: string;
      attendeeName: string;
      attendeeEmail: string;
      tier: string;
      timestamp: number;
      checkedIn: boolean;
      checkedInAt?: string;
      checkedInBy?: string;
    };
    indexes: { 'by-event': string };
  };

  syncQueue: {
    key: number; // auto-increment
    value: {
      id: number;
      ticketId: string;
      eventId: string;
      staffMemberId: string;
      deviceId: string;
      location?: string;
      timestamp: string;
      qrData: string;
      validationResult: string;
      attempts: number;
      lastAttempt?: string;
    };
    indexes: { 'by-timestamp': string };
  };

  metadata: {
    key: string; // 'cache-info'
    value: {
      eventId: string;
      cacheVersion: number;
      downloadedAt: string;
      lastRefreshAt: string;
      ticketCount: number;
    };
  };
}

export const openOfflineCache = () => {
  return openDB<OfflineCacheDB>('ticket-validation', 1, {
    upgrade(db) {
      const ticketStore = db.createObjectStore('tickets', {
        keyPath: 'ticketId'
      });
      ticketStore.createIndex('by-event', 'eventId');

      const queueStore = db.createObjectStore('syncQueue', {
        keyPath: 'id',
        autoIncrement: true
      });
      queueStore.createIndex('by-timestamp', 'timestamp');

      db.createObjectStore('metadata', {
        keyPath: 'eventId'
      });
    }
  });
};
```

---

## Dev Notes

### Offline Validation Service

```typescript
// lib/services/offline-validation.service.ts

import { openOfflineCache } from '@/lib/db/offline-cache';

export class OfflineValidationService {
  private db: any;

  async initialize() {
    this.db = await openOfflineCache();
  }

  async cacheEventTickets(eventId: string): Promise<void> {
    try {
      // Fetch tickets from API
      const response = await fetch(`/api/events/${eventId}/tickets/cache`);
      const tickets = await response.json();

      // Store in IndexedDB
      const tx = this.db.transaction('tickets', 'readwrite');

      for (const ticket of tickets) {
        await tx.store.put(ticket);
      }

      await tx.done;

      // Update metadata
      await this.db.put('metadata', {
        eventId,
        cacheVersion: tickets.version,
        downloadedAt: new Date().toISOString(),
        lastRefreshAt: new Date().toISOString(),
        ticketCount: tickets.length
      });

      console.log(`✓ Cached ${tickets.length} tickets for event ${eventId}`);
    } catch (error) {
      console.error('Failed to cache tickets:', error);
      throw error;
    }
  }

  async validateOffline(
    qrData: string,
    eventId: string,
    staffId: string,
    deviceId: string
  ): Promise<ValidationResult> {
    try {
      const ticketData = JSON.parse(qrData);

      // Look up in cache
      const ticket = await this.db.get('tickets', ticketData.ticketId);

      if (!ticket) {
        return {
          status: 'NOT_FOUND',
          message: 'Ticket not in offline cache - connect to internet'
        };
      }

      // Verify event match
      if (ticket.eventId !== eventId) {
        return {
          status: 'WRONG_EVENT',
          message: 'Ticket is for a different event'
        };
      }

      // Check if already checked in (locally)
      if (ticket.checkedIn) {
        return {
          status: 'ALREADY_USED',
          message: `Ticket already checked in offline at ${ticket.checkedInAt}`,
          canOverride: true
        };
      }

      // Mark as checked in locally
      ticket.checkedIn = true;
      ticket.checkedInAt = new Date().toISOString();
      ticket.checkedInBy = staffId;
      await this.db.put('tickets', ticket);

      // Add to sync queue
      await this.addToSyncQueue({
        ticketId: ticketData.ticketId,
        eventId,
        staffMemberId: staffId,
        deviceId,
        timestamp: new Date().toISOString(),
        qrData,
        validationResult: 'VALID'
      });

      return {
        status: 'VALID',
        message: 'Validated offline - will sync when online',
        ticket: {
          attendeeName: ticket.attendeeName,
          tier: ticket.tier
        }
      };
    } catch (error) {
      return {
        status: 'ERROR',
        message: 'Offline validation failed'
      };
    }
  }

  async addToSyncQueue(item: any): Promise<void> {
    await this.db.add('syncQueue', {
      ...item,
      attempts: 0
    });
  }

  async syncPendingValidations(): Promise<void> {
    const pending = await this.db.getAll('syncQueue');

    for (const item of pending) {
      try {
        const response = await fetch('/api/check-in/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(item)
        });

        if (response.ok) {
          // Success - remove from queue
          await this.db.delete('syncQueue', item.id);
        } else if (response.status === 409) {
          // Conflict - update local cache and remove from queue
          const conflict = await response.json();
          await this.handleConflict(conflict);
          await this.db.delete('syncQueue', item.id);
        } else {
          // Failed - increment attempts
          item.attempts++;
          item.lastAttempt = new Date().toISOString();

          if (item.attempts >= 3) {
            // Max retries reached - remove from queue and log
            console.error('Max sync retries reached:', item);
            await this.db.delete('syncQueue', item.id);
          } else {
            await this.db.put('syncQueue', item);
          }
        }
      } catch (error) {
        console.error('Sync failed:', error);
      }
    }
  }

  private async handleConflict(conflict: any): Promise<void> {
    // Update local cache with server truth
    const ticket = await this.db.get('tickets', conflict.ticketId);
    if (ticket) {
      ticket.checkedIn = true;
      ticket.checkedInAt = conflict.serverCheckInTime;
      ticket.checkedInBy = conflict.serverStaffId;
      await this.db.put('tickets', ticket);
    }

    // Log conflict for admin
    console.warn('Sync conflict:', conflict);
  }
}
```

---

## Testing

### Unit Tests
- [ ] IndexedDB initialization
- [ ] Cache download and storage
- [ ] Offline validation logic
- [ ] Sync queue management
- [ ] Conflict resolution logic

### Integration Tests
- [ ] Complete offline check-in flow
- [ ] Sync on reconnection
- [ ] Conflict handling
- [ ] Cache refresh
- [ ] Queue processing

### Edge Cases
- [ ] Network drops mid-validation
- [ ] Browser refresh with pending syncs
- [ ] IndexedDB storage limit reached
- [ ] Concurrent offline validations
- [ ] Ticket added after cache download
- [ ] Multiple devices offline simultaneously

### Performance Tests
- [ ] Cache download for 1000+ tickets
- [ ] Offline validation < 500ms
- [ ] Sync 100 queued items
- [ ] IndexedDB query performance
- [ ] Memory usage with large cache

---

## Change Log

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-09-30 | BMAD SM Agent | Initial sharded story from TIX-003 |

---

*Sharded from TIX-003 (5 pts) - Part 2 of 2*
*Depends on: TIX-003a - QR Validation API & Security (3 pts)*
*Generated by BMAD SM Agent*