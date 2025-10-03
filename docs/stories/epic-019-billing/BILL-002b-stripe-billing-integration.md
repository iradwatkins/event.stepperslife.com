# BILL-002b: Stripe Billing Integration

**Epic:** EPIC-019 - Platform Billing & Revenue
**Parent Story:** BILL-002 - White-Label Subscription Billing
**Story Points:** 3
**Priority:** P1 (High)
**Status:** Ready for Development

## Parent Story Context

This is **Part 2 of 3** of the White-Label Subscription Billing story (BILL-002). This sub-story focuses on integrating Stripe Billing API for recurring subscription payments, customer management, and webhook processing.

**Total Parent Story Points:** 8
**This Sub-Story:** 3 points

**Dependencies:**
- BILL-002a: Subscription Plan Setup & Database Schema (MUST complete first)

**Sibling Stories:**
- BILL-002c: Subscription Lifecycle Management (2 points) - Depends on this

## User Story

**As an** event organizer
**I want** to subscribe to white-label features with automatic monthly billing
**So that** I can maintain continuous access without manual payment processing

## Acceptance Criteria

### Primary Criteria
- [ ] Stripe Customer created for each user on first subscription
- [ ] Stripe Subscription created with correct price ID
- [ ] Payment method securely saved via Stripe Checkout
- [ ] Subscription status synced between Stripe and database
- [ ] Webhook handler processes all subscription events
- [ ] Invoice generation automated by Stripe
- [ ] Payment confirmation emails sent
- [ ] Failed payment handling with retry logic

### Stripe Integration Criteria
- [ ] Stripe SDK configured with API keys
- [ ] Stripe Price IDs created for each tier
- [ ] Stripe Product created for white-label subscription
- [ ] Stripe Checkout session for initial subscription
- [ ] Stripe Customer Portal for self-service management
- [ ] Webhook endpoint secured with signature verification

### Webhook Events Handled
- [ ] customer.subscription.created
- [ ] customer.subscription.updated
- [ ] customer.subscription.deleted
- [ ] invoice.payment_succeeded
- [ ] invoice.payment_failed
- [ ] invoice.upcoming (for 3-day reminder)

### Payment Flow Criteria
- [ ] Initial subscription payment processed
- [ ] Recurring monthly payments automated
- [ ] Invoice PDF generated and stored
- [ ] Receipt emailed to customer
- [ ] Payment method updates handled
- [ ] Tax calculation integrated (if applicable)

## Technical Specifications

### Stripe Configuration

**File:** `lib/config/stripe.config.ts`

```typescript
import Stripe from 'stripe'

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY environment variable is required')
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-11-20.acacia',
  typescript: true
})

// Stripe Price IDs (created in Stripe Dashboard)
export const STRIPE_PRICE_IDS = {
  BASIC_MONTHLY: process.env.STRIPE_BASIC_PRICE_ID!,
  PRO_MONTHLY: process.env.STRIPE_PRO_PRICE_ID!,
  ENTERPRISE_MONTHLY: process.env.STRIPE_ENTERPRISE_PRICE_ID!, // If applicable
}

// Stripe Product ID
export const STRIPE_PRODUCT_ID = process.env.STRIPE_SUBSCRIPTION_PRODUCT_ID!

// Webhook secret
export const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET!
```

**Environment Variables Required:**
```bash
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_BASIC_PRICE_ID=price_...
STRIPE_PRO_PRICE_ID=price_...
STRIPE_SUBSCRIPTION_PRODUCT_ID=prod_...
```

### Stripe Subscription Service

**File:** `lib/services/stripe-subscription.service.ts`

```typescript
import { stripe, STRIPE_PRICE_IDS } from '@/lib/config/stripe.config'
import { PrismaClient, SubscriptionTier } from '@prisma/client'
import Stripe from 'stripe'

const prisma = new PrismaClient()

export class StripeSubscriptionService {
  /**
   * Get or create Stripe customer for user
   */
  async getOrCreateCustomer(userId: string): Promise<string> {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!user) {
      throw new Error('User not found')
    }

    // Check if user already has Stripe customer
    const existingSubscription = await prisma.subscription.findFirst({
      where: { userId, stripeCustomerId: { not: null } }
    })

    if (existingSubscription?.stripeCustomerId) {
      return existingSubscription.stripeCustomerId
    }

    // Create new Stripe customer
    const customer = await stripe.customers.create({
      email: user.email,
      name: user.name,
      metadata: {
        userId: user.id
      }
    })

    return customer.id
  }

  /**
   * Create Stripe checkout session for subscription
   */
  async createCheckoutSession(
    userId: string,
    tier: SubscriptionTier,
    successUrl: string,
    cancelUrl: string
  ): Promise<Stripe.Checkout.Session> {
    const customerId = await this.getOrCreateCustomer(userId)
    const priceId = this.getPriceIdForTier(tier)

    if (!priceId) {
      throw new Error(`No Stripe price ID configured for tier: ${tier}`)
    }

    // Check if tier has trial
    const plan = await prisma.subscriptionPlan.findUnique({
      where: { tier }
    })

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1
        }
      ],
      subscription_data: {
        trial_period_days: plan?.trialDays || undefined,
        metadata: {
          userId,
          tier
        }
      },
      success_url: successUrl,
      cancel_url: cancelUrl,
      allow_promotion_codes: true
    })

    return session
  }

  /**
   * Create subscription in database after Stripe checkout
   */
  async createSubscription(
    userId: string,
    stripeSubscription: Stripe.Subscription
  ) {
    const tier = stripeSubscription.metadata.tier as SubscriptionTier
    const customerId = typeof stripeSubscription.customer === 'string'
      ? stripeSubscription.customer
      : stripeSubscription.customer.id

    const subscription = await prisma.subscription.create({
      data: {
        userId,
        tier,
        status: this.mapStripeStatus(stripeSubscription.status),
        stripeSubscriptionId: stripeSubscription.id,
        stripeCustomerId: customerId,
        stripePriceId: stripeSubscription.items.data[0].price.id,
        currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
        currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
        trialStart: stripeSubscription.trial_start
          ? new Date(stripeSubscription.trial_start * 1000)
          : null,
        trialEnd: stripeSubscription.trial_end
          ? new Date(stripeSubscription.trial_end * 1000)
          : null,
        nextBillingDate: new Date(stripeSubscription.current_period_end * 1000)
      }
    })

    // Log subscription creation event
    await prisma.subscriptionEvent.create({
      data: {
        subscriptionId: subscription.id,
        eventType: 'created',
        toTier: tier,
        toStatus: subscription.status,
        triggeredBy: userId,
        metadata: {
          stripeSubscriptionId: stripeSubscription.id
        }
      }
    })

    return subscription
  }

  /**
   * Update subscription from Stripe webhook
   */
  async updateSubscriptionFromStripe(stripeSubscription: Stripe.Subscription) {
    const subscription = await prisma.subscription.findUnique({
      where: { stripeSubscriptionId: stripeSubscription.id }
    })

    if (!subscription) {
      throw new Error('Subscription not found')
    }

    const updatedSubscription = await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        status: this.mapStripeStatus(stripeSubscription.status),
        currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
        currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
        cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
        canceledAt: stripeSubscription.canceled_at
          ? new Date(stripeSubscription.canceled_at * 1000)
          : null,
        nextBillingDate: new Date(stripeSubscription.current_period_end * 1000)
      }
    })

    // Log update event
    await prisma.subscriptionEvent.create({
      data: {
        subscriptionId: subscription.id,
        eventType: 'updated',
        fromStatus: subscription.status,
        toStatus: updatedSubscription.status,
        metadata: {
          stripeSubscriptionId: stripeSubscription.id,
          changes: this.detectChanges(subscription, updatedSubscription)
        }
      }
    })

    return updatedSubscription
  }

  /**
   * Handle successful invoice payment
   */
  async handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
    const subscriptionId = typeof invoice.subscription === 'string'
      ? invoice.subscription
      : invoice.subscription?.id

    if (!subscriptionId) {
      return
    }

    const subscription = await prisma.subscription.findUnique({
      where: { stripeSubscriptionId: subscriptionId }
    })

    if (!subscription) {
      return
    }

    // Update last payment
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        lastPaymentDate: new Date(invoice.created * 1000),
        lastPaymentAmount: invoice.amount_paid / 100 // Convert cents to dollars
      }
    })

    // Create invoice record
    await prisma.subscriptionInvoice.create({
      data: {
        subscriptionId: subscription.id,
        userId: subscription.userId,
        invoiceNumber: this.generateInvoiceNumber(),
        stripeInvoiceId: invoice.id,
        subtotal: (invoice.subtotal || 0) / 100,
        tax: (invoice.tax || 0) / 100,
        total: (invoice.total || 0) / 100,
        amountPaid: (invoice.amount_paid || 0) / 100,
        amountDue: (invoice.amount_due || 0) / 100,
        status: invoice.status || 'open',
        paid: invoice.paid || false,
        invoiceDate: new Date(invoice.created * 1000),
        dueDate: invoice.due_date ? new Date(invoice.due_date * 1000) : null,
        paidAt: invoice.status_transitions?.paid_at
          ? new Date(invoice.status_transitions.paid_at * 1000)
          : null,
        periodStart: new Date(invoice.period_start * 1000),
        periodEnd: new Date(invoice.period_end * 1000),
        pdfUrl: invoice.invoice_pdf || null,
        hostedInvoiceUrl: invoice.hosted_invoice_url || null,
        description: invoice.description || null
      }
    })

    // Send payment confirmation email
    // TODO: Integrate with email service
  }

  /**
   * Handle failed invoice payment
   */
  async handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
    const subscriptionId = typeof invoice.subscription === 'string'
      ? invoice.subscription
      : invoice.subscription?.id

    if (!subscriptionId) {
      return
    }

    const subscription = await prisma.subscription.findUnique({
      where: { stripeSubscriptionId: subscriptionId }
    })

    if (!subscription) {
      return
    }

    // Update subscription status to PAST_DUE
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: { status: 'PAST_DUE' }
    })

    // Log event
    await prisma.subscriptionEvent.create({
      data: {
        subscriptionId: subscription.id,
        eventType: 'payment_failed',
        fromStatus: subscription.status,
        toStatus: 'PAST_DUE',
        metadata: {
          invoiceId: invoice.id,
          attemptCount: invoice.attempt_count
        }
      }
    })

    // Send payment failed email
    // TODO: Integrate with email service
  }

  /**
   * Create Stripe Customer Portal session
   */
  async createCustomerPortalSession(
    userId: string,
    returnUrl: string
  ): Promise<Stripe.BillingPortal.Session> {
    const customerId = await this.getOrCreateCustomer(userId)

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl
    })

    return session
  }

  private getPriceIdForTier(tier: SubscriptionTier): string | null {
    switch (tier) {
      case 'BASIC':
        return STRIPE_PRICE_IDS.BASIC_MONTHLY
      case 'PRO':
        return STRIPE_PRICE_IDS.PRO_MONTHLY
      case 'ENTERPRISE':
        return STRIPE_PRICE_IDS.ENTERPRISE_MONTHLY
      default:
        return null
    }
  }

  private mapStripeStatus(stripeStatus: Stripe.Subscription.Status): any {
    const statusMap: Record<string, any> = {
      'active': 'ACTIVE',
      'trialing': 'TRIAL',
      'past_due': 'PAST_DUE',
      'canceled': 'CANCELED',
      'unpaid': 'CANCELED',
      'incomplete': 'INCOMPLETE',
      'incomplete_expired': 'INCOMPLETE_EXPIRED'
    }
    return statusMap[stripeStatus] || 'INCOMPLETE'
  }

  private generateInvoiceNumber(): string {
    const year = new Date().getFullYear()
    const random = Math.floor(Math.random() * 1000000).toString().padStart(6, '0')
    return `SUB-INV-${year}-${random}`
  }

  private detectChanges(old: any, updated: any): object {
    const changes: any = {}
    const keys = ['status', 'tier', 'cancelAtPeriodEnd']

    keys.forEach(key => {
      if (old[key] !== updated[key]) {
        changes[key] = { from: old[key], to: updated[key] }
      }
    })

    return changes
  }
}

export const stripeSubscriptionService = new StripeSubscriptionService()
```

### Webhook Handler

**File:** `app/api/webhooks/stripe/subscription/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/config/stripe.config'
import { stripeSubscriptionService } from '@/lib/services/stripe-subscription.service'
import Stripe from 'stripe'

export async function POST(req: NextRequest) {
  const body = await req.text()
  const signature = req.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'customer.subscription.created':
        const createdSub = event.data.object as Stripe.Subscription
        await stripeSubscriptionService.createSubscription(
          createdSub.metadata.userId,
          createdSub
        )
        break

      case 'customer.subscription.updated':
        const updatedSub = event.data.object as Stripe.Subscription
        await stripeSubscriptionService.updateSubscriptionFromStripe(updatedSub)
        break

      case 'customer.subscription.deleted':
        const deletedSub = event.data.object as Stripe.Subscription
        await stripeSubscriptionService.updateSubscriptionFromStripe(deletedSub)
        break

      case 'invoice.payment_succeeded':
        const paidInvoice = event.data.object as Stripe.Invoice
        await stripeSubscriptionService.handleInvoicePaymentSucceeded(paidInvoice)
        break

      case 'invoice.payment_failed':
        const failedInvoice = event.data.object as Stripe.Invoice
        await stripeSubscriptionService.handleInvoicePaymentFailed(failedInvoice)
        break

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true }, { status: 200 })
  } catch (err) {
    console.error('Webhook handler error:', err)
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    )
  }
}
```

## API Endpoints

**POST /api/subscriptions/checkout**
```typescript
// Create Stripe Checkout session
Request: {
  tier: SubscriptionTier
  successUrl: string
  cancelUrl: string
}

Response: {
  sessionId: string
  url: string
}
```

**POST /api/subscriptions/customer-portal**
```typescript
// Create Customer Portal session for self-service
Request: {
  returnUrl: string
}

Response: {
  url: string
}
```

**POST /api/webhooks/stripe/subscription**
```typescript
// Stripe webhook endpoint (secured with signature verification)
```

## Testing Requirements

### Unit Tests
- [ ] Stripe customer creation
- [ ] Checkout session creation
- [ ] Subscription status mapping
- [ ] Invoice number generation
- [ ] Webhook signature verification

### Integration Tests
- [ ] Full subscription creation flow
- [ ] Webhook processing for all event types
- [ ] Payment success handling
- [ ] Payment failure handling
- [ ] Customer Portal session creation

### Stripe Testing
- [ ] Use Stripe test mode for development
- [ ] Test with Stripe test cards
- [ ] Test webhook delivery with Stripe CLI
- [ ] Test trial period functionality
- [ ] Test payment retry logic

## Dependencies

- BILL-002a: Subscription Plan Setup (MUST complete first)
- Stripe account configured
- Stripe SDK installed
- Environment variables configured

## Definition of Done

- [ ] Stripe SDK configured
- [ ] Stripe Price IDs created
- [ ] Checkout flow functional
- [ ] Webhook handler processing events
- [ ] Customer Portal accessible
- [ ] Invoice generation working
- [ ] Payment confirmation emails sent
- [ ] All tests passing
- [ ] Webhook endpoint secured
- [ ] Documentation written

## Notes

**Security**: Never expose Stripe secret keys. Always use environment variables and verify webhook signatures.

**Testing**: Use Stripe CLI to forward webhooks to localhost during development: `stripe listen --forward-to localhost:3004/api/webhooks/stripe/subscription`

**PCI Compliance**: Stripe Checkout handles card collection, maintaining PCI compliance.