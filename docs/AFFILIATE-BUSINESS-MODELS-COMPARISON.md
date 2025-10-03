# Affiliate Sales Business Models - Comparison Guide

## Side-by-Side Comparison

| Aspect | Pre-Buy Model | Pay-Later Model |
|--------|---------------|-----------------|
| **How It Works** | Affiliate buys tickets upfront at wholesale price | Affiliate sells tickets first, pays organizer later |
| **Money Flow** | Affiliate → Organizer (upfront) | Customer → Affiliate → Organizer (after sale) |
| **Profit/Commission** | Difference between wholesale and retail price | Organizer sets commission % or fixed amount |
| **Risk** | Affiliate (if tickets don't sell) | Organizer (affiliate might not pay) |
| **Inventory** | Affiliate owns specific tickets | Organizer's inventory, allocated to affiliate |
| **Payment Timing** | Before selling | After selling |
| **Best For** | High-trust affiliates, popular events | New affiliates, trial periods |

---

## Detailed Breakdown

### Pre-Buy Model

#### Overview
The affiliate purchases tickets from the organizer at a discounted wholesale price and then sells them to customers at the full retail price. The affiliate keeps the difference as profit.

#### Example Scenario
```
Event: Summer Dance Workshop
Retail Price: $50 per ticket
Wholesale Price: $40 per ticket (20% discount)

Affiliate "Sarah" wants to sell 100 tickets:
1. Sarah pays organizer: 100 × $40 = $4,000 (upfront)
2. Sarah sells all 100 tickets: 100 × $50 = $5,000
3. Sarah's profit: $5,000 - $4,000 = $1,000
4. Profit margin: $10 per ticket (20%)
```

#### Cash Flow Timeline
```
Day 1: Affiliate pays $4,000 → Organizer
Day 15: Affiliate sells 50 tickets → Receives $2,500 from customers
Day 30: Affiliate sells remaining 50 tickets → Receives $2,500 from customers
Day 30: Affiliate's total profit = $1,000
```

#### Advantages
✅ **For Organizer:**
- Guaranteed revenue upfront
- No risk of non-payment
- Cash flow before event
- Simple accounting

✅ **For Affiliate:**
- Higher profit potential
- Full control over pricing (within limits)
- Can offer discounts and still profit
- Clear profit margin

#### Disadvantages
❌ **For Organizer:**
- Must offer discount to incentivize
- Lower per-ticket revenue

❌ **For Affiliate:**
- Upfront capital required
- Risk if tickets don't sell
- No refunds on unsold tickets

#### Implementation Details

**Database Records:**
```typescript
// When affiliate purchases inventory
AffiliateTicketInventory {
  affiliateId: "aff-123"
  eventId: "evt-456"
  ticketTypeId: "tt-789"
  quantityPurchased: 100
  wholesalePrice: 40.00
  retailPrice: 50.00
  totalPaid: 4000.00
  quantitySold: 0
  quantityRemaining: 100
  status: "ACTIVE"
}

// When affiliate sells a ticket
AffiliateSale {
  affiliateId: "aff-123"
  inventoryId: "inv-001"
  saleType: "ONLINE_LINK" or "CASH_OFFLINE"
  ticketCount: 1
  ticketPrice: 50.00
  total: 50.00
  commissionAmount: 10.00  // profit = retail - wholesale
  settlementStatus: "SETTLED"  // Already paid via inventory purchase
}

// Update inventory
AffiliateTicketInventory.quantitySold += 1
AffiliateTicketInventory.quantityRemaining -= 1
```

#### Best Use Cases
- Established affiliates with capital
- Popular/high-demand events
- Affiliates with large networks
- Long sales periods (60+ days before event)

---

### Pay-Later Model

#### Overview
The organizer allows the affiliate to sell tickets without paying upfront. After each sale, the affiliate owes the organizer a wholesale price and keeps the commission.

#### Example Scenario
```
Event: Summer Dance Workshop
Retail Price: $50 per ticket
Wholesale Price: $40 per ticket
Affiliate Commission: $10 per ticket (20%)

Affiliate "Sarah" sells 100 tickets:
1. Sarah sells ticket #1 for $50 → Receives $50 from customer
2. Sarah owes organizer: $40 (wholesale)
3. Sarah keeps commission: $10

After selling 100 tickets:
- Sarah collected: 100 × $50 = $5,000
- Sarah owes organizer: 100 × $40 = $4,000
- Sarah's commission: 100 × $10 = $1,000
```

#### Settlement Options

**Option A: Per-Sale Settlement**
```
Each sale is settled immediately:
- Customer pays affiliate $50
- Affiliate instantly transfers $40 to organizer
- Affiliate keeps $10 commission
```

**Option B: Weekly Settlement**
```
Week 1: 25 tickets sold
- Affiliate collected: $1,250
- Owes organizer: $1,000
- Settlement due: Friday

Week 2: 30 tickets sold
- Affiliate collected: $1,500
- Owes organizer: $1,200
- Settlement due: Friday
```

**Option C: End-of-Period Settlement**
```
All sales settled after event or sales period:
- Total tickets sold: 100
- Affiliate collected: $5,000
- Owes organizer: $4,000
- Settlement due: Event date + 3 days
```

#### Advantages
✅ **For Organizer:**
- Attract more affiliates (no upfront cost)
- Full retail price maintained
- Flexible commission structure
- Control over inventory

✅ **For Affiliate:**
- No upfront capital required
- Lower risk (only market the event)
- Can start immediately
- Test event before committing

#### Disadvantages
❌ **For Organizer:**
- Risk of non-payment
- Delayed revenue
- Need to track settlements
- Potential disputes

❌ **For Affiliate:**
- Lower profit per ticket (if commission < wholesale discount)
- Must settle regularly
- More accounting complexity

#### Implementation Details

**Database Records:**
```typescript
// When affiliate sells a ticket (pay-later)
AffiliateSale {
  affiliateId: "aff-123"
  eventId: "evt-456"
  affiliateLinkId: "link-789"
  saleType: "ONLINE_LINK"
  ticketCount: 1
  ticketPrice: 50.00
  total: 50.00
  commissionAmount: 10.00
  wholesaleOwed: 40.00  // Amount owed to organizer
  settlementStatus: "UNSETTLED"  // Not yet paid
  paymentMethod: "CREDIT_CARD"
}

// When affiliate settles payment
AffiliateSale.settlementStatus = "SETTLED"
AffiliateSale.settledAt = new Date()

// Settlement transaction record
Settlement {
  affiliateId: "aff-123"
  organizerId: "org-456"
  amount: 40.00
  salesIds: ["sale-001"]
  status: "COMPLETED"
}
```

#### Best Use Cases
- New/untrusted affiliates
- Low-risk events
- Short sales periods (< 30 days)
- High-volume affiliate programs
- Test phase for new affiliates

---

## Hybrid Model (Optional)

Some organizers may want to offer both models and let affiliates choose.

### Implementation Strategy

```typescript
// Ticket type configuration
TicketType {
  affiliateEnabled: true
  wholesalePrice: 40.00      // For pre-buy
  affiliateCommission: 10.00 // For pay-later
  allowPreBuy: true
  allowPayLater: true
}

// Affiliate can choose when selling
if (model === "PRE_BUY") {
  // Purchase inventory first
  await purchaseInventory(quantity);
  // Then sell from inventory
}

if (model === "PAY_LATER") {
  // Sell directly
  // Track owed amount
}
```

---

## Commission Structures

### 1. Percentage Commission
```typescript
commissionType: "PERCENTAGE"
commissionValue: 20  // 20% of ticket price

Example:
Ticket Price: $50
Commission: $50 × 20% = $10
```

### 2. Fixed Amount
```typescript
commissionType: "FIXED_AMOUNT"
commissionValue: 8.00  // Fixed $8 per ticket

Example:
Ticket Price: $50
Commission: $8.00 (regardless of price)
```

### 3. Tiered Commission
```typescript
commissionType: "TIERED"

Rules:
- 1-50 tickets:  $8 per ticket (16%)
- 51-100 tickets: $10 per ticket (20%)
- 101+ tickets:   $12 per ticket (24%)

Example (selling 120 tickets):
- First 50: 50 × $8 = $400
- Next 50: 50 × $10 = $500
- Last 20: 20 × $12 = $240
- Total Commission: $1,140
```

### 4. Early Bird Bonus
```typescript
commissionType: "TIERED_TIME"

Rules:
- First 30 days: 25% commission
- Days 31-60: 20% commission
- After 60 days: 15% commission

Example (ticket = $50):
- Sell 40 tickets in first 30 days: 40 × $12.50 = $500
- Sell 30 tickets days 31-60: 30 × $10.00 = $300
- Sell 30 tickets after day 60: 30 × $7.50 = $225
- Total Commission: $1,025
```

---

## Decision Matrix: Which Model to Choose?

### For Organizers

| Choose Pre-Buy If: | Choose Pay-Later If: |
|-------------------|---------------------|
| You need cash flow before event | You want to attract more affiliates |
| You're working with trusted affiliates | You're recruiting new/unknown affiliates |
| Your event is high-demand | Your event needs aggressive marketing |
| You want simple accounting | You're willing to manage settlements |
| You can offer good wholesale discounts | You want to maintain full retail price |

### For Affiliates

| Choose Pre-Buy If: | Choose Pay-Later If: |
|-------------------|---------------------|
| You have upfront capital | You have limited capital |
| You're confident in sales volume | You want to test the event |
| You want higher profit margins | You prefer lower risk |
| You can hold inventory | You want immediate participation |
| You have long selling window | You're new to affiliate sales |

---

## Real-World Examples

### Example 1: Local Dance Studio (Pre-Buy)

**Scenario:**
- Event: Annual Showcase
- Capacity: 500 tickets
- Retail Price: $30
- Affiliate: Dance instructor with 200 students

**Deal:**
```
Wholesale: $24 per ticket (20% discount)
Affiliate buys: 150 tickets = $3,600 upfront
Affiliate sells: 150 tickets = $4,500
Profit: $900 ($6 per ticket)
```

**Why Pre-Buy?**
- Instructor has budget
- Guaranteed audience (students)
- Organizer needs upfront cash for venue

---

### Example 2: Music Festival (Pay-Later)

**Scenario:**
- Event: Summer Music Festival
- Capacity: 10,000 tickets
- Retail Price: $100
- Affiliate: Influencer with 50k followers

**Deal:**
```
Wholesale: $85 per ticket
Commission: $15 per ticket (15%)
Affiliate sells: 500 tickets
Settlement: Weekly (every Friday)

Week 1: Sold 100 tickets
- Collected: $10,000
- Owed: $8,500
- Commission: $1,500

Total after 5 weeks:
- Collected: $50,000
- Owed: $42,500
- Commission: $7,500
```

**Why Pay-Later?**
- Influencer is new/untested
- No upfront cost barrier
- Organizer maintains control
- Weekly settlements reduce risk

---

### Example 3: Hybrid Approach

**Scenario:**
- Event: Dance Workshop Weekend
- Capacity: 200 tickets
- Retail Price: $150

**Two-Tier Affiliate Program:**

**Tier 1 (Trusted Affiliates): Pre-Buy**
```
Wholesale: $120 (20% discount)
Buy upfront, sell anytime
Profit: $30 per ticket
No settlement needed
```

**Tier 2 (New Affiliates): Pay-Later**
```
Wholesale: $135
Commission: $15 per ticket (10%)
Weekly settlement
Lower risk for organizer
```

**Result:**
- Trusted affiliates get better margins (incentive)
- New affiliates can participate (growth)
- Organizer gets upfront cash + expanded reach

---

## Financial Modeling

### Pre-Buy Model: Break-Even Analysis

```
Affiliate Investment: $4,000 (100 tickets × $40)
Retail Price: $50
Break-even: 80 tickets (80 × $50 = $4,000)
Full profit: 100 tickets = $1,000

Scenarios:
- Sell 100%: +$1,000 profit (25% ROI)
- Sell 80%:  $0 profit (break-even)
- Sell 60%:  -$1,000 loss (unsold inventory)
```

### Pay-Later Model: Revenue Split

```
Total Sales: $5,000 (100 tickets × $50)
Organizer gets: $4,000 (80%)
Affiliate gets: $1,000 (20%)

No risk for affiliate
Organizer bears inventory risk
Delayed payment risk for organizer
```

---

## Recommended Configuration

### Starting Configuration (MVP)

```typescript
// In Event configuration
event.affiliateConfig = {
  enabled: true,
  models: ["PAY_LATER"],  // Start with pay-later only
  defaultCommissionType: "PERCENTAGE",
  defaultCommissionValue: 15,  // 15%
  settlementFrequency: "WEEKLY",
  minimumPayout: 25.00,
  autoApproval: false  // Manual approval first
}
```

### Advanced Configuration (After Testing)

```typescript
// After 3 months, add pre-buy
event.affiliateConfig = {
  enabled: true,
  models: ["PRE_BUY", "PAY_LATER"],

  // Pre-buy settings
  wholesaleDiscountPercent: 20,
  minimumPreBuyQuantity: 25,
  maxPreBuyQuantity: 200,

  // Pay-later settings
  commissionTiers: [
    { minSales: 1, maxSales: 50, rate: 10 },
    { minSales: 51, maxSales: 100, rate: 15 },
    { minSales: 101, rate: 20 }
  ],

  settlementFrequency: "BIWEEKLY",
  autoApprovalThreshold: 1000,  // Auto-approve if total sales < $1000
  requiredDeposit: false
}
```

---

## Summary

### Quick Comparison Table

| Feature | Pre-Buy | Pay-Later |
|---------|---------|-----------|
| Upfront Cost | High ($$$) | None ($0) |
| Risk | Affiliate | Organizer |
| Profit/Commission | Higher (20-30%) | Lower (10-20%) |
| Cash Flow | Immediate (organizer) | Delayed (organizer) |
| Complexity | Low | Medium |
| Best For | Experienced affiliates | New affiliates |
| Event Type | Popular/proven | New/experimental |
| Trust Level | High | Any |
| Settlement | Not needed | Weekly/monthly |

---

**Recommendation:** Start with **Pay-Later model** for the MVP to attract maximum affiliates with zero barrier to entry. After 3-6 months, introduce **Pre-Buy model** for top-performing affiliates as an incentive program.

**Next Steps:**
1. Choose starting model (recommend: Pay-Later)
2. Set default commission rate (recommend: 15%)
3. Define settlement frequency (recommend: Weekly)
4. Review full architecture document
5. Begin implementation

**Document Version:** 1.0
**Last Updated:** 2025-10-02
