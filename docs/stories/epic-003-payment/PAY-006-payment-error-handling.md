# PAY-006: Payment Error Handling & User Feedback

**Epic**: EPIC-003 - Payment Processing Foundation
**Story Points**: 3
**Priority**: Critical
**Status**: Ready for Development

---

## User Story

**As a** Ticket Buyer
**I want to** receive clear, actionable feedback when my payment fails
**So that** I understand what went wrong and know how to resolve the issue

**As a** Platform Administrator
**I want to** comprehensive logging of all payment errors
**So that** I can troubleshoot issues, monitor payment success rates, and improve the user experience

---

## Business Context

Payment failures are inevitable in any e-commerce system. Poor error handling leads to:
- Lost sales and frustrated customers
- Increased support tickets
- Abandoned carts
- Negative brand perception
- Compliance and security risks

Excellent error handling provides:
- Clear, user-friendly error messages
- Actionable next steps for users
- Comprehensive logging for troubleshooting
- Automated retry logic where appropriate
- Fallback options and alternative payment methods

---

## Acceptance Criteria

### 1. Error Categorization & Mapping

- [ ] System maps all Square error codes to user-friendly categories:
  - **Card Declined**: Insufficient funds, card limit exceeded, fraud suspicion
  - **Invalid Card**: Expired card, invalid CVV, invalid card number
  - **Processing Error**: Network timeout, gateway error, temporary unavailability
  - **Validation Error**: Missing required fields, invalid format
  - **Authorization Error**: 3D Secure failure, AVS mismatch
- [ ] Each error category has specific user-facing message template
- [ ] Technical error details logged separately from user messages
- [ ] Error categorization supports internationalization
- [ ] Unknown errors default to generic safe message

### 2. User-Friendly Error Messages

- [ ] Error messages are clear, concise, and non-technical
- [ ] Messages explain what happened without revealing sensitive details
- [ ] Messages provide specific next steps (e.g., "Try a different card")
- [ ] No raw error codes or technical jargon shown to users
- [ ] Messages maintain professional, helpful tone
- [ ] Support contact information included for persistent errors

**Example Messages**:
```
✗ Card Declined - Your card was declined by your bank.
  Please try a different payment method or contact your bank.

✗ Invalid Card - The card information appears to be incorrect.
  Please check the card number, expiration date, and CVV.

✗ Payment Processing Error - We're experiencing temporary difficulties.
  Please try again in a few moments.
```

### 3. Retry Logic & Idempotency

- [ ] System implements automatic retry for transient errors (network timeouts)
- [ ] Retry uses exponential backoff (1s, 2s, 4s delays)
- [ ] Maximum 3 retry attempts for automatic retries
- [ ] Each payment request has unique idempotency key
- [ ] Duplicate submissions within 5 minutes return cached result
- [ ] User can manually retry after failed attempt
- [ ] Retry button disabled during processing to prevent double-submit
- [ ] Idempotency keys stored with order records for reconciliation

### 4. Transaction State Management

- [ ] Order status updated atomically with payment status
- [ ] Failed payments transition order to FAILED state
- [ ] Pending payments transition to PENDING state (async processing)
- [ ] System handles race conditions with optimistic locking
- [ ] Failed orders can be retried without creating duplicates
- [ ] Abandoned orders (pending > 15 minutes) auto-expire
- [ ] State transitions logged in audit trail

### 5. Error Logging & Monitoring

- [ ] All payment errors logged with full context:
  - Order ID and user ID
  - Error code and category
  - Square transaction ID (if available)
  - Request payload (sanitized, no PCI data)
  - Response from Square API
  - Timestamp and retry attempt number
- [ ] Errors sent to monitoring system (Sentry) with appropriate severity
- [ ] High error rates trigger alerts to administrators
- [ ] Logs include correlation IDs for distributed tracing
- [ ] PCI-compliant logging (no card numbers, CVV, etc.)

### 6. Email Notifications

- [ ] Users receive email for failed payments with:
  - Order details and failed amount
  - Reason for failure (user-friendly)
  - Link to retry payment
  - Support contact information
- [ ] Organizers notified of failed orders for their events
- [ ] Email template supports internationalization
- [ ] Emails sent asynchronously (non-blocking)

### 7. Dashboard Error Display

- [ ] Checkout page displays errors inline above payment form
- [ ] Error styling distinct from success messages (red vs. green)
- [ ] Error persists until user takes action (doesn't auto-dismiss)
- [ ] Error message accessible (ARIA labels, screen reader support)
- [ ] Loading states prevent multiple submissions
- [ ] Form fields retain values after error (don't clear form)

### 8. Fallback Options

- [ ] User can switch to alternative payment method after failure
- [ ] "Contact Support" button visible after 2+ failures
- [ ] System suggests common solutions based on error type
- [ ] Admin panel allows manual order completion (exceptional cases)

---

## Technical Requirements

### Error Types & Handling

```typescript
// lib/payments/errors.ts

export enum PaymentErrorCategory {
  CARD_DECLINED = 'CARD_DECLINED',
  INVALID_CARD = 'INVALID_CARD',
  PROCESSING_ERROR = 'PROCESSING_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  AUTHORIZATION_ERROR = 'AUTHORIZATION_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

export interface PaymentError {
  category: PaymentErrorCategory;
  userMessage: string;
  technicalDetails: string;
  squareErrorCode?: string;
  retryable: boolean;
  suggestedActions: string[];
}

export class PaymentErrorMapper {
  /**
   * Map Square API error to user-friendly PaymentError
   */
  static mapSquareError(squareError: any): PaymentError {
    const code = squareError.code || squareError.category;

    switch (code) {
      // Card Declined
      case 'CARD_DECLINED':
      case 'CVV_FAILURE':
      case 'INSUFFICIENT_FUNDS':
        return {
          category: PaymentErrorCategory.CARD_DECLINED,
          userMessage:
            'Your card was declined by your bank. This may be due to insufficient funds, ' +
            'a card limit, or your bank flagging the transaction as unusual.',
          technicalDetails: JSON.stringify(squareError),
          squareErrorCode: code,
          retryable: true,
          suggestedActions: [
            'Try a different payment card',
            'Contact your bank to authorize the transaction',
            'Verify your card has sufficient funds'
          ]
        };

      // Invalid Card
      case 'INVALID_CARD':
      case 'INVALID_EXPIRATION':
      case 'CARD_EXPIRED':
        return {
          category: PaymentErrorCategory.INVALID_CARD,
          userMessage:
            'The card information appears to be incorrect or the card has expired. ' +
            'Please check your card number, expiration date, and CVV.',
          technicalDetails: JSON.stringify(squareError),
          squareErrorCode: code,
          retryable: true,
          suggestedActions: [
            'Verify your card number is correct',
            'Check the expiration date',
            'Confirm the CVV security code',
            'Try a different card'
          ]
        };

      // Processing Errors (retryable)
      case 'GATEWAY_TIMEOUT':
      case 'SERVICE_UNAVAILABLE':
      case 'INTERNAL_SERVER_ERROR':
        return {
          category: PaymentErrorCategory.PROCESSING_ERROR,
          userMessage:
            'We\'re experiencing temporary difficulties processing your payment. ' +
            'Please try again in a few moments.',
          technicalDetails: JSON.stringify(squareError),
          squareErrorCode: code,
          retryable: true,
          suggestedActions: [
            'Wait a moment and try again',
            'Refresh the page',
            'Contact support if the problem persists'
          ]
        };

      // Validation Errors
      case 'INVALID_REQUEST_ERROR':
      case 'BAD_REQUEST':
        return {
          category: PaymentErrorCategory.VALIDATION_ERROR,
          userMessage:
            'Some payment information is missing or invalid. ' +
            'Please review your information and try again.',
          technicalDetails: JSON.stringify(squareError),
          squareErrorCode: code,
          retryable: true,
          suggestedActions: [
            'Review all required fields',
            'Ensure billing address is complete',
            'Verify payment amount'
          ]
        };

      // Authorization Errors
      case 'AUTHORIZATION_DECLINED':
      case 'VERIFY_CVV':
      case 'VERIFY_AVS':
        return {
          category: PaymentErrorCategory.AUTHORIZATION_ERROR,
          userMessage:
            'Your payment could not be authorized. Your bank may require ' +
            'additional verification or your card details may not match their records.',
          technicalDetails: JSON.stringify(squareError),
          squareErrorCode: code,
          retryable: true,
          suggestedActions: [
            'Verify your billing address matches your card',
            'Check your CVV security code',
            'Contact your bank',
            'Try a different payment method'
          ]
        };

      // Unknown/Default
      default:
        return {
          category: PaymentErrorCategory.UNKNOWN_ERROR,
          userMessage:
            'An unexpected error occurred while processing your payment. ' +
            'Please try again or contact support for assistance.',
          technicalDetails: JSON.stringify(squareError),
          squareErrorCode: code,
          retryable: true,
          suggestedActions: [
            'Try again',
            'Use a different payment method',
            'Contact support with order ID'
          ]
        };
    }
  }
}
```

### Retry Logic with Exponential Backoff

```typescript
// lib/payments/retry-handler.ts

interface RetryConfig {
  maxAttempts: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
}

export class PaymentRetryHandler {
  private config: RetryConfig = {
    maxAttempts: 3,
    initialDelayMs: 1000,
    maxDelayMs: 8000,
    backoffMultiplier: 2
  };

  /**
   * Execute payment with automatic retry for transient errors
   */
  async executeWithRetry<T>(
    operation: () => Promise<T>,
    context: { orderId: string; userId: string }
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 1; attempt <= this.config.maxAttempts; attempt++) {
      try {
        const result = await operation();

        // Success - log and return
        if (attempt > 1) {
          await this.logRetrySuccess(context, attempt);
        }

        return result;

      } catch (error) {
        lastError = error as Error;

        // Map to PaymentError to check if retryable
        const paymentError = PaymentErrorMapper.mapSquareError(error);

        // Log attempt
        await this.logRetryAttempt(context, attempt, paymentError);

        // Don't retry if not retryable or max attempts reached
        if (!paymentError.retryable || attempt >= this.config.maxAttempts) {
          throw error;
        }

        // Calculate backoff delay
        const delay = Math.min(
          this.config.initialDelayMs * Math.pow(this.config.backoffMultiplier, attempt - 1),
          this.config.maxDelayMs
        );

        // Wait before retry
        await this.sleep(delay);
      }
    }

    throw lastError!;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async logRetryAttempt(
    context: { orderId: string; userId: string },
    attempt: number,
    error: PaymentError
  ): Promise<void> {
    await prisma.paymentErrorLog.create({
      data: {
        orderId: context.orderId,
        userId: context.userId,
        attempt,
        errorCategory: error.category,
        errorDetails: error.technicalDetails,
        retryable: error.retryable,
        timestamp: new Date()
      }
    });
  }

  private async logRetrySuccess(
    context: { orderId: string; userId: string },
    successfulAttempt: number
  ): Promise<void> {
    console.log(`Payment succeeded after ${successfulAttempt} attempts`, context);
  }
}
```

### Idempotency Key Management

```typescript
// lib/payments/idempotency.ts

import { randomUUID } from 'crypto';

export class IdempotencyManager {
  /**
   * Generate idempotency key for payment request
   */
  static generateKey(orderId: string, userId: string): string {
    return `payment_${orderId}_${userId}_${randomUUID()}`;
  }

  /**
   * Check if request with this key was already processed
   */
  static async checkIdempotency(key: string): Promise<{ processed: boolean; result?: any }> {
    const cached = await prisma.idempotencyCache.findUnique({
      where: { key }
    });

    if (cached) {
      // Check if cache is still valid (5 minutes)
      const ageMs = Date.now() - cached.createdAt.getTime();
      if (ageMs < 5 * 60 * 1000) {
        return { processed: true, result: cached.result };
      }
    }

    return { processed: false };
  }

  /**
   * Store result for idempotency checking
   */
  static async storeResult(key: string, result: any): Promise<void> {
    await prisma.idempotencyCache.upsert({
      where: { key },
      create: {
        key,
        result,
        createdAt: new Date()
      },
      update: {
        result,
        createdAt: new Date()
      }
    });
  }
}
```

### Database Schema

```sql
-- Payment Error Log
CREATE TABLE payment_error_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id),
  user_id UUID NOT NULL REFERENCES users(id),
  attempt INTEGER NOT NULL,
  error_category VARCHAR(50) NOT NULL,
  error_details JSONB NOT NULL,
  square_error_code VARCHAR(100),
  retryable BOOLEAN NOT NULL DEFAULT false,
  timestamp TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Idempotency Cache
CREATE TABLE idempotency_cache (
  key VARCHAR(255) PRIMARY KEY,
  result JSONB NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Index for cleanup queries
CREATE INDEX idx_idempotency_created ON idempotency_cache(created_at);

-- Cleanup old idempotency records (run daily)
DELETE FROM idempotency_cache WHERE created_at < NOW() - INTERVAL '24 hours';
```

---

## PCI Compliance & Security

### Secure Error Logging
- NEVER log full card numbers (only last 4 digits if necessary)
- NEVER log CVV or PIN codes
- NEVER log unencrypted cardholder data
- Sanitize all payment request payloads before logging
- Use separate, access-controlled log storage for payment errors
- Implement log retention policy (90 days for error logs)

### Error Message Security
- Don't reveal system architecture in error messages
- Avoid messages that could aid fraudulent activities
- Don't expose internal IDs or database structure
- Rate limit error responses to prevent enumeration attacks

---

## Testing Requirements

### Unit Tests

```typescript
describe('PaymentErrorMapper', () => {
  test('maps card declined error correctly', () => {
    const squareError = { code: 'CARD_DECLINED' };
    const mapped = PaymentErrorMapper.mapSquareError(squareError);

    expect(mapped.category).toBe(PaymentErrorCategory.CARD_DECLINED);
    expect(mapped.retryable).toBe(true);
    expect(mapped.userMessage).toContain('declined');
  });

  test('maps expired card error correctly', () => {
    const squareError = { code: 'CARD_EXPIRED' };
    const mapped = PaymentErrorMapper.mapSquareError(squareError);

    expect(mapped.category).toBe(PaymentErrorCategory.INVALID_CARD);
    expect(mapped.suggestedActions).toContain('Check the expiration date');
  });

  test('maps unknown error to generic message', () => {
    const squareError = { code: 'WEIRD_ERROR_9999' };
    const mapped = PaymentErrorMapper.mapSquareError(squareError);

    expect(mapped.category).toBe(PaymentErrorCategory.UNKNOWN_ERROR);
    expect(mapped.userMessage).not.toContain('WEIRD_ERROR_9999');
  });
});

describe('PaymentRetryHandler', () => {
  test('retries transient errors with backoff', async () => {
    let attempts = 0;
    const operation = jest.fn().mockImplementation(() => {
      attempts++;
      if (attempts < 3) {
        throw { code: 'GATEWAY_TIMEOUT' };
      }
      return { success: true };
    });

    const handler = new PaymentRetryHandler();
    const result = await handler.executeWithRetry(operation, {
      orderId: 'test',
      userId: 'user'
    });

    expect(attempts).toBe(3);
    expect(result.success).toBe(true);
  });

  test('does not retry non-retryable errors', async () => {
    const operation = jest.fn().mockRejectedValue({ code: 'INVALID_REQUEST_ERROR' });
    const handler = new PaymentRetryHandler();

    await expect(
      handler.executeWithRetry(operation, { orderId: 'test', userId: 'user' })
    ).rejects.toThrow();

    expect(operation).toHaveBeenCalledTimes(1);
  });
});

describe('IdempotencyManager', () => {
  test('detects duplicate requests within 5 minutes', async () => {
    const key = IdempotencyManager.generateKey('order123', 'user456');
    await IdempotencyManager.storeResult(key, { success: true });

    const check = await IdempotencyManager.checkIdempotency(key);
    expect(check.processed).toBe(true);
    expect(check.result).toEqual({ success: true });
  });
});
```

### Integration Tests
- Test full payment flow with intentional errors
- Verify error emails are sent correctly
- Test retry logic with actual Square API (sandbox)
- Validate database state after failed payments
- Test concurrent payment attempts with same idempotency key

### Error Scenarios to Test
1. Card declined (insufficient funds)
2. Expired card
3. Invalid CVV
4. Network timeout
5. Square API unavailable
6. Invalid request data
7. Duplicate submission within 5 minutes
8. Concurrent payment attempts
9. Database connection lost during payment
10. Partial success (payment succeeds but order update fails)

---

## Monitoring & Alerts

### Metrics to Track
- Payment error rate (by category)
- Average retry attempts per failed payment
- Time to recover from transient errors
- Most common error types
- User abandonment rate after errors

### Alert Thresholds
- Error rate > 10% (warning)
- Error rate > 25% (critical)
- Gateway timeout rate > 5% (investigate Square status)
- Same user 5+ failures in 10 minutes (potential fraud)

---

## Definition of Done

- [ ] Error mapping implemented for all Square error codes
- [ ] Retry logic with exponential backoff working
- [ ] Idempotency key system preventing duplicates
- [ ] User-friendly error messages displayed in UI
- [ ] Error logging with PCI-compliant sanitization
- [ ] Email notifications for failed payments
- [ ] All unit tests passing (>95% coverage)
- [ ] Integration tests with Square sandbox passing
- [ ] Error scenarios tested (all 10 scenarios)
- [ ] Monitoring dashboards configured
- [ ] Alert rules configured in Sentry
- [ ] Documentation updated
- [ ] Code review completed
- [ ] QA testing with intentional errors
- [ ] Accessibility testing for error messages

---

## Notes

- Square error codes: https://developer.squareup.com/docs/api/connect/v2/errors
- Consider implementing circuit breaker pattern for Square API
- Plan for graceful degradation if Square is completely unavailable
- Future enhancement: Real-time error dashboard for admins
- Consider A/B testing different error message wording for conversion optimization