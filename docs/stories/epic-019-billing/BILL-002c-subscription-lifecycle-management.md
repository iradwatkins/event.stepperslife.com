# BILL-002c: Subscription Lifecycle Management

**Epic:** EPIC-019 - Platform Billing & Revenue
**Parent Story:** BILL-002 - White-Label Subscription Billing
**Story Points:** 2
**Priority:** P1 (High)
**Status:** Ready for Development

## Parent Story Context

This is **Part 3 of 3** of the White-Label Subscription Billing story (BILL-002). This sub-story focuses on managing the complete subscription lifecycle including upgrades, downgrades, cancellations, renewals, and reactivations.

**Total Parent Story Points:** 8
**This Sub-Story:** 2 points

**Dependencies:**
- BILL-002a: Subscription Plan Setup & Database Schema (MUST complete first)
- BILL-002b: Stripe Billing Integration (MUST complete first)

## User Story

**As an** event organizer
**I want** to upgrade, downgrade, or cancel my subscription as my needs change
**So that** I can optimize my subscription costs and feature access

## Acceptance Criteria

### Primary Criteria
- [ ] Upgrade subscription with immediate proration
- [ ] Downgrade subscription (effective at period end)
- [ ] Cancel subscription with two options: immediate or end-of-period
- [ ] Reactivate canceled subscription before period end
- [ ] Trial-to-paid conversion automated
- [ ] Subscription renewal automated
- [ ] Email notifications for all lifecycle events

### Upgrade/Downgrade Criteria
- [ ] Proration calculated accurately for upgrades
- [ ] Credit applied for downgrades
- [ ] Feature access updated immediately on upgrade
- [ ] Feature access retained until period end on downgrade
- [ ] Tier change audit trail maintained
- [ ] Payment confirmation for upgrade charges

### Cancellation Criteria
- [ ] Cancellation reason captured (optional)
- [ ] Access continues until period end (default)
- [ ] Immediate cancellation with prorated refund (optional)
- [ ] Subscription marked as canceled in database
- [ ] Feature access revoked at appropriate time
- [ ] Cancellation confirmation email sent

### Renewal Criteria
- [ ] Automatic renewal 30 days before period end
- [ ] Payment retry logic for failed renewals
- [ ] Renewal reminder email (7 days before)
- [ ] Grace period for failed payments (7 days)
- [ ] Subscription canceled after max retry attempts

## Technical Specifications

### Subscription Lifecycle Service

**File:** `lib/services/subscription-lifecycle.service.ts`

```typescript
import { stripe } from '@/lib/config/stripe.config'
import { PrismaClient, SubscriptionTier } from '@prisma/client'
import { stripeSubscriptionService } from './stripe-subscription.service'
import Stripe from 'stripe'

const prisma = new PrismaClient()

export class SubscriptionLifecycleService {
  /**
   * Upgrade subscription to higher tier
   */
  async upgradeSubscription(
    subscriptionId: string,
    newTier: SubscriptionTier,
    userId: string
  ) {
    const subscription = await prisma.subscription.findUnique({
      where: { id: subscriptionId }
    })

    if (!subscription) {
      throw new Error('Subscription not found')
    }

    if (!subscription.stripeSubscriptionId) {
      throw new Error('No Stripe subscription associated')
    }

    // Verify tier is higher
    const tierOrder = ['FREE', 'BASIC', 'PRO', 'ENTERPRISE']
    const currentIndex = tierOrder.indexOf(subscription.tier)
    const newIndex = tierOrder.indexOf(newTier)

    if (newIndex <= currentIndex) {
      throw new Error('New tier must be higher than current tier')
    }

    // Get new price ID
    const newPlan = await prisma.subscriptionPlan.findUnique({
      where: { tier: newTier }
    })

    if (!newPlan?.stripePriceIdMonthly) {
      throw new Error('Invalid subscription plan')
    }

    // Calculate proration preview
    const proration = await this.calculateProration(
      subscription.stripeSubscriptionId,
      newPlan.stripePriceIdMonthly
    )

    // Update subscription in Stripe
    const stripeSubscription = await stripe.subscriptions.update(
      subscription.stripeSubscriptionId,
      {
        items: [
          {
            id: (await stripe.subscriptions.retrieve(subscription.stripeSubscriptionId))
              .items.data[0].id,
            price: newPlan.stripePriceIdMonthly
          }
        ],
        proration_behavior: 'always_invoice',
        metadata: {
          userId,
          tier: newTier,
          previousTier: subscription.tier
        }
      }
    )

    // Update subscription in database
    const updatedSubscription = await prisma.subscription.update({
      where: { id: subscriptionId },
      data: {
        tier: newTier,
        stripePriceId: newPlan.stripePriceIdMonthly
      }
    })

    // Log upgrade event
    await prisma.subscriptionEvent.create({
      data: {
        subscriptionId,
        eventType: 'upgraded',
        fromTier: subscription.tier,
        toTier: newTier,
        immediateCharge: proration.immediateCharge,
        proratedAmount: proration.proratedAmount,
        triggeredBy: userId,
        reason: 'User initiated upgrade'
      }
    })

    // Send upgrade confirmation email
    // TODO: Integrate with email service

    return {
      subscription: updatedSubscription,
      proration
    }
  }

  /**
   * Downgrade subscription to lower tier
   */
  async downgradeSubscription(
    subscriptionId: string,
    newTier: SubscriptionTier,
    userId: string
  ) {
    const subscription = await prisma.subscription.findUnique({
      where: { id: subscriptionId }
    })

    if (!subscription) {
      throw new Error('Subscription not found')
    }

    if (!subscription.stripeSubscriptionId) {
      throw new Error('No Stripe subscription associated')
    }

    // Verify tier is lower
    const tierOrder = ['FREE', 'BASIC', 'PRO', 'ENTERPRISE']
    const currentIndex = tierOrder.indexOf(subscription.tier)
    const newIndex = tierOrder.indexOf(newTier)

    if (newIndex >= currentIndex) {
      throw new Error('New tier must be lower than current tier')
    }

    // Get new price ID
    const newPlan = await prisma.subscriptionPlan.findUnique({
      where: { tier: newTier }
    })

    if (newTier !== 'FREE' && !newPlan?.stripePriceIdMonthly) {
      throw new Error('Invalid subscription plan')
    }

    if (newTier === 'FREE') {
      // Downgrade to FREE = cancel subscription at period end
      return this.cancelSubscription(subscriptionId, false, userId, 'Downgrade to FREE tier')
    }

    // Schedule downgrade at period end (no immediate charge)
    const stripeSubscription = await stripe.subscriptions.update(
      subscription.stripeSubscriptionId,
      {
        items: [
          {
            id: (await stripe.subscriptions.retrieve(subscription.stripeSubscriptionId))
              .items.data[0].id,
            price: newPlan.stripePriceIdMonthly!
          }
        ],
        proration_behavior: 'none', // No immediate charge
        metadata: {
          userId,
          tier: newTier,
          previousTier: subscription.tier,
          scheduledDowngrade: 'true'
        }
      }
    )

    // Log downgrade event
    await prisma.subscriptionEvent.create({
      data: {
        subscriptionId,
        eventType: 'downgraded',
        fromTier: subscription.tier,
        toTier: newTier,
        triggeredBy: userId,
        reason: 'User initiated downgrade',
        metadata: {
          effectiveDate: subscription.currentPeriodEnd.toISOString()
        }
      }
    })

    // Send downgrade confirmation email
    // TODO: Integrate with email service

    return {
      subscription,
      effectiveDate: subscription.currentPeriodEnd,
      message: 'Downgrade will take effect at the end of current billing period'
    }
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(
    subscriptionId: string,
    immediately: boolean = false,
    userId: string,
    reason?: string
  ) {
    const subscription = await prisma.subscription.findUnique({
      where: { id: subscriptionId }
    })

    if (!subscription) {
      throw new Error('Subscription not found')
    }

    if (!subscription.stripeSubscriptionId) {
      throw new Error('No Stripe subscription associated')
    }

    let accessUntil: Date
    let refundAmount: number | null = null

    if (immediately) {
      // Cancel immediately with prorated refund
      const stripeSubscription = await stripe.subscriptions.cancel(
        subscription.stripeSubscriptionId,
        {
          prorate: true,
          invoice_now: true
        }
      )

      // Calculate refund
      const daysRemaining = Math.ceil(
        (subscription.currentPeriodEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      )
      const totalDays = Math.ceil(
        (subscription.currentPeriodEnd.getTime() - subscription.currentPeriodStart.getTime()) /
        (1000 * 60 * 60 * 24)
      )
      const refundPercentage = daysRemaining / totalDays
      refundAmount = subscription.lastPaymentAmount
        ? Number(subscription.lastPaymentAmount) * refundPercentage
        : 0

      accessUntil = new Date()

      // Update subscription status
      await prisma.subscription.update({
        where: { id: subscriptionId },
        data: {
          status: 'CANCELED',
          canceledAt: new Date(),
          cancelAtPeriodEnd: false
        }
      })
    } else {
      // Cancel at period end
      await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
        cancel_at_period_end: true,
        metadata: {
          cancelReason: reason || 'User requested'
        }
      })

      accessUntil = subscription.currentPeriodEnd

      // Update subscription
      await prisma.subscription.update({
        where: { id: subscriptionId },
        data: {
          cancelAtPeriodEnd: true
        }
      })
    }

    // Log cancellation event
    await prisma.subscriptionEvent.create({
      data: {
        subscriptionId,
        eventType: 'canceled',
        fromTier: subscription.tier,
        fromStatus: subscription.status,
        toStatus: immediately ? 'CANCELED' : subscription.status,
        triggeredBy: userId,
        reason: reason || 'User requested cancellation',
        metadata: {
          immediately,
          refundAmount,
          accessUntil: accessUntil.toISOString()
        }
      }
    })

    // Send cancellation confirmation email
    // TODO: Integrate with email service

    return {
      subscription,
      accessUntil,
      refundAmount,
      message: immediately
        ? 'Subscription canceled immediately'
        : 'Subscription will be canceled at the end of current billing period'
    }
  }

  /**
   * Reactivate canceled subscription (before period end)
   */
  async reactivateSubscription(subscriptionId: string, userId: string) {
    const subscription = await prisma.subscription.findUnique({
      where: { id: subscriptionId }
    })

    if (!subscription) {
      throw new Error('Subscription not found')
    }

    if (!subscription.cancelAtPeriodEnd) {
      throw new Error('Subscription is not scheduled for cancellation')
    }

    if (subscription.status === 'CANCELED') {
      throw new Error('Cannot reactivate fully canceled subscription')
    }

    if (!subscription.stripeSubscriptionId) {
      throw new Error('No Stripe subscription associated')
    }

    // Reactivate in Stripe
    await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
      cancel_at_period_end: false
    })

    // Update subscription
    const updatedSubscription = await prisma.subscription.update({
      where: { id: subscriptionId },
      data: {
        cancelAtPeriodEnd: false
      }
    })

    // Log reactivation event
    await prisma.subscriptionEvent.create({
      data: {
        subscriptionId,
        eventType: 'reactivated',
        fromStatus: subscription.status,
        toStatus: 'ACTIVE',
        triggeredBy: userId,
        reason: 'User reactivated subscription'
      }
    })

    // Send reactivation confirmation email
    // TODO: Integrate with email service

    return updatedSubscription
  }

  /**
   * Calculate proration for upgrade
   */
  async calculateProration(
    stripeSubscriptionId: string,
    newPriceId: string
  ): Promise<{
    proratedAmount: number
    immediateCharge: number
    creditApplied: number
  }> {
    const stripeSubscription = await stripe.subscriptions.retrieve(stripeSubscriptionId)

    const upcomingInvoice = await stripe.invoices.retrieveUpcoming({
      customer: typeof stripeSubscription.customer === 'string'
        ? stripeSubscription.customer
        : stripeSubscription.customer.id,
      subscription: stripeSubscriptionId,
      subscription_items: [
        {
          id: stripeSubscription.items.data[0].id,
          price: newPriceId
        }
      ],
      subscription_proration_behavior: 'always_invoice'
    })

    const proratedAmount = upcomingInvoice.lines.data
      .filter(line => line.proration)
      .reduce((sum, line) => sum + line.amount, 0) / 100

    const immediateCharge = (upcomingInvoice.amount_due || 0) / 100

    const creditApplied = Math.abs(
      upcomingInvoice.lines.data
        .filter(line => line.amount < 0)
        .reduce((sum, line) => sum + line.amount, 0)
    ) / 100

    return {
      proratedAmount,
      immediateCharge,
      creditApplied
    }
  }

  /**
   * Handle trial ending (convert to paid or cancel)
   */
  async handleTrialEnding(subscriptionId: string) {
    const subscription = await prisma.subscription.findUnique({
      where: { id: subscriptionId }
    })

    if (!subscription || subscription.status !== 'TRIAL') {
      return
    }

    // Trial will automatically convert to paid by Stripe
    // Send reminder email 3 days before trial ends
    const daysUntilEnd = subscription.trialEnd
      ? Math.ceil((subscription.trialEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      : 0

    if (daysUntilEnd === 3) {
      // Send trial ending reminder
      // TODO: Integrate with email service
    }
  }
}

export const subscriptionLifecycleService = new SubscriptionLifecycleService()
```

## API Endpoints

**POST /api/subscriptions/:id/upgrade**
```typescript
// Upgrade subscription
Request: {
  newTier: SubscriptionTier
}

Response: {
  subscription: Subscription
  proration: {
    proratedAmount: number
    immediateCharge: number
    creditApplied: number
  }
}
```

**POST /api/subscriptions/:id/downgrade**
```typescript
// Downgrade subscription
Request: {
  newTier: SubscriptionTier
}

Response: {
  subscription: Subscription
  effectiveDate: string
  message: string
}
```

**POST /api/subscriptions/:id/cancel**
```typescript
// Cancel subscription
Request: {
  immediately?: boolean
  reason?: string
}

Response: {
  subscription: Subscription
  accessUntil: string
  refundAmount?: number
  message: string
}
```

**POST /api/subscriptions/:id/reactivate**
```typescript
// Reactivate canceled subscription
Response: {
  subscription: Subscription
  message: string
}
```

**GET /api/subscriptions/:id/proration-preview**
```typescript
// Preview proration for upgrade
Query: {
  newTier: SubscriptionTier
}

Response: {
  currentTier: SubscriptionTier
  newTier: SubscriptionTier
  proratedAmount: number
  immediateCharge: number
  creditApplied: number
  effectiveDate: string
}
```

## Business Rules

### Proration Logic

**Upgrade (Mid-cycle):**
```
Current tier: BASIC ($10/month)
New tier: PRO ($50/month)
Days into cycle: 15 of 30

Calculation:
- Credit for unused BASIC: $10 * (15/30) = $5.00
- Charge for new PRO period: $50
- Prorated charge: $50 - $5 = $45.00 (charged immediately)
```

**Downgrade:**
```
Current tier: PRO ($50/month)
New tier: BASIC ($10/month)

Behavior:
- No immediate charge
- Continue PRO access until period end
- Next billing: $10/month for BASIC tier
```

### Cancellation Policy

1. **End of Period (Default):**
   - Access continues until current period ends
   - No refund issued
   - Subscription status remains ACTIVE until period end

2. **Immediate:**
   - Access revoked immediately
   - Prorated refund calculated and issued
   - Subscription status changed to CANCELED

### Trial Conversion

- Trial ends automatically on trial_end date
- First payment attempted by Stripe
- If payment succeeds: Status → ACTIVE
- If payment fails: Status → INCOMPLETE, retry 3x
- After 3 failures: Status → CANCELED

### Payment Failure Handling

1. **Day 0**: Payment fails, status → PAST_DUE
2. **Day 1**: Retry attempt 1
3. **Day 3**: Retry attempt 2
4. **Day 5**: Retry attempt 3
5. **Day 7**: Final warning email
6. **Day 10**: Cancel subscription, revoke access

## Testing Requirements

### Unit Tests
- [ ] Upgrade proration calculation
- [ ] Downgrade scheduling
- [ ] Cancellation logic (immediate vs end-of-period)
- [ ] Reactivation validation
- [ ] Trial conversion logic

### Integration Tests
- [ ] Full upgrade flow with Stripe
- [ ] Full downgrade flow with Stripe
- [ ] Cancellation and reactivation flow
- [ ] Payment failure retry sequence
- [ ] Trial-to-paid conversion

### E2E Tests
- [ ] User upgrades from Basic to Pro
- [ ] User downgrades from Pro to Basic
- [ ] User cancels subscription (both options)
- [ ] User reactivates before period end
- [ ] Trial expires and converts to paid

## Dependencies

- BILL-002a: Subscription Plan Setup (MUST complete first)
- BILL-002b: Stripe Billing Integration (MUST complete first)
- Email service configured

## Definition of Done

- [ ] Upgrade functionality implemented
- [ ] Downgrade functionality implemented
- [ ] Cancellation functionality implemented
- [ ] Reactivation functionality implemented
- [ ] Proration calculation accurate
- [ ] All lifecycle events logged
- [ ] Email notifications sent
- [ ] API endpoints functional
- [ ] All tests passing
- [ ] Documentation written

## Notes

**Proration Accuracy**: Stripe handles proration calculations. We retrieve the preview to display to users before confirming.

**Feature Access**: Feature gates should check subscription status and tier. Access continues until effective date of downgrade/cancellation.

**Audit Trail**: All lifecycle changes logged in subscription_events table for compliance and customer support.