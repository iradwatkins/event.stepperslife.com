# Affiliate Fraud Detection & Side-Selling Prevention System

## Executive Summary

This document outlines the comprehensive fraud detection system designed to prevent and alert Event Organizers about potential side-selling by affiliate/staff members during events.

**Primary Problem**: An affiliate who is also assigned as staff for an event could sell tickets during the event (at the door) and pocket the money, circumventing the Event Organizer's revenue stream.

**Solution**: Multi-layered detection system with automatic flagging, risk scoring, and visual alerts for Event Organizers.

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Detection Mechanisms](#detection-mechanisms)
3. [Database Schema](#database-schema)
4. [Fraud Flags & Risk Scoring](#fraud-flags--risk-scoring)
5. [Visual Alerts for Organizers](#visual-alerts-for-organizers)
6. [API Endpoints](#api-endpoints)
7. [Integration Points](#integration-points)
8. [Usage Examples](#usage-examples)
9. [Prevention Best Practices](#prevention-best-practices)

---

## System Overview

### Core Components

1. **Database Layer** (`prisma/schema.prisma`)
   - Enhanced `AffiliateSale` model with fraud detection fields
   - Tracks: `soldDuringEvent`, `soldByStaff`, `fraudRiskScore`, `fraudFlags`

2. **Detection Service** (`lib/services/affiliate-fraud-detection.service.ts`)
   - Analyzes sales in real-time
   - Calculates risk scores (0-100)
   - Generates warnings and recommendations

3. **UI Component** (`components/events/fraud-alert-panel.tsx`)
   - Visual dashboard for Event Organizers
   - Shows flagged sales requiring review
   - One-click approval/rejection workflow

4. **API Routes** (To be implemented)
   - `/api/events/[eventId]/fraud/summary` - Get fraud statistics
   - `/api/events/[eventId]/fraud/flagged-sales` - Get flagged sales
   - `/api/events/[eventId]/fraud/review/[saleId]` - Mark as reviewed

---

## Detection Mechanisms

### 1. Temporal Detection (When was the sale made?)

**Critical Flag**: Sale during event window
```typescript
if (saleDate >= eventStartDate && saleDate <= eventEndDate) {
  // This sale occurred DURING the event
  soldDuringEvent = true;
}
```

**Why it matters**: Tickets sold during an event are more likely to be door sales, which should go through the organizer's check-in system, not affiliate links.

### 2. Role Detection (Who made the sale?)

**Critical Flag**: Affiliate is also staff
```typescript
// Check if affiliate's user account has STAFF role
// OR is assigned to this specific event as staff
if (affiliate.user.role === 'STAFF') {
  soldByStaff = true;
}
```

**Why it matters**: Staff members working at the event have opportunity to sell tickets at the door and keep the money.

### 3. Combined Critical Alert

**🚨 HIGHEST RISK**: Staff + During Event
```typescript
if (soldDuringEvent && soldByStaff) {
  riskScore += 50; // Adds 50 points to risk score
  flagForReview = true;
  // Trigger immediate organizer notification
}
```

This is the **PRIMARY FRAUD INDICATOR** the system watches for.

### 4. Secondary Detection Mechanisms

#### A. Cash Sales During Event
- **Risk**: High
- **Rationale**: Cash is harder to track than digital payments
- **Flag**: `CASH_SALE_DURING_EVENT` (+35 points)

#### B. Geolocation Mismatch
- **Risk**: High
- **Rationale**: If sale location is >50km from venue during event, suspicious
- **Flag**: `LOCATION_MISMATCH_DURING_EVENT` (+30 points)
- **Requires**: Geolocation capture during checkout

#### C. Last-Minute Cash Sales
- **Risk**: Medium
- **Rationale**: Cash sales <24h before event may be door sales
- **Flag**: `CASH_SALE_24H_BEFORE_EVENT` (+15 points)

#### D. Pattern Detection
- **Multiple sales from same IP** (+15 points)
- **Unusual sale times** (2am-6am) (+5 points)
- **Manual entry sales** (+10 points)

---

## Database Schema

### Enhanced `AffiliateSale` Model

```prisma
model AffiliateSale {
  // ... existing fields ...

  // FRAUD DETECTION & SIDE-SELLING WARNINGS
  soldDuringEvent   Boolean   @default(false)  // Sale occurred during event window
  soldByStaff       Boolean   @default(false)  // Affiliate is also staff for this event
  locationMatch     Boolean?  // Geolocation matches event venue
  ipAddress         String?   // IP address of sale
  deviceFingerprint String?   // Device ID for tracking patterns

  // Risk Scoring
  fraudRiskScore    Int       @default(0)      // 0-100 risk score
  fraudFlags        String[]  @default([])     // Array of warning flags
  flaggedForReview  Boolean   @default(false)  // Needs organizer attention
  reviewedBy        String?   // User ID who reviewed
  reviewedAt        DateTime? // When reviewed
  reviewNotes       String?   // Organizer notes on review

  @@index([soldDuringEvent, soldByStaff])  // Composite index for fraud detection
  @@index([flaggedForReview])
  @@index([fraudRiskScore])
}
```

### Key Fields Explained

| Field | Type | Purpose |
|-------|------|---------|
| `soldDuringEvent` | Boolean | TRUE if sale timestamp is between event start/end |
| `soldByStaff` | Boolean | TRUE if affiliate has STAFF role OR is assigned to event |
| `fraudRiskScore` | Int (0-100) | Calculated risk score, >40 = auto-flagged |
| `fraudFlags` | String[] | Array of specific fraud indicators (e.g., "SOLD_DURING_EVENT_BY_STAFF") |
| `flaggedForReview` | Boolean | TRUE if needs organizer attention before payout |
| `reviewedBy` | String? | User ID of organizer who reviewed the sale |
| `reviewNotes` | String? | Organizer's investigation notes |

---

## Fraud Flags & Risk Scoring

### Flag Types & Weights

| Flag | Risk Points | Severity | Description |
|------|-------------|----------|-------------|
| `SOLD_DURING_EVENT_BY_STAFF` | **50** | 🚨 Critical | Staff sold during event - highest fraud risk |
| `CASH_SALE_DURING_EVENT` | **35** | 🚨 Critical | Cash payment during event |
| `LOCATION_MISMATCH_DURING_EVENT` | **30** | 🚨 Critical | Sale location doesn't match venue |
| `SOLD_BY_STAFF_MEMBER` | **20** | ⚠️ High | Staff sold tickets (any time) |
| `CASH_SALE_24H_BEFORE_EVENT` | **15** | ⚠️ High | Last-minute cash sale |
| `MULTIPLE_SALES_SAME_IP` | **15** | ⚠️ High | >5 sales from same IP in 24h |
| `UNUSUAL_SALE_TIME` | **10** | ℹ️ Medium | Sale between 2am-6am |
| `MANUAL_ENTRY_SALE` | **10** | ℹ️ Medium | Manually entered sale |
| `HIGH_TICKET_COUNT` | **5** | ℹ️ Low | Unusually high ticket quantity |
| `LATE_NIGHT_SALE` | **5** | ℹ️ Low | Sale during late hours |

### Risk Score Thresholds

- **0-39**: Low risk (monitor only)
- **40-69**: High risk (**AUTO-FLAGGED** for review)
- **70-100**: Critical risk (requires immediate investigation)

### Auto-Flag Threshold

```typescript
const AUTO_FLAG_THRESHOLD = 40;

if (fraudRiskScore >= AUTO_FLAG_THRESHOLD) {
  flaggedForReview = true;
  // Trigger organizer notification
  // Hold commission payment until reviewed
}
```

---

## Visual Alerts for Organizers

### Dashboard Integration

The `FraudAlertPanel` component displays on the Event Organizer's event management page:

```tsx
<FraudAlertPanel eventId={event.id} eventName={event.name} />
```

### Alert Levels

#### 1. **No Issues** (Green)
```
✅ No suspicious affiliate sales detected for this event
```

#### 2. **Warning** (Yellow/Orange)
```
⚠️ 3 sale(s) flagged for review - see details below
```

#### 3. **Critical** (Red)
```
🚨 CRITICAL: 2 sale(s) flagged for potential side-selling by staff during event!
```

### Summary Statistics

The panel shows:
- **Critical Flags**: Staff + During Event sales
- **Flagged Sales**: Total requiring review
- **During Event Sales**: All sales made during event
- **Staff Sales**: All sales by staff members
- **Flag Rate**: Percentage of total sales flagged

### Flagged Sale Card

Each flagged sale displays:

```
┌─────────────────────────────────────────────────────┐
│ 👤 John Smith (STAFF MEMBER)      🚨 CRITICAL RISK (85)│
│    john@example.com                                  │
├─────────────────────────────────────────────────────┤
│ Order #12345  │ Dec 15, 19:30 │ $150.00 │ $22.50 comm │
├─────────────────────────────────────────────────────┤
│ 🚨 Staff Sold During Event                          │
│ 💰 Cash During Event                                │
│ 📍 Location Mismatch                                │
├─────────────────────────────────────────────────────┤
│ [👁️ Review Sale] [💬 Contact Affiliate]             │
└─────────────────────────────────────────────────────┘
```

### Review Dialog

When organizer clicks "Review Sale", a dialog opens with:

1. **Risk Assessment**
   - Risk score and level
   - All fraud flags explained
   - Sale details (date, time, amount, etc.)

2. **Investigation Notes**
   - Text area for organizer to document findings
   - Required before approval/rejection

3. **Actions**
   - **✅ Approve Sale**: Mark as legitimate, allow commission payout
   - **❌ Reject & Investigate**: Block payout, contact affiliate

---

## API Endpoints

### 1. Get Fraud Summary

**Endpoint**: `GET /api/events/[eventId]/fraud/summary`

**Response**:
```json
{
  "totalSales": 45,
  "flaggedSales": 3,
  "duringEventSales": 8,
  "staffSales": 5,
  "criticalFlags": 2,
  "flagRate": 6.7
}
```

### 2. Get Flagged Sales

**Endpoint**: `GET /api/events/[eventId]/fraud/flagged-sales`

**Response**:
```json
[
  {
    "id": "sale_123",
    "saleDate": "2025-01-15T19:30:00Z",
    "fraudRiskScore": 85,
    "fraudFlags": [
      "SOLD_DURING_EVENT_BY_STAFF",
      "CASH_SALE_DURING_EVENT"
    ],
    "soldDuringEvent": true,
    "soldByStaff": true,
    "ticketCount": 3,
    "total": 150.00,
    "commissionAmount": 22.50,
    "affiliate": {
      "id": "aff_456",
      "user": {
        "firstName": "John",
        "lastName": "Smith",
        "email": "john@example.com",
        "role": "STAFF"
      }
    },
    "order": {
      "orderNumber": "ORD-12345",
      "status": "COMPLETED"
    }
  }
]
```

### 3. Review Sale

**Endpoint**: `POST /api/events/[eventId]/fraud/review/[saleId]`

**Request**:
```json
{
  "approved": false,
  "notes": "Contacted affiliate - confirmed this was door sale. Payment was NOT remitted to organizer. Suspended affiliate account."
}
```

**Response**:
```json
{
  "success": true,
  "message": "Sale marked as reviewed",
  "payoutHeld": true
}
```

---

## Integration Points

### 1. Order Creation Flow

**When**: A ticket purchase is completed via affiliate link

**Action**: Run fraud detection

```typescript
// In: app/api/events/[eventId]/purchase/route.ts

import { detectAffiliateFraud } from '@/lib/services/affiliate-fraud-detection.service';

// After order is created
if (affiliateLinkId) {
  const fraudResult = await detectAffiliateFraud({
    affiliateId,
    eventId,
    orderId: order.id,
    saleDate: new Date(),
    saleType: 'ONLINE_LINK',
    paymentMethod,
    ipAddress: request.ip,
    geolocation: extractGeolocation(request)
  });

  // Create AffiliateSale record with fraud data
  await prisma.affiliateSale.create({
    data: {
      affiliateId,
      eventId,
      orderId: order.id,
      // ... other fields ...
      soldDuringEvent: fraudResult.soldDuringEvent,
      soldByStaff: fraudResult.soldByStaff,
      fraudRiskScore: fraudResult.fraudRiskScore,
      fraudFlags: fraudResult.fraudFlags,
      flaggedForReview: fraudResult.flaggedForReview,
      ipAddress,
      locationMatch: fraudResult.locationMatch
    }
  });

  // If flagged, send notification to organizer
  if (fraudResult.flaggedForReview) {
    await sendFraudAlertEmail(eventOrganizerId, fraudResult);
  }
}
```

### 2. Affiliate Dashboard

**Display**: Warning if they are staff for an event

```tsx
{affiliate.isStaffForEvents.length > 0 && (
  <Alert variant="warning">
    <AlertTriangle className="h-4 w-4" />
    <AlertDescription>
      ⚠️ You are assigned as staff for {affiliate.isStaffForEvents.length} event(s).
      Sales made DURING those events will be flagged for review to prevent side-selling.
    </AlertDescription>
  </Alert>
)}
```

### 3. Event Organizer Dashboard

**Display**: Fraud alert panel prominently

```tsx
// In: app/dashboard/events/[eventId]/manage/page.tsx

import { FraudAlertPanel } from '@/components/events/fraud-alert-panel';

export default function EventManagePage({ params }) {
  return (
    <div>
      {/* Other event management UI */}

      {/* Fraud Detection Section */}
      <FraudAlertPanel
        eventId={params.eventId}
        eventName={event.name}
      />

      {/* Rest of page */}
    </div>
  );
}
```

### 4. Payout Processing

**Check**: Block payouts for flagged sales

```typescript
// In: lib/services/payout.service.ts

async function processAffiliatePayout(affiliateId: string) {
  // Get all sales eligible for payout
  const sales = await prisma.affiliateSale.findMany({
    where: {
      affiliateId,
      settlementStatus: 'UNSETTLED',
      payoutId: null
    }
  });

  // Separate flagged sales
  const approvedSales = sales.filter(s => !s.flaggedForReview);
  const flaggedSales = sales.filter(s => s.flaggedForReview);

  if (flaggedSales.length > 0) {
    console.warn(
      `⚠️ ${flaggedSales.length} sales for affiliate ${affiliateId} are flagged for review and will NOT be paid out.`
    );

    // Notify affiliate
    await sendPayoutHoldEmail(affiliateId, flaggedSales);
  }

  // Only process approved sales
  if (approvedSales.length > 0) {
    const totalCommission = approvedSales.reduce(
      (sum, s) => sum + Number(s.commissionAmount),
      0
    );

    await createPayout(affiliateId, totalCommission, approvedSales);
  }
}
```

---

## Usage Examples

### Example 1: Legitimate Pre-Event Sale

**Scenario**: Affiliate promotes event 2 weeks before, sells 10 tickets via tracking link

```
✅ NO FLAGS
- soldDuringEvent: false (2 weeks before)
- soldByStaff: false
- fraudRiskScore: 0
- flaggedForReview: false
```

**Outcome**: Commission paid normally

---

### Example 2: Staff Pre-Selling (OK)

**Scenario**: Staff member promotes event 1 week before, sells 5 tickets via link

```
⚠️ LOW RISK
- soldDuringEvent: false
- soldByStaff: true
- fraudRiskScore: 20
- fraudFlags: ["SOLD_BY_STAFF_MEMBER"]
- flaggedForReview: false
```

**Outcome**: Monitored but not flagged. Commission paid.

---

### Example 3: Side-Selling (CRITICAL)

**Scenario**: Staff member sells 3 tickets at door during event, enters manually

```
🚨 CRITICAL
- soldDuringEvent: true (during event hours)
- soldByStaff: true
- saleType: MANUAL_ENTRY
- paymentMethod: CASH
- fraudRiskScore: 85
- fraudFlags: [
    "SOLD_DURING_EVENT_BY_STAFF",
    "CASH_SALE_DURING_EVENT",
    "MANUAL_ENTRY_SALE"
  ]
- flaggedForReview: true
```

**Outcome**:
1. Organizer gets immediate alert
2. Commission payment BLOCKED
3. Requires organizer review
4. Affiliate notified of hold

---

### Example 4: Last-Minute Rush (Medium Risk)

**Scenario**: Affiliate sells 8 tickets, 12 hours before event, via link

```
⚠️ MEDIUM RISK
- soldDuringEvent: false (12h before)
- soldByStaff: false
- fraudRiskScore: 15
- fraudFlags: ["CASH_SALE_24H_BEFORE_EVENT"]
- flaggedForReview: false
```

**Outcome**: Monitored, commission paid, but logged for pattern analysis

---

## Prevention Best Practices

### For Event Organizers

1. **Clearly Communicate Policy**
   ```
   "If you are working as staff at the event, DO NOT sell tickets
   during event hours. All sales must be completed before the event starts."
   ```

2. **Set Sales Cutoff Times**
   - Close affiliate link sales 1-2 hours before event
   - Forces door sales to go through organizer check-in

3. **Regular Reviews**
   - Check fraud alerts weekly
   - Review patterns across multiple events
   - Document findings for audit trail

4. **Enforce Consequences**
   - First offense: Warning + hold commission
   - Second offense: Suspension
   - Third offense: Permanent ban + report to authorities

### For Platform (SteppersLife)

1. **Automated Notifications**
   - Email organizer immediately when critical flag is triggered
   - Daily digest of flagged sales
   - Weekly fraud summary report

2. **Dashboard Visibility**
   - Fraud panel on main event page (can't miss it)
   - Badge count of pending reviews
   - Mobile push notifications for critical alerts

3. **Affiliate Education**
   - During onboarding, explain fraud detection
   - Warning messages when affiliate is assigned as staff
   - Tooltips explaining why sales might be flagged

4. **Audit Trail**
   - Log all review decisions
   - Track which organizers review flagged sales
   - Generate reports for tax/legal purposes

---

## Next Steps for Implementation

### Phase 1: Database (DONE ✅)
- [x] Add fraud detection fields to `AffiliateSale` model
- [ ] Run migration: `npx prisma db push`

### Phase 2: Detection Service (DONE ✅)
- [x] Create `affiliate-fraud-detection.service.ts`
- [x] Implement risk scoring algorithm
- [x] Create helper functions

### Phase 3: API Endpoints (TODO)
- [ ] Create `/api/events/[eventId]/fraud/summary` route
- [ ] Create `/api/events/[eventId]/fraud/flagged-sales` route
- [ ] Create `/api/events/[eventId]/fraud/review/[saleId]` route

### Phase 4: UI Components (DONE ✅)
- [x] Create `FraudAlertPanel` component
- [ ] Integrate into Event Management page
- [ ] Add affiliate warnings to affiliate dashboard

### Phase 5: Integration
- [ ] Add fraud detection to order creation flow
- [ ] Add fraud checks to payout processing
- [ ] Implement email notifications
- [ ] Add logging/analytics

### Phase 6: Testing
- [ ] Unit tests for fraud detection logic
- [ ] Integration tests for API endpoints
- [ ] E2E tests for review workflow
- [ ] Load testing for performance

---

## Technical Implementation Notes

### Performance Considerations

1. **Real-time vs. Batch**
   - Run fraud detection synchronously during order creation (adds ~100-200ms)
   - Alternative: Queue-based processing for high volume

2. **Caching**
   - Cache event staff assignments
   - Cache affiliate risk profiles
   - Invalidate on role changes

3. **Indexing**
   ```sql
   CREATE INDEX idx_affiliate_sales_fraud
   ON affiliate_sales(sold_during_event, sold_by_staff, flagged_for_review);
   ```

### Geolocation Capture

```typescript
// Optional: Capture geolocation during checkout
if (navigator.geolocation) {
  navigator.geolocation.getCurrentPosition((position) => {
    geolocation = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude
    };
  });
}
```

### False Positive Mitigation

- Allow organizers to whitelist specific affiliates
- ML model to learn from review decisions (future)
- Adjust thresholds based on event type/size

---

## Conclusion

This fraud detection system provides **comprehensive, automated protection** against side-selling by affiliate/staff members. The multi-layered approach catches suspicious activity at the point of sale and gives Event Organizers **immediate visibility and control**.

Key benefits:
- ✅ Automatic detection of high-risk sales patterns
- ✅ Visual alerts that can't be ignored
- ✅ One-click review and approval workflow
- ✅ Commission payment protection
- ✅ Audit trail for legal compliance

**Result**: Event Organizers can confidently use affiliates who are also staff, knowing the system will flag any suspicious activity for review before payouts are processed.
