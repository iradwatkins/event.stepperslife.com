# BILL-001: Flat-Fee Transaction Billing

**Epic:** EPIC-019 - Platform Billing & Revenue
**Story Points:** 5
**Priority:** P0 (Critical)
**Status:** Ready for Development

## User Story

**As a** platform operator
**I want** to automatically collect a flat-fee on every ticket transaction
**So that** the platform generates revenue while providing value to event organizers

## Acceptance Criteria

### Primary Criteria
- [ ] Platform automatically calculates and collects $0.50 + 2.9% per ticket sold
- [ ] Fee is transparently shown to buyer during checkout
- [ ] Organizer receives net revenue (gross - platform fee - payment processing fee)
- [ ] All fee calculations are stored in immutable audit trail
- [ ] Real-time revenue split tracking per transaction
- [ ] Daily reconciliation reports generated automatically
- [ ] Financial data exportable to accounting systems

### Financial Compliance Criteria
- [ ] SOX compliance: Complete audit trail with timestamp, user, amount
- [ ] GAAP compliance: Double-entry bookkeeping for all transactions
- [ ] PCI DSS: No storage of card data, only transaction references
- [ ] Tax compliance: Fee revenue tracked separately from merchant revenue
- [ ] Financial audit trail maintained for 7 years minimum

### Edge Cases
- [ ] Handle refunds: Platform fee refunded proportionally
- [ ] Handle partial refunds: Recalculate fee based on remaining amount
- [ ] Handle chargebacks: Record platform fee loss in accounting
- [ ] Handle failed transactions: No fee collected on failed payments
- [ ] Handle discounts: Fee calculated on actual amount paid, not original price
- [ ] Handle comp tickets: $0 fee on complimentary tickets
- [ ] Handle multi-ticket purchases: Fee calculated per ticket individually

## Technical Specifications

### Fee Calculation Service

**File:** `lib/services/billing.service.ts`

```typescript
interface TransactionFee {
  transactionId: string
  ticketId: string
  orderId: string
  grossAmount: number // Ticket price
  platformFeeFlat: number // $0.50
  platformFeePercent: number // 2.9%
  platformFeeTotal: number // Calculated
  paymentProcessingFee: number // Square/Stripe fee
  netToOrganizer: number // What organizer receives
  calculatedAt: Date
  appliedFeeRuleId: string // For fee configuration changes
}

class BillingService {
  /**
   * Calculate platform fee for a single ticket
   * Formula: $0.50 + (ticketPrice * 0.029)
   */
  calculatePlatformFee(ticketPrice: number): TransactionFee

  /**
   * Calculate net revenue to organizer
   * Formula: ticketPrice - platformFee - processingFee
   */
  calculateOrganizerNet(ticketPrice: number, processingFee: number): number

  /**
   * Record fee transaction in ledger (double-entry)
   */
  recordFeeTransaction(transaction: TransactionFee): Promise<void>

  /**
   * Generate daily reconciliation report
   */
  generateDailyReconciliation(date: Date): Promise<ReconciliationReport>

  /**
   * Handle refund fee calculation
   */
  calculateRefundFee(originalFee: TransactionFee, refundAmount: number): TransactionFee
}
```

### Database Schema

**Table:** `transaction_fees`

```sql
CREATE TABLE transaction_fees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL REFERENCES transactions(id),
  ticket_id UUID NOT NULL REFERENCES tickets(id),
  order_id UUID NOT NULL REFERENCES orders(id),
  event_id UUID NOT NULL REFERENCES events(id),
  organizer_id UUID NOT NULL REFERENCES users(id),

  -- Fee breakdown
  gross_amount DECIMAL(10,2) NOT NULL, -- Ticket price
  platform_fee_flat DECIMAL(10,2) NOT NULL DEFAULT 0.50,
  platform_fee_percent DECIMAL(5,4) NOT NULL DEFAULT 0.0290,
  platform_fee_total DECIMAL(10,2) NOT NULL,
  payment_processing_fee DECIMAL(10,2) NOT NULL,
  net_to_organizer DECIMAL(10,2) NOT NULL,

  -- Tax tracking
  tax_amount DECIMAL(10,2),
  tax_rate DECIMAL(5,4),

  -- Audit trail
  calculated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  applied_fee_rule_id UUID REFERENCES fee_rules(id),
  fee_version VARCHAR(50) NOT NULL, -- e.g., "v1.0"

  -- Accounting integration
  ledger_entry_id UUID REFERENCES ledger_entries(id),
  reconciliation_status VARCHAR(50) DEFAULT 'pending',
  reconciled_at TIMESTAMP,

  -- Refund tracking
  is_refund BOOLEAN DEFAULT FALSE,
  original_fee_id UUID REFERENCES transaction_fees(id),
  refund_reason TEXT,

  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

  CONSTRAINT positive_amounts CHECK (
    gross_amount >= 0 AND
    platform_fee_total >= 0 AND
    payment_processing_fee >= 0 AND
    net_to_organizer >= 0
  )
);

CREATE INDEX idx_transaction_fees_transaction ON transaction_fees(transaction_id);
CREATE INDEX idx_transaction_fees_event ON transaction_fees(event_id);
CREATE INDEX idx_transaction_fees_organizer ON transaction_fees(organizer_id);
CREATE INDEX idx_transaction_fees_date ON transaction_fees(calculated_at);
CREATE INDEX idx_transaction_fees_reconciliation ON transaction_fees(reconciliation_status);
```

**Table:** `ledger_entries` (Double-Entry Bookkeeping)

```sql
CREATE TABLE ledger_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_date DATE NOT NULL,
  entry_number VARCHAR(50) UNIQUE NOT NULL, -- Sequential: FEE-2025-001234

  -- Transaction reference
  transaction_fee_id UUID REFERENCES transaction_fees(id),

  -- Double-entry accounting
  debit_account VARCHAR(100) NOT NULL, -- e.g., "Cash - Square"
  credit_account VARCHAR(100) NOT NULL, -- e.g., "Revenue - Platform Fees"
  amount DECIMAL(10,2) NOT NULL,

  -- Metadata
  description TEXT,
  fiscal_year INTEGER NOT NULL,
  fiscal_quarter INTEGER NOT NULL,

  -- Audit
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),

  CONSTRAINT valid_accounts CHECK (debit_account != credit_account),
  CONSTRAINT positive_amount CHECK (amount > 0)
);

CREATE INDEX idx_ledger_entries_date ON ledger_entries(entry_date);
CREATE INDEX idx_ledger_entries_fiscal ON ledger_entries(fiscal_year, fiscal_quarter);
```

### API Endpoints

**POST /api/billing/calculate-fee**
```typescript
// Calculate fee for a transaction (called during checkout)
Request: {
  ticketPrice: number
  quantity: number
  paymentMethod: 'card' | 'ach'
}

Response: {
  subtotal: number
  platformFee: number
  paymentProcessingFee: number
  total: number
  breakdown: {
    perTicket: {
      price: number
      platformFee: number
    }
  }
}
```

**POST /api/billing/record-transaction**
```typescript
// Record fee transaction after successful payment
Request: {
  orderId: string
  tickets: Array<{
    ticketId: string
    price: number
  }>
  paymentProcessingFee: number
}

Response: {
  success: boolean
  transactionFees: TransactionFee[]
  ledgerEntries: string[]
}
```

**GET /api/billing/reconciliation/:date**
```typescript
// Get daily reconciliation report
Response: {
  date: string
  totalTransactions: number
  grossRevenue: number
  platformFees: number
  processingFees: number
  netToOrganizers: number
  discrepancies: Array<{
    transactionId: string
    issue: string
    amount: number
  }>
}
```

## Integration Points

### 1. Order Processing (PAY-005)
- Hook into order completion flow
- Calculate fees before final total
- Display fee breakdown in checkout UI
- Record fees after successful payment

### 2. Payment Gateway Integration
- Extract payment processing fees from Square/Stripe
- Map gateway transaction IDs to internal transaction IDs
- Handle gateway-specific fee structures

### 3. Payout System (BILL-004)
- Calculate available balance for organizer payouts
- Subtract pending fees from payout calculations
- Track fee revenue separately from organizer revenue

### 4. Tax Calculation (PAY-008)
- Calculate tax on gross amount (before fees)
- Track tax separately in fee records
- Generate tax reports for platform revenue

### 5. Accounting System Export
- Export to QuickBooks Online
- Export to Xero
- Export to CSV for manual import
- Generate GAAP-compliant financial statements

## Business Rules

### Fee Structure
1. **Base Fee:** $0.50 per ticket (flat)
2. **Percentage Fee:** 2.9% of ticket price
3. **Total Platform Fee:** $0.50 + (ticket_price * 0.029)
4. **Minimum Fee:** $0.50 (for free tickets, no fee)
5. **Maximum Fee:** None (scales with ticket price)

### Revenue Split Calculation
```
Ticket Price: $100.00
Platform Fee: $0.50 + ($100.00 * 0.029) = $3.40
Processing Fee: $2.90 (example from Square)
Net to Organizer: $100.00 - $3.40 - $2.90 = $93.70
```

### Refund Handling
- Full refund: 100% of platform fee refunded
- Partial refund: Platform fee recalculated proportionally
- Chargeback: Platform fee marked as loss (not recovered)
- Processing fee: Never refunded (absorbed by platform)

### Reconciliation Rules
- Daily reconciliation at 11:59 PM UTC
- Flag discrepancies > $0.01 for manual review
- Auto-reconcile matching transactions
- Generate alerts for missing transactions
- Monthly reconciliation report for accounting

## Testing Requirements

### Unit Tests
- Fee calculation accuracy (various price points)
- Edge cases: $0 tickets, very high prices, decimal precision
- Refund calculation accuracy
- Revenue split calculation

### Integration Tests
- End-to-end transaction with fee recording
- Payment gateway fee extraction
- Ledger entry creation (double-entry)
- Reconciliation report generation

### Financial Compliance Tests
- Audit trail completeness
- Double-entry bookkeeping validation
- Fee calculation consistency over time
- Tax calculation accuracy
- Export format validation (QuickBooks/Xero)

## Performance Requirements

- Fee calculation: < 50ms per transaction
- Ledger entry creation: < 100ms
- Daily reconciliation: < 5 minutes for 10,000 transactions
- Report generation: < 30 seconds for monthly reports
- Database queries: Indexed for sub-second retrieval

## Security & Compliance

### SOX Compliance
- Immutable audit trail (no updates/deletes to transaction_fees)
- User authentication for all financial operations
- Separation of duties: Different users for recording vs reconciliation
- Regular automated backups of financial data

### GAAP Compliance
- Double-entry bookkeeping for all transactions
- Proper revenue recognition (at time of ticket sale)
- Clear account classifications
- Periodic financial statements

### PCI DSS Compliance
- No storage of card numbers
- Store only payment gateway transaction IDs
- Encrypt sensitive financial data at rest
- Audit log access to financial records

## Monitoring & Alerts

### Real-Time Monitoring
- Fee calculation failures (alert immediately)
- Ledger entry creation failures (alert immediately)
- Payment gateway API failures (retry + alert)
- Reconciliation discrepancies > $10 (alert daily)

### Daily Reports
- Total platform revenue
- Number of transactions
- Average fee per transaction
- Failed fee recordings (for manual review)

### Monthly Reports
- Platform revenue trends
- Top revenue-generating events
- Fee structure performance analysis
- Organizer net revenue summaries

## Documentation Requirements

- [ ] API documentation for fee calculation endpoints
- [ ] Accounting integration guide (QuickBooks/Xero)
- [ ] Fee structure explanation for organizers
- [ ] Reconciliation process documentation
- [ ] Audit trail query examples for compliance

## Dependencies

- PAY-005: Order and Receipt Management (must complete first)
- PAY-008: Tax Calculation System (parallel development)
- BILL-003: Revenue Distribution System (depends on this)
- BILL-004: Organizer Payout Management (depends on this)

## Definition of Done

- [ ] Fee calculation service implemented and tested
- [ ] Database schema created with all indexes
- [ ] Double-entry ledger system operational
- [ ] API endpoints deployed and documented
- [ ] Integration with payment processing complete
- [ ] Daily reconciliation automated
- [ ] Accounting export functionality working
- [ ] All tests passing (unit, integration, compliance)
- [ ] Security audit completed
- [ ] Performance benchmarks met
- [ ] Monitoring and alerts configured
- [ ] Documentation published

## Notes

**Financial Audit Trail:** All transaction fees are immutable once recorded. Any corrections must be made via adjustment entries in the ledger, never by modifying original records.

**Fee Configuration:** This story uses hardcoded fee structure ($0.50 + 2.9%). See BILL-005 for dynamic fee configuration.

**Tax Implications:** Platform fees are considered platform revenue and are subject to income tax. Organizer revenue is their responsibility for tax purposes.

**Dispute Resolution:** In case of fee disputes, the immutable audit trail provides definitive proof of calculations. Include dispute resolution process in customer support documentation.