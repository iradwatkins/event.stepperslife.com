# BILL-006a: Tier Comparison & Upgrade UI

**Parent Story:** BILL-006 - Subscription Tier Management
**Epic:** EPIC-019 - Platform Billing & Revenue
**Story Points:** 2
**Priority:** Medium
**Status:** Ready for Development

## User Story

**As an** event organizer
**I want** to compare subscription tiers and upgrade/downgrade my plan
**So that** I can access features that fit my business needs

## Acceptance Criteria

### AC1: Subscription Tier Comparison Table
- [ ] **Three tiers displayed:**
  - **Free**: $0/month - Basic features
  - **Pro**: $29/month - Advanced features
  - **Enterprise**: $99/month - Full features + support
- [ ] **Comparison table columns:**
  - Feature name (left column)
  - Free tier (checkmark/X/number)
  - Pro tier (checkmark/X/number)
  - Enterprise tier (checkmark/X/number)
- [ ] **Key features compared:**
  - Events per month: Free (3), Pro (20), Enterprise (Unlimited)
  - Tickets per event: Free (100), Pro (500), Enterprise (Unlimited)
  - Custom branding: Free (No), Pro (Yes), Enterprise (Yes)
  - Analytics dashboard: Free (Basic), Pro (Advanced), Enterprise (Advanced + Export)
  - Email support: Free (Community), Pro (Email), Enterprise (Priority + Phone)
  - Transaction fees: Free (3.5% + $0.50), Pro (2.9% + $0.50), Enterprise (2.5% + $0.50)
- [ ] **Current tier highlighted** with badge: "Current Plan"
- [ ] **Popular tier badge** on Pro plan
- [ ] Mobile responsive: Horizontal scroll or vertical stack

### AC2: Upgrade/Downgrade Flow
- [ ] **Upgrade buttons:**
  - "Upgrade to Pro" button on Free tier card
  - "Upgrade to Enterprise" button on Pro tier card
  - Disabled button on current tier
- [ ] **Upgrade modal:**
  - Confirms tier selection
  - Shows new monthly price
  - Prorated charge displayed: "You'll pay $15.00 today (prorated)"
  - Payment method selector (if multiple cards saved)
  - Checkbox: "I agree to the terms and conditions"
  - "Confirm Upgrade" button
- [ ] **Downgrade warnings:**
  - "Downgrade to Free" button with warning icon
  - Modal warns: "You'll lose access to: [list features]"
  - Confirm downgrade requires typing "DOWNGRADE"
  - Effective date shown: "Takes effect at end of billing period"

### AC3: Trial Period Management
- [ ] **14-day free trial** for Pro and Enterprise tiers
- [ ] Trial badge displayed: "14 days left in trial"
- [ ] Trial banner: "Your trial ends on Jan 30. Upgrade to keep features."
- [ ] Trial expiration countdown: "7 days remaining"
- [ ] Post-trial: Auto-downgrade to Free if no payment method
- [ ] Email reminders: 7 days, 3 days, 1 day before trial ends

### AC4: Billing Cycle & Payment
- [ ] **Billing cycle options:**
  - Monthly (default)
  - Annual (save 20%): Pro $278/year, Enterprise $950/year
  - Toggle switch to compare pricing
- [ ] **Payment method management:**
  - Add credit/debit card (Stripe Elements)
  - Display saved cards: "Visa •••• 4242"
  - Set default payment method
  - Remove card option
- [ ] **Invoice generation:**
  - Auto-generate invoice on each billing cycle
  - Download invoice as PDF
  - Email invoice to organizer
  - Invoice includes: Plan name, Billing period, Amount, Tax

### AC5: Subscription Status Display
- [ ] **Current plan card:**
  - Plan name and price
  - Next billing date: "Next payment: Feb 1, 2025"
  - Payment method: "Visa •••• 4242"
  - "Manage Subscription" button
- [ ] **Usage metrics (for current billing period):**
  - Events created: 8 / 20
  - Tickets sold: 450 / 10,000
  - Progress bars for limits
  - Warning if approaching limit: "You've used 90% of your events"
- [ ] **Subscription actions:**
  - Update payment method
  - Change billing cycle (monthly ↔ annual)
  - Cancel subscription
  - View billing history

## Technical Implementation

**File:** `/components/billing/SubscriptionComparison.tsx`
```typescript
const PLANS = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    annualPrice: 0,
    features: {
      eventsPerMonth: 3,
      ticketsPerEvent: 100,
      customBranding: false,
      analytics: 'basic',
      support: 'community',
      transactionFee: 0.035,
    },
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 29,
    annualPrice: 278,
    popular: true,
    features: {
      eventsPerMonth: 20,
      ticketsPerEvent: 500,
      customBranding: true,
      analytics: 'advanced',
      support: 'email',
      transactionFee: 0.029,
    },
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 99,
    annualPrice: 950,
    features: {
      eventsPerMonth: 'unlimited',
      ticketsPerEvent: 'unlimited',
      customBranding: true,
      analytics: 'advanced + export',
      support: 'priority + phone',
      transactionFee: 0.025,
    },
  },
];

export function SubscriptionComparison({ currentPlan }: { currentPlan: string }) {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');

  return (
    <div className="space-y-6">
      {/* Billing Cycle Toggle */}
      <div className="flex items-center justify-center gap-3">
        <span className={billingCycle === 'monthly' ? 'font-semibold' : 'text-gray-600'}>
          Monthly
        </span>
        <Switch checked={billingCycle === 'annual'} onChange={(checked) => setBillingCycle(checked ? 'annual' : 'monthly')} />
        <span className={billingCycle === 'annual' ? 'font-semibold' : 'text-gray-600'}>
          Annual <Badge variant="success">Save 20%</Badge>
        </span>
      </div>

      {/* Plan Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {PLANS.map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            billingCycle={billingCycle}
            isCurrent={currentPlan === plan.id}
            onUpgrade={() => handleUpgrade(plan.id)}
          />
        ))}
      </div>

      {/* Feature Comparison Table */}
      <FeatureComparisonTable plans={PLANS} currentPlan={currentPlan} />
    </div>
  );
}

function PlanCard({ plan, billingCycle, isCurrent, onUpgrade }: any) {
  const price = billingCycle === 'monthly' ? plan.price : plan.annualPrice / 12;

  return (
    <div className={`border-2 rounded-lg p-6 ${isCurrent ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}>
      {plan.popular && <Badge variant="primary" className="mb-2">Most Popular</Badge>}
      {isCurrent && <Badge variant="success" className="mb-2">Current Plan</Badge>}

      <h3 className="text-2xl font-bold">{plan.name}</h3>
      <div className="my-4">
        <span className="text-4xl font-bold">${price.toFixed(0)}</span>
        <span className="text-gray-600">/month</span>
      </div>

      <ul className="space-y-2 mb-6">
        <li className="flex items-center gap-2">
          <CheckIcon className="w-5 h-5 text-green-500" />
          {plan.features.eventsPerMonth} events/month
        </li>
        <li className="flex items-center gap-2">
          <CheckIcon className="w-5 h-5 text-green-500" />
          {plan.features.ticketsPerEvent} tickets/event
        </li>
        <li className="flex items-center gap-2">
          {plan.features.customBranding ? (
            <CheckIcon className="w-5 h-5 text-green-500" />
          ) : (
            <XIcon className="w-5 h-5 text-gray-400" />
          )}
          Custom branding
        </li>
      </ul>

      <Button
        onClick={onUpgrade}
        disabled={isCurrent}
        variant={plan.popular ? 'primary' : 'secondary'}
        className="w-full"
      >
        {isCurrent ? 'Current Plan' : `Upgrade to ${plan.name}`}
      </Button>
    </div>
  );
}
```

**File:** `/app/api/billing/subscriptions/upgrade/route.ts`
```typescript
export async function POST(request: Request) {
  const session = await getServerSession();
  const { planId, billingCycle } = await request.json();

  const subscription = await subscriptionService.upgradePlan({
    userId: session.user.id,
    newPlanId: planId,
    billingCycle,
  });

  return NextResponse.json({ success: true, subscription });
}
```

## Testing Requirements

```typescript
describe('SubscriptionComparison', () => {
  it('displays all three tiers', () => {
    render(<SubscriptionComparison currentPlan="free" />);
    expect(screen.getByText('Free')).toBeInTheDocument();
    expect(screen.getByText('Pro')).toBeInTheDocument();
    expect(screen.getByText('Enterprise')).toBeInTheDocument();
  });

  it('highlights current plan', () => {
    render(<SubscriptionComparison currentPlan="pro" />);
    expect(screen.getByText('Current Plan')).toBeInTheDocument();
  });

  it('shows prorated charge on upgrade', async () => {
    render(<SubscriptionComparison currentPlan="free" />);
    await userEvent.click(screen.getByText('Upgrade to Pro'));
    expect(screen.getByText(/prorated/i)).toBeInTheDocument();
  });
});
```

## Definition of Done

- [ ] Tier comparison table complete
- [ ] Upgrade/downgrade flow working
- [ ] Trial period management implemented
- [ ] Payment method integration done
- [ ] Unit tests pass
- [ ] E2E tests pass
- [ ] Code reviewed and approved