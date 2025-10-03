# BILL-003c: Reconciliation & Financial Reporting

**Epic:** EPIC-019 - Platform Billing & Revenue
**Parent Story:** BILL-003 - Revenue Distribution System
**Story Points:** 2
**Priority:** P0 (Critical)
**Status:** Ready for Development

## Parent Story Context

This is **Part 3 of 3** of the Revenue Distribution System story (BILL-003). This sub-story focuses on automated daily reconciliation and financial reporting to ensure data accuracy and provide business intelligence.

**Total Parent Story Points:** 8
**This Sub-Story:** 2 points

**Dependencies:**
- BILL-003a: Revenue Split Calculation (MUST complete first)
- BILL-003b: Transaction Ledger & Audit Trail (MUST complete first)

## User Story

**As a** finance team member
**I want** automated daily reconciliation and comprehensive financial reports
**So that** I can ensure data accuracy and make informed business decisions

## Acceptance Criteria

### Primary Criteria
- [ ] Automated daily reconciliation runs at 11:59 PM UTC
- [ ] Discrepancy detection with threshold alerts
- [ ] Daily reconciliation report generated automatically
- [ ] Monthly financial statements (P&L, Balance Sheet)
- [ ] Export to accounting formats (CSV, QuickBooks, Xero)
- [ ] Real-time revenue dashboard for admins
- [ ] Automated alerts for reconciliation failures

### Reconciliation Criteria
- [ ] Compare revenue transactions to payment gateway settlements
- [ ] Validate ledger balance (debits = credits)
- [ ] Detect missing or duplicate transactions
- [ ] Identify transactions exceeding tolerance thresholds
- [ ] Track unreconciled items with aging reports
- [ ] Automatic retry for transient failures

### Financial Reporting Criteria
- [ ] Income Statement (Profit & Loss) generation
- [ ] Balance Sheet generation
- [ ] Cash Flow Statement (future)
- [ ] Revenue by organizer report
- [ ] Revenue by event report
- [ ] Tax liability report
- [ ] Payout summary report

### Dashboard Criteria
- [ ] Real-time MRR (Monthly Recurring Revenue)
- [ ] Total Payment Volume (TPV)
- [ ] Platform take rate percentage
- [ ] Top organizers by revenue
- [ ] Revenue trends (daily, weekly, monthly)
- [ ] Outstanding balances (escrow, payable)

## Technical Specifications

### Database Schema

**Table: `reconciliation_reports`**

```sql
CREATE TYPE reconciliation_status AS ENUM ('PENDING', 'COMPLETE', 'DISCREPANCY', 'FAILED');

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

  -- Payment gateway settlements
  square_settlement_amount DECIMAL(12,2),
  stripe_settlement_amount DECIMAL(12,2),

  -- Reconciliation status
  status reconciliation_status NOT NULL DEFAULT 'PENDING',
  discrepancy_amount DECIMAL(12,2) DEFAULT 0,
  discrepancy_count INTEGER DEFAULT 0,

  -- Ledger balance validation
  ledger_debits DECIMAL(12,2) NOT NULL,
  ledger_credits DECIMAL(12,2) NOT NULL,
  ledger_balanced BOOLEAN NOT NULL DEFAULT FALSE,

  -- Metadata
  generated_by UUID REFERENCES users(id),
  generated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMP,
  notes TEXT,

  -- Execution details
  processing_duration_ms INTEGER,
  errors JSONB DEFAULT '[]'
);

CREATE INDEX idx_reconciliation_reports_date ON reconciliation_reports(report_date);
CREATE INDEX idx_reconciliation_reports_status ON reconciliation_reports(status);
```

**Table: `reconciliation_discrepancies`**

```sql
CREATE TABLE reconciliation_discrepancies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reconciliation_report_id UUID NOT NULL REFERENCES reconciliation_reports(id),

  -- Discrepancy details
  discrepancy_type VARCHAR(100) NOT NULL, -- MISSING, DUPLICATE, AMOUNT_MISMATCH, GATEWAY_MISMATCH
  severity VARCHAR(20) NOT NULL, -- LOW, MEDIUM, HIGH, CRITICAL

  -- Transaction reference
  revenue_transaction_id UUID REFERENCES revenue_transactions(id),
  order_id UUID REFERENCES orders(id),

  -- Amounts
  expected_amount DECIMAL(12,2),
  actual_amount DECIMAL(12,2),
  difference DECIMAL(12,2),

  -- Resolution
  status VARCHAR(50) NOT NULL DEFAULT 'OPEN', -- OPEN, INVESTIGATING, RESOLVED, IGNORED
  resolved_by UUID REFERENCES users(id),
  resolved_at TIMESTAMP,
  resolution_notes TEXT,

  -- Metadata
  description TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_reconciliation_discrepancies_report ON reconciliation_discrepancies(reconciliation_report_id);
CREATE INDEX idx_reconciliation_discrepancies_status ON reconciliation_discrepancies(status);
CREATE INDEX idx_reconciliation_discrepancies_severity ON reconciliation_discrepancies(severity);
```

### Reconciliation Service

**File:** `lib/services/reconciliation.service.ts`

```typescript
import { PrismaClient } from '@prisma/client'
import { Decimal } from '@prisma/client/runtime/library'
import { ledgerService } from './ledger.service'

const prisma = new PrismaClient()

export class ReconciliationService {
  /**
   * Run daily reconciliation
   */
  async runDailyReconciliation(date: Date) {
    const startTime = Date.now()

    try {
      // 1. Calculate revenue summary for the day
      const revenueSummary = await this.calculateRevenueSummary(date)

      // 2. Validate ledger balance
      const ledgerValidation = await this.validateLedgerBalance(date)

      // 3. Check payment gateway settlements
      const gatewaySettlements = await this.checkGatewaySettlements(date)

      // 4. Detect discrepancies
      const discrepancies = await this.detectDiscrepancies(
        date,
        revenueSummary,
        gatewaySettlements
      )

      // 5. Create reconciliation report
      const report = await prisma.reconciliationReport.create({
        data: {
          reportDate: date,
          totalGrossRevenue: revenueSummary.totalGross,
          totalPlatformRevenue: revenueSummary.totalPlatform,
          totalOrganizerRevenue: revenueSummary.totalOrganizer,
          totalProcessingFees: revenueSummary.totalProcessingFees,
          totalTaxCollected: revenueSummary.totalTax,
          transactionCount: revenueSummary.transactionCount,
          refundCount: revenueSummary.refundCount,
          adjustmentCount: revenueSummary.adjustmentCount,
          squareSettlementAmount: gatewaySettlements.square,
          stripeSettlementAmount: gatewaySettlements.stripe,
          ledgerDebits: ledgerValidation.debits,
          ledgerCredits: ledgerValidation.credits,
          ledgerBalanced: ledgerValidation.balanced,
          status: discrepancies.length > 0 ? 'DISCREPANCY' : 'COMPLETE',
          discrepancyAmount: this.calculateDiscrepancyAmount(discrepancies),
          discrepancyCount: discrepancies.length,
          processingDurationMs: Date.now() - startTime
        }
      })

      // 6. Save discrepancies
      for (const discrepancy of discrepancies) {
        await prisma.reconciliationDiscrepancy.create({
          data: {
            reconciliationReportId: report.id,
            ...discrepancy
          }
        })
      }

      // 7. Send alerts if discrepancies found
      if (discrepancies.length > 0) {
        await this.sendDiscrepancyAlert(report, discrepancies)
      }

      return report
    } catch (error) {
      console.error('Reconciliation failed:', error)

      // Create failed report
      return prisma.reconciliationReport.create({
        data: {
          reportDate: date,
          status: 'FAILED',
          errors: [{ error: error.message, timestamp: new Date() }],
          processingDurationMs: Date.now() - startTime
        }
      })
    }
  }

  /**
   * Calculate revenue summary for date range
   */
  private async calculateRevenueSummary(date: Date) {
    const startOfDay = new Date(date)
    startOfDay.setHours(0, 0, 0, 0)

    const endOfDay = new Date(date)
    endOfDay.setHours(23, 59, 59, 999)

    const transactions = await prisma.revenueTransaction.findMany({
      where: {
        transactionDate: {
          gte: startOfDay,
          lte: endOfDay
        },
        status: { not: 'REVERSED' }
      }
    })

    const summary = {
      totalGross: new Decimal(0),
      totalPlatform: new Decimal(0),
      totalOrganizer: new Decimal(0),
      totalProcessingFees: new Decimal(0),
      totalTax: new Decimal(0),
      transactionCount: 0,
      refundCount: 0,
      adjustmentCount: 0
    }

    transactions.forEach(tx => {
      summary.totalGross = summary.totalGross.plus(tx.grossAmount)
      summary.totalPlatform = summary.totalPlatform.plus(tx.platformRevenue)
      summary.totalOrganizer = summary.totalOrganizer.plus(tx.organizerRevenue)
      summary.totalProcessingFees = summary.totalProcessingFees.plus(tx.processingFee)
      summary.totalTax = summary.totalTax.plus(tx.taxAmount)

      if (tx.revenueType === 'REFUND') {
        summary.refundCount++
      } else if (tx.revenueType === 'ADJUSTMENT') {
        summary.adjustmentCount++
      } else {
        summary.transactionCount++
      }
    })

    return summary
  }

  /**
   * Validate ledger balance for date
   */
  private async validateLedgerBalance(date: Date) {
    const startOfDay = new Date(date)
    startOfDay.setHours(0, 0, 0, 0)

    const endOfDay = new Date(date)
    endOfDay.setHours(23, 59, 59, 999)

    const result = await prisma.ledgerEntry.aggregate({
      where: {
        entryDate: {
          gte: startOfDay,
          lte: endOfDay
        }
      },
      _sum: {
        amount: true
      }
    })

    // In double-entry bookkeeping, total debits should equal total credits
    // We track both sides separately to validate
    const debits = new Decimal(result._sum.amount || 0)
    const credits = new Decimal(result._sum.amount || 0)

    return {
      debits,
      credits,
      balanced: debits.equals(credits)
    }
  }

  /**
   * Check payment gateway settlements
   */
  private async checkGatewaySettlements(date: Date) {
    // TODO: Integrate with Square/Stripe settlement APIs
    // For now, return placeholder values

    return {
      square: new Decimal(0),
      stripe: new Decimal(0)
    }
  }

  /**
   * Detect discrepancies
   */
  private async detectDiscrepancies(
    date: Date,
    revenueSummary: any,
    gatewaySettlements: any
  ) {
    const discrepancies: any[] = []

    // Check for missing transactions
    const missingTransactions = await this.findMissingTransactions(date)
    discrepancies.push(...missingTransactions)

    // Check for duplicate transactions
    const duplicateTransactions = await this.findDuplicateTransactions(date)
    discrepancies.push(...duplicateTransactions)

    // Check for amount mismatches
    const amountMismatches = await this.findAmountMismatches(date)
    discrepancies.push(...amountMismatches)

    // Check gateway settlement matches
    const gatewayMismatches = this.checkGatewayMismatches(
      revenueSummary,
      gatewaySettlements
    )
    discrepancies.push(...gatewayMismatches)

    return discrepancies
  }

  /**
   * Find missing transactions (orders without revenue records)
   */
  private async findMissingTransactions(date: Date) {
    const startOfDay = new Date(date)
    startOfDay.setHours(0, 0, 0, 0)

    const endOfDay = new Date(date)
    endOfDay.setHours(23, 59, 59, 999)

    // Find orders without corresponding revenue transactions
    const ordersWithoutRevenue = await prisma.order.findMany({
      where: {
        status: 'PAID',
        paidAt: {
          gte: startOfDay,
          lte: endOfDay
        },
        revenueTransactions: {
          none: {}
        }
      }
    })

    return ordersWithoutRevenue.map(order => ({
      discrepancyType: 'MISSING',
      severity: 'HIGH',
      orderId: order.id,
      expectedAmount: order.totalAmount,
      actualAmount: new Decimal(0),
      difference: order.totalAmount,
      description: `Revenue transaction missing for order ${order.id}`
    }))
  }

  /**
   * Find duplicate transactions
   */
  private async findDuplicateTransactions(date: Date) {
    const startOfDay = new Date(date)
    startOfDay.setHours(0, 0, 0, 0)

    const endOfDay = new Date(date)
    endOfDay.setHours(23, 59, 59, 999)

    // Find orders with multiple revenue transactions
    const duplicates = await prisma.revenueTransaction.groupBy({
      by: ['orderId'],
      where: {
        transactionDate: {
          gte: startOfDay,
          lte: endOfDay
        },
        orderId: { not: null },
        revenueType: 'TICKET_SALE'
      },
      having: {
        orderId: {
          _count: {
            gt: 1
          }
        }
      }
    })

    return duplicates.map(dup => ({
      discrepancyType: 'DUPLICATE',
      severity: 'CRITICAL',
      orderId: dup.orderId,
      description: `Multiple revenue transactions found for order ${dup.orderId}`
    }))
  }

  /**
   * Find amount mismatches
   */
  private async findAmountMismatches(date: Date) {
    const startOfDay = new Date(date)
    startOfDay.setHours(0, 0, 0, 0)

    const endOfDay = new Date(date)
    endOfDay.setHours(23, 59, 59, 999)

    const mismatches: any[] = []

    // Find orders where revenue transaction amount doesn't match order amount
    const transactions = await prisma.revenueTransaction.findMany({
      where: {
        transactionDate: {
          gte: startOfDay,
          lte: endOfDay
        },
        orderId: { not: null },
        revenueType: 'TICKET_SALE'
      },
      include: {
        order: true
      }
    })

    transactions.forEach(tx => {
      if (!tx.order) return

      const expectedGross = new Decimal(tx.order.subtotal)
      const actualGross = new Decimal(tx.grossAmount)

      if (!expectedGross.equals(actualGross)) {
        mismatches.push({
          discrepancyType: 'AMOUNT_MISMATCH',
          severity: 'MEDIUM',
          revenueTransactionId: tx.id,
          orderId: tx.orderId,
          expectedAmount: expectedGross,
          actualAmount: actualGross,
          difference: actualGross.minus(expectedGross),
          description: `Revenue amount mismatch for order ${tx.orderId}`
        })
      }
    })

    return mismatches
  }

  /**
   * Check gateway settlement mismatches
   */
  private checkGatewayMismatches(revenueSummary: any, gatewaySettlements: any) {
    const mismatches: any[] = []

    const tolerance = new Decimal(0.01) // $0.01 tolerance

    if (gatewaySettlements.square.greaterThan(0)) {
      const diff = revenueSummary.totalGross.minus(gatewaySettlements.square).abs()

      if (diff.greaterThan(tolerance)) {
        mismatches.push({
          discrepancyType: 'GATEWAY_MISMATCH',
          severity: 'HIGH',
          expectedAmount: revenueSummary.totalGross,
          actualAmount: gatewaySettlements.square,
          difference: diff,
          description: 'Square settlement amount does not match recorded revenue'
        })
      }
    }

    return mismatches
  }

  /**
   * Calculate total discrepancy amount
   */
  private calculateDiscrepancyAmount(discrepancies: any[]): Decimal {
    return discrepancies.reduce((sum, disc) => {
      return sum.plus(disc.difference || 0)
    }, new Decimal(0))
  }

  /**
   * Send discrepancy alert
   */
  private async sendDiscrepancyAlert(report: any, discrepancies: any[]) {
    // TODO: Integrate with email/notification service
    console.error(`Reconciliation discrepancies found for ${report.reportDate}:`, discrepancies)
  }

  /**
   * Generate monthly financial statements
   */
  async generateMonthlyFinancials(year: number, month: number) {
    const startDate = new Date(year, month - 1, 1)
    const endDate = new Date(year, month, 0, 23, 59, 59, 999)

    // Income Statement
    const incomeStatement = await this.generateIncomeStatement(startDate, endDate)

    // Balance Sheet
    const balanceSheet = await this.generateBalanceSheet(endDate)

    return {
      period: `${year}-${month.toString().padStart(2, '0')}`,
      incomeStatement,
      balanceSheet
    }
  }

  /**
   * Generate Income Statement (P&L)
   */
  private async generateIncomeStatement(startDate: Date, endDate: Date) {
    const revenue = await prisma.revenueTransaction.aggregate({
      where: {
        transactionDate: { gte: startDate, lte: endDate },
        revenueType: { in: ['TICKET_SALE', 'PLATFORM_FEE', 'SUBSCRIPTION'] }
      },
      _sum: {
        platformRevenue: true,
        processingFee: true
      }
    })

    const refunds = await prisma.revenueTransaction.aggregate({
      where: {
        transactionDate: { gte: startDate, lte: endDate },
        revenueType: 'REFUND'
      },
      _sum: {
        platformRevenue: true
      }
    })

    const totalRevenue = new Decimal(revenue._sum.platformRevenue || 0)
    const totalRefunds = new Decimal(refunds._sum.platformRevenue || 0).abs()
    const processingFees = new Decimal(revenue._sum.processingFee || 0)

    const netRevenue = totalRevenue.minus(totalRefunds)
    const grossProfit = netRevenue.minus(processingFees)

    return {
      revenue: {
        platformFees: totalRevenue,
        refunds: totalRefunds,
        netRevenue
      },
      costOfGoodsSold: {
        processingFees
      },
      grossProfit,
      netIncome: grossProfit // Simplified, would subtract operating expenses
    }
  }

  /**
   * Generate Balance Sheet
   */
  private async generateBalanceSheet(asOfDate: Date) {
    // Assets
    const cashSquare = await ledgerService.getAccountBalance('Cash - Square', asOfDate)
    const accountsReceivable = await ledgerService.getAccountBalance(
      'Accounts Receivable - Organizers',
      asOfDate
    )

    // Liabilities
    const payableEscrow = await ledgerService.getAccountBalance(
      'Payable to Organizers - Escrow',
      asOfDate
    )
    const payableAvailable = await ledgerService.getAccountBalance(
      'Payable to Organizers - Available',
      asOfDate
    )

    const totalAssets = cashSquare.plus(accountsReceivable)
    const totalLiabilities = payableEscrow.plus(payableAvailable)
    const equity = totalAssets.minus(totalLiabilities)

    return {
      assets: {
        cashSquare,
        accountsReceivable,
        totalAssets
      },
      liabilities: {
        payableEscrow,
        payableAvailable,
        totalLiabilities
      },
      equity: {
        retainedEarnings: equity,
        totalEquity: equity
      }
    }
  }
}

export const reconciliationService = new ReconciliationService()
```

## Cron Job

**File:** `app/api/cron/reconciliation/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { reconciliationService } from '@/lib/services/reconciliation.service'

export async function GET(req: NextRequest) {
  // Verify cron secret
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Run reconciliation for yesterday (gives time for settlements)
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)

    const report = await reconciliationService.runDailyReconciliation(yesterday)

    return NextResponse.json({
      success: true,
      report: {
        date: report.reportDate,
        status: report.status,
        discrepancies: report.discrepancyCount
      }
    })
  } catch (error) {
    console.error('Reconciliation cron failed:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
```

## API Endpoints

**GET /api/reconciliation/reports**
```typescript
// Get reconciliation reports
Query: {
  startDate: string
  endDate: string
  status?: ReconciliationStatus
}

Response: {
  reports: ReconciliationReport[]
  summary: {
    totalReports: number
    discrepancyCount: number
    resolvedCount: number
  }
}
```

**GET /api/reconciliation/discrepancies**
```typescript
// Get discrepancies
Query: {
  status?: string
  severity?: string
}

Response: {
  discrepancies: Discrepancy[]
}
```

**GET /api/financials/income-statement**
```typescript
// Get income statement
Query: {
  year: number
  month: number
}

Response: IncomeStatement
```

**GET /api/financials/balance-sheet**
```typescript
// Get balance sheet
Query: {
  asOfDate: string
}

Response: BalanceSheet
```

## Testing Requirements

### Unit Tests
- [ ] Revenue summary calculation
- [ ] Discrepancy detection
- [ ] Financial statement generation

### Integration Tests
- [ ] Full reconciliation process
- [ ] Discrepancy resolution workflow
- [ ] Monthly financials generation

### E2E Tests
- [ ] Cron job triggers reconciliation
- [ ] Alerts sent on discrepancies
- [ ] Reports exportable to CSV

## Dependencies

- BILL-003a: Revenue Split Calculation
- BILL-003b: Transaction Ledger
- Cron service (Vercel Cron, AWS EventBridge)

## Definition of Done

- [ ] Reconciliation service implemented
- [ ] Cron job configured
- [ ] Discrepancy detection working
- [ ] Financial reports generating
- [ ] All tests passing
- [ ] Documentation written

## Notes

**Timing**: Reconciliation runs for previous day to allow gateway settlements to complete.

**Tolerance**: Small discrepancies (<$0.01) may be acceptable due to rounding differences.