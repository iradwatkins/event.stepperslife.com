# BILL-001a: Fee Calculation Service

**Parent Story:** BILL-001 - Flat-Fee Transaction Billing
**Epic:** EPIC-019 - Platform Billing & Revenue
**Story Points:** 2
**Priority:** P0 (Critical)
**Status:** Ready for Development

## User Story

**As a** platform operator
**I want** a precise fee calculation service that computes platform fees per ticket
**So that** fees are consistently and accurately applied across all transactions

## Acceptance Criteria

### AC1: Fee Calculation Formula
- [ ] Platform fee = $0.50 (flat) + (ticket_price * 0.029) (percentage)
- [ ] Formula applies to each ticket individually, not order total
- [ ] Free tickets ($0.00): Platform fee = $0.00 (no fee on comps)
- [ ] Minimum fee: $0.50 (for tickets priced > $0)
- [ ] No maximum fee (scales with ticket price)
- [ ] Decimal precision: All calculations use Decimal type (not float)
- [ ] Rounding: Fees rounded to 2 decimal places using banker's rounding

### AC2: Fee Service Interface
- [ ] Service method: `calculatePlatformFee(ticketPrice: Decimal): FeeCalculation`
- [ ] Returns structured object with:
  - `grossAmount`: Original ticket price
  - `platformFeeFlat`: $0.50
  - `platformFeePercent`: 2.9% of ticket price
  - `platformFeeTotal`: Flat + percent
  - `appliedFeeRuleId`: Reference to fee configuration
  - `calculatedAt`: Timestamp of calculation
- [ ] Method is pure function (no side effects, idempotent)
- [ ] Thread-safe for concurrent requests
- [ ] Validates input: Ticket price must be >= 0

### AC3: Edge Cases & Validation
- [ ] **Zero price tickets:** Fee = $0.00
- [ ] **Very high prices ($10,000+):** Fee calculates correctly without overflow
- [ ] **Very low prices ($0.01):** Fee = $0.50 (flat fee only, since 2.9% < $0.01)
- [ ] **Negative prices:** Throw validation error
- [ ] **Null/undefined prices:** Throw validation error
- [ ] **Non-numeric prices:** Throw validation error
- [ ] **Prices with > 2 decimals:** Round to 2 decimals before calculation

### AC4: Fee Calculation Examples
- [ ] **$10 ticket:**
  - Flat: $0.50
  - Percent: $10.00 * 0.029 = $0.29
  - Total: $0.79
- [ ] **$50 ticket:**
  - Flat: $0.50
  - Percent: $50.00 * 0.029 = $1.45
  - Total: $1.95
- [ ] **$100 ticket:**
  - Flat: $0.50
  - Percent: $100.00 * 0.029 = $2.90
  - Total: $3.40
- [ ] **$0 ticket (comp):**
  - Flat: $0.00
  - Percent: $0.00
  - Total: $0.00

### AC5: Unit Testing Coverage
- [ ] Test all price points: $0, $0.01, $10, $50, $100, $1000, $10000
- [ ] Test edge cases: Negative, null, undefined, non-numeric
- [ ] Test decimal precision: $10.555 rounds to $10.56
- [ ] Test concurrent calculations (100 simultaneous calls)
- [ ] Test performance: 10,000 calculations < 100ms
- [ ] Test idempotency: Same input always produces same output

## Technical Implementation

### Fee Calculation Service

**File:** `/lib/services/billing.service.ts`
```typescript
import { Decimal } from '@prisma/client/runtime/library';

export interface FeeCalculation {
  grossAmount: Decimal;
  platformFeeFlat: Decimal;
  platformFeePercent: Decimal;
  platformFeeTotal: Decimal;
  appliedFeeRuleId: string;
  calculatedAt: Date;
}

export interface FeeRule {
  id: string;
  flatFee: Decimal;
  percentFee: Decimal;
  minFee: Decimal;
  maxFee?: Decimal;
  version: string;
  effectiveFrom: Date;
  effectiveTo?: Date;
}

export class BillingService {
  private static readonly DEFAULT_FLAT_FEE = new Decimal('0.50');
  private static readonly DEFAULT_PERCENT_FEE = new Decimal('0.029'); // 2.9%
  private static readonly DEFAULT_FEE_RULE_ID = 'default_v1';

  /**
   * Calculate platform fee for a single ticket
   * @param ticketPrice - Price of the ticket (must be >= 0)
   * @param feeRule - Optional custom fee rule (uses default if not provided)
   * @returns FeeCalculation object with breakdown
   * @throws Error if ticketPrice is invalid
   */
  calculatePlatformFee(
    ticketPrice: number | Decimal,
    feeRule?: FeeRule
  ): FeeCalculation {
    // Validate input
    const price = this.validateAndNormalizePrice(ticketPrice);

    // Use default fee rule if not provided
    const rule = feeRule || this.getDefaultFeeRule();

    // Free tickets have no fee
    if (price.isZero()) {
      return {
        grossAmount: price,
        platformFeeFlat: new Decimal(0),
        platformFeePercent: new Decimal(0),
        platformFeeTotal: new Decimal(0),
        appliedFeeRuleId: rule.id,
        calculatedAt: new Date(),
      };
    }

    // Calculate flat fee
    const flatFee = rule.flatFee;

    // Calculate percentage fee (2.9% of ticket price)
    const percentFee = price.times(rule.percentFee).toDecimalPlaces(2, Decimal.ROUND_HALF_EVEN);

    // Total platform fee
    let totalFee = flatFee.plus(percentFee);

    // Apply min/max constraints
    if (totalFee.lessThan(rule.minFee)) {
      totalFee = rule.minFee;
    }
    if (rule.maxFee && totalFee.greaterThan(rule.maxFee)) {
      totalFee = rule.maxFee;
    }

    return {
      grossAmount: price,
      platformFeeFlat: flatFee,
      platformFeePercent: percentFee,
      platformFeeTotal: totalFee,
      appliedFeeRuleId: rule.id,
      calculatedAt: new Date(),
    };
  }

  /**
   * Calculate organizer net revenue
   * @param ticketPrice - Original ticket price
   * @param paymentProcessingFee - Fee charged by payment processor (Square/Stripe)
   * @returns Net amount organizer receives
   */
  calculateOrganizerNet(
    ticketPrice: number | Decimal,
    paymentProcessingFee: number | Decimal
  ): Decimal {
    const price = this.validateAndNormalizePrice(ticketPrice);
    const processingFee = this.validateAndNormalizePrice(paymentProcessingFee);

    const platformFee = this.calculatePlatformFee(price);

    // Organizer net = ticket price - platform fee - payment processing fee
    const netAmount = price
      .minus(platformFee.platformFeeTotal)
      .minus(processingFee);

    // Ensure net is never negative (edge case protection)
    return netAmount.lessThan(0) ? new Decimal(0) : netAmount;
  }

  /**
   * Validate and normalize price input
   * @private
   */
  private validateAndNormalizePrice(price: number | Decimal): Decimal {
    if (price === null || price === undefined) {
      throw new Error('Price cannot be null or undefined');
    }

    let decimal: Decimal;
    try {
      decimal = new Decimal(price);
    } catch (error) {
      throw new Error(`Invalid price value: ${price}`);
    }

    if (decimal.isNaN()) {
      throw new Error('Price must be a valid number');
    }

    if (decimal.lessThan(0)) {
      throw new Error('Price cannot be negative');
    }

    // Round to 2 decimal places (cents)
    return decimal.toDecimalPlaces(2, Decimal.ROUND_HALF_EVEN);
  }

  /**
   * Get default fee rule
   * @private
   */
  private getDefaultFeeRule(): FeeRule {
    return {
      id: BillingService.DEFAULT_FEE_RULE_ID,
      flatFee: BillingService.DEFAULT_FLAT_FEE,
      percentFee: BillingService.DEFAULT_PERCENT_FEE,
      minFee: BillingService.DEFAULT_FLAT_FEE,
      version: 'v1.0',
      effectiveFrom: new Date('2025-01-01'),
    };
  }

  /**
   * Calculate total fees for multiple tickets (bulk operation)
   */
  calculateBulkFees(tickets: Array<{ id: string; price: Decimal }>): FeeCalculation[] {
    return tickets.map((ticket) => ({
      ticketId: ticket.id,
      ...this.calculatePlatformFee(ticket.price),
    }));
  }
}

// Export singleton instance
export const billingService = new BillingService();
```

### Configuration Constants

**File:** `/lib/config/billing.config.ts`
```typescript
export const BILLING_CONFIG = {
  // Default fee structure
  DEFAULT_FLAT_FEE: 0.50, // $0.50 per ticket
  DEFAULT_PERCENT_FEE: 0.029, // 2.9%

  // Fee constraints
  MIN_FEE: 0.50, // Minimum fee for paid tickets
  MAX_FEE: null, // No maximum fee

  // Free ticket threshold
  FREE_TICKET_THRESHOLD: 0.00,

  // Decimal precision
  DECIMAL_PLACES: 2,
  ROUNDING_MODE: 'ROUND_HALF_EVEN', // Banker's rounding

  // Performance limits
  MAX_BULK_CALCULATION_SIZE: 10000,
} as const;
```

## Testing Requirements

### Unit Tests

**File:** `/lib/services/__tests__/billing.service.test.ts`
```typescript
import { billingService } from '../billing.service';
import { Decimal } from '@prisma/client/runtime/library';

describe('BillingService.calculatePlatformFee', () => {
  describe('standard calculations', () => {
    it('calculates fee for $10 ticket', () => {
      const result = billingService.calculatePlatformFee(10);

      expect(result.grossAmount.toNumber()).toBe(10.00);
      expect(result.platformFeeFlat.toNumber()).toBe(0.50);
      expect(result.platformFeePercent.toNumber()).toBe(0.29); // 10 * 0.029
      expect(result.platformFeeTotal.toNumber()).toBe(0.79);
    });

    it('calculates fee for $50 ticket', () => {
      const result = billingService.calculatePlatformFee(50);

      expect(result.platformFeeFlat.toNumber()).toBe(0.50);
      expect(result.platformFeePercent.toNumber()).toBe(1.45); // 50 * 0.029
      expect(result.platformFeeTotal.toNumber()).toBe(1.95);
    });

    it('calculates fee for $100 ticket', () => {
      const result = billingService.calculatePlatformFee(100);

      expect(result.platformFeeFlat.toNumber()).toBe(0.50);
      expect(result.platformFeePercent.toNumber()).toBe(2.90); // 100 * 0.029
      expect(result.platformFeeTotal.toNumber()).toBe(3.40);
    });
  });

  describe('edge cases', () => {
    it('charges no fee for free ($0) tickets', () => {
      const result = billingService.calculatePlatformFee(0);

      expect(result.platformFeeTotal.toNumber()).toBe(0.00);
    });

    it('handles very low prices ($0.01)', () => {
      const result = billingService.calculatePlatformFee(0.01);

      // $0.50 flat + ($0.01 * 0.029) = $0.50 + $0.0003 = $0.50
      expect(result.platformFeeTotal.toNumber()).toBe(0.50);
    });

    it('handles very high prices ($10,000)', () => {
      const result = billingService.calculatePlatformFee(10000);

      // $0.50 + ($10,000 * 0.029) = $0.50 + $290.00 = $290.50
      expect(result.platformFeeTotal.toNumber()).toBe(290.50);
    });

    it('throws error for negative prices', () => {
      expect(() => {
        billingService.calculatePlatformFee(-10);
      }).toThrow('Price cannot be negative');
    });

    it('throws error for null prices', () => {
      expect(() => {
        billingService.calculatePlatformFee(null);
      }).toThrow('Price cannot be null or undefined');
    });

    it('throws error for non-numeric prices', () => {
      expect(() => {
        billingService.calculatePlatformFee('invalid' as any);
      }).toThrow('Invalid price value');
    });
  });

  describe('decimal precision', () => {
    it('rounds prices to 2 decimal places', () => {
      const result = billingService.calculatePlatformFee(10.555);

      expect(result.grossAmount.toNumber()).toBe(10.56); // Rounded up
    });

    it('uses banker\'s rounding (round half to even)', () => {
      const result1 = billingService.calculatePlatformFee(10.125); // Rounds to 10.12 (even)
      const result2 = billingService.calculatePlatformFee(10.135); // Rounds to 10.14 (even)

      expect(result1.grossAmount.toNumber()).toBe(10.12);
      expect(result2.grossAmount.toNumber()).toBe(10.14);
    });
  });

  describe('idempotency', () => {
    it('returns same result for same input', () => {
      const result1 = billingService.calculatePlatformFee(50);
      const result2 = billingService.calculatePlatformFee(50);

      expect(result1.platformFeeTotal.equals(result2.platformFeeTotal)).toBe(true);
    });
  });

  describe('performance', () => {
    it('calculates 10,000 fees in < 100ms', () => {
      const start = Date.now();

      for (let i = 0; i < 10000; i++) {
        billingService.calculatePlatformFee(50);
      }

      const duration = Date.now() - start;
      expect(duration).toBeLessThan(100);
    });
  });
});

describe('BillingService.calculateOrganizerNet', () => {
  it('calculates correct net revenue', () => {
    // Ticket: $100, Platform fee: $3.40, Processing fee: $2.90
    const net = billingService.calculateOrganizerNet(100, 2.90);

    // $100 - $3.40 - $2.90 = $93.70
    expect(net.toNumber()).toBe(93.70);
  });

  it('returns zero if fees exceed ticket price', () => {
    const net = billingService.calculateOrganizerNet(1, 5);

    expect(net.toNumber()).toBe(0);
  });
});
```

## Integration Points

### Checkout Flow Integration
```typescript
// In checkout service, calculate fees before payment
const ticketFees = tickets.map((ticket) =>
  billingService.calculatePlatformFee(ticket.price)
);

const totalPlatformFee = ticketFees.reduce(
  (sum, fee) => sum.plus(fee.platformFeeTotal),
  new Decimal(0)
);

const orderTotal = ticketsSubtotal.plus(totalPlatformFee).plus(taxAmount);
```

### Order Confirmation
```typescript
// Store fee breakdown in order record
await prisma.order.create({
  data: {
    totalAmount: orderTotal,
    platformFee: totalPlatformFee,
    // ... other fields
    transactionFees: {
      create: ticketFees.map((fee) => ({
        grossAmount: fee.grossAmount,
        platformFeeFlat: fee.platformFeeFlat,
        platformFeePercent: fee.platformFeePercent,
        platformFeeTotal: fee.platformFeeTotal,
        appliedFeeRuleId: fee.appliedFeeRuleId,
      })),
    },
  },
});
```

## Performance Requirements

- [ ] Single fee calculation: < 1ms
- [ ] Bulk calculation (1,000 tickets): < 50ms
- [ ] Bulk calculation (10,000 tickets): < 100ms
- [ ] Memory usage: < 10MB for 10,000 calculations
- [ ] Thread-safe for 1,000 concurrent requests

## Security Considerations

- [ ] No sensitive data logged (only fee amounts, not payment info)
- [ ] Input validation prevents injection attacks
- [ ] Fee calculations auditable (include timestamp and rule ID)
- [ ] Immutable calculation results (no mutation after creation)

## Documentation Requirements

- [ ] JSDoc comments for all public methods
- [ ] Usage examples in README
- [ ] Fee formula documentation for organizers
- [ ] API reference for developers

## Definition of Done

- [ ] All acceptance criteria met
- [ ] Service implemented with TypeScript
- [ ] Unit tests pass (100% coverage)
- [ ] Performance benchmarks met
- [ ] Code reviewed and approved
- [ ] Documentation completed
- [ ] Integration tests with checkout flow pass