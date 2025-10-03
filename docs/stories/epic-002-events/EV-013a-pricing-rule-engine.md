# Story: EV-013a - Pricing Rule Engine & Data Model

**Epic**: EPIC-002 - Event Management Core
**Parent Story**: EV-013 - Tiered Pricing Rules (5 pts)
**Story Points**: 3
**Priority**: P2 (Important)
**Status**: Draft
**Dependencies**:
- EV-003 (Pricing and inventory)
- EV-012b (Session-based ticketing, if applicable)
**Downstream**: EV-013b (Rule UI & price display)

---

## Story

**As an** event organizer
**I want to** define dynamic pricing rules based on date, capacity, or quantity
**So that** I can optimize revenue with early bird pricing, urgency discounts, and volume incentives

---

## Acceptance Criteria

1. GIVEN I am configuring event pricing
   WHEN I enable "Dynamic Pricing"
   THEN I should see pricing rule options:
   - Early Bird (date-based)
   - Capacity-based (percentage sold)
   - Quantity-based (bulk purchase)
   AND I can create multiple rules with priority

2. GIVEN I create an Early Bird rule
   WHEN I specify:
   - Rule name (e.g., "Super Early Bird")
   - Discount amount or percentage
   - Valid from/to dates
   - Applicable ticket types
   THEN rule should validate dates against event date
   AND rule should store with priority 1 (highest)

3. GIVEN I create a Capacity-based rule
   WHEN I specify:
   - Trigger threshold (e.g., "When 80% sold")
   - Price increase/decrease amount
   - Applicable ticket types
   THEN rule should activate when capacity threshold reached
   AND rule should override lower priority rules

4. GIVEN I create a Quantity-based rule
   WHEN I specify:
   - Minimum quantity (e.g., "Buy 10+ tickets")
   - Discount percentage
   - Applicable ticket types
   THEN rule should apply at cart level
   AND discount should calculate on qualifying tickets only

5. GIVEN multiple rules could apply simultaneously
   WHEN system evaluates pricing
   THEN highest priority rule should win
   AND I can manually set rule priority order
   AND system should log which rule was applied

6. GIVEN a rule evaluation occurs
   WHEN customer views pricing or adds to cart
   THEN rule engine should check all active rules
   AND apply best applicable rule
   AND return rule details (name, discount, reason)
   AND evaluation should be performant (<100ms)

---

## Tasks / Subtasks

- [ ] Create pricing_rules database schema (AC: 1, 2, 3, 4)
  - [ ] Add pricing_rules table to Prisma schema
  - [ ] Fields: id, eventId, name, ruleType (EARLY_BIRD, CAPACITY, QUANTITY), discountType (PERCENTAGE, FIXED), discountValue, priority
  - [ ] Add date fields (validFrom, validTo) for date-based rules
  - [ ] Add capacityThreshold for capacity rules
  - [ ] Add minQuantity for quantity rules
  - [ ] Add applicableTicketTypes JSON field
  - [ ] Create indexes for performance

- [ ] Build pricing rule engine service (AC: 5, 6)
  - [ ] pricing-rule-engine.service.ts with evaluation logic
  - [ ] evaluateRules(event, cart, context) method
  - [ ] Priority-based rule resolution
  - [ ] Caching for performance optimization
  - [ ] Rule conflict detection

- [ ] Implement Early Bird rule logic (AC: 2)
  - [ ] Date range validation
  - [ ] Time-based rule activation
  - [ ] Automatic expiration handling
  - [ ] Timezone-aware date checks

- [ ] Implement Capacity-based rule logic (AC: 3)
  - [ ] Real-time capacity calculation
  - [ ] Threshold trigger detection
  - [ ] Dynamic price adjustment
  - [ ] Handle sold ticket count updates

- [ ] Implement Quantity-based rule logic (AC: 4)
  - [ ] Cart-level quantity calculation
  - [ ] Apply discount to qualifying tickets only
  - [ ] Handle mixed ticket types in cart
  - [ ] Validate minimum quantity requirements

- [ ] Create rule validation functions (AC: 2, 3, 4)
  - [ ] Validate rule configuration
  - [ ] Check date ranges
  - [ ] Validate discount values (0-100% or positive amounts)
  - [ ] Ensure no conflicting rules

- [ ] Build pricing rule API endpoints (AC: 1, 2, 3, 4, 5)
  - [ ] POST /api/events/[eventId]/pricing-rules - Create rule
  - [ ] GET /api/events/[eventId]/pricing-rules - List rules
  - [ ] PUT /api/events/[eventId]/pricing-rules/[ruleId] - Update rule
  - [ ] DELETE /api/events/[eventId]/pricing-rules/[ruleId] - Delete rule
  - [ ] PUT /api/events/[eventId]/pricing-rules/reorder - Update priorities
  - [ ] POST /api/events/[eventId]/pricing-rules/evaluate - Test rule evaluation

- [ ] Add rule evaluation logging (AC: 5)
  - [ ] Log which rule was applied to each order
  - [ ] Store applied rule ID in Order model
  - [ ] Track rule performance and usage
  - [ ] Enable organizer analytics on rule effectiveness

---

## Dev Notes

### Architecture References

**Database Schema** (`prisma/schema.prisma`):
```prisma
model PricingRule {
  id                    String   @id @default(cuid())
  eventId               String
  event                 Event    @relation(fields: [eventId], references: [id], onDelete: Cascade)
  name                  String   @db.VarChar(100)
  description           String?  @db.VarChar(500)
  ruleType              PricingRuleType
  discountType          DiscountType
  discountValue         Decimal  @db.Decimal(10, 2)
  priority              Int      @default(100)
  isActive              Boolean  @default(true)

  // Date-based fields
  validFrom             DateTime?
  validTo               DateTime?

  // Capacity-based fields
  capacityThreshold     Int?     // Percentage (0-100)

  // Quantity-based fields
  minQuantity           Int?

  // Applicable ticket types (JSON array of ticket type IDs)
  applicableTicketTypes Json?

  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt

  orders                Order[]  @relation("AppliedPricingRule")

  @@index([eventId, isActive, priority])
  @@index([eventId, ruleType])
}

enum PricingRuleType {
  EARLY_BIRD
  CAPACITY_BASED
  QUANTITY_BASED
  CUSTOM
}

enum DiscountType {
  PERCENTAGE
  FIXED_AMOUNT
}

model Order {
  // ... existing fields
  appliedPricingRuleId  String?
  appliedPricingRule    PricingRule? @relation("AppliedPricingRule", fields: [appliedPricingRuleId], references: [id])
}
```

**Rule Evaluation Algorithm**:
1. Fetch all active rules for event, sorted by priority (ascending)
2. For each rule, check applicability:
   - Early Bird: Check current date against validFrom/validTo
   - Capacity: Calculate tickets_sold / total_capacity percentage
   - Quantity: Check cart item count
3. Filter rules by applicable ticket types
4. Return highest priority applicable rule
5. If no rules apply, return base pricing

**Performance Optimization**:
- Cache pricing rules per event (Redis, 5-minute TTL)
- Precompute capacity percentages (update on ticket sale)
- Index database queries by eventId, isActive, priority
- Target evaluation time: <100ms

**Source Tree**:
```
src/
├── app/
│   └── api/
│       └── events/
│           └── [eventId]/
│               └── pricing-rules/
│                   ├── route.ts
│                   ├── [ruleId]/route.ts
│                   ├── evaluate/route.ts
│                   └── reorder/route.ts
├── lib/
│   └── services/
│       ├── pricing-rule-engine.service.ts
│       └── pricing-rule-validation.service.ts
└── types/
    └── pricing-rule.types.ts
```

### Testing

**Test Standards**:
- Test file: `__tests__/pricing/rule-engine.test.ts`
- Integration test: `__tests__/pricing/rule-evaluation.test.ts`

**Testing Requirements**:
- Unit test each rule type evaluation
- Unit test priority resolution logic
- Unit test rule conflict handling
- Test Early Bird date boundary conditions
- Test Capacity threshold triggers
- Test Quantity discount calculations
- Integration test with cart pricing
- Performance test rule evaluation (<100ms)
- Test caching behavior

---

## Change Log

| Date | Version | Description | Author |
|------|---------|-------------|---------|
| 2025-09-30 | 1.0 | Sharded from EV-013 (Tiered Pricing Rules) | SM Agent |

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