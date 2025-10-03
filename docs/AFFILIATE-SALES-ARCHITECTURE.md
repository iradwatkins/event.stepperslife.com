# Affiliate Ticket Sales System - Technical Architecture

**Version:** 1.0
**Author:** Winston (Architect Agent)
**Date:** 2025-10-02
**Status:** Design Document

---

## Table of Contents
1. [Executive Summary](#executive-summary)
2. [System Overview](#system-overview)
3. [Data Model](#data-model)
4. [Core Workflows](#core-workflows)
5. [API Endpoints](#api-endpoints)
6. [Security & Fraud Prevention](#security--fraud-prevention)
7. [Integration Points](#integration-points)
8. [Implementation Phases](#implementation-phases)

---

## Executive Summary

The Affiliate Ticket Sales System allows event organizers to recruit affiliates (promoters, salespeople) to sell tickets on their behalf. The system supports two sales models (pre-buy and pay-later) and enables both online and cash payment transactions with PIN validation for security.

**Key Features:**
- Two sales models: Pre-buy (affiliate buys upfront) and Pay-later (affiliate pays after selling)
- Unique affiliate tracking links for online sales
- Cash payment support with 4-digit PIN validation
- Automated commission/payout tracking
- Dashboard analytics for affiliates and organizers
- 1099 tax reporting preparation

**Tech Stack Integration:**
- Next.js 14 with TypeScript
- Prisma ORM + PostgreSQL
- Square & Stripe Connect payment processors
- NextAuth.js for authentication (existing)
- Existing Order/Ticket/Event system

---

## System Overview

### User Roles

**New Role: AFFILIATE**
```typescript
enum UserRole {
  ATTENDEE
  ORGANIZER
  AFFILIATE      // <- NEW
  STAFF
  ADMIN
  SUPER_ADMIN
}
```

**Affiliate Permissions:**
```typescript
AFFILIATE: [
  'events.browse',
  'events.view',
  'tickets.sell',              // NEW
  'tickets.view_assigned',     // NEW
  'affiliate.dashboard',       // NEW
  'sales.record_cash',         // NEW
  'profile.edit_own'
]
```

### Business Models Supported

1. **Pre-Buy Model**
   - Organizer assigns tickets to affiliate
   - Affiliate buys tickets upfront at wholesale price
   - Affiliate sells tickets at retail price
   - Profit = Retail Price - Wholesale Price

2. **Pay-Later Model**
   - Organizer assigns ticket quota to affiliate
   - Affiliate sells tickets (reduces organizer's available inventory)
   - Affiliate owes organizer the agreed wholesale price per ticket
   - Settlement happens on agreed schedule

---

## Data Model

### 1. Affiliate Entity

```prisma
model Affiliate {
  id                String    @id @default(uuid())
  userId            String    @unique

  // Business Information
  businessName      String?
  taxId             String?   // For 1099 reporting
  w9Submitted       Boolean   @default(false)
  w9DocumentUrl     String?

  // Cash Payment PIN
  cashPinHash       String    // Hashed 4-digit PIN for cash validation
  pinLastChanged    DateTime  @default(now())

  // Status
  status            AffiliateStatus @default(PENDING)
  approvedBy        String?   // Admin user ID
  approvedAt        DateTime?
  suspendedAt       DateTime?
  suspensionReason  String?

  // Payment Settings
  payoutMethod      PayoutMethod @default(BANK_TRANSFER)
  bankAccountLast4  String?
  stripeConnectId   String?   @unique

  // Statistics
  totalSales        Int       @default(0)
  totalRevenue      Decimal   @default(0) @db.Decimal(12, 2)
  totalCommission   Decimal   @default(0) @db.Decimal(12, 2)
  totalPaidOut      Decimal   @default(0) @db.Decimal(12, 2)

  // Relations
  user              User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  affiliateLinks    AffiliateLink[]
  inventory         AffiliateTicketInventory[]
  sales             AffiliateSale[]
  payouts           AffiliatePayout[]

  // Timestamps
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt

  @@index([userId])
  @@index([status])
  @@index([stripeConnectId])
  @@map("affiliates")
}

enum AffiliateStatus {
  PENDING      // Application submitted
  APPROVED     // Approved and active
  SUSPENDED    // Temporarily suspended
  BANNED       // Permanently banned
  INACTIVE     // Voluntarily inactive
}

enum PayoutMethod {
  BANK_TRANSFER
  STRIPE_CONNECT
  CHECK
}
```

### 2. Affiliate Link Entity

```prisma
model AffiliateLink {
  id                String    @id @default(uuid())
  affiliateId       String
  eventId           String

  // Link Configuration
  linkCode          String    @unique  // Unique code for tracking (e.g., "SUMMER2025-JOHN")
  trackingUrl       String    @unique  // Full URL with tracking parameters

  // Commission Settings
  commissionType    CommissionType @default(PERCENTAGE)
  commissionValue   Decimal   @db.Decimal(10, 2)

  // Statistics
  clicks            Int       @default(0)
  conversions       Int       @default(0)
  totalSales        Decimal   @default(0) @db.Decimal(12, 2)

  // Status
  isActive          Boolean   @default(true)
  expiresAt         DateTime?

  // Relations
  affiliate         Affiliate @relation(fields: [affiliateId], references: [id], onDelete: Cascade)
  event             Event     @relation(fields: [eventId], references: [id], onDelete: Cascade)
  sales             AffiliateSale[]

  // Timestamps
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt

  @@index([affiliateId])
  @@index([eventId])
  @@index([linkCode])
  @@map("affiliate_links")
}

enum CommissionType {
  PERCENTAGE      // % of ticket price
  FIXED_AMOUNT    // Fixed $ per ticket
  TIERED          // Different rates based on volume
}
```

### 3. Affiliate Ticket Inventory (Pre-Buy Model)

```prisma
model AffiliateTicketInventory {
  id                String    @id @default(uuid())
  affiliateId       String
  eventId           String
  ticketTypeId      String

  // Purchase Details (Pre-Buy Model)
  quantityPurchased Int
  wholesalePrice    Decimal   @db.Decimal(10, 2)  // Price affiliate paid per ticket
  retailPrice       Decimal   @db.Decimal(10, 2)  // Price affiliate will sell at
  totalPaid         Decimal   @db.Decimal(10, 2)  // Total amount affiliate paid

  // Inventory Status
  quantitySold      Int       @default(0)
  quantityRemaining Int       // Calculated: quantityPurchased - quantitySold

  // Payment Reference
  squarePaymentId   String?
  stripePaymentId   String?
  orderId           String?   // Reference to purchase order

  // Status
  status            InventoryStatus @default(ACTIVE)
  purchasedAt       DateTime  @default(now())

  // Relations
  affiliate         Affiliate @relation(fields: [affiliateId], references: [id], onDelete: Cascade)
  event             Event     @relation(fields: [eventId], references: [id], onDelete: Cascade)
  ticketType        TicketType @relation(fields: [ticketTypeId], references: [id], onDelete: Cascade)
  sales             AffiliateSale[]

  // Timestamps
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt

  @@index([affiliateId])
  @@index([eventId])
  @@index([status])
  @@map("affiliate_ticket_inventory")
}

enum InventoryStatus {
  ACTIVE      // Available for sale
  SOLD_OUT    // All tickets sold
  CANCELLED   // Cancelled by organizer/affiliate
  REFUNDED    // Purchase refunded
}
```

### 4. Affiliate Sale Tracking

```prisma
model AffiliateSale {
  id                String    @id @default(uuid())
  affiliateId       String
  affiliateLinkId   String?   // Null for cash sales
  eventId           String
  orderId           String    @unique
  inventoryId       String?   // For pre-buy model

  // Sale Details
  saleType          SaleType
  ticketCount       Int
  ticketPrice       Decimal   @db.Decimal(10, 2)
  subtotal          Decimal   @db.Decimal(10, 2)
  fees              Decimal   @db.Decimal(10, 2) @default(0)
  taxes             Decimal   @db.Decimal(10, 2) @default(0)
  total             Decimal   @db.Decimal(10, 2)

  // Commission/Profit
  commissionType    CommissionType
  commissionValue   Decimal   @db.Decimal(10, 2)
  commissionAmount  Decimal   @db.Decimal(10, 2)  // Actual commission/profit earned

  // Payment Method
  paymentMethod     PaymentMethod

  // Cash Payment Validation
  cashValidatedBy   String?   // User ID who validated cash
  cashPinValidated  Boolean   @default(false)
  cashValidatedAt   DateTime?

  // Settlement (for Pay-Later model)
  wholesaleOwed     Decimal?  @db.Decimal(10, 2)  // Amount owed to organizer
  settlementStatus  SettlementStatus @default(UNSETTLED)
  settledAt         DateTime?

  // Payment References
  squarePaymentId   String?
  stripePaymentId   String?

  // Relations
  affiliate         Affiliate @relation(fields: [affiliateId], references: [id])
  affiliateLink     AffiliateLink? @relation(fields: [affiliateLinkId], references: [id])
  event             Event     @relation(fields: [eventId], references: [id])
  order             Order     @relation(fields: [orderId], references: [id])
  inventory         AffiliateTicketInventory? @relation(fields: [inventoryId], references: [id])
  payout            AffiliatePayout? @relation("SalePayout", fields: [payoutId], references: [id])
  payoutId          String?

  // Timestamps
  saleDate          DateTime  @default(now())
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt

  @@index([affiliateId])
  @@index([eventId])
  @@index([orderId])
  @@index([settlementStatus])
  @@index([saleDate])
  @@map("affiliate_sales")
}

enum SaleType {
  ONLINE_LINK     // Sale via affiliate tracking link
  CASH_OFFLINE    // Cash payment validated with PIN
  MANUAL_ENTRY    // Manually entered by organizer/admin
}

enum SettlementStatus {
  UNSETTLED       // Affiliate owes organizer (pay-later model)
  SETTLED         // Paid to organizer
  WRITTEN_OFF     // Debt forgiven/written off
}
```

### 5. Affiliate Payout

```prisma
model AffiliatePayout {
  id                String    @id @default(uuid())
  affiliateId       String

  // Payout Details
  payoutNumber      String    @unique
  amount            Decimal   @db.Decimal(10, 2)
  currency          String    @default("USD")

  // Period
  periodStart       DateTime
  periodEnd         DateTime

  // Statistics
  salesCount        Int
  totalCommission   Decimal   @db.Decimal(10, 2)
  platformFee       Decimal   @db.Decimal(10, 2) @default(0)
  netPayout         Decimal   @db.Decimal(10, 2)

  // Status & Processing
  status            PayoutStatus @default(PENDING)
  scheduledFor      DateTime
  processedAt       DateTime?

  // Payment Method
  payoutMethod      PayoutMethod
  stripeTransferId  String?   @unique
  bankTransferId    String?

  // Failure Handling
  failureReason     String?
  retryCount        Int       @default(0)

  // Relations
  affiliate         Affiliate @relation(fields: [affiliateId], references: [id])
  sales             AffiliateSale[] @relation("SalePayout")

  // Timestamps
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt

  @@index([affiliateId])
  @@index([status])
  @@index([scheduledFor])
  @@map("affiliate_payouts")
}
```

### 6. Tax Reporting (1099 Prep)

```prisma
model Affiliate1099Record {
  id                String    @id @default(uuid())
  affiliateId       String

  // Tax Year
  taxYear           Int       // e.g., 2025

  // Total Amounts
  totalEarnings     Decimal   @db.Decimal(12, 2)
  totalCommissions  Decimal   @db.Decimal(12, 2)
  totalPayouts      Decimal   @db.Decimal(12, 2)

  // Tax Information
  taxIdProvided     Boolean   @default(false)
  w9Submitted       Boolean   @default(false)

  // 1099 Status
  form1099Required  Boolean   // TRUE if earnings >= $600
  form1099Generated Boolean   @default(false)
  form1099SentAt    DateTime?

  // Relations
  affiliate         Affiliate @relation(fields: [affiliateId], references: [id])

  // Timestamps
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt

  @@unique([affiliateId, taxYear])
  @@index([affiliateId])
  @@index([taxYear])
  @@map("affiliate_1099_records")
}
```

### 7. Event Schema Updates

```prisma
// Add to existing Event model
model Event {
  // ... existing fields ...

  // Affiliate Sales
  affiliateLinksEnabled Boolean   @default(false)
  affiliateLinks        AffiliateLink[]
  affiliateInventory    AffiliateTicketInventory[]
  affiliateSales        AffiliateSale[]

  // ... rest of existing model ...
}

// Add to existing Order model
model Order {
  // ... existing fields ...

  // Affiliate Tracking
  affiliateSale         AffiliateSale?

  // ... rest of existing model ...
}

// Add to existing TicketType model
model TicketType {
  // ... existing fields ...

  // Affiliate Configuration
  affiliateEnabled      Boolean   @default(false)
  wholesalePrice        Decimal?  @db.Decimal(10, 2)  // Wholesale price for affiliates
  affiliateInventory    AffiliateTicketInventory[]

  // ... rest of existing model ...
}
```

---

## Core Workflows

### Workflow 1: Affiliate Registration & Approval

```
┌─────────────┐
│ User Signs  │
│ Up as       │
│ Affiliate   │
└──────┬──────┘
       │
       v
┌─────────────────────────────┐
│ 1. User submits application │
│    - Business info          │
│    - Tax ID (optional)      │
│    - Set 4-digit PIN        │
└──────┬──────────────────────┘
       │
       v
┌─────────────────────────────┐
│ 2. Create Affiliate record  │
│    - Status: PENDING        │
│    - Hash PIN code          │
└──────┬──────────────────────┘
       │
       v
┌─────────────────────────────┐
│ 3. Admin reviews            │
│    - Approve/Reject         │
│    - Set commission rules   │
└──────┬──────────────────────┘
       │
       v
┌─────────────────────────────┐
│ 4. Status: APPROVED         │
│ 5. Send welcome email       │
│ 6. Affiliate can sell       │
└─────────────────────────────┘
```

**Implementation:**
- `POST /api/affiliates/apply` - Submit application
- `POST /api/admin/affiliates/:id/approve` - Admin approval
- `PUT /api/affiliates/:id/pin` - Update PIN (requires current PIN)

### Workflow 2: Pre-Buy Model - Affiliate Purchases Tickets

```
┌─────────────────────────────┐
│ Organizer assigns ticket    │
│ quota to affiliate          │
└──────┬──────────────────────┘
       │
       v
┌─────────────────────────────┐
│ 1. Affiliate views available│
│    events & ticket types    │
│ 2. Selects quantity to buy  │
│    - Wholesale price shown  │
│    - Retail price shown     │
│    - Profit margin shown    │
└──────┬──────────────────────┘
       │
       v
┌─────────────────────────────┐
│ 3. Process payment          │
│    - Square/Stripe checkout │
│    - Total = qty * wholesale│
└──────┬──────────────────────┘
       │
       v
┌─────────────────────────────┐
│ 4. Create inventory record  │
│    - AffiliateTicketInventory│
│    - Status: ACTIVE         │
│    - quantityRemaining = qty│
└──────┬──────────────────────┘
       │
       v
┌─────────────────────────────┐
│ 5. Affiliate sells tickets  │
│    - Online via link        │
│    - Cash with PIN          │
└─────────────────────────────┘
```

**Implementation:**
- `GET /api/affiliates/inventory/available` - View available tickets
- `POST /api/affiliates/inventory/purchase` - Purchase tickets
- Inventory decrements organizer's available inventory

### Workflow 3: Pay-Later Model - Affiliate Sells First

```
┌─────────────────────────────┐
│ Organizer enables affiliate │
│ for event (pay-later)       │
└──────┬──────────────────────┘
       │
       v
┌─────────────────────────────┐
│ 1. Affiliate gets unique    │
│    tracking link for event  │
│ 2. Commission % configured  │
└──────┬──────────────────────┘
       │
       v
┌─────────────────────────────┐
│ 3. Affiliate sells ticket   │
│    - Online: via link       │
│    - Cash: with PIN         │
└──────┬──────────────────────┘
       │
       v
┌─────────────────────────────┐
│ 4. Create AffiliateSale     │
│    - settlementStatus:      │
│      UNSETTLED              │
│    - wholesaleOwed: $X      │
└──────┬──────────────────────┘
       │
       v
┌─────────────────────────────┐
│ 5. Periodic settlement      │
│    - Affiliate pays organizer│
│    - Mark as SETTLED        │
└─────────────────────────────┘
```

**Implementation:**
- `POST /api/affiliates/:affiliateId/links` - Create affiliate link
- Sale flow automatically tracks affiliate via link parameter
- `POST /api/affiliates/settlements/pay` - Process settlement payment

### Workflow 4: Online Sale via Affiliate Link

```
┌─────────────────────────────┐
│ Customer clicks affiliate   │
│ tracking link               │
│ e.g., /events/123?aff=ABC   │
└──────┬──────────────────────┘
       │
       v
┌─────────────────────────────┐
│ 1. Store affiliate code in  │
│    session/cookie           │
│ 2. Show event page          │
└──────┬──────────────────────┘
       │
       v
┌─────────────────────────────┐
│ 3. Customer purchases ticket│
│    - Normal checkout flow   │
│    - Affiliate code attached│
└──────┬──────────────────────┘
       │
       v
┌─────────────────────────────┐
│ 4. Create Order + Tickets   │
│    (existing flow)          │
└──────┬──────────────────────┘
       │
       v
┌─────────────────────────────┐
│ 5. Create AffiliateSale     │
│    - saleType: ONLINE_LINK  │
│    - Calculate commission   │
│    - Deduct inventory (if   │
│      pre-buy model)         │
└──────┬──────────────────────┘
       │
       v
┌─────────────────────────────┐
│ 6. Update statistics        │
│    - Affiliate total sales  │
│    - Link conversions       │
└─────────────────────────────┘
```

**Implementation:**
- Middleware captures `?aff=CODE` parameter
- Store in session cookie (7-day attribution window)
- Existing purchase endpoint enhanced to check for affiliate code

### Workflow 5: Cash Payment with PIN Validation

```
┌─────────────────────────────┐
│ Affiliate receives cash     │
│ from customer in person     │
└──────┬──────────────────────┘
       │
       v
┌─────────────────────────────┐
│ 1. Affiliate logs into      │
│    mobile dashboard         │
│ 2. Selects "Record Cash Sale"│
└──────┬──────────────────────┘
       │
       v
┌─────────────────────────────┐
│ 3. Enter sale details       │
│    - Event                  │
│    - Ticket type            │
│    - Quantity               │
│    - Customer info          │
└──────┬──────────────────────┘
       │
       v
┌─────────────────────────────┐
│ 4. Enter 4-digit PIN        │
│    - Validates cash received│
│    - Hash and verify        │
└──────┬──────────────────────┘
       │
       v (PIN correct)
┌─────────────────────────────┐
│ 5. Create Order + Tickets   │
│    - paymentMethod: CASH    │
│    - paymentStatus: COMPLETED│
└──────┬──────────────────────┘
       │
       v
┌─────────────────────────────┐
│ 6. Create AffiliateSale     │
│    - saleType: CASH_OFFLINE │
│    - cashPinValidated: true │
│    - cashValidatedBy: userId│
└──────┬──────────────────────┘
       │
       v
┌─────────────────────────────┐
│ 7. Generate QR codes        │
│ 8. Email/SMS tickets to     │
│    customer                 │
└─────────────────────────────┘
```

**Implementation:**
- `POST /api/affiliates/sales/cash` - Record cash sale
- PIN validation: `bcrypt.compare(pin, affiliate.cashPinHash)`
- Security: Rate limit PIN attempts (max 3 failures)
- Log all cash sales for audit trail

### Workflow 6: Payout Processing

```
┌─────────────────────────────┐
│ Automated cron job          │
│ (daily/weekly/monthly)      │
└──────┬──────────────────────┘
       │
       v
┌─────────────────────────────┐
│ 1. Query settled sales      │
│    - settlementStatus: SETTLED│
│    - Not yet paid out       │
└──────┬──────────────────────┘
       │
       v
┌─────────────────────────────┐
│ 2. Calculate payout amount  │
│    - Sum commissions        │
│    - Subtract platform fee  │
│    - Group by affiliate     │
└──────┬──────────────────────┘
       │
       v
┌─────────────────────────────┐
│ 3. Create AffiliatePayout   │
│    - status: PENDING        │
│    - scheduledFor: next run │
└──────┬──────────────────────┘
       │
       v
┌─────────────────────────────┐
│ 4. Process via Stripe Connect│
│    - Transfer to affiliate  │
│    - Update status: COMPLETED│
└──────┬──────────────────────┘
       │
       v
┌─────────────────────────────┐
│ 5. Send payout notification │
│ 6. Update affiliate stats   │
└─────────────────────────────┘
```

**Implementation:**
- `POST /api/cron/affiliate-payouts` - Cron endpoint
- Uses Stripe Connect for transfers
- Minimum payout threshold: $25.00
- Failed payouts retry with exponential backoff

---

## API Endpoints

### Affiliate Management

```typescript
// Public - Apply to become affiliate
POST /api/affiliates/apply
Request: {
  businessName?: string
  taxId?: string
  pin: string  // 4-digit PIN
}
Response: {
  id: string
  status: "PENDING"
  message: "Application submitted for review"
}

// Affiliate - Get own profile
GET /api/affiliates/me
Response: {
  id: string
  businessName: string
  status: AffiliateStatus
  totalSales: number
  totalCommission: number
  availableBalance: number
}

// Affiliate - Update PIN
PUT /api/affiliates/me/pin
Request: {
  currentPin: string
  newPin: string
}
Response: {
  success: boolean
  message: "PIN updated successfully"
}

// Admin - Approve affiliate
POST /api/admin/affiliates/:id/approve
Request: {
  approved: boolean
  commissionType?: CommissionType
  commissionValue?: number
}
Response: {
  id: string
  status: "APPROVED"
}
```

### Inventory Management (Pre-Buy Model)

```typescript
// Affiliate - View available tickets to purchase
GET /api/affiliates/inventory/available
Response: {
  events: [{
    id: string
    name: string
    ticketTypes: [{
      id: string
      name: string
      retailPrice: number
      wholesalePrice: number
      availableQuantity: number
      profitMargin: number  // Calculated
    }]
  }]
}

// Affiliate - Purchase tickets (pre-buy)
POST /api/affiliates/inventory/purchase
Request: {
  eventId: string
  ticketTypeId: string
  quantity: number
  paymentSourceId: string  // Square/Stripe token
}
Response: {
  inventoryId: string
  quantityPurchased: number
  totalPaid: number
  quantityRemaining: number
}

// Affiliate - View own inventory
GET /api/affiliates/inventory
Response: {
  inventory: [{
    id: string
    event: { id, name, date }
    ticketType: { id, name }
    quantityPurchased: number
    quantitySold: number
    quantityRemaining: number
    wholesalePrice: number
    retailPrice: number
  }]
}
```

### Affiliate Link Management

```typescript
// Organizer - Create affiliate link for event
POST /api/events/:eventId/affiliates/:affiliateId/link
Request: {
  commissionType: CommissionType
  commissionValue: number
  expiresAt?: Date
}
Response: {
  linkCode: string
  trackingUrl: string
  commissionType: string
  commissionValue: number
}

// Affiliate - Get own links
GET /api/affiliates/me/links
Response: {
  links: [{
    id: string
    linkCode: string
    trackingUrl: string
    event: { id, name, date }
    clicks: number
    conversions: number
    totalSales: number
    isActive: boolean
  }]
}
```

### Sales Recording

```typescript
// Enhanced existing purchase endpoint
POST /api/events/:eventId/purchase
Request: {
  // ... existing fields ...
  affiliateCode?: string  // Optional tracking code
}
Response: {
  // ... existing response ...
  affiliateTracked: boolean
}

// Affiliate - Record cash sale
POST /api/affiliates/sales/cash
Request: {
  eventId: string
  ticketTypeId: string
  quantity: number
  customerName: string
  customerEmail: string
  customerPhone?: string
  pin: string  // 4-digit PIN for validation
}
Response: {
  saleId: string
  orderId: string
  tickets: [{
    ticketNumber: string
    qrCode: string
  }]
  totalAmount: number
  commission: number
}
```

### Dashboard & Analytics

```typescript
// Affiliate - Get dashboard stats
GET /api/affiliates/me/dashboard
Response: {
  overview: {
    totalSales: number
    totalRevenue: number
    totalCommission: number
    pendingPayout: number
  }
  recentSales: [{
    date: Date
    orderId: string
    customerName: string
    ticketCount: number
    amount: number
    commission: number
    saleType: SaleType
  }]
  topEvents: [{
    eventId: string
    eventName: string
    salesCount: number
    revenue: number
  }]
}

// Organizer - View affiliate sales for event
GET /api/events/:eventId/affiliates/sales
Response: {
  sales: [{
    affiliateId: string
    affiliateName: string
    salesCount: number
    totalRevenue: number
    commissionPaid: number
  }]
}
```

### Settlement & Payouts

```typescript
// Admin/Cron - Process payouts
POST /api/cron/affiliate-payouts
Response: {
  payoutsProcessed: number
  totalAmount: number
  failures: number
}

// Affiliate - View payout history
GET /api/affiliates/me/payouts
Response: {
  payouts: [{
    id: string
    payoutNumber: string
    amount: number
    status: PayoutStatus
    periodStart: Date
    periodEnd: Date
    salesCount: number
    processedAt?: Date
  }]
}

// Affiliate - Request early payout
POST /api/affiliates/me/payouts/request
Request: {
  amount: number
}
Response: {
  payoutId: string
  scheduledFor: Date
  fee: number  // Early payout fee
}
```

---

## Security & Fraud Prevention

### 1. PIN Code Security

**Hashing:**
```typescript
import bcrypt from 'bcryptjs';

// Setting PIN
const cashPinHash = await bcrypt.hash(pin, 12);

// Validating PIN
const isValid = await bcrypt.compare(pin, affiliate.cashPinHash);
```

**Rate Limiting:**
- Max 3 failed PIN attempts per 15 minutes
- Lock account after 5 consecutive failures
- Require admin unlock or 24-hour cooldown

**PIN Requirements:**
- Must be exactly 4 digits
- Cannot be sequential (1234, 4321)
- Cannot be repeating (1111, 2222)
- Force change every 90 days

### 2. Cash Sale Validation

**Audit Trail:**
```typescript
await prisma.auditLog.create({
  data: {
    action: 'CASH_SALE_RECORDED',
    entityType: 'AFFILIATE_SALE',
    entityId: sale.id,
    userId: affiliate.userId,
    metadata: {
      eventId,
      ticketCount,
      amount,
      pinValidated: true,
      ipAddress,
      userAgent
    }
  }
});
```

**Fraud Detection:**
- Flag if affiliate records >10 cash sales/hour
- Flag if cash sales exceed $1000/day
- Flag if same customer email used >3 times/day
- Admin review queue for flagged transactions

### 3. Payment Security

**Square/Stripe:**
- Never store raw card numbers
- Use tokenized payment sources
- Implement 3D Secure for high-value purchases
- Monitor for unusual patterns (velocity checks)

**Settlement Security:**
- Verify affiliate bank account with micro-deposits
- Require W-9 for payouts >$600/year
- Hold first payout for 7 days (new affiliates)
- Escrow period: 3-day hold on pay-later sales

### 4. Link Tracking Security

**Prevention:**
- Unique codes: UUID-based (prevents guessing)
- Expiration: Optional expiry dates
- One-time use: Optional single-use links
- Attribution window: 7-day cookie/session

**Fraud Prevention:**
- Detect self-referral (IP address matching)
- Limit link sharing (max X uses per IP per day)
- Bot detection (CAPTCHA on purchase)

---

## Integration Points

### 1. Square Payment Integration

**Affiliate Inventory Purchase:**
```typescript
import { squareClient } from '@/lib/payments/square.config';

// Create payment for inventory purchase
const payment = await squareClient.payments.create({
  sourceId: paymentSourceId,
  amountMoney: {
    amount: BigInt(totalAmount * 100),
    currency: 'USD'
  },
  idempotencyKey: `affiliate-inv-${affiliateId}-${Date.now()}`
});
```

**Cash Sale Recording:**
- No Square payment needed (cash = offline)
- Create order with `paymentMethod: CASH`
- Mark as `paymentStatus: COMPLETED`

### 2. Stripe Connect Integration

**Onboarding Affiliates:**
```typescript
import Stripe from 'stripe';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// Create connected account
const account = await stripe.accounts.create({
  type: 'express',
  country: 'US',
  email: affiliate.user.email,
  capabilities: {
    transfers: { requested: true }
  }
});

// Save to database
await prisma.affiliate.update({
  where: { id: affiliateId },
  data: { stripeConnectId: account.id }
});
```

**Processing Payouts:**
```typescript
// Transfer commission to affiliate
const transfer = await stripe.transfers.create({
  amount: Math.round(payoutAmount * 100),
  currency: 'usd',
  destination: affiliate.stripeConnectId,
  description: `Affiliate payout ${payoutNumber}`
});

// Update payout record
await prisma.affiliatePayout.update({
  where: { id: payoutId },
  data: {
    status: 'COMPLETED',
    stripeTransferId: transfer.id,
    processedAt: new Date()
  }
});
```

### 3. Existing Order System

**Enhancing Purchase Endpoint:**
```typescript
// app/api/events/[eventId]/purchase/route.ts

// After creating order, check for affiliate tracking
const affiliateCode = cookies().get('affiliateCode')?.value;

if (affiliateCode) {
  const affiliateLink = await prisma.affiliateLink.findUnique({
    where: { linkCode: affiliateCode },
    include: { affiliate: true }
  });

  if (affiliateLink && affiliateLink.isActive) {
    // Calculate commission
    const commissionAmount = calculateCommission(
      order.total,
      affiliateLink.commissionType,
      affiliateLink.commissionValue
    );

    // Create affiliate sale
    await prisma.affiliateSale.create({
      data: {
        affiliateId: affiliateLink.affiliateId,
        affiliateLinkId: affiliateLink.id,
        eventId: order.eventId,
        orderId: order.id,
        saleType: 'ONLINE_LINK',
        ticketCount: tickets.length,
        ticketPrice: ticketType.price,
        subtotal: order.subtotal,
        fees: order.fees,
        taxes: order.taxes,
        total: order.total,
        commissionType: affiliateLink.commissionType,
        commissionValue: affiliateLink.commissionValue,
        commissionAmount,
        paymentMethod: order.paymentMethod,
        settlementStatus: 'SETTLED'  // Or UNSETTLED for pay-later
      }
    });

    // Update link stats
    await prisma.affiliateLink.update({
      where: { id: affiliateLink.id },
      data: {
        conversions: { increment: 1 },
        totalSales: { increment: order.total }
      }
    });
  }
}
```

### 4. Tax Reporting (1099)

**Annual Tax Report Generation:**
```typescript
// Cron job runs January 1st
POST /api/cron/generate-1099s

// For each affiliate with >$600 earnings
const affiliates = await prisma.affiliate.findMany({
  where: {
    totalCommission: { gte: 600 }
  }
});

for (const affiliate of affiliates) {
  const earnings = await prisma.affiliateSale.aggregate({
    where: {
      affiliateId: affiliate.id,
      saleDate: {
        gte: new Date(`${taxYear}-01-01`),
        lt: new Date(`${taxYear + 1}-01-01`)
      }
    },
    _sum: { commissionAmount: true }
  });

  await prisma.affiliate1099Record.create({
    data: {
      affiliateId: affiliate.id,
      taxYear,
      totalEarnings: earnings._sum.commissionAmount,
      totalCommissions: earnings._sum.commissionAmount,
      form1099Required: true,
      taxIdProvided: !!affiliate.taxId
    }
  });

  // Send 1099 form via email/mail
  await send1099Form(affiliate);
}
```

---

## Implementation Phases

### Phase 1: Foundation (Week 1-2)
**Goal:** Basic affiliate system operational

- [ ] Database migrations
  - Add Affiliate, AffiliateLink, AffiliateSale models
  - Add AFFILIATE role to UserRole enum
  - Update Event, Order, TicketType models

- [ ] Authentication & Permissions
  - Add AFFILIATE role permissions
  - Update RBAC configuration

- [ ] Core API Endpoints
  - `POST /api/affiliates/apply`
  - `GET /api/affiliates/me`
  - `POST /api/admin/affiliates/:id/approve`
  - `POST /api/events/:eventId/affiliates/:affiliateId/link`

- [ ] Basic UI
  - Affiliate application form
  - Admin approval interface
  - Affiliate dashboard (basic stats)

**Testing:**
- Unit tests for affiliate creation
- Integration test for approval workflow
- E2E test: User applies -> Admin approves -> Affiliate active

---

### Phase 2: Online Sales (Week 3-4)
**Goal:** Affiliate link tracking functional

- [ ] Link Tracking System
  - Middleware to capture `?aff=CODE`
  - Session/cookie storage (7-day attribution)
  - Link click tracking

- [ ] Enhanced Purchase Flow
  - Detect affiliate code during checkout
  - Create AffiliateSale record
  - Calculate commission
  - Update link conversion stats

- [ ] Affiliate Dashboard
  - View active links
  - Sales analytics
  - Revenue tracking

- [ ] Organizer Dashboard
  - View affiliate sales by event
  - Commission breakdown

**Testing:**
- E2E test: Click affiliate link -> Purchase ticket -> Commission recorded
- Test attribution window (7 days)
- Test commission calculations

---

### Phase 3: Cash Sales & PIN Validation (Week 5-6)
**Goal:** Offline cash sales functional

- [ ] PIN Management
  - Implement bcrypt hashing
  - Create/update PIN endpoints
  - PIN validation logic

- [ ] Cash Sale Recording
  - `POST /api/affiliates/sales/cash`
  - PIN verification
  - Create order + tickets
  - Generate QR codes
  - Email/SMS delivery

- [ ] Security & Rate Limiting
  - Max 3 PIN attempts per 15 min
  - Account lockout after 5 failures
  - Audit logging for all cash sales

- [ ] Mobile-Friendly UI
  - Cash sale recording form
  - PIN entry interface
  - Sale confirmation screen

**Testing:**
- Unit test: PIN hashing/validation
- Integration test: Cash sale with valid/invalid PIN
- Security test: Rate limiting, lockout
- E2E test: Record cash sale -> Customer receives tickets

---

### Phase 4: Pre-Buy Inventory (Week 7-8)
**Goal:** Affiliates can purchase tickets upfront

- [ ] Inventory Management
  - Add AffiliateTicketInventory model
  - `GET /api/affiliates/inventory/available`
  - `POST /api/affiliates/inventory/purchase`
  - Inventory decrement logic

- [ ] Payment Processing
  - Square payment for inventory purchase
  - Create inventory record
  - Update organizer availability

- [ ] Inventory Tracking
  - Real-time quantity updates
  - Sold/remaining tracking
  - Low inventory alerts

- [ ] UI Components
  - Inventory purchase interface
  - Inventory management dashboard
  - Sales from inventory tracking

**Testing:**
- Integration test: Purchase inventory -> Sell ticket -> Inventory decrements
- Test edge cases: Overselling, refunds
- E2E test: Full pre-buy workflow

---

### Phase 5: Payouts & Settlements (Week 9-10)
**Goal:** Automated commission payouts

- [ ] Stripe Connect Onboarding
  - Account creation flow
  - Bank verification
  - KYC compliance

- [ ] Payout Processing
  - AffiliatePayout model
  - Cron job for scheduled payouts
  - Stripe transfer integration
  - Failure handling & retries

- [ ] Settlement System (Pay-Later)
  - Track unsettled sales
  - Manual settlement recording
  - Settlement reporting

- [ ] Payout Dashboard
  - Upcoming payouts
  - Payout history
  - Transaction details

**Testing:**
- Integration test: Stripe Connect onboarding
- Integration test: Payout processing
- Test failure scenarios: Insufficient funds, invalid account
- E2E test: Sales -> Scheduled payout -> Funds transferred

---

### Phase 6: Tax Reporting & Compliance (Week 11-12)
**Goal:** 1099 tax reporting ready

- [ ] Tax Information Collection
  - W-9 form submission
  - Tax ID validation
  - Document storage

- [ ] 1099 Record Generation
  - Affiliate1099Record model
  - Annual earnings calculation
  - Form generation (PDF)

- [ ] Reporting & Export
  - CSV export for all affiliates
  - IRS-compliant 1099 forms
  - Email/mail delivery

- [ ] Compliance Dashboard
  - Admin view of tax records
  - W-9 completion status
  - 1099 generation status

**Testing:**
- Unit test: Earnings calculation
- Integration test: 1099 form generation
- Validate IRS compliance requirements
- E2E test: Year-end tax reporting

---

### Phase 7: Analytics & Optimization (Week 13-14)
**Goal:** Advanced analytics and fraud prevention

- [ ] Advanced Analytics
  - Conversion funnel analysis
  - ROI metrics per affiliate
  - Event performance comparison
  - Geographic sales distribution

- [ ] Fraud Detection
  - Automated flagging rules
  - Admin review queue
  - Suspicious activity alerts

- [ ] Performance Optimization
  - Database indexing
  - Query optimization
  - Caching strategy (Redis)

- [ ] Mobile App (Optional)
  - React Native app for affiliates
  - Cash sale recording
  - Real-time analytics

**Testing:**
- Performance testing: 1000+ affiliates, 10k+ sales
- Load testing: Concurrent cash sales
- Security testing: Fraud detection accuracy

---

## Success Metrics

**KPIs to Track:**
1. **Affiliate Adoption**
   - Number of active affiliates
   - Approval rate
   - Churn rate

2. **Sales Performance**
   - Total affiliate sales volume
   - Average commission per affiliate
   - Conversion rate (link clicks → purchases)

3. **Revenue Impact**
   - Incremental ticket sales
   - Cost per acquisition via affiliates
   - ROI vs. other marketing channels

4. **Operational Efficiency**
   - Cash sale validation success rate
   - Payout success rate
   - Average settlement time

5. **User Satisfaction**
   - Affiliate NPS score
   - Organizer satisfaction with affiliate sales
   - Customer satisfaction (tickets purchased via affiliates)

---

## Appendix: Database Schema Summary

```sql
-- New Tables
affiliates
affiliate_links
affiliate_ticket_inventory
affiliate_sales
affiliate_payouts
affiliate_1099_records

-- Modified Tables
users (add AFFILIATE role)
events (add affiliateLinksEnabled, relations)
orders (add affiliateSale relation)
ticket_types (add affiliateEnabled, wholesalePrice)

-- New Enums
AffiliateStatus
CommissionType
SaleType
SettlementStatus
PayoutMethod
InventoryStatus
```

**Total New Tables:** 6
**Modified Tables:** 4
**New Enums:** 6

---

## Conclusion

This architecture provides a **simple, straightforward** affiliate ticket sales system that supports both pre-buy and pay-later models with robust cash payment validation. The phased implementation approach allows for iterative development and testing, ensuring each component works correctly before moving to the next.

**Key Strengths:**
- ✅ Leverages existing infrastructure (Square, Stripe, Order system)
- ✅ Secure PIN-based cash validation
- ✅ Flexible commission structures
- ✅ Tax compliance ready (1099 reporting)
- ✅ Scalable database design
- ✅ Clear audit trail for all transactions

**Next Steps:**
1. Review and approve this architecture document
2. Create detailed PRD (Product Requirements Document)
3. Begin Phase 1 implementation
4. Set up development/staging environment for testing

---

**Document Version:** 1.0
**Last Updated:** 2025-10-02
**Status:** Ready for Review
