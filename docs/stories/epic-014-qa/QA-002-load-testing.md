# QA-002: Load Testing

**Epic:** EPIC-014 - QA & Testing
**Story Points:** 5
**Priority:** High
**Status:** To Do

## User Story

**As a** platform engineer
**I want** comprehensive load testing infrastructure
**So that** I can ensure the platform performs well under high concurrent user loads

## Description

Implement load testing infrastructure using k6 or Artillery to simulate realistic user loads and identify performance bottlenecks. Tests should cover critical scenarios like event browsing, ticket purchasing, and check-ins under various load conditions to ensure the platform can handle target traffic volumes.

## Acceptance Criteria

### 1. Load Testing Infrastructure
- [ ] k6 or Artillery installed and configured
- [ ] Test scenarios defined for critical paths
- [ ] Load testing environment setup (staging/production-like)
- [ ] Metrics collection and reporting
- [ ] Integration with monitoring tools
- [ ] Automated execution schedule

### 2. Performance Targets
- [ ] **10,000 concurrent users** supported
- [ ] **< 2 seconds** average response time under load
- [ ] **< 5 seconds** 95th percentile response time
- [ ] **< 1% error rate** under normal load
- [ ] **< 5% error rate** at peak load
- [ ] **Database connections** remain stable

### 3. Test Scenarios

#### Scenario 1: Event Browsing Load (40% of traffic)
- [ ] Browse homepage
- [ ] Search events
- [ ] View event details
- [ ] Filter events by criteria
- [ ] Target: 4,000 concurrent users

#### Scenario 2: Ticket Purchase Flow (30% of traffic)
- [ ] View event details
- [ ] Add tickets to cart
- [ ] Proceed to checkout
- [ ] Complete payment
- [ ] Target: 3,000 concurrent users

#### Scenario 3: Check-In Operations (20% of traffic)
- [ ] Organizer login
- [ ] Scan QR codes
- [ ] View attendee list
- [ ] Target: 2,000 concurrent users

#### Scenario 4: API Requests (10% of traffic)
- [ ] Public event API calls
- [ ] Authenticated API requests
- [ ] Webhook deliveries
- [ ] Target: 1,000 concurrent users

### 4. Load Patterns
- [ ] **Baseline Load:** 1,000 users (steady state)
- [ ] **Ramp-up Test:** 0 to 10,000 users over 10 minutes
- [ ] **Stress Test:** 15,000 users (150% capacity)
- [ ] **Spike Test:** Sudden spike to 20,000 users
- [ ] **Soak Test:** 5,000 users for 4 hours (endurance)
- [ ] **Breakpoint Test:** Increase until system breaks

### 5. Metrics & Monitoring
- [ ] Response time percentiles (p50, p95, p99)
- [ ] Requests per second (RPS)
- [ ] Error rate percentage
- [ ] Database query performance
- [ ] CPU and memory utilization
- [ ] Network throughput
- [ ] Cache hit rates

### 6. Reporting & Analysis
- [ ] Real-time metrics dashboard
- [ ] Test summary reports
- [ ] Performance comparison over time
- [ ] Bottleneck identification
- [ ] Recommendations for optimization
- [ ] Automated alerts for regressions

## Technical Requirements

### k6 Load Testing Setup
```javascript
// load-tests/k6.config.js
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const purchaseDuration = new Trend('purchase_duration');

export const options = {
  stages: [
    { duration: '2m', target: 100 },   // Ramp up to 100 users
    { duration: '5m', target: 1000 },  // Ramp up to 1,000 users
    { duration: '10m', target: 5000 }, // Ramp up to 5,000 users
    { duration: '10m', target: 10000 }, // Ramp up to 10,000 users
    { duration: '5m', target: 10000 },  // Stay at 10,000 for 5 minutes
    { duration: '5m', target: 0 },      // Ramp down to 0
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000', 'p(99)<5000'], // 95% under 2s, 99% under 5s
    http_req_failed: ['rate<0.01'],                   // Error rate < 1%
    errors: ['rate<0.05'],                            // Custom error rate < 5%
  },
  ext: {
    loadimpact: {
      projectID: 3562932,
      name: 'Events SteppersLife Load Test',
    },
  },
};

export default function() {
  // Simulate different user scenarios
  const scenario = Math.random();

  if (scenario < 0.4) {
    // 40% - Event browsing
    eventBrowsing();
  } else if (scenario < 0.7) {
    // 30% - Ticket purchase
    ticketPurchase();
  } else if (scenario < 0.9) {
    // 20% - Check-in
    checkIn();
  } else {
    // 10% - API requests
    apiRequests();
  }

  sleep(Math.random() * 3 + 1); // 1-4 seconds between requests
}
```

### Event Browsing Scenario
```javascript
// load-tests/scenarios/event-browsing.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export function eventBrowsing() {
  const baseUrl = __ENV.BASE_URL || 'http://localhost:3004';

  // 1. Load homepage
  let res = http.get(`${baseUrl}/`);
  check(res, {
    'homepage status 200': (r) => r.status === 200,
    'homepage load time < 2s': (r) => r.timings.duration < 2000,
  });
  sleep(1);

  // 2. Browse events
  res = http.get(`${baseUrl}/events`);
  check(res, {
    'events page status 200': (r) => r.status === 200,
    'events load time < 2s': (r) => r.timings.duration < 2000,
  });
  sleep(2);

  // 3. Search events
  res = http.get(`${baseUrl}/api/events/search?q=dance&location=new+york`);
  check(res, {
    'search status 200': (r) => r.status === 200,
    'search returns results': (r) => JSON.parse(r.body).events.length > 0,
  });
  sleep(1);

  // 4. View event details
  const events = JSON.parse(res.body).events;
  if (events.length > 0) {
    const eventId = events[0].id;
    res = http.get(`${baseUrl}/events/${eventId}`);
    check(res, {
      'event details status 200': (r) => r.status === 200,
      'event details load time < 2s': (r) => r.timings.duration < 2000,
    });
  }
}
```

### Ticket Purchase Scenario
```javascript
// load-tests/scenarios/ticket-purchase.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export function ticketPurchase() {
  const baseUrl = __ENV.BASE_URL || 'http://localhost:3004';
  const apiKey = __ENV.API_KEY;

  // 1. Get available event
  let res = http.get(`${baseUrl}/api/events/public`);
  const events = JSON.parse(res.body).events;
  if (events.length === 0) return;

  const event = events[0];
  sleep(2);

  // 2. Add to cart
  const cartPayload = JSON.stringify({
    eventId: event.id,
    tickets: [
      { ticketTypeId: event.ticketTypes[0].id, quantity: 2 },
    ],
  });

  res = http.post(`${baseUrl}/api/cart`, cartPayload, {
    headers: { 'Content-Type': 'application/json' },
  });
  check(res, {
    'add to cart status 200': (r) => r.status === 200,
    'cart created': (r) => JSON.parse(r.body).cartId !== undefined,
  });

  const cartId = JSON.parse(res.body).cartId;
  sleep(3);

  // 3. Initiate checkout
  const checkoutPayload = JSON.stringify({
    cartId,
    customerEmail: `test${Date.now()}@example.com`,
    customerName: 'Load Test User',
    customerPhone: '555-0100',
  });

  res = http.post(`${baseUrl}/api/checkout`, checkoutPayload, {
    headers: { 'Content-Type': 'application/json' },
  });
  check(res, {
    'checkout initiated': (r) => r.status === 200,
  });

  const checkoutId = JSON.parse(res.body).checkoutId;
  sleep(2);

  // 4. Complete payment (using test card)
  const paymentPayload = JSON.stringify({
    checkoutId,
    sourceId: 'cnon:card-nonce-ok', // Square test card nonce
  });

  const startTime = Date.now();
  res = http.post(`${baseUrl}/api/events/${event.id}/purchase`, paymentPayload, {
    headers: { 'Content-Type': 'application/json' },
  });
  const duration = Date.now() - startTime;

  check(res, {
    'payment processed': (r) => r.status === 200,
    'payment time < 5s': (r) => duration < 5000,
    'order confirmed': (r) => JSON.parse(r.body).orderId !== undefined,
  });

  purchaseDuration.add(duration);
}
```

### Check-In Scenario
```javascript
// load-tests/scenarios/checkin.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export function checkIn() {
  const baseUrl = __ENV.BASE_URL || 'http://localhost:3004';
  const apiKey = __ENV.API_KEY;

  // 1. Authenticate as organizer
  const loginPayload = JSON.stringify({
    email: 'organizer@test.com',
    password: 'test123',
  });

  let res = http.post(`${baseUrl}/api/auth/login`, loginPayload, {
    headers: { 'Content-Type': 'application/json' },
  });

  const token = JSON.parse(res.body).token;
  sleep(1);

  // 2. Get event attendees
  res = http.get(`${baseUrl}/api/events/test-event-id/attendees`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  check(res, {
    'attendees loaded': (r) => r.status === 200,
  });
  sleep(1);

  // 3. Scan QR code (check-in)
  const attendees = JSON.parse(res.body).attendees;
  if (attendees.length > 0) {
    const ticketId = attendees[0].ticketId;
    const checkinPayload = JSON.stringify({
      ticketId,
      checkInTime: new Date().toISOString(),
    });

    res = http.post(`${baseUrl}/api/events/test-event-id/checkin`, checkinPayload, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });
    check(res, {
      'check-in successful': (r) => r.status === 200,
      'check-in time < 1s': (r) => r.timings.duration < 1000,
    });
  }
}
```

### Artillery Configuration
```yaml
# load-tests/artillery.yml
config:
  target: 'http://localhost:3004'
  phases:
    - duration: 300
      arrivalRate: 10
      name: 'Warm up'
    - duration: 600
      arrivalRate: 50
      name: 'Ramp up'
    - duration: 900
      arrivalRate: 200
      name: 'Sustained load'
    - duration: 300
      arrivalRate: 500
      name: 'Peak load'
  processor: './load-tests/helpers/processor.js'
  plugins:
    expect: {}
    metrics-by-endpoint:
      stripQueryString: true

scenarios:
  - name: 'Event Browsing'
    weight: 40
    flow:
      - get:
          url: '/'
          expect:
            - statusCode: 200
      - think: 2
      - get:
          url: '/events'
          expect:
            - statusCode: 200
            - contentType: 'text/html'
      - think: 3

  - name: 'Ticket Purchase'
    weight: 30
    flow:
      - post:
          url: '/api/cart'
          json:
            eventId: '{{ eventId }}'
            tickets:
              - ticketTypeId: '{{ ticketTypeId }}'
                quantity: 2
          capture:
            - json: '$.cartId'
              as: 'cartId'
      - think: 3
      - post:
          url: '/api/checkout'
          json:
            cartId: '{{ cartId }}'
            customerEmail: 'test@example.com'
            customerName: 'Test User'
      - think: 2

  - name: 'Check-In'
    weight: 20
    flow:
      - post:
          url: '/api/auth/login'
          json:
            email: 'organizer@test.com'
            password: 'test123'
          capture:
            - json: '$.token'
              as: 'token'
      - get:
          url: '/api/events/{{ eventId }}/attendees'
          headers:
            Authorization: 'Bearer {{ token }}'
      - think: 1

  - name: 'API Requests'
    weight: 10
    flow:
      - get:
          url: '/api/events/public'
          headers:
            X-API-Key: '{{ apiKey }}'
          expect:
            - statusCode: 200
      - think: 1
```

### Load Test Runner Script
```bash
#!/bin/bash
# scripts/run-load-tests.sh

echo "Starting load tests..."

# Set environment variables
export BASE_URL=${BASE_URL:-"http://localhost:3004"}
export API_KEY=${API_KEY:-"test_api_key"}

# Run k6 tests
echo "Running k6 baseline test..."
k6 run --vus 100 --duration 5m load-tests/scenarios/baseline.js

echo "Running k6 ramp-up test..."
k6 run load-tests/scenarios/ramp-up.js

echo "Running k6 stress test..."
k6 run --vus 15000 --duration 5m load-tests/scenarios/stress.js

echo "Running k6 spike test..."
k6 run load-tests/scenarios/spike.js

echo "Running k6 soak test..."
k6 run --vus 5000 --duration 4h load-tests/scenarios/soak.js

# Generate report
echo "Generating load test report..."
node scripts/generate-load-report.js

echo "Load tests completed!"
```

### CI/CD Integration
```yaml
# .github/workflows/load-tests.yml
name: Load Tests

on:
  schedule:
    - cron: '0 3 * * 0' # Run weekly on Sunday at 3 AM
  workflow_dispatch: # Allow manual trigger

jobs:
  load-test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup k6
        run: |
          sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
          echo "deb https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
          sudo apt-get update
          sudo apt-get install k6

      - name: Run load tests against staging
        run: |
          k6 run --out json=results.json load-tests/scenarios/ramp-up.js
        env:
          BASE_URL: ${{ secrets.STAGING_URL }}
          API_KEY: ${{ secrets.STAGING_API_KEY }}

      - name: Upload results
        uses: actions/upload-artifact@v3
        with:
          name: load-test-results
          path: results.json

      - name: Check thresholds
        run: |
          if grep -q '"failed":true' results.json; then
            echo "Load test failed thresholds"
            exit 1
          fi
```

## Implementation Details

### Phase 1: Setup & Configuration (Day 1-2)
1. Install k6 or Artillery
2. Set up test environment
3. Create basic test scenarios
4. Configure metrics collection
5. Test basic scenarios

### Phase 2: Scenario Development (Day 3)
1. Implement event browsing tests
2. Build ticket purchase tests
3. Create check-in tests
4. Add API request tests
5. Test all scenarios individually

### Phase 3: Load Patterns & Optimization (Day 4)
1. Implement ramp-up tests
2. Create stress tests
3. Build spike tests
4. Add soak tests
5. Optimize test performance

### Phase 4: Monitoring & Reporting (Day 5)
1. Set up metrics dashboards
2. Create test reports
3. Implement alerting
4. Document findings
5. CI/CD integration

### File Structure
```
/load-tests/
├── scenarios/
│   ├── baseline.js
│   ├── ramp-up.js
│   ├── stress.js
│   ├── spike.js
│   ├── soak.js
│   ├── event-browsing.js
│   ├── ticket-purchase.js
│   ├── checkin.js
│   └── api-requests.js
├── helpers/
│   ├── auth.js
│   ├── data-generator.js
│   └── processor.js
├── k6.config.js
├── artillery.yml
└── README.md

/scripts/
├── run-load-tests.sh
└── generate-load-report.js
```

## Dependencies
- Infrastructure: Staging environment, monitoring tools
- Related: QA-006 (Performance Monitoring)

## Testing Checklist

### Test Scenarios
- [ ] All scenarios execute successfully
- [ ] Load patterns work correctly
- [ ] Metrics are collected accurately
- [ ] Thresholds are appropriate
- [ ] Tests are repeatable

### Performance
- [ ] Response times meet targets
- [ ] Error rates are acceptable
- [ ] Database performance is stable
- [ ] System recovers from load
- [ ] No memory leaks detected

### Reporting
- [ ] Metrics dashboards work
- [ ] Reports are generated correctly
- [ ] Bottlenecks are identified
- [ ] Recommendations are actionable
- [ ] CI/CD integration works

## Performance Targets
- 10,000 concurrent users supported
- < 2s average response time
- < 5s 95th percentile response time
- < 1% error rate under normal load
- < 5% error rate at peak load

## Success Metrics
- Load test coverage: All critical paths
- Test frequency: Weekly minimum
- Mean time to identify bottleneck: < 1 hour
- Performance regression detection: 100%
- Load test execution time: < 1 hour

## Additional Resources
- [k6 Documentation](https://k6.io/docs/)
- [Artillery Documentation](https://www.artillery.io/docs)
- [Load Testing Best Practices](https://k6.io/docs/test-types/introduction/)

## Notes
- Run tests against staging environment, not production
- Coordinate with DevOps for infrastructure scaling
- Monitor database and cache performance during tests
- Consider using k6 Cloud for distributed load testing
- Document baseline performance metrics for comparison