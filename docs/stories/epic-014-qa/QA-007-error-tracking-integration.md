# QA-007: Error Tracking Integration

**Epic:** EPIC-014 - QA & Testing
**Story Points:** 3
**Priority:** High
**Status:** To Do

## User Story

**As a** developer
**I want** comprehensive error tracking with Sentry
**So that** I can quickly identify, debug, and resolve production errors

## Description

Integrate Sentry for real-time error tracking, monitoring, and alerting across frontend, backend, and mobile applications. Implement error grouping, source map support, release tracking, and performance monitoring to provide comprehensive visibility into application health and quickly resolve issues.

## Acceptance Criteria

### 1. Sentry Integration
- [ ] Sentry project created and configured
- [ ] SDK installed for Next.js (frontend + backend)
- [ ] Environment configuration (dev, staging, prod)
- [ ] Source maps uploaded for production
- [ ] Release tracking configured
- [ ] User context attached to errors
- [ ] Custom tags and metadata

### 2. Error Capture & Reporting
- [ ] Automatic error capture (unhandled exceptions)
- [ ] Manual error reporting (try-catch blocks)
- [ ] API error capture
- [ ] Database error capture
- [ ] Network error capture
- [ ] JavaScript errors in browser
- [ ] Server-side errors
- [ ] Promise rejection handling

### 3. Error Grouping & Classification
- [ ] Errors grouped by similarity
- [ ] Error fingerprinting customization
- [ ] Severity levels (fatal, error, warning, info)
- [ ] Error priority tagging
- [ ] Custom error categories
- [ ] Ignore list for known errors
- [ ] Rate limiting for noisy errors

### 4. Context & Debugging Information
- [ ] **User Context:** User ID, email, role
- [ ] **Request Context:** URL, method, headers, body
- [ ] **Browser Context:** User agent, viewport, screen size
- [ ] **Server Context:** Environment, hostname, version
- [ ] **Breadcrumbs:** User actions leading to error
- [ ] **Stack Traces:** Full stack with source maps
- [ ] **Custom Data:** Business-specific context

### 5. Alerting & Notifications
- [ ] Slack notifications for critical errors
- [ ] Email alerts for high-severity issues
- [ ] PagerDuty integration for on-call
- [ ] Alert rules based on error frequency
- [ ] Alert rules based on user impact
- [ ] Daily digest emails
- [ ] Weekly summary reports

### 6. Release Tracking
- [ ] Deploy notifications to Sentry
- [ ] Release health monitoring
- [ ] Regression detection
- [ ] Release comparison
- [ ] Commit tracking
- [ ] Deploy frequency tracking
- [ ] Release adoption monitoring

### 7. Performance Monitoring
- [ ] Transaction performance tracking
- [ ] Database query monitoring
- [ ] External API call tracking
- [ ] Frontend performance metrics
- [ ] Custom performance measurements
- [ ] Performance regression detection

### 8. Error Resolution Workflow
- [ ] Assign errors to team members
- [ ] Mark errors as resolved
- [ ] Add comments and discussion
- [ ] Link to GitHub issues
- [ ] Track resolution time
- [ ] Error regression detection
- [ ] Bulk error actions

## Technical Requirements

### Sentry Configuration
```javascript
// sentry.config.js
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  release: process.env.VERCEL_GIT_COMMIT_SHA || 'development',

  // Adjust sample rate for production
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Enable performance monitoring
  enableTracing: true,

  // Configure integrations
  integrations: [
    new Sentry.BrowserTracing({
      tracePropagationTargets: [
        'localhost',
        /^https:\/\/events\.stepperslife\.com/,
        /^https:\/\/api\.events\.stepperslife\.com/,
      ],
    }),
    new Sentry.Replay({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],

  // Capture breadcrumbs
  beforeBreadcrumb(breadcrumb) {
    // Filter sensitive data from breadcrumbs
    if (breadcrumb.category === 'console' && breadcrumb.level === 'log') {
      return null; // Don't capture console.log
    }
    return breadcrumb;
  },

  // Modify error before sending
  beforeSend(event, hint) {
    // Filter sensitive data
    if (event.request?.data) {
      // Redact passwords, tokens, etc.
      event.request.data = redactSensitiveData(event.request.data);
    }

    // Add custom context
    event.tags = {
      ...event.tags,
      feature: identifyFeature(event),
    };

    return event;
  },

  // Ignore certain errors
  ignoreErrors: [
    'ResizeObserver loop limit exceeded',
    'Non-Error promise rejection captured',
    'ChunkLoadError',
  ],
});

function redactSensitiveData(data: any) {
  if (data.password) data.password = '[REDACTED]';
  if (data.token) data.token = '[REDACTED]';
  if (data.apiKey) data.apiKey = '[REDACTED]';
  return data;
}
```

### Client-Side Error Capture
```typescript
// lib/monitoring/sentry-client.ts
import * as Sentry from '@sentry/nextjs';

/**
 * Capture exception with context
 */
export function captureError(
  error: Error,
  context?: {
    user?: { id: string; email: string };
    tags?: Record<string, string>;
    extra?: Record<string, any>;
  }
) {
  Sentry.withScope((scope) => {
    // Add user context
    if (context?.user) {
      scope.setUser({
        id: context.user.id,
        email: context.user.email,
      });
    }

    // Add custom tags
    if (context?.tags) {
      Object.entries(context.tags).forEach(([key, value]) => {
        scope.setTag(key, value);
      });
    }

    // Add extra data
    if (context?.extra) {
      scope.setExtras(context.extra);
    }

    // Set severity
    scope.setLevel('error');

    // Capture exception
    Sentry.captureException(error);
  });
}

/**
 * Add breadcrumb for debugging
 */
export function addBreadcrumb(
  message: string,
  category: string,
  data?: Record<string, any>
) {
  Sentry.addBreadcrumb({
    message,
    category,
    data,
    level: 'info',
    timestamp: Date.now() / 1000,
  });
}

/**
 * Set user context
 */
export function setUser(user: { id: string; email: string; role?: string }) {
  Sentry.setUser({
    id: user.id,
    email: user.email,
    role: user.role,
  });
}

/**
 * Clear user context
 */
export function clearUser() {
  Sentry.setUser(null);
}
```

### Server-Side Error Capture
```typescript
// lib/monitoring/sentry-server.ts
import * as Sentry from '@sentry/nextjs';

/**
 * Error handler middleware for API routes
 */
export function withSentryErrorHandler(handler: any) {
  return async (req: any, res: any) => {
    try {
      return await handler(req, res);
    } catch (error) {
      // Capture error with request context
      Sentry.withScope((scope) => {
        scope.setContext('request', {
          url: req.url,
          method: req.method,
          headers: req.headers,
          query: req.query,
          body: redactSensitiveData(req.body),
        });

        scope.setTag('route', req.url);
        scope.setUser({
          id: req.user?.id,
          email: req.user?.email,
        });

        Sentry.captureException(error);
      });

      // Return error response
      res.status(500).json({
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  };
}

/**
 * Database error handler
 */
export function captureDatabaseError(error: any, query: string) {
  Sentry.withScope((scope) => {
    scope.setTag('error_type', 'database');
    scope.setContext('database', {
      query: query.substring(0, 500), // Truncate long queries
      error_code: error.code,
      constraint: error.constraint,
    });

    Sentry.captureException(error);
  });
}

/**
 * Payment error handler
 */
export function capturePaymentError(
  error: any,
  paymentData: {
    orderId: string;
    amount: number;
    provider: string;
  }
) {
  Sentry.withScope((scope) => {
    scope.setTag('error_type', 'payment');
    scope.setTag('payment_provider', paymentData.provider);
    scope.setContext('payment', {
      orderId: paymentData.orderId,
      amount: paymentData.amount,
      provider: paymentData.provider,
    });

    scope.setLevel('error');
    Sentry.captureException(error);
  });
}
```

### Example Usage in Components
```typescript
// components/checkout/CheckoutForm.tsx
import { captureError, addBreadcrumb } from '@/lib/monitoring/sentry-client';

export function CheckoutForm() {
  const handleSubmit = async (data: CheckoutData) => {
    try {
      addBreadcrumb('Checkout form submitted', 'user_action', {
        itemCount: data.items.length,
        total: data.total,
      });

      const result = await processPayment(data);

      addBreadcrumb('Payment processed successfully', 'payment', {
        orderId: result.orderId,
      });
    } catch (error) {
      captureError(error as Error, {
        user: { id: user.id, email: user.email },
        tags: {
          feature: 'checkout',
          payment_provider: 'square',
        },
        extra: {
          amount: data.total,
          itemCount: data.items.length,
        },
      });

      toast.error('Payment failed. Please try again.');
    }
  };

  return <form onSubmit={handleSubmit}>...</form>;
}
```

### Example Usage in API Routes
```typescript
// app/api/events/[eventId]/purchase/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { withSentryErrorHandler, capturePaymentError } from '@/lib/monitoring/sentry-server';

export const POST = withSentryErrorHandler(async (
  request: NextRequest,
  { params }: { params: { eventId: string } }
) => {
  const body = await request.json();

  try {
    const result = await paymentService.processPayment({
      eventId: params.eventId,
      ...body,
    });

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof PaymentError) {
      capturePaymentError(error, {
        orderId: body.orderId,
        amount: body.amount,
        provider: 'square',
      });
    }

    throw error;
  }
});
```

### Release Tracking
```bash
# scripts/sentry-release.sh
#!/bin/bash

# Create release
sentry-cli releases new "${VERCEL_GIT_COMMIT_SHA}"

# Associate commits with release
sentry-cli releases set-commits "${VERCEL_GIT_COMMIT_SHA}" --auto

# Upload source maps
sentry-cli releases files "${VERCEL_GIT_COMMIT_SHA}" upload-sourcemaps .next/static

# Finalize release
sentry-cli releases finalize "${VERCEL_GIT_COMMIT_SHA}"

# Create deploy
sentry-cli releases deploys "${VERCEL_GIT_COMMIT_SHA}" new -e production
```

### CI/CD Integration
```yaml
# .github/workflows/deploy.yml
name: Deploy and Track Release

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
        with:
          fetch-depth: 0 # Fetch all history for Sentry release

      - name: Install Sentry CLI
        run: |
          curl -sL https://sentry.io/get-cli/ | bash

      - name: Build application
        run: npm run build

      - name: Create Sentry release
        env:
          SENTRY_AUTH_TOKEN: ${{ secrets.SENTRY_AUTH_TOKEN }}
          SENTRY_ORG: events-stepperslife
          SENTRY_PROJECT: events-platform
        run: |
          VERSION=$(git rev-parse HEAD)
          sentry-cli releases new "$VERSION"
          sentry-cli releases set-commits "$VERSION" --auto
          sentry-cli releases files "$VERSION" upload-sourcemaps .next/static
          sentry-cli releases finalize "$VERSION"

      - name: Deploy to Vercel
        run: vercel --prod

      - name: Create Sentry deploy
        env:
          SENTRY_AUTH_TOKEN: ${{ secrets.SENTRY_AUTH_TOKEN }}
          SENTRY_ORG: events-stepperslife
          SENTRY_PROJECT: events-platform
        run: |
          VERSION=$(git rev-parse HEAD)
          sentry-cli releases deploys "$VERSION" new -e production
```

### Alert Rules Configuration
```javascript
// sentry-alerts.config.js
module.exports = {
  alerts: [
    {
      name: 'High Error Rate',
      conditions: [
        {
          type: 'event_frequency',
          value: 100,
          interval: '1h',
        },
      ],
      actions: [
        { type: 'slack', channel: '#alerts' },
        { type: 'email', targets: ['oncall@stepperslife.com'] },
      ],
    },
    {
      name: 'Critical Payment Errors',
      conditions: [
        {
          type: 'event_frequency',
          value: 10,
          interval: '5m',
          tags: { error_type: 'payment' },
        },
      ],
      actions: [
        { type: 'slack', channel: '#critical-alerts' },
        { type: 'pagerduty', service_key: process.env.PAGERDUTY_KEY },
      ],
    },
    {
      name: 'New Release Issues',
      conditions: [
        {
          type: 'event_frequency',
          value: 50,
          interval: '30m',
          comparison: 'previous_release',
        },
      ],
      actions: [
        { type: 'slack', channel: '#deployments' },
      ],
    },
  ],
};
```

### Performance Monitoring
```typescript
// lib/monitoring/performance.ts
import * as Sentry from '@sentry/nextjs';

/**
 * Measure custom performance
 */
export function measurePerformance<T>(
  name: string,
  operation: () => Promise<T>
): Promise<T> {
  const transaction = Sentry.startTransaction({
    op: 'custom',
    name,
  });

  return operation()
    .then((result) => {
      transaction.setStatus('ok');
      return result;
    })
    .catch((error) => {
      transaction.setStatus('error');
      Sentry.captureException(error);
      throw error;
    })
    .finally(() => {
      transaction.finish();
    });
}

/**
 * Track database query performance
 */
export async function trackDatabaseQuery<T>(
  query: string,
  operation: () => Promise<T>
): Promise<T> {
  const span = Sentry.getCurrentHub()
    .getScope()
    .getTransaction()
    ?.startChild({
      op: 'db.query',
      description: query,
    });

  try {
    const result = await operation();
    span?.setStatus('ok');
    return result;
  } catch (error) {
    span?.setStatus('error');
    throw error;
  } finally {
    span?.finish();
  }
}
```

## Implementation Details

### Phase 1: Setup & Configuration (Day 1)
1. Create Sentry project
2. Install Sentry SDK
3. Configure for Next.js
4. Set up source maps
5. Test error capture

### Phase 2: Integration & Context (Day 2)
1. Add user context
2. Implement breadcrumbs
3. Add custom tags
4. Set up error handlers
5. Test error grouping

### Phase 3: Alerts & Monitoring (Day 3)
1. Configure alert rules
2. Set up notifications
3. Enable performance monitoring
4. Configure release tracking
5. Test alert triggers

### File Structure
```
/lib/monitoring/
├── sentry-client.ts
├── sentry-server.ts
├── performance.ts
└── types.ts

/sentry.config.js
/sentry.server.config.js
/sentry.edge.config.js

/scripts/
├── sentry-release.sh
└── upload-sourcemaps.sh

/.github/workflows/
└── sentry-deploy.yml
```

## Dependencies
- Infrastructure: Sentry account
- Related: QA-006 (Performance Monitoring)

## Testing Checklist

### Error Capture
- [ ] Frontend errors captured
- [ ] Backend errors captured
- [ ] API errors captured
- [ ] Database errors captured
- [ ] Payment errors captured

### Context
- [ ] User context attached
- [ ] Request context included
- [ ] Breadcrumbs working
- [ ] Custom tags applied
- [ ] Stack traces complete

### Alerts
- [ ] Alerts configured
- [ ] Notifications delivered
- [ ] Alert rules working
- [ ] No false positives
- [ ] Critical errors escalated

### Performance
- [ ] Transactions tracked
- [ ] Database queries monitored
- [ ] External calls tracked
- [ ] Performance regression detected

## Success Metrics
- Error detection rate: 100%
- Mean time to detect: < 1 minute
- Mean time to resolution: < 2 hours
- Alert accuracy: > 95%
- False positive rate: < 5%

## Additional Resources
- [Sentry Documentation](https://docs.sentry.io/)
- [Sentry Next.js Guide](https://docs.sentry.io/platforms/javascript/guides/nextjs/)
- [Error Monitoring Best Practices](https://blog.sentry.io/error-monitoring-best-practices/)

## Notes
- Redact sensitive data from error reports
- Set up budget alerts to avoid surprise costs
- Review errors weekly to identify patterns
- Use Sentry's issue grouping to reduce noise
- Integrate with GitHub for issue tracking