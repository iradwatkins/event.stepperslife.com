# PAY-005: Flat-Fee Pricing Model

**Epic**: EPIC-003 - Payment Processing Foundation
**Story Points**: 3
**Priority**: High
**Status**: Ready for Development

---

## User Story

**As a** Platform Administrator
**I want to** collect a flat fee per ticket sale
**So that** the platform generates revenue while organizers receive transparent net proceeds

**As an** Event Organizer
**I want to** see clear breakdown of platform fees and my net revenue
**So that** I can accurately forecast my event income and understand platform costs

---

## Business Context

The platform operates on a flat-fee-per-ticket revenue model to ensure:
- Predictable costs for organizers
- Transparent pricing structure
- Sustainable platform revenue
- Simple financial reconciliation
- Clear audit trails for accounting

### Revenue Model
- **Platform Fee**: $X.XX per ticket sold (configurable)
- **Organizer Revenue**: Ticket Price - Platform Fee
- **Payment Processing**: Handled through Square (their fees apply separately)

---

## Acceptance Criteria

### 1. Fee Configuration Management
- [ ] Platform administrators can configure flat fee amount via admin panel
- [ ] Fee configuration changes are logged with timestamp and admin user
- [ ] Historical fee rates are preserved for accurate reconciliation
- [ ] Fee updates only apply to future orders (no retroactive changes)
- [ ] Fee configuration supports decimal precision (e.g., $2.50)
- [ ] System validates fee amount is positive and less than maximum ticket price

### 2. Fee Calculation Logic
- [ ] Platform fee is calculated per ticket at order creation time
- [ ] Fee amount is locked at order creation (immune to future config changes)
- [ ] Calculation uses decimal arithmetic to prevent rounding errors
- [ ] Multi-ticket orders calculate fee per ticket correctly
- [ ] Fee calculation occurs before payment processing
- [ ] System handles edge cases (free tickets, discounted tickets)

### 3. Revenue Split Calculation
- [ ] System calculates organizer net revenue: (Ticket Price × Quantity) - (Platform Fee × Quantity)
- [ ] Square processing fees are tracked separately but deducted from organizer revenue
- [ ] All monetary calculations use DECIMAL(10,2) precision
- [ ] Revenue split is stored in Order record at creation time
- [ ] System accounts for taxes if applicable (future-proofing)
- [ ] Calculation formula is auditable and documented in code

### 4. Order Record Keeping
- [ ] Each order stores: ticket_price, quantity, platform_fee_per_ticket, total_platform_revenue, organizer_net_revenue
- [ ] Order records include fee_rate_effective_date for historical tracking
- [ ] Financial data is immutable after order completion
- [ ] Database constraints enforce data integrity (CHECK constraints)
- [ ] All monetary fields use DECIMAL type (never FLOAT)
- [ ] Foreign key to fee configuration record for audit trail

### 5. Organizer Dashboard Display
- [ ] Organizers see per-order breakdown: Gross → Platform Fee → Net Revenue
- [ ] Dashboard displays aggregate metrics: Total Sales, Total Platform Fees, Net Revenue
- [ ] Financial reports exportable to CSV with all fee details
- [ ] Historical data respects fee rates that were active at order time
- [ ] Clear labeling distinguishes platform fees from payment processing fees
- [ ] Real-time updates as new orders are processed

### 6. Financial Reconciliation
- [ ] Daily reconciliation report matches orders to platform revenue
- [ ] System generates payout instructions for organizers (Net Revenue amount)
- [ ] Audit log tracks all financial calculations and payout events
- [ ] Discrepancy detection alerts administrators to investigate
- [ ] Financial data exportable for external accounting systems
- [ ] Reconciliation logic handles refunds and disputes correctly

---

## Technical Requirements

### Database Schema

```sql
-- Fee Configuration Table
CREATE TABLE platform_fee_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fee_amount DECIMAL(10,2) NOT NULL CHECK (fee_amount >= 0),
  effective_from TIMESTAMP NOT NULL DEFAULT NOW(),
  effective_until TIMESTAMP,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  notes TEXT,
  CONSTRAINT valid_date_range CHECK (effective_until IS NULL OR effective_until > effective_from)
);

-- Order Financial Details (extend existing Order table)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS ticket_price DECIMAL(10,2) NOT NULL;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS quantity INTEGER NOT NULL DEFAULT 1;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS platform_fee_per_ticket DECIMAL(10,2) NOT NULL;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS total_platform_revenue DECIMAL(10,2) NOT NULL;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS organizer_gross_revenue DECIMAL(10,2) NOT NULL;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS square_processing_fee DECIMAL(10,2);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS organizer_net_revenue DECIMAL(10,2) NOT NULL;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS fee_config_id UUID REFERENCES platform_fee_config(id);

-- Add constraints to ensure data integrity
ALTER TABLE orders ADD CONSTRAINT check_positive_amounts CHECK (
  ticket_price >= 0 AND
  quantity > 0 AND
  platform_fee_per_ticket >= 0 AND
  total_platform_revenue >= 0 AND
  organizer_gross_revenue >= 0 AND
  organizer_net_revenue >= 0
);

-- Financial Audit Log
CREATE TABLE financial_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id),
  event_type VARCHAR(50) NOT NULL, -- 'order_created', 'payout_calculated', 'refund_processed'
  calculation_details JSONB NOT NULL,
  calculated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  calculated_by UUID REFERENCES users(id)
);

-- Index for performance
CREATE INDEX idx_orders_financial ON orders(created_at, status, total_platform_revenue);
CREATE INDEX idx_fee_config_effective ON platform_fee_config(effective_from, effective_until);
```

### Fee Calculation Service

```typescript
// lib/services/fee-calculation.service.ts
import { Prisma } from '@prisma/client';
import prisma from '@/lib/prisma/client';

export interface FeeCalculationResult {
  ticketPrice: Prisma.Decimal;
  quantity: number;
  platformFeePerTicket: Prisma.Decimal;
  totalPlatformRevenue: Prisma.Decimal;
  organizerGrossRevenue: Prisma.Decimal;
  organizerNetRevenue: Prisma.Decimal;
  feeConfigId: string;
}

export class FeeCalculationService {
  /**
   * Get active platform fee configuration
   */
  private async getActiveFeeConfig(): Promise<PlatformFeeConfig> {
    const config = await prisma.platformFeeConfig.findFirst({
      where: {
        effectiveFrom: { lte: new Date() },
        OR: [
          { effectiveUntil: null },
          { effectiveUntil: { gt: new Date() } }
        ]
      },
      orderBy: { effectiveFrom: 'desc' }
    });

    if (!config) {
      throw new Error('No active platform fee configuration found');
    }

    return config;
  }

  /**
   * Calculate fee breakdown for an order
   * Uses Prisma.Decimal for precision
   */
  async calculateOrderFees(
    ticketPrice: number,
    quantity: number
  ): Promise<FeeCalculationResult> {
    // Input validation
    if (ticketPrice < 0) {
      throw new Error('Ticket price cannot be negative');
    }
    if (quantity <= 0 || !Number.isInteger(quantity)) {
      throw new Error('Quantity must be a positive integer');
    }

    const feeConfig = await this.getActiveFeeConfig();

    // Use Prisma.Decimal for all monetary calculations
    const ticketPriceDecimal = new Prisma.Decimal(ticketPrice);
    const platformFeePerTicket = new Prisma.Decimal(feeConfig.feeAmount);
    const quantityDecimal = new Prisma.Decimal(quantity);

    // Calculate revenue breakdown
    const organizerGrossRevenue = ticketPriceDecimal.times(quantityDecimal);
    const totalPlatformRevenue = platformFeePerTicket.times(quantityDecimal);
    const organizerNetRevenue = organizerGrossRevenue.minus(totalPlatformRevenue);

    // Validate organizer receives positive net revenue
    if (organizerNetRevenue.lessThan(0)) {
      throw new Error(
        `Platform fee ($${platformFeePerTicket}) exceeds ticket price ($${ticketPrice}). ` +
        `Organizer would receive negative revenue.`
      );
    }

    return {
      ticketPrice: ticketPriceDecimal,
      quantity,
      platformFeePerTicket,
      totalPlatformRevenue,
      organizerGrossRevenue,
      organizerNetRevenue,
      feeConfigId: feeConfig.id
    };
  }

  /**
   * Log financial calculation for audit trail
   */
  async logFinancialCalculation(
    orderId: string,
    eventType: string,
    details: FeeCalculationResult,
    userId?: string
  ): Promise<void> {
    await prisma.financialAuditLog.create({
      data: {
        orderId,
        eventType,
        calculationDetails: details as any,
        calculatedBy: userId
      }
    });
  }

  /**
   * Generate reconciliation report for date range
   */
  async generateReconciliationReport(
    startDate: Date,
    endDate: Date
  ): Promise<ReconciliationReport> {
    const orders = await prisma.order.findMany({
      where: {
        createdAt: { gte: startDate, lte: endDate },
        status: 'COMPLETED'
      },
      include: {
        event: { select: { title: true, organizerId: true } }
      }
    });

    const totalPlatformRevenue = orders.reduce(
      (sum, order) => sum.plus(new Prisma.Decimal(order.totalPlatformRevenue)),
      new Prisma.Decimal(0)
    );

    const totalOrganizerRevenue = orders.reduce(
      (sum, order) => sum.plus(new Prisma.Decimal(order.organizerNetRevenue)),
      new Prisma.Decimal(0)
    );

    return {
      startDate,
      endDate,
      orderCount: orders.length,
      totalPlatformRevenue: totalPlatformRevenue.toFixed(2),
      totalOrganizerRevenue: totalOrganizerRevenue.toFixed(2),
      orders: orders.map(o => ({
        id: o.id,
        eventTitle: o.event.title,
        organizerId: o.event.organizerId,
        platformRevenue: o.totalPlatformRevenue,
        organizerRevenue: o.organizerNetRevenue
      }))
    };
  }
}

export const feeCalculationService = new FeeCalculationService();
```

---

## PCI Compliance & Security

### Financial Data Security
- All monetary calculations performed server-side only
- Fee configuration changes require admin authentication
- Financial audit logs are append-only (no DELETE permissions)
- Database backups include encrypted financial records
- Access to financial reports restricted by RBAC

### Data Integrity
- Use database transactions for fee calculations and order creation
- Implement optimistic locking to prevent concurrent modification
- Validate all inputs before calculations
- Use CHECK constraints to enforce business rules at database level
- Financial data immutable after order completion

---

## Testing Requirements

### Unit Tests
```typescript
describe('FeeCalculationService', () => {
  test('calculates fees correctly for single ticket', async () => {
    const result = await feeCalculationService.calculateOrderFees(50.00, 1);
    expect(result.platformFeePerTicket.toNumber()).toBe(2.50);
    expect(result.organizerNetRevenue.toNumber()).toBe(47.50);
  });

  test('calculates fees correctly for multiple tickets', async () => {
    const result = await feeCalculationService.calculateOrderFees(50.00, 5);
    expect(result.totalPlatformRevenue.toNumber()).toBe(12.50);
    expect(result.organizerNetRevenue.toNumber()).toBe(237.50);
  });

  test('handles decimal precision correctly', async () => {
    const result = await feeCalculationService.calculateOrderFees(49.99, 3);
    expect(result.organizerGrossRevenue.toNumber()).toBe(149.97);
  });

  test('throws error when platform fee exceeds ticket price', async () => {
    await expect(
      feeCalculationService.calculateOrderFees(1.00, 1)
    ).rejects.toThrow('Platform fee');
  });

  test('throws error for negative ticket price', async () => {
    await expect(
      feeCalculationService.calculateOrderFees(-10.00, 1)
    ).rejects.toThrow('cannot be negative');
  });
});
```

### Integration Tests
- Test fee calculation with actual database
- Verify audit log creation
- Test reconciliation report generation
- Validate database constraints
- Test concurrent order creation

### Edge Cases
- Free tickets (ticket_price = 0)
- High-volume orders (quantity > 100)
- Very high ticket prices (> $1000)
- Fee configuration changes during checkout
- Decimal precision edge cases (e.g., $0.01 tickets)

---

## Dependencies

- **Requires**: Prisma schema with Order and Event models
- **Requires**: Admin panel for fee configuration
- **Integrates with**: Order creation flow (PAY-001)
- **Integrates with**: Payout system (future epic)
- **Integrates with**: Financial reporting dashboard

---

## Performance Considerations

- Index on orders.created_at and orders.total_platform_revenue for reporting
- Cache active fee configuration (Redis) with 5-minute TTL
- Batch reconciliation queries for large date ranges
- Use database views for common financial aggregations
- Optimize DECIMAL calculations (avoid unnecessary conversions)

---

## Financial Audit Trail

Every fee calculation must be logged:
1. Order ID
2. Calculation timestamp
3. Fee configuration used (ID + amount)
4. Input values (ticket price, quantity)
5. Calculated values (all revenue fields)
6. User who initiated transaction (if applicable)

---

## Definition of Done

- [ ] Database schema implemented with constraints
- [ ] FeeCalculationService fully implemented and tested
- [ ] Admin panel supports fee configuration
- [ ] Organizer dashboard displays fee breakdown
- [ ] Reconciliation report generation working
- [ ] All unit tests passing (>95% coverage)
- [ ] Integration tests passing
- [ ] Financial audit logging implemented
- [ ] Documentation updated
- [ ] Code review completed
- [ ] QA testing completed with edge cases
- [ ] Performance testing under load (1000+ orders)

---

## Notes

- Use Prisma.Decimal for all monetary values (never JavaScript numbers)
- Consider future requirements: percentage-based fees, tiered pricing
- Ensure timezone handling for reconciliation reports
- Plan for internationalization (currency symbols, tax handling)
- Document calculation formulas clearly in code comments