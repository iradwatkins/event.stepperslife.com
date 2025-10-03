# Production Deployment Checklist - SteppersLife Events Platform

## ✅ Phase 1: Pre-Deployment Validation (COMPLETED)

### Database
- [x] Database migration executed (`npm run db:push`)
- [x] All 6 billing tables created:
  - `billing_accounts`
  - `platform_transactions`
  - `payout_records`
  - `credit_purchases`
  - `whitelabel_subscriptions`
  - `subscription_payments`
- [x] Prisma client generated with billing models

### Environment Configuration
- [x] `CRON_SECRET` added to `.env.local` (development)
- [x] `DATABASE_URL` configured
- [x] `NEXTAUTH_SECRET` configured
- [x] `SQUARE_ACCESS_TOKEN` configured (sandbox)
- [x] `SQUARE_ENVIRONMENT` set to sandbox

### Application Services
- [x] Development server running on port 3004
- [x] Public events API working
- [x] Event details API working (requires auth)
- [x] Billing service integrated
- [x] Tax calculation service integrated
- [x] Payout cron endpoint working
- [x] Sentry error monitoring configured

---

## 🚀 Phase 2: Production Environment Setup (TODO)

### 1. Environment Variables (Vercel Dashboard)

**Required Production Variables:**
```bash
# Database
DATABASE_URL="postgresql://..."  # Production database URL

# Authentication
NEXTAUTH_URL="https://events.stepperslife.com"
NEXTAUTH_SECRET="[GENERATE-STRONG-SECRET-32-CHARS]"

# Square Production Credentials
NEXT_PUBLIC_SQUARE_APPLICATION_ID="sq0idp-XG8irNWHf98C62-iqOwH6Q"
SQUARE_ACCESS_TOKEN="EAAAlwLSKasNtDyFEQ4mDkK9Ces5pQ9FQ4_kiolkTnjd-4qHlOx2K9-VrGC7QcOi"
NEXT_PUBLIC_SQUARE_LOCATION_ID="L0Q2YC1SPBGD8"
SQUARE_ENVIRONMENT="production"

# Email Service
RESEND_API_KEY="re_RJid1ide_12brJc6fbguPRU5WJzMDB6gQ"
RESEND_FROM_EMAIL="noreply@events.stepperslife.com"

# Sentry Error Monitoring
SENTRY_DSN="[GET-FROM-SENTRY-DASHBOARD]"

# Cron Job Security
CRON_SECRET="[GENERATE-RANDOM-STRING-64-CHARS]"

# Application
NODE_ENV="production"
PORT="3004"
```

**Generate Secrets:**
```bash
# Generate NEXTAUTH_SECRET
openssl rand -base64 32

# Generate CRON_SECRET
openssl rand -base64 64
```

---

### 2. Production Database Setup

**Run Production Migration:**
```bash
# On production server
npm run db:push
```

**Verify Tables Created:**
```sql
SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;
```

---

### 3. Vercel Cron Configuration

**File:** `vercel.json` (already configured)
```json
{
  "crons": [
    {
      "path": "/api/cron/payouts",
      "schedule": "0 2 * * *"
    }
  ]
}
```

**Cron Schedule:** Daily at 2:00 AM UTC

**Verify Cron Setup:**
1. Deploy to Vercel
2. Check Vercel Dashboard → Project → Cron Jobs
3. Test manually: `curl -X GET https://events.stepperslife.com/api/cron/payouts -H "Authorization: Bearer [CRON_SECRET]"`

---

### 4. Sentry Setup

**Steps:**
1. Create Sentry project at https://sentry.io
2. Get DSN from project settings
3. Add `SENTRY_DSN` to Vercel environment variables
4. Deploy application

**Test Sentry:**
- Trigger a test error in production
- Verify error appears in Sentry dashboard
- Set up alerts for critical errors:
  - Payment processing failures
  - Billing fee collection failures
  - Payout processing failures

---

## 🧪 Phase 3: Production Testing (TODO After Deployment)

### Manual Test Checklist

#### 1. User Registration & Authentication
- [ ] Register new user account
- [ ] Verify email confirmation
- [ ] Log in successfully
- [ ] Test logout

#### 2. Event Browsing
- [ ] View public events page
- [ ] Search and filter events
- [ ] View event details
- [ ] Check event venue and date display

#### 3. Ticket Purchase Flow (Critical Path 💰)
- [ ] Browse to test event
- [ ] Select ticket type
- [ ] Enter payment details (use real card or Square test card)
- [ ] Complete purchase
- [ ] **Verify payment successful**
- [ ] **Verify order created in database**
- [ ] **Verify tickets generated**
- [ ] **Verify billing_accounts table has record**
- [ ] **Verify platform_transactions table has fee record**
- [ ] **Verify organizer's pendingBalance updated**
- [ ] **Verify email confirmation received**
- [ ] **Verify receipt PDF accessible**

#### 4. Tax Calculation
- [ ] Purchase tickets for event in California
- [ ] Verify CA sales tax calculated (7.25% base)
- [ ] Purchase tickets for event in Texas
- [ ] Verify TX sales tax calculated (6.25% base)
- [ ] Verify tax amount shown on receipt

#### 5. Billing Dashboard (Organizer View)
- [ ] Log in as event organizer
- [ ] Navigate to `/dashboard/billing`
- [ ] Verify billing account displayed
- [ ] Verify pending balance shown
- [ ] Verify transaction history displayed
- [ ] Verify credit balance shown

#### 6. Payout Processing
- [ ] Wait for daily cron (2 AM UTC) OR trigger manually
- [ ] Verify payout_records table has records
- [ ] Verify organizer's pendingBalance moved to availableBalance
- [ ] Verify payout status is PENDING or COMPLETED

#### 7. Error Scenarios
- [ ] Test payment decline
- [ ] Verify error message shown to user
- [ ] Verify no order/tickets created
- [ ] Verify error logged to Sentry
- [ ] Test insufficient inventory
- [ ] Test expired credit card
- [ ] Test invalid CVV

---

## 📊 Phase 4: Monitoring & Validation (Post-Launch)

### Key Metrics to Monitor

**Revenue Metrics:**
- Platform fee collection rate
- Average order value
- Daily transaction volume
- Payout processing success rate

**System Health:**
- API response times
- Error rates
- Database query performance
- Cron job execution success

**User Behavior:**
- Ticket purchase completion rate
- Cart abandonment rate
- Average tickets per order

### Sentry Alerts Setup

**Critical Alerts:**
1. **Payment Processing Failure**
   - Tag: `component: billing, severity: critical`
   - Alert: Immediate (email + Slack)

2. **Platform Fee Collection Failure**
   - Tag: `component: billing, operation: collect-platform-fee, severity: critical`
   - Alert: Immediate (email + Slack)

3. **Payout Processing Failure**
   - Tag: `component: payout-cron, severity: high`
   - Alert: Within 1 hour (email)

4. **Database Connection Errors**
   - Alert: Immediate (email + Slack)

### Database Monitoring Queries

**Check Platform Revenue:**
```sql
SELECT
  SUM(amount) as total_fees_collected,
  COUNT(*) as transaction_count
FROM platform_transactions
WHERE status = 'COMPLETED'
  AND type = 'FEE_COLLECTION';
```

**Check Pending Payouts:**
```sql
SELECT
  user_id,
  pending_balance,
  available_balance
FROM billing_accounts
WHERE status = 'ACTIVE'
  AND pending_balance >= minimum_payout;
```

**Check Failed Transactions:**
```sql
SELECT
  id,
  order_id,
  type,
  status,
  amount,
  error_message,
  created_at
FROM platform_transactions
WHERE status = 'FAILED'
ORDER BY created_at DESC
LIMIT 20;
```

---

## 🔒 Security Checklist

- [ ] `CRON_SECRET` is random and >= 64 characters
- [ ] `NEXTAUTH_SECRET` is random and >= 32 characters
- [ ] Square production credentials secured in Vercel
- [ ] Database credentials secured in Vercel
- [ ] `.env.local` added to `.gitignore`
- [ ] No secrets committed to git
- [ ] Vercel environment variables set to "Production" only
- [ ] Cron endpoint requires authorization header
- [ ] API routes validate authentication

---

## 🚨 Rollback Plan

**If Critical Issues Occur:**

1. **Immediate Actions:**
   - Disable cron job in Vercel dashboard
   - Roll back to previous deployment
   - Notify affected users

2. **Data Integrity Check:**
   ```sql
   -- Check for duplicate fee collections
   SELECT order_id, COUNT(*)
   FROM platform_transactions
   WHERE type = 'FEE_COLLECTION'
   GROUP BY order_id
   HAVING COUNT(*) > 1;

   -- Check for negative balances
   SELECT * FROM billing_accounts
   WHERE pending_balance < 0 OR available_balance < 0;
   ```

3. **Recovery:**
   - Fix identified issues in staging
   - Test thoroughly
   - Redeploy with fixes
   - Re-enable cron job

---

## 📝 Deployment Steps

### Step 1: Pre-Deployment
1. Review this entire checklist
2. Generate production secrets
3. Configure Vercel environment variables
4. Set up Sentry project

### Step 2: Deploy
```bash
# Push to main branch
git add .
git commit -m "Production deployment: Billing system v1.0"
git push origin main

# Vercel will auto-deploy
# Or manually: vercel --prod
```

### Step 3: Post-Deployment
1. Run production database migration
2. Test cron endpoint manually
3. Complete test purchase flow
4. Monitor logs for 24 hours
5. Verify first automated payout runs successfully

### Step 4: Go-Live
1. Announce to organizers
2. Enable production payment processing
3. Monitor revenue collection
4. Track metrics daily for first week

---

## ✅ Sign-Off

**Deployment Readiness:**
- [ ] All Phase 1 items completed (✅ Already done)
- [ ] All Phase 2 environment variables configured
- [ ] Production database migration successful
- [ ] Manual testing in production passed
- [ ] Sentry alerts configured
- [ ] Team briefed on rollback plan

**Approved By:**
- [ ] Lead Developer: ________________  Date: ________
- [ ] QA Lead: ________________  Date: ________
- [ ] Product Owner: ________________  Date: ________

---

## 📞 Support Contacts

**During Deployment:**
- Technical Lead: [Contact Info]
- Database Admin: [Contact Info]
- DevOps: [Contact Info]

**Post-Launch:**
- On-Call Developer: [Contact Info]
- Sentry Dashboard: https://sentry.io/[project]
- Vercel Dashboard: https://vercel.com/[project]

---

## 🎉 Success Metrics

**Week 1 Goals:**
- Zero critical payment failures
- 100% platform fee collection rate
- Successful daily payout execution
- < 1% error rate

**Month 1 Goals:**
- Process 100+ ticket purchases
- Collect $750+ in platform fees
- Distribute 10+ successful payouts
- Maintain 99.9% uptime

---

**Last Updated:** 2025-09-30
**Version:** 1.0
**Status:** Ready for Production Deployment