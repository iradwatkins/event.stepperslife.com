# API-008: Developer Dashboard

**Epic:** EPIC-013 - API & Developer Tools
**Story Points:** 5
**Priority:** Medium
**Status:** To Do

## User Story

**As a** third-party developer
**I want** a comprehensive developer portal
**So that** I can manage API keys, webhooks, view documentation, and monitor my API usage

## Description

Create a dedicated developer dashboard that serves as the central hub for API integration. The dashboard should provide API key management, webhook configuration, real-time usage statistics, documentation access, code examples, and debugging tools. This portal enhances the developer experience and reduces support burden.

## Acceptance Criteria

### 1. Dashboard Overview
- [ ] Welcome screen with getting started guide
- [ ] Quick stats (API calls today, active keys, webhooks)
- [ ] Recent API activity timeline
- [ ] Quick links to documentation and support
- [ ] Status indicator for API health
- [ ] Latest API changelog entries

### 2. API Keys Management
- [ ] List all API keys with status and last used
- [ ] Create new API keys with custom permissions
- [ ] View API key details (scopes, usage, metadata)
- [ ] Edit API key name and scopes
- [ ] Revoke keys immediately
- [ ] Rotate keys with one click
- [ ] Copy key to clipboard (with confirmation)
- [ ] Test API key with sample request

### 3. Webhook Management
- [ ] List all registered webhooks
- [ ] Add new webhook endpoints
- [ ] Configure webhook event types
- [ ] View webhook delivery history
- [ ] Retry failed webhook deliveries
- [ ] Test webhook with sample payload
- [ ] View webhook signatures for verification
- [ ] Enable/disable webhooks

### 4. Usage Analytics & Monitoring
- [ ] Real-time API call counter (today, this month)
- [ ] Usage graphs (requests over time)
- [ ] Endpoint usage breakdown
- [ ] Response time charts
- [ ] Error rate tracking
- [ ] Rate limit progress bars
- [ ] Geographic usage map
- [ ] Top endpoints by volume

### 5. Request Logs & Debugging
- [ ] View recent API requests (last 100)
- [ ] Filter logs by endpoint, status code, date
- [ ] Inspect request/response details
- [ ] View error messages and stack traces
- [ ] Export logs to CSV
- [ ] Request replay functionality
- [ ] cURL command generator
- [ ] Postman collection export

### 6. Documentation & Resources
- [ ] Embedded API reference documentation
- [ ] Interactive API explorer (try endpoints)
- [ ] Code examples in multiple languages
- [ ] Integration tutorials and guides
- [ ] SDK downloads and installation guides
- [ ] Common errors and solutions
- [ ] API changelog and versioning info
- [ ] FAQ and troubleshooting section

### 7. Account & Settings
- [ ] Manage developer profile
- [ ] Set notification preferences
- [ ] Configure alert thresholds
- [ ] Manage team members (if applicable)
- [ ] Billing and subscription info
- [ ] Support ticket submission
- [ ] Feedback and feature requests

## Technical Requirements

### Dashboard Layout Structure
```typescript
// app/dashboard/developer/layout.tsx
export default function DeveloperLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <DeveloperSidebar />

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-gray-50">
        <DeveloperHeader />
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
```

### Dashboard Overview Component
```typescript
// app/dashboard/developer/page.tsx
export default async function DeveloperDashboard() {
  const session = await getServerSession(authOptions);
  const stats = await getDeveloperStats(session.user.id);

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold mb-2">Welcome to the Developer Portal</h1>
        <p className="text-gray-600 mb-4">
          Manage your API keys, webhooks, and monitor your integration.
        </p>
        <div className="flex gap-3">
          <Button asChild>
            <Link href="/dashboard/developer/quickstart">
              <Rocket className="mr-2 h-4 w-4" />
              Quick Start Guide
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/api/docs">
              <BookOpen className="mr-2 h-4 w-4" />
              View Documentation
            </Link>
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          title="API Calls Today"
          value={stats.callsToday.toLocaleString()}
          icon={Activity}
          trend={stats.callsTodayTrend}
        />
        <StatCard
          title="Active API Keys"
          value={stats.activeKeys}
          icon={Key}
        />
        <StatCard
          title="Active Webhooks"
          value={stats.activeWebhooks}
          icon={Webhook}
        />
        <StatCard
          title="Success Rate"
          value={`${stats.successRate}%`}
          icon={CheckCircle}
          variant={stats.successRate < 95 ? 'warning' : 'success'}
        />
      </div>

      {/* Usage Chart */}
      <Card>
        <CardHeader>
          <CardTitle>API Usage (Last 30 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          <UsageChart data={stats.usage30Days} />
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent API Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <RecentRequestsList requests={stats.recentRequests} />
            <Button variant="link" className="mt-4" asChild>
              <Link href="/dashboard/developer/logs">View All Logs →</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Webhook Deliveries</CardTitle>
          </CardHeader>
          <CardContent>
            <WebhookDeliveriesList deliveries={stats.recentWebhooks} />
            <Button variant="link" className="mt-4" asChild>
              <Link href="/dashboard/developer/webhooks">Manage Webhooks →</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Getting Started Checklist */}
      {!stats.hasCompletedSetup && (
        <Card>
          <CardHeader>
            <CardTitle>Getting Started Checklist</CardTitle>
          </CardHeader>
          <CardContent>
            <GettingStartedChecklist
              steps={[
                { label: 'Create your first API key', completed: stats.hasApiKey },
                { label: 'Make your first API request', completed: stats.hasMadeRequest },
                { label: 'Set up a webhook', completed: stats.hasWebhook },
                { label: 'Read the documentation', completed: false },
              ]}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
```

### API Keys Management Page
```typescript
// app/dashboard/developer/api-keys/page.tsx
export default function ApiKeysPage() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">API Keys</h1>
          <p className="text-gray-600">Manage your API authentication keys</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create API Key
        </Button>
      </div>

      {/* API Keys List */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Key</TableHead>
              <TableHead>Environment</TableHead>
              <TableHead>Last Used</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {keys.map(key => (
              <TableRow key={key.id}>
                <TableCell>
                  <div>
                    <div className="font-medium">{key.name || 'Unnamed Key'}</div>
                    <div className="text-sm text-gray-500">
                      Created {formatDate(key.createdAt)}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <code className="px-2 py-1 bg-gray-100 rounded text-sm">
                    {key.keyPrefix}...
                  </code>
                </TableCell>
                <TableCell>
                  <Badge variant={key.environment === 'live' ? 'default' : 'secondary'}>
                    {key.environment}
                  </Badge>
                </TableCell>
                <TableCell>
                  {key.lastUsedAt ? formatRelativeTime(key.lastUsedAt) : 'Never'}
                </TableCell>
                <TableCell>
                  <Badge variant={key.status === 'active' ? 'success' : 'destructive'}>
                    {key.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => viewKey(key)}>
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => testKey(key)}>
                        Test Key
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => rotateKey(key)}>
                        Rotate Key
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => revokeKey(key)}
                        className="text-red-600"
                      >
                        Revoke Key
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* Create API Key Modal */}
      <CreateApiKeyModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreated={newKey => {
          setKeys([...keys, newKey]);
          setShowCreateModal(false);
        }}
      />
    </div>
  );
}
```

### Request Logs Page
```typescript
// app/dashboard/developer/logs/page.tsx
export default function RequestLogsPage() {
  const [logs, setLogs] = useState<ApiRequestLog[]>([]);
  const [filters, setFilters] = useState({
    endpoint: '',
    status: '',
    startDate: null,
    endDate: null,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Request Logs</h1>
        <p className="text-gray-600">View and debug your API requests</p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-4 gap-4">
            <Input
              placeholder="Filter by endpoint..."
              value={filters.endpoint}
              onChange={e => setFilters({ ...filters, endpoint: e.target.value })}
            />
            <Select
              value={filters.status}
              onValueChange={status => setFilters({ ...filters, status })}
            >
              <SelectTrigger>
                <SelectValue placeholder="All status codes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All</SelectItem>
                <SelectItem value="2xx">2xx (Success)</SelectItem>
                <SelectItem value="4xx">4xx (Client Error)</SelectItem>
                <SelectItem value="5xx">5xx (Server Error)</SelectItem>
              </SelectContent>
            </Select>
            <DateRangePicker
              value={{ start: filters.startDate, end: filters.endDate }}
              onChange={({ start, end }) =>
                setFilters({ ...filters, startDate: start, endDate: end })
              }
            />
            <Button onClick={() => exportLogs(filters)}>
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Timestamp</TableHead>
              <TableHead>Method</TableHead>
              <TableHead>Endpoint</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Response Time</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.map(log => (
              <TableRow key={log.id}>
                <TableCell>{formatDateTime(log.timestamp)}</TableCell>
                <TableCell>
                  <Badge variant="outline">{log.method}</Badge>
                </TableCell>
                <TableCell>
                  <code className="text-sm">{log.endpoint}</code>
                </TableCell>
                <TableCell>
                  <StatusCodeBadge statusCode={log.statusCode} />
                </TableCell>
                <TableCell>{log.responseTime}ms</TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => viewLogDetails(log)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
```

### Interactive API Explorer
```typescript
// app/dashboard/developer/api-explorer/page.tsx
export default function ApiExplorerPage() {
  const [selectedEndpoint, setSelectedEndpoint] = useState<ApiEndpoint | null>(null);
  const [requestBody, setRequestBody] = useState('{}');
  const [response, setResponse] = useState<ApiResponse | null>(null);

  const executeRequest = async () => {
    const result = await fetch(selectedEndpoint.path, {
      method: selectedEndpoint.method,
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': selectedApiKey,
      },
      body: requestBody,
    });

    setResponse({
      status: result.status,
      headers: Object.fromEntries(result.headers),
      body: await result.json(),
    });
  };

  return (
    <div className="grid grid-cols-3 gap-6 h-[calc(100vh-8rem)]">
      {/* Endpoints List */}
      <Card className="col-span-1">
        <CardHeader>
          <CardTitle>Endpoints</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {endpoints.map(endpoint => (
            <button
              key={endpoint.id}
              className="w-full text-left p-3 rounded hover:bg-gray-100"
              onClick={() => setSelectedEndpoint(endpoint)}
            >
              <div className="flex items-center gap-2">
                <MethodBadge method={endpoint.method} />
                <span className="text-sm font-mono">{endpoint.path}</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">{endpoint.description}</p>
            </button>
          ))}
        </CardContent>
      </Card>

      {/* Request Builder */}
      <Card className="col-span-2">
        {selectedEndpoint ? (
          <>
            <CardHeader>
              <div className="flex items-center gap-2">
                <MethodBadge method={selectedEndpoint.method} />
                <code className="text-sm">{selectedEndpoint.path}</code>
              </div>
              <p className="text-sm text-gray-600 mt-2">
                {selectedEndpoint.description}
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Request Body */}
              <div>
                <Label>Request Body</Label>
                <Textarea
                  value={requestBody}
                  onChange={e => setRequestBody(e.target.value)}
                  className="font-mono text-sm"
                  rows={10}
                />
              </div>

              {/* Execute Button */}
              <Button onClick={executeRequest} className="w-full">
                <Play className="mr-2 h-4 w-4" />
                Send Request
              </Button>

              {/* Response */}
              {response && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Response</Label>
                    <StatusCodeBadge statusCode={response.status} />
                  </div>
                  <pre className="bg-gray-900 text-gray-100 p-4 rounded text-sm overflow-auto max-h-96">
                    {JSON.stringify(response.body, null, 2)}
                  </pre>
                </div>
              )}
            </CardContent>
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            Select an endpoint to get started
          </div>
        )}
      </Card>
    </div>
  );
}
```

## Implementation Details

### Phase 1: Core Dashboard (Day 1-2)
1. Create dashboard layout and navigation
2. Build overview page with stats
3. Implement API keys management
4. Add webhook management interface
5. Test all CRUD operations

### Phase 2: Analytics & Monitoring (Day 3-4)
1. Build usage analytics charts
2. Create request logs viewer
3. Add filtering and search
4. Implement export functionality
5. Test performance with large datasets

### Phase 3: Documentation & Tools (Day 4-5)
1. Embed API documentation
2. Build interactive API explorer
3. Add code examples generator
4. Create debugging tools
5. Test all interactive features

### File Structure
```
/app/dashboard/developer/
├── layout.tsx
├── page.tsx                    # Overview
├── api-keys/
│   ├── page.tsx
│   ├── [keyId]/page.tsx
│   └── components/
├── webhooks/
│   ├── page.tsx
│   ├── [webhookId]/page.tsx
│   └── components/
├── logs/
│   ├── page.tsx
│   └── components/
├── analytics/
│   ├── page.tsx
│   └── components/
├── api-explorer/
│   ├── page.tsx
│   └── components/
└── components/
    ├── DeveloperSidebar.tsx
    ├── DeveloperHeader.tsx
    ├── UsageChart.tsx
    └── StatCard.tsx
```

## Dependencies
- Prior: API-001, API-002, API-005, API-006, API-007
- Integrates: All API & Developer Tools stories

## Testing Checklist

### Dashboard
- [ ] Overview displays correct stats
- [ ] Navigation works correctly
- [ ] Real-time updates function
- [ ] Mobile responsive

### API Keys
- [ ] Create/edit/delete keys works
- [ ] Key rotation functions correctly
- [ ] Test key feature works
- [ ] Permissions are enforced

### Webhooks
- [ ] Add/edit/delete webhooks works
- [ ] Test webhook sends correctly
- [ ] Delivery history displays
- [ ] Retry functionality works

### Logs & Analytics
- [ ] Logs display correctly
- [ ] Filters work properly
- [ ] Export functionality works
- [ ] Charts render correctly

### API Explorer
- [ ] Endpoints load correctly
- [ ] Requests execute successfully
- [ ] Responses display properly
- [ ] Code examples work

## Performance Metrics
- Dashboard load time: < 2 seconds
- Charts render time: < 1 second
- Logs query time: < 500ms
- Real-time updates: < 5 seconds

## Success Metrics
- Developer portal adoption: > 70% of API users
- Time to first API call: < 10 minutes
- Support tickets reduction: > 30%
- Developer satisfaction: > 4.5/5
- Monthly active developers: > 100

## Additional Resources
- [Stripe Developer Dashboard](https://dashboard.stripe.com/developers)
- [Twilio Console](https://www.twilio.com/console)
- [GitHub Developer Settings](https://github.com/settings/developers)

## Notes
- Consider adding team collaboration features (invite team members)
- Add ability to save and share API requests (like Postman)
- Implement code snippet generator for multiple languages
- Add sandbox environment for testing without affecting production
- Consider adding API playground with sample data