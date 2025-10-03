# Story: EV-013b - Rule UI & Price Display

**Epic**: EPIC-002 - Event Management Core
**Parent Story**: EV-013 - Tiered Pricing Rules (5 pts)
**Story Points**: 2
**Priority**: P2 (Important)
**Status**: Draft
**Dependencies**:
- EV-013a (Pricing rule engine & data model)
- EV-005 (Event detail page)
**Downstream**: None

---

## Story

**As an** event organizer
**I want to** easily create and manage pricing rules through a visual interface
**So that** I can optimize ticket sales without technical complexity

**As a** customer
**I want to** see dynamic pricing and understand why I'm getting a discount
**So that** I feel motivated to purchase and trust the pricing is fair

---

## Acceptance Criteria

1. GIVEN I am editing an event
   WHEN I navigate to "Pricing Rules" tab
   THEN I should see a list of all pricing rules
   AND see a "+Add Pricing Rule" button
   AND rules should be draggable to reorder priority

2. GIVEN I click "Add Pricing Rule"
   WHEN the rule creation modal opens
   THEN I should see:
   - Rule type selector (Early Bird, Capacity-Based, Quantity-Based)
   - Rule name input field
   - Discount configuration (percentage or fixed amount)
   - Date pickers for Early Bird rules
   - Capacity threshold slider for Capacity rules
   - Quantity input for Quantity rules
   - Ticket type multi-select
   - Preview of rule effect

3. GIVEN I configure an Early Bird rule
   WHEN I set dates and discount
   THEN I should see real-time preview: "Customers save $15 until March 15"
   AND I can toggle rule active/inactive
   AND validation prevents invalid date ranges

4. GIVEN I have multiple pricing rules
   WHEN I drag to reorder rules
   THEN priority numbers should update automatically
   AND I should see which rule has highest priority
   AND changes should save immediately

5. GIVEN I test a pricing rule
   WHEN I click "Preview Pricing"
   THEN I should see how prices change based on:
   - Current date simulation
   - Capacity percentage simulation
   - Cart quantity simulation
   AND preview shows original price vs discounted price

6. GIVEN a customer views event pricing
   WHEN a pricing rule applies
   THEN they should see:
   - Original price with strikethrough
   - Discounted price in green
   - Incentive message: "Early Bird Special - Save 25%! Ends in 3 days"
   - Countdown timer if date-based
   - Urgency message if capacity-based: "Only 20 tickets left at this price!"

7. GIVEN a customer adds tickets to cart
   WHEN quantity qualifies for bulk discount
   THEN discount should auto-apply
   AND show message: "Bulk discount applied - Save $50!"
   AND display breakdown of discount

8. GIVEN a pricing rule changes while customer is browsing
   WHEN they refresh or return to cart
   THEN updated pricing should apply
   AND customer should see notification of price change
   AND cart should recalculate automatically

---

## Tasks / Subtasks

- [ ] Create PricingRuleManager component (AC: 1, 2, 3, 4)
  - [ ] Build rule list view with drag-and-drop
  - [ ] Add rule creation modal
  - [ ] Implement rule type selector
  - [ ] Add rule form with conditional fields

- [ ] Build rule configuration forms (AC: 2, 3)
  - [ ] Early Bird form with date range picker
  - [ ] Capacity-based form with threshold slider
  - [ ] Quantity-based form with min quantity input
  - [ ] Discount type selector (percentage/fixed)
  - [ ] Ticket type multi-select dropdown

- [ ] Implement rule priority reordering (AC: 4)
  - [ ] Drag-and-drop functionality (react-beautiful-dnd)
  - [ ] Auto-update priority numbers
  - [ ] Immediate save on reorder
  - [ ] Visual priority indicators

- [ ] Create pricing preview tool (AC: 5)
  - [ ] Date simulation controls
  - [ ] Capacity percentage slider
  - [ ] Quantity input
  - [ ] Price calculation display
  - [ ] Before/after price comparison

- [ ] Build customer-facing price display (AC: 6, 7)
  - [ ] PricingDisplay component
  - [ ] Strikethrough original price
  - [ ] Highlighted discount price
  - [ ] Incentive message generator
  - [ ] Countdown timer for date-based rules
  - [ ] Urgency messaging for capacity rules

- [ ] Add countdown timer component (AC: 6)
  - [ ] Real-time countdown display
  - [ ] Time remaining formatting (days, hours, minutes)
  - [ ] Visual urgency indicators
  - [ ] Auto-update every minute

- [ ] Implement discount messaging system (AC: 6, 7)
  - [ ] Message templates for each rule type
  - [ ] Dynamic message generation
  - [ ] A/B test message variations
  - [ ] Personalized urgency messaging

- [ ] Create cart discount display (AC: 7, 8)
  - [ ] Auto-apply discount on quantity change
  - [ ] Show discount breakdown
  - [ ] Display savings amount
  - [ ] Recalculate on rule changes

- [ ] Add price change notification (AC: 8)
  - [ ] Detect price changes on cart load
  - [ ] Show notification modal if price changed
  - [ ] Explain reason for price change
  - [ ] Update cart automatically

- [ ] Build rule validation UI (AC: 2, 3)
  - [ ] Real-time form validation
  - [ ] Error messages for invalid configurations
  - [ ] Warning for overlapping rules
  - [ ] Confirmation for rule deletion

---

## Dev Notes

### Architecture References

**Component Structure**:
```
src/
├── components/
│   └── pricing/
│       ├── PricingRuleManager.tsx       // Organizer: Rule management
│       ├── PricingRuleForm.tsx          // Organizer: Rule creation/edit
│       ├── PricingRuleList.tsx          // Organizer: Draggable list
│       ├── PricingPreview.tsx           // Organizer: Preview tool
│       ├── CustomerPriceDisplay.tsx     // Customer: Price display
│       ├── DiscountBadge.tsx            // Customer: Discount indicator
│       ├── CountdownTimer.tsx           // Customer: Urgency timer
│       └── DiscountMessage.tsx          // Customer: Incentive messaging
```

**API Endpoints**:
- GET /api/events/[eventId]/pricing - Get active customer pricing
- POST /api/events/[eventId]/pricing-rules/preview - Preview rule effects
- GET /api/cart/pricing - Get cart pricing with applied rules

**Organizer UI Design**:
- Drag-and-drop with visual priority numbers (1, 2, 3...)
- Rule cards showing: Name, Type, Discount, Status, Edit/Delete buttons
- Inline preview of rule effect
- Color coding: Green (active), Gray (inactive), Orange (expiring soon)

**Customer UI Design**:
- Original price: Gray, strikethrough, smaller font
- Discount price: Green, bold, larger font
- Discount badge: Colored pill with discount percentage
- Incentive message: Below price, prominent position
- Countdown: Red/orange gradient for urgency

**Messaging Templates**:
- Early Bird: "Early Bird Special - Save {discount}! Ends {timeRemaining}"
- Capacity: "Only {ticketsLeft} tickets left at this price!"
- Quantity: "Buy {minQty}+ and save {discount} per ticket!"
- Last Chance: "Final hours! {timeRemaining} left at this price"

### Testing

**Test Standards**:
- Test file: `__tests__/pricing/pricing-ui.test.ts`
- E2E test: `e2e/pricing/pricing-rules.spec.ts`

**Testing Requirements**:
- Unit test pricing display component
- Unit test countdown timer accuracy
- Unit test discount message generation
- Test drag-and-drop reordering
- Test rule form validation
- E2E test rule creation flow
- E2E test customer sees correct pricing
- Visual regression test for price display
- Test price change notification

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