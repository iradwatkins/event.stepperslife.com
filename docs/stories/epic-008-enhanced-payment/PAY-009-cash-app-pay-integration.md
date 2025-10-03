# PAY-009: Cash App Pay Integration

**Epic:** EPIC-008 - Enhanced Payment Processing
**Story Points:** 5
**Priority:** High
**Sprint:** TBD
**Status:** Ready for Development

---

## User Story

**As a** mobile customer purchasing event tickets
**I want to** pay using Cash App Pay with a seamless mobile experience
**So that I** can complete checkout quickly using my Cash App balance without entering card details

---

## Acceptance Criteria

### 1. Cash App Pay Button Display
- [ ] Cash App Pay button displays on checkout page for mobile users
- [ ] Button follows Cash App Pay branding guidelines (green button, white text)
- [ ] Button only shows when Cash App Pay is available (mobile web, supported regions)
- [ ] Button disabled state shown when order total is invalid
- [ ] Alternative payment methods remain visible below Cash App Pay option

### 2. Mobile Device Detection
- [ ] System detects mobile devices using user agent analysis
- [ ] Cash App Pay prioritized for iOS and Android mobile browsers
- [ ] Desktop users see standard payment options (no Cash App Pay)
- [ ] Tablet detection treats as mobile for 7-10" screens
- [ ] Responsive layout adapts to all mobile screen sizes

### 3. Payment Flow Initiation
- [ ] Customer clicks Cash App Pay button to initiate payment
- [ ] System creates Square payment with Cash App Pay source type
- [ ] Order details passed to Square API (amount, currency, reference_id)
- [ ] Customer redirected to Cash App mobile app or web interface
- [ ] Fallback to web flow if Cash App app not installed

### 4. Cash App Authorization
- [ ] Customer authorizes payment in Cash App interface
- [ ] Cash App displays merchant name, amount, and order reference
- [ ] Customer can review and confirm payment within Cash App
- [ ] Customer can cancel and return to merchant checkout
- [ ] Cash App validates sufficient balance or linked payment method

### 5. Payment Confirmation
- [ ] Customer redirected back to platform after authorization
- [ ] System receives payment confirmation from Square webhook
- [ ] Order status updated to "paid" upon successful payment
- [ ] Tickets generated and sent to customer email immediately
- [ ] Confirmation page displays payment method (Cash App Pay)

### 6. Balance Checking (Optional Enhancement)
- [ ] System checks Cash App balance availability before initiating payment
- [ ] Warning displayed if balance insufficient (prompt to add funds)
- [ ] Alternative payment methods suggested if balance check fails
- [ ] Balance check timeout handled gracefully (3 second limit)

### 7. Error Handling
- [ ] Insufficient funds error displays user-friendly message
- [ ] Payment declined errors return customer to checkout with context
- [ ] Timeout errors (30 seconds) cancel transaction and notify customer
- [ ] Customer can retry payment or select alternative method
- [ ] All errors logged to monitoring system with transaction ID

### 8. Security & Compliance
- [ ] All payment data transmitted over HTTPS/TLS 1.2+
- [ ] No sensitive Cash App credentials stored on platform
- [ ] Payment tokens expire after single use (idempotency)
- [ ] PCI SAQ-A compliance maintained (no card data handling)
- [ ] GDPR compliance for EU customer payment data

### 9. Analytics & Tracking
- [ ] Cash App Pay usage tracked in payment analytics dashboard
- [ ] Conversion rates measured (initiated vs. completed)
- [ ] Average transaction time recorded (click to confirmation)
- [ ] Failure rates by error type logged for optimization
- [ ] Mobile vs. desktop payment method preferences analyzed

---

## Technical Specifications

### Square Cash App Pay Integration

#### SDK Implementation
```typescript
// lib/payments/cash-app-pay.ts
import { CashAppPay } from '@square/web-sdk';

interface CashAppPayConfig {
  applicationId: string;
  locationId: string;
  referenceId: string;
  amount: number;
  currency: string;
}

export class CashAppPayService {
  private cashAppPay: CashAppPay | null = null;

  async initialize(config: CashAppPayConfig): Promise<void> {
    const payments = Square.payments(
      config.applicationId,
      config.locationId
    );

    this.cashAppPay = await payments.cashAppPay({
      redirectURL: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/callback`,
      referenceId: config.referenceId,
    });
  }

  async requestPayment(
    amount: number,
    currency: string = 'USD'
  ): Promise<CashAppPayToken> {
    if (!this.cashAppPay) {
      throw new Error('Cash App Pay not initialized');
    }

    const paymentRequest = {
      amount: amount.toString(),
      currency,
      requestShippingAddress: false,
      requestBillingAddress: false,
    };

    const tokenResult = await this.cashAppPay.tokenize(paymentRequest);

    if (tokenResult.status === 'OK') {
      return tokenResult.token;
    } else {
      throw new Error(tokenResult.errors[0]?.message || 'Tokenization failed');
    }
  }

  async attachButton(elementId: string): Promise<void> {
    if (!this.cashAppPay) {
      throw new Error('Cash App Pay not initialized');
    }

    await this.cashAppPay.attach(`#${elementId}`);
  }

  destroy(): void {
    if (this.cashAppPay) {
      this.cashAppPay.destroy();
      this.cashAppPay = null;
    }
  }
}
```

#### Mobile Detection Service
```typescript
// lib/utils/device-detection.ts
export interface DeviceInfo {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  os: 'ios' | 'android' | 'windows' | 'mac' | 'linux' | 'unknown';
  browser: string;
  supportsAppSwitch: boolean;
}

export class DeviceDetectionService {
  static detect(userAgent: string): DeviceInfo {
    const ua = userAgent.toLowerCase();

    const isMobile = /mobile|android|iphone|ipod|blackberry|iemobile|opera mini/i.test(ua);
    const isTablet = /ipad|tablet|kindle|playbook/i.test(ua);
    const isIOS = /iphone|ipad|ipod/i.test(ua);
    const isAndroid = /android/i.test(ua);

    const os = isIOS ? 'ios' : isAndroid ? 'android' :
               /windows/i.test(ua) ? 'windows' :
               /mac/i.test(ua) ? 'mac' :
               /linux/i.test(ua) ? 'linux' : 'unknown';

    const supportsAppSwitch = (isMobile || isTablet) && (isIOS || isAndroid);

    return {
      isMobile,
      isTablet,
      isDesktop: !isMobile && !isTablet,
      os,
      browser: this.detectBrowser(ua),
      supportsAppSwitch,
    };
  }

  private static detectBrowser(ua: string): string {
    if (ua.includes('chrome')) return 'chrome';
    if (ua.includes('safari')) return 'safari';
    if (ua.includes('firefox')) return 'firefox';
    if (ua.includes('edge')) return 'edge';
    return 'unknown';
  }

  static isCashAppPaySupported(deviceInfo: DeviceInfo): boolean {
    // Cash App Pay only supported on mobile web
    return deviceInfo.isMobile || deviceInfo.isTablet;
  }
}
```

#### API Route Implementation
```typescript
// app/api/payments/cash-app-pay/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth.config';
import { CashAppPayService } from '@/lib/payments/cash-app-pay';
import { squareClient } from '@/lib/payments/square.config';
import { prisma } from '@/lib/database/prisma';
import { z } from 'zod';

const createPaymentSchema = z.object({
  orderId: z.string().uuid(),
  amount: z.number().positive(),
  currency: z.string().default('USD'),
  referenceId: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { orderId, amount, currency, referenceId } = createPaymentSchema.parse(body);

    // Verify order belongs to user and is unpaid
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        userId: session.user.id,
        status: 'PENDING',
      },
      include: {
        event: true,
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found or already paid' },
        { status: 404 }
      );
    }

    // Initialize Cash App Pay service
    const cashAppPayService = new CashAppPayService();
    await cashAppPayService.initialize({
      applicationId: process.env.SQUARE_APPLICATION_ID!,
      locationId: process.env.SQUARE_LOCATION_ID!,
      referenceId: referenceId || orderId,
      amount,
      currency,
    });

    // Create Square payment
    const paymentResult = await squareClient.paymentsApi.createPayment({
      sourceId: 'CASH_APP_PAY', // Placeholder, actual token from client
      idempotencyKey: crypto.randomUUID(),
      amountMoney: {
        amount: BigInt(Math.round(amount * 100)),
        currency: currency as 'USD',
      },
      referenceId: orderId,
      note: `Event: ${order.event.title}`,
      customerId: session.user.squareCustomerId,
    });

    if (paymentResult.result.payment?.status === 'APPROVED') {
      // Update order status
      await prisma.order.update({
        where: { id: orderId },
        data: {
          status: 'PAID',
          paymentMethod: 'CASH_APP_PAY',
          paidAt: new Date(),
          squarePaymentId: paymentResult.result.payment.id,
        },
      });

      return NextResponse.json({
        success: true,
        paymentId: paymentResult.result.payment.id,
        orderId,
        status: 'APPROVED',
      });
    } else {
      return NextResponse.json(
        { error: 'Payment not approved', status: paymentResult.result.payment?.status },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Cash App Pay error:', error);
    return NextResponse.json(
      { error: 'Payment processing failed' },
      { status: 500 }
    );
  }
}
```

### React Component Implementation

```typescript
// components/checkout/CashAppPayButton.tsx
'use client';

import { useEffect, useState } from 'react';
import { CashAppPayService } from '@/lib/payments/cash-app-pay';
import { DeviceDetectionService } from '@/lib/utils/device-detection';
import { Button } from '@/components/ui/button';
import { AlertCircle, Loader2 } from 'lucide-react';

interface CashAppPayButtonProps {
  orderId: string;
  amount: number;
  currency?: string;
  onSuccess: (paymentId: string) => void;
  onError: (error: string) => void;
}

export function CashAppPayButton({
  orderId,
  amount,
  currency = 'USD',
  onSuccess,
  onError,
}: CashAppPayButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if Cash App Pay is supported on this device
    const deviceInfo = DeviceDetectionService.detect(navigator.userAgent);
    const supported = DeviceDetectionService.isCashAppPaySupported(deviceInfo);
    setIsSupported(supported);

    if (!supported) {
      console.log('Cash App Pay not supported on this device');
    }
  }, []);

  const handlePayment = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Initialize Cash App Pay service
      const cashAppPayService = new CashAppPayService();
      await cashAppPayService.initialize({
        applicationId: process.env.NEXT_PUBLIC_SQUARE_APPLICATION_ID!,
        locationId: process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID!,
        referenceId: orderId,
        amount,
        currency,
      });

      // Request payment token
      const token = await cashAppPayService.requestPayment(amount, currency);

      // Send token to backend for processing
      const response = await fetch('/api/payments/cash-app-pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          amount,
          currency,
          token: token.token,
        }),
      });

      const result = await response.json();

      if (result.success) {
        onSuccess(result.paymentId);
      } else {
        throw new Error(result.error || 'Payment failed');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Payment failed';
      setError(errorMessage);
      onError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isSupported) {
    return null; // Don't render button on unsupported devices
  }

  return (
    <div className="space-y-2">
      <Button
        onClick={handlePayment}
        disabled={isLoading}
        className="w-full bg-[#00D632] hover:bg-[#00B82A] text-white font-semibold py-6"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <span className="text-lg">$</span>
            <span className="ml-2">Pay with Cash App</span>
          </>
        )}
      </Button>

      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-md">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}
    </div>
  );
}
```

---

## Dependencies

### Technical Dependencies
- Square Web SDK v4.0+
- Square Payments API
- Next.js 14+ (App Router)
- TypeScript 5.0+
- React 18+
- Zod for validation

### Story Dependencies
- PAY-001: Square Payments Setup (prerequisite)
- PAY-002: Checkout flow foundation (prerequisite)
- PAY-014: Saved payment methods (can run parallel)

---

## Testing Requirements

### Unit Tests
```typescript
// __tests__/lib/payments/cash-app-pay.test.ts
describe('CashAppPayService', () => {
  it('should initialize with valid config', async () => {
    const service = new CashAppPayService();
    await expect(service.initialize(validConfig)).resolves.not.toThrow();
  });

  it('should throw error when requesting payment without initialization', async () => {
    const service = new CashAppPayService();
    await expect(service.requestPayment(100)).rejects.toThrow('not initialized');
  });

  it('should handle tokenization errors gracefully', async () => {
    // Mock tokenization failure
    const service = new CashAppPayService();
    await service.initialize(validConfig);
    // Test error handling
  });
});

describe('DeviceDetectionService', () => {
  it('should detect iOS mobile devices', () => {
    const userAgent = 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)';
    const info = DeviceDetectionService.detect(userAgent);
    expect(info.isMobile).toBe(true);
    expect(info.os).toBe('ios');
  });

  it('should detect Android mobile devices', () => {
    const userAgent = 'Mozilla/5.0 (Linux; Android 11; Pixel 5)';
    const info = DeviceDetectionService.detect(userAgent);
    expect(info.isMobile).toBe(true);
    expect(info.os).toBe('android');
  });

  it('should mark desktop as not supported for Cash App Pay', () => {
    const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)';
    const info = DeviceDetectionService.detect(userAgent);
    expect(DeviceDetectionService.isCashAppPaySupported(info)).toBe(false);
  });
});
```

### Integration Tests
- Test complete payment flow from button click to order completion
- Test mobile redirect to Cash App and return flow
- Test payment cancellation and retry
- Test error handling for various failure scenarios
- Test webhook payment confirmation

### Sandbox Testing
- Use Square Sandbox environment for all testing
- Test with Cash App Pay test accounts
- Verify payment appears in Square Dashboard
- Test insufficient funds scenario
- Test payment timeout scenarios

### Mobile Testing Requirements
- Test on real iOS devices (iPhone 12+, iOS 14+)
- Test on real Android devices (Pixel 5+, Android 11+)
- Test in Chrome Mobile, Safari Mobile, Firefox Mobile
- Test app switching (merchant → Cash App → merchant)
- Test landscape and portrait orientations
- Test on various screen sizes (small, medium, large)

---

## Security Considerations

### PCI Compliance
- No card data touches platform servers (SAQ-A compliance maintained)
- All payment data handled by Square's PCI Level 1 infrastructure
- Payment tokens single-use only (idempotency)
- TLS 1.2+ required for all API communications

### Fraud Prevention
- Monitor transaction patterns for unusual activity
- Implement rate limiting on payment attempts (5 per 15 minutes per user)
- Log all payment attempts with IP address and device fingerprint
- Block payments from known VPN/proxy services (optional)

### Data Privacy
- Store only payment metadata (method, timestamp, Square payment ID)
- Never store Cash App usernames or account details
- Comply with GDPR for EU customers (data minimization)
- Implement right-to-deletion for payment history

---

## Monitoring & Analytics

### Key Metrics
- **Adoption Rate**: % of mobile users selecting Cash App Pay
- **Conversion Rate**: % of Cash App Pay initiations completing successfully
- **Average Transaction Time**: Time from click to confirmation
- **Failure Rate**: % of payments failing by error type
- **App Switch Success Rate**: % successfully switching to Cash App app

### Alerts
- Alert when Cash App Pay failure rate exceeds 5%
- Alert when average transaction time exceeds 45 seconds
- Alert when webhook delivery fails (payment orphaned)
- Alert when Square API returns rate limit errors

### Dashboards
- Real-time payment method breakdown (card, Cash App, etc.)
- Mobile vs. desktop payment preferences
- Hourly transaction volume and success rates
- Geographic distribution of Cash App Pay users

---

## Documentation Requirements

### User-Facing Documentation
- FAQ: "How do I pay with Cash App?"
- Tutorial: "First-time Cash App Pay users"
- Troubleshooting guide: "Cash App Pay not working"
- Security information: "Is Cash App Pay safe?"

### Developer Documentation
- Cash App Pay integration guide
- Mobile detection best practices
- Error handling and retry strategies
- Webhook configuration for payment confirmation

---

## Rollout Plan

### Phase 1: Limited Beta (Week 1)
- Enable for 10% of mobile users
- Monitor success/failure rates closely
- Gather user feedback via post-checkout survey

### Phase 2: Expanded Beta (Week 2)
- Increase to 50% of mobile users
- A/B test button placement and design
- Optimize error messaging based on feedback

### Phase 3: Full Launch (Week 3)
- Enable for 100% of mobile users
- Promote Cash App Pay in mobile checkout
- Monitor long-term adoption and satisfaction

---

## Definition of Done

- [ ] All acceptance criteria met and verified
- [ ] Unit tests written with 90%+ coverage
- [ ] Integration tests passing in CI/CD pipeline
- [ ] Sandbox testing completed with all scenarios
- [ ] Real device testing on iOS and Android
- [ ] Code reviewed and approved by tech lead
- [ ] Security review completed (PCI compliance verified)
- [ ] Documentation updated (user and developer guides)
- [ ] Monitoring dashboards configured
- [ ] Product owner approval received
- [ ] Deployed to production and verified working

---

## Notes

### Cash App Pay Advantages
- Faster checkout (no card entry required)
- Higher conversion on mobile (fewer form fields)
- Lower friction for Cash App users
- Direct debit from Cash App balance

### Limitations
- Mobile-only (no desktop support)
- US-only currently (Square limitation)
- Requires Cash App account
- Limited to $1,000 per transaction

### Future Enhancements
- Add Cash App Pay for recurring payments
- Support for international expansion (when available)
- Integration with Cash App loyalty programs
- One-tap checkout for returning users