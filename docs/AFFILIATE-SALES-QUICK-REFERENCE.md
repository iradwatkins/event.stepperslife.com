# Affiliate Sales System - Quick Reference

## System Overview

```
┌──────────────────────────────────────────────────────────────┐
│                   AFFILIATE SALES SYSTEM                      │
│                                                               │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐      │
│  │  ORGANIZER  │───>│  AFFILIATE  │───>│  CUSTOMER   │      │
│  └─────────────┘    └─────────────┘    └─────────────┘      │
│                                                               │
│  1. Assigns tickets  2. Sells tickets  3. Buys tickets       │
│  2. Sets pricing     3. Gets commission 4. Gets QR code      │
└──────────────────────────────────────────────────────────────┘
```

## Two Sales Models

### 1. Pre-Buy Model
```
Affiliate Buys Upfront → Sells to Customers → Keeps Profit

Example:
- Wholesale Price: $40/ticket
- Retail Price: $50/ticket
- Affiliate buys 100 tickets = $4,000
- Sells all 100 = $5,000
- Profit: $1,000
```

### 2. Pay-Later Model
```
Affiliate Sells First → Owes Organizer → Gets Commission

Example:
- Retail Price: $50/ticket
- Wholesale Price: $40/ticket
- Affiliate sells 100 tickets = $5,000 collected
- Owes organizer: 100 × $40 = $4,000
- Keeps: $1,000 (commission)
```

## Core Entities

```
┌─────────────────────────────────────────────────────────────┐
│ USER (existing)                                              │
│ ├─ role: AFFILIATE (NEW)                                    │
│ └─ Affiliate Profile                                        │
│    ├─ cashPinHash (4-digit, bcrypt)                        │
│    ├─ totalSales, totalCommission                          │
│    └─ stripeConnectId (for payouts)                        │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ AFFILIATE_LINK                                               │
│ ├─ linkCode (unique: "SUMMER2025-JOHN")                    │
│ ├─ trackingUrl (/events/123?aff=ABC)                       │
│ ├─ commissionType (PERCENTAGE, FIXED)                      │
│ ├─ commissionValue                                          │
│ └─ stats: clicks, conversions, totalSales                  │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ AFFILIATE_TICKET_INVENTORY (Pre-Buy Model)                  │
│ ├─ quantityPurchased                                        │
│ ├─ wholesalePrice (price affiliate paid)                   │
│ ├─ retailPrice (price affiliate sells at)                  │
│ ├─ quantitySold                                             │
│ └─ quantityRemaining                                        │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ AFFILIATE_SALE                                               │
│ ├─ saleType: ONLINE_LINK | CASH_OFFLINE                    │
│ ├─ orderId (links to existing Order)                       │
│ ├─ commissionAmount                                         │
│ ├─ cashPinValidated (for cash sales)                       │
│ └─ settlementStatus (UNSETTLED, SETTLED)                   │
└─────────────────────────────────────────────────────────────┘
```

## Payment Flows

### Online Sale (Credit Card)
```
1. Customer clicks affiliate link
   └─> Cookie/session stores affiliate code (7-day window)

2. Customer adds tickets to cart
   └─> Proceeds to checkout

3. Payment processed via Square/Stripe
   └─> Order created (existing flow)

4. AffiliateSale record created
   ├─ Commission calculated
   ├─ Inventory decremented (if pre-buy)
   └─ Stats updated
```

### Cash Sale (Offline)
```
1. Affiliate receives cash from customer
   └─> Opens mobile dashboard

2. Select "Record Cash Sale"
   ├─ Choose event & ticket type
   ├─ Enter customer info
   └─> Enter 4-digit PIN

3. PIN validated (bcrypt.compare)
   ├─ Success: Create order + tickets
   └─> Failure: Max 3 attempts, then lockout

4. QR codes generated & emailed to customer

5. AffiliateSale record created
   └─> Commission tracked
```

## Security Features

### PIN Protection
- **Storage:** Hashed with bcrypt (cost factor: 12)
- **Length:** Exactly 4 digits
- **Validation:** Max 3 attempts per 15 minutes
- **Lockout:** 5 consecutive failures = 24-hour lock
- **Rotation:** Force change every 90 days

### Fraud Detection
```
┌─────────────────────────────────┐
│ AUTO-FLAG RULES                 │
├─────────────────────────────────┤
│ • >10 cash sales/hour           │
│ • >$1000 cash sales/day         │
│ • Same email >3 times/day       │
│ • Self-referral (IP matching)  │
└─────────────────────────────────┘
```

## Commission Calculation

```typescript
function calculateCommission(
  ticketPrice: number,
  commissionType: CommissionType,
  commissionValue: number
): number {
  switch (commissionType) {
    case 'PERCENTAGE':
      return ticketPrice * (commissionValue / 100);

    case 'FIXED_AMOUNT':
      return commissionValue;

    case 'TIERED':
      // Based on volume sold
      if (totalSold >= 100) return ticketPrice * 0.15;
      if (totalSold >= 50) return ticketPrice * 0.10;
      return ticketPrice * 0.05;

    default:
      return 0;
  }
}
```

## Payout Schedule

```
Daily Payouts (for high-volume affiliates)
├─ Threshold: $100 minimum
└─> Process: Every day at 2 AM UTC

Weekly Payouts (standard)
├─ Threshold: $25 minimum
└─> Process: Every Monday at 2 AM UTC

Monthly Payouts (for small affiliates)
├─ Threshold: $10 minimum
└─> Process: 1st of month at 2 AM UTC
```

## Tax Reporting (1099)

```
┌─────────────────────────────────────────┐
│ ANNUAL TAX REPORTING (January 31)      │
├─────────────────────────────────────────┤
│ 1. Calculate total earnings per affiliate│
│ 2. If earnings >= $600:                 │
│    ├─ Require W-9 form                  │
│    ├─ Generate 1099-NEC                 │
│    └─> Mail/email by Jan 31            │
│ 3. File with IRS by Feb 28             │
└─────────────────────────────────────────┘
```

## Key API Endpoints

```
POST   /api/affiliates/apply              # Apply to become affiliate
GET    /api/affiliates/me                 # Get own profile
PUT    /api/affiliates/me/pin             # Update PIN

GET    /api/affiliates/inventory/available # View tickets to buy
POST   /api/affiliates/inventory/purchase  # Buy tickets (pre-buy)

POST   /api/events/:id/affiliates/:id/link # Create affiliate link
GET    /api/affiliates/me/links            # Get own links

POST   /api/affiliates/sales/cash          # Record cash sale
GET    /api/affiliates/me/dashboard        # Dashboard stats

POST   /api/admin/affiliates/:id/approve   # Approve affiliate
POST   /api/cron/affiliate-payouts         # Process payouts (cron)
```

## Database Indexes (Performance)

```sql
-- Critical indexes for performance
CREATE INDEX idx_affiliate_sales_affiliate_date
  ON affiliate_sales(affiliate_id, sale_date DESC);

CREATE INDEX idx_affiliate_sales_settlement
  ON affiliate_sales(settlement_status, affiliate_id);

CREATE INDEX idx_affiliate_links_code
  ON affiliate_links(link_code);

CREATE INDEX idx_affiliate_inventory_status
  ON affiliate_ticket_inventory(affiliate_id, status, event_id);
```

## Implementation Checklist

- [ ] Phase 1: Foundation (Weeks 1-2)
  - [ ] Database migrations
  - [ ] Affiliate role & permissions
  - [ ] Basic API endpoints
  - [ ] Admin approval UI

- [ ] Phase 2: Online Sales (Weeks 3-4)
  - [ ] Link tracking middleware
  - [ ] Enhanced purchase flow
  - [ ] Affiliate dashboard
  - [ ] Commission calculation

- [ ] Phase 3: Cash Sales (Weeks 5-6)
  - [ ] PIN management
  - [ ] Cash sale recording
  - [ ] Rate limiting & security
  - [ ] Mobile-friendly UI

- [ ] Phase 4: Pre-Buy Inventory (Weeks 7-8)
  - [ ] Inventory management
  - [ ] Payment processing
  - [ ] Real-time tracking

- [ ] Phase 5: Payouts (Weeks 9-10)
  - [ ] Stripe Connect onboarding
  - [ ] Automated payout processing
  - [ ] Settlement system

- [ ] Phase 6: Tax Reporting (Weeks 11-12)
  - [ ] W-9 collection
  - [ ] 1099 generation
  - [ ] IRS compliance

- [ ] Phase 7: Analytics (Weeks 13-14)
  - [ ] Advanced reporting
  - [ ] Fraud detection
  - [ ] Performance optimization

## Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Active Affiliates | 50+ | Count of APPROVED status |
| Monthly Sales Volume | $50k+ | Sum of affiliate_sales.total |
| Average Commission | $500/mo | Avg commission per affiliate |
| Conversion Rate | 5%+ | Conversions / Clicks |
| Payout Success Rate | 99%+ | Successful / Total payouts |
| Cash Validation Success | 98%+ | Valid PINs / Attempts |

---

**Quick Start:**
1. Read full architecture: `AFFILIATE-SALES-ARCHITECTURE.md`
2. Set up development environment
3. Run database migrations
4. Begin Phase 1 implementation

**Questions?** Contact the development team or review the detailed architecture document.
