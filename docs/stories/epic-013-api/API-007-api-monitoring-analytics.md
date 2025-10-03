# API-007: API Monitoring & Analytics

**Epic:** EPIC-013 - API & Developer Tools
**Story Points:** 3
**Priority:** Medium
**Status:** To Do

## User Story

**As an** API administrator and developer
**I want** comprehensive API usage analytics and monitoring
**So that** I can track performance, identify issues, and optimize the API

## Description

Implement a comprehensive API monitoring and analytics system that tracks request patterns, performance metrics, error rates, and usage statistics. The system should provide real-time dashboards, historical reports, and alerting capabilities to ensure API health and optimal performance.

## Acceptance Criteria

### 1. Request Logging & Tracking
- [ ] Log all API requests (endpoint, method, timestamp)
- [ ] Track response times and status codes
- [ ] Record API key used for each request
- [ ] Capture request/response payload sizes
- [ ] Log error messages and stack traces
- [ ] Track geographic location of requests
- [ ] User agent and client information

### 2. Performance Metrics
- [ ] **Average response time** per endpoint
- [ ] **95th/99th percentile** response times
- [ ] **Requests per second** (RPS) tracking
- [ ] **Throughput** (requests per minute/hour/day)
- [ ] **Error rate** percentage
- [ ] **Success rate** percentage
- [ ] **Cache hit rate** (if caching enabled)

### 3. Usage Analytics
- [ ] **Most called endpoints** ranking
- [ ] **Requests by API key** breakdown
- [ ] **Requests by time of day** heatmap
- [ ] **Requests by day/week/month** trends
- [ ] **Top users** by request volume
- [ ] **Endpoint popularity** over time
- [ ] **HTTP method distribution** (GET, POST, etc.)

### 4. Error Tracking & Analysis
- [ ] Error rate by endpoint
- [ ] Error types and categories
- [ ] Error messages frequency
- [ ] Failed requests timeline
- [ ] 4xx vs 5xx error breakdown
- [ ] Error trends over time
- [ ] Error rate alerts

### 5. Real-Time Dashboard
- [ ] Live request feed (real-time updates)
- [ ] Current RPS and active requests
- [ ] Response time graphs (live updates)
- [ ] Error rate indicators
- [ ] Top endpoints (by volume)
- [ ] Geographic request map
- [ ] Recent errors list

### 6. Historical Reports
- [ ] Daily/weekly/monthly summary reports
- [ ] Custom date range queries
- [ ] Export reports to CSV/PDF
- [ ] Automated email reports
- [ ] Comparison with previous periods
- [ ] Trend analysis and predictions
- [ ] SLA compliance reports

### 7. Alerts & Notifications
- [ ] Alert on error rate threshold (>5%)
- [ ] Alert on slow response times (>2s)
- [ ] Alert on downtime or outages
- [ ] Alert on unusual traffic patterns
- [ ] Alert on rate limit violations
- [ ] Configurable alert thresholds
- [ ] Multiple notification channels (email, Slack, webhook)

## Technical Requirements

### Database Schema
```prisma
model ApiRequestLog {
  id              String   @id @default(cuid())
  apiKeyId        String?
  endpoint        String
  method          String
  statusCode      Int
  responseTime    Int      // milliseconds
  requestSize     Int?     // bytes
  responseSize    Int?     // bytes
  ipAddress       String?
  userAgent       String?
  country         String?
  errorMessage    String?
  timestamp       DateTime @default(now())

  apiKey          ApiKey?  @relation(fields: [apiKeyId], references: [id])

  @@index([apiKeyId, timestamp])
  @@index([endpoint, timestamp])
  @@index([timestamp])
  @@index([statusCode])
}

model ApiMetricsSummary {
  id              String   @id @default(cuid())
  date            DateTime @unique
  totalRequests   Int
  successRate     Float
  avgResponseTime Float
  p95ResponseTime Float
  p99ResponseTime Float
  errorRate       Float
  topEndpoint     String?
  createdAt       DateTime @default(now())

  @@index([date])
}
```

### Logging Service
```typescript
// lib/monitoring/api-logger.service.ts
export class ApiLoggerService {
  async logRequest(data: {
    apiKeyId?: string;
    endpoint: string;
    method: string;
    statusCode: number;
    responseTime: number;
    requestSize?: number;
    responseSize?: number;
    ipAddress?: string;
    userAgent?: string;
    errorMessage?: string;
  }) {
    // Log to database
    await prisma.apiRequestLog.create({ data });

    // Also send to analytics service (e.g., Mixpanel, Amplitude)
    await this.sendToAnalytics(data);

    // Update real-time metrics in Redis
    await this.updateRealtimeMetrics(data);
  }

  private async updateRealtimeMetrics(data: any) {
    const redis = new Redis(process.env.REDIS_URL);
    const now = new Date();
    const minuteKey = `metrics:${now.toISOString().slice(0, 16)}`; // Per minute

    await redis
      .pipeline()
      .hincrby(minuteKey, 'requests', 1)
      .hincrby(minuteKey, `status:${data.statusCode}`, 1)
      .hincrby(minuteKey, `endpoint:${data.endpoint}`, 1)
      .expire(minuteKey, 3600) // Keep for 1 hour
      .exec();
  }

  async getRealtimeMetrics(): Promise<RealtimeMetrics> {
    const redis = new Redis(process.env.REDIS_URL);
    const now = new Date();
    const lastMinute = `metrics:${now.toISOString().slice(0, 16)}`;

    const data = await redis.hgetall(lastMinute);

    return {
      requestsPerMinute: parseInt(data.requests || '0'),
      statusCodes: this.parseStatusCodes(data),
      topEndpoints: this.parseEndpoints(data),
    };
  }
}
```

### Analytics Service
```typescript
// lib/monitoring/analytics.service.ts
export class ApiAnalyticsService {
  async getEndpointStats(
    startDate: Date,
    endDate: Date,
    endpoint?: string
  ): Promise<EndpointStats[]> {
    const where = {
      timestamp: { gte: startDate, lte: endDate },
      ...(endpoint && { endpoint }),
    };

    const stats = await prisma.apiRequestLog.groupBy({
      by: ['endpoint'],
      where,
      _count: { id: true },
      _avg: { responseTime: true },
      _max: { responseTime: true },
    });

    return stats.map(stat => ({
      endpoint: stat.endpoint,
      totalRequests: stat._count.id,
      avgResponseTime: stat._avg.responseTime || 0,
      maxResponseTime: stat._max.responseTime || 0,
    }));
  }

  async getUsageByApiKey(
    startDate: Date,
    endDate: Date
  ): Promise<ApiKeyUsage[]> {
    const usage = await prisma.apiRequestLog.groupBy({
      by: ['apiKeyId'],
      where: {
        timestamp: { gte: startDate, lte: endDate },
        apiKeyId: { not: null },
      },
      _count: { id: true },
    });

    // Enrich with API key details
    const apiKeys = await prisma.apiKey.findMany({
      where: { id: { in: usage.map(u => u.apiKeyId!) } },
      select: { id: true, name: true, user: { select: { email: true } } },
    });

    return usage.map(u => ({
      apiKeyId: u.apiKeyId!,
      apiKeyName: apiKeys.find(k => k.id === u.apiKeyId)?.name || 'Unknown',
      userEmail: apiKeys.find(k => k.id === u.apiKeyId)?.user.email,
      totalRequests: u._count.id,
    }));
  }

  async getErrorStats(
    startDate: Date,
    endDate: Date
  ): Promise<ErrorStats> {
    const errors = await prisma.apiRequestLog.findMany({
      where: {
        timestamp: { gte: startDate, lte: endDate },
        statusCode: { gte: 400 },
      },
      select: { statusCode: true, endpoint: true, errorMessage: true },
    });

    const total = await prisma.apiRequestLog.count({
      where: { timestamp: { gte: startDate, lte: endDate } },
    });

    return {
      totalErrors: errors.length,
      errorRate: (errors.length / total) * 100,
      errorsByStatus: this.groupByStatusCode(errors),
      errorsByEndpoint: this.groupByEndpoint(errors),
      commonErrors: this.groupByMessage(errors),
    };
  }

  async getPercentileResponseTimes(
    startDate: Date,
    endDate: Date,
    endpoint?: string
  ): Promise<{ p50: number; p95: number; p99: number }> {
    const responseTimes = await prisma.$queryRaw<Array<{ responseTime: number }>>`
      SELECT responseTime
      FROM ApiRequestLog
      WHERE timestamp >= ${startDate}
        AND timestamp <= ${endDate}
        ${endpoint ? Prisma.sql`AND endpoint = ${endpoint}` : Prisma.empty}
      ORDER BY responseTime
    `;

    const times = responseTimes.map(r => r.responseTime);
    return {
      p50: this.percentile(times, 50),
      p95: this.percentile(times, 95),
      p99: this.percentile(times, 99),
    };
  }

  private percentile(arr: number[], p: number): number {
    if (arr.length === 0) return 0;
    const sorted = [...arr].sort((a, b) => a - b);
    const index = Math.ceil((p / 100) * sorted.length) - 1;
    return sorted[index];
  }
}
```

### Real-Time Dashboard Component
```typescript
// components/monitoring/ApiDashboard.tsx
export function ApiMonitoringDashboard() {
  const { data: realtimeData } = useQuery({
    queryKey: ['api-realtime'],
    queryFn: () => fetch('/api/monitoring/realtime').then(r => r.json()),
    refetchInterval: 5000, // Update every 5 seconds
  });

  const { data: stats } = useQuery({
    queryKey: ['api-stats', dateRange],
    queryFn: () =>
      fetch(`/api/monitoring/stats?start=${dateRange.start}&end=${dateRange.end}`)
        .then(r => r.json()),
  });

  return (
    <div className="space-y-6">
      {/* Real-time Metrics */}
      <div className="grid grid-cols-4 gap-4">
        <MetricCard
          title="Requests/Min"
          value={realtimeData?.requestsPerMinute || 0}
          icon={Activity}
        />
        <MetricCard
          title="Avg Response Time"
          value={`${stats?.avgResponseTime || 0}ms`}
          icon={Clock}
        />
        <MetricCard
          title="Error Rate"
          value={`${stats?.errorRate || 0}%`}
          icon={AlertTriangle}
          variant={stats?.errorRate > 5 ? 'destructive' : 'default'}
        />
        <MetricCard
          title="Success Rate"
          value={`${stats?.successRate || 0}%`}
          icon={CheckCircle}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Requests Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <RequestsChart data={stats?.timeline} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Response Time Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponseTimeChart data={stats?.responseTimes} />
          </CardContent>
        </Card>
      </div>

      {/* Top Endpoints */}
      <Card>
        <CardHeader>
          <CardTitle>Top Endpoints</CardTitle>
        </CardHeader>
        <CardContent>
          <EndpointTable endpoints={stats?.topEndpoints || []} />
        </CardContent>
      </Card>

      {/* Recent Errors */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Errors</CardTitle>
        </CardHeader>
        <CardContent>
          <ErrorList errors={stats?.recentErrors || []} />
        </CardContent>
      </Card>
    </div>
  );
}
```

### Alert System
```typescript
// lib/monitoring/alert.service.ts
export class AlertService {
  async checkAlerts() {
    const last5Minutes = new Date(Date.now() - 5 * 60 * 1000);

    // Check error rate
    const errorRate = await this.getErrorRate(last5Minutes, new Date());
    if (errorRate > 5) {
      await this.sendAlert({
        type: 'high_error_rate',
        severity: 'critical',
        message: `Error rate is ${errorRate.toFixed(2)}% (threshold: 5%)`,
        data: { errorRate },
      });
    }

    // Check slow response times
    const avgResponseTime = await this.getAvgResponseTime(last5Minutes, new Date());
    if (avgResponseTime > 2000) {
      await this.sendAlert({
        type: 'slow_response_time',
        severity: 'warning',
        message: `Average response time is ${avgResponseTime}ms (threshold: 2000ms)`,
        data: { avgResponseTime },
      });
    }

    // Check unusual traffic
    const currentRPS = await this.getCurrentRPS();
    const avgRPS = await this.getAvgRPS();
    if (currentRPS > avgRPS * 3) {
      await this.sendAlert({
        type: 'unusual_traffic',
        severity: 'warning',
        message: `Traffic spike detected: ${currentRPS} RPS (avg: ${avgRPS})`,
        data: { currentRPS, avgRPS },
      });
    }
  }

  private async sendAlert(alert: Alert) {
    // Send to multiple channels
    await Promise.all([
      this.sendEmailAlert(alert),
      this.sendSlackAlert(alert),
      this.logAlert(alert),
    ]);
  }
}
```

## Implementation Details

### Phase 1: Logging Infrastructure (Day 1)
1. Create database schema
2. Implement logging service
3. Add request/response interceptors
4. Set up Redis for real-time metrics
5. Test logging performance

### Phase 2: Analytics & Metrics (Day 2)
1. Build analytics service
2. Implement metric calculations
3. Create aggregation jobs
4. Add caching for performance
5. Test data accuracy

### Phase 3: Dashboard & Alerts (Day 3)
1. Build real-time dashboard
2. Create charts and visualizations
3. Implement alert system
4. Add notification integrations
5. Test end-to-end

### File Structure
```
/lib/monitoring/
├── api-logger.service.ts
├── analytics.service.ts
├── alert.service.ts
└── types.ts

/app/api/monitoring/
├── realtime/route.ts
├── stats/route.ts
├── endpoints/route.ts
└── errors/route.ts

/app/dashboard/monitoring/
├── page.tsx
├── components/
│   ├── ApiDashboard.tsx
│   ├── RequestsChart.tsx
│   ├── ResponseTimeChart.tsx
│   ├── EndpointTable.tsx
│   └── ErrorList.tsx
```

## Dependencies
- Prior: API-005 (API Authentication Keys)
- Related: API-006 (Rate Limiting)
- Infrastructure: Redis, Database

## Testing Checklist

### Logging
- [ ] All requests are logged
- [ ] Response times are accurate
- [ ] Error messages are captured
- [ ] No performance impact from logging

### Analytics
- [ ] Metrics are calculated correctly
- [ ] Percentiles are accurate
- [ ] Aggregations work properly
- [ ] Historical data is queryable

### Dashboard
- [ ] Real-time updates work
- [ ] Charts display correctly
- [ ] Data is accurate
- [ ] Performance is acceptable

### Alerts
- [ ] Alerts trigger correctly
- [ ] Notifications are sent
- [ ] Thresholds are configurable
- [ ] No false positives

## Performance Metrics
- Logging overhead: < 5ms per request
- Dashboard load time: < 2 seconds
- Real-time update latency: < 5 seconds
- Analytics query time: < 1 second

## Success Metrics
- Mean time to detect (MTTD): < 5 minutes
- Mean time to resolve (MTTR): < 30 minutes
- Dashboard uptime: > 99.9%
- Data accuracy: > 99.5%

## Additional Resources
- [API Monitoring Best Practices](https://www.datadoghq.com/blog/api-monitoring-best-practices/)
- [Grafana Dashboards](https://grafana.com/docs/grafana/latest/dashboards/)
- [Prometheus Metrics](https://prometheus.io/docs/practices/naming/)

## Notes
- Consider using Datadog or New Relic for advanced monitoring
- Implement log retention policies (30-90 days)
- Add ability to replay failed requests for debugging
- Consider adding API performance benchmarks
- Plan for horizontal scaling of logging infrastructure