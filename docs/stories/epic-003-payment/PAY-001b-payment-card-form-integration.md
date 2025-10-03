# Story: PAY-001b - Payment Card Form Integration

**Epic**: EPIC-003 - Payment Processing Foundation
**Parent Story**: PAY-001 - Square SDK Integration
**Story Points**: 3
**Priority**: P0 (Critical)
**Status**: Draft
**Dependencies**: PAY-001a (requires Square SDK setup)

---

## Sharding Rationale

This sub-story is the second of three shards from PAY-001 (8 points). PAY-001b focuses exclusively on the frontend payment form integration using Square's Web Payments SDK, building on the configuration foundation established in PAY-001a.

**Why This Shard Exists**:
- Isolates frontend form integration from backend processing
- Creates independently testable UI component
- Enables frontend team to work in parallel with backend
- Focuses on user experience and form validation
- Smaller PR = better UI/UX review quality

**Scope Boundaries**:
- ✅ Square Web Payments SDK initialization
- ✅ Card input form UI component
- ✅ Form validation and styling
- ✅ Payment tokenization (client-side)
- ✅ SCA (Strong Customer Authentication) compliance
- ❌ Backend payment processing (PAY-001c)
- ❌ Webhook handling (PAY-001c)
- ❌ Error handling beyond form-level (PAY-001c)

---

## Story

**As a** event attendee
**I want to** enter my payment card securely in a validated form
**So that** I can purchase event tickets with confidence

---

## Acceptance Criteria

1. GIVEN checkout page needs to accept payments
   WHEN the page loads
   THEN Square Web Payments SDK should:
   - Load asynchronously without blocking page render
   - Initialize with application ID from environment
   - Show loading skeleton while SDK initializes
   - Initialize card payment method
   - Display payment form when ready
   - Handle SDK loading failures with retry option

2. GIVEN user needs to enter card information
   WHEN payment form is displayed
   THEN the form should:
   - Show secure Square-hosted card input field (iframe)
   - Accept card number, expiration date, CVV, postal code
   - Display card brand icon (Visa, Mastercard, etc.)
   - Use consistent styling matching site design
   - Show real-time validation feedback
   - Display clear field labels and placeholders
   - Be fully keyboard accessible (WCAG 2.1 AA)
   - Work on mobile devices with appropriate keyboard

3. GIVEN user is entering payment information
   WHEN they interact with form fields
   THEN the form should:
   - Validate card number format in real-time
   - Validate expiration date (not expired)
   - Validate CVV length (3-4 digits based on card type)
   - Validate postal code format
   - Show inline error messages for invalid input
   - Disable submit button while form invalid
   - Enable submit button when form complete and valid
   - Clear errors when user corrects input

4. GIVEN user submits valid payment information
   WHEN they click "Pay Now" button
   THEN the system should:
   - Show loading state on submit button
   - Disable form inputs during processing
   - Call Square SDK tokenization method
   - Receive payment token (nonce) from Square
   - Include card brand and last 4 digits in token response
   - Pass token to parent component/API
   - Never send raw card data to our server

5. GIVEN tokenization fails
   WHEN Square SDK cannot create token
   THEN the system should:
   - Display user-friendly error message
   - Log detailed error for debugging
   - Re-enable form for retry
   - Reset submit button state
   - Maintain user input (except CVV)
   - Suggest corrective action if applicable

6. GIVEN payment form needs to be PCI compliant
   WHEN handling card data at any point
   THEN the system must:
   - Use Square-hosted iframe for card input (PCI DSS SAQ-A)
   - Never touch or log raw card data
   - Never store card data in local storage or cookies
   - Use HTTPS for all connections
   - Implement CSP headers to prevent XSS
   - Pass security audit checklist

7. GIVEN mobile users need to complete payment
   WHEN accessing form on mobile device
   THEN the form should:
   - Display Cash App Pay button (if available)
   - Show Apple Pay option (if available in Safari)
   - Show Google Pay option (if available in Chrome)
   - Use responsive design for small screens
   - Display appropriate keyboard types (numeric for card)
   - Support autofill/Apple Pay/Google Pay integration

---

## Tasks / Subtasks

- [ ] Create Square Web Payments SDK initialization (AC: 1)
  - [ ] Create lib/square/web-payments.ts utility
  - [ ] Load Square Web Payments SDK script
  - [ ] Initialize with SQUARE_APPLICATION_ID
  - [ ] Set correct environment (sandbox/production)
  - [ ] Create payments instance
  - [ ] Handle SDK loading errors
  - [ ] Add retry logic for SDK load failures

- [ ] Build payment form React component (AC: 2)
  - [ ] Create components/payment/SquarePaymentForm.tsx
  - [ ] Add loading skeleton state
  - [ ] Create container for Square card element
  - [ ] Add form labels and accessibility attributes
  - [ ] Implement responsive layout
  - [ ] Add TypeScript interfaces for props

- [ ] Initialize Square Card payment method (AC: 2)
  - [ ] Call payments.card() to create card instance
  - [ ] Attach card to DOM container element
  - [ ] Configure card styling to match site theme
  - [ ] Add card brand icon display
  - [ ] Handle card initialization errors

- [ ] Implement form validation (AC: 3)
  - [ ] Listen to card input events
  - [ ] Validate card number format
  - [ ] Validate expiration date
  - [ ] Validate CVV length
  - [ ] Validate postal code format
  - [ ] Show inline error messages
  - [ ] Control submit button disabled state
  - [ ] Add field-level validation feedback

- [ ] Create payment tokenization flow (AC: 4)
  - [ ] Add handlePayment() function
  - [ ] Call card.tokenize() on submit
  - [ ] Handle successful tokenization
  - [ ] Extract token, card brand, last 4 digits
  - [ ] Pass token to parent component callback
  - [ ] Add loading state management
  - [ ] Disable form during tokenization

- [ ] Implement error handling for tokenization (AC: 5)
  - [ ] Catch tokenization errors
  - [ ] Map error codes to user-friendly messages
  - [ ] Display error in UI
  - [ ] Log error details for debugging
  - [ ] Re-enable form for retry
  - [ ] Reset button loading state
  - [ ] Preserve form values (except CVV)

- [ ] Add alternative payment methods (AC: 7)
  - [ ] Initialize Cash App Pay method
  - [ ] Initialize Apple Pay method (Safari only)
  - [ ] Initialize Google Pay method (Chrome only)
  - [ ] Show/hide based on device capability
  - [ ] Implement tokenization for each method
  - [ ] Add mobile-optimized UI

- [ ] Style payment form to match site design (AC: 2)
  - [ ] Configure Square card styling options
  - [ ] Match font family, size, colors
  - [ ] Style focus states
  - [ ] Style error states
  - [ ] Add consistent spacing and borders
  - [ ] Test dark mode compatibility

- [ ] Implement accessibility features (AC: 2)
  - [ ] Add ARIA labels to all form fields
  - [ ] Ensure keyboard navigation works
  - [ ] Test with screen reader
  - [ ] Add focus indicators
  - [ ] Ensure color contrast meets WCAG 2.1 AA
  - [ ] Add skip links if needed

- [ ] Add PCI compliance measures (AC: 6)
  - [ ] Verify Square iframe isolation
  - [ ] Add Content-Security-Policy headers
  - [ ] Never log card data
  - [ ] Never store card data locally
  - [ ] Force HTTPS connection
  - [ ] Document PCI SAQ-A compliance

- [ ] Create loading and empty states (AC: 1)
  - [ ] Design loading skeleton
  - [ ] Add spinner during tokenization
  - [ ] Show SDK loading state
  - [ ] Handle SDK timeout gracefully
  - [ ] Add retry button for failed loads

- [ ] Add comprehensive error messages (AC: 5)
  - [ ] Map Square error codes to messages
  - [ ] Create user-friendly error text
  - [ ] Add contextual help for common errors
  - [ ] Display errors inline and prominently
  - [ ] Add error recovery suggestions

---

## Dev Notes

### Architecture References

**Square Web Payments SDK**:
- Version: @square/web-sdk@^2.0.0
- Payment Methods: Card, Cash App Pay, Apple Pay, Google Pay
- Tokenization: Client-side, PCI compliant (SAQ-A)
- Styling: Customizable to match site design

**Security Requirements**:
- PCI DSS SAQ-A compliance through Square iframe
- Never touch raw card data
- All communication over HTTPS/TLS 1.3
- CSP headers to prevent XSS
- No card data in logs or storage

**Source Tree**:
```
src/
├── app/
│   └── checkout/page.tsx              (Uses SquarePaymentForm)
├── components/
│   └── payment/
│       ├── SquarePaymentForm.tsx      (Main payment form - NEW)
│       ├── PaymentMethodButtons.tsx   (Alt payment methods - NEW)
│       └── PaymentFormLoading.tsx     (Loading skeleton - NEW)
├── lib/
│   └── square/
│       ├── web-payments.ts            (SDK initialization - NEW)
│       └── payment-errors.ts          (Error mapping - NEW)
└── hooks/
    └── useSquarePayment.ts            (Payment form hook - NEW)
```

**Component Interface** (SquarePaymentForm.tsx):
```typescript
interface SquarePaymentFormProps {
  amount: number;
  currency: string;
  onTokenReceived: (token: PaymentToken) => void;
  onError: (error: PaymentError) => void;
  disabled?: boolean;
}

interface PaymentToken {
  token: string;
  cardBrand: string;
  last4: string;
  expirationMonth: number;
  expirationYear: number;
}
```

**Implementation Example** (lib/square/web-payments.ts):
```typescript
import { payments } from '@square/web-sdk';

export async function initializeSquarePayments() {
  try {
    const paymentsInstance = await payments(
      process.env.NEXT_PUBLIC_SQUARE_APPLICATION_ID!,
      process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID!
    );
    return paymentsInstance;
  } catch (error) {
    console.error('Square Payments SDK failed to load:', error);
    throw new Error('Payment system unavailable. Please try again.');
  }
}

export async function createCardPayment(paymentsInstance: Payments) {
  const card = await paymentsInstance.card();
  await card.attach('#card-container');
  return card;
}
```

---

## Testing

### Test Standards
- Test file: `__tests__/components/payment/SquarePaymentForm.test.tsx`
- Test file: `__tests__/lib/square/web-payments.test.ts`
- E2E test: `e2e/checkout/payment-form.spec.ts`

### Testing Requirements

**Unit Tests**:
- ✅ Test component renders loading state initially
- ✅ Test component renders form when SDK loaded
- ✅ Test form validation logic
- ✅ Test submit button disabled when form invalid
- ✅ Test submit button enabled when form valid
- ✅ Test tokenization success flow
- ✅ Test tokenization error handling
- ✅ Test error message display
- ✅ Mock Square SDK for all tests

**Integration Tests**:
- ✅ Test actual Square Sandbox tokenization
- ✅ Test with valid test card (4111 1111 1111 1111)
- ✅ Test with declined card (4000 0000 0000 0002)
- ✅ Test Cash App Pay on mobile
- ✅ Test form styling matches design system

**E2E Tests**:
- ✅ Test complete payment form flow
- ✅ Test form validation UX
- ✅ Test tokenization and token passing
- ✅ Test mobile responsive layout
- ✅ Test keyboard navigation
- ✅ Test screen reader compatibility

**Accessibility Tests**:
- ✅ WCAG 2.1 AA compliance (axe-core)
- ✅ Keyboard navigation complete flow
- ✅ Screen reader announcement testing
- ✅ Color contrast validation
- ✅ Focus indicator visibility

### Test Coverage Target
- Minimum 85% code coverage for form component
- 100% coverage for tokenization logic
- All error states must be tested

---

## Definition of Done

- [ ] Square Web Payments SDK initialization utility created
- [ ] SquarePaymentForm component built and styled
- [ ] Card payment method integrated
- [ ] Form validation implemented (real-time feedback)
- [ ] Payment tokenization flow working
- [ ] Error handling for tokenization complete
- [ ] Alternative payment methods added (Cash App, Apple/Google Pay)
- [ ] Form styling matches site design system
- [ ] Accessibility features implemented (WCAG 2.1 AA)
- [ ] PCI compliance measures verified
- [ ] Loading and error states complete
- [ ] All unit tests passing (85%+ coverage)
- [ ] Integration test with Square Sandbox passing
- [ ] E2E test for payment form passing
- [ ] Accessibility audit passing (axe-core)
- [ ] Code review completed
- [ ] PR merged to main branch

---

## Related Stories

- **PAY-001a**: Square SDK Setup & Configuration (dependency - must be completed first)
- **PAY-001c**: Payment Processing & Error Handling (blocks this story - next in sequence)
- **PAY-002**: Credit Card Processing (requires PAY-001 completion)
- **PAY-006**: Payment Error Handling (enhanced error UX)

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