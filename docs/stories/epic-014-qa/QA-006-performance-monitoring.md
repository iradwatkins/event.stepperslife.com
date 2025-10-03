# QA-006: Performance Monitoring

**Epic:** EPIC-014 - QA & Testing
**Story Points:** 3
**Priority:** Medium
**Status:** To Do

## User Story

**As a** DevOps engineer
**I want** real-time performance monitoring
**So that** I can detect and resolve performance issues proactively

## Description

Implement comprehensive real-time performance monitoring using New Relic, Datadog, or similar APM (Application Performance Monitoring) tools. Monitor application metrics, server resources, database performance, API response times, and user experience metrics to maintain optimal system performance.

## Acceptance Criteria

### 1. Application Performance Monitoring (APM)
- [ ] Install and configure APM agent (New Relic/Datadog)
- [ ] Monitor application response times
- [ ] Track error rates and exceptions
- [ ] Monitor throughput (requests per minute)
- [ ] Track Apdex score (user satisfaction)
- [ ] Database query performance monitoring
- [ ] External service call tracking

### 2. Infrastructure Monitoring
- [ ] CPU utilization tracking
- [ ] Memory usage monitoring
- [ ] Disk I/O performance
- [ ] Network throughput
- [ ] Load balancer metrics
- [ ] Container/pod health (if using Kubernetes)
- [ ] Auto-scaling trigger metrics

### 3. Database Performance
- [ ] Query execution time
- [ ] Slow query identification
- [ ] Connection pool utilization
- [ ] Lock wait times
- [ ] Index usage statistics
- [ ] Database size growth
- [ ] Cache hit rates

### 4. API & Endpoint Monitoring
- [ ] Response time per endpoint
- [ ] Error rate per endpoint
- [ ] Throughput per endpoint
- [ ] 95th/99th percentile response times
- [ ] API availability/uptime
- [ ] Rate limit hits
- [ ] Geographic latency

### 5. User Experience Monitoring (Real User Monitoring - RUM)
- [ ] Page load times
- [ ] Time to First Byte (TTFB)
- [ ] First Contentful Paint (FCP)
- [ ] Largest Contentful Paint (LCP)
- [ ] Cumulative Layout Shift (CLS)
- [ ] First Input Delay (FID)
- [ ] JavaScript errors in browser

### 6. Custom Metrics & Business KPIs
- [ ] Event creation rate
- [ ] Ticket purchase conversion rate
- [ ] Checkout abandonment rate
- [ ] Check-in success rate
- [ ] Email delivery rate
- [ ] Payment success/failure rate
- [ ] Revenue per minute

### 7. Alerting & Notifications
- [ ] High error rate alerts (> 5%)
- [ ] Slow response time alerts (> 2s)
- [ ] High CPU/memory alerts (> 80%)
- [ ] Database connection exhaustion
- [ ] External service failures
- [ ] Disk space low alerts
- [ ] Certificate expiration warnings

### 8. Dashboards & Visualization
- [ ] Real-time performance dashboard
- [ ] System health overview
- [ ] API performance dashboard
- [ ] Database performance dashboard
- [ ] User experience dashboard
- [ ] Business metrics dashboard
- [ ] Custom team dashboards

## Technical Requirements

### New Relic Configuration
```typescript
// newrelic.js
'use strict';

exports.config = {
  app_name: ['Events SteppersLife'],
  license_key: process.env.NEW_RELIC_LICENSE_KEY,
  logging: {
    level: 'info',
  },
  application_logging: {
    forwarding: {
      enabled: true,
    },
  },
  distributed_tracing: {
    enabled: true,
  },
  span_events: {
    enabled: true,
  },
  transaction_tracer: {
    enabled: true,
    transaction_threshold: 0.5, // 500ms
    record_sql: 'obfuscated',
    top_n: 20,
  },
  error_collector: {
    enabled: true,
    ignore_status_codes: [404],
  },
  slow_sql: {
    enabled: true,
  },
  custom_insights_events: {
    enabled: true,
  },
};
```

### Custom Metrics Tracking
```typescript
// lib/monitoring/metrics.service.ts
import newrelic from 'newrelic';

export class MetricsService {
  /**
   * Track custom metric
   */
  recordMetric(name: string, value: number, unit?: string) {
    newrelic.recordMetric(name, value);
  }

  /**
   * Track event creation
   */
  trackEventCreation(eventId: string, duration: number) {
    newrelic.recordCustomEvent('EventCreated', {
      eventId,
      duration,
      timestamp: Date.now(),
    });

    this.recordMetric('Custom/Events/Created', 1);
    this.recordMetric('Custom/Events/CreationTime', duration);
  }

  /**
   * Track ticket purchase
   */
  trackPurchase(orderId: string, amount: number, ticketCount: number) {
    newrelic.recordCustomEvent('TicketPurchase', {
      orderId,
      amount,
      ticketCount,
      timestamp: Date.now(),
    });

    this.recordMetric('Custom/Purchases/Count', 1);
    this.recordMetric('Custom/Purchases/Revenue', amount);
    this.recordMetric('Custom/Purchases/TicketCount', ticketCount);
  }

  /**
   * Track payment failure
   */
  trackPaymentFailure(reason: string) {
    newrelic.recordCustomEvent('PaymentFailure', {
      reason,
      timestamp: Date.now(),
    });

    this.recordMetric('Custom/Payments/Failures', 1);
  }

  /**
   * Track check-in
   */
  trackCheckIn(eventId: string, scanTime: number) {
    newrelic.recordCustomEvent('CheckIn', {
      eventId,
      scanTime,
      timestamp: Date.now(),
    });

    this.recordMetric('Custom/CheckIns/Count', 1);
    this.recordMetric('Custom/CheckIns/ScanTime', scanTime);
  }

  /**
   * Track API call
   */
  trackApiCall(endpoint: string, method: string, duration: number, statusCode: number) {
    newrelic.recordCustomEvent('ApiCall', {
      endpoint,
      method,
      duration,
      statusCode,
      timestamp: Date.now(),
    });
  }
}
```

### Performance Monitoring Middleware
```typescript
// middleware/performance-monitor.ts
import { NextRequest, NextResponse } from 'next/server';
import newrelic from 'newrelic';

export async function performanceMiddleware(request: NextRequest) {
  const startTime = Date.now();

  // Start New Relic transaction
  const transaction = newrelic.getTransaction();
  transaction.name = `${request.method} ${request.nextUrl.pathname}`;

  try {
    // Continue request
    const response = await NextResponse.next();

    // Record metrics
    const duration = Date.now() - startTime;
    newrelic.recordMetric('Custom/Response/Time', duration);

    // Add custom attributes
    transaction.addCustomAttribute('path', request.nextUrl.pathname);
    transaction.addCustomAttribute('method', request.method);
    transaction.addCustomAttribute('statusCode', response.status);

    return response;
  } catch (error) {
    // Record error
    newrelic.noticeError(error);
    throw error;
  }
}
```

### Database Query Monitoring
```typescript
// lib/prisma-instrumented.ts
import { PrismaClient } from '@prisma/client';
import newrelic from 'newrelic';

export const prisma = new PrismaClient({
  log: [
    {
      emit: 'event',
      level: 'query',
    },
  ],
});

// Monitor query performance
prisma.$on('query', (e: any) => {
  const duration = e.duration;
  const query = e.query;

  // Record slow queries
  if (duration > 1000) {
    newrelic.recordCustomEvent('SlowQuery', {
      query: query.substring(0, 200), // Truncate for logging
      duration,
      timestamp: Date.now(),
    });
  }

  // Record all query metrics
  newrelic.recordMetric('Custom/Database/QueryTime', duration);
});
```

### Real User Monitoring (RUM)
```typescript
// app/layout.tsx
import Script from 'next/script';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* New Relic Browser Agent */}
        <Script
          id="newrelic-browser"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              window.NREUM||(NREUM={});NREUM.init={
                distributed_tracing:{enabled:true},
                privacy:{cookies_enabled:true},
                ajax:{deny_list:["bam.nr-data.net"]}
              };
              // ... New Relic browser agent code
            `,
          }}
        />

        {/* Core Web Vitals Monitoring */}
        <Script
          id="web-vitals"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              import {getCLS, getFID, getFCP, getLCP, getTTFB} from 'web-vitals';

              function sendToAnalytics(metric) {
                const body = JSON.stringify(metric);
                (navigator.sendBeacon && navigator.sendBeacon('/api/analytics', body)) ||
                  fetch('/api/analytics', {body, method: 'POST', keepalive: true});
              }

              getCLS(sendToAnalytics);
              getFID(sendToAnalytics);
              getFCP(sendToAnalytics);
              getLCP(sendToAnalytics);
              getTTFB(sendToAnalytics);
            `,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
```

### Alert Configuration (Terraform/IaC)
```hcl
# terraform/newrelic-alerts.tf
resource "newrelic_alert_policy" "main" {
  name = "Events SteppersLife Alerts"
}

resource "newrelic_nrql_alert_condition" "high_error_rate" {
  policy_id = newrelic_alert_policy.main.id
  name      = "High Error Rate"
  type      = "static"

  nrql {
    query = "SELECT percentage(count(*), WHERE error IS true) FROM Transaction"
  }

  critical {
    operator              = "above"
    threshold             = 5.0
    threshold_duration    = 300
    threshold_occurrences = "at_least_once"
  }

  warning {
    operator              = "above"
    threshold             = 2.0
    threshold_duration    = 300
    threshold_occurrences = "at_least_once"
  }
}

resource "newrelic_nrql_alert_condition" "slow_response_time" {
  policy_id = newrelic_alert_policy.main.id
  name      = "Slow Response Time"
  type      = "static"

  nrql {
    query = "SELECT average(duration) FROM Transaction WHERE transactionType = 'Web'"
  }

  critical {
    operator              = "above"
    threshold             = 2.0
    threshold_duration    = 300
    threshold_occurrences = "at_least_once"
  }
}

resource "newrelic_nrql_alert_condition" "high_cpu" {
  policy_id = newrelic_alert_policy.main.id
  name      = "High CPU Usage"
  type      = "static"

  nrql {
    query = "SELECT average(host.cpuPercent) FROM SystemSample"
  }

  critical {
    operator              = "above"
    threshold             = 80.0
    threshold_duration    = 600
    threshold_occurrences = "at_least_once"
  }
}
```

### Custom Dashboard Configuration
```json
{
  "name": "Events SteppersLife - System Health",
  "pages": [
    {
      "name": "Overview",
      "widgets": [
        {
          "title": "Response Time (Avg)",
          "visualization": "viz.line",
          "nrql": "SELECT average(duration) FROM Transaction TIMESERIES"
        },
        {
          "title": "Error Rate",
          "visualization": "viz.billboard",
          "nrql": "SELECT percentage(count(*), WHERE error IS true) FROM Transaction"
        },
        {
          "title": "Throughput",
          "visualization": "viz.line",
          "nrql": "SELECT rate(count(*), 1 minute) FROM Transaction TIMESERIES"
        },
        {
          "title": "Apdex Score",
          "visualization": "viz.billboard",
          "nrql": "SELECT apdex(duration, t:0.5) FROM Transaction"
        },
        {
          "title": "Top Slow Transactions",
          "visualization": "viz.table",
          "nrql": "SELECT average(duration) FROM Transaction FACET name LIMIT 10"
        },
        {
          "title": "Database Query Performance",
          "visualization": "viz.line",
          "nrql": "SELECT average(duration) FROM DatastoreQuery TIMESERIES"
        }
      ]
    },
    {
      "name": "Business Metrics",
      "widgets": [
        {
          "title": "Ticket Purchases",
          "visualization": "viz.line",
          "nrql": "SELECT count(*) FROM TicketPurchase TIMESERIES"
        },
        {
          "title": "Revenue",
          "visualization": "viz.area",
          "nrql": "SELECT sum(amount) FROM TicketPurchase TIMESERIES"
        },
        {
          "title": "Payment Failures",
          "visualization": "viz.billboard",
          "nrql": "SELECT count(*) FROM PaymentFailure SINCE 1 hour ago"
        },
        {
          "title": "Check-Ins",
          "visualization": "viz.line",
          "nrql": "SELECT count(*) FROM CheckIn TIMESERIES"
        }
      ]
    }
  ]
}
```

## Implementation Details

### Phase 1: APM Setup (Day 1)
1. Install New Relic/Datadog agent
2. Configure application monitoring
3. Set up distributed tracing
4. Test basic metrics collection
5. Verify data in dashboard

### Phase 2: Custom Metrics (Day 2)
1. Implement custom business metrics
2. Add database monitoring
3. Set up API endpoint tracking
4. Create custom events
5. Test metrics accuracy

### Phase 3: Alerts & Dashboards (Day 3)
1. Configure alert conditions
2. Set up notification channels
3. Create custom dashboards
4. Test alert triggers
5. Document alert responses

### File Structure
```
/lib/monitoring/
├── newrelic.config.js
├── metrics.service.ts
├── performance.middleware.ts
└── types.ts

/terraform/
├── newrelic-alerts.tf
├── dashboards.tf
└── variables.tf

/docs/
├── monitoring-guide.md
├── alert-runbook.md
└── dashboard-guide.md
```

## Dependencies
- Infrastructure: New Relic/Datadog account
- Related: QA-007 (Error Tracking)

## Testing Checklist

### Monitoring Setup
- [ ] Agent installed correctly
- [ ] Metrics being collected
- [ ] Dashboards displaying data
- [ ] Alerts configured
- [ ] Notifications working

### Performance
- [ ] Response times tracked
- [ ] Database queries monitored
- [ ] External calls tracked
- [ ] User experience measured
- [ ] Business metrics collected

### Alerts
- [ ] Alerts trigger correctly
- [ ] Notifications delivered
- [ ] No false positives
- [ ] Alert fatigue avoided
- [ ] Runbooks documented

## Performance Targets
- Application response time: < 500ms avg
- Database query time: < 100ms avg
- API endpoint latency: < 1s (95th percentile)
- Error rate: < 1%
- Apdex score: > 0.9

## Success Metrics
- Mean time to detect (MTTD): < 5 minutes
- Mean time to resolve (MTTR): < 30 minutes
- Alert accuracy: > 95%
- Dashboard uptime: > 99.9%
- Monitoring coverage: 100% of critical paths

## Additional Resources
- [New Relic Documentation](https://docs.newrelic.com/)
- [Datadog Documentation](https://docs.datadoghq.com/)
- [APM Best Practices](https://newrelic.com/blog/best-practices/apm-best-practices)

## Notes
- Start with basic monitoring, expand gradually
- Focus on actionable alerts, not noise
- Create runbooks for each alert type
- Review and tune alerts regularly
- Share dashboards with entire team