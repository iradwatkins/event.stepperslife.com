# Story: CHK-008b - Bulk UI & Progress Display

**Epic**: EPIC-006 - Mobile Check-in PWA
**Story Points**: 3
**Priority**: P2 (Medium)
**Status**: Not Started
**Parent Story**: CHK-008 (Bulk Check-in Operations - 5 pts)
**Dependencies**: CHK-008a (Batch Processing API), CHK-003 (QR Scanner), CHK-007 (Staff Roles)

---

## Story

**As an** event staff member handling groups
**I want** an intuitive bulk check-in interface with clear progress feedback
**So that** I can efficiently process large groups and track what's happening

**As a** VIP coordinator
**I want** quick access to VIP lists with one-tap check-in
**So that** I can expedite VIP entry without scanning each ticket

---

## Acceptance Criteria

### AC1: Bulk Mode UI Toggle
**Given** staff is on check-in screen
**When** they want to switch to bulk mode
**Then** provide:
- Toggle switch: "Bulk Mode" (prominent, top-right)
- Toggle state persists in session
- Smooth transition between modes
- Different UI layout for bulk mode:
  - Single scan mode: Camera + individual validation
  - Bulk mode: List view + multi-select + batch actions
- Clear indication of current mode
- Bulk mode only available to staff with permission

### AC2: Multi-Select Attendee Interface
**Given** bulk mode is active
**When** displaying attendee list
**Then** show:

**List View**:
```
[Search: Filter attendees...]

☐ Select All (125 unchecked)

┌──────────────────────────────────┐
│ ☐ John Smith (#TKT-001)         │
│   General Admission              │
├──────────────────────────────────┤
│ ☑ Jane Doe (#TKT-002)           │
│   VIP Pass                       │
├──────────────────────────────────┤
│ ☐ Bob Johnson (#TKT-003)        │
│   General Admission              │
└──────────────────────────────────┘

Selected: 1 / 125
[Check In Selected (1)]
```

**Features**:
- Large checkboxes (44x44px touch target)
- Attendee name + ticket number
- Ticket tier badge (color-coded)
- Search/filter by name, ticket #, tier
- "Select All Unchecked" button
- "Clear Selection" button
- Selected count always visible
- Disabled items (already checked-in) with indicator

### AC3: Group Ticket Auto-Detection
**Given** staff scans a group ticket QR code
**When** ticket is part of a group order
**Then** automatically:
- Detect group relationship (same orderId)
- Display modal: "Group Ticket Detected"
- Show all group members:
  ```
  Group Order #ORD-12345 (4 tickets)

  ☑ John Smith (Primary)
  ☑ Jane Smith
  ☑ Child 1
  ☑ Child 2

  [Check In All (4)] [Select Individual]
  ```
- Pre-select all group members
- Allow deselection of individuals
- One-tap check-in for entire group
- Show group indicator in list view

### AC4: VIP Fast-Track Interface
**Given** staff has VIP coordinator role
**When** they access VIP fast-track
**Then** provide dedicated UI:

```
VIP Fast Track

[Filter: All VIPs ▼]
- All VIPs (15)
- Unchecked VIPs (8)
- Checked VIPs (7)

☐ Select All Unchecked (8)

┌──────────────────────────────────┐
│ ☐ 👑 Sarah Johnson              │
│   VIP Platinum • Table 5         │
├──────────────────────────────────┤
│ ☑ 👑 Michael Chen               │
│   VIP Gold • Table 12            │
│   ✓ Checked in at 7:15 PM        │
└──────────────────────────────────┘

[Check In All Selected]
```

**Features**:
- Crown icon for VIP tickets
- Show table/seat assignments
- Filter by VIP tier
- Quick select all unchecked
- Show check-in timestamp for checked VIPs
- Sort by tier (Platinum → Gold → Silver)

### AC5: Real-Time Progress Display
**Given** bulk check-in is processing
**When** operation is in progress
**Then** show:

**Progress Modal** (full-screen):
```
Checking In 12 Attendees

██████████░░░░░░░░░░ 50%

Processing... 6 of 12

✓ John Smith
✓ Jane Doe
✓ Bob Johnson
✓ Alice Williams
✓ Charlie Brown
✓ David Lee
⏳ Processing Emma Davis...

[Cancel Operation]
```

**Progress Elements**:
- Large progress bar (animated)
- Percentage display (50%)
- Count display (6 of 12)
- Live list of completed check-ins
- Current processing indicator
- Estimated time remaining
- Cancel button (confirmation required)
- Can't close modal until complete
- Error items shown with ⚠️ icon

### AC6: Results Summary Display
**Given** bulk operation completes
**When** showing results
**Then** display:

**Success Summary**:
```
✓ Bulk Check-In Complete

Successfully checked in 10 of 12 attendees

✓ Success: 10
⚠️ Failed: 2

[View Details] [Done]
```

**Detailed Results**:
```
Bulk Operation Results

✓ Successful (10)
  • John Smith
  • Jane Doe
  • Bob Johnson
  ... (show all)

⚠️ Failed (2)
  • Emma Davis
    Already checked in by Sarah at 7:15 PM
    [Override Check-In]

  • Frank Wilson
    Ticket refunded on 09/28
    [View Order Details]

Duration: 2.3 seconds
Throughput: 5.2 tickets/second

[Export Report] [Close]
```

### AC7: Confirmation & Safety
**Given** staff initiates bulk check-in
**When** confirming the action
**Then** show confirmation dialog:

```
Check In 12 Attendees?

This will check in:
• 8 General Admission
• 3 VIP
• 1 Group Ticket (4 people)

⚠️ This action cannot be undone without
   manager approval.

[Cancel] [Confirm Check-In]
```

**Safety Features**:
- Always confirm before bulk action
- Show ticket breakdown
- Warning about irreversibility
- Require second tap to confirm
- No accidental bulk check-ins

### AC8: Error Handling UI
**Given** errors occur during bulk operation
**When** displaying error items
**Then** provide:

**Error Card**:
```
┌──────────────────────────────────┐
│ ⚠️ Emma Davis (#TKT-042)        │
│                                  │
│ Already checked in               │
│ By: Sarah Johnson                │
│ At: 7:15 PM                      │
│                                  │
│ [View Details] [Override]        │
└──────────────────────────────────┘
```

**Error Actions**:
- Retry individual item
- Override (requires manager)
- View full details
- Skip and continue
- Export error list
- Contact support (with context)

---

## Tasks / Subtasks

### Mode Toggle & Navigation
- [ ] Create bulk mode toggle
  - [ ] Component: `/components/check-in/BulkModeToggle.tsx`
  - [ ] Toggle switch UI
  - [ ] State management
  - [ ] Permission check
  - [ ] Persist preference

- [ ] Build mode-specific layouts
  - [ ] Single scan layout
  - [ ] Bulk select layout
  - [ ] Transition animations
  - [ ] Responsive design

### Attendee List UI
- [ ] Create multi-select list component
  - [ ] Component: `/components/check-in/AttendeeList.tsx`
  - [ ] Checkbox list items
  - [ ] Attendee cards
  - [ ] Ticket tier badges
  - [ ] Check-in status indicators

- [ ] Implement search/filter
  - [ ] Search bar component
  - [ ] Filter by name
  - [ ] Filter by ticket number
  - [ ] Filter by tier
  - [ ] Filter by status

- [ ] Build selection controls
  - [ ] Select all/none buttons
  - [ ] Selected count display
  - [ ] Clear selection
  - [ ] Bulk action button

### Group Detection
- [ ] Create group detection modal
  - [ ] Component: `/components/check-in/GroupTicketModal.tsx`
  - [ ] Display group members
  - [ ] Pre-select all
  - [ ] Individual deselection
  - [ ] Check-in all action

- [ ] Build group indicator
  - [ ] Group badge in list
  - [ ] Visual linking
  - [ ] Member count
  - [ ] Primary ticket highlight

### VIP Fast-Track
- [ ] Create VIP interface
  - [ ] Component: `/components/check-in/VIPFastTrack.tsx`
  - [ ] VIP-only list
  - [ ] Crown icons
  - [ ] Tier filtering
  - [ ] Table assignments

- [ ] Build VIP filters
  - [ ] Filter by tier
  - [ ] Filter by status
  - [ ] Quick select unchecked
  - [ ] Sort options

### Progress Display
- [ ] Create progress modal
  - [ ] Component: `/components/check-in/BulkProgress.tsx`
  - [ ] Progress bar
  - [ ] Percentage display
  - [ ] Live item list
  - [ ] Cancel button

- [ ] Build real-time updates
  - [ ] Listen to WebSocket events
  - [ ] Update progress bar
  - [ ] Add completed items
  - [ ] Show current item
  - [ ] Calculate ETA

- [ ] Implement progress animations
  - [ ] Smooth bar animation
  - [ ] Item fade-in
  - [ ] Success checkmarks
  - [ ] Error icons

### Results Display
- [ ] Create results summary
  - [ ] Component: `/components/check-in/BulkResults.tsx`
  - [ ] Success count
  - [ ] Failure count
  - [ ] Duration display
  - [ ] Throughput stats

- [ ] Build detailed results view
  - [ ] Success list
  - [ ] Failure list with reasons
  - [ ] Error actions
  - [ ] Export button

- [ ] Add results export
  - [ ] Generate CSV
  - [ ] Include all details
  - [ ] Download file
  - [ ] Email option

### Confirmation Dialogs
- [ ] Create confirmation modal
  - [ ] Component: `/components/check-in/BulkConfirmation.tsx`
  - [ ] Ticket breakdown
  - [ ] Warning message
  - [ ] Confirm/cancel actions
  - [ ] Double-tap protection

- [ ] Build error dialogs
  - [ ] Error details modal
  - [ ] Override confirmation
  - [ ] Retry prompt
  - [ ] Contact support

### Integration
- [ ] Connect to bulk API
  - [ ] Call bulk endpoint
  - [ ] Handle response
  - [ ] Track operation
  - [ ] Poll status

- [ ] Integrate WebSocket updates
  - [ ] Subscribe to progress
  - [ ] Update UI in real-time
  - [ ] Handle completion
  - [ ] Handle errors

---

## Design Specifications

### Color Coding

```typescript
// Ticket tier badges
const tierColors = {
  VIP_PLATINUM: '#9333EA', // Purple
  VIP_GOLD: '#EAB308',     // Gold
  VIP_SILVER: '#71717A',   // Silver
  GENERAL: '#3B82F6',      // Blue
  EARLY_BIRD: '#10B981'    // Green
};

// Status indicators
const statusColors = {
  CHECKED_IN: '#22C55E',   // Green
  PENDING: '#F59E0B',      // Orange
  FAILED: '#EF4444',       // Red
  PROCESSING: '#3B82F6'    // Blue
};
```

### Layout Breakpoints

```css
/* Mobile first */
.bulk-list {
  /* Mobile: < 640px */
  grid-template-columns: 1fr;

  /* Tablet: 640px - 1024px */
  @media (min-width: 640px) {
    grid-template-columns: repeat(2, 1fr);
  }

  /* Desktop: > 1024px */
  @media (min-width: 1024px) {
    grid-template-columns: repeat(3, 1fr);
  }
}
```

### Touch Targets

- Checkboxes: 44x44px minimum
- Buttons: 48px height minimum
- List items: 60px height minimum
- Spacing: 16px between items

---

## Dev Notes

### React Component Architecture

```typescript
// components/check-in/BulkCheckIn.tsx

import { useState, useEffect } from 'react';
import { useBulkCheckIn } from '@/hooks/useBulkCheckIn';

export function BulkCheckIn({ eventId }: Props) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isProcessing, setIsProcessing] = useState(false);

  const {
    attendees,
    checkInBulk,
    progress,
    results
  } = useBulkCheckIn(eventId);

  const handleSelectAll = () => {
    const unchecked = attendees
      .filter(a => !a.checkedIn)
      .map(a => a.ticketId);
    setSelectedIds(new Set(unchecked));
  };

  const handleCheckIn = async () => {
    if (selectedIds.size === 0) return;

    const confirmed = await confirm({
      title: `Check in ${selectedIds.size} attendees?`,
      message: 'This action cannot be easily undone.',
      confirmText: 'Check In',
      cancelText: 'Cancel'
    });

    if (!confirmed) return;

    setIsProcessing(true);
    await checkInBulk(Array.from(selectedIds));
  };

  return (
    <div>
      {/* Header */}
      <BulkHeader
        selectedCount={selectedIds.size}
        totalCount={attendees.length}
        onSelectAll={handleSelectAll}
        onClearSelection={() => setSelectedIds(new Set())}
      />

      {/* Attendee List */}
      <AttendeeList
        attendees={attendees}
        selectedIds={selectedIds}
        onToggle={(id) => {
          const newSet = new Set(selectedIds);
          if (newSet.has(id)) {
            newSet.delete(id);
          } else {
            newSet.add(id);
          }
          setSelectedIds(newSet);
        }}
      />

      {/* Action Button */}
      <BulkActionButton
        count={selectedIds.size}
        onClick={handleCheckIn}
        disabled={selectedIds.size === 0}
      />

      {/* Progress Modal */}
      {isProcessing && (
        <BulkProgress
          progress={progress}
          onCancel={() => {/* Cancel operation */}}
        />
      )}

      {/* Results Modal */}
      {results && (
        <BulkResults
          results={results}
          onClose={() => setIsProcessing(false)}
        />
      )}
    </div>
  );
}
```

### Custom Hook for Bulk Operations

```typescript
// hooks/useBulkCheckIn.ts

import { useState, useEffect } from 'react';
import { useWebSocket } from './useWebSocket';

export function useBulkCheckIn(eventId: string) {
  const [progress, setProgress] = useState<BulkProgress | null>(null);
  const [results, setResults] = useState<BulkResults | null>(null);
  const { on } = useWebSocket(eventId);

  useEffect(() => {
    // Listen for progress updates
    const unsubProgress = on('bulk_progress', (data) => {
      setProgress(data);
    });

    // Listen for completion
    const unsubComplete = on('bulk_complete', (data) => {
      setResults(data.results);
      setProgress(null);
    });

    return () => {
      unsubProgress();
      unsubComplete();
    };
  }, [on]);

  const checkInBulk = async (ticketIds: string[]) => {
    const response = await fetch(`/api/events/${eventId}/check-in/bulk`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ticketIds,
        staffId: getCurrentStaffId(),
        deviceId: getDeviceId(),
        operationType: 'MANUAL'
      })
    });

    if (!response.ok) {
      throw new Error('Bulk check-in failed');
    }

    return await response.json();
  };

  return {
    progress,
    results,
    checkInBulk
  };
}
```

---

## Testing

### UI/UX Tests
- [ ] Mode toggle functionality
- [ ] Multi-select interactions
- [ ] Group detection flow
- [ ] VIP fast-track interface
- [ ] Progress animation smoothness
- [ ] Results display clarity

### Usability Tests
- [ ] Touch target sizes
- [ ] Color contrast (WCAG AA)
- [ ] Loading states clear
- [ ] Error messages helpful
- [ ] Confirmation flow intuitive

### Integration Tests
- [ ] WebSocket updates UI
- [ ] API calls correct
- [ ] State management
- [ ] Real-time sync
- [ ] Error handling

### Performance Tests
- [ ] Large lists (500+ items)
- [ ] Smooth scrolling
- [ ] Selection performance
- [ ] Animation frame rate
- [ ] Memory usage

---

## Accessibility

- ARIA labels on all interactive elements
- Keyboard navigation support
- Screen reader announcements
- Focus management in modals
- Color not only indicator (use icons)
- Large touch targets (44x44px)
- High contrast mode support

---

## Change Log

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-09-30 | BMAD SM Agent | Initial sharded story from CHK-008 |

---

*Sharded from CHK-008 (5 pts) - Part 2 of 2*
*Depends on: CHK-008a - Batch Processing API (2 pts)*
*Generated by BMAD SM Agent*

---

## Summary

This story completes the bulk check-in feature by providing:
- Intuitive multi-select interface
- Group ticket auto-detection
- VIP fast-track functionality
- Real-time progress visualization
- Comprehensive results display
- Safety confirmations
- Detailed error handling

Combined with CHK-008a's robust batch processing API, this enables efficient group check-ins while maintaining data integrity and user experience.