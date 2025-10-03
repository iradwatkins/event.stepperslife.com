# BILL-004: Organizer Payout Management

**Epic:** EPIC-019 - Platform Billing & Revenue
**Story Points:** 5
**Priority:** P0 (Critical)
**Status:** Ready for Development

## User Story

**As an** event organizer
**I want** to request payouts of my earned revenue and receive funds in my bank account
**So that** I can access my earnings from ticket sales after the escrow period

## Acceptance Criteria

### Primary Criteria
- [ ] Organizers can view available balance and request payouts
- [ ] Minimum payout amount: $50
- [ ] Payout processing time: 3-5 business days (ACH)
- [ ] Support for multiple payout methods (ACH, wire transfer)
- [ ] Bank account verification before first payout
- [ ] Automatic payout schedule option (weekly/monthly)
- [ ] Payout history with status tracking
- [ ] Email notifications for payout status changes

### Bank Account Management
- [ ] Organizers can add multiple bank accounts
- [ ] One primary account for payouts
- [ ] Micro-deposit verification for ACH
- [ ] Instant verification via Plaid (optional)
- [ ] Edit/delete bank accounts (with security confirmation)
- [ ] Bank account masking for security (show last 4 digits only)

### Payout Processing
- [ ] Manual payout request flow
- [ ] Automatic payout scheduling
- [ ] Payout status tracking (pending, processing, completed, failed)
- [ ] Failed payout retry logic with notifications
- [ ] Payout cancellation (before processing)
- [ ] Integration with Stripe Connect or similar

### Compliance & Security
- [ ] KYC (Know Your Customer) verification required
- [ ] Tax form collection (W-9 for US, W-8 for international)
- [ ] 1099-K generation for US organizers (>$20K revenue)
- [ ] Fraud detection and suspicious activity monitoring
- [ ] Payout limits based on verification level

## Technical Specifications

### Payout Service

**File:** `lib/services/payout.service.ts`

```typescript
enum PayoutStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  IN_TRANSIT = 'IN_TRANSIT',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELED = 'CANCELED',
  REVERSED = 'REVERSED'
}

enum PayoutMethod {
  ACH = 'ACH',
  WIRE = 'WIRE',
  INSTANT = 'INSTANT' // Stripe Instant Payouts (1% fee)
}

interface BankAccount {
  id: string
  organizerId: string
  accountHolderName: string
  accountType: 'checking' | 'savings'
  routingNumber: string
  accountNumberLast4: string
  bankName: string
  isPrimary: boolean
  isVerified: boolean
  verificationMethod: 'microdeposit' | 'plaid' | 'manual'
  verifiedAt?: Date
  createdAt: Date
}

interface PayoutRequest {
  id: string
  organizerId: string
  amount: number
  payoutMethod: PayoutMethod
  bankAccountId: string
  status: PayoutStatus

  // Fees
  processingFee: number // $0 for ACH, 1% for instant
  netAmount: number // amount - processingFee

  // Processing details
  requestedAt: Date
  scheduledAt?: Date
  processedAt?: Date
  completedAt?: Date
  failedAt?: Date

  // External references
  stripePayoutId?: string
  externalTransactionId?: string

  // Failure handling
  failureReason?: string
  failureCode?: string
  retryCount: number

  // Metadata
  description?: string
  metadata: any
}

class PayoutService {
  /**
   * Request a payout
   */
  async requestPayout(
    organizerId: string,
    amount: number,
    bankAccountId: string,
    payoutMethod: PayoutMethod
  ): Promise<PayoutRequest>

  /**
   * Schedule automatic payouts
   */
  async scheduleAutomaticPayouts(
    organizerId: string,
    frequency: 'weekly' | 'monthly',
    dayOfWeek?: number, // 0-6 for weekly
    dayOfMonth?: number, // 1-31 for monthly
    minimumAmount?: number
  ): Promise<void>

  /**
   * Cancel pending payout
   */
  async cancelPayout(payoutId: string): Promise<void>

  /**
   * Process pending payouts (cron job)
   */
  async processPendingPayouts(): Promise<void>

  /**
   * Get payout history for organizer
   */
  async getPayoutHistory(
    organizerId: string,
    limit: number,
    offset: number
  ): Promise<PayoutRequest[]>

  /**
   * Handle payout webhook from Stripe
   */
  async handlePayoutWebhook(event: any): Promise<void>

  /**
   * Retry failed payout
   */
  async retryFailedPayout(payoutId: string): Promise<PayoutRequest>

  /**
   * Add bank account
   */
  async addBankAccount(
    organizerId: string,
    accountDetails: BankAccountDetails
  ): Promise<BankAccount>

  /**
   * Verify bank account with micro-deposits
   */
  async verifyBankAccountMicrodeposits(
    bankAccountId: string,
    amount1: number,
    amount2: number
  ): Promise<boolean>

  /**
   * Verify bank account with Plaid
   */
  async verifyBankAccountPlaid(
    organizerId: string,
    plaidPublicToken: string
  ): Promise<BankAccount>
}
```

### Database Schema

**Table:** `bank_accounts`

```sql
CREATE TABLE bank_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organizer_id UUID NOT NULL REFERENCES users(id),

  -- Account details (encrypted)
  account_holder_name VARCHAR(255) NOT NULL,
  account_type VARCHAR(20) NOT NULL, -- checking, savings
  routing_number_encrypted TEXT NOT NULL,
  account_number_encrypted TEXT NOT NULL,
  account_number_last4 VARCHAR(4) NOT NULL,
  bank_name VARCHAR(255),

  -- Verification
  is_primary BOOLEAN DEFAULT FALSE,
  is_verified BOOLEAN DEFAULT FALSE,
  verification_method VARCHAR(50), -- microdeposit, plaid, manual
  verified_at TIMESTAMP,

  -- External references
  stripe_bank_account_id VARCHAR(255) UNIQUE,
  plaid_account_id VARCHAR(255),

  -- Security
  deleted_at TIMESTAMP, -- Soft delete for compliance

  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

  CONSTRAINT one_primary_per_organizer UNIQUE (organizer_id, is_primary)
    WHERE is_primary = TRUE
);

CREATE INDEX idx_bank_accounts_organizer ON bank_accounts(organizer_id);
CREATE INDEX idx_bank_accounts_verified ON bank_accounts(is_verified);
CREATE INDEX idx_bank_accounts_stripe ON bank_accounts(stripe_bank_account_id);
```

**Table:** `payout_requests`

```sql
CREATE TYPE payout_status AS ENUM (
  'PENDING', 'PROCESSING', 'IN_TRANSIT',
  'COMPLETED', 'FAILED', 'CANCELED', 'REVERSED'
);

CREATE TYPE payout_method AS ENUM ('ACH', 'WIRE', 'INSTANT');

CREATE TABLE payout_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organizer_id UUID NOT NULL REFERENCES users(id),
  bank_account_id UUID NOT NULL REFERENCES bank_accounts(id),

  -- Amounts
  amount DECIMAL(12,2) NOT NULL,
  processing_fee DECIMAL(10,2) NOT NULL DEFAULT 0,
  net_amount DECIMAL(12,2) NOT NULL,

  -- Payout details
  payout_method payout_method NOT NULL DEFAULT 'ACH',
  status payout_status NOT NULL DEFAULT 'PENDING',

  -- Timestamps
  requested_at TIMESTAMP NOT NULL DEFAULT NOW(),
  scheduled_at TIMESTAMP,
  processed_at TIMESTAMP,
  completed_at TIMESTAMP,
  failed_at TIMESTAMP,
  canceled_at TIMESTAMP,

  -- External references
  stripe_payout_id VARCHAR(255) UNIQUE,
  external_transaction_id VARCHAR(255),

  -- Failure handling
  failure_reason TEXT,
  failure_code VARCHAR(50),
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,

  -- Metadata
  description TEXT,
  metadata JSONB DEFAULT '{}',

  -- Audit
  created_by UUID REFERENCES users(id),
  canceled_by UUID REFERENCES users(id),

  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

  CONSTRAINT positive_amount CHECK (amount > 0),
  CONSTRAINT valid_net_amount CHECK (net_amount = amount - processing_fee)
);

CREATE INDEX idx_payout_requests_organizer ON payout_requests(organizer_id);
CREATE INDEX idx_payout_requests_status ON payout_requests(status);
CREATE INDEX idx_payout_requests_scheduled ON payout_requests(scheduled_at);
CREATE INDEX idx_payout_requests_stripe ON payout_requests(stripe_payout_id);
```

**Table:** `automatic_payout_schedules`

```sql
CREATE TABLE automatic_payout_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organizer_id UUID UNIQUE NOT NULL REFERENCES users(id),

  -- Schedule settings
  enabled BOOLEAN DEFAULT TRUE,
  frequency VARCHAR(20) NOT NULL, -- weekly, monthly
  day_of_week INTEGER, -- 0-6 (Sunday-Saturday) for weekly
  day_of_month INTEGER, -- 1-31 for monthly
  minimum_amount DECIMAL(10,2) DEFAULT 50.00,

  -- Payout settings
  bank_account_id UUID REFERENCES bank_accounts(id),
  payout_method payout_method DEFAULT 'ACH',

  -- Tracking
  last_payout_at TIMESTAMP,
  next_payout_at TIMESTAMP,

  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

  CONSTRAINT valid_day_of_week CHECK (
    day_of_week IS NULL OR (day_of_week >= 0 AND day_of_week <= 6)
  ),
  CONSTRAINT valid_day_of_month CHECK (
    day_of_month IS NULL OR (day_of_month >= 1 AND day_of_month <= 31)
  )
);

CREATE INDEX idx_automatic_payout_schedules_organizer ON automatic_payout_schedules(organizer_id);
CREATE INDEX idx_automatic_payout_schedules_next_payout ON automatic_payout_schedules(next_payout_at);
```

**Table:** `payout_revenue_links` (Track which revenue transactions are paid out)

```sql
CREATE TABLE payout_revenue_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payout_request_id UUID NOT NULL REFERENCES payout_requests(id),
  revenue_transaction_id UUID NOT NULL REFERENCES revenue_transactions(id),
  amount DECIMAL(12,2) NOT NULL,

  created_at TIMESTAMP NOT NULL DEFAULT NOW(),

  CONSTRAINT unique_revenue_payout UNIQUE (revenue_transaction_id, payout_request_id)
);

CREATE INDEX idx_payout_revenue_links_payout ON payout_revenue_links(payout_request_id);
CREATE INDEX idx_payout_revenue_links_revenue ON payout_revenue_links(revenue_transaction_id);
```

### API Endpoints

**POST /api/payouts/request**
```typescript
// Request a payout
Request: {
  amount: number
  bankAccountId: string
  payoutMethod: PayoutMethod
  description?: string
}

Response: {
  payout: PayoutRequest
  estimatedArrival: string // "2025-10-05"
}
```

**POST /api/payouts/:id/cancel**
```typescript
// Cancel pending payout
Response: {
  success: boolean
  payout: PayoutRequest
}
```

**GET /api/payouts/history**
```typescript
// Get payout history
Query: {
  page: number
  limit: number
  status?: PayoutStatus
}

Response: {
  payouts: PayoutRequest[]
  total: number
  page: number
  totalPages: number
}
```

**POST /api/payouts/schedule**
```typescript
// Setup automatic payouts
Request: {
  enabled: boolean
  frequency: 'weekly' | 'monthly'
  dayOfWeek?: number
  dayOfMonth?: number
  minimumAmount?: number
  bankAccountId: string
}

Response: {
  schedule: AutomaticPayoutSchedule
}
```

**POST /api/bank-accounts**
```typescript
// Add bank account
Request: {
  accountHolderName: string
  accountType: 'checking' | 'savings'
  routingNumber: string
  accountNumber: string
  bankName?: string
}

Response: {
  bankAccount: BankAccount
  verificationRequired: boolean
}
```

**POST /api/bank-accounts/:id/verify**
```typescript
// Verify bank account with micro-deposits
Request: {
  amount1: number // In cents: 32 = $0.32
  amount2: number
}

Response: {
  verified: boolean
  attemptsRemaining: number
}
```

**POST /api/bank-accounts/verify-plaid**
```typescript
// Verify bank account with Plaid
Request: {
  publicToken: string
  accountId: string
}

Response: {
  bankAccount: BankAccount
  verified: boolean
}
```

**GET /api/payouts/available-balance**
```typescript
// Get available balance for payout
Response: {
  availableBalance: number
  heldBalance: number
  nextEscrowRelease: {
    date: string
    amount: number
  }
  minimumPayout: number
}
```

## Integration Points

### 1. Revenue Distribution System (BILL-003)
- Query available balance before payout
- Mark revenue transactions as paid out
- Update organizer balance after payout
- Link payout to specific revenue transactions

### 2. Stripe Connect
- Create Stripe Connect account for organizers
- Use Stripe Payouts API for ACH transfers
- Handle Stripe webhook events (payout.paid, payout.failed)
- Support Stripe Instant Payouts

### 3. Plaid Integration (Optional)
- Instant bank account verification
- Fetch bank account details
- Verify account ownership

### 4. Email Notifications
- Payout requested confirmation
- Payout processing notification
- Payout completed notification
- Payout failed notification (with reason)
- Bank account verified notification

### 5. Tax System
- Track annual payout totals for 1099-K generation
- Collect W-9/W-8 forms before first payout
- Generate tax forms for organizers

## Business Rules

### Minimum Payout Amount
- **Minimum:** $50 USD
- **Reason:** Reduce processing costs
- **Exception:** Final payout can be any amount
- **Override:** Admin can manually initiate smaller payouts

### Escrow/Rolling Reserve
- **Standard:** 7-day rolling reserve (BILL-003)
- **High-risk:** 30-day rolling reserve for new organizers
- **Eligibility:** Revenue available for payout after escrow period

### Payout Processing Time
- **ACH:** 3-5 business days
- **Wire:** 1-2 business days (+ $15 fee)
- **Instant:** 30 minutes (+ 1% fee)

### Bank Account Verification
- **Required:** Before first payout
- **Methods:**
  1. Micro-deposits (2-3 days)
  2. Plaid instant verification
  3. Manual verification (admin review)
- **Attempts:** 3 attempts to verify micro-deposits
- **Failure:** Account locked after 3 failed attempts

### Automatic Payouts
- **Frequency:** Weekly (every Monday) or Monthly (1st of month)
- **Minimum:** $50 (configurable by organizer)
- **Conditions:** Only if available balance >= minimum
- **Opt-out:** Can disable at any time

### Failed Payout Handling
1. **Day 0:** Payout fails, status = FAILED
2. **Day 1:** Retry automatically
3. **Day 3:** Retry again if still failing
4. **Day 7:** Final retry
5. **After 3 retries:** Manual review required, notify organizer

Common failure reasons:
- Invalid account number
- Closed account
- Insufficient funds (rare, should not happen)
- Bank rejected transaction

### Payout Limits (Fraud Prevention)
- **Unverified:** $0 (must verify bank account)
- **Basic verification:** $10,000 per payout
- **Enhanced verification:** $50,000 per payout
- **No limit:** Fully verified with KYC

## KYC & Compliance

### Know Your Customer (KYC)
Required information:
- Full legal name
- Date of birth
- Social Security Number (US) or Tax ID
- Government-issued ID verification
- Business information (if applicable)

### Tax Forms
- **W-9:** US citizens and residents
- **W-8:** International organizers
- **Collection:** Before first payout exceeding $600
- **Storage:** Encrypted, 7-year retention

### 1099-K Generation
- **Threshold:** Organizers with >$20,000 revenue and >200 transactions
- **Due date:** January 31st for previous year
- **Delivery:** Mailed and available for download
- **IRS filing:** Platform files with IRS

## UI/UX Specifications

### Payout Dashboard
```tsx
// Component: components/dashboard/PayoutDashboard.tsx
<div>
  <BalanceCard
    available={availableBalance}
    held={heldBalance}
    pending={pendingPayouts}
  />

  <PayoutRequestForm
    maxAmount={availableBalance}
    minimumAmount={50}
    bankAccounts={bankAccounts}
  />

  <PayoutHistory payouts={recentPayouts} />

  <AutomaticPayoutSettings schedule={payoutSchedule} />
</div>
```

### Bank Account Management
- List of saved bank accounts
- Add new account button
- Verification status badges
- Set primary account option
- Delete account (with confirmation)

### Payout Request Flow
1. Enter amount (validate >= $50, <= available balance)
2. Select bank account (or add new one)
3. Choose payout method (ACH free, instant 1% fee)
4. Review and confirm
5. Show estimated arrival date
6. Email confirmation

## Testing Requirements

### Unit Tests
- Payout amount validation
- Processing fee calculation
- Bank account verification logic
- Failed payout retry logic
- Automatic payout scheduling

### Integration Tests
- End-to-end payout request flow
- Stripe Connect payout creation
- Plaid bank verification
- Webhook handling
- Email notifications

### Security Tests
- Bank account encryption
- Access control (organizers can only access their payouts)
- SQL injection prevention
- XSS prevention in payout descriptions

## Performance Requirements

- Payout request processing: < 3 seconds
- Available balance calculation: < 500ms (cached)
- Payout history query: < 1 second
- Bank account verification: < 5 seconds (Plaid)
- Automatic payout job: < 15 minutes for 1,000 payouts

## Security Considerations

### Data Encryption
- Encrypt routing and account numbers at rest (AES-256)
- Use HTTPS for all API calls
- Mask account numbers in UI (show last 4 only)

### Access Control
- Organizers can only access their own payouts
- Admin role required for manual payouts
- Two-factor authentication for payout requests (optional)

### Fraud Detection
- Flag unusual payout patterns (frequency, amount)
- Verify IP address and device fingerprint
- Require re-authentication for large payouts
- Monitor for account takeover attempts

## Monitoring & Alerts

### Real-Time Alerts
- Payout request failure
- Failed bank account verification
- Unusual payout pattern detected
- Stripe API errors

### Daily Reports
- Total payouts processed
- Total payout amount
- Failed payouts requiring review
- Pending payouts to process

### Monthly Metrics
- Total payout volume
- Average payout amount
- Payout success rate
- Time to complete payout

## Documentation Requirements

- [ ] Organizer payout guide (help center)
- [ ] Bank account verification instructions
- [ ] Payout timeline and fees
- [ ] Automatic payout setup guide
- [ ] Troubleshooting failed payouts
- [ ] Tax form collection process

## Dependencies

- BILL-003: Revenue Distribution System (must complete first)
- BILL-001: Flat-Fee Transaction Billing (must complete first)
- Stripe Connect integration setup
- KYC/verification system (may be separate epic)

## Definition of Done

- [ ] Payout service implemented and tested
- [ ] Database schema created with encryption
- [ ] Bank account management complete
- [ ] Stripe Connect integration operational
- [ ] Plaid integration for instant verification (optional)
- [ ] Automatic payout scheduling working
- [ ] Failed payout retry logic implemented
- [ ] Email notifications configured
- [ ] UI components complete
- [ ] All tests passing (unit, integration, security)
- [ ] KYC and tax form collection integrated
- [ ] Performance benchmarks met
- [ ] Security audit completed
- [ ] Monitoring and alerts configured
- [ ] Documentation published

## Notes

**PCI Compliance:** Never store full bank account numbers in logs or plain text. Always use encryption.

**Stripe vs. Manual ACH:** Consider using Stripe Connect for simplicity vs. direct bank integration for lower fees.

**Instant Payouts:** 1% fee is charged by Stripe for instant payouts. Make sure organizers understand the fee structure.

**International Payouts:** Future enhancement. Current implementation US-only (ACH).

**Payout Reversals:** Handle bank rejections and reversals. If a payout is reversed, deduct from organizer's balance and send notification.