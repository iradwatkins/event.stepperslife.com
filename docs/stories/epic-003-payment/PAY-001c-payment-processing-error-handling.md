# Story: PAY-001c - Payment Processing & Error Handling

**Epic**: EPIC-003 - Payment Processing Foundation
**Parent Story**: PAY-001 - Square SDK Integration
**Story Points**: 2
**Priority**: P0 (Critical)
**Status**: Draft
**Dependencies**: PAY-001a (SDK setup), PAY-001b (payment form)

---

## Sharding Rationale

This sub-story is the final of three shards from PAY-001 (8 points). PAY-001c focuses exclusively on backend payment processing and comprehensive error handling, completing the end-to-end payment flow established by PAY-001a (setup) and PAY-001b (form).

**Why This Shard Exists**:
- Isolates backend processing logic from frontend concerns
- Creates independently testable API layer
- Focuses on reliability, error handling, and edge cases
- Ensures proper webhook integration
- Smaller PR = better security and error handling review

**Scope Boundaries**:
- ✅ Payment processing API endpoints
- ✅ Square Payments API integration
- ✅ Comprehensive error handling and categorization
- ✅ Webhook endpoint and signature verification
- ✅ Payment status tracking and reconciliation
- ✅ Idempotency and duplicate prevention
- ❌ Frontend payment form (PAY-001b - completed)
- ❌ SDK initialization (PAY-001a - completed)

---

## Story

**As a** platform administrator
**I want to** process payments reliably with comprehensive error handling
**So that** transactions are secure, traceable, and failures are handled gracefully

---

## Acceptance Criteria

1. GIVEN a payment token is received from frontend
   WHEN POST /api/payments/process is called
   THEN the system should:
   - Validate payment token format and authenticity
   - Validate amount and currency
   - Validate order ID exists and is valid
   - Check order is not already paid
   - Generate unique idempotency key
   - Call Square Payments API with token
   - Create payment record in database
   - Return payment result with status
   - Handle concurrent payment attempts (idempotency)

2. GIVEN Square API returns successful payment
   WHEN payment is processed
   THEN the system should:
   - Store Square payment ID for reconciliation
   - Update order status to "paid"
   - Store payment metadata (card brand, last 4, etc.)
   - Create audit log entry
   - Trigger downstream processes (ticket generation)
   - Send payment confirmation email
   - Return success response with payment ID

3. GIVEN Square API returns payment failure
   WHEN payment processing fails
   THEN the system should:
   - Categorize error type (declined, expired, network, etc.)
   - Log detailed error with Square error code
   - Return user-friendly error message
   - Preserve order in "pending payment" state
   - Do not charge customer or create payment record
   - Track failed attempt for fraud detection
   - Return appropriate HTTP status code (400/500)

4. GIVEN network issues or API timeout occurs
   WHEN communicating with Square API
   THEN the system should:
   - Implement retry logic with exponential backoff
   - Maximum 3 retry attempts for idempotent operations
   - Use idempotency key to prevent duplicate charges
   - Log each retry attempt
   - Return timeout error after max retries
   - Provide admin notification for persistent failures

5. GIVEN webhooks are received from Square
   WHEN POST /api/webhooks/square is called
   THEN the system should:
   - Verify webhook signature for authenticity
   - Check webhook event type (payment.created, payment.updated)
   - Extract payment ID and status
   - Update payment status in database
   - Handle duplicate webhook deliveries (idempotency)
   - Return 200 OK to acknowledge receipt
   - Log webhook processing for audit
   - Trigger status change notifications if needed

6. GIVEN duplicate webhook or API call occurs
   WHEN the same payment is processed multiple times
   THEN the system should:
   - Use idempotency keys to detect duplicates
   - Return original result for duplicate requests
   - Never charge customer multiple times
   - Log duplicate attempt
   - Store idempotency record with expiration (24 hours)

7. GIVEN payment requires reconciliation
   WHEN payment status needs to be verified
   THEN the system should:
   - Store Square payment ID with order
   - Enable lookup by Square payment ID
   - Track payment lifecycle states
   - Support manual reconciliation queries
   - Generate reconciliation reports
   - Flag discrepancies for admin review

8. GIVEN payment errors need investigation
   WHEN errors occur at any stage
   THEN the system should:
   - Log all error details (never log card data)
   - Include Square error codes and messages
   - Log request IDs for Square support
   - Track error rates and patterns
   - Alert admins for critical errors (>5% failure rate)
   - Provide debugging context (order ID, amount, timestamp)

---

## Tasks / Subtasks

- [ ] Create payment processing API endpoint (AC: 1, 2, 3)
  - [ ] Create app/api/payments/process/route.ts
  - [ ] Add request validation (token, amount, order)
  - [ ] Implement POST handler
  - [ ] Add authentication check (user owns order)
  - [ ] Add rate limiting (10 requests/minute per IP)

- [ ] Implement Square payment processing (AC: 1, 2)
  - [ ] Create lib/payments/process-payment.ts
  - [ ] Call Square PaymentsApi.createPayment()
  - [ ] Pass payment token, amount, currency
  - [ ] Include idempotency key in request
  - [ ] Set location ID from config
  - [ ] Handle successful payment response
  - [ ] Extract payment ID and status

- [ ] Add payment database operations (AC: 2)
  - [ ] Create Payment model in Prisma schema
  - [ ] Add payment creation function
  - [ ] Store Square payment ID
  - [ ] Store payment metadata (card, amount, status)
  - [ ] Link payment to order
  - [ ] Update order status on payment success
  - [ ] Add payment audit log entries

- [ ] Implement comprehensive error handling (AC: 3, 8)
  - [ ] Create lib/payments/payment-errors.ts
  - [ ] Map Square error codes to user messages
  - [ ] Categorize errors (card declined, expired, network, etc.)
  - [ ] Log detailed error information
  - [ ] Return appropriate HTTP status codes
  - [ ] Never expose sensitive error details to client
  - [ ] Track error metrics

- [ ] Add retry logic with exponential backoff (AC: 4)
  - [ ] Create lib/utils/retry.ts utility
  - [ ] Implement retry with backoff (1s, 2s, 4s)
  - [ ] Max 3 attempts for network errors
  - [ ] Use same idempotency key for retries
  - [ ] Log each retry attempt
  - [ ] Throw after max retries

- [ ] Implement idempotency system (AC: 1, 6)
  - [ ] Create IdempotencyKey model in Prisma
  - [ ] Generate unique key per payment attempt
  - [ ] Store idempotency record before API call
  - [ ] Return cached result for duplicate requests
  - [ ] Set 24-hour expiration on records
  - [ ] Clean up expired records (cron job)

- [ ] Create webhook endpoint (AC: 5)
  - [ ] Create app/api/webhooks/square/route.ts
  - [ ] Implement POST handler
  - [ ] Add webhook signature verification
  - [ ] Parse webhook payload
  - [ ] Handle payment.created event
  - [ ] Handle payment.updated event
  - [ ] Return 200 OK response

- [ ] Implement webhook signature verification (AC: 5)
  - [ ] Create lib/square/webhook-verify.ts
  - [ ] Get signature from request headers
  - [ ] Get webhook signature key from environment
  - [ ] Verify signature using Square SDK
  - [ ] Reject invalid signatures (401)
  - [ ] Log verification failures

- [ ] Add webhook idempotency handling (AC: 5, 6)
  - [ ] Extract webhook event ID
  - [ ] Check if event already processed
  - [ ] Return 200 if duplicate (already processed)
  - [ ] Mark event as processed after handling
  - [ ] Store processed event IDs with expiration

- [ ] Implement payment status tracking (AC: 7)
  - [ ] Add status field to Payment model
  - [ ] Track: pending, completed, failed, refunded
  - [ ] Update status from webhooks
  - [ ] Add payment lookup by Square ID
  - [ ] Create payment status query endpoint
  - [ ] Add payment history to order view

- [ ] Create payment reconciliation system (AC: 7)
  - [ ] Store all Square payment IDs
  - [ ] Create reconciliation report generator
  - [ ] Compare Square transactions with database
  - [ ] Flag discrepancies
  - [ ] Add manual reconciliation interface
  - [ ] Schedule daily reconciliation job

- [ ] Add comprehensive logging (AC: 8)
  - [ ] Log payment processing start
  - [ ] Log Square API requests (no card data)
  - [ ] Log API responses with status
  - [ ] Log all errors with context
  - [ ] Log webhook events
  - [ ] Never log sensitive data (tokens, cards)
  - [ ] Add structured logging for monitoring

- [ ] Implement admin alerting (AC: 8)
  - [ ] Track payment error rate
  - [ ] Alert if error rate >5%
  - [ ] Alert on webhook signature failures
  - [ ] Alert on repeated API failures
  - [ ] Send alerts via email/Slack
  - [ ] Add admin dashboard for payment health

- [ ] Create payment error recovery (AC: 3, 4)
  - [ ] Handle temporary failures gracefully
  - [ ] Preserve order state on failure
  - [ ] Enable customer retry
  - [ ] Add manual payment retry for admins
  - [ ] Document error recovery procedures

---

## Dev Notes

### Architecture References

**Square Payments API**:
- Use Square Node SDK PaymentsApi
- Endpoint: createPayment()
- Requires: source_id (token), amount, currency, location_id
- Optional: idempotency_key, note, order_id
- Response: Payment object with ID, status, receipt info

**Webhook Events**:
- payment.created - New payment created
- payment.updated - Payment status changed (completed, failed)
- Signature verification required for security
- Idempotent processing for duplicate deliveries

**Source Tree**:
```
src/
├── app/
│   └── api/
│       ├── payments/
│       │   └── process/route.ts       (Payment processing - NEW)
│       └── webhooks/
│           └── square/route.ts        (Webhook handler - NEW)
├── lib/
│   ├── payments/
│   │   ├── process-payment.ts         (Payment logic - NEW)
│   │   ├── payment-errors.ts          (Error mapping - NEW)
│   │   └── reconciliation.ts          (Reconciliation - NEW)
│   ├── square/
│   │   └── webhook-verify.ts          (Signature verify - NEW)
│   └── utils/
│       └── retry.ts                   (Retry utility - NEW)
└── prisma/
    └── schema.prisma                  (Payment model - NEW)
```

**Prisma Models** (schema.prisma):
```prisma
model Payment {
  id              String   @id @default(cuid())
  squarePaymentId String   @unique
  orderId         String
  order           Order    @relation(fields: [orderId], references: [id])
  amount          Int      // cents
  currency        String   @default("USD")
  status          String   // pending, completed, failed, refunded
  cardBrand       String?
  last4           String?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@index([orderId])
  @@index([squarePaymentId])
}

model IdempotencyKey {
  key        String   @id
  result     Json     // cached response
  expiresAt  DateTime
  createdAt  DateTime @default(now())

  @@index([expiresAt])
}
```

**API Response Format**:
```typescript
// Success
{
  success: true,
  payment: {
    id: "payment_123",
    squarePaymentId: "sq_xyz",
    status: "completed",
    amount: 5000, // cents
    currency: "USD"
  }
}

// Error
{
  success: false,
  error: {
    code: "CARD_DECLINED",
    message: "Your card was declined. Please try another payment method.",
    squareErrorCode: "GENERIC_DECLINE"
  }
}
```

---

## Testing

### Test Standards
- Test file: `__tests__/api/payments/process.test.ts`
- Test file: `__tests__/lib/payments/process-payment.test.ts`
- Test file: `__tests__/api/webhooks/square.test.ts`
- Test file: `__tests__/lib/square/webhook-verify.test.ts`
- E2E test: `e2e/payments/complete-payment-flow.spec.ts`

### Testing Requirements

**Unit Tests**:
- ✅ Test payment processing with valid token
- ✅ Test payment failure handling (card declined)
- ✅ Test idempotency key generation and checking
- ✅ Test retry logic with network failures
- ✅ Test error categorization and mapping
- ✅ Test webhook signature verification
- ✅ Test webhook duplicate detection
- ✅ Mock Square API for all tests

**Integration Tests**:
- ✅ Test actual payment with Square Sandbox
- ✅ Test with valid test card (4111 1111 1111 1111)
- ✅ Test with declined card (4000 0000 0000 0002)
- ✅ Test with expired card
- ✅ Test webhook delivery to local endpoint
- ✅ Test payment reconciliation

**E2E Tests**:
- ✅ Test complete payment flow (form → API → webhook)
- ✅ Test successful payment updates order status
- ✅ Test failed payment preserves order state
- ✅ Test duplicate payment prevention
- ✅ Test concurrent payment attempts

**Error Scenario Tests**:
- ✅ Test all Square error codes
- ✅ Test network timeout handling
- ✅ Test invalid webhook signatures
- ✅ Test race conditions (duplicate requests)
- ✅ Test retry exhaustion scenario

### Test Coverage Target
- Minimum 90% code coverage for payment processing
- 100% coverage for error handling paths
- All error codes must be tested

---

## Definition of Done

- [ ] Payment processing API endpoint created
- [ ] Square payment processing implemented
- [ ] Payment database model and operations complete
- [ ] Comprehensive error handling implemented
- [ ] Retry logic with exponential backoff working
- [ ] Idempotency system implemented
- [ ] Webhook endpoint created and secured
- [ ] Webhook signature verification working
- [ ] Webhook idempotency handling complete
- [ ] Payment status tracking implemented
- [ ] Payment reconciliation system created
- [ ] Comprehensive logging added (no sensitive data)
- [ ] Admin alerting system implemented
- [ ] All unit tests passing (90%+ coverage)
- [ ] Integration tests with Square Sandbox passing
- [ ] E2E test for complete payment flow passing
- [ ] Error scenario tests passing
- [ ] Security audit completed (webhook signatures, idempotency)
- [ ] Code review completed
- [ ] PR merged to main branch

---

## Related Stories

- **PAY-001a**: Square SDK Setup & Configuration (dependency - completed)
- **PAY-001b**: Payment Card Form Integration (dependency - completed)
- **PAY-002**: Credit Card Processing (requires PAY-001 completion)
- **PAY-003**: Payment Confirmation (next in payment flow)
- **PAY-006**: Payment Error Handling (enhanced error UX)
- **PAY-007**: Order Status Tracking (uses payment status)

---

## Change Log

| Date | Version | Description | Author |
|------|---------|-------------|---------|
| 2024-01-15 | 1.0 | Created from PAY-001 sharding | SM Agent |

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