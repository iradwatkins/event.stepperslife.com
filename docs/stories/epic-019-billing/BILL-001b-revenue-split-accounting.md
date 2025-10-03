# BILL-001b: Revenue Split & Accounting

**Parent Story:** BILL-001 - Flat-Fee Transaction Billing
**Epic:** EPIC-019 - Platform Billing & Revenue
**Story Points:** 3
**Priority:** P0 (Critical)
**Status:** Ready for Development

## User Story

**As a** platform operator
**I want** automated revenue splitting and double-entry accounting for all transactions
**So that** platform and organizer revenues are accurately tracked and auditable

## Acceptance Criteria

### AC1: Revenue Split Calculation
- [ ] For each completed order, revenue split into:
  - **Platform Revenue:** Platform fees ($0.50 + 2.9% per ticket)
  - **Payment Processing Revenue:** Fees charged by Square/Stripe
  - **Organizer Revenue:** Net amount after deducting fees
- [ ] Split calculation formula:
  ```
  Gross Amount = Ticket Price * Quantity
  Platform Fee = Sum of (per-ticket fees)
  Processing Fee = Square/Stripe fee from webhook
  Organizer Net = Gross - Platform Fee - Processing Fee
  ```
- [ ] All amounts stored with 2 decimal precision
- [ ] Split recorded immediately after payment confirmation
- [ ] Split immutable once recorded (no updates, only adjustments)

### AC2: Double-Entry Ledger System
- [ ] Every transaction creates two ledger entries (debit and credit)
- [ ] **On Ticket Sale:**
  - Debit: Cash/Receivable account (+)
  - Credit: Organizer Payable account (+)
  - Credit: Platform Revenue account (+)
- [ ] **On Refund:**
  - Debit: Organizer Payable account (-)
  - Debit: Platform Revenue account (-)
  - Credit: Cash/Refunds account (-)
- [ ] Ledger entries include:
  - Entry date (transaction date)
  - Sequential entry number (FEE-2025-001234)
  - Account codes (chart of accounts)
  - Amount (positive decimal)
  - Description (human-readable)
  - Reference to transaction_fee record
- [ ] Total debits must equal total credits (balanced books)

### AC3: Transaction Recording
- [ ] Service method: `recordTransaction(order: Order): Promise<TransactionRecord>`
- [ ] Records created in database transaction (atomic)
- [ ] If any step fails, entire transaction rolls back
- [ ] Creates records in tables:
  - `transaction_fees` (per-ticket breakdown)
  - `ledger_entries` (double-entry accounting)
  - `revenue_splits` (summary per order)
- [ ] Records include audit trail:
  - Created timestamp
  - Created by user ID
  - Fee version applied
  - Reconciliation status (pending/reconciled)

### AC4: Financial Audit Trail
- [ ] Every fee transaction immutable (no UPDATE operations)
- [ ] Corrections made via adjustment entries (contra entries)
- [ ] Audit trail includes:
  - Original transaction ID
  - Fee calculation breakdown
  - Applied fee rule version
  - Timestamp with timezone
  - User who initiated transaction
- [ ] 7-year retention policy enforced
- [ ] Audit logs exportable to CSV/JSON

### AC5: Reconciliation with Payment Gateway
- [ ] Daily reconciliation job compares:
  - Internal transaction records
  - Payment gateway settlement reports
  - Bank deposit amounts
- [ ] Flags discrepancies > $0.01:
  - Missing transactions
  - Amount mismatches
  - Duplicate transactions
- [ ] Reconciliation status tracked per transaction:
  - `pending`: Awaiting reconciliation
  - `reconciled`: Matches gateway report
  - `discrepancy`: Requires manual review
  - `adjusted`: Corrected via adjustment entry
- [ ] Automated alerts sent to finance team for discrepancies

### AC6: Chart of Accounts
- [ ] Standardized account codes:
  - **1000**: Cash - Square
  - **1001**: Cash - Stripe
  - **2000**: Organizer Payables
  - **3000**: Platform Fee Revenue
  - **3001**: Payment Processing Revenue
  - **4000**: Refunds Payable
  - **5000**: Discounts & Comps
- [ ] Accounts configurable per environment (dev/staging/prod)
- [ ] Account balances calculated via ledger query (not stored)

## Technical Implementation

### Revenue Split Recording Service

**File:** `/lib/services/revenue-split.service.ts`
```typescript
import { Decimal } from '@prisma/client/runtime/library';
import { prisma } from '@/lib/db';

export interface RevenueSplit {
  orderId: string;
  grossAmount: Decimal;
  platformRevenue: Decimal;
  processingFeeRevenue: Decimal;
  organizerNetRevenue: Decimal;
  ticketFees: TransactionFee[];
  ledgerEntries: LedgerEntry[];
}

export class RevenueSplitService {
  /**
   * Record revenue split and create accounting entries for a completed order
   */
  async recordTransaction(order: Order): Promise<RevenueSplit> {
    // Validate order is completed
    if (order.status !== 'COMPLETED') {
      throw new Error('Can only record revenue split for completed orders');
    }

    // Calculate fees for each ticket
    const ticketFees = await this.calculateTicketFees(order);

    // Calculate totals
    const platformRevenue = ticketFees.reduce(
      (sum, fee) => sum.plus(fee.platformFeeTotal),
      new Decimal(0)
    );

    const processingFee = new Decimal(order.paymentProcessingFee || 0);
    const organizerNet = new Decimal(order.totalAmount)
      .minus(platformRevenue)
      .minus(processingFee);

    // Create transaction in database (atomic)
    return await prisma.$transaction(async (tx) => {
      // 1. Create transaction_fees records
      const feeRecords = await this.createFeeRecords(tx, ticketFees);

      // 2. Create double-entry ledger entries
      const ledgerEntries = await this.createLedgerEntries(tx, {
        orderId: order.id,
        grossAmount: new Decimal(order.totalAmount),
        platformRevenue,
        processingFee,
        organizerNet,
        organizerId: order.organizerId,
        paymentMethod: order.paymentMethod,
      });

      // 3. Create revenue_splits summary record
      const revenueSplit = await tx.revenueSplit.create({
        data: {
          orderId: order.id,
          grossAmount: order.totalAmount,
          platformRevenue,
          processingFeeRevenue: processingFee,
          organizerNetRevenue: organizerNet,
          recordedAt: new Date(),
          reconciliationStatus: 'pending',
        },
      });

      return {
        orderId: order.id,
        grossAmount: new Decimal(order.totalAmount),
        platformRevenue,
        processingFeeRevenue: processingFee,
        organizerNetRevenue: organizerNet,
        ticketFees: feeRecords,
        ledgerEntries,
      };
    });
  }

  /**
   * Create double-entry ledger entries for revenue split
   */
  private async createLedgerEntries(
    tx: any,
    split: {
      orderId: string;
      grossAmount: Decimal;
      platformRevenue: Decimal;
      processingFee: Decimal;
      organizerNet: Decimal;
      organizerId: string;
      paymentMethod: string;
    }
  ): Promise<LedgerEntry[]> {
    const entryNumber = await this.generateEntryNumber();
    const entryDate = new Date();
    const fiscalYear = entryDate.getFullYear();
    const fiscalQuarter = Math.ceil((entryDate.getMonth() + 1) / 3);

    // Determine cash account based on payment method
    const cashAccount = split.paymentMethod === 'SQUARE' ? '1000' : '1001';

    const entries = [];

    // Entry 1: Debit Cash (payment received)
    entries.push(
      await tx.ledgerEntry.create({
        data: {
          entryDate,
          entryNumber: `${entryNumber}-1`,
          orderId: split.orderId,
          debitAccount: cashAccount,
          creditAccount: '2000', // Organizer Payables
          amount: split.grossAmount,
          description: `Ticket sales revenue - Order ${split.orderId}`,
          fiscalYear,
          fiscalQuarter,
        },
      })
    );

    // Entry 2: Credit Platform Revenue
    entries.push(
      await tx.ledgerEntry.create({
        data: {
          entryDate,
          entryNumber: `${entryNumber}-2`,
          orderId: split.orderId,
          debitAccount: '2000', // Organizer Payables
          creditAccount: '3000', // Platform Fee Revenue
          amount: split.platformRevenue,
          description: `Platform fees - Order ${split.orderId}`,
          fiscalYear,
          fiscalQuarter,
        },
      })
    );

    // Entry 3: Credit Payment Processing Revenue
    if (split.processingFee.greaterThan(0)) {
      entries.push(
        await tx.ledgerEntry.create({
          data: {
            entryDate,
            entryNumber: `${entryNumber}-3`,
            orderId: split.orderId,
            debitAccount: '2000', // Organizer Payables
            creditAccount: '3001', // Processing Fee Revenue
            amount: split.processingFee,
            description: `Payment processing fees - Order ${split.orderId}`,
            fiscalYear,
            fiscalQuarter,
          },
        })
      );
    }

    // Remaining balance stays in Organizer Payables until payout

    return entries;
  }

  /**
   * Generate sequential ledger entry number
   */
  private async generateEntryNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `FEE-${year}`;

    // Get last entry number for the year
    const lastEntry = await prisma.ledgerEntry.findFirst({
      where: {
        entryNumber: { startsWith: prefix },
      },
      orderBy: { entryNumber: 'desc' },
    });

    if (!lastEntry) {
      return `${prefix}-000001`;
    }

    // Extract sequence number and increment
    const lastSequence = parseInt(lastEntry.entryNumber.split('-')[2]);
    const nextSequence = lastSequence + 1;

    return `${prefix}-${nextSequence.toString().padStart(6, '0')}`;
  }

  /**
   * Create fee records for each ticket in order
   */
  private async createFeeRecords(tx: any, fees: TransactionFee[]): Promise<TransactionFee[]> {
    return await Promise.all(
      fees.map((fee) =>
        tx.transactionFee.create({
          data: {
            transactionId: fee.transactionId,
            ticketId: fee.ticketId,
            orderId: fee.orderId,
            eventId: fee.eventId,
            organizerId: fee.organizerId,
            grossAmount: fee.grossAmount,
            platformFeeFlat: fee.platformFeeFlat,
            platformFeePercent: fee.platformFeePercent,
            platformFeeTotal: fee.platformFeeTotal,
            paymentProcessingFee: fee.paymentProcessingFee,
            netToOrganizer: fee.netToOrganizer,
            calculatedAt: fee.calculatedAt,
            appliedFeeRuleId: fee.appliedFeeRuleId,
            feeVersion: 'v1.0',
            reconciliationStatus: 'pending',
          },
        })
      )
    );
  }

  /**
   * Handle refund revenue split (contra entries)
   */
  async recordRefund(refund: Refund): Promise<void> {
    await prisma.$transaction(async (tx) => {
      // Create contra ledger entries (reverse the original transaction)
      const entryNumber = await this.generateEntryNumber();

      // Reverse: Debit Organizer Payables, Credit Cash
      await tx.ledgerEntry.create({
        data: {
          entryDate: new Date(),
          entryNumber: `${entryNumber}-REFUND`,
          orderId: refund.orderId,
          debitAccount: '2000', // Organizer Payables
          creditAccount: '4000', // Refunds
          amount: refund.amount,
          description: `Refund issued - Order ${refund.orderId}`,
          fiscalYear: new Date().getFullYear(),
          fiscalQuarter: Math.ceil((new Date().getMonth() + 1) / 3),
        },
      });

      // Create contra transaction_fee records
      await tx.transactionFee.create({
        data: {
          // ... refund fee data
          isRefund: true,
          originalFeeId: refund.originalFeeId,
          refundReason: refund.reason,
        },
      });
    });
  }
}

export const revenueSplitService = new RevenueSplitService();
```

### Reconciliation Service

**File:** `/lib/services/reconciliation.service.ts`
```typescript
export class ReconciliationService {
  /**
   * Daily reconciliation job
   */
  async reconcileDaily(date: Date): Promise<ReconciliationReport> {
    // 1. Fetch internal transaction records
    const internalRecords = await this.getInternalTransactions(date);

    // 2. Fetch payment gateway settlement report
    const gatewayRecords = await this.getGatewaySettlements(date);

    // 3. Match records
    const matches = this.matchRecords(internalRecords, gatewayRecords);

    // 4. Identify discrepancies
    const discrepancies = this.findDiscrepancies(matches);

    // 5. Update reconciliation status
    await this.updateReconciliationStatus(matches);

    // 6. Send alerts for discrepancies
    if (discrepancies.length > 0) {
      await this.alertFinanceTeam(discrepancies);
    }

    return {
      date,
      totalRecords: internalRecords.length,
      reconciledCount: matches.reconciled.length,
      discrepancyCount: discrepancies.length,
      totalAmount: internalRecords.reduce((sum, r) => sum + r.amount, 0),
    };
  }

  private async getGatewaySettlements(date: Date): Promise<any[]> {
    // Fetch from Square API
    const squareSettlements = await squareClient.listSettlements({
      beginTime: startOfDay(date).toISOString(),
      endTime: endOfDay(date).toISOString(),
    });

    return squareSettlements;
  }
}
```

### Database Schema (Additions)

```sql
-- Revenue splits summary table
CREATE TABLE revenue_splits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL UNIQUE REFERENCES orders(id),
  gross_amount DECIMAL(10,2) NOT NULL,
  platform_revenue DECIMAL(10,2) NOT NULL,
  processing_fee_revenue DECIMAL(10,2) NOT NULL,
  organizer_net_revenue DECIMAL(10,2) NOT NULL,
  recorded_at TIMESTAMP NOT NULL DEFAULT NOW(),
  reconciliation_status VARCHAR(50) NOT NULL DEFAULT 'pending',
  reconciled_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_revenue_splits_order ON revenue_splits(order_id);
CREATE INDEX idx_revenue_splits_status ON revenue_splits(reconciliation_status);
CREATE INDEX idx_revenue_splits_date ON revenue_splits(recorded_at);
```

## Testing Requirements

### Unit Tests
```typescript
describe('RevenueSplitService.recordTransaction', () => {
  it('creates revenue split records for completed order', async () => {
    const order = createMockOrder({ totalAmount: 100, status: 'COMPLETED' });

    const split = await revenueSplitService.recordTransaction(order);

    expect(split.platformRevenue.toNumber()).toBe(3.40);
    expect(split.organizerNetRevenue.toNumber()).toBe(93.70); // Assuming $2.90 processing fee
  });

  it('creates balanced ledger entries (debits = credits)', async () => {
    const order = createMockOrder({ totalAmount: 100 });

    const split = await revenueSplitService.recordTransaction(order);

    const debits = split.ledgerEntries
      .filter((e) => e.type === 'debit')
      .reduce((sum, e) => sum + e.amount, 0);

    const credits = split.ledgerEntries
      .filter((e) => e.type === 'credit')
      .reduce((sum, e) => sum + e.amount, 0);

    expect(debits).toBe(credits);
  });

  it('throws error if order not completed', async () => {
    const order = createMockOrder({ status: 'PENDING' });

    await expect(revenueSplitService.recordTransaction(order)).rejects.toThrow(
      'Can only record revenue split for completed orders'
    );
  });
});
```

### Integration Tests
- [ ] Test end-to-end transaction recording with database
- [ ] Test transaction rollback on ledger entry failure
- [ ] Test reconciliation with mocked gateway data
- [ ] Test refund contra entries

## Financial Compliance

### SOX Compliance
- [ ] Immutable audit trail (no deletes)
- [ ] User authentication for all financial operations
- [ ] Separation of duties (different users for recording vs reconciliation)
- [ ] Automated backups every 6 hours

### GAAP Compliance
- [ ] Double-entry bookkeeping enforced
- [ ] Revenue recognized at time of sale (accrual basis)
- [ ] Clear account classifications
- [ ] Monthly financial statements generated

## Performance Requirements

- [ ] Transaction recording: < 500ms per order
- [ ] Daily reconciliation: < 5 minutes for 10,000 transactions
- [ ] Ledger balance query: < 1 second for any date range

## Definition of Done

- [ ] All acceptance criteria met
- [ ] Double-entry ledger system operational
- [ ] Reconciliation service automated
- [ ] Unit tests pass (>85% coverage)
- [ ] Integration tests pass
- [ ] Financial audit completed
- [ ] Code reviewed and approved