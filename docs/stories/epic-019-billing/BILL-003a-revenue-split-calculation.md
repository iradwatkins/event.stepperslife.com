# BILL-003a: Revenue Split Calculation Service

**Epic:** EPIC-019 - Platform Billing & Revenue
**Parent Story:** BILL-003 - Revenue Distribution System
**Story Points:** 3
**Priority:** P0 (Critical)
**Status:** Ready for Development

## Parent Story Context

This is **Part 1 of 3** of the Revenue Distribution System story (BILL-003). This sub-story focuses on implementing the core revenue split calculation engine that automatically divides revenue between platform and organizers for every transaction.

**Total Parent Story Points:** 8
**This Sub-Story:** 3 points

**Sibling Stories:**
- BILL-003b: Transaction Ledger & Audit Trail (3 points) - Parallel development
- BILL-003c: Reconciliation & Financial Reporting (2 points) - Depends on both

## User Story

**As a** platform operator
**I want** automatic revenue split calculation on every transaction
**So that** platform fees and organizer revenue are accurately tracked in real-time

## Acceptance Criteria

### Primary Criteria
- [ ] Revenue split calculated for every ticket sale transaction
- [ ] Platform fee extracted based on BILL-001 fee structure
- [ ] Payment processing fees tracked separately
- [ ] Tax amounts segregated from revenue
- [ ] Net organizer revenue calculated accurately
- [ ] Decimal precision maintained (no rounding errors)
- [ ] Split calculation completes in < 50ms

### Revenue Type Support
- [ ] Ticket sale revenue splitting
- [ ] Platform transaction fee revenue (100% platform)
- [ ] Subscription revenue (100% platform)
- [ ] Refund revenue reversal
- [ ] Chargeback handling
- [ ] Manual adjustment entries

### Calculation Accuracy
- [ ] All calculations use Decimal type (not float)
- [ ] Totals balance to the penny
- [ ] Edge cases handled (refunds, partial payments)
- [ ] Negative amounts supported (chargebacks)
- [ ] Multiple currency support (future)

### Fee Structure Integration
- [ ] Uses fee rates from BILL-001 configuration
- [ ] Supports custom organizer rates
- [ ] Handles promotional rate overrides
- [ ] Volume-based discounts (future)

## Technical Specifications

### Database Schema

**Table: `revenue_transactions`**

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

  -- Amounts (stored as DECIMAL for precision)
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
  transaction_fee_id UUID, -- References BILL-001 fee record

  -- Escrow tracking
  escrow_release_date DATE,
  held_until_date DATE,

  -- Accounting
  ledger_entry_id UUID, -- Link to BILL-003b ledger
  reconciled_at TIMESTAMP,
  fiscal_period VARCHAR(20) NOT NULL, -- "2025-Q1"

  -- Metadata
  description TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',

  -- Audit trail (SOX compliance)
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

  -- Constraints ensure data integrity
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
CREATE INDEX idx_revenue_transactions_order ON revenue_transactions(order_id);
CREATE INDEX idx_revenue_transactions_status ON revenue_transactions(status);
CREATE INDEX idx_revenue_transactions_type ON revenue_transactions(revenue_type);
CREATE INDEX idx_revenue_transactions_fiscal ON revenue_transactions(fiscal_period);
```

**Table: `fee_configurations`** (for custom rates)

```sql
CREATE TABLE fee_configurations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organizer_id UUID REFERENCES users(id),

  -- Fee structure
  fee_type VARCHAR(50) NOT NULL DEFAULT 'FLAT', -- FLAT, PERCENTAGE, HYBRID
  flat_fee_cents INTEGER DEFAULT 0,
  percentage_fee DECIMAL(5,4) DEFAULT 0, -- 0.0340 = 3.40%
  minimum_fee_cents INTEGER DEFAULT 0,

  -- Effective dates
  effective_from DATE NOT NULL,
  effective_until DATE,

  -- Status
  active BOOLEAN NOT NULL DEFAULT TRUE,
  reason TEXT,

  -- Audit
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_fee_configurations_organizer ON fee_configurations(organizer_id);
CREATE INDEX idx_fee_configurations_active ON fee_configurations(active, effective_from);
```

### Revenue Split Calculation Service

**File:** `lib/services/revenue-split.service.ts`

```typescript
import { PrismaClient } from '@prisma/client'
import { Decimal } from '@prisma/client/runtime/library'

const prisma = new PrismaClient()

interface SplitResult {
  grossAmount: Decimal
  platformRevenue: Decimal
  organizerRevenue: Decimal
  processingFee: Decimal
  taxAmount: Decimal
}

export class RevenueSplitService {
  /**
   * Calculate revenue split for ticket sale
   */
  async calculateTicketSaleRevenueSplit(
    orderId: string,
    ticketPrice: number,
    quantity: number,
    processingFee: number,
    taxAmount: number,
    organizerId: string
  ): Promise<SplitResult> {
    const grossAmount = new Decimal(ticketPrice).times(quantity)
    const processingFeeDecimal = new Decimal(processingFee)
    const taxAmountDecimal = new Decimal(taxAmount)

    // Get platform fee for this organizer
    const platformFee = await this.calculatePlatformFee(
      organizerId,
      grossAmount
    )

    // Calculate organizer revenue (gross - platform fee - processing fee - tax)
    const organizerRevenue = grossAmount
      .minus(platformFee)
      .minus(processingFeeDecimal)
      .minus(taxAmountDecimal)

    // Validate balance
    const total = platformFee
      .plus(organizerRevenue)
      .plus(processingFeeDecimal)
      .plus(taxAmountDecimal)

    if (!total.equals(grossAmount)) {
      throw new Error('Revenue split does not balance')
    }

    return {
      grossAmount,
      platformRevenue: platformFee,
      organizerRevenue,
      processingFee: processingFeeDecimal,
      taxAmount: taxAmountDecimal
    }
  }

  /**
   * Calculate platform fee based on organizer's fee structure
   */
  async calculatePlatformFee(
    organizerId: string,
    grossAmount: Decimal
  ): Promise<Decimal> {
    // Get organizer's custom fee configuration (if any)
    const feeConfig = await prisma.feeConfiguration.findFirst({
      where: {
        organizerId,
        active: true,
        effectiveFrom: { lte: new Date() },
        OR: [
          { effectiveUntil: null },
          { effectiveUntil: { gte: new Date() } }
        ]
      },
      orderBy: { effectiveFrom: 'desc' }
    })

    if (feeConfig) {
      return this.applyFeeConfiguration(grossAmount, feeConfig)
    }

    // Use default platform fee from BILL-001
    // Default: $0.29 + 3.4%
    const flatFee = new Decimal(0.29)
    const percentageFee = grossAmount.times(0.034) // 3.4%
    const totalFee = flatFee.plus(percentageFee)

    // Minimum fee: $0.29
    return Decimal.max(totalFee, new Decimal(0.29))
  }

  /**
   * Apply custom fee configuration
   */
  private applyFeeConfiguration(
    grossAmount: Decimal,
    config: any
  ): Decimal {
    let fee = new Decimal(0)

    if (config.feeType === 'FLAT') {
      fee = new Decimal(config.flatFeeCents).dividedBy(100)
    } else if (config.feeType === 'PERCENTAGE') {
      fee = grossAmount.times(config.percentageFee)
    } else if (config.feeType === 'HYBRID') {
      const flatFee = new Decimal(config.flatFeeCents).dividedBy(100)
      const percentageFee = grossAmount.times(config.percentageFee)
      fee = flatFee.plus(percentageFee)
    }

    // Apply minimum fee if configured
    if (config.minimumFeeCents > 0) {
      const minimumFee = new Decimal(config.minimumFeeCents).dividedBy(100)
      fee = Decimal.max(fee, minimumFee)
    }

    return fee
  }

  /**
   * Create revenue transaction record
   */
  async createRevenueTransaction(
    split: SplitResult,
    orderId: string,
    eventId: string,
    organizerId: string,
    description: string
  ) {
    const fiscalPeriod = this.getFiscalPeriod(new Date())

    const transaction = await prisma.revenueTransaction.create({
      data: {
        revenueType: 'TICKET_SALE',
        status: 'PENDING',
        grossAmount: split.grossAmount,
        platformRevenue: split.platformRevenue,
        organizerRevenue: split.organizerRevenue,
        processingFee: split.processingFee,
        taxAmount: split.taxAmount,
        orderId,
        eventId,
        organizerId,
        escrowReleaseDate: this.calculateEscrowReleaseDate(),
        fiscalPeriod,
        description,
        metadata: {
          calculatedAt: new Date().toISOString(),
          version: '1.0'
        }
      }
    })

    return transaction
  }

  /**
   * Process refund (reverse original revenue)
   */
  async processRefund(
    originalTransactionId: string,
    refundAmount: Decimal
  ) {
    const original = await prisma.revenueTransaction.findUnique({
      where: { id: originalTransactionId }
    })

    if (!original) {
      throw new Error('Original transaction not found')
    }

    // Calculate proportional split for partial refund
    const refundPercentage = refundAmount.dividedBy(original.grossAmount)

    const refundTransaction = await prisma.revenueTransaction.create({
      data: {
        revenueType: 'REFUND',
        status: 'CLEARED',
        grossAmount: refundAmount.negated(),
        platformRevenue: new Decimal(original.platformRevenue)
          .times(refundPercentage)
          .negated(),
        organizerRevenue: new Decimal(original.organizerRevenue)
          .times(refundPercentage)
          .negated(),
        processingFee: new Decimal(original.processingFee)
          .times(refundPercentage)
          .negated(),
        taxAmount: new Decimal(original.taxAmount)
          .times(refundPercentage)
          .negated(),
        orderId: original.orderId,
        eventId: original.eventId,
        organizerId: original.organizerId,
        fiscalPeriod: this.getFiscalPeriod(new Date()),
        description: `Refund for order ${original.orderId}`,
        metadata: {
          originalTransactionId,
          refundPercentage: refundPercentage.toFixed(4)
        }
      }
    })

    return refundTransaction
  }

  /**
   * Get fiscal period (YYYY-QX)
   */
  private getFiscalPeriod(date: Date): string {
    const year = date.getFullYear()
    const quarter = Math.ceil((date.getMonth() + 1) / 3)
    return `${year}-Q${quarter}`
  }

  /**
   * Calculate escrow release date (7 days from now)
   */
  private calculateEscrowReleaseDate(): Date {
    const date = new Date()
    date.setDate(date.getDate() + 7)
    return date
  }

  /**
   * Get organizer's current balance
   */
  async getOrganizerBalance(organizerId: string) {
    const result = await prisma.revenueTransaction.groupBy({
      by: ['status'],
      where: {
        organizerId,
        revenueType: { in: ['TICKET_SALE', 'REFUND', 'ADJUSTMENT'] }
      },
      _sum: {
        organizerRevenue: true
      }
    })

    const balances = {
      availableBalance: new Decimal(0),
      heldBalance: new Decimal(0),
      pendingBalance: new Decimal(0),
      totalBalance: new Decimal(0)
    }

    result.forEach(item => {
      const amount = new Decimal(item._sum.organizerRevenue || 0)

      if (item.status === 'CLEARED') {
        balances.availableBalance = balances.availableBalance.plus(amount)
      } else if (item.status === 'HELD') {
        balances.heldBalance = balances.heldBalance.plus(amount)
      } else if (item.status === 'PENDING') {
        balances.pendingBalance = balances.pendingBalance.plus(amount)
      }
    })

    balances.totalBalance = balances.availableBalance
      .plus(balances.heldBalance)
      .plus(balances.pendingBalance)

    return balances
  }

  /**
   * Get platform revenue summary
   */
  async getPlatformRevenueSummary(startDate: Date, endDate: Date) {
    const result = await prisma.revenueTransaction.aggregate({
      where: {
        transactionDate: {
          gte: startDate,
          lte: endDate
        },
        status: { not: 'REVERSED' }
      },
      _sum: {
        grossAmount: true,
        platformRevenue: true,
        organizerRevenue: true,
        processingFee: true,
        taxAmount: true
      }
    })

    return {
      totalRevenue: new Decimal(result._sum.platformRevenue || 0),
      organizerRevenue: new Decimal(result._sum.organizerRevenue || 0),
      processingFees: new Decimal(result._sum.processingFee || 0),
      taxCollected: new Decimal(result._sum.taxAmount || 0),
      grossRevenue: new Decimal(result._sum.grossAmount || 0)
    }
  }
}

export const revenueSplitService = new RevenueSplitService()
```

## API Endpoints

**POST /api/revenue/calculate-split**
```typescript
// Calculate revenue split preview (before creating transaction)
Request: {
  ticketPrice: number
  quantity: number
  processingFee: number
  taxAmount: number
  organizerId: string
}

Response: {
  grossAmount: number
  platformRevenue: number
  organizerRevenue: number
  processingFee: number
  taxAmount: number
  platformFeePercentage: number
}
```

**GET /api/revenue/organizer/:organizerId/balance**
```typescript
// Get organizer's revenue balance
Response: {
  availableBalance: number
  heldBalance: number
  pendingBalance: number
  totalBalance: number
  escrowReleases: Array<{
    date: string
    amount: number
  }>
}
```

**GET /api/revenue/platform/summary**
```typescript
// Get platform revenue summary (admin only)
Query: {
  startDate: string
  endDate: string
}

Response: {
  totalRevenue: number
  organizerRevenue: number
  processingFees: number
  taxCollected: number
  grossRevenue: number
  netRevenue: number
}
```

## Business Rules

### Escrow Policy
- **Duration:** 7 days from transaction date
- **Purpose:** Fraud protection, chargeback reserve
- **Status Flow:** PENDING → HELD (7 days) → CLEARED → PAID_OUT

### Fee Calculation Priority
1. Custom organizer rate (if configured)
2. Promotional rate (if active)
3. Default platform rate ($0.29 + 3.4%)

### Decimal Precision
- All amounts stored as DECIMAL(12,2)
- Calculations use Prisma Decimal library
- No floating-point arithmetic (avoids precision errors)

## Testing Requirements

### Unit Tests
- [ ] Revenue split calculation accuracy
- [ ] Platform fee calculation with default rate
- [ ] Platform fee calculation with custom rate
- [ ] Refund revenue reversal calculation
- [ ] Balance calculation accuracy
- [ ] Decimal precision (no rounding errors)
- [ ] Edge cases (zero amounts, negative amounts)

### Integration Tests
- [ ] Create revenue transaction from order
- [ ] Process refund transaction
- [ ] Calculate organizer balance
- [ ] Generate platform revenue summary
- [ ] Validate database constraints

### Performance Tests
- [ ] Split calculation < 50ms
- [ ] Balance query < 100ms
- [ ] Summary generation < 2 seconds for 50k transactions

## Dependencies

- BILL-001: Platform fee structure defined
- Prisma Decimal library
- PostgreSQL database with CHECK constraints

## Definition of Done

- [ ] Revenue split service implemented
- [ ] Database schema created with constraints
- [ ] Fee configuration system working
- [ ] All calculations use Decimal type
- [ ] Balance calculations accurate
- [ ] API endpoints functional
- [ ] All unit tests passing (100% coverage)
- [ ] Integration tests passing
- [ ] Performance benchmarks met
- [ ] Documentation written

## Notes

**Financial Compliance**: All amounts use DECIMAL type to maintain precision. Never use FLOAT for financial calculations.

**Balance Integrity**: Database CHECK constraint ensures revenue split always balances to gross amount.

**Escrow Flow**: Revenue moves from PENDING → HELD → CLEARED → PAID_OUT as it progresses through lifecycle.