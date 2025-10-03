# TIX-004: Basic Check-In Interface

**Epic**: EPIC-004 - Digital Ticket System
**Story Points**: 3
**Priority**: High
**Status**: Ready for Development

## User Story

**As an** event staff member
**I want** an intuitive mobile interface to check in attendees quickly
**So that** I can process entries efficiently and provide a smooth experience at the event entrance

## Business Value

- Fast check-in process improves attendee experience
- Mobile-optimized interface works on staff phones/tablets
- Real-time stats help manage crowd flow
- Offline capability ensures reliability at any venue
- Reduces bottlenecks at event entrance

## Acceptance Criteria

### AC1: QR Code Scanner Integration
**Given** a staff member opens the check-in interface
**When** they activate the QR scanner
**Then** the system must:
- Request camera permission (if not granted)
- Display live camera feed with scan overlay
- Automatically detect and scan QR codes (no button press)
- Provide visual feedback during scanning (crosshair/target)
- Support both front and rear cameras
- Work in various lighting conditions
- Process scans within 1 second

**And** display clear instructions: "Point camera at ticket QR code"
**And** provide manual entry option if camera unavailable

### AC2: Instant Validation Feedback
**Given** a QR code is successfully scanned
**When** the validation completes
**Then** the interface must display:
- **Valid Ticket**: Green checkmark, attendee name, ticket tier, success sound
- **Already Used**: Red X, previous check-in time/staff, warning sound
- **Invalid**: Red X, reason for rejection, error sound
- **Expired**: Orange warning, expiration date, alert sound

**And** feedback must appear within 2 seconds of scan
**And** automatically return to scan mode after 3 seconds
**And** allow staff to acknowledge result before continuing

### AC3: Manual Search Functionality
**Given** QR code cannot be scanned (damaged, phone dead, etc.)
**When** staff uses manual search
**Then** the system must provide:
- Search by name (debounced, live results)
- Search by email
- Search by order number
- Search by ticket ID
- Fuzzy matching for names (typo tolerance)
- Results sorted by relevance
- Display all tickets for selected attendee

**And** search results appear within 1 second
**And** staff can check in from search results
**And** display ticket details before confirming check-in

### AC4: Real-Time Statistics Dashboard
**Given** staff needs to monitor check-in progress
**When** viewing the check-in interface
**Then** the dashboard must display:
- Total tickets sold
- Total checked in (with percentage)
- Remaining to check in
- Check-in rate (per minute/hour)
- Duplicate scan attempts count
- Current online/offline status
- Last sync timestamp (if offline)

**And** stats update in real-time without page refresh
**And** display prominently at top of interface
**And** support multiple staff checking in simultaneously

### AC5: Offline Mode Support
**Given** internet connection may be unreliable
**When** device goes offline
**Then** the interface must:
- Display "Offline Mode" indicator clearly
- Continue scanning and validating tickets
- Use cached ticket data (from TIX-003)
- Queue validation results for sync
- Prevent duplicate check-ins using local cache
- Show pending sync count
- Auto-sync when connection restored

**And** warn staff before event if cache not downloaded
**And** display last successful sync time
**And** allow manual sync trigger

### AC6: Staff Authentication & Permissions
**Given** only authorized staff can check in attendees
**When** accessing check-in interface
**Then** the system must:
- Require staff login (event code + PIN)
- Verify staff has CHECK_IN permission
- Display staff name and role
- Track all actions by staff member
- Allow admin to view staff activity
- Support multiple staff devices per event

**And** session expires after 8 hours of inactivity
**And** logout clears cached ticket data
**And** support role-based features (admin override, etc.)

### AC7: Attendee List View
**Given** staff may need to view all attendees
**When** switching to list view
**Then** the interface must display:
- Scrollable list of all ticket holders
- Filter by checked-in / not checked-in
- Sort by name, check-in time, tier
- Virtual scrolling for large lists (500+ attendees)
- Quick check-in action for each attendee
- Search/filter bar at top
- Export list option (admin only)

**And** list updates in real-time as check-ins occur
**And** highlight recently checked-in attendees
**And** show ticket tier badges (VIP, General, etc.)

### AC8: Mobile-Optimized Design
**Given** staff will primarily use mobile devices
**When** interface loads on any device
**Then** it must:
- Respond to screen sizes from 320px to tablet
- Use large touch targets (min 44x44px)
- Display critical info above the fold
- Support portrait and landscape orientations
- Work as Progressive Web App (PWA)
- Cache assets for offline use
- Load in < 2 seconds on 3G connection
- Support iOS Safari and Chrome Android

**And** prevent accidental zooming or scrolling
**And** optimize battery usage
**And** minimize data usage

## Technical Specifications

### Technology Stack

```typescript
// Recommended: Next.js with PWA support
// QR Scanner: html5-qrcode or react-qr-scanner
// Real-time: WebSocket or polling
// Offline: Service Worker + IndexedDB

Dependencies:
- html5-qrcode: QR scanning
- idb: IndexedDB wrapper
- socket.io-client: Real-time updates
- react-query: Data fetching/caching
- framer-motion: Animations
```

### Component Structure

```tsx
// app/dashboard/events/[eventId]/checkin/page.tsx

import { QRScanner } from '@/components/checkin/QRScanner';
import { CheckInStats } from '@/components/checkin/CheckInStats';
import { ManualSearch } from '@/components/checkin/ManualSearch';
import { AttendeeList } from '@/components/checkin/AttendeeList';
import { OfflineIndicator } from '@/components/checkin/OfflineIndicator';

export default function CheckInPage({ params }: { params: { eventId: string } }) {
  const [mode, setMode] = useState<'scan' | 'search' | 'list'>('scan');
  const [isOnline, setIsOnline] = useState(true);

  return (
    <div className="h-screen flex flex-col bg-gray-900">
      {/* Header with stats */}
      <CheckInStats eventId={params.eventId} />

      {/* Offline indicator */}
      {!isOnline && <OfflineIndicator />}

      {/* Mode tabs */}
      <CheckInModeSelector mode={mode} onChange={setMode} />

      {/* Main content area */}
      <div className="flex-1 overflow-hidden">
        {mode === 'scan' && <QRScanner eventId={params.eventId} />}
        {mode === 'search' && <ManualSearch eventId={params.eventId} />}
        {mode === 'list' && <AttendeeList eventId={params.eventId} />}
      </div>
    </div>
  );
}
```

### QR Scanner Component

```tsx
// components/checkin/QRScanner.tsx

import { Html5QrcodeScanner } from 'html5-qrcode';
import { useEffect, useRef, useState } from 'react';
import { useCheckInMutation } from '@/lib/hooks/useCheckIn';

interface QRScannerProps {
  eventId: string;
}

export function QRScanner({ eventId }: QRScannerProps) {
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const [result, setResult] = useState<ValidationResult | null>(null);
  const checkInMutation = useCheckInMutation(eventId);

  useEffect(() => {
    // Initialize scanner
    const scanner = new Html5QrcodeScanner(
      'qr-reader',
      {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
        experimentalFeatures: {
          useBarCodeDetectorIfSupported: true
        }
      },
      false
    );

    scanner.render(onScanSuccess, onScanError);
    scannerRef.current = scanner;

    return () => {
      scanner.clear();
    };
  }, []);

  const onScanSuccess = async (decodedText: string) => {
    // Vibrate on scan
    if (navigator.vibrate) {
      navigator.vibrate(100);
    }

    try {
      const result = await checkInMutation.mutateAsync({
        qrData: decodedText,
        eventId
      });

      setResult(result);

      // Play sound based on result
      playResultSound(result.status);

      // Auto-clear after 3 seconds
      setTimeout(() => setResult(null), 3000);
    } catch (error) {
      setResult({
        status: 'INVALID',
        message: 'Validation failed - please try again'
      });
    }
  };

  const onScanError = (error: string) => {
    // Ignore scan errors (continuous scanning)
  };

  const playResultSound = (status: string) => {
    const audio = new Audio(`/sounds/${status.toLowerCase()}.mp3`);
    audio.play().catch(() => {
      // Sound play failed (user interaction required)
    });
  };

  return (
    <div className="flex flex-col items-center justify-center h-full p-4">
      {/* Scanner container */}
      <div id="qr-reader" className="w-full max-w-md" />

      {/* Result display */}
      {result && (
        <ValidationResultCard
          result={result}
          onDismiss={() => setResult(null)}
        />
      )}

      {/* Manual entry link */}
      <button
        className="mt-6 text-blue-400 underline"
        onClick={() => window.location.hash = '#search'}
      >
        Can't scan? Enter ticket manually
      </button>
    </div>
  );
}
```

### Validation Result Card

```tsx
// components/checkin/ValidationResultCard.tsx

interface ValidationResultCardProps {
  result: ValidationResult;
  onDismiss: () => void;
}

export function ValidationResultCard({ result, onDismiss }: ValidationResultCardProps) {
  const isValid = result.status === 'VALID';
  const isAlreadyUsed = result.status === 'ALREADY_USED';

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={`
        fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80
      `}
      onClick={onDismiss}
    >
      <div
        className={`
          max-w-md w-full rounded-2xl p-8 text-center
          ${isValid ? 'bg-green-600' : 'bg-red-600'}
        `}
      >
        {/* Icon */}
        <div className="text-6xl mb-4">
          {isValid ? '✓' : '✗'}
        </div>

        {/* Status */}
        <h2 className="text-3xl font-bold text-white mb-2">
          {isValid ? 'Valid Ticket' : result.status.replace('_', ' ')}
        </h2>

        {/* Attendee info */}
        {result.ticket && (
          <div className="text-white/90 mb-4">
            <p className="text-xl font-semibold">{result.ticket.attendeeName}</p>
            <p className="text-lg">{result.ticket.tier}</p>
          </div>
        )}

        {/* Message */}
        <p className="text-white/80">{result.message}</p>

        {/* Already used details */}
        {isAlreadyUsed && result.checkIn && (
          <div className="mt-4 p-4 bg-black/20 rounded-lg text-white/80 text-sm">
            <p>Checked in at: {new Date(result.checkIn.timestamp).toLocaleString()}</p>
            <p>By: {result.checkIn.staffMember}</p>
            <p>Location: {result.checkIn.location}</p>
          </div>
        )}

        {/* Override button for duplicates */}
        {result.canOverride && (
          <button
            className="mt-4 px-6 py-2 bg-yellow-500 text-black rounded-lg font-semibold"
            onClick={(e) => {
              e.stopPropagation();
              // Open override modal
            }}
          >
            Admin Override
          </button>
        )}

        {/* Dismiss hint */}
        <p className="mt-6 text-white/60 text-sm">Tap to continue</p>
      </div>
    </motion.div>
  );
}
```

### Check-In Stats Component

```tsx
// components/checkin/CheckInStats.tsx

import { useCheckInStats } from '@/lib/hooks/useCheckInStats';

export function CheckInStats({ eventId }: { eventId: string }) {
  const { data: stats, isLoading } = useCheckInStats(eventId);

  if (isLoading) return <div>Loading...</div>;

  const percentage = Math.round((stats.checkedIn / stats.totalTickets) * 100);

  return (
    <div className="bg-gray-800 p-4 border-b border-gray-700">
      {/* Progress bar */}
      <div className="mb-3">
        <div className="flex justify-between text-sm text-gray-400 mb-1">
          <span>Check-In Progress</span>
          <span>{percentage}%</span>
        </div>
        <div className="h-3 bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-green-500 transition-all duration-500"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-4 text-center">
        <div>
          <div className="text-2xl font-bold text-white">{stats.checkedIn}</div>
          <div className="text-xs text-gray-400">Checked In</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-gray-400">
            {stats.totalTickets - stats.checkedIn}
          </div>
          <div className="text-xs text-gray-400">Remaining</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-blue-400">{stats.rate}</div>
          <div className="text-xs text-gray-400">Per Hour</div>
        </div>
      </div>
    </div>
  );
}
```

### Manual Search Component

```tsx
// components/checkin/ManualSearch.tsx

import { useState } from 'react';
import { useDebounce } from '@/lib/hooks/useDebounce';
import { useSearchTickets } from '@/lib/hooks/useSearchTickets';

export function ManualSearch({ eventId }: { eventId: string }) {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 300);
  const { data: results, isLoading } = useSearchTickets(eventId, debouncedQuery);

  return (
    <div className="h-full flex flex-col p-4">
      {/* Search input */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search by name, email, or order number..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full px-4 py-3 bg-gray-800 text-white rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none text-lg"
          autoFocus
        />
      </div>

      {/* Search results */}
      <div className="flex-1 overflow-y-auto">
        {isLoading && <div className="text-center text-gray-400">Searching...</div>}

        {!isLoading && results?.length === 0 && (
          <div className="text-center text-gray-400 mt-8">
            No tickets found for "{query}"
          </div>
        )}

        {results?.map((ticket) => (
          <TicketSearchResult
            key={ticket.id}
            ticket={ticket}
            eventId={eventId}
          />
        ))}
      </div>
    </div>
  );
}
```

### API Endpoints

```typescript
// app/api/events/[eventId]/checkin/route.ts

export async function POST(
  req: Request,
  { params }: { params: { eventId: string } }
) {
  const session = await getServerSession(authOptions);

  // Verify staff permission
  if (!session || !hasPermission(session.user, 'CHECK_IN')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { qrData, deviceId, location } = await req.json();

  const validationService = new TicketValidationService();
  const result = await validationService.validateTicket(
    qrData,
    params.eventId,
    session.user.id,
    deviceId,
    location
  );

  return NextResponse.json(result);
}

// GET /api/events/[eventId]/checkin/stats
export async function GET(
  req: Request,
  { params }: { params: { eventId: string } }
) {
  const stats = await prisma.ticket.groupBy({
    by: ['status'],
    where: { eventId: params.eventId },
    _count: true
  });

  const checkedIn = stats.find(s => s.status === 'CHECKED_IN')?._count || 0;
  const total = stats.reduce((sum, s) => sum + s._count, 0);

  // Calculate rate
  const recentCheckIns = await prisma.checkInLog.count({
    where: {
      eventId: params.eventId,
      validatedAt: {
        gte: new Date(Date.now() - 3600000) // Last hour
      }
    }
  });

  return NextResponse.json({
    totalTickets: total,
    checkedIn,
    remaining: total - checkedIn,
    rate: recentCheckIns,
    lastUpdated: new Date().toISOString()
  });
}
```

## Integration Points

### 1. Ticket Validation System (TIX-003)
- **API**: POST /api/events/{eventId}/checkin
- **Data**: QR code data, device ID, staff ID
- **Response**: Validation result with ticket details

### 2. Real-Time Analytics
- **WebSocket**: Connect to /ws/events/{eventId}/checkin
- **Updates**: Receive check-in events in real-time
- **Stats**: Push updates to all connected staff devices

### 3. Offline Cache (TIX-003)
- **Pre-Load**: Download ticket cache before event
- **Storage**: IndexedDB for offline ticket data
- **Sync**: Push queued validations when online

### 4. Audio Feedback
- **Sounds**: success.mp3, error.mp3, duplicate.mp3
- **Library**: Howler.js or native Audio API
- **Fallback**: Visual-only feedback if sound blocked

## Performance Requirements

- Page load: < 2 seconds on 3G
- QR scan detection: < 1 second
- Validation API: < 1 second response
- Search results: < 500ms
- Stats update: Real-time (< 2 second latency)
- Offline validation: < 500ms
- Battery impact: < 10% per hour active scanning

## Testing Requirements

### Unit Tests
- [ ] QR scanner initializes correctly
- [ ] Validation results display properly
- [ ] Manual search debouncing works
- [ ] Stats calculations accurate
- [ ] Offline mode detection works

### Integration Tests
- [ ] End-to-end check-in flow completes
- [ ] Duplicate detection prevents re-entry
- [ ] Offline mode validates tickets
- [ ] Stats update in real-time
- [ ] Multiple staff devices sync correctly

### Browser Tests
- [ ] Works on iOS Safari
- [ ] Works on Chrome Android
- [ ] Camera permissions requested
- [ ] PWA install works
- [ ] Service worker caches assets
- [ ] Offline mode functional

### Usability Tests
- [ ] Staff can check in 20+ people per minute
- [ ] Interface intuitive without training
- [ ] Touch targets easily tappable
- [ ] Feedback clearly visible in bright light
- [ ] Search finds tickets quickly
- [ ] Offline mode clearly indicated

## Environment Variables

```bash
# WebSocket server
NEXT_PUBLIC_WS_URL=wss://events.stepperslife.com/ws

# Offline cache
NEXT_PUBLIC_CACHE_ENABLED=true
NEXT_PUBLIC_CACHE_SIZE_MB=50

# Audio feedback
NEXT_PUBLIC_SOUND_ENABLED=true
```

## Dependencies

```json
{
  "dependencies": {
    "html5-qrcode": "^2.3.8",
    "idb": "^8.0.0",
    "socket.io-client": "^4.7.0",
    "framer-motion": "^11.0.0",
    "react-query": "^3.39.3"
  }
}
```

## Definition of Done

- [ ] QR scanner component implemented and tested
- [ ] Manual search with debouncing working
- [ ] Real-time stats dashboard displaying correctly
- [ ] Offline mode with cached validation
- [ ] Attendee list view with virtual scrolling
- [ ] Staff authentication integrated
- [ ] Mobile-responsive design completed
- [ ] PWA configuration working
- [ ] Audio feedback implemented
- [ ] Unit tests achieve >90% coverage
- [ ] Browser testing on iOS/Android completed
- [ ] Usability testing with staff successful
- [ ] Performance meets <2 second requirement
- [ ] Documentation completed
- [ ] Code review completed
- [ ] QA testing completed
- [ ] Deployed to staging and validated

## Related Stories

- **TIX-003**: Ticket Validation System (API backend)
- **TIX-005**: Ticket Status Tracking (status updates)
- **AUTH-002**: Staff Authentication (permissions)
- **ANALYTICS-001**: Real-time Dashboard (stats display)

## Notes

- Test QR scanner in various lighting conditions
- Ensure battery optimization for all-day use
- Consider haptic feedback for scan confirmation
- Plan for staff training on interface usage
- Document offline mode cache refresh procedure
- Monitor real-world check-in rates at events
- Consider barcode scanner hardware support
- Plan for accessibility (VoiceOver, TalkBack)