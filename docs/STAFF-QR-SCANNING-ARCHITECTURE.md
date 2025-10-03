# Staff Management & QR Scanning System - Technical Architecture

**Version:** 1.0
**Last Updated:** 2025-10-02
**Status:** Ready for Implementation

---

## Executive Summary

This architecture extends the existing Events SteppersLife platform with a **simple, mobile-first** Staff Management and QR Scanning system. The design prioritizes **speed** (sub-2-second scans), **offline capability**, and **ease of use** for non-technical staff.

### Key Features
- Event organizers can assign staff to work the door
- Staff get QR scanning privileges via simple 6-digit access code
- Mobile-optimized scanner (camera-based)
- Offline-capable with automatic sync
- Large, bright QR codes for attendees
- Real-time check-in tracking

---

## 1. Data Model Extensions (Prisma Schema)

### 1.1 Staff Assignment Model

```prisma
// Add to existing schema.prisma

model EventStaff {
  id               String    @id @default(uuid())
  eventId          String
  userId           String

  // Staff Role & Permissions
  role             StaffRole @default(DOOR_SCANNER)
  permissions      String[]  @default(["SCAN_TICKETS"])

  // Assignment Status
  isActive         Boolean   @default(true)
  inviteAccepted   Boolean   @default(false)
  invitedAt        DateTime  @default(now())
  acceptedAt       DateTime?

  // Access Control
  accessCode       String    @unique  // 6-digit PIN for quick login
  lastActiveAt     DateTime?

  // Relations
  event            Event     @relation(fields: [eventId], references: [id], onDelete: Cascade)
  user             User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  checkIns         Ticket[]  @relation("StaffCheckIns")

  // Timestamps
  createdAt        DateTime  @default(now())
  updatedAt        DateTime  @updatedAt

  @@unique([eventId, userId])
  @@index([eventId, isActive])
  @@index([accessCode])
  @@map("event_staff")
}

enum StaffRole {
  DOOR_SCANNER       // Can only scan tickets
  CHECK_IN_STAFF     // Can scan + manual search
  LEAD_STAFF         // Can scan + view stats + manage other staff
  COORDINATOR        // Full access to event check-in
}
```

### 1.2 Ticket Model Updates

**Existing fields already support check-in:**
- `checkedIn: Boolean` ✅
- `checkedInAt: DateTime?` ✅
- `checkedInBy: String?` ✅ (currently stores user ID, will store staff ID)
- `checkInMethod: CheckInMethod?` ✅
- `qrCode: String @unique` ✅
- `validationCode: String @unique` ✅

**No changes needed** - existing schema is perfect!

### 1.3 Check-In Session Tracking (Optional - for analytics)

```prisma
model CheckInSession {
  id               String    @id @default(uuid())
  eventId          String
  staffId          String

  // Session Info
  deviceInfo       Json?     // Browser, OS, etc.
  location         String?   // "Main Entrance", "VIP Door"

  // Statistics
  ticketsScanned   Int       @default(0)
  scanDuration     Int?      // Average scan time in ms

  // Timestamps
  startedAt        DateTime  @default(now())
  endedAt          DateTime?

  @@index([eventId, staffId])
  @@map("checkin_sessions")
}
```

---

## 2. Staff Management Workflow

### 2.1 Staff Assignment Flow

**Organizer Actions:**

1. **Assign Staff** (`/dashboard/events/[eventId]/staff`)
   - Search for existing users by email
   - Create invitation with role selection
   - System generates unique 6-digit access code
   - Email invitation sent automatically

2. **Manage Staff**
   - View all assigned staff
   - Edit roles/permissions
   - Deactivate staff access
   - View staff check-in activity

**Staff Acceptance Flow:**

1. Staff receives email invitation with:
   - Event details
   - Role assignment
   - 6-digit access code
   - Link to accept: `/staff/invite/[token]`

2. Staff accepts invitation:
   - If existing user: Link account → activated
   - If new user: Quick registration (name, email, password) → activated

3. Staff gets access to:
   - Event-specific check-in portal: `/staff/checkin/[eventId]`
   - Mobile-optimized PWA interface
   - Offline-capable scanning

### 2.2 Staff Authentication

**Fast Access Method (Mobile-First):**

```
/staff/checkin/[eventId]
↓
Enter 6-digit access code
↓
Instant access to scanner (no password needed)
↓
Valid for 12 hours
```

**Security:**
- Access codes are event-specific
- Rate-limited (5 attempts per 15 minutes)
- IP logged
- Auto-expire after event ends
- Can be revoked instantly by organizer

**Alternative: Full Login**
- Standard NextAuth login
- Role-based redirect to assigned events

---

## 3. QR Scanning Architecture

### 3.1 QR Code Format

**Existing QR Code Structure (KEEP AS-IS):**

```json
{
  "t": "ticket-uuid",
  "v": "validation-code",
  "e": "event-uuid",
  "u": "https://events.stepperslife.com/checkin/[eventId]?ticket=[id]&code=[code]"
}
```

**Optimized for Speed:**
- Short property names (`t`, `v`, `e` instead of full words)
- Contains all data needed for offline validation
- URL fallback for non-scanner apps

**QR Code Signing (Fraud Prevention):**

```typescript
// Add HMAC signature to QR data
const signature = crypto
  .createHmac('sha256', process.env.QR_SECRET!)
  .update(`${ticketId}:${validationCode}:${eventId}`)
  .digest('hex')
  .substring(0, 16); // First 16 chars

const qrData = {
  t: ticketId,
  v: validationCode,
  e: eventId,
  s: signature,
  u: checkInUrl
};
```

### 3.2 Scanner Interface

**Technology Stack:**

```json
{
  "library": "@zxing/browser",
  "reason": "Fast, no backend needed, works offline",
  "alternative": "html5-qrcode (fallback)"
}
```

**Scanner Component:**

```
/staff/checkin/[eventId]
↓
Camera permission request (auto-prompt)
↓
Live video feed with scan overlay
↓
Auto-detect QR code (< 500ms)
↓
Vibration + sound feedback
↓
Show ticket details + check-in confirmation
```

**Performance Optimizations:**

1. **Pre-scan validation:**
   - Decode QR locally
   - Verify signature before API call
   - Instant feedback on invalid QR

2. **Optimistic UI:**
   - Show success immediately
   - Send check-in request async
   - Roll back if API fails

3. **Offline queue:**
   - Store check-ins in IndexedDB
   - Sync when connection restores
   - Prevent duplicate scans with local cache

### 3.3 Offline Capability

**Service Worker Strategy:**

```javascript
// Cache critical resources
const CACHE_ASSETS = [
  '/staff/checkin/[eventId]',
  '/api/events/[eventId]/tickets-cache', // Prefetch all tickets
  'scanner.js',
  'offline-queue.js'
];

// Offline check-in flow
async function checkInOffline(ticketData) {
  // 1. Validate against cached ticket list
  const ticket = await ticketsDB.get(ticketData.t);

  if (!ticket) return { error: 'Ticket not found' };
  if (ticket.checkedIn) return { error: 'Already checked in' };
  if (ticket.validationCode !== ticketData.v) return { error: 'Invalid code' };

  // 2. Mark as checked in locally
  ticket.checkedIn = true;
  ticket.checkedInAt = new Date().toISOString();
  ticket.checkedInBy = staffId;
  await ticketsDB.update(ticket);

  // 3. Queue for sync
  await syncQueue.add({
    action: 'CHECK_IN',
    ticketId: ticket.id,
    timestamp: Date.now()
  });

  return { success: true, ticket };
}
```

**Data Prefetch Strategy:**

When staff opens check-in page:
1. Fetch all valid tickets for event (paginated if > 1000)
2. Store in IndexedDB
3. Auto-refresh every 5 minutes when online
4. Show "Last synced: X minutes ago"

**Duplicate Prevention:**

```typescript
// Local duplicate check (instant)
const recentScans = await recentScansDB.get(ticketId);
if (recentScans && Date.now() - recentScans.timestamp < 5000) {
  return { error: 'Duplicate scan detected' };
}

// Store scan timestamp
await recentScansDB.put({ ticketId, timestamp: Date.now() });
```

---

## 4. Attendee Ticket Display

### 4.1 Mobile Ticket View

**Route:** `/tickets/[ticketId]` (public, no auth required)

**Features:**

1. **Full-Screen QR Display**
   - Large QR code (300x300px minimum)
   - White background with padding
   - Screen brightness auto-boost
   - Auto-rotate lock (portrait)
   - Prevent sleep while viewing

2. **Quick Access:**
   - Email link: "View Your Ticket" → Opens directly
   - Add to Apple Wallet / Google Pay integration
   - Share button (SMS, WhatsApp)

3. **Ticket Details Below QR:**
   ```
   Event Name
   Date & Time
   Ticket Type
   Holder Name
   Ticket Number

   [QR Code - Large]

   Instructions: "Show this QR code at check-in"
   ```

### 4.2 QR Code Generation

**Use Existing Service:** `/lib/services/qrcode.ts` ✅

**Enhancements:**

```typescript
async generateMobileTicketQR(ticketData: TicketQRData): Promise<string> {
  return QRCode.toDataURL(JSON.stringify({
    t: ticketData.ticketId,
    v: ticketData.validationCode,
    e: ticketData.eventId,
    s: this.signQRData(ticketData) // Add signature
  }), {
    errorCorrectionLevel: 'H', // High - survives damage
    margin: 2,
    color: { dark: '#000000', light: '#FFFFFF' },
    width: 400, // Higher res for mobile
  });
}
```

### 4.3 Email Integration

**Ticket Confirmation Email:**

```html
<div style="text-align: center; padding: 20px;">
  <h2>Your Ticket is Ready!</h2>
  <img src="{{qrCodeDataUrl}}" alt="QR Code" style="width: 300px; height: 300px;" />
  <p><strong>Ticket #{{ticketNumber}}</strong></p>

  <a href="{{ticketUrl}}" style="display: inline-block; padding: 12px 24px; background: #2563eb; color: white; text-decoration: none; border-radius: 6px; margin: 10px;">
    View Full Ticket
  </a>

  <p style="color: #666; font-size: 14px;">
    Simply show this QR code at check-in. No printing required!
  </p>
</div>
```

---

## 5. API Endpoints

### 5.1 Staff Management APIs

**New Endpoints:**

```typescript
// POST /api/events/[eventId]/staff
// Assign staff to event
interface AssignStaffRequest {
  email: string;
  role: StaffRole;
  permissions?: string[];
}

// GET /api/events/[eventId]/staff
// List all staff for event
interface ListStaffResponse {
  staff: EventStaff[];
  total: number;
}

// PATCH /api/events/[eventId]/staff/[staffId]
// Update staff role/permissions
interface UpdateStaffRequest {
  role?: StaffRole;
  permissions?: string[];
  isActive?: boolean;
}

// DELETE /api/events/[eventId]/staff/[staffId]
// Remove staff assignment

// POST /api/staff/auth/access-code
// Quick login with access code
interface AccessCodeLoginRequest {
  eventId: string;
  accessCode: string;
}
```

### 5.2 Check-In APIs

**Existing:** `/api/events/[eventId]/checkin` ✅ (KEEP AS-IS)

**Enhancements Needed:**

```typescript
// Add staff validation to existing endpoint
async function handleCheckInTicket(request: NextRequest, context: any) {
  const { user, params } = context;
  const eventId = params.eventId;

  // NEW: Check if user is assigned staff
  const staffAssignment = await prisma.eventStaff.findUnique({
    where: {
      eventId_userId: { eventId, userId: user.id },
      isActive: true
    }
  });

  const canCheckIn =
    user.role === 'SUPER_ADMIN' ||
    user.role === 'ADMIN' ||
    event.organizerId === user.id ||
    !!staffAssignment; // NEW: Staff can check in

  // ... rest of existing logic
}
```

### 5.3 Offline Sync APIs

**New Endpoints:**

```typescript
// GET /api/events/[eventId]/tickets-cache
// Prefetch all tickets for offline use
interface TicketsCacheResponse {
  tickets: Array<{
    id: string;
    ticketNumber: string;
    validationCode: string;
    holderName: string;
    ticketType: string;
    checkedIn: boolean;
    status: TicketStatus;
  }>;
  lastUpdated: string;
  total: number;
}

// POST /api/events/[eventId]/checkin/sync
// Bulk sync offline check-ins
interface SyncCheckInsRequest {
  checkIns: Array<{
    ticketId: string;
    validationCode: string;
    checkedInAt: string; // ISO timestamp
    checkInMethod: 'QR_SCAN';
  }>;
}
```

---

## 6. Mobile Optimization

### 6.1 PWA Configuration

**Update:** `next.config.js`

```javascript
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  runtimeCaching: [
    {
      urlPattern: /^\/api\/events\/.*\/tickets-cache$/,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'tickets-cache',
        expiration: { maxAgeSeconds: 300 } // 5 minutes
      }
    },
    {
      urlPattern: /^\/api\/events\/.*\/checkin$/,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'checkin-api',
        networkTimeoutSeconds: 3
      }
    }
  ]
});

module.exports = withPWA(nextConfig);
```

**Add:** `public/manifest.json`

```json
{
  "name": "SteppersLife Check-In",
  "short_name": "Check-In",
  "description": "Event check-in scanner for staff",
  "start_url": "/staff/checkin",
  "display": "standalone",
  "orientation": "portrait",
  "theme_color": "#2563eb",
  "background_color": "#ffffff",
  "icons": [
    {
      "src": "/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ]
}
```

### 6.2 Camera Permissions

**Auto-Request Flow:**

```typescript
// /components/staff/QRScanner.tsx
async function initializeScanner() {
  try {
    // Request camera permission
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: 'environment', // Back camera
        width: { ideal: 1280 },
        height: { ideal: 720 }
      }
    });

    // Initialize scanner
    const codeReader = new BrowserQRCodeReader();
    await codeReader.decodeFromVideoDevice(
      undefined, // Use default camera
      'video-preview',
      (result, error) => {
        if (result) {
          handleScan(result.getText());
          // Vibrate + sound
          navigator.vibrate?.(200);
          playBeep();
        }
      }
    );

    setScannerReady(true);
  } catch (error) {
    if (error.name === 'NotAllowedError') {
      setError('Camera permission denied. Please enable in settings.');
    } else {
      setError('Camera initialization failed: ' + error.message);
    }
  }
}
```

### 6.3 Performance Considerations

**Target Metrics:**

- **Scan Speed:** < 500ms (from QR detection to validation)
- **Check-In API:** < 1 second (P95)
- **Offline Check-In:** < 100ms (instant)
- **Cache Size:** < 5MB for 1000 tickets

**Optimizations:**

1. **Lazy Load Scanner:**
   ```typescript
   const QRScanner = dynamic(() => import('@/components/staff/QRScanner'), {
     ssr: false,
     loading: () => <LoadingSpinner />
   });
   ```

2. **Debounce Scans:**
   ```typescript
   const handleScan = useMemo(() =>
     debounce((data: string) => {
       processQRCode(data);
     }, 300),
     []
   );
   ```

3. **IndexedDB for Offline Storage:**
   ```typescript
   const ticketsDB = new Dexie('EventTicketsDB');
   ticketsDB.version(1).stores({
     tickets: 'id, ticketNumber, validationCode, checkedIn',
     syncQueue: '++id, action, timestamp'
   });
   ```

---

## 7. Security

### 7.1 Staff Authentication

**Access Code Security:**

```typescript
// Generate cryptographically random 6-digit code
function generateAccessCode(): string {
  const buffer = crypto.randomBytes(4);
  const num = buffer.readUInt32BE(0);
  return (num % 900000 + 100000).toString(); // 100000-999999
}

// Hash before storing
const hashedCode = await bcrypt.hash(accessCode, 10);
await prisma.eventStaff.create({
  data: {
    accessCode: hashedCode,
    // ... other fields
  }
});
```

**Rate Limiting:**

```typescript
// Redis-based rate limiting
const rateLimiter = new RateLimiter({
  points: 5, // 5 attempts
  duration: 900, // per 15 minutes
  keyPrefix: 'access-code-login'
});

await rateLimiter.consume(ipAddress);
```

### 7.2 Permission Checks

**Middleware Enhancement:**

```typescript
// lib/auth/rbac.ts - ADD staff check
export async function requireStaffAccess(
  eventId: string,
  userId: string,
  requiredPermissions: string[] = []
): Promise<boolean> {
  const staff = await prisma.eventStaff.findUnique({
    where: {
      eventId_userId: { eventId, userId },
      isActive: true
    }
  });

  if (!staff) return false;

  // Check permissions
  return requiredPermissions.every(perm =>
    staff.permissions.includes(perm)
  );
}
```

### 7.3 QR Code Verification

**Signature Validation:**

```typescript
function verifyQRSignature(qrData: any): boolean {
  const { t, v, e, s } = qrData;

  const expectedSignature = crypto
    .createHmac('sha256', process.env.QR_SECRET!)
    .update(`${t}:${v}:${e}`)
    .digest('hex')
    .substring(0, 16);

  return s === expectedSignature;
}
```

### 7.4 Fraud Prevention

**Duplicate Detection:**

```typescript
// Check-in validation
async function validateCheckIn(ticketId: string, staffId: string) {
  const ticket = await prisma.ticket.findUnique({
    where: { id: ticketId },
    include: { transfers: true }
  });

  // Prevent rapid re-scans (5 second cooldown)
  const recentCheckIn = await redis.get(`checkin:${ticketId}`);
  if (recentCheckIn) {
    throw new Error('Ticket scanned too recently');
  }

  // Lock ticket for 5 seconds
  await redis.setex(`checkin:${ticketId}`, 5, staffId);

  // Validate ticket status
  if (ticket.status !== 'VALID') {
    throw new Error(`Ticket is ${ticket.status}`);
  }

  if (ticket.checkedIn) {
    throw new Error(`Already checked in at ${ticket.checkedInAt}`);
  }

  return ticket;
}
```

---

## 8. Implementation Phases

### Phase 1: Core Staff Management (Week 1)
- [ ] Add `EventStaff` model to Prisma schema
- [ ] Create staff assignment API endpoints
- [ ] Build organizer staff management UI
- [ ] Implement staff invitation email flow
- [ ] Create staff acceptance page

### Phase 2: Mobile Scanner (Week 2)
- [ ] Install QR scanning library (`@zxing/browser`)
- [ ] Build QR scanner component
- [ ] Create staff check-in mobile interface
- [ ] Implement access code quick login
- [ ] Add vibration + sound feedback

### Phase 3: Offline Capability (Week 3)
- [ ] Set up IndexedDB for ticket caching
- [ ] Implement ticket prefetch API
- [ ] Build offline sync queue
- [ ] Add service worker for PWA
- [ ] Create sync conflict resolution

### Phase 4: Attendee Experience (Week 4)
- [ ] Create public ticket view page
- [ ] Add screen brightness boost
- [ ] Implement QR signature verification
- [ ] Update ticket confirmation email
- [ ] Add wallet integration (Apple/Google)

### Phase 5: Testing & Polish (Week 5)
- [ ] End-to-end testing (staff + attendee flows)
- [ ] Performance optimization
- [ ] Security audit
- [ ] Documentation
- [ ] Production deployment

**Total Timeline: 5 weeks**

---

## 9. File Structure

```
/root/websites/events-stepperslife/

# New Files to Create
├── app/
│   ├── staff/
│   │   ├── checkin/[eventId]/
│   │   │   └── page.tsx              # Mobile scanner interface
│   │   ├── invite/[token]/
│   │   │   └── page.tsx              # Staff invitation acceptance
│   │   └── auth/access-code/
│   │       └── page.tsx              # Quick login page
│   ├── tickets/[ticketId]/
│   │   └── page.tsx                  # Public ticket view
│   └── api/
│       ├── events/[eventId]/
│       │   ├── staff/
│       │   │   ├── route.ts          # Staff CRUD
│       │   │   └── [staffId]/route.ts
│       │   └── tickets-cache/
│       │       └── route.ts          # Offline prefetch
│       └── staff/
│           └── auth/access-code/
│               └── route.ts          # Access code login
│
├── components/
│   └── staff/
│       ├── QRScanner.tsx             # Camera scanner component
│       ├── ManualSearch.tsx          # Manual ticket search
│       ├── CheckInStats.tsx          # Live statistics
│       └── OfflineIndicator.tsx      # Sync status
│
├── lib/
│   ├── services/
│   │   ├── staff.service.ts          # Staff management logic
│   │   └── offline-sync.service.ts   # Sync queue manager
│   └── db/
│       └── indexeddb.ts              # Offline storage setup
│
└── public/
    ├── manifest.json                 # PWA manifest
    ├── sw.js                         # Service worker
    └── icons/                        # PWA icons

# Files to Modify
├── prisma/schema.prisma              # Add EventStaff model
├── lib/auth/rbac.ts                  # Add staff permissions
├── app/api/events/[eventId]/checkin/route.ts  # Add staff validation
└── next.config.js                    # Add PWA support
```

---

## 10. Success Metrics

### Performance
- ✅ QR scan to check-in: < 2 seconds (target: < 1s)
- ✅ Offline check-in: < 100ms (instant)
- ✅ Cache 1000 tickets: < 5MB storage
- ✅ Page load (mobile): < 2 seconds

### User Experience
- ✅ Staff can start scanning in < 30 seconds from opening app
- ✅ Zero training required (intuitive UI)
- ✅ Works without internet connection
- ✅ Clear error messages (no technical jargon)

### Security
- ✅ Zero unauthorized check-ins
- ✅ Zero duplicate scans (within 5 seconds)
- ✅ All check-ins logged with staff ID
- ✅ QR codes cryptographically signed

### Reliability
- ✅ 99.9% uptime during events
- ✅ Graceful degradation (offline mode)
- ✅ Automatic sync when connection restores
- ✅ No data loss

---

## Summary

This architecture provides:

1. **Simple Staff Management** - Email invite → 6-digit code → instant access
2. **Fast QR Scanning** - Sub-1-second scans with offline capability
3. **Mobile-First Design** - PWA with camera integration
4. **Offline Reliability** - IndexedDB caching + sync queue
5. **Security** - Signed QR codes + rate limiting + permission checks
6. **Easy Attendee Experience** - Large QR codes + auto-brightness + wallet integration

### Key Design Decisions

- ✅ Keep existing ticket/check-in models (minimal changes)
- ✅ Use 6-digit access codes for speed (not full passwords)
- ✅ Offline-first architecture (essential for events)
- ✅ Sign QR codes with HMAC (prevent fraud)
- ✅ PWA instead of native app (faster deployment)
- ✅ Simple role model (4 roles, not complex permissions matrix)

### Integration with Affiliate System

This staff system works seamlessly with the affiliate system:
- Staff can scan tickets sold by affiliates
- Check-in tracking shows which affiliate sold the ticket
- Admin dashboard aggregates data across all sales channels
- No special handling needed - tickets are tickets

---

## Next Steps

1. ✅ **Review & approve architecture** (this document)
2. **Create database migration** (Phase 1, Week 1)
3. **Start implementation** (follow phased roadmap)
4. **Test with real devices** (multiple phone models)
5. **Deploy to production** (after Phase 5 complete)

---

**Architecture Status:** ✅ Complete and Ready for Implementation

**Architect:** Winston
**Date:** 2025-10-02
