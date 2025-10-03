# Story: EV-013 - Tiered Pricing Rules Engine

**Epic**: EPIC-005 - Advanced Event Features
**Story Points**: 5
**Priority**: P1 (High)
**Status**: Draft
**Dependencies**: EV-002 (Ticket Types), PAY-001 (Payment Processing), DISC-001 (Discount System)

---

## Story

**As an** event organizer
**I want to** create dynamic pricing rules based on time, quantity, and conditions
**So that** I can maximize revenue with early bird discounts, bulk pricing, and time-sensitive offers

---

## Context & Business Value

**The Pricing Problem**:
Simple fixed pricing leaves money on the table. Dynamic pricing strategies increase revenue by 15-35%:
- **Early Bird**: Sell more tickets early, improve cash flow
- **Last Minute**: Fill remaining seats at premium prices
- **Volume Tiers**: Incentivize larger groups, increase average order value
- **Time Decay**: Gradually increase prices as event approaches

**Real-World Examples**:
1. **Concert Venue**:
   - 90+ days out: $50 (Early Bird)
   - 60-89 days: $65 (Regular)
   - 30-59 days: $75 (Standard)
   - 0-29 days: $85 (Late Registration)
   - At door: $100

2. **Conference**:
   - First 100 tickets: $199 (Super Early Bird)
   - Tickets 101-300: $249 (Early Bird)
   - After March 1st: $299 (Regular)
   - 10+ tickets: 15% off
   - 25+ tickets: 25% off

3. **Training Workshop**:
   - 30+ days before: $499
   - 15-29 days: $599
   - 0-14 days: $699
   - Groups of 5+: $449 each

---

## Acceptance Criteria

### AC-1: Pricing Rule Creation Interface

**GIVEN** I am creating a ticket type
**WHEN** I access the pricing configuration
**THEN** I should see options to:
- Set base price
- Add pricing rules/tiers
- Configure rule conditions
- Set rule priorities
- Preview pricing schedule

**AND** I can create rules based on:
1. **Time-Based Conditions**:
   - Days before event start
   - Specific date ranges
   - Ticket sales open date
   - Event status changes

2. **Quantity-Based Conditions**:
   - Number of tickets sold (e.g., first 50 tickets)
   - Number in single order (bulk discount)
   - Remaining capacity percentage

3. **Conditional Logic**:
   - Day of week (e.g., weekday vs weekend pricing)
   - Time of day (e.g., morning sessions cheaper)
   - User attributes (member status, previous attendee)
   - Promo code applied

4. **Combined Conditions**:
   - AND logic: All conditions must be met
   - OR logic: Any condition triggers rule
   - Priority ordering when multiple rules match

### AC-2: Date-Based Pricing Tiers

**GIVEN** I want to implement early bird pricing
**WHEN** I configure date-based rules
**THEN** I should be able to:
- Set multiple time-based pricing tiers
- Define price for each tier
- Set tier boundaries (dates or days-before-event)
- Preview pricing calendar
- Set automatic transitions

**Example Configuration**:
```
Ticket Type: General Admission
Base Price: $75

Pricing Tiers:
┌─────────────────────────────────────────────────┐
│ Tier 1: Super Early Bird                       │
│ Condition: 90+ days before event                │
│ Price: $50 (33% off base)                       │
│ Active: Feb 1 - Apr 30                          │
└─────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────┐
│ Tier 2: Early Bird                             │
│ Condition: 60-89 days before event              │
│ Price: $60 (20% off base)                       │
│ Active: May 1 - May 31                          │
└─────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────┐
│ Tier 3: Regular                                 │
│ Condition: 30-59 days before event              │
│ Price: $75 (base price)                         │
│ Active: Jun 1 - Jun 30                          │
└─────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────┐
│ Tier 4: Late Registration                       │
│ Condition: 0-29 days before event               │
│ Price: $85 (13% premium)                        │
│ Active: Jul 1 - Jul 30                          │
└─────────────────────────────────────────────────┘
```

**WHEN** a customer views pricing
**THEN** system should:
- Show current applicable price
- Display pricing tier name
- Show when price will change next
- Display countdown timer to next tier (optional)
- Show comparison to base/future prices

### AC-3: Quantity-Based Tiered Pricing

**GIVEN** I want to reward bulk purchases
**WHEN** I configure quantity-based rules
**THEN** I should be able to create:

**Type A: Inventory-Based Tiers** (First X tickets)
```
First 50 tickets: $199
Next 100 tickets: $249
Next 150 tickets: $299
Remaining tickets: $349
```

**Type B: Order Quantity Discounts** (Volume in single order)
```
1-4 tickets: $100 each (base price)
5-9 tickets: $90 each (10% off)
10-24 tickets: $80 each (20% off)
25+ tickets: $70 each (30% off)
```

**Type C: Capacity-Based Pricing** (% of tickets remaining)
```
When 80-100% available: $50
When 50-79% available: $65
When 20-49% available: $80
When 0-19% available: $100 (surge pricing)
```

**WHEN** customer adds tickets to cart
**THEN** system should:
- Calculate applicable tier in real-time
- Show per-ticket price
- Show total savings
- Display tier threshold notifications:
  - "Add 1 more ticket to save 10%"
  - "Only 5 tickets left at this price"
- Update dynamically as quantity changes

### AC-4: Rule Priority and Conflict Resolution

**GIVEN** I have multiple pricing rules configured
**WHEN** multiple rules could apply simultaneously
**THEN** system should:
- Evaluate rules in priority order (1 = highest)
- Apply first matching rule (if exclusive)
- OR combine rules (if stackable)
- Show rule application logic in admin UI

**Rule Combination Strategies**:
1. **Best Price Wins**: Apply lowest price rule
2. **Priority Order**: Apply highest priority rule
3. **Stackable**: Apply all matching rules (rare, but possible for discounts)
4. **Exclusive**: Only one rule can apply

**Example Conflict Scenario**:
```
Rule A: Early Bird (60+ days) = $50 [Priority: 1]
Rule B: Group Discount (10+ tickets) = 20% off base ($60) [Priority: 2]
Rule C: Member Discount = $55 [Priority: 3]

Scenario: Member buying 12 tickets, 65 days before event
- Rule A applies: $50/ticket ✓ (highest priority)
- Rule B would give: $60/ticket ✗ (lower priority)
- Rule C would give: $55/ticket ✗ (lower priority)

Final Price: $50/ticket (Rule A wins)

If stackable enabled:
Final Price: $50 with 20% off = $40/ticket
```

### AC-5: Pricing Rule Dashboard and Analytics

**GIVEN** I have active pricing rules
**WHEN** I view the pricing dashboard
**THEN** I should see:
- All active pricing rules
- Current applicable price
- Rule performance metrics
- Revenue optimization insights

**Dashboard Metrics**:
```
╔══════════════════════════════════════════════════╗
║ Pricing Rule Performance - General Admission    ║
╠══════════════════════════════════════════════════╣
║ Current Active Rule: Early Bird Tier            ║
║ Current Price: $50 → $60 in 5 days              ║
║ Average Sale Price: $54.75                       ║
╠══════════════════════════════════════════════════╣
║ Rule Breakdown:                                  ║
║ ┌──────────────────────────────────────────────┐ ║
║ │ Super Early Bird ($50)                       │ ║
║ │ Tickets Sold: 125 | Revenue: $6,250         │ ║
║ │ Average Days Before: 98 | Conversion: 18%   │ ║
║ └──────────────────────────────────────────────┘ ║
║ ┌──────────────────────────────────────────────┐ ║
║ │ Early Bird ($60) - ACTIVE                    │ ║
║ │ Tickets Sold: 87 | Revenue: $5,220          │ ║
║ │ Average Days Before: 72 | Conversion: 14%   │ ║
║ │ Projected: 45 more tickets                   │ ║
║ └──────────────────────────────────────────────┘ ║
║ ┌──────────────────────────────────────────────┐ ║
║ │ Regular ($75) - Upcoming                     │ ║
║ │ Tickets Sold: 0 | Projected Revenue: $7,500 │ ║
║ │ Estimated: 100 tickets                       │ ║
║ └──────────────────────────────────────────────┘ ║
╠══════════════════════════════════════════════════╣
║ Insights:                                        ║
║ • Super Early Bird conversion excellent          ║
║ • Consider extending Early Bird by 1 week        ║
║ • Group discount underutilized (5% of orders)    ║
╚══════════════════════════════════════════════════╝
```

**AND** I should be able to:
- Adjust rules mid-campaign (with safeguards)
- See rule impact on revenue
- A/B test different pricing strategies
- Export pricing analytics

### AC-6: Customer-Facing Pricing Display

**GIVEN** I am a customer viewing an event
**WHEN** pricing rules are active
**THEN** I should see:
- Current applicable price clearly displayed
- Pricing tier badge/label (e.g., "Early Bird", "Group Rate")
- Savings amount vs base/regular price
- Urgency indicators when applicable
- Next price change information

**Display Examples**:

**Time-Based Urgency**:
```
┌─────────────────────────────────────────┐
│ General Admission                       │
│ $50.00 EARLY BIRD                       │
│ Regular Price: $75.00                   │
│ YOU SAVE: $25 (33%)                     │
│                                         │
│ ⏰ Price increases to $60 in 5 days     │
│ [Purchase Now]                          │
└─────────────────────────────────────────┘
```

**Quantity-Based Incentive**:
```
┌─────────────────────────────────────────┐
│ Conference Pass                         │
│ $100.00 each                            │
│                                         │
│ 💡 Buy 5+ tickets: $90 each (Save 10%) │
│ 💡 Buy 10+ tickets: $80 each (Save 20%)│
│                                         │
│ Quantity: [1] [2] [3] [4] [5+]         │
└─────────────────────────────────────────┘
```

**Inventory-Based Scarcity**:
```
┌─────────────────────────────────────────┐
│ VIP Pass                                │
│ $199.00                                 │
│ 🔥 ONLY 8 TICKETS LEFT AT THIS PRICE    │
│                                         │
│ Price increases to $249 after 50 sold   │
│ [Buy Now - Limited Time]                │
└─────────────────────────────────────────┘
```

---

## Tasks / Subtasks

### Phase 1: Core Pricing Engine (10 hours)

- [ ] **Create Pricing Rules Schema** (AC-1)
  - [ ] Design `PricingRule` model with fields:
    - Rule type (DATE_BASED, QUANTITY_BASED, CAPACITY_BASED, CONDITIONAL)
    - Conditions (JSON schema for flexible rule definitions)
    - Price or discount configuration
    - Priority, active status, stackable flag
  - [ ] Create `PricingTier` model for tier management
  - [ ] Add indexes for performance
  - [ ] Create migration

- [ ] **Build Pricing Rule Engine** (AC-2, AC-3, AC-4)
  - [ ] `PricingRuleEngine.ts` - Core evaluation logic
  - [ ] `evaluateRules(ticketType, context)` - Determine applicable rules
  - [ ] `calculatePrice(ticketType, quantity, context)` - Final price calculation
  - [ ] `getPriceBreakdown(ticketType, quantity)` - Show price components
  - [ ] Implement priority-based rule resolution
  - [ ] Support stackable vs exclusive rules

- [ ] **Date-Based Rule Calculator** (AC-2)
  - [ ] Calculate days until event
  - [ ] Determine active tier based on current date
  - [ ] Calculate next tier transition
  - [ ] Generate pricing calendar

- [ ] **Quantity-Based Rule Calculator** (AC-3)
  - [ ] Inventory-based tier calculation
  - [ ] Order quantity discount calculation
  - [ ] Capacity percentage calculation
  - [ ] Real-time tier threshold checks

### Phase 2: API Layer (6 hours)

- [ ] **Pricing Rule Management APIs** (AC-1, AC-5)
  - [ ] `POST /api/events/:eventId/ticket-types/:ticketTypeId/pricing-rules` - Create rule
  - [ ] `GET /api/events/:eventId/ticket-types/:ticketTypeId/pricing-rules` - List rules
  - [ ] `PATCH /api/events/:eventId/pricing-rules/:ruleId` - Update rule
  - [ ] `DELETE /api/events/:eventId/pricing-rules/:ruleId` - Delete rule
  - [ ] `POST /api/events/:eventId/pricing-rules/reorder` - Change priorities

- [ ] **Pricing Calculation APIs** (AC-6)
  - [ ] `GET /api/events/:eventId/pricing/calculate` - Calculate price for given context
  - [ ] `GET /api/events/:eventId/pricing/current` - Get current active pricing
  - [ ] `GET /api/events/:eventId/pricing/schedule` - Get full pricing schedule
  - [ ] `GET /api/events/:eventId/pricing/analytics` - Rule performance data

### Phase 3: Organizer UI (10 hours)

- [ ] **Pricing Rule Builder** (AC-1)
  - [ ] `PricingRuleBuilder.tsx` - Main rule creation interface
  - [ ] `RuleConditionSelector.tsx` - Visual condition builder
  - [ ] `DateBasedRuleForm.tsx` - Date/time-based rule configuration
  - [ ] `QuantityBasedRuleForm.tsx` - Quantity tier configuration
  - [ ] `RulePriorityManager.tsx` - Drag-drop priority ordering
  - [ ] `PricingPreview.tsx` - Visual pricing schedule preview

- [ ] **Pricing Dashboard** (AC-5)
  - [ ] `PricingDashboard.tsx` - Main analytics view
  - [ ] `PricingRulePerformance.tsx` - Per-rule metrics
  - [ ] `PricingOptimizationInsights.tsx` - AI-driven recommendations
  - [ ] `PricingCalendar.tsx` - Calendar view of price changes
  - [ ] Add export functionality for pricing data

### Phase 4: Customer-Facing UI (8 hours)

- [ ] **Dynamic Pricing Display** (AC-6)
  - [ ] `DynamicPriceDisplay.tsx` - Shows current price with context
  - [ ] `PricingTierBadge.tsx` - Visual tier indicator
  - [ ] `SavingsCalculator.tsx` - Show savings vs base price
  - [ ] `PriceChangeCountdown.tsx` - Countdown to next tier
  - [ ] `QuantityPricingTable.tsx` - Bulk discount visualization

- [ ] **Checkout Flow Integration** (AC-3, AC-6)
  - [ ] Update cart to show per-ticket pricing
  - [ ] Display tier incentives dynamically
  - [ ] Show total savings in order summary
  - [ ] Add "add X more to save Y%" notifications

### Phase 5: Testing & Optimization (8 hours)

- [ ] Write unit tests for pricing engine
- [ ] Test rule priority resolution
- [ ] Test edge cases (timezone handling, concurrent purchases)
- [ ] E2E test: Date-based pricing transitions
- [ ] E2E test: Quantity discount calculations
- [ ] E2E test: Multi-rule scenarios
- [ ] Performance test: Rule evaluation latency
- [ ] Load test: Concurrent price calculations

---

## Technical Design

### Database Schema

```prisma
model PricingRule {
  id               String    @id @default(uuid())
  ticketTypeId     String
  ticketType       TicketType @relation(fields: [ticketTypeId], references: [id], onDelete: Cascade)

  // Rule Configuration
  name             String
  description      String?
  ruleType         PricingRuleType
  isActive         Boolean   @default(true)

  // Conditions (JSON schema)
  conditions       Json      // Flexible condition definition

  // Price Configuration
  priceType        PriceType // FIXED, PERCENTAGE_OFF, ABSOLUTE_OFF
  priceValue       Decimal   @db.Decimal(10, 2)

  // Rule Behavior
  priority         Int       @default(0) // Lower = higher priority
  isStackable      Boolean   @default(false)
  combinationMode  CombinationMode @default(PRIORITY_WINS)

  // Validity Period
  validFrom        DateTime?
  validUntil       DateTime?

  // Statistics
  timesApplied     Int       @default(0)
  totalRevenue     Decimal   @db.Decimal(12, 2) @default(0)
  avgDiscount      Decimal?  @db.Decimal(5, 2)

  // Metadata
  metadata         Json?     @default("{}")

  createdAt        DateTime  @default(now())
  updatedAt        DateTime  @updatedAt

  @@index([ticketTypeId, priority])
  @@index([ticketTypeId, isActive])
  @@index([ruleType, isActive])
  @@map("pricing_rules")
}

model PricingTier {
  id               String    @id @default(uuid())
  ticketTypeId     String
  ticketType       TicketType @relation(fields: [ticketTypeId], references: [id], onDelete: Cascade)

  name             String    // e.g., "Early Bird", "Regular", "Late"
  description      String?

  // Tier Triggers
  triggerType      TierTriggerType
  triggerValue     Json      // Flexible trigger definition

  // Pricing
  price            Decimal   @db.Decimal(10, 2)
  compareAtPrice   Decimal?  @db.Decimal(10, 2) // For showing savings

  // Tier Order
  sortOrder        Int       @default(0)

  // Validity
  startsAt         DateTime?
  endsAt           DateTime?

  // Statistics
  ticketsSold      Int       @default(0)
  revenue          Decimal   @db.Decimal(12, 2) @default(0)

  isActive         Boolean   @default(true)

  createdAt        DateTime  @default(now())
  updatedAt        DateTime  @updatedAt

  @@index([ticketTypeId, sortOrder])
  @@map("pricing_tiers")
}

enum PricingRuleType {
  DATE_BASED        // Based on date/time
  QUANTITY_BASED    // Based on order quantity
  INVENTORY_BASED   // Based on tickets sold
  CAPACITY_BASED    // Based on % remaining
  CONDITIONAL       // Based on user attributes
  CUSTOM            // Custom logic
}

enum PriceType {
  FIXED_PRICE       // Set specific price
  PERCENTAGE_OFF    // X% off base price
  AMOUNT_OFF        // $X off base price
}

enum CombinationMode {
  PRIORITY_WINS     // Highest priority rule only
  BEST_PRICE_WINS   // Lowest price wins
  STACKABLE         // Combine all applicable rules
  EXCLUSIVE         // First match only
}

enum TierTriggerType {
  DAYS_BEFORE_EVENT
  DATE_RANGE
  TICKETS_SOLD_COUNT
  TICKETS_REMAINING_COUNT
  CAPACITY_PERCENTAGE
  ORDER_QUANTITY
}

// Update TicketType model
model TicketType {
  // ... existing fields
  basePrice        Decimal   @db.Decimal(10, 2) // Base/reference price
  currentPrice     Decimal   @db.Decimal(10, 2) // Auto-calculated current price
  pricingRules     PricingRule[]
  pricingTiers     PricingTier[]
  useDynamicPricing Boolean  @default(false)
}
```

### Pricing Rule Engine Implementation

```typescript
// lib/services/pricing-engine.service.ts

interface PricingContext {
  eventId: string;
  ticketTypeId: string;
  quantity: number;
  purchaseDate: Date;
  userId?: string;
  promoCode?: string;
}

interface PriceCalculation {
  basePrice: number;
  finalPrice: number;
  appliedRules: AppliedRule[];
  totalDiscount: number;
  savingsPercentage: number;
  pricePerTicket: number;
  breakdown: PriceBreakdown;
}

interface AppliedRule {
  ruleId: string;
  ruleName: string;
  discountAmount: number;
  priceAfterRule: number;
}

class PricingEngine {
  /**
   * Calculate final price considering all applicable rules
   */
  async calculatePrice(context: PricingContext): Promise<PriceCalculation> {
    const ticketType = await this.getTicketType(context.ticketTypeId);

    if (!ticketType.useDynamicPricing) {
      return this.simplePrice(ticketType, context.quantity);
    }

    // Get all active rules
    const rules = await this.getActiveRules(context.ticketTypeId);

    // Evaluate which rules apply
    const applicableRules = await this.evaluateRules(rules, context);

    // Sort by priority
    applicableRules.sort((a, b) => a.priority - b.priority);

    // Apply rules based on combination mode
    const appliedRules: AppliedRule[] = [];
    let currentPrice = ticketType.basePrice;

    for (const rule of applicableRules) {
      if (rule.combinationMode === 'PRIORITY_WINS' && appliedRules.length > 0) {
        break; // First rule wins, stop processing
      }

      const priceAfterRule = this.applyRule(currentPrice, rule);

      appliedRules.push({
        ruleId: rule.id,
        ruleName: rule.name,
        discountAmount: currentPrice - priceAfterRule,
        priceAfterRule
      });

      currentPrice = priceAfterRule;

      if (rule.combinationMode === 'EXCLUSIVE') {
        break; // Stop after first applicable exclusive rule
      }
    }

    const finalPrice = currentPrice * context.quantity;
    const totalDiscount = (ticketType.basePrice * context.quantity) - finalPrice;

    return {
      basePrice: ticketType.basePrice,
      finalPrice,
      appliedRules,
      totalDiscount,
      savingsPercentage: (totalDiscount / (ticketType.basePrice * context.quantity)) * 100,
      pricePerTicket: currentPrice,
      breakdown: this.generateBreakdown(ticketType, appliedRules, context.quantity)
    };
  }

  /**
   * Evaluate which rules are applicable for given context
   */
  private async evaluateRules(
    rules: PricingRule[],
    context: PricingContext
  ): Promise<PricingRule[]> {
    const applicable: PricingRule[] = [];

    for (const rule of rules) {
      if (await this.evaluateConditions(rule.conditions, context)) {
        applicable.push(rule);
      }
    }

    return applicable;
  }

  /**
   * Evaluate rule conditions against context
   */
  private async evaluateConditions(
    conditions: any,
    context: PricingContext
  ): Promise<boolean> {
    const event = await this.getEvent(context.eventId);

    switch (conditions.type) {
      case 'DAYS_BEFORE_EVENT':
        const daysUntil = differenceInDays(event.startDate, context.purchaseDate);
        return this.evaluateNumericCondition(
          daysUntil,
          conditions.operator,
          conditions.value
        );

      case 'QUANTITY_THRESHOLD':
        return this.evaluateNumericCondition(
          context.quantity,
          conditions.operator,
          conditions.value
        );

      case 'TICKETS_SOLD':
        const soldCount = await this.getTicketsSoldCount(context.ticketTypeId);
        return this.evaluateNumericCondition(
          soldCount,
          conditions.operator,
          conditions.value
        );

      case 'CAPACITY_PERCENTAGE':
        const capacityPct = await this.getCapacityPercentage(context.ticketTypeId);
        return this.evaluateNumericCondition(
          capacityPct,
          conditions.operator,
          conditions.value
        );

      case 'DATE_RANGE':
        return isWithinInterval(context.purchaseDate, {
          start: new Date(conditions.startDate),
          end: new Date(conditions.endDate)
        });

      case 'COMPOSITE_AND':
        return await Promise.all(
          conditions.rules.map((r: any) => this.evaluateConditions(r, context))
        ).then(results => results.every(r => r));

      case 'COMPOSITE_OR':
        return await Promise.all(
          conditions.rules.map((r: any) => this.evaluateConditions(r, context))
        ).then(results => results.some(r => r));

      default:
        return false;
    }
  }

  /**
   * Apply pricing rule to current price
   */
  private applyRule(currentPrice: number, rule: PricingRule): number {
    switch (rule.priceType) {
      case 'FIXED_PRICE':
        return Number(rule.priceValue);

      case 'PERCENTAGE_OFF':
        const discount = (currentPrice * Number(rule.priceValue)) / 100;
        return currentPrice - discount;

      case 'AMOUNT_OFF':
        return Math.max(0, currentPrice - Number(rule.priceValue));

      default:
        return currentPrice;
    }
  }

  /**
   * Get next pricing tier change information
   */
  async getNextPriceChange(ticketTypeId: string): Promise<NextPriceChange | null> {
    const tiers = await prisma.pricingTier.findMany({
      where: {
        ticketTypeId,
        isActive: true,
        OR: [
          { startsAt: { gt: new Date() } },
          { endsAt: { gt: new Date() } }
        ]
      },
      orderBy: { startsAt: 'asc' }
    });

    if (tiers.length === 0) return null;

    const nextTier = tiers[0];
    return {
      tierName: nextTier.name,
      newPrice: nextTier.price,
      changeDate: nextTier.startsAt!,
      daysUntilChange: differenceInDays(nextTier.startsAt!, new Date())
    };
  }
}
```

### Condition Schema Examples

```json
// Date-Based Rule: Early Bird (60+ days before event)
{
  "type": "DAYS_BEFORE_EVENT",
  "operator": ">=",
  "value": 60
}

// Quantity-Based Rule: 10+ tickets get discount
{
  "type": "QUANTITY_THRESHOLD",
  "operator": ">=",
  "value": 10
}

// Inventory-Based Rule: First 100 tickets
{
  "type": "TICKETS_SOLD",
  "operator": "<",
  "value": 100
}

// Capacity-Based Rule: Less than 20% remaining
{
  "type": "CAPACITY_PERCENTAGE",
  "operator": "<",
  "value": 20
}

// Composite Rule: Early Bird AND bulk discount
{
  "type": "COMPOSITE_AND",
  "rules": [
    {
      "type": "DAYS_BEFORE_EVENT",
      "operator": ">=",
      "value": 30
    },
    {
      "type": "QUANTITY_THRESHOLD",
      "operator": ">=",
      "value": 5
    }
  ]
}
```

---

## Edge Cases & Business Rules

### 1. Price Lock at Cart Addition
- **Rule**: Price locked when ticket added to cart (15-minute reservation)
- **Reason**: Prevent price increases during checkout
- **Implementation**: Store locked price in cart session

### 2. Tier Transition Timing
- **Rule**: Tier changes happen at midnight in event timezone
- **Edge Case**: Customer in different timezone sees price change mid-day
- **Solution**: Display tier change time in customer's timezone

### 3. Retroactive Rule Changes
- **Rule**: Cannot change rules that affect already-sold tickets
- **Protection**: Warn organizer of impact, require confirmation
- **Exception**: Can add new rules for future sales

### 4. Minimum Price Floor
- **Rule**: Final price cannot drop below cost + minimum margin
- **Validation**: System prevents creating rules that violate floor
- **Override**: Admin can override for special promotions

### 5. Conflicting Rules
- **Scenario**: Early Bird says $50, Group Discount says $60
- **Resolution**: Use priority system or "best price wins" mode
- **Transparency**: Show customer which rule applied and why

---

## Integration Points

### Integrates With:
- **EV-002 (Ticket Types)**: Extends ticket pricing
- **DISC-001 (Discounts)**: Works alongside promo codes
- **PAY-001 (Payments)**: Price calculation before checkout
- **AN-001 (Analytics)**: Track pricing performance
- **EV-014 (Early Bird)**: Specific implementation of date-based pricing

### Impacts:
- Event creation flow
- Ticket purchase experience
- Cart and checkout
- Revenue reporting
- Marketing campaigns

---

## Success Metrics

- **Adoption Rate**: 50% of events use dynamic pricing within 3 months
- **Revenue Lift**: 20-30% increase in revenue for events using dynamic pricing
- **Early Sales**: 40% of tickets sold during early bird periods
- **Bulk Orders**: 15% increase in average order size with quantity discounts
- **Conversion**: 5% improvement in checkout conversion with urgency indicators

---

## Change Log

| Date | Version | Description | Author |
|------|---------|-------------|---------|
| 2025-09-30 | 1.0 | Initial story creation | BMAD SM Agent |

---

## Dev Agent Record

### Agent Model Used
*To be populated by dev agent*

### Debug Log References
*To be populated by dev agent*

### Completion Notes List
*To be populated by dev agent*

### File List
*To be populated by dev agent*

---

## QA Results
*To be populated by QA agent*