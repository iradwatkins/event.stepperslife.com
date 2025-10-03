# BILL-003b: Transaction Ledger & Audit Trail

**Epic:** EPIC-019 - Platform Billing & Revenue
**Parent Story:** BILL-003 - Revenue Distribution System
**Story Points:** 3
**Priority:** P0 (Critical)
**Status:** Ready for Development

## Parent Story Context

This is **Part 2 of 3** of the Revenue Distribution System story (BILL-003). This sub-story focuses on implementing double-entry bookkeeping and immutable audit trails for all financial transactions to ensure GAAP and SOX compliance.

**Total Parent Story Points:** 8
**This Sub-Story:** 3 points

**Dependencies:**
- BILL-003a: Revenue Split Calculation (Can develop in parallel)

**Sibling Stories:**
- BILL-003c: Reconciliation & Financial Reporting (2 points) - Depends on both

## User Story

**As a** finance team member
**I want** a complete double-entry ledger with immutable audit trails
**So that** all financial transactions are traceable, compliant, and auditable

## Acceptance Criteria

### Primary Criteria
- [ ] Double-entry bookkeeping system implemented
- [ ] Every debit has a corresponding credit (balanced ledger)
- [ ] Immutable ledger entries (no updates/deletes allowed)
- [ ] Complete audit trail with user, timestamp, and reason
- [ ] Chart of accounts defined and implemented
- [ ] Ledger balance validation automated
- [ ] 7-year data retention policy enforced

### Ledger Entry Criteria
- [ ] Automatic ledger entries for all revenue transactions
- [ ] Automatic ledger entries for all payouts
- [ ] Automatic ledger entries for refunds and chargebacks
- [ ] Manual adjustment entries with approval workflow
- [ ] Linked to source revenue transaction
- [ ] Fiscal period tracking (year, quarter, month)

### Audit Trail Criteria
- [ ] User ID captured for all financial actions
- [ ] Timestamp with millisecond precision
- [ ] Reason/description required for all entries
- [ ] IP address logged (optional, for security)
- [ ] Previous values stored for changes
- [ ] Immutable after creation (append-only log)

### Compliance Criteria
- [ ] SOX compliance: Separation of duties enforced
- [ ] GAAP compliance: Proper account classification
- [ ] Audit-ready: Exportable to standard formats
- [ ] Data retention: 7-year minimum
- [ ] Tamper-proof: No modification or deletion allowed

## Technical Specifications

### Database Schema

**Table: `ledger_entries`** (Double-Entry Bookkeeping)

```sql
CREATE TABLE ledger_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_number VARCHAR(50) UNIQUE NOT NULL, -- LED-2025-001234
  entry_date DATE NOT NULL,
  transaction_date TIMESTAMP NOT NULL DEFAULT NOW(),

  -- Transaction reference
  revenue_transaction_id UUID REFERENCES revenue_transactions(id),
  payout_id UUID, -- References BILL-004 payout

  -- Double-entry accounts
  debit_account VARCHAR(100) NOT NULL,
  credit_account VARCHAR(100) NOT NULL,
  amount DECIMAL(12,2) NOT NULL,

  -- Fiscal tracking
  fiscal_year INTEGER NOT NULL,
  fiscal_quarter INTEGER NOT NULL,
  fiscal_month INTEGER NOT NULL,

  -- Description and metadata
  description TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',

  -- Audit trail (SOX compliance)
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  ip_address INET,

  -- Immutability enforcement
  is_reversed BOOLEAN DEFAULT FALSE,
  reversed_by UUID, -- Link to reversal entry
  reversal_reason TEXT,

  -- Constraints
  CONSTRAINT valid_accounts CHECK (debit_account != credit_account),
  CONSTRAINT positive_amount CHECK (amount > 0),
  CONSTRAINT valid_fiscal_quarter CHECK (fiscal_quarter BETWEEN 1 AND 4),
  CONSTRAINT valid_fiscal_month CHECK (fiscal_month BETWEEN 1 AND 12)
);

-- Immutability: Disable UPDATE and DELETE
CREATE RULE ledger_entries_no_update AS
  ON UPDATE TO ledger_entries
  DO INSTEAD NOTHING;

CREATE RULE ledger_entries_no_delete AS
  ON DELETE TO ledger_entries
  DO INSTEAD NOTHING;

CREATE INDEX idx_ledger_entries_date ON ledger_entries(entry_date);
CREATE INDEX idx_ledger_entries_transaction ON ledger_entries(revenue_transaction_id);
CREATE INDEX idx_ledger_entries_fiscal ON ledger_entries(fiscal_year, fiscal_quarter);
CREATE INDEX idx_ledger_entries_accounts ON ledger_entries(debit_account, credit_account);
CREATE INDEX idx_ledger_entries_number ON ledger_entries(entry_number);
CREATE INDEX idx_ledger_entries_created_by ON ledger_entries(created_by);
```

**Table: `chart_of_accounts`**

```sql
CREATE TYPE account_type AS ENUM ('ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE');

CREATE TABLE chart_of_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_code VARCHAR(20) UNIQUE NOT NULL, -- 1000, 2000, 4000, etc.
  account_name VARCHAR(100) UNIQUE NOT NULL,
  account_type account_type NOT NULL,
  parent_account_id UUID REFERENCES chart_of_accounts(id),

  -- Account details
  description TEXT,
  normal_balance VARCHAR(10) NOT NULL, -- DEBIT or CREDIT

  -- Status
  active BOOLEAN NOT NULL DEFAULT TRUE,

  -- Audit
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_chart_of_accounts_code ON chart_of_accounts(account_code);
CREATE INDEX idx_chart_of_accounts_type ON chart_of_accounts(account_type);
CREATE INDEX idx_chart_of_accounts_parent ON chart_of_accounts(parent_account_id);
```

**Table: `audit_log`**

```sql
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name VARCHAR(100) NOT NULL,
  record_id UUID NOT NULL,
  action VARCHAR(50) NOT NULL, -- INSERT, UPDATE, DELETE, APPROVAL, REVERSAL

  -- User context
  user_id UUID REFERENCES users(id),
  ip_address INET,
  user_agent TEXT,

  -- Change tracking
  old_values JSONB,
  new_values JSONB,
  changed_fields TEXT[],

  -- Context
  reason TEXT,
  metadata JSONB DEFAULT '{}',

  -- Timestamp
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),

  -- Immutability
  CONSTRAINT no_future_dates CHECK (created_at <= NOW())
);

-- Immutability: Disable UPDATE and DELETE
CREATE RULE audit_log_no_update AS
  ON UPDATE TO audit_log
  DO INSTEAD NOTHING;

CREATE RULE audit_log_no_delete AS
  ON DELETE TO audit_log
  DO INSTEAD NOTHING;

CREATE INDEX idx_audit_log_table ON audit_log(table_name, record_id);
CREATE INDEX idx_audit_log_user ON audit_log(user_id);
CREATE INDEX idx_audit_log_date ON audit_log(created_at);
CREATE INDEX idx_audit_log_action ON audit_log(action);
```

### Chart of Accounts Structure

```typescript
// Standard Chart of Accounts for Event Platform

// ASSETS (1000-1999)
const ASSETS = {
  CASH_SQUARE: '1100',
  CASH_STRIPE: '1110',
  ACCOUNTS_RECEIVABLE_ORGANIZERS: '1200',
  PREPAID_CREDITS: '1300'
}

// LIABILITIES (2000-2999)
const LIABILITIES = {
  PAYABLE_TO_ORGANIZERS_ESCROW: '2100',
  PAYABLE_TO_ORGANIZERS_AVAILABLE: '2110',
  SALES_TAX_PAYABLE: '2200',
  UNEARNED_REVENUE: '2300' // Prepaid credits not yet used
}

// EQUITY (3000-3999)
const EQUITY = {
  RETAINED_EARNINGS: '3100',
  CURRENT_YEAR_EARNINGS: '3200'
}

// REVENUE (4000-4999)
const REVENUE = {
  PLATFORM_FEE_REVENUE: '4100',
  SUBSCRIPTION_REVENUE: '4200',
  REFUND_CONTRA_REVENUE: '4900' // Negative revenue
}

// EXPENSES (5000-5999)
const EXPENSES = {
  PAYMENT_PROCESSING_FEES: '5100',
  REFUND_PROCESSING_FEES: '5200',
  CHARGEBACK_FEES: '5300'
}
```

### Ledger Service

**File:** `lib/services/ledger.service.ts`

```typescript
import { PrismaClient } from '@prisma/client'
import { Decimal } from '@prisma/client/runtime/library'

const prisma = new PrismaClient()

// Chart of Accounts
const ACCOUNTS = {
  CASH_SQUARE: 'Cash - Square',
  ACCOUNTS_RECEIVABLE: 'Accounts Receivable - Organizers',
  PAYABLE_TO_ORGANIZERS_ESCROW: 'Payable to Organizers - Escrow',
  PAYABLE_TO_ORGANIZERS_AVAILABLE: 'Payable to Organizers - Available',
  PLATFORM_FEE_REVENUE: 'Revenue - Platform Fees',
  SUBSCRIPTION_REVENUE: 'Revenue - Subscriptions',
  PAYMENT_PROCESSING_FEES: 'Payment Processing Fees',
  SALES_TAX_PAYABLE: 'Sales Tax Payable',
  REFUND_CONTRA_REVENUE: 'Refunds - Contra Revenue'
}

export class LedgerService {
  /**
   * Create ledger entry for ticket sale revenue
   */
  async recordTicketSaleRevenue(revenueTransaction: any, userId: string) {
    const entries: any[] = []

    // Entry 1: Record cash receipt from Square
    // DR: Cash - Square (total payment received)
    // CR: Multiple accounts (platform revenue, organizer payable, processing fee, tax)
    const totalReceived = new Decimal(revenueTransaction.grossAmount)
      .plus(revenueTransaction.taxAmount)

    entries.push(
      await this.createLedgerEntry({
        revenueTransactionId: revenueTransaction.id,
        debitAccount: ACCOUNTS.CASH_SQUARE,
        creditAccount: ACCOUNTS.PLATFORM_FEE_REVENUE,
        amount: revenueTransaction.platformRevenue,
        description: `Platform fee revenue from order ${revenueTransaction.orderId}`,
        userId
      })
    )

    // Entry 2: Record organizer payable (escrow)
    // DR: Accounts Receivable
    // CR: Payable to Organizers - Escrow
    entries.push(
      await this.createLedgerEntry({
        revenueTransactionId: revenueTransaction.id,
        debitAccount: ACCOUNTS.ACCOUNTS_RECEIVABLE,
        creditAccount: ACCOUNTS.PAYABLE_TO_ORGANIZERS_ESCROW,
        amount: revenueTransaction.organizerRevenue,
        description: `Organizer revenue escrowed for order ${revenueTransaction.orderId}`,
        userId
      })
    )

    // Entry 3: Record payment processing fees (expense)
    if (new Decimal(revenueTransaction.processingFee).greaterThan(0)) {
      entries.push(
        await this.createLedgerEntry({
          revenueTransactionId: revenueTransaction.id,
          debitAccount: ACCOUNTS.PAYMENT_PROCESSING_FEES,
          creditAccount: ACCOUNTS.CASH_SQUARE,
          amount: revenueTransaction.processingFee,
          description: `Payment processing fees for order ${revenueTransaction.orderId}`,
          userId
        })
      )
    }

    // Entry 4: Record sales tax liability
    if (new Decimal(revenueTransaction.taxAmount).greaterThan(0)) {
      entries.push(
        await this.createLedgerEntry({
          revenueTransactionId: revenueTransaction.id,
          debitAccount: ACCOUNTS.CASH_SQUARE,
          creditAccount: ACCOUNTS.SALES_TAX_PAYABLE,
          amount: revenueTransaction.taxAmount,
          description: `Sales tax collected for order ${revenueTransaction.orderId}`,
          userId
        })
      )
    }

    return entries
  }

  /**
   * Record escrow release (after 7 days)
   */
  async recordEscrowRelease(revenueTransaction: any, userId: string) {
    // Move from escrow to available balance
    // DR: Payable to Organizers - Escrow
    // CR: Payable to Organizers - Available
    return this.createLedgerEntry({
      revenueTransactionId: revenueTransaction.id,
      debitAccount: ACCOUNTS.PAYABLE_TO_ORGANIZERS_ESCROW,
      creditAccount: ACCOUNTS.PAYABLE_TO_ORGANIZERS_AVAILABLE,
      amount: revenueTransaction.organizerRevenue,
      description: `Escrow released for order ${revenueTransaction.orderId}`,
      userId
    })
  }

  /**
   * Record payout to organizer
   */
  async recordPayout(payoutId: string, amount: Decimal, organizerId: string, userId: string) {
    // DR: Payable to Organizers - Available
    // CR: Cash - Square
    return this.createLedgerEntry({
      payoutId,
      debitAccount: ACCOUNTS.PAYABLE_TO_ORGANIZERS_AVAILABLE,
      creditAccount: ACCOUNTS.CASH_SQUARE,
      amount,
      description: `Payout to organizer ${organizerId}`,
      userId,
      metadata: { payoutId, organizerId }
    })
  }

  /**
   * Record refund (reversal of original entries)
   */
  async recordRefund(originalTransaction: any, refundAmount: Decimal, userId: string) {
    const entries: any[] = []

    // Calculate proportional amounts
    const refundPercentage = refundAmount.dividedBy(originalTransaction.grossAmount)

    const platformRefund = new Decimal(originalTransaction.platformRevenue)
      .times(refundPercentage)
    const organizerRefund = new Decimal(originalTransaction.organizerRevenue)
      .times(refundPercentage)

    // Entry 1: Reverse platform revenue
    // DR: Revenue - Platform Fees (contra revenue)
    // CR: Cash - Square
    entries.push(
      await this.createLedgerEntry({
        revenueTransactionId: originalTransaction.id,
        debitAccount: ACCOUNTS.REFUND_CONTRA_REVENUE,
        creditAccount: ACCOUNTS.CASH_SQUARE,
        amount: platformRefund,
        description: `Platform fee refund for order ${originalTransaction.orderId}`,
        userId
      })
    )

    // Entry 2: Reverse organizer payable
    // DR: Payable to Organizers
    // CR: Accounts Receivable
    entries.push(
      await this.createLedgerEntry({
        revenueTransactionId: originalTransaction.id,
        debitAccount: ACCOUNTS.PAYABLE_TO_ORGANIZERS_AVAILABLE,
        creditAccount: ACCOUNTS.ACCOUNTS_RECEIVABLE,
        amount: organizerRefund,
        description: `Organizer revenue refund for order ${originalTransaction.orderId}`,
        userId
      })
    )

    return entries
  }

  /**
   * Create individual ledger entry
   */
  private async createLedgerEntry({
    revenueTransactionId,
    payoutId,
    debitAccount,
    creditAccount,
    amount,
    description,
    userId,
    metadata = {}
  }: {
    revenueTransactionId?: string
    payoutId?: string
    debitAccount: string
    creditAccount: string
    amount: Decimal | number
    description: string
    userId: string
    metadata?: object
  }) {
    const entryDate = new Date()
    const fiscal = this.getFiscalPeriod(entryDate)

    const entry = await prisma.ledgerEntry.create({
      data: {
        entryNumber: await this.generateEntryNumber(),
        entryDate,
        revenueTransactionId,
        payoutId,
        debitAccount,
        creditAccount,
        amount: new Decimal(amount),
        fiscalYear: fiscal.year,
        fiscalQuarter: fiscal.quarter,
        fiscalMonth: fiscal.month,
        description,
        createdBy: userId,
        metadata
      }
    })

    // Log to audit trail
    await this.logAudit({
      tableName: 'ledger_entries',
      recordId: entry.id,
      action: 'INSERT',
      userId,
      newValues: entry,
      reason: description
    })

    return entry
  }

  /**
   * Validate ledger balance (debits = credits)
   */
  async validateLedgerBalance(startDate: Date, endDate: Date): Promise<boolean> {
    const result = await prisma.$queryRaw<[{ debit_total: number; credit_total: number }]>`
      SELECT
        SUM(CASE WHEN debit_account IS NOT NULL THEN amount ELSE 0 END) as debit_total,
        SUM(CASE WHEN credit_account IS NOT NULL THEN amount ELSE 0 END) as credit_total
      FROM ledger_entries
      WHERE entry_date BETWEEN ${startDate} AND ${endDate}
    `

    const debitTotal = new Decimal(result[0].debit_total || 0)
    const creditTotal = new Decimal(result[0].credit_total || 0)

    return debitTotal.equals(creditTotal)
  }

  /**
   * Get account balance
   */
  async getAccountBalance(accountName: string, asOfDate?: Date): Promise<Decimal> {
    const whereClause = asOfDate ? { entryDate: { lte: asOfDate } } : {}

    const debits = await prisma.ledgerEntry.aggregate({
      where: {
        ...whereClause,
        debitAccount: accountName
      },
      _sum: { amount: true }
    })

    const credits = await prisma.ledgerEntry.aggregate({
      where: {
        ...whereClause,
        creditAccount: accountName
      },
      _sum: { amount: true }
    })

    const debitSum = new Decimal(debits._sum.amount || 0)
    const creditSum = new Decimal(credits._sum.amount || 0)

    // For asset/expense accounts, balance = debits - credits
    // For liability/revenue accounts, balance = credits - debits
    return debitSum.minus(creditSum)
  }

  /**
   * Log audit trail entry
   */
  private async logAudit({
    tableName,
    recordId,
    action,
    userId,
    oldValues,
    newValues,
    reason,
    metadata = {}
  }: any) {
    await prisma.auditLog.create({
      data: {
        tableName,
        recordId,
        action,
        userId,
        oldValues: oldValues || null,
        newValues: newValues || null,
        reason,
        metadata
      }
    })
  }

  /**
   * Generate unique entry number
   */
  private async generateEntryNumber(): Promise<string> {
    const year = new Date().getFullYear()
    const count = await prisma.ledgerEntry.count({
      where: {
        entryNumber: { startsWith: `LED-${year}` }
      }
    })
    const number = (count + 1).toString().padStart(6, '0')
    return `LED-${year}-${number}`
  }

  /**
   * Get fiscal period
   */
  private getFiscalPeriod(date: Date) {
    return {
      year: date.getFullYear(),
      quarter: Math.ceil((date.getMonth() + 1) / 3),
      month: date.getMonth() + 1
    }
  }
}

export const ledgerService = new LedgerService()
```

## API Endpoints

**GET /api/ledger/entries**
```typescript
// Get ledger entries with filters
Query: {
  startDate: string
  endDate: string
  account?: string
  transactionId?: string
}

Response: {
  entries: LedgerEntry[]
  totalDebits: number
  totalCredits: number
  balanced: boolean
}
```

**GET /api/ledger/balance/:account**
```typescript
// Get account balance
Query: {
  asOfDate?: string
}

Response: {
  account: string
  balance: number
  asOfDate: string
}
```

**GET /api/audit/log**
```typescript
// Get audit log entries (admin only)
Query: {
  tableName?: string
  recordId?: string
  userId?: string
  startDate?: string
  endDate?: string
}

Response: {
  entries: AuditLogEntry[]
  total: number
}
```

## Testing Requirements

### Unit Tests
- [ ] Ledger entry creation
- [ ] Double-entry balance validation
- [ ] Account balance calculation
- [ ] Fiscal period calculation
- [ ] Entry number generation

### Integration Tests
- [ ] Complete ticket sale ledger flow
- [ ] Escrow release ledger entries
- [ ] Payout ledger entries
- [ ] Refund reversal entries
- [ ] Audit log creation

### Compliance Tests
- [ ] Immutability enforcement (UPDATE/DELETE blocked)
- [ ] All debits have corresponding credits
- [ ] Audit trail completeness
- [ ] 7-year data retention

## Dependencies

- BILL-003a: Revenue Split Calculation (parallel)
- PostgreSQL database with rule support
- Prisma ORM

## Definition of Done

- [ ] Ledger entry system implemented
- [ ] Chart of accounts created
- [ ] Double-entry bookkeeping working
- [ ] Immutability rules enforced
- [ ] Audit log complete
- [ ] Balance validation automated
- [ ] All tests passing
- [ ] Documentation written

## Notes

**Immutability**: Use PostgreSQL RULEs to prevent UPDATE/DELETE on ledger and audit tables.

**SOX Compliance**: All financial changes must be logged with user ID and timestamp.

**Double-Entry**: Every transaction creates at least two ledger entries (debit and credit) that must balance.