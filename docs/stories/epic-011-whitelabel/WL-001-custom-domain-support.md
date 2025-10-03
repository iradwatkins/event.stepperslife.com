# WL-001: Custom Domain Support for White-Label Clients

**Epic:** EPIC-011: White-Label Features
**Story Points:** 8
**Priority:** High
**Status:** Not Started

---

## User Story

**As a** white-label client
**I want to** use my own custom domain (e.g., events.myclientbrand.com) for the platform
**So that** my customers see my brand throughout their entire experience without any reference to the underlying platform

### Acceptance Criteria

1. **Domain Configuration Interface**
   - [ ] Admin dashboard shows "Custom Domain" settings section
   - [ ] Input field accepts domain name (with validation)
   - [ ] Shows current domain status (pending, verifying, active, error)
   - [ ] Displays step-by-step setup instructions
   - [ ] Shows DNS records needed for verification
   - [ ] Provides copy-to-clipboard functionality for DNS records

2. **DNS Verification Process**
   - [ ] System generates unique TXT verification record
   - [ ] System checks DNS records periodically (every 5 minutes)
   - [ ] System validates TXT record exists and matches
   - [ ] System validates CNAME/A record points to platform
   - [ ] Email notification sent when verification succeeds/fails
   - [ ] Verification timeout after 72 hours with clear error message

3. **SSL Certificate Provisioning**
   - [ ] Automatic SSL certificate request via Let's Encrypt
   - [ ] SSL certificate issued within 5 minutes of DNS verification
   - [ ] Certificate installed and domain becomes active
   - [ ] HTTPS enforced (HTTP redirects to HTTPS)
   - [ ] Automatic certificate renewal before expiration
   - [ ] Email notifications for certificate issues

4. **Domain Routing & Multi-Tenancy**
   - [ ] Requests to custom domain route to correct tenant
   - [ ] Tenant context established from domain middleware
   - [ ] All pages/assets served under custom domain
   - [ ] No cross-tenant data leakage
   - [ ] Proper CORS headers for custom domains
   - [ ] Session cookies scoped to custom domain

5. **Subdomain Fallback**
   - [ ] Platform subdomain (client.events.platform.com) always available
   - [ ] Custom domain replaces subdomain as primary
   - [ ] Both domains work simultaneously during transition
   - [ ] Canonical URLs point to custom domain once active
   - [ ] Old subdomain redirects to custom domain (optional setting)

6. **Error Handling & Monitoring**
   - [ ] Clear error messages for common DNS issues
   - [ ] Troubleshooting guide in UI
   - [ ] Admin notifications for SSL/DNS problems
   - [ ] Health check endpoint for domain status
   - [ ] Logging for all domain verification attempts
   - [ ] Metrics: verification time, success rate, active custom domains

---

## Technical Requirements

### DNS Configuration

**Required DNS Records:**

```
Type: TXT
Host: _events-verification.events.clientbrand.com
Value: events-verify-abc123def456ghi789
TTL: 3600

Type: CNAME
Host: events.clientbrand.com
Value: cname.vercel-dns.com
TTL: 3600

Type: A (alternative to CNAME)
Host: events.clientbrand.com
Value: 76.76.21.21
TTL: 3600
```

**DNS Verification Logic:**
- Query DNS for TXT record at `_events-verification.{domain}`
- Match TXT value against stored verification token
- Query DNS for CNAME/A record at domain root
- Verify CNAME points to platform or A record matches platform IPs
- All checks must pass within 72-hour window

### Vercel Custom Domain Integration

**Domain Addition Flow:**
```typescript
// lib/services/domain.service.ts

interface CustomDomainConfig {
  tenantId: string;
  domain: string;
  verificationToken: string;
  status: 'pending' | 'verifying' | 'active' | 'error';
  verifiedAt?: Date;
  sslIssuedAt?: Date;
  lastCheckedAt: Date;
  errorMessage?: string;
}

class DomainService {
  // Add domain to Vercel project
  async addDomain(tenantId: string, domain: string): Promise<CustomDomainConfig> {
    // 1. Validate domain format and availability
    // 2. Generate unique verification token
    // 3. Store in database
    // 4. Call Vercel API to add domain
    // 5. Return configuration with DNS instructions
  }

  // Verify DNS records
  async verifyDomain(domainId: string): Promise<boolean> {
    // 1. Query DNS for TXT verification record
    // 2. Query DNS for CNAME/A record
    // 3. Update status in database
    // 4. Trigger SSL provisioning if verified
    // 5. Send notification email
  }

  // Check SSL certificate status
  async checkSSLStatus(domainId: string): Promise<SSLStatus> {
    // 1. Query Vercel API for certificate status
    // 2. Update database
    // 3. Send notifications if issues
  }

  // Remove custom domain
  async removeDomain(domainId: string): Promise<void> {
    // 1. Remove from Vercel
    // 2. Soft delete from database
    // 3. Send confirmation email
  }
}
```

**Vercel API Integration:**
```typescript
// lib/integrations/vercel-domains.ts

import { VercelClient } from '@vercel/client';

interface VercelDomainResponse {
  name: string;
  verified: boolean;
  verification: Array<{
    type: string;
    domain: string;
    value: string;
    reason: string;
  }>;
  configuredBy?: string;
}

class VercelDomainManager {
  private client: VercelClient;

  async addDomain(domain: string): Promise<VercelDomainResponse> {
    return await this.client.domains.add({
      name: domain,
      projectId: process.env.VERCEL_PROJECT_ID!
    });
  }

  async checkDomainStatus(domain: string): Promise<VercelDomainResponse> {
    return await this.client.domains.get({
      name: domain,
      projectId: process.env.VERCEL_PROJECT_ID!
    });
  }

  async configureCertificate(domain: string): Promise<void> {
    await this.client.certificates.issue({
      domains: [domain],
      projectId: process.env.VERCEL_PROJECT_ID!
    });
  }

  async removeDomain(domain: string): Promise<void> {
    await this.client.domains.remove({
      name: domain,
      projectId: process.env.VERCEL_PROJECT_ID!
    });
  }
}
```

### DNS Verification Implementation

```typescript
// lib/utils/dns-verification.ts

import dns from 'dns/promises';

interface DNSVerificationResult {
  txtRecordValid: boolean;
  cnameRecordValid: boolean;
  aRecordValid: boolean;
  errors: string[];
}

class DNSVerifier {
  async verifyTXTRecord(
    domain: string,
    expectedValue: string
  ): Promise<boolean> {
    try {
      const records = await dns.resolveTxt(`_events-verification.${domain}`);
      const flatRecords = records.flat();
      return flatRecords.includes(expectedValue);
    } catch (error) {
      console.error('TXT verification failed:', error);
      return false;
    }
  }

  async verifyCNAME(domain: string): Promise<boolean> {
    try {
      const records = await dns.resolveCname(domain);
      return records.some(r =>
        r.includes('vercel-dns.com') ||
        r.includes('events.platform.com')
      );
    } catch (error) {
      // CNAME not found, check A record instead
      return false;
    }
  }

  async verifyARecord(domain: string): Promise<boolean> {
    try {
      const records = await dns.resolve4(domain);
      const validIPs = process.env.PLATFORM_IPS!.split(',');
      return records.some(ip => validIPs.includes(ip));
    } catch (error) {
      console.error('A record verification failed:', error);
      return false;
    }
  }

  async verifyFull(
    domain: string,
    verificationToken: string
  ): Promise<DNSVerificationResult> {
    const result: DNSVerificationResult = {
      txtRecordValid: false,
      cnameRecordValid: false,
      aRecordValid: false,
      errors: []
    };

    // Verify TXT record
    result.txtRecordValid = await this.verifyTXTRecord(domain, verificationToken);
    if (!result.txtRecordValid) {
      result.errors.push('TXT verification record not found or invalid');
    }

    // Verify CNAME or A record
    result.cnameRecordValid = await this.verifyCNAME(domain);
    if (!result.cnameRecordValid) {
      result.aRecordValid = await this.verifyARecord(domain);
      if (!result.aRecordValid) {
        result.errors.push('Neither CNAME nor A record configured correctly');
      }
    }

    return result;
  }
}
```

### Database Schema

```prisma
// prisma/schema.prisma

model CustomDomain {
  id                  String   @id @default(cuid())
  tenantId            String
  tenant              Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  domain              String   @unique
  verificationToken   String   @unique

  status              DomainStatus @default(PENDING)
  verifiedAt          DateTime?
  sslIssuedAt         DateTime?
  sslExpiresAt        DateTime?
  lastCheckedAt       DateTime @default(now())

  errorMessage        String?
  errorCount          Int      @default(0)

  isPrimary           Boolean  @default(true)

  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt
  deletedAt           DateTime?

  @@index([tenantId])
  @@index([status])
  @@index([domain])
  @@index([sslExpiresAt])
}

enum DomainStatus {
  PENDING        // Domain added, awaiting DNS configuration
  VERIFYING      // DNS records found, verification in progress
  VERIFIED       // DNS verified, awaiting SSL
  SSL_PENDING    // SSL certificate requested
  ACTIVE         // Fully active with SSL
  ERROR          // Verification or SSL error
  SUSPENDED      // Domain suspended by admin
}
```

### Middleware for Domain Routing

```typescript
// middleware.ts

import { NextRequest, NextResponse } from 'next/server';
import { getTenantByDomain } from '@/lib/services/tenant.service';

export async function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || '';

  // Extract domain (remove port if present)
  const domain = hostname.split(':')[0];

  // Skip platform domains
  if (domain === process.env.NEXT_PUBLIC_PLATFORM_DOMAIN) {
    return NextResponse.next();
  }

  // Check if custom domain
  const tenant = await getTenantByDomain(domain);

  if (!tenant) {
    return new NextResponse('Domain not found', { status: 404 });
  }

  // Add tenant context to request headers
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-tenant-id', tenant.id);
  requestHeaders.set('x-tenant-domain', domain);

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
```

### SSL Certificate Management

```typescript
// lib/services/ssl.service.ts

class SSLService {
  async requestCertificate(domain: string): Promise<void> {
    // Let Vercel handle SSL automatically
    // Or use Certbot for Let's Encrypt
    const vercelDomain = new VercelDomainManager();
    await vercelDomain.configureCertificate(domain);
  }

  async checkCertificateExpiry(domainId: string): Promise<void> {
    const domain = await prisma.customDomain.findUnique({
      where: { id: domainId }
    });

    if (!domain || !domain.sslExpiresAt) return;

    const daysUntilExpiry = Math.floor(
      (domain.sslExpiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );

    // Renew if less than 30 days
    if (daysUntilExpiry < 30) {
      await this.renewCertificate(domain.domain);
    }

    // Alert if less than 14 days
    if (daysUntilExpiry < 14) {
      await this.sendExpiryAlert(domain);
    }
  }

  async renewCertificate(domain: string): Promise<void> {
    try {
      await this.requestCertificate(domain);

      await prisma.customDomain.update({
        where: { domain },
        data: {
          sslIssuedAt: new Date(),
          sslExpiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
          errorMessage: null,
          errorCount: 0
        }
      });
    } catch (error) {
      console.error('SSL renewal failed:', error);
      await this.sendSSLErrorAlert(domain, error);
    }
  }
}
```

---

## API Endpoints

### POST /api/admin/domains
Add new custom domain

**Request:**
```json
{
  "domain": "events.clientbrand.com"
}
```

**Response:**
```json
{
  "id": "domain_abc123",
  "domain": "events.clientbrand.com",
  "status": "pending",
  "verificationToken": "events-verify-abc123def456",
  "dnsRecords": [
    {
      "type": "TXT",
      "host": "_events-verification.events.clientbrand.com",
      "value": "events-verify-abc123def456",
      "ttl": 3600
    },
    {
      "type": "CNAME",
      "host": "events.clientbrand.com",
      "value": "cname.vercel-dns.com",
      "ttl": 3600
    }
  ],
  "instructions": "Add these DNS records to your domain registrar..."
}
```

### POST /api/admin/domains/:id/verify
Trigger domain verification check

### GET /api/admin/domains/:id
Get domain status

### DELETE /api/admin/domains/:id
Remove custom domain

### GET /api/admin/domains
List all domains for tenant

---

## UI Components

### CustomDomainSettings Component

```tsx
// app/dashboard/settings/custom-domain.tsx

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert } from '@/components/ui/alert';

export default function CustomDomainSettings() {
  const [domain, setDomain] = useState('');
  const [status, setStatus] = useState<'idle' | 'adding' | 'verifying'>('idle');
  const [dnsRecords, setDnsRecords] = useState<any[]>([]);

  const handleAddDomain = async () => {
    setStatus('adding');
    const response = await fetch('/api/admin/domains', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ domain })
    });
    const data = await response.json();
    setDnsRecords(data.dnsRecords);
    setStatus('verifying');
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Custom Domain</h3>
        <p className="text-sm text-gray-600">
          Use your own domain for a fully white-labeled experience
        </p>
      </div>

      <div className="space-y-4">
        <Input
          placeholder="events.yourdomain.com"
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
          disabled={status !== 'idle'}
        />

        <Button
          onClick={handleAddDomain}
          disabled={status !== 'idle' || !domain}
        >
          Add Custom Domain
        </Button>
      </div>

      {dnsRecords.length > 0 && (
        <Alert>
          <h4 className="font-semibold mb-2">DNS Configuration Required</h4>
          <p className="text-sm mb-4">
            Add these DNS records to your domain registrar:
          </p>
          <div className="space-y-2">
            {dnsRecords.map((record, i) => (
              <div key={i} className="bg-gray-50 p-3 rounded font-mono text-xs">
                <div><strong>Type:</strong> {record.type}</div>
                <div><strong>Host:</strong> {record.host}</div>
                <div><strong>Value:</strong> {record.value}</div>
              </div>
            ))}
          </div>
        </Alert>
      )}
    </div>
  );
}
```

---

## Testing Requirements

### Unit Tests
- DNS verification logic
- Domain validation
- SSL certificate parsing
- Middleware tenant resolution

### Integration Tests
- Full domain addition flow
- DNS verification with mock DNS server
- SSL provisioning simulation
- Domain routing and tenant context

### Manual Testing
- Test with real domain registrar
- Verify SSL certificate installation
- Test multi-tenant isolation
- Verify email notifications
- Test error scenarios (invalid DNS, SSL failures)

---

## Security Considerations

1. **Domain Ownership Verification**
   - TXT record prevents unauthorized domain claims
   - Must verify before activating domain

2. **SSL/TLS Enforcement**
   - HTTPS only, no HTTP fallback
   - Strong cipher suites
   - HSTS headers enabled

3. **Tenant Isolation**
   - Middleware validates domain → tenant mapping
   - No cross-tenant data access
   - Session cookies scoped to specific domain

4. **Rate Limiting**
   - Limit domain addition attempts (5 per tenant per day)
   - Limit verification checks (1 per 5 minutes)

5. **DNS Security**
   - DNSSEC validation where available
   - Protection against DNS spoofing
   - Timeout and retry logic

---

## Dependencies

- **Vercel Domains API** or custom DNS management
- **Let's Encrypt** for SSL certificates
- **DNS resolver library** (Node.js dns/promises)
- **Email service** for notifications
- **Cron job** for periodic verification checks and SSL renewal

---

## Success Metrics

- Domain verification success rate > 95%
- Average verification time < 15 minutes
- SSL certificate issuance success rate > 99%
- Zero cross-tenant domain access incidents
- Customer satisfaction with setup process > 4.5/5

---

## Notes

- Consider supporting apex domains (yourdomain.com) and subdomains
- Provide migration path from subdomain to custom domain
- Document common DNS registrar configurations (GoDaddy, Namecheap, etc.)
- Consider adding CAA DNS records for additional SSL security
- Plan for IPv6 support with AAAA records