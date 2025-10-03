# EPIC-019: Platform Billing & Revenue System

**Priority**: E0 (Critical) - **MISSING FROM ORIGINAL ROADMAP**
**Story Points**: 68
**Status**: Not Started
**Owner**: Platform Team
**Target Sprint**: Week 9-10 (Month 5)

---

## Epic Overview

### Business Context

**CRITICAL DISCOVERY**: The platform currently processes payments TO organizers but has **NO mechanism to collect platform revenue**. This epic implements the complete billing and revenue distribution system required for business sustainability.

### Business Value

This is the **REVENUE ENGINE** of the entire platform:
- **Platform Service Fees**: $0.29-0.75 per ticket (primary revenue)
- **Prepaid Credits**: Bulk purchases with discounts
- **White-Label Subscriptions**: $10/month recurring revenue
- **Automated Payouts**: Distribute funds to organizers

**Without this epic, the platform generates ZERO revenue!**

### Current State

✅ Payments flow TO organizers via Square
❌ NO platform fee collection
❌ NO prepaid credit system
❌ NO subscription billing
❌ NO payout management
❌ NO revenue tracking

### Target State

✅ Automated platform fee collection per ticket
✅ Prepaid credit packages ($100, $500, $1000)
✅ White-label subscriptions at $10/month
✅ Daily automated payouts to organizers
✅ Complete revenue analytics
✅ Tax reporting and compliance

---

## Success Metrics

### Financial Metrics
- Platform revenue per ticket: $0.75 average
- Credit package sales: 20% of organizers
- White-label conversions: 5% of organizers
- Payout success rate: >99%
- Revenue recognition accuracy: 100%

### Operational Metrics
- Fee calculation time: <50ms
- Payout processing time: <5 minutes per batch
- Failed payout rate: <1%
- Credit deduction accuracy: 100%
- Subscription billing success: >95%

### Compliance Metrics
- Audit trail completeness: 100%
- Tax reporting accuracy: 100%
- PCI compliance: Maintained
- Fraud detection: <0.1% false positives

---

## Architecture Overview

### Database Schema (6 New Tables)

1. **BillingAccount** - Organizer billing configuration
2. **PlatformTransaction** - All revenue transactions
3. **PayoutRecord** - Payout history to organizers
4. **CreditPurchase** - Prepaid credit purchases
5. **WhitelabelSubscription** - Subscription management
6. **SubscriptionPayment** - Individual subscription payments

### Service Layer (3 New Services)

1. **BillingService** - Fee calculation and collection
2. **PayoutService** - Automated payout processing
3. **SubscriptionService** - Subscription billing

### Payment Flow

```
Customer Purchase ($50 ticket)
    ↓
Square Payment API ($50 charged)
    ↓
Platform Fee Deducted ($0.75)
    ↓
Organizer Credit ($47.65 pending payout)
    ↓
Square Processing Fee ($1.60)
    ↓
Daily Payout to Organizer ($47.65 transferred)
```

---

## User Stories (15 Total)

### Billing Account Management (3 stories, 8 pts)

**BILL-001**: Create Billing Account for Organizer [2 pts]
- Auto-create billing account on organizer registration
- Configure default fee structure ($0.75/ticket)
- Set payout schedule (daily)
- Initialize credit balance (0)

**BILL-002**: Billing Account Settings Management [3 pts]
- View billing account dashboard
- Configure payout schedule
- Set minimum payout amount
- Update payment methods
- View fee history

**BILL-003**: Billing Account Suspension/Reactivation [3 pts]
- Admin ability to suspend accounts
- Fraud detection triggers
- Chargeback threshold monitoring
- Reactivation workflow
- Notification system

### Platform Fee Collection (4 stories, 18 pts)

**BILL-004**: Calculate Platform Fee on Purchase [3 pts]
- Implement fee calculation logic
- Support multiple fee tiers
- Handle negotiated rates
- Calculate net to organizer
- Estimate Square processing fees

**BILL-005**: Collect Platform Fee from Ticket Sale [5 pts]
- Deduct fee on successful payment
- Use prepaid credits if available
- Create platform transaction record
- Update billing account stats
- Generate audit log

**BILL-006**: Platform Fee Refund Processing [3 pts]
- Refund platform fee when ticket refunded
- Credit back to prepaid balance if applicable
- Update transaction status
- Maintain refund history
- Adjust revenue reporting

**BILL-007**: Negotiated Rate Management [2 pts]
- Admin ability to set custom rates
- Per-organizer rate configuration
- Rate change audit trail
- Effective date tracking
- Bulk rate updates

**BILL-008**: Platform Fee Reporting & Analytics [5 pts]
- Daily revenue dashboard
- Revenue by event/organizer
- Fee tier analysis
- Trend analysis
- Export capabilities

### Prepaid Credit System (3 stories, 13 pts)

**BILL-009**: Purchase Prepaid Credit Packages [5 pts]
- Create credit package offerings ($100, $500, $1000)
- Implement discount tiers (5%, 7%, 10%)
- Process payment via Square
- Add credits to balance
- Generate purchase receipt

**BILL-010**: Deduct Credits for Platform Fees [3 pts]
- Check credit balance before fee collection
- Deduct from balance if sufficient
- Track credit usage per transaction
- Handle insufficient balance
- Low balance notifications

**BILL-011**: Credit Balance Management [5 pts]
- View credit balance
- Credit transaction history
- Expiration tracking
- Refund unused credits
- Transfer credits between accounts

### Payout System (3 stories, 18 pts)

**BILL-012**: Daily Automated Payout Processing [8 pts]
- Cron job to process payouts (2 AM daily)
- Identify eligible accounts (>$25 pending)
- Calculate payout amounts
- Create payout records
- Initiate Square payouts
- Handle payout failures
- Send payout notifications

**BILL-013**: Payout Record Management [5 pts]
- View payout history
- Show payout status
- Display settlement timeline
- Download payout reports
- Handle payout disputes

**BILL-014**: Manual Payout Controls [5 pts]
- Admin-initiated manual payouts
- Early payout requests
- Hold/release payouts
- Payout schedule override
- Emergency payout handling

### White-Label Subscriptions (2 stories, 11 pts)

**BILL-015**: Create White-Label Subscription [8 pts]
- Subscribe to white-label plan ($10/month)
- Process initial payment via Square
- Create subscription record
- Set billing cycle
- Send welcome email
- Activate white-label features

**BILL-016**: Monthly Subscription Billing [3 pts]
- Cron job for monthly billing (1st of month)
- Process subscription payments
- Handle payment failures
- Retry failed payments
- Cancel after max retries
- Send billing notifications

---

## Technical Dependencies

### External APIs
- **Square Payments API** - Already integrated ✅
- **Square Payouts API** - NEW, requires setup ⚠️
- **Square Subscriptions API** - NEW, requires setup ⚠️

### Database Changes
- 6 new models
- 3 model updates (Order, Ticket, OrganizerProfile)
- Multiple new indexes for performance

### New API Routes (12 endpoints)
```
/api/billing/account             GET, PUT
/api/billing/credits/purchase    POST
/api/billing/credits             GET
/api/billing/subscriptions       GET, POST, DELETE
/api/billing/payouts             GET
/api/billing/transactions        GET
/api/admin/billing/*             Multiple admin routes
/api/webhooks/square/payouts     POST
/api/cron/payouts                GET
/api/cron/subscriptions          GET
```

### Background Jobs
- Daily payout processor (2 AM)
- Monthly subscription billing (1st of month, 3 AM)
- Credit expiration checker (daily)
- Failed payment retries (hourly)

---

## Implementation Plan

### Week 9: Foundation
- Create database schema and migrations
- Implement BillingService
- Integrate fee collection into purchase flow
- Create billing account management UI

### Week 10: Payouts & Subscriptions
- Implement PayoutService
- Build payout cron job
- Implement SubscriptionService
- Create subscription management UI

### Testing Phase
- Unit tests for all services
- Integration tests for payment flows
- Load testing for payout jobs
- Security audit for billing code

---

## Security & Compliance

### Security Requirements
- ✅ Encrypt all sensitive billing data
- ✅ Audit log every billing operation
- ✅ RBAC for billing management
- ✅ Webhook signature verification
- ✅ PCI compliance maintained (Square handles cards)

### Compliance Requirements
- 1099-K reporting for organizers (>$600/year)
- Sales tax handling (platform fees typically exempt)
- 7-year transaction retention
- CCPA data access/deletion support

### Fraud Prevention
- Maximum credit purchase limits
- Chargeback rate monitoring
- Minimum days before first payout
- Velocity checks on purchases

---

## Risks & Mitigation

### High Risk: Revenue Calculation Accuracy
**Risk**: Incorrect fee calculations could lose revenue
**Mitigation**:
- Comprehensive unit testing
- Dual calculation verification
- Daily reconciliation reports
- Manual audit sampling

### High Risk: Payout Failures
**Risk**: Failed payouts damage organizer trust
**Mitigation**:
- Automatic retry logic
- Manual fallback process
- Real-time monitoring
- Clear error messaging

### Medium Risk: Square API Changes
**Risk**: Square modifies Payouts/Subscriptions APIs
**Mitigation**:
- Version pinning
- Regular SDK updates
- Fallback mechanisms
- Alert monitoring

### Medium Risk: Subscription Billing Failures
**Risk**: Failed subscription payments lose revenue
**Mitigation**:
- 3-attempt retry logic
- Email notifications
- Grace period before cancellation
- Alternative payment methods

---

## Documentation Requirements

### Developer Documentation
- Complete API reference for all endpoints
- Service layer documentation
- Database schema documentation
- Webhook handling guide
- Testing guide

### Admin Documentation
- Billing account management guide
- Payout processing runbook
- Subscription management guide
- Fraud detection procedures
- Troubleshooting guide

### Organizer Documentation
- How platform fees work
- Prepaid credit guide
- Payout schedule explanation
- Subscription benefits
- FAQ

---

## Success Criteria

### Must Have
- ✅ Platform collects fees on 100% of ticket sales
- ✅ Automated daily payouts process successfully
- ✅ Credit system functional with discounts
- ✅ Subscription billing recurring monthly
- ✅ Complete audit trail for all transactions

### Should Have
- ✅ Revenue dashboard for admins
- ✅ Billing dashboard for organizers
- ✅ Automated reconciliation reports
- ✅ Tax reporting capabilities
- ✅ Fraud detection active

### Nice to Have
- Advanced analytics and forecasting
- Multi-currency support
- Volume-based fee discounts
- Referral credit system
- Annual subscription discounts

---

## Next Steps

1. **Review Architecture Document**: Read complete technical spec
2. **Database Migration**: Create and test schema changes
3. **Service Implementation**: Build BillingService first
4. **Integration**: Update purchase route with fee collection
5. **Testing**: Comprehensive test suite
6. **Deployment**: Gradual rollout with feature flags

---

## Related Documents

- [Complete Architecture Spec](../../architecture/billing-system-architecture.md)
- [Epic Hierarchy](../../scrum-master/epics-hierarchy.md)
- [Implementation Plan](../../scrum-master/COMPLETE-IMPLEMENTATION-PLAN.md)
- [Product Requirements](../../business/product-requirements.md)

---

**Created**: 2025-09-29
**Last Updated**: 2025-09-29
**Status**: READY FOR DEVELOPMENT
**Estimated Duration**: 2 weeks (Sprint 9-10)

---

*This is the MOST CRITICAL epic for business viability. Without billing, there is NO revenue.*