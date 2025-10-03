# WL-008: Subdomain Management & Provisioning

**Epic:** EPIC-011: White-Label Features
**Story Points:** 5
**Priority:** High
**Status:** Not Started

---

## User Story

**As a** white-label client
**I want to** use a platform-provided subdomain (e.g., mybrand.events.platform.com)
**So that** I can have a branded URL immediately without configuring a custom domain

### Acceptance Criteria

1. **Subdomain Provisioning**
   - [ ] Automatic subdomain creation on tenant signup
   - [ ] Subdomain based on tenant slug (e.g., client-name.events.platform.com)
   - [ ] Immediate availability (no waiting for DNS)
   - [ ] Wildcard SSL certificate covers all subdomains
   - [ ] HTTPS enforced by default

2. **Subdomain Customization**
   - [ ] Choose subdomain during signup
   - [ ] Change subdomain after signup (one-time)
   - [ ] Validate subdomain availability in real-time
   - [ ] Reserve common/restricted subdomains (admin, api, www, etc.)
   - [ ] Subdomain naming rules displayed

3. **Subdomain Validation**
   - [ ] Alphanumeric characters and hyphens only
   - [ ] 3-63 characters length
   - [ ] Cannot start or end with hyphen
   - [ ] Case-insensitive (normalized to lowercase)
   - [ ] Real-time availability checking
   - [ ] Reserved word blocking

4. **Wildcard DNS & SSL**
   - [ ] Wildcard DNS record (*.events.platform.com → platform IP)
   - [ ] Wildcard SSL certificate (*.events.platform.com)
   - [ ] Automatic SSL renewal
   - [ ] HTTP → HTTPS redirect
   - [ ] HSTS headers enabled

5. **Subdomain Routing**
   - [ ] Middleware extracts subdomain from hostname
   - [ ] Route request to correct tenant
   - [ ] 404 if subdomain doesn't exist
   - [ ] Handle www. prefix gracefully
   - [ ] Load balancing support

6. **Upgrade Path to Custom Domain**
   - [ ] Subdomain remains active when custom domain added
   - [ ] Option to redirect subdomain to custom domain
   - [ ] Both work simultaneously during transition
   - [ ] Clear upgrade instructions

7. **Subdomain Settings**
   - [ ] View current subdomain in dashboard
   - [ ] Change subdomain (with confirmation)
   - [ ] Preview subdomain URL
   - [ ] Copy subdomain to clipboard
   - [ ] See subdomain usage in analytics

8. **Reserved Subdomains**
   - [ ] System reserves: admin, api, www, mail, ftp, etc.
   - [ ] Platform features: app, dashboard, docs, blog, etc.
   - [ ] Clear error message when reserved subdomain chosen
   - [ ] Suggest alternative subdomains

---

## Technical Requirements

### DNS Configuration

**Wildcard DNS Setup:**

```
Type: A
Host: *.events.platform.com
Value: 76.76.21.21 (platform IP)
TTL: 3600

Type: AAAA (IPv6)
Host: *.events.platform.com
Value: 2001:db8::1 (platform IPv6)
TTL: 3600
```

**Wildcard SSL Certificate:**

```bash
# Using Certbot (Let's Encrypt)
certbot certonly \
  --manual \
  --preferred-challenges=dns \
  -d *.events.platform.com \
  -d events.platform.com

# Or using Vercel (automatic)
# Vercel handles wildcard SSL automatically
```

### Subdomain Service

```typescript
// lib/services/subdomain.service.ts

interface SubdomainValidation {
  isValid: boolean;
  isAvailable: boolean;
  errors: string[];
  suggestions?: string[];
}

class SubdomainService {
  private RESERVED_SUBDOMAINS = [
    'www',
    'api',
    'admin',
    'dashboard',
    'app',
    'mail',
    'email',
    'ftp',
    'smtp',
    'pop',
    'imap',
    'blog',
    'docs',
    'help',
    'support',
    'status',
    'cdn',
    'assets',
    'static',
    'files',
    'staging',
    'dev',
    'test',
  ];

  private SUBDOMAIN_REGEX = /^[a-z0-9]([a-z0-9-]{1,61}[a-z0-9])?$/;

  async validateSubdomain(subdomain: string): Promise<SubdomainValidation> {
    const result: SubdomainValidation = {
      isValid: true,
      isAvailable: true,
      errors: [],
    };

    // Normalize
    const normalized = subdomain.toLowerCase().trim();

    // Check format
    if (!this.SUBDOMAIN_REGEX.test(normalized)) {
      result.isValid = false;
      result.errors.push(
        'Subdomain must be 3-63 characters, alphanumeric and hyphens only, cannot start/end with hyphen'
      );
      return result;
    }

    // Check length
    if (normalized.length < 3 || normalized.length > 63) {
      result.isValid = false;
      result.errors.push('Subdomain must be between 3 and 63 characters');
      return result;
    }

    // Check reserved
    if (this.RESERVED_SUBDOMAINS.includes(normalized)) {
      result.isValid = false;
      result.errors.push('This subdomain is reserved for system use');
      result.suggestions = this.generateSuggestions(normalized);
      return result;
    }

    // Check availability
    const existing = await prisma.tenant.findUnique({
      where: { subdomain: normalized },
    });

    if (existing) {
      result.isValid = false;
      result.isAvailable = false;
      result.errors.push('This subdomain is already taken');
      result.suggestions = this.generateSuggestions(normalized);
      return result;
    }

    return result;
  }

  async assignSubdomain(tenantId: string, subdomain: string): Promise<void> {
    // Validate first
    const validation = await this.validateSubdomain(subdomain);

    if (!validation.isValid || !validation.isAvailable) {
      throw new Error(validation.errors.join(', '));
    }

    const normalized = subdomain.toLowerCase().trim();

    // Update tenant
    await prisma.tenant.update({
      where: { id: tenantId },
      data: { subdomain: normalized },
    });

    // Log change
    await prisma.auditLog.create({
      data: {
        tenantId,
        action: 'SUBDOMAIN_ASSIGNED',
        metadata: { subdomain: normalized },
      },
    });
  }

  async changeSubdomain(
    tenantId: string,
    newSubdomain: string
  ): Promise<void> {
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new Error('Tenant not found');
    }

    // Check if already changed (only allow one change)
    if (tenant.subdomainChangedAt) {
      throw new Error('Subdomain can only be changed once');
    }

    // Validate new subdomain
    const validation = await this.validateSubdomain(newSubdomain);

    if (!validation.isValid || !validation.isAvailable) {
      throw new Error(validation.errors.join(', '));
    }

    const normalized = newSubdomain.toLowerCase().trim();

    // Update with change tracking
    await prisma.tenant.update({
      where: { id: tenantId },
      data: {
        subdomain: normalized,
        subdomainChangedAt: new Date(),
        previousSubdomain: tenant.subdomain,
      },
    });

    // Invalidate caches
    await this.invalidateCaches(tenant.subdomain);
    await this.invalidateCaches(normalized);

    // Send notification
    await this.sendSubdomainChangeNotification(tenantId, normalized);
  }

  private generateSuggestions(baseSubdomain: string): string[] {
    const suggestions: string[] = [];

    // Add numbers
    for (let i = 1; i <= 5; i++) {
      suggestions.push(`${baseSubdomain}${i}`);
      suggestions.push(`${baseSubdomain}-${i}`);
    }

    // Add common suffixes
    const suffixes = ['events', 'tickets', 'app', 'hub'];
    for (const suffix of suffixes) {
      suggestions.push(`${baseSubdomain}-${suffix}`);
    }

    return suggestions.slice(0, 5);
  }

  async getSubdomainUrl(subdomain: string): string {
    const platformDomain = process.env.NEXT_PUBLIC_PLATFORM_DOMAIN!;
    return `https://${subdomain}.${platformDomain}`;
  }

  private async invalidateCaches(subdomain: string): Promise<void> {
    await redis.del(`subdomain:${subdomain}`);
    await redis.del(`tenant:subdomain:${subdomain}`);
  }

  private async sendSubdomainChangeNotification(
    tenantId: string,
    newSubdomain: string
  ): Promise<void> {
    // Implementation
  }
}

export default new SubdomainService();
```

### Middleware for Subdomain Routing

```typescript
// middleware.ts

import { NextRequest, NextResponse } from 'next/server';

export async function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || '';
  const url = request.nextUrl;

  // Extract subdomain
  const platformDomain = process.env.NEXT_PUBLIC_PLATFORM_DOMAIN!;

  // Skip if not a platform subdomain
  if (!hostname.endsWith(`.${platformDomain}`)) {
    return NextResponse.next();
  }

  // Extract subdomain
  const subdomain = hostname.replace(`.${platformDomain}`, '');

  // Skip reserved subdomains (handle separately)
  const reservedSubdomains = ['www', 'api', 'admin'];
  if (reservedSubdomains.includes(subdomain)) {
    return NextResponse.next();
  }

  // Get tenant by subdomain (with caching)
  const tenant = await getTenantBySubdomain(subdomain);

  if (!tenant) {
    return new NextResponse('Subdomain not found', { status: 404 });
  }

  // Check tenant status
  if (tenant.status !== 'ACTIVE') {
    return NextResponse.redirect(new URL('/suspended', request.url));
  }

  // Add tenant context to headers
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-tenant-id', tenant.id);
  requestHeaders.set('x-tenant-subdomain', subdomain);

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

// Cached subdomain lookup
async function getTenantBySubdomain(subdomain: string): Promise<Tenant | null> {
  // Try cache first
  const cached = await redis.get(`subdomain:${subdomain}`);
  if (cached) {
    return JSON.parse(cached);
  }

  // Query database
  const tenant = await prisma.tenant.findUnique({
    where: { subdomain },
    include: { subscription: true },
  });

  if (tenant) {
    // Cache for 1 hour
    await redis.setex(`subdomain:${subdomain}`, 3600, JSON.stringify(tenant));
  }

  return tenant;
}
```

### Database Schema

```prisma
// prisma/schema.prisma

model Tenant {
  id                  String   @id @default(cuid())
  slug                String   @unique
  name                String

  // Subdomain
  subdomain           String   @unique
  subdomainChangedAt  DateTime?
  previousSubdomain   String?

  // Custom domains (optional)
  customDomains       CustomDomain[]

  status              TenantStatus @default(ACTIVE)

  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt

  @@index([subdomain])
  @@index([slug])
}
```

---

## API Endpoints

### POST /api/admin/subdomain/validate
Validate subdomain availability

**Request:**
```json
{
  "subdomain": "my-brand"
}
```

**Response:**
```json
{
  "isValid": true,
  "isAvailable": true,
  "errors": [],
  "suggestions": []
}
```

### PATCH /api/admin/subdomain
Change subdomain (one-time)

**Request:**
```json
{
  "subdomain": "new-brand-name"
}
```

### GET /api/admin/subdomain
Get current subdomain info

**Response:**
```json
{
  "subdomain": "my-brand",
  "url": "https://my-brand.events.platform.com",
  "canChange": true,
  "changedAt": null
}
```

---

## UI Components

### Subdomain Settings

```tsx
// app/dashboard/settings/subdomain.tsx

'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import { Check, X, Copy } from 'lucide-react';

export default function SubdomainSettings() {
  const [subdomain, setSubdomain] = useState('');
  const [validation, setValidation] = useState<any>(null);
  const [checking, setChecking] = useState(false);

  // Real-time validation
  useEffect(() => {
    if (!subdomain) return;

    setChecking(true);
    const timer = setTimeout(async () => {
      const response = await fetch('/api/admin/subdomain/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subdomain }),
      });

      const result = await response.json();
      setValidation(result);
      setChecking(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [subdomain]);

  const handleChange = async () => {
    await fetch('/api/admin/subdomain', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subdomain }),
    });

    alert('Subdomain changed successfully!');
  };

  const copyToClipboard = () => {
    const url = `https://${subdomain}.events.platform.com`;
    navigator.clipboard.writeText(url);
  };

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Subdomain</h3>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            Your Subdomain
          </label>
          <div className="flex items-center gap-2">
            <Input
              value={subdomain}
              onChange={(e) => setSubdomain(e.target.value)}
              placeholder="my-brand"
              className="flex-1"
            />
            <span className="text-gray-600">.events.platform.com</span>
            {checking && <span className="text-gray-400">Checking...</span>}
            {validation?.isAvailable && !checking && (
              <Check className="w-5 h-5 text-green-500" />
            )}
            {!validation?.isAvailable && !checking && validation && (
              <X className="w-5 h-5 text-red-500" />
            )}
          </div>
        </div>

        {validation && !validation.isValid && (
          <Alert variant="destructive">
            <ul className="list-disc list-inside">
              {validation.errors.map((error: string, i: number) => (
                <li key={i}>{error}</li>
              ))}
            </ul>

            {validation.suggestions?.length > 0 && (
              <div className="mt-2">
                <p className="text-sm font-medium">Suggestions:</p>
                <div className="flex flex-wrap gap-2 mt-1">
                  {validation.suggestions.map((suggestion: string) => (
                    <button
                      key={suggestion}
                      className="px-2 py-1 bg-white rounded text-sm"
                      onClick={() => setSubdomain(suggestion)}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </Alert>
        )}

        <div className="flex items-center gap-2">
          <div className="flex-1 bg-gray-50 px-3 py-2 rounded font-mono text-sm">
            https://{subdomain || 'your-subdomain'}.events.platform.com
          </div>
          <Button variant="ghost" size="sm" onClick={copyToClipboard}>
            <Copy className="w-4 h-4" />
          </Button>
        </div>

        <Button
          onClick={handleChange}
          disabled={!validation?.isValid || !validation?.isAvailable}
        >
          Change Subdomain
        </Button>

        <Alert>
          <p className="text-sm">
            <strong>Note:</strong> Subdomain can only be changed once. Choose
            carefully!
          </p>
        </Alert>
      </div>
    </Card>
  );
}
```

---

## Infrastructure Setup

### Vercel Configuration

```json
// vercel.json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/next"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/"
    }
  ],
  "wildcard": [
    {
      "domain": "*.events.platform.com",
      "value": "events.platform.com"
    }
  ]
}
```

### Nginx Configuration (if self-hosted)

```nginx
server {
    listen 443 ssl http2;
    server_name *.events.platform.com;

    ssl_certificate /etc/letsencrypt/live/events.platform.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/events.platform.com/privkey.pem;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name *.events.platform.com;
    return 301 https://$host$request_uri;
}
```

---

## Testing Requirements

### Unit Tests
- Subdomain validation logic
- Suggestion generation
- Reserved subdomain checking

### Integration Tests
- Full subdomain provisioning flow
- Subdomain routing
- Tenant lookup by subdomain

### Load Tests
- Concurrent subdomain requests
- Cache hit rates
- DNS resolution performance

---

## Security Considerations

1. **DNS Security**
   - DNSSEC where available
   - Protection against DNS spoofing
   - Rate limiting on DNS queries

2. **Subdomain Hijacking Prevention**
   - Validate ownership on signup
   - Track subdomain changes
   - Alert on suspicious activity

3. **SSL/TLS**
   - Wildcard certificate covers all subdomains
   - Automatic renewal
   - Strong cipher suites

---

## Performance Optimization

1. **Caching**
   - Cache subdomain → tenant mapping (1 hour)
   - CDN edge caching
   - DNS caching

2. **Database Indexes**
   ```sql
   CREATE INDEX idx_tenant_subdomain ON tenants(subdomain);
   ```

3. **Monitoring**
   - DNS resolution times
   - Subdomain lookup latency
   - Cache hit rates

---

## Success Metrics

- Subdomain provisioning time < 1 second
- Subdomain availability check < 100ms
- Zero subdomain collisions
- 99.9% uptime for subdomain routing
- Customer satisfaction > 4.5/5

---

## Notes

- Consider subdomain marketplace (transfer between tenants)
- Add subdomain analytics (visits, traffic)
- Implement subdomain aliases
- Consider internationalized subdomains (punycode)
- Plan for subdomain deprecation policy