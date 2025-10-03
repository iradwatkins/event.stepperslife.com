# System Integration Overview

**Date:** 2025-10-02
**Version:** 1.0

This document provides a high-level overview of how the Affiliate Ticket Sales System and Staff QR Scanning System integrate with the existing Events SteppersLife platform.

---

## Complete System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    EVENTS STEPPERSLIFE PLATFORM                  │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────────┐  ┌──────────────────────┐  ┌──────────────────────┐
│   EXISTING SYSTEM    │  │  AFFILIATE SYSTEM    │  │   STAFF SYSTEM       │
├──────────────────────┤  ├──────────────────────┤  ├──────────────────────┤
│ • Events             │  │ • Affiliates         │  │ • Event Staff        │
│ • Tickets            │  │ • Affiliate Links    │  │ • QR Scanner (PWA)   │
│ • Orders             │  │ • Affiliate Sales    │  │ • Check-In Tracking  │
│ • Users              │  │ • Commissions        │  │ • Offline Sync       │
│ • Payments (Square)  │  │ • Payouts (Stripe)   │  │ • Access Codes       │
│ • Email              │  │ • Cash Payments      │  │ • Staff Roles        │
└──────────────────────┘  └──────────────────────┘  └──────────────────────┘
         │                         │                          │
         └─────────────────────────┼──────────────────────────┘
                                   │
                          ┌────────▼────────┐
                          │  SHARED CORE    │
                          ├─────────────────┤
                          │ • Prisma DB     │
                          │ • NextAuth      │
                          │ • RBAC          │
                          │ • Email Service │
                          │ • QR Service    │
                          └─────────────────┘
```

---

## Integration Points

### 1. Ticket Sales Flow

**Direct Sale (Existing):**
```
Customer → Event Page → Purchase → Order → Ticket → Email with QR
```

**Affiliate Sale (New):**
```
Customer → Affiliate Link → Event Page (tracked) → Purchase → Order
    ↓
Ticket (marked as affiliate sale) → Email with QR
    ↓
Affiliate Commission Recorded
```

**Affiliate Cash Sale (New):**
```
Customer → Affiliate (in-person) → Cash Payment
    ↓
Affiliate enters 4-digit PIN → Validates Payment
    ↓
Order Created → Ticket Generated → Email with QR
    ↓
Affiliate Commission Recorded
```

### 2. Event Check-In Flow

**Regardless of how ticket was sold**, check-in works the same:

```
Attendee arrives with QR code (email/phone)
    ↓
Staff scans with mobile phone (camera)
    ↓
System validates:
  • QR signature valid?
  • Ticket exists?
  • Not already checked in?
  • Event matches?
    ↓
Check-in recorded:
  • ticket.checkedIn = true
  • ticket.checkedInAt = timestamp
  • ticket.checkedInBy = staffId
    ↓
Success feedback (vibration + sound)
```

### 3. Data Flow Integration

**Ticket Entity (Central Hub):**

```prisma
model Ticket {
  // Core fields (existing)
  id               String
  eventId          String
  orderId          String
  qrCode           String    // Used by staff scanner
  validationCode   String    // Verified at check-in

  // Check-in fields (existing)
  checkedIn        Boolean
  checkedInAt      DateTime?
  checkedInBy      String?   // Staff ID (new usage)

  // Affiliate tracking (new)
  affiliateId      String?   // Which affiliate sold this
  affiliateSaleId  String?   // Link to commission record

  // Relations
  event            Event     @relation(...)
  order            Order     @relation(...)
  affiliate        Affiliate? @relation(...)
  staffCheckIn     EventStaff? @relation("StaffCheckIns", ...)
}
```

**The ticket is the universal unit:**
- Created by: Organizer, Affiliate (pre-buy), or Affiliate (pay-later)
- Sold via: Direct sale, Affiliate link, or Cash payment
- Tracked by: Affiliate attribution system
- Validated at: Event check-in by staff
- Reported in: Admin dashboard (all sources aggregated)

---

## User Roles & Permissions

```
┌─────────────────────────────────────────────────────────────┐
│ ROLE            │ CAN DO                                     │
├─────────────────┼────────────────────────────────────────────┤
│ SUPER_ADMIN     │ Everything                                 │
├─────────────────┼────────────────────────────────────────────┤
│ ADMIN           │ Manage all events, view all analytics     │
├─────────────────┼────────────────────────────────────────────┤
│ ORGANIZER       │ • Create/manage their events              │
│                 │ • Assign affiliates                        │
│                 │ • Assign staff                             │
│                 │ • Set commission rates                     │
│                 │ • View event analytics                     │
│                 │ • Accept cash payments (with PIN)          │
│                 │ • Check in tickets                         │
├─────────────────┼────────────────────────────────────────────┤
│ AFFILIATE       │ • Sell tickets via unique links           │
│ (new)           │ • Accept cash payments (with PIN)          │
│                 │ • View own sales dashboard                 │
│                 │ • Pre-buy tickets (if allowed)             │
│                 │ • Request payouts                          │
├─────────────────┼────────────────────────────────────────────┤
│ DOOR_SCANNER    │ • Scan QR codes                           │
│ (new staff)     │ • Check in attendees                       │
│                 │ • View assigned events only                │
├─────────────────┼────────────────────────────────────────────┤
│ CHECK_IN_STAFF  │ • All DOOR_SCANNER permissions            │
│ (new staff)     │ • Manual ticket search                     │
│                 │ • View check-in stats                      │
├─────────────────┼────────────────────────────────────────────┤
│ LEAD_STAFF      │ • All CHECK_IN_STAFF permissions          │
│ (new staff)     │ • Manage other staff                       │
│                 │ • View detailed analytics                  │
├─────────────────┼────────────────────────────────────────────┤
│ COORDINATOR     │ • All LEAD_STAFF permissions              │
│ (new staff)     │ • Full event check-in control              │
├─────────────────┼────────────────────────────────────────────┤
│ ATTENDEE        │ • View own tickets                        │
│                 │ • Display QR code for check-in             │
└─────────────────┴────────────────────────────────────────────┘
```

---

## Payment Processors

### Square (Existing + Enhanced)
**Used for:**
- Direct ticket purchases
- Affiliate pre-buy purchases
- Online payments (card)

**Flow:**
```
Customer checkout → Square payment → Order created → Ticket issued
```

### Stripe Connect (New)
**Used for:**
- Affiliate payouts
- Commission settlements
- 1099 tax reporting

**Flow:**
```
Affiliate earns commission → Weekly payout calculation → Stripe Connect transfer
```

### Cash Payments (New)
**Used for:**
- In-person sales by organizers
- In-person sales by affiliates

**Flow:**
```
Cash payment → Seller enters PIN → Payment validated → Order created → Ticket issued
```

**Security:**
- 4-digit PIN per seller (hashed)
- Rate limited (5 attempts / 15 min)
- All cash payments logged with PIN validation timestamp

---

## Database Schema Summary

### New Tables

**Affiliate System:**
```
affiliates               - Affiliate accounts
affiliate_links          - Tracking URLs with UTM codes
affiliate_sales          - Individual sale records
affiliate_payouts        - Payment settlements
affiliate_tax_records    - 1099 data
```

**Staff System:**
```
event_staff              - Staff assignments to events
checkin_sessions         - Staff scanning sessions (optional)
```

### Modified Tables

**Users:** Add role types
```prisma
enum UserRole {
  SUPER_ADMIN
  ADMIN
  ORGANIZER
  AFFILIATE  // NEW
  ATTENDEE
}
```

**Tickets:** Add affiliate tracking
```prisma
model Ticket {
  affiliateId      String?   // NEW
  affiliateSaleId  String?   // NEW
  checkedInBy      String?   // Enhanced (now supports staff)
}
```

**Events:** Add affiliate settings
```prisma
model Event {
  allowAffiliates        Boolean   // NEW
  affiliateCommissionType String?  // NEW
  affiliateCommissionValue Decimal? // NEW
}
```

**Orders:** Add payment source tracking
```prisma
model Order {
  paymentMethod    PaymentMethod  // Enhanced
  affiliateId      String?        // NEW
  cashValidatedBy  String?        // NEW (PIN validator user ID)
  cashValidatedAt  DateTime?      // NEW
}
```

---

## API Endpoints Summary

### Existing APIs (No Changes)
```
✅ GET  /api/events
✅ POST /api/events
✅ GET  /api/events/[eventId]
✅ POST /api/events/[eventId]/purchase
✅ GET  /api/events/[eventId]/orders
```

### Enhanced APIs
```
🔧 POST /api/events/[eventId]/checkin
   - Add staff permission check
   - Add affiliate sale attribution

🔧 POST /api/events/[eventId]/purchase
   - Add affiliate link tracking
   - Add cash payment validation
```

### New APIs - Affiliate System
```
🆕 GET  /api/affiliates
🆕 POST /api/affiliates/register
🆕 GET  /api/affiliates/[affiliateId]/dashboard
🆕 GET  /api/affiliates/[affiliateId]/sales
🆕 POST /api/affiliates/[affiliateId]/payout

🆕 POST /api/events/[eventId]/affiliates
🆕 GET  /api/events/[eventId]/affiliates
🆕 POST /api/events/[eventId]/affiliates/assign-tickets

🆕 POST /api/payments/cash/validate
```

### New APIs - Staff System
```
🆕 GET  /api/events/[eventId]/staff
🆕 POST /api/events/[eventId]/staff
🆕 PATCH /api/events/[eventId]/staff/[staffId]
🆕 DELETE /api/events/[eventId]/staff/[staffId]

🆕 GET  /api/events/[eventId]/tickets-cache
🆕 POST /api/events/[eventId]/checkin/sync

🆕 POST /api/staff/auth/access-code
```

---

## UI/UX Routes

### Existing Routes
```
/                          - Homepage
/events                    - Event listing
/events/[eventId]          - Event details & purchase
/dashboard                 - Organizer dashboard
/dashboard/events          - Manage events
/admin                     - Admin panel
```

### New Routes - Affiliate System
```
/affiliate/register        - Affiliate registration
/affiliate/dashboard       - Affiliate sales dashboard
/affiliate/sales           - Detailed sales report
/affiliate/payouts         - Payout history

/dashboard/affiliates      - Organizer manage affiliates
/dashboard/events/[id]/affiliates - Event-specific affiliates
```

### New Routes - Staff System
```
/staff/invite/[token]      - Accept staff invitation
/staff/auth/access-code    - Quick login with PIN
/staff/checkin/[eventId]   - Mobile QR scanner (PWA)

/dashboard/events/[id]/staff - Organizer manage staff
/dashboard/events/[id]/checkin-stats - Live check-in analytics

/tickets/[ticketId]        - Public ticket view (large QR)
```

---

## Implementation Priority

### Phase 1: Affiliate System (Weeks 1-7)
1. Week 1-2: Database & basic affiliate CRUD
2. Week 3-4: Link tracking & online sales
3. Week 5-6: Cash payments & PIN validation
4. Week 7: Payouts & 1099 prep

### Phase 2: Staff System (Weeks 8-12)
1. Week 8: Staff management & assignments
2. Week 9: Mobile QR scanner (online mode)
3. Week 10: Offline capability & PWA
4. Week 11: Attendee ticket view enhancements
5. Week 12: Testing & polish

### Phase 3: Integration & Testing (Week 13-14)
1. End-to-end testing (affiliate → sale → check-in)
2. Load testing (1000 concurrent scans)
3. Security audit
4. Documentation
5. Training materials

**Total Timeline: 14 weeks (3.5 months)**

---

## Success Metrics

### Business Metrics
- **Affiliate Program:**
  - Number of active affiliates
  - Percentage of tickets sold via affiliates
  - Average commission rate
  - Affiliate retention rate (month-over-month)

- **Event Check-In:**
  - Average check-in time per attendee
  - Percentage of attendees checked in on time
  - Staff productivity (scans per hour)

### Technical Metrics
- **Performance:**
  - QR scan speed: < 1 second
  - Offline check-in: < 100ms
  - API response time: < 500ms (P95)
  - Page load time: < 2 seconds

- **Reliability:**
  - Uptime: > 99.9%
  - Successful offline syncs: > 99%
  - Zero duplicate check-ins
  - Zero unauthorized access

### User Satisfaction
- **Affiliates:**
  - Dashboard usability score: > 4.5/5
  - Payout satisfaction: > 4.5/5
  - Time to first sale: < 24 hours

- **Staff:**
  - Scanner ease of use: > 4.5/5
  - Setup time: < 2 minutes
  - Training time: < 10 minutes

---

## Documentation Index

### Architecture Documents
1. **AFFILIATE-SALES-ARCHITECTURE.md** - Complete affiliate system technical spec
2. **STAFF-QR-SCANNING-ARCHITECTURE.md** - Complete staff system technical spec
3. **SYSTEM-INTEGRATION-OVERVIEW.md** - This document (high-level integration)

### Quick Reference Guides
4. **AFFILIATE-SALES-QUICK-REFERENCE.md** - Developer cheat sheet for affiliate system
5. **AFFILIATE-BUSINESS-MODELS-COMPARISON.md** - Business model decision guide

### Visual Documentation
6. **AFFILIATE-SALES-SYSTEM-DIAGRAM.md** - Data flow diagrams for affiliate system

### Index & Navigation
7. **AFFILIATE-SYSTEM-README.md** - Starting point for affiliate documentation
8. **AFFILIATE-DOCUMENTATION-INDEX.md** - Complete file index

### Original Requirements (Archive)
9. **prd/AFFILIATE-TICKET-SALES-SYSTEM-PRD.md** - Original comprehensive PRD (superseded by architecture docs)

---

## Next Steps

1. **✅ Architecture Complete** - Both systems fully designed
2. **⏭️ Stakeholder Review** - Get approval on business model and technical approach
3. **⏭️ Database Migration** - Create Prisma migrations for new tables
4. **⏭️ Phase 1 Development** - Start affiliate system implementation
5. **⏭️ Phase 2 Development** - Start staff system implementation
6. **⏭️ Integration Testing** - Test complete flow (affiliate sale → staff check-in)
7. **⏭️ Production Deployment** - Phased rollout with beta testing

---

**Status:** Architecture Complete & Ready for Implementation
**Next Action:** Stakeholder review and approval
**Estimated Start Date:** TBD
**Estimated Completion:** 14 weeks from start

---

*Architecture by Winston (BMAD Architect Agent)*
*Date: 2025-10-02*
