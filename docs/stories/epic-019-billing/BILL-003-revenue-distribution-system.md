# BILL-003: Revenue Distribution System

**Epic:** EPIC-019 - Platform Billing & Revenue
**Story Points:** 8
**Priority:** P0 (Critical)
**Status:** Ready for Development

## User Story

**As a** platform operator
**I want** an automated system to calculate and distribute revenue between platform and organizers
**So that** all financial transactions are accurately tracked, compliant, and reconcilable

## Acceptance Criteria

### Primary Criteria
- [ ] Real-time revenue split calculation on every transaction
- [ ] Separate accounting for platform revenue vs organizer revenue
- [ ] Escrow handling for organizer funds until payout
- [ ] Automated daily reconciliation across all revenue streams
- [ ] Financial reporting dashboard with real-time metrics
- [ ] Support for multiple revenue types (ticket sales, subscriptions, fees)
- [ ] Dispute resolution tracking and adjustment entries

### Financial Compliance Criteria
- [ ] Double-entry bookkeeping for all revenue transactions
- [ ] GAAP-compliant revenue recognition
- [ ] SOX-compliant audit trail (immutable, timestamped)
- [ ] Separation of duties: Different roles for recording vs reconciliation
- [ ] 7-year retention of all financial records
- [ ] Monthly financial statement generation (P&L, Balance Sheet)
- [ ] Export to standard accounting formats (QuickBooks, Xero, CSV)

### Revenue Types Handled
- [ ] Ticket sales revenue (gross amount)
- [ ] Platform transaction fees (BILL-001)
- [ ] Subscription revenue (BILL-002)
- [ ] Refunds and chargebacks
- [ ] Payment processing fees (Square/Stripe)
- [ ] Adjustments and manual entries

## Technical Specifications

### Revenue Distribution Service

**File:** `lib/services/revenue-distribution.service.ts`

```typescript
enum RevenueType {
  TICKET_SALE = 'TICKET_SALE',
  PLATFORM_FEE = 'PLATFORM_FEE',
  SUBSCRIPTION = 'SUBSCRIPTION',
  REFUND = 'REFUND',
  CHARGEBACK = 'CHARGEBACK',
  PROCESSING_FEE = 'PROCESSING_FEE',
  ADJUSTMENT = 'ADJUSTMENT'
}

enum RevenueStatus {
  PENDING = 'PENDING',
  CLEARED = 'CLEARED',
  HELD = 'HELD', // Escrow
  PAID_OUT = 'PAID_OUT',
  DISPUTED = 'DISPUTED',
  REVERSED = 'REVERSED'
}

interface RevenueTransaction {
  id: string
  transactionDate: Date
  revenueType: RevenueType
  status: RevenueStatus

  // Amounts
  grossAmount: number // Total transaction amount
  platformRevenue: number // What platform keeps
  organizerRevenue: number // What organizer receives
  processingFee: number // Payment processor fee
  taxAmount: number // Tax collected

  // References
  orderId?: string
  eventId?: string
  organizerId?: string
  subscriptionId?: string

  // Escrow tracking
  escrowReleaseDate?: Date
  heldUntilDate?: Date

  // Accounting
  ledgerEntryId: string
  reconciledAt?: Date
  fiscalPeriod: string // "2025-Q1"

  // Metadata
  description: string
  metadata: any
  createdAt: Date
  updatedAt: Date
}

class RevenueDistributionService {
  /**
   * Process revenue from a ticket sale
   * Splits revenue between platform and organizer
   */
  async processTicketSaleRevenue(order: Order): Promise<RevenueTransaction>

  /**
   * Process platform fee revenue
   */
  async processPlatformFee(fee: TransactionFee): Promise<RevenueTransaction>

  /**
   * Process subscription revenue
   */
  async processSubscriptionRevenue(
    subscription: Subscription,
    invoice: SubscriptionInvoice
  ): Promise<RevenueTransaction>

  /**
   * Process refund (reverses original revenue)
   */
  async processRefund(
    originalTransaction: RevenueTransaction,
    refundAmount: number
  ): Promise<RevenueTransaction>

  /**
   * Get organizer's current balance (available + held)
   */
  async getOrganizerBalance(organizerId: string): Promise<{
    availableBalance: number
    heldBalance: number
    totalBalance: number
    pendingPayouts: number
  }>

  /**
   * Get platform revenue summary
   */
  async getPlatformRevenueSummary(
    startDate: Date,
    endDate: Date
  ): Promise<{
    totalRevenue: number
    ticketSaleRevenue: number
    platformFeeRevenue: number
    subscriptionRevenue: number
    refunds: number
    netRevenue: number
  }>

  /**
   * Create adjustment entry (for corrections)
   */
  async createAdjustment(
    organizerId: string,
    amount: number,
    reason: string,
    createdBy: string
  ): Promise<RevenueTransaction>

  /**
   * Reconcile revenue for a specific date
   */
  async reconcileRevenueForDate(date: Date): Promise<ReconciliationReport>

  /**
   * Mark revenue as paid out (when payout completes)
   */
  async markRevenuePaidOut(
    revenueTransactionIds: string[],
    payoutId: string
  ): Promise<void>
}
```

### Database Schema

**Table:** `revenue_transactions`

```sql
CREATE TYPE revenue_type AS ENUM (
  'TICKET_SALE', 'PLATFORM_FEE', 'SUBSCRIPTION',
  'REFUND', 'CHARGEBACK', 'PROCESSING_FEE', 'ADJUSTMENT'
);

CREATE TYPE revenue_status AS ENUM (
  'PENDING', 'CLEARED', 'HELD', 'PAID_OUT', 'DISPUTED', 'REVERSED'
);

CREATE TABLE revenue_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_date TIMESTAMP NOT NULL DEFAULT NOW(),
  revenue_type revenue_type NOT NULL,
  status revenue_status NOT NULL DEFAULT 'PENDING',

  -- Amounts (all in cents)
  gross_amount DECIMAL(12,2) NOT NULL,
  platform_revenue DECIMAL(12,2) NOT NULL DEFAULT 0,
  organizer_revenue DECIMAL(12,2) NOT NULL DEFAULT 0,
  processing_fee DECIMAL(12,2) NOT NULL DEFAULT 0,
  tax_amount DECIMAL(12,2) NOT NULL DEFAULT 0,

  -- References
  order_id UUID REFERENCES orders(id),
  event_id UUID REFERENCES events(id),
  organizer_id UUID REFERENCES users(id),
  subscription_id UUID REFERENCES subscriptions(id),
  transaction_fee_id UUID REFERENCES transaction_fees(id),

  -- Escrow tracking
  escrow_release_date DATE,
  held_until_date DATE,

  -- Accounting
  ledger_entry_id UUID REFERENCES ledger_entries(id),
  reconciled_at TIMESTAMP,
  fiscal_period VARCHAR(20) NOT NULL, -- "2025-Q1"

  -- Metadata
  description TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',

  -- Audit trail (SOX compliance)
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT valid_amounts CHECK (
    gross_amount >= 0 AND
    platform_revenue >= 0 AND
    organizer_revenue >= 0 AND
    processing_fee >= 0 AND
    tax_amount >= 0
  ),
  CONSTRAINT revenue_split_balance CHECK (
    gross_amount = platform_revenue + organizer_revenue + processing_fee + tax_amount
  )
);

CREATE INDEX idx_revenue_transactions_date ON revenue_transactions(transaction_date);
CREATE INDEX idx_revenue_transactions_organizer ON revenue_transactions(organizer_id);
CREATE INDEX idx_revenue_transactions_event ON revenue_transactions(event_id);
CREATE INDEX idx_revenue_transactions_status ON revenue_transactions(status);
CREATE INDEX idx_revenue_transactions_type ON revenue_transactions(revenue_type);
CREATE INDEX idx_revenue_transactions_fiscal ON revenue_transactions(fiscal_period);
CREATE INDEX idx_revenue_transactions_reconciled ON revenue_transactions(reconciled_at);
```

**Table:** `organizer_balances` (Aggregated view for performance)

```sql
CREATE TABLE organizer_balances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organizer_id UUID UNIQUE NOT NULL REFERENCES users(id),

  -- Balance breakdown
  available_balance DECIMAL(12,2) NOT NULL DEFAULT 0, -- Can be paid out
  held_balance DECIMAL(12,2) NOT NULL DEFAULT 0, -- In escrow
  pending_balance DECIMAL(12,2) NOT NULL DEFAULT 0, -- Processing
  total_balance DECIMAL(12,2) NOT NULL DEFAULT 0, -- Sum of above

  -- Payout tracking
  pending_payout_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  lifetime_earnings DECIMAL(12,2) NOT NULL DEFAULT 0,
  lifetime_payouts DECIMAL(12,2) NOT NULL DEFAULT 0,

  -- Reconciliation
  last_reconciled_at TIMESTAMP,

  -- Metadata
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

  CONSTRAINT positive_balances CHECK (
    available_balance >= 0 AND
    held_balance >= 0 AND
    pending_balance >= 0 AND
    total_balance >= 0
  ),
  CONSTRAINT balance_sum CHECK (
    total_balance = available_balance + held_balance + pending_balance
  )
);

CREATE INDEX idx_organizer_balances_organizer ON organizer_balances(organizer_id);
CREATE INDEX idx_organizer_balances_available ON organizer_balances(available_balance);
```

**Table:** `reconciliation_reports`

```sql
CREATE TABLE reconciliation_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_date DATE UNIQUE NOT NULL,

  -- Revenue summary
  total_gross_revenue DECIMAL(12,2) NOT NULL,
  total_platform_revenue DECIMAL(12,2) NOT NULL,
  total_organizer_revenue DECIMAL(12,2) NOT NULL,
  total_processing_fees DECIMAL(12,2) NOT NULL,
  total_tax_collected DECIMAL(12,2) NOT NULL,

  -- Transaction counts
  transaction_count INTEGER NOT NULL,
  refund_count INTEGER NOT NULL,
  adjustment_count INTEGER NOT NULL,

  -- Reconciliation status
  status VARCHAR(50) NOT NULL, -- pending, complete, discrepancy
  discrepancy_amount DECIMAL(12,2) DEFAULT 0,
  discrepancy_count INTEGER DEFAULT 0,

  -- Metadata
  generated_by UUID REFERENCES users(id),
  generated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMP,

  notes TEXT
);

CREATE INDEX idx_reconciliation_reports_date ON reconciliation_reports(report_date);
CREATE INDEX idx_reconciliation_reports_status ON reconciliation_reports(status);
```

**Table:** `revenue_ledger` (Double-Entry Bookkeeping)

```sql
CREATE TABLE revenue_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_date DATE NOT NULL,
  entry_number VARCHAR(50) UNIQUE NOT NULL, -- REV-2025-001234

  -- Transaction reference
  revenue_transaction_id UUID REFERENCES revenue_transactions(id),

  -- Double-entry accounts
  debit_account VARCHAR(100) NOT NULL,
  credit_account VARCHAR(100) NOT NULL,
  amount DECIMAL(12,2) NOT NULL,

  -- Chart of accounts
  -- Assets:
  --   - Cash - Square
  --   - Cash - Stripe
  --   - Accounts Receivable - Organizers (escrow)
  -- Revenue:
  --   - Revenue - Platform Fees
  --   - Revenue - Subscriptions
  -- Liabilities:
  --   - Payable to Organizers
  -- Expenses:
  --   - Payment Processing Fees

  -- Metadata
  description TEXT,
  fiscal_year INTEGER NOT NULL,
  fiscal_quarter INTEGER NOT NULL,
  fiscal_month INTEGER NOT NULL,

  -- Audit
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),

  CONSTRAINT valid_accounts CHECK (debit_account != credit_account),
  CONSTRAINT positive_amount CHECK (amount > 0)
);

CREATE INDEX idx_revenue_ledger_date ON revenue_ledger(entry_date);
CREATE INDEX idx_revenue_ledger_transaction ON revenue_ledger(revenue_transaction_id);
CREATE INDEX idx_revenue_ledger_fiscal ON revenue_ledger(fiscal_year, fiscal_quarter);
CREATE INDEX idx_revenue_ledger_accounts ON revenue_ledger(debit_account, credit_account);
```

### Revenue Distribution Logic

**Ticket Sale Example:**
```typescript
// Ticket price: $100
// Platform fee: $3.40 (BILL-001)
// Processing fee: $2.90 (Square)
// Tax: $8.00

const revenueTransaction = {
  grossAmount: 100.00,
  platformRevenue: 3.40, // Platform fee
  organizerRevenue: 93.70, // What organizer gets
  processingFee: 2.90, // Square takes this
  taxAmount: 8.00 // Collected on behalf of government
}

// Ledger entries (double-entry):
// 1. Record cash receipt
//    DR: Cash - Square: $111.90 (gross + tax)
//    CR: Accounts Receivable - Organizers: $93.70
//    CR: Revenue - Platform Fees: $3.40
//    CR: Payment Processing Fees: $2.90
//    CR: Sales Tax Payable: $8.00

// 2. Move organizer revenue to escrow (held for 7 days)
//    DR: Accounts Receivable - Organizers: $93.70
//    CR: Payable to Organizers - Escrow: $93.70

// 3. After 7 days, release from escrow to available balance
//    DR: Payable to Organizers - Escrow: $93.70
//    CR: Payable to Organizers - Available: $93.70
```

### API Endpoints

**GET /api/revenue/organizer/:organizerId/balance**
```typescript
// Get organizer's current balance
Response: {
  organizerId: string
  availableBalance: number // Can be paid out now
  heldBalance: number // In escrow
  pendingBalance: number // Processing
  totalBalance: number
  pendingPayouts: number
  lifetimeEarnings: number
  lifetimePayouts: number
  nextEscrowReleaseDate: string
  nextEscrowReleaseAmount: number
}
```

**GET /api/revenue/organizer/:organizerId/transactions**
```typescript
// Get organizer's revenue transaction history
Query: {
  startDate: string
  endDate: string
  type?: RevenueType
  status?: RevenueStatus
  page: number
  limit: number
}

Response: {
  transactions: RevenueTransaction[]
  total: number
  page: number
  totalPages: number
}
```

**GET /api/revenue/platform/summary**
```typescript
// Get platform revenue summary (admin only)
Query: {
  startDate: string
  endDate: string
  groupBy?: 'day' | 'week' | 'month'
}

Response: {
  totalRevenue: number
  revenueBreakdown: {
    ticketSales: number
    platformFees: number
    subscriptions: number
  }
  refunds: number
  netRevenue: number
  transactionCount: number
  topOrganizers: Array<{
    organizerId: string
    name: string
    revenue: number
  }>
  chartData: Array<{
    date: string
    revenue: number
  }>
}
```

**POST /api/revenue/reconcile/:date**
```typescript
// Trigger reconciliation for a specific date (admin only)
Response: {
  report: ReconciliationReport
  discrepancies: Array<{
    transactionId: string
    expectedAmount: number
    actualAmount: number
    difference: number
  }>
}
```

**POST /api/revenue/adjustment**
```typescript
// Create manual adjustment (admin only)
Request: {
  organizerId: string
  amount: number // Positive = credit, negative = debit
  reason: string
  notes?: string
}

Response: {
  transaction: RevenueTransaction
  newBalance: number
}
```

## Integration Points

### 1. Transaction Billing (BILL-001)
- Create revenue transaction for each platform fee
- Split revenue between platform and organizer
- Track in double-entry ledger

### 2. Subscription Billing (BILL-002)
- Record subscription revenue as platform revenue
- No organizer split for subscription revenue
- Track separately in revenue reports

### 3. Payment Processing (PAY-005)
- Extract payment processing fees from gateway
- Record in revenue transactions
- Subtract from organizer revenue

### 4. Payout Management (BILL-004)
- Query available balance for payout requests
- Mark revenue as paid out when payout completes
- Update organizer balance accordingly

### 5. Tax System (PAY-008)
- Record tax collected separately
- Generate tax remittance reports
- Track tax liabilities

### 6. Accounting Systems
- Export transactions to QuickBooks/Xero
- Generate standard financial reports (P&L, Balance Sheet)
- Maintain GAAP compliance

## Business Rules

### Escrow Policy (Rolling Reserve)
- **Duration:** 7 days from transaction date
- **Purpose:** Fraud protection, chargeback reserve
- **Release:** Automatic after 7 days (if no disputes)
- **Exceptions:** High-risk events may have longer hold (30 days)

### Revenue Recognition
- **Ticket sales:** Recognize at time of purchase (not event date)
- **Subscriptions:** Recognize monthly (accrual basis)
- **Refunds:** Reverse revenue in period of refund
- **Platform fees:** Recognize at time of ticket sale

### Reconciliation Schedule
- **Daily:** Automated reconciliation at 11:59 PM UTC
- **Weekly:** Manual review by finance team
- **Monthly:** Generate financial statements
- **Quarterly:** External audit review

### Adjustment Policy
- **Who:** Only finance admins can create adjustments
- **Documentation:** Reason required for all adjustments
- **Approval:** Adjustments > $100 require dual approval
- **Audit:** All adjustments logged in audit trail

## Financial Reports

### Daily Reconciliation Report
- Total transactions processed
- Total revenue by type
- Discrepancies found
- Outstanding escrow balance
- Payment gateway settlements

### Monthly Financial Statements

**Income Statement (P&L):**
```
Revenue:
  - Platform Fee Revenue: $X
  - Subscription Revenue: $Y
  - Total Revenue: $X + $Y

Cost of Goods Sold:
  - Payment Processing Fees: $Z

Gross Profit: Revenue - COGS

Operating Expenses:
  - (tracked separately)

Net Income: Gross Profit - Operating Expenses
```

**Balance Sheet:**
```
Assets:
  - Cash - Square: $X
  - Cash - Stripe: $Y
  - Accounts Receivable: $Z
  - Total Assets: $X + $Y + $Z

Liabilities:
  - Payable to Organizers - Escrow: $A
  - Payable to Organizers - Available: $B
  - Sales Tax Payable: $C
  - Total Liabilities: $A + $B + $C

Equity:
  - Retained Earnings: Assets - Liabilities
```

## Testing Requirements

### Unit Tests
- Revenue split calculation accuracy
- Escrow release date calculation
- Balance update logic
- Refund revenue reversal
- Adjustment entry creation

### Integration Tests
- End-to-end ticket sale revenue flow
- Subscription revenue recording
- Daily reconciliation process
- Payout marking and balance update
- Financial report generation

### Compliance Tests
- Double-entry bookkeeping validation (debits = credits)
- Audit trail completeness
- Revenue recognition timing
- Reconciliation accuracy
- Financial statement accuracy

## Performance Requirements

- Balance calculation: < 100ms (cached, updated on transaction)
- Revenue transaction creation: < 200ms
- Daily reconciliation: < 10 minutes for 50,000 transactions
- Financial report generation: < 30 seconds
- Dashboard queries: < 2 seconds (with caching)

## Security & Compliance

### SOX Compliance
- Immutable revenue transactions (no updates/deletes)
- Audit trail with user, timestamp, action
- Separation of duties: Recording vs reconciliation vs approval
- Regular automated backups
- Access controls on financial data

### GAAP Compliance
- Accrual basis accounting
- Proper revenue recognition timing
- Double-entry bookkeeping
- Periodic financial statements
- External audit support

### Data Retention
- 7 years minimum for all financial records
- Automatic archival of old data
- Backup and disaster recovery plan

## Monitoring & Alerts

### Real-Time Alerts
- Revenue transaction creation failure
- Ledger entry imbalance (debits != credits)
- Reconciliation discrepancy > $10
- Balance calculation error

### Daily Reports
- Revenue summary by type
- Top organizers by revenue
- Escrow releases processed
- Pending reconciliation items

### Monthly Metrics
- Monthly Recurring Revenue (MRR)
- Total Payment Volume (TPV)
- Take rate (platform revenue / gross revenue)
- Organizer retention rate

## Documentation Requirements

- [ ] Revenue distribution flow diagram
- [ ] Chart of accounts documentation
- [ ] Double-entry bookkeeping examples
- [ ] Reconciliation process guide
- [ ] Financial reporting guide
- [ ] Adjustment policy and procedures

## Dependencies

- BILL-001: Flat-Fee Transaction Billing (must complete first)
- BILL-002: White-Label Subscription Billing (parallel)
- PAY-005: Order and Receipt Management (must complete first)
- PAY-008: Tax Calculation System (parallel)
- BILL-004: Organizer Payout Management (depends on this)

## Definition of Done

- [ ] Revenue distribution service implemented
- [ ] All database tables created with indexes
- [ ] Double-entry ledger system operational
- [ ] Organizer balance tracking working
- [ ] Daily reconciliation automated
- [ ] Financial reports generating correctly
- [ ] API endpoints deployed and documented
- [ ] Integration with payment processing complete
- [ ] All tests passing (unit, integration, compliance)
- [ ] Security audit completed
- [ ] Performance benchmarks met
- [ ] Monitoring and alerts configured
- [ ] Documentation published
- [ ] External audit review passed

## Notes

**Immutability:** Revenue transactions are immutable once created. Corrections are made via adjustment entries, never by modifying original records.

**Escrow Release:** Implement automated job to release escrow funds daily at 12:00 AM UTC.

**Dispute Handling:** When a transaction is disputed, mark status as DISPUTED and prevent payout until resolved.

**Currency:** All amounts stored in cents (integers) to avoid floating-point precision issues. Display as dollars with proper formatting.

**Audit Trail:** Every change to revenue or balances must be logged with user ID, timestamp, and reason.