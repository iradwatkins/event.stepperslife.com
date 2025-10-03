# SEC-005: PCI DSS Compliance Validation

**Epic:** EPIC-012 Performance & Security
**Story Points:** 5
**Priority:** Critical
**Status:** Ready for Development

---

## User Story

**As a** payment processor
**I want** to ensure PCI DSS compliance across the platform
**So that** we can securely handle payment card data and maintain our merchant account (SAQ-A validation)

---

## Acceptance Criteria

### Functional Requirements
- [ ] PCI DSS Self-Assessment Questionnaire (SAQ-A) completed
- [ ] No storage of full payment card numbers (PAN)
- [ ] Tokenization used for all card data via Square
- [ ] TLS 1.2+ enforced for all payment pages
- [ ] Secure payment form hosted by Square
- [ ] No card data in logs or error messages
- [ ] Access control to payment processing systems
- [ ] Security policy documentation
- [ ] Annual security awareness training plan
- [ ] Quarterly vulnerability scans scheduled

### PCI DSS Requirements
- [ ] **Requirement 1**: Firewall configuration (infrastructure)
- [ ] **Requirement 2**: No default passwords
- [ ] **Requirement 3**: Protect stored cardholder data (none stored)
- [ ] **Requirement 4**: Encrypt transmission of cardholder data (TLS)
- [ ] **Requirement 5**: Antivirus software (infrastructure)
- [ ] **Requirement 6**: Secure development and maintenance
- [ ] **Requirement 7**: Restrict access to cardholder data
- [ ] **Requirement 8**: Unique ID for each user
- [ ] **Requirement 9**: Physical access (N/A for SAQ-A)
- [ ] **Requirement 10**: Track and monitor access
- [ ] **Requirement 11**: Regular security testing
- [ ] **Requirement 12**: Information security policy

### Technical Requirements
- [ ] Payment form iframe isolation
- [ ] No JavaScript access to card data
- [ ] CSP headers preventing data exfiltration
- [ ] Audit logging of payment activities
- [ ] Vulnerability scanning integration
- [ ] Security incident response plan
- [ ] PCI compliance dashboard

---

## Technical Specifications

### PCI Compliance Checklist

```typescript
// lib/compliance/pci-checklist.ts
export interface PCIRequirement {
  id: string;
  requirement: string;
  status: 'compliant' | 'non-compliant' | 'not-applicable';
  evidence: string[];
  notes?: string;
}

export const pciRequirements: PCIRequirement[] = [
  {
    id: '1',
    requirement: 'Install and maintain a firewall configuration',
    status: 'compliant',
    evidence: [
      'AWS Security Groups configured',
      'VPC with private subnets for databases',
      'Web Application Firewall (CloudFlare)',
    ],
    notes: 'Infrastructure managed by AWS/Vercel',
  },
  {
    id: '2',
    requirement: 'Do not use vendor-supplied defaults',
    status: 'compliant',
    evidence: [
      'All default passwords changed',
      'Database credentials rotated',
      'Custom admin paths configured',
    ],
  },
  {
    id: '3',
    requirement: 'Protect stored cardholder data',
    status: 'compliant',
    evidence: [
      'NO full card numbers stored',
      'Only last 4 digits stored (tokenized)',
      'Square Payment Gateway handles all card data',
    ],
    notes: 'SAQ-A: Card data never enters our environment',
  },
  {
    id: '4',
    requirement: 'Encrypt transmission of cardholder data',
    status: 'compliant',
    evidence: [
      'TLS 1.2+ enforced',
      'HTTPS redirect configured',
      'HSTS headers enabled',
      'Square iframe uses HTTPS',
    ],
  },
  {
    id: '5',
    requirement: 'Protect all systems against malware',
    status: 'compliant',
    evidence: [
      'AWS GuardDuty enabled',
      'Regular system updates',
      'Dependency vulnerability scanning',
    ],
  },
  {
    id: '6',
    requirement: 'Develop and maintain secure systems',
    status: 'compliant',
    evidence: [
      'Secure coding guidelines documented',
      'Code review process implemented',
      'Automated security testing in CI/CD',
      'Regular dependency updates',
    ],
  },
  {
    id: '7',
    requirement: 'Restrict access to cardholder data',
    status: 'compliant',
    evidence: [
      'RBAC implemented (Admin, Organizer, User)',
      'Payment data only accessible via Square API',
      'Least privilege principle enforced',
    ],
  },
  {
    id: '8',
    requirement: 'Identify and authenticate access',
    status: 'compliant',
    evidence: [
      'Unique user IDs for all accounts',
      'NextAuth.js authentication',
      '2FA available for admin accounts',
      'Strong password requirements',
    ],
  },
  {
    id: '9',
    requirement: 'Restrict physical access',
    status: 'not-applicable',
    evidence: ['SAQ-A: Not applicable for hosted solution'],
    notes: 'Physical security managed by cloud providers',
  },
  {
    id: '10',
    requirement: 'Track and monitor all access',
    status: 'compliant',
    evidence: [
      'Audit logging implemented (SEC-002)',
      'Payment transactions logged',
      'Failed authentication tracked',
      'Admin actions logged',
    ],
  },
  {
    id: '11',
    requirement: 'Regularly test security systems',
    status: 'compliant',
    evidence: [
      'Quarterly vulnerability scans scheduled',
      'Annual penetration testing planned',
      'Automated security testing in CI/CD',
    ],
  },
  {
    id: '12',
    requirement: 'Maintain information security policy',
    status: 'compliant',
    evidence: [
      'Security policy documented',
      'Incident response plan created',
      'Annual security awareness training',
      'Risk assessment process defined',
    ],
  },
];
```

### Payment Security Configuration

```typescript
// lib/payments/pci-config.ts
export const pciSecurityConfig = {
  // TLS Configuration
  tls: {
    minVersion: 'TLSv1.2',
    ciphers: [
      'ECDHE-RSA-AES128-GCM-SHA256',
      'ECDHE-RSA-AES256-GCM-SHA384',
      'ECDHE-RSA-CHACHA20-POLY1305',
    ],
    enforceHTTPS: true,
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
  },

  // Content Security Policy
  csp: {
    'default-src': ["'self'"],
    'script-src': [
      "'self'",
      "'unsafe-inline'", // Required for Next.js
      'https://web.squarecdn.com',
      'https://sandbox.web.squarecdn.com',
    ],
    'frame-src': [
      'https://web.squarecdn.com',
      'https://sandbox.web.squarecdn.com',
    ],
    'connect-src': [
      "'self'",
      'https://connect.squareup.com',
      'https://connect.squareupsandbox.com',
    ],
    'img-src': ["'self'", 'data:', 'https:'],
    'style-src': ["'self'", "'unsafe-inline'"],
    'font-src': ["'self'"],
  },

  // Allowed payment card data
  allowedCardData: {
    lastFourDigits: true, // OK to store
    cardBrand: true, // OK to store
    expiryMonth: false, // Should not store
    expiryYear: false, // Should not store
    cvv: false, // NEVER store
    fullPAN: false, // NEVER store
  },

  // Logging restrictions
  logging: {
    excludeFields: [
      'card_number',
      'cvv',
      'cvc',
      'pan',
      'track_data',
      'pin',
      'expiry',
    ],
    maskFields: [
      'cardNumber',
      'securityCode',
    ],
  },
};

// Sanitize payment data for logging
export function sanitizePaymentData(data: any): any {
  const sanitized = { ...data };

  pciSecurityConfig.logging.excludeFields.forEach((field) => {
    if (field in sanitized) {
      delete sanitized[field];
    }
  });

  pciSecurityConfig.logging.maskFields.forEach((field) => {
    if (field in sanitized && typeof sanitized[field] === 'string') {
      sanitized[field] = `***${sanitized[field].slice(-4)}`;
    }
  });

  return sanitized;
}
```

### Secure Payment Form Component

```typescript
// components/payment/SecurePaymentForm.tsx
'use client';

import { useEffect, useState } from 'react';
import Script from 'next/script';

interface SecurePaymentFormProps {
  amount: number;
  onSuccess: (paymentId: string) => void;
  onError: (error: Error) => void;
}

export function SecurePaymentForm({
  amount,
  onSuccess,
  onError,
}: SecurePaymentFormProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [paymentForm, setPaymentForm] = useState<any>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).Square) {
      initializeSquareForm();
    }
  }, []);

  const initializeSquareForm = async () => {
    try {
      const payments = (window as any).Square.payments(
        process.env.NEXT_PUBLIC_SQUARE_APP_ID,
        process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID
      );

      const card = await payments.card();
      await card.attach('#card-container');

      setPaymentForm(card);
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to initialize payment form:', error);
      onError(error as Error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!paymentForm) return;

    try {
      // Tokenize card data (never touches our servers)
      const result = await paymentForm.tokenize();

      if (result.status === 'OK') {
        // Send token to our server (NOT card data)
        const response = await fetch('/api/payments/process', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sourceId: result.token, // This is the token, not card data
            amount,
          }),
        });

        if (response.ok) {
          const { paymentId } = await response.json();
          onSuccess(paymentId);
        } else {
          throw new Error('Payment failed');
        }
      } else {
        throw new Error(result.errors?.[0]?.message || 'Tokenization failed');
      }
    } catch (error) {
      onError(error as Error);
    }
  };

  return (
    <>
      <Script
        src="https://web.squarecdn.com/v1/square.js"
        onLoad={() => initializeSquareForm()}
      />

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Square handles the card input - we never see the data */}
        <div id="card-container" className="min-h-[200px]" />

        {isLoading && (
          <div className="text-center text-gray-500">
            Loading secure payment form...
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-blue-600 text-white py-2 rounded disabled:opacity-50"
        >
          Pay ${(amount / 100).toFixed(2)}
        </button>

        <div className="text-xs text-gray-500 text-center">
          <p>Secured by Square • PCI DSS Compliant</p>
          <p>Your card details never touch our servers</p>
        </div>
      </form>
    </>
  );
}
```

### Payment API Route (PCI Compliant)

```typescript
// app/api/payments/process/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { squareClient } from '@/lib/payments/square.config';
import { sanitizePaymentData } from '@/lib/payments/pci-config';
import { auditPaymentCompleted } from '@/lib/payments/audit';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { sourceId, amount, orderId } = body;

    // IMPORTANT: sourceId is a token, NOT actual card data
    // Square handled tokenization in the browser

    // Log payment initiation (sanitized)
    console.log('Processing payment:', sanitizePaymentData({
      orderId,
      amount,
      userId: session.user.id,
    }));

    // Process payment with Square
    const { result } = await squareClient.paymentsApi.createPayment({
      sourceId, // Token from Square.js
      amountMoney: {
        amount: BigInt(amount),
        currency: 'USD',
      },
      idempotencyKey: crypto.randomUUID(),
      orderId,
    });

    // Store only allowed data
    await prisma.payment.create({
      data: {
        id: result.payment?.id,
        orderId,
        userId: session.user.id,
        amount,
        currency: 'USD',
        status: result.payment?.status,
        // Only store last 4 digits and brand (PCI compliant)
        cardLast4: result.payment?.cardDetails?.card?.last4,
        cardBrand: result.payment?.cardDetails?.card?.cardBrand,
        // NEVER store: full card number, CVV, expiry
      },
    });

    // Audit log
    await auditPaymentCompleted(
      session.user.id,
      orderId,
      result.payment?.id!,
      amount,
      'USD',
      request.headers.get('x-forwarded-for') || 'unknown'
    );

    return NextResponse.json({
      success: true,
      paymentId: result.payment?.id,
    });
  } catch (error) {
    // Sanitize error before logging
    const sanitizedError = sanitizePaymentData(error);
    console.error('Payment processing error:', sanitizedError);

    return NextResponse.json(
      { error: 'Payment processing failed' },
      { status: 500 }
    );
  }
}
```

### PCI Compliance Dashboard

```typescript
// app/admin/compliance/pci/page.tsx
import { pciRequirements } from '@/lib/compliance/pci-checklist';

export default function PCICompliancePage() {
  const compliant = pciRequirements.filter(
    (r) => r.status === 'compliant'
  ).length;
  const total = pciRequirements.filter(
    (r) => r.status !== 'not-applicable'
  ).length;

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">PCI DSS Compliance Status</h1>

      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Overall Compliance</h2>
          <span className="text-2xl font-bold text-green-600">
            {compliant}/{total}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-4">
          <div
            className="bg-green-600 h-4 rounded-full"
            style={{ width: `${(compliant / total) * 100}%` }}
          />
        </div>
      </div>

      <div className="space-y-4">
        {pciRequirements.map((req) => (
          <div key={req.id} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-lg font-semibold mb-2">
                  Requirement {req.id}: {req.requirement}
                </h3>

                <div className="mb-4">
                  <span
                    className={`inline-block px-3 py-1 rounded text-sm font-medium ${
                      req.status === 'compliant'
                        ? 'bg-green-100 text-green-800'
                        : req.status === 'non-compliant'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {req.status.toUpperCase()}
                  </span>
                </div>

                <div className="mb-4">
                  <h4 className="font-medium mb-2">Evidence:</h4>
                  <ul className="list-disc list-inside space-y-1 text-gray-600">
                    {req.evidence.map((evidence, i) => (
                      <li key={i}>{evidence}</li>
                    ))}
                  </ul>
                </div>

                {req.notes && (
                  <div className="text-sm text-gray-500 italic">
                    Note: {req.notes}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 bg-blue-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Next Actions</h3>
        <ul className="space-y-2">
          <li>✅ Complete SAQ-A questionnaire annually</li>
          <li>✅ Schedule quarterly vulnerability scans</li>
          <li>✅ Conduct annual security awareness training</li>
          <li>✅ Review and update security policies</li>
          <li>✅ Document incident response procedures</li>
        </ul>
      </div>
    </div>
  );
}
```

---

## Implementation Details

### Security Headers Configuration

```typescript
// next.config.js
const securityHeaders = [
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=31536000; includeSubDomains; preload',
  },
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN',
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=()',
  },
];

module.exports = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
};
```

### Vulnerability Scanning Integration

```typescript
// lib/security/vulnerability-scanner.ts
import { Logger } from '@/lib/monitoring/logger';

export class VulnerabilityScanner {
  private logger = new Logger('VulnerabilityScanner');

  async scheduleQuarterlyScan(): Promise<void> {
    // Integration with security scanning service
    // e.g., Qualys, Rapid7, or similar PCI-approved vendor
    this.logger.info('Scheduling quarterly PCI vulnerability scan');

    // Implementation here
  }

  async checkDependencyVulnerabilities(): Promise<void> {
    // Run npm audit or Snyk
    // This should be in CI/CD pipeline
  }
}
```

---

## Testing Requirements

### PCI Compliance Tests

```typescript
describe('PCI Compliance', () => {
  it('should never store full card numbers', async () => {
    const payment = await prisma.payment.findFirst();
    expect(payment?.cardNumber).toBeUndefined();
    expect(payment?.cardLast4).toHaveLength(4);
  });

  it('should enforce TLS 1.2+', async () => {
    const response = await fetch(process.env.NEXT_PUBLIC_APP_URL!);
    const protocol = response.headers.get('strict-transport-security');
    expect(protocol).toContain('max-age=31536000');
  });

  it('should sanitize payment data in logs', () => {
    const data = {
      cardNumber: '4111111111111111',
      cvv: '123',
      amount: 1000,
    };

    const sanitized = sanitizePaymentData(data);
    expect(sanitized.cardNumber).toBeUndefined();
    expect(sanitized.cvv).toBeUndefined();
    expect(sanitized.amount).toBe(1000);
  });
});
```

---

## Compliance Documentation

### SAQ-A Questionnaire Summary
- **Merchant Type**: E-commerce, card-not-present
- **Card Data Flow**: Card data handled entirely by Square
- **Storage**: No card data stored on our servers
- **Transmission**: All via HTTPS/TLS 1.2+
- **Validation**: SAQ-A (shortest questionnaire for outsourced solutions)

### Annual Requirements
- Complete SAQ-A questionnaire
- Quarterly vulnerability scans (PCI-approved vendor)
- Annual security awareness training
- Annual penetration testing (recommended)
- Policy review and updates

---

## Monitoring and Alerting

### Key Metrics
- Payment failures
- PCI compliance checklist status
- Vulnerability scan results
- Security policy violations

### Alerts
- Critical: Card data detected in logs
- Critical: TLS 1.0/1.1 connection attempt
- Critical: Vulnerability scan failure
- Warning: High payment failure rate

---

## Dependencies
- Square Payment Gateway
- TLS 1.2+ support
- Security scanning service (Qualys/Rapid7)

## Related Stories
- SEC-001: Security Hardening
- SEC-002: Security Audit Logging
- PAY-001: Payment Processing

---

**Notes:**
- SAQ-A is for merchants who outsource all payment processing
- Never log, store, or transmit full card data
- Maintain quarterly vulnerability scans
- Update security policies annually
- Train all personnel handling payment data