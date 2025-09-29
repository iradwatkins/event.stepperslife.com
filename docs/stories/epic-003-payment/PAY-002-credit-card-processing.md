# Story: PAY-002 - Credit/Debit Card Payment Processing

**Epic**: EPIC-003 - Payment Processing Foundation
**Story Points**: 5
**Priority**: P0 (Critical)
**Status**: Draft
**Dependencies**: PAY-001 (Square SDK Integration), TIX-001 (QR Code Generation), Email service

---

## Story

**As a** ticket purchaser
**I want to** pay securely with my credit or debit card
**So that** I can complete my ticket purchase quickly and safely

---

## Acceptance Criteria

1. GIVEN I have tickets in my cart
   WHEN I proceed to checkout
   THEN I should see complete order summary:
   - Itemized list of tickets with quantities
   - Individual ticket prices
   - Platform service fee clearly displayed
   - Tax amount (if applicable)
   - Total amount due prominently shown
   - Secure Square payment form
   - Trust badges and security indicators

2. GIVEN I enter valid payment card information
   WHEN I click "Complete Purchase"
   THEN the system should:
   - Show processing indicator with "Please wait"
   - Disable form submission to prevent double-charging
   - Tokenize card details securely with Square
   - Process payment through Square Payments API
   - Generate order confirmation number
   - Create QR codes for purchased tickets
   - Send confirmation email with tickets
   - Redirect to success page with order details

3. GIVEN my payment card is declined
   WHEN Square returns decline response
   THEN I should see specific error message:
   - "Payment declined. Please try another card"
   - Decline reason if provided by Square (insufficient funds, etc.)
   - Option to try different payment method
   - Cart contents preserved for retry
   AND no charge should be processed
   AND no tickets should be reserved or generated

4. GIVEN payment processing takes longer than expected
   WHEN request exceeds timeout limits
   THEN system should:
   - Continue showing processing indicator
   - Check payment status via Square API
   - Handle successful delayed payments correctly
   - Provide clear status to customer
   - Avoid duplicate charges if retried

5. GIVEN payment succeeds but email delivery fails
   WHEN transaction completes successfully
   THEN tickets should still be created and accessible
   AND email should be queued for retry delivery
   AND customer should see partial success message
   AND tickets should be available in account dashboard

---

## Tasks / Subtasks

- [ ] Implement secure checkout form with validation (AC: 1)
  - [ ] Create checkout page component
  - [ ] Build order summary display
  - [ ] Integrate Square payment form

- [ ] Create payment processing workflow (AC: 2)
  - [ ] Build payment API endpoint
  - [ ] Implement payment tokenization
  - [ ] Process payment with Square

- [ ] Add comprehensive error handling for decline codes (AC: 3)
  - [ ] Map Square error codes
  - [ ] Create user-friendly error messages
  - [ ] Handle different decline reasons

- [ ] Implement payment timeout and retry logic (AC: 4)
  - [ ] Set payment timeout (30 seconds)
  - [ ] Check payment status on timeout
  - [ ] Prevent duplicate charges

- [ ] Create order confirmation and receipt generation (AC: 2)
  - [ ] Generate order confirmation number
  - [ ] Create order receipt PDF
  - [ ] Store order details

- [ ] Add payment success page with order details (AC: 2)
  - [ ] Design success page
  - [ ] Display order summary
  - [ ] Show ticket download links

- [ ] Implement ticket generation upon successful payment (AC: 2)
  - [ ] Create tickets in database
  - [ ] Generate QR codes for each ticket
  - [ ] Associate tickets with order

- [ ] Create email delivery system with retry logic (AC: 5)
  - [ ] Send confirmation email
  - [ ] Implement retry on failure
  - [ ] Queue failed emails

- [ ] Add payment security measures (rate limiting) (AC: 3)
  - [ ] Rate limit payment attempts
  - [ ] Track failed payments by IP
  - [ ] Implement fraud prevention

- [ ] Implement order status tracking (AC: 2, 4)
  - [ ] Track order lifecycle
  - [ ] Update order status
  - [ ] Provide status API

- [ ] Create payment reconciliation reports (AC: 2)
  - [ ] Match payments to orders
  - [ ] Generate daily reconciliation
  - [ ] Alert on discrepancies

- [ ] Add fraud detection integration (AC: 3)
  - [ ] Integrate Square fraud tools
  - [ ] Flag suspicious transactions
  - [ ] Manual review process

- [ ] Implement payment analytics and monitoring (AC: 2, 3)
  - [ ] Track payment success rates
  - [ ] Monitor decline reasons
  - [ ] Alert on anomalies

- [ ] Create refund processing system foundation (AC: 5)
  - [ ] Build refund API
  - [ ] Integrate with Square refunds
  - [ ] Update ticket status on refund

---

## Dev Notes

### Architecture References

**Payment Processing** (`docs/architecture/integrations.md`):
- Square Web Payments SDK for PCI compliance
- Tokenization happens client-side
- Server processes tokenized payment
- Idempotency keys prevent duplicate charges
- Webhooks confirm payment status

**Order Processing** (`docs/architecture/business-logic.md`):
1. Create order in database (PENDING status)
2. Reserve tickets from inventory
3. Process payment with Square
4. Update order status (PAID/FAILED)
5. Generate tickets with QR codes
6. Send confirmation email
7. Release inventory if payment fails

**Error Handling** (`docs/architecture/system-overview.md`):
- Graceful degradation for non-critical failures
- Email failure doesn't block order completion
- Payment timeout triggers status check
- All errors logged for analysis

**Database Schema** (`prisma/schema.prisma`):
```prisma
model Order {
  id                String   @id @default(cuid())
  userId            String
  user              User     @relation(fields: [userId], references: [id])
  eventId           String
  event             Event    @relation(fields: [eventId], references: [id])
  confirmationNumber String  @unique
  status            OrderStatus @default(PENDING)
  subtotal          Decimal  @db.Decimal(10, 2)
  platformFee       Decimal  @db.Decimal(10, 2)
  tax               Decimal  @db.Decimal(10, 2)
  total             Decimal  @db.Decimal(10, 2)
  squarePaymentId   String?
  tickets           Ticket[]
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  @@index([userId])
  @@index([eventId])
  @@index([status])
}

enum OrderStatus {
  PENDING
  PROCESSING
  PAID
  FAILED
  REFUNDED
  CANCELLED
}
```

**Source Tree** (`docs/architecture/source-tree.md`):
```
src/
├── app/
│   ├── api/
│   │   ├── checkout/
│   │   │   └── route.ts
│   │   └── orders/
│   │       └── [id]/
│   │           ├── route.ts
│   │           └── status/route.ts
│   ├── checkout/page.tsx
│   └── order/
│       └── [id]/
│           └── success/page.tsx
├── components/
│   └── checkout/
│       ├── CheckoutForm.tsx
│       ├── OrderSummary.tsx
│       └── PaymentForm.tsx
└── lib/
    ├── payment/
    │   ├── process.ts
    │   └── refund.ts
    └── orders/
        └── confirmation.ts
```

### Testing

**Testing Requirements for this story**:
- Unit tests for payment processing logic
- Unit tests for error code mapping
- Integration test for payment API
- Integration test with Square sandbox
- E2E test for successful payment flow
- E2E test for declined payment handling
- E2E test for timeout scenarios
- Test idempotency (prevent duplicate charges)
- Test email retry mechanism
- Load test for concurrent payments
- Security audit for PCI compliance
- Test all Square decline scenarios

---

## Change Log

| Date | Version | Description | Author |
|------|---------|-------------|---------|
| 2024-01-15 | 1.0 | Initial story creation | SM Agent |

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