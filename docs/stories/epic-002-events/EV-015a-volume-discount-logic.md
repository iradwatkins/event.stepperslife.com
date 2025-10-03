# Story: EV-015a - Volume Discount Logic & API

**Epic**: EPIC-002 - Event Management Core
**Parent Story**: EV-015 - Group Booking Discounts (5 pts)
**Story Points**: 2
**Priority**: P2 (Important)
**Status**: Draft
**Dependencies**:
- EV-003 (Pricing and inventory)
- PAY-001 (Checkout flow)
**Downstream**: EV-015b (Group coordinator & assignment)

---

## Story

**As an** event organizer
**I want to** offer volume discounts for group bookings
**So that** I can incentivize bulk purchases and increase overall ticket sales

---

## Acceptance Criteria

1. GIVEN I am configuring event pricing
   WHEN I enable "Group Booking Discounts"
   THEN I should see discount tier configuration
   AND I can add multiple quantity tiers (e.g., 10-19, 20-49, 50+)
   AND each tier has a discount percentage or fixed amount

2. GIVEN I create a discount tier
   WHEN I specify:
   - Minimum quantity (e.g., 10 tickets)
   - Maximum quantity (e.g., 19 tickets, or unlimited)
   - Discount type (percentage or fixed per ticket)
   - Discount value
   THEN tier should validate no overlap with other tiers
   AND tier should save successfully

3. GIVEN a customer adds tickets to cart
   WHEN cart quantity reaches a discount tier threshold
   THEN discount should automatically apply
   AND cart should show: "10+ tickets - 15% group discount applied"
   AND discount should apply to all tickets in the group

4. GIVEN a customer has 9 tickets in cart
   WHEN they add 1 more ticket
   THEN discount should trigger on reaching 10 tickets
   AND total price should recalculate
   AND savings amount should display

5. GIVEN multiple discount tiers exist
   WHEN cart quantity qualifies for multiple tiers
   THEN highest applicable discount tier should apply
   AND system should automatically upgrade to better tier
   AND customer should see tier upgrade notification

6. GIVEN a discount tier is applied
   WHEN customer removes tickets and drops below threshold
   THEN discount should automatically remove
   AND cart should recalculate without discount
   AND customer should see notification of discount removal

7. GIVEN group discount conflicts with pricing rules (EV-013)
   WHEN both could apply
   THEN system should apply whichever gives better discount
   AND show only one discount in cart
   AND organizer can set conflict resolution preference

---

## Tasks / Subtasks

- [ ] Create group_discount_tiers database schema (AC: 1, 2)
  - [ ] Add group_discount_tiers table to Prisma schema
  - [ ] Fields: id, eventId, minQuantity, maxQuantity, discountType, discountValue, isActive
  - [ ] Add validation for tier overlaps
  - [ ] Create indexes for performance

- [ ] Build discount tier CRUD API (AC: 1, 2)
  - [ ] POST /api/events/[eventId]/group-discounts - Create tier
  - [ ] GET /api/events/[eventId]/group-discounts - List tiers
  - [ ] PUT /api/events/[eventId]/group-discounts/[tierId] - Update tier
  - [ ] DELETE /api/events/[eventId]/group-discounts/[tierId] - Delete tier
  - [ ] Validate tier configuration on create/update

- [ ] Implement discount calculation service (AC: 3, 4, 5, 6)
  - [ ] group-discount.service.ts with calculation logic
  - [ ] calculateGroupDiscount(cart, tiers) method
  - [ ] Select highest applicable tier
  - [ ] Apply discount to all qualifying tickets
  - [ ] Return discount details

- [ ] Add cart-level discount application (AC: 3, 4, 5, 6)
  - [ ] Integrate with cart calculation logic
  - [ ] Auto-apply discount on quantity change
  - [ ] Auto-remove discount when below threshold
  - [ ] Recalculate cart totals with discount

- [ ] Implement tier validation logic (AC: 2)
  - [ ] Check for overlapping quantity ranges
  - [ ] Validate minQuantity < maxQuantity
  - [ ] Ensure positive discount values
  - [ ] Prevent duplicate tiers

- [ ] Create discount conflict resolution (AC: 7)
  - [ ] Compare group discount vs pricing rules (EV-013)
  - [ ] Apply best discount for customer
  - [ ] Store conflict resolution preference in Event model
  - [ ] Log applied discount source

- [ ] Build discount evaluation API (AC: 3, 4, 5)
  - [ ] POST /api/cart/evaluate-discounts - Get applicable discounts
  - [ ] Return all qualifying discounts
  - [ ] Return recommended best discount
  - [ ] Return tier upgrade opportunities

- [ ] Add discount tracking in orders (AC: 3, 7)
  - [ ] Store applied group discount tier ID in Order
  - [ ] Track original price vs discounted price
  - [ ] Log discount source (group tier vs pricing rule)
  - [ ] Enable organizer discount analytics

---

## Dev Notes

### Architecture References

**Database Schema** (`prisma/schema.prisma`):
```prisma
model GroupDiscountTier {
  id              String   @id @default(cuid())
  eventId         String
  event           Event    @relation(fields: [eventId], references: [id], onDelete: Cascade)
  name            String   @db.VarChar(100)  // e.g., "Small Group", "Large Group"
  minQuantity     Int                        // Minimum tickets to qualify
  maxQuantity     Int?                       // Maximum tickets (null = unlimited)
  discountType    DiscountType               // PERCENTAGE or FIXED_AMOUNT
  discountValue   Decimal  @db.Decimal(10, 2)
  isActive        Boolean  @default(true)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  orders          Order[]  @relation("AppliedGroupDiscount")

  @@index([eventId, isActive])
  @@index([eventId, minQuantity])
}

model Event {
  // ... existing fields
  groupDiscountConflictResolution  ConflictResolution  @default(BEST_FOR_CUSTOMER)
}

enum ConflictResolution {
  BEST_FOR_CUSTOMER    // Apply whichever discount is higher
  PRICING_RULE_PRIORITY // Always prefer pricing rules
  GROUP_DISCOUNT_PRIORITY // Always prefer group discounts
}

model Order {
  // ... existing fields
  appliedGroupDiscountId  String?
  appliedGroupDiscount    GroupDiscountTier? @relation("AppliedGroupDiscount", fields: [appliedGroupDiscountId], references: [id])
  discountSource          String?  // "GROUP_TIER" or "PRICING_RULE"
}
```

**Discount Calculation Logic**:
```typescript
function calculateGroupDiscount(cart: Cart, tiers: GroupDiscountTier[]) {
  const totalQuantity = cart.items.reduce((sum, item) => sum + item.quantity, 0);

  // Find all qualifying tiers
  const qualifyingTiers = tiers.filter(tier =>
    tier.isActive &&
    totalQuantity >= tier.minQuantity &&
    (tier.maxQuantity === null || totalQuantity <= tier.maxQuantity)
  );

  // Select highest discount tier
  const bestTier = qualifyingTiers.reduce((best, tier) => {
    const tierDiscount = calculateTierDiscount(cart, tier);
    const bestDiscount = calculateTierDiscount(cart, best);
    return tierDiscount > bestDiscount ? tier : best;
  }, qualifyingTiers[0]);

  return {
    tier: bestTier,
    discountAmount: calculateTierDiscount(cart, bestTier),
    originalTotal: cart.subtotal,
    discountedTotal: cart.subtotal - calculateTierDiscount(cart, bestTier)
  };
}
```

**API Response Format**:
```json
{
  "appliedDiscount": {
    "type": "GROUP_TIER",
    "tierId": "tier_123",
    "tierName": "Large Group",
    "minQuantity": 20,
    "discountType": "PERCENTAGE",
    "discountValue": 20,
    "discountAmount": 150.00,
    "savings": "$150.00 saved!"
  },
  "nextTier": {
    "minQuantity": 50,
    "potentialSavings": "$250.00",
    "message": "Buy 30 more tickets and save an additional $100!"
  }
}
```

**Source Tree**:
```
src/
├── app/
│   └── api/
│       ├── events/
│       │   └── [eventId]/
│       │       └── group-discounts/
│       │           ├── route.ts
│       │           └── [tierId]/route.ts
│       └── cart/
│           └── evaluate-discounts/
│               └── route.ts
├── lib/
│   └── services/
│       ├── group-discount.service.ts
│       └── discount-conflict-resolver.service.ts
└── types/
    └── group-discount.types.ts
```

### Testing

**Test Standards**:
- Test file: `__tests__/discounts/group-discount.test.ts`
- Integration test: `__tests__/discounts/discount-application.test.ts`

**Testing Requirements**:
- Unit test tier qualification logic
- Unit test discount calculation for each type
- Unit test tier overlap validation
- Unit test best tier selection
- Unit test discount conflict resolution
- Integration test with cart pricing
- Test auto-apply on quantity change
- Test auto-remove on quantity decrease
- Test edge cases (exactly at threshold, max quantity)

---

## Change Log

| Date | Version | Description | Author |
|------|---------|-------------|---------|
| 2025-09-30 | 1.0 | Sharded from EV-015 (Group Booking Discounts) | SM Agent |

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