# API-003: Zapier Integration

**Epic:** EPIC-013 - API & Developer Tools
**Story Points:** 5
**Priority:** Medium
**Status:** To Do

## User Story

**As an** event organizer
**I want** to connect Events SteppersLife with other apps through Zapier
**So that** I can automate workflows and integrate with my existing tools

## Description

Build a Zapier integration app that allows users to connect Events SteppersLife with 5,000+ apps in the Zapier ecosystem. The integration should support triggers (when something happens), actions (do something), and searches (find data) to enable powerful workflow automation.

## Acceptance Criteria

### 1. Zapier App Setup & Authentication
- [ ] Zapier CLI integration configured
- [ ] OAuth 2.0 authentication flow implemented
- [ ] API key authentication as fallback option
- [ ] Connection testing and validation
- [ ] Clear setup instructions in Zapier app directory
- [ ] Branded app icon and description

### 2. Triggers (When This Happens)
- [ ] **New Event Created** - Triggers when a new event is published
- [ ] **New Ticket Purchase** - Triggers when someone buys tickets
- [ ] **New Attendee Check-In** - Triggers when attendee checks in
- [ ] **Event Updated** - Triggers when event details change
- [ ] **Event Cancelled** - Triggers when event is cancelled
- [ ] **Refund Issued** - Triggers when refund is processed
- [ ] Polling triggers with 5-15 minute intervals
- [ ] Webhook triggers for real-time updates (REST Hooks)

### 3. Actions (Do This)
- [ ] **Create Event** - Create a new event
- [ ] **Update Event** - Update existing event details
- [ ] **Create Ticket Type** - Add new ticket tier
- [ ] **Register Attendee** - Add attendee to event
- [ ] **Send Ticket Email** - Resend ticket confirmation
- [ ] **Check-In Attendee** - Mark attendee as checked in
- [ ] **Cancel Event** - Cancel an event
- [ ] Field validation and error handling

### 4. Searches (Find Data)
- [ ] **Find Event** - Search events by name, ID, or date
- [ ] **Find Attendee** - Search attendees by email or name
- [ ] **Find Order** - Look up order by ID or email
- [ ] **Find Ticket** - Search tickets by code or ID
- [ ] Return first match or create if not found (optional)

### 5. Sample Data & Testing
- [ ] Sample data for all triggers and actions
- [ ] Test mode using sandbox environment
- [ ] Zapier CLI testing suite
- [ ] Integration tests for all endpoints
- [ ] Example Zaps with popular apps

### 6. Documentation & Examples
- [ ] Setup guide with screenshots
- [ ] Common workflow examples
- [ ] Field descriptions and help text
- [ ] Error message handling guide
- [ ] Video tutorial (optional)

## Technical Requirements

### Zapier App Configuration
```javascript
// zapier-app/index.js
const { version } = require('./package.json');
const authentication = require('./authentication');
const triggers = require('./triggers');
const actions = require('./actions');
const searches = require('./searches');

module.exports = {
  version,
  platformVersion: '15.5.0',

  authentication: authentication,

  triggers: {
    [triggers.newEvent.key]: triggers.newEvent,
    [triggers.newPurchase.key]: triggers.newPurchase,
    [triggers.newCheckin.key]: triggers.newCheckin,
    [triggers.eventUpdated.key]: triggers.eventUpdated,
    [triggers.eventCancelled.key]: triggers.eventCancelled,
    [triggers.refundIssued.key]: triggers.refundIssued,
  },

  actions: {
    [actions.createEvent.key]: actions.createEvent,
    [actions.updateEvent.key]: actions.updateEvent,
    [actions.registerAttendee.key]: actions.registerAttendee,
    [actions.sendTicket.key]: actions.sendTicket,
    [actions.checkinAttendee.key]: actions.checkinAttendee,
  },

  searches: {
    [searches.findEvent.key]: searches.findEvent,
    [searches.findAttendee.key]: searches.findAttendee,
    [searches.findOrder.key]: searches.findOrder,
  },
};
```

### Authentication Implementation
```javascript
// zapier-app/authentication.js
const testAuth = async (z, bundle) => {
  const response = await z.request({
    url: 'https://api.events.stepperslife.com/v1/auth/me',
  });

  if (response.status !== 200) {
    throw new Error('Authentication failed');
  }

  return response.data;
};

module.exports = {
  type: 'custom',
  fields: [
    {
      key: 'apiKey',
      label: 'API Key',
      required: true,
      type: 'string',
      helpText: 'Get your API key from Settings > API Keys',
    },
  ],
  test: testAuth,
  connectionLabel: '{{name}} ({{email}})',
};
```

### Trigger Example: New Ticket Purchase
```javascript
// zapier-app/triggers/newPurchase.js
const perform = async (z, bundle) => {
  const response = await z.request({
    url: 'https://api.events.stepperslife.com/v1/orders',
    params: {
      limit: 100,
      since: bundle.meta.page ? bundle.meta.page : undefined,
    },
  });

  return response.data.orders;
};

const performList = async (z, bundle) => {
  // For testing, return sample data
  return [
    {
      id: 'order_123',
      eventId: 'evt_456',
      eventName: 'Summer Dance Workshop',
      customerEmail: 'john@example.com',
      customerName: 'John Doe',
      amount: 9900,
      currency: 'USD',
      status: 'completed',
      ticketCount: 2,
      createdAt: new Date().toISOString(),
    },
  ];
};

module.exports = {
  key: 'newPurchase',
  noun: 'Purchase',
  display: {
    label: 'New Ticket Purchase',
    description: 'Triggers when a new ticket purchase is completed.',
  },
  operation: {
    perform: perform,
    sample: {
      id: 'order_123',
      eventId: 'evt_456',
      eventName: 'Summer Dance Workshop',
      customerEmail: 'john@example.com',
      customerName: 'John Doe',
      amount: 9900,
      currency: 'USD',
      status: 'completed',
      ticketCount: 2,
      createdAt: '2025-01-15T10:30:00Z',
    },
    outputFields: [
      { key: 'id', label: 'Order ID', type: 'string' },
      { key: 'eventId', label: 'Event ID', type: 'string' },
      { key: 'eventName', label: 'Event Name', type: 'string' },
      { key: 'customerEmail', label: 'Customer Email', type: 'string' },
      { key: 'customerName', label: 'Customer Name', type: 'string' },
      { key: 'amount', label: 'Amount (cents)', type: 'integer' },
      { key: 'currency', label: 'Currency', type: 'string' },
      { key: 'ticketCount', label: 'Ticket Count', type: 'integer' },
    ],
  },
};
```

### Action Example: Create Event
```javascript
// zapier-app/actions/createEvent.js
const perform = async (z, bundle) => {
  const response = await z.request({
    method: 'POST',
    url: 'https://api.events.stepperslife.com/v1/events',
    body: {
      title: bundle.inputData.title,
      description: bundle.inputData.description,
      startDate: bundle.inputData.startDate,
      endDate: bundle.inputData.endDate,
      location: bundle.inputData.location,
      capacity: bundle.inputData.capacity,
      status: bundle.inputData.status || 'draft',
    },
  });

  return response.data;
};

module.exports = {
  key: 'createEvent',
  noun: 'Event',
  display: {
    label: 'Create Event',
    description: 'Creates a new event in Events SteppersLife.',
  },
  operation: {
    perform: perform,
    inputFields: [
      {
        key: 'title',
        label: 'Event Title',
        type: 'string',
        required: true,
        helpText: 'The name of your event',
      },
      {
        key: 'description',
        label: 'Description',
        type: 'text',
        required: true,
      },
      {
        key: 'startDate',
        label: 'Start Date',
        type: 'datetime',
        required: true,
      },
      {
        key: 'endDate',
        label: 'End Date',
        type: 'datetime',
        required: true,
      },
      {
        key: 'location',
        label: 'Location',
        type: 'string',
        required: true,
      },
      {
        key: 'capacity',
        label: 'Capacity',
        type: 'integer',
        required: false,
        helpText: 'Maximum number of attendees',
      },
      {
        key: 'status',
        label: 'Status',
        type: 'string',
        choices: ['draft', 'published'],
        default: 'draft',
      },
    ],
    sample: {
      id: 'evt_123',
      title: 'Summer Dance Workshop',
      status: 'published',
      startDate: '2025-07-15T18:00:00Z',
      createdAt: '2025-01-15T10:30:00Z',
    },
  },
};
```

### REST Hooks (Webhook Triggers)
```javascript
// zapier-app/triggers/newPurchaseHook.js
const subscribeHook = async (z, bundle) => {
  const response = await z.request({
    method: 'POST',
    url: 'https://api.events.stepperslife.com/v1/webhooks',
    body: {
      url: bundle.targetUrl,
      events: ['purchase.completed'],
    },
  });

  return response.data;
};

const unsubscribeHook = async (z, bundle) => {
  await z.request({
    method: 'DELETE',
    url: `https://api.events.stepperslife.com/v1/webhooks/${bundle.subscribeData.id}`,
  });
};

const perform = async (z, bundle) => {
  return [bundle.cleanedRequest];
};

module.exports = {
  key: 'newPurchaseHook',
  noun: 'Purchase',
  display: {
    label: 'New Ticket Purchase (Instant)',
    description: 'Triggers instantly when a ticket purchase is completed.',
  },
  operation: {
    type: 'hook',
    performSubscribe: subscribeHook,
    performUnsubscribe: unsubscribeHook,
    perform: perform,
    performList: performList, // Fallback for testing
    sample: {
      id: 'order_123',
      eventName: 'Summer Dance Workshop',
      customerEmail: 'john@example.com',
      amount: 9900,
    },
  },
};
```

## Implementation Details

### Phase 1: App Setup & Authentication (Day 1-2)
1. Initialize Zapier CLI project
2. Configure authentication mechanism
3. Set up API client and request handling
4. Implement connection testing
5. Deploy to Zapier platform

### Phase 2: Triggers Implementation (Day 3-4)
1. Build polling triggers for events
2. Implement REST Hook triggers
3. Add sample data for all triggers
4. Test trigger deduplication
5. Configure trigger intervals

### Phase 3: Actions & Searches (Day 5-6)
1. Implement all action operations
2. Build search functions
3. Add input field validation
4. Handle errors gracefully
5. Test all operations

### Phase 4: Testing & Publishing (Day 7-8)
1. Write integration tests
2. Test with popular Zapier apps
3. Create example Zaps
4. Write documentation
5. Submit for Zapier directory approval

### File Structure
```
/zapier-app/
├── package.json
├── index.js                  # Main app definition
├── authentication.js         # Auth configuration
├── triggers/
│   ├── newEvent.js
│   ├── newPurchase.js
│   ├── newCheckin.js
│   └── index.js
├── actions/
│   ├── createEvent.js
│   ├── registerAttendee.js
│   ├── checkinAttendee.js
│   └── index.js
├── searches/
│   ├── findEvent.js
│   ├── findAttendee.js
│   └── index.js
└── test/
    ├── triggers.test.js
    ├── actions.test.js
    └── searches.test.js
```

## Dependencies
- Prior: API-001 (API Documentation), API-002 (Webhook System)
- Related: API-005 (API Authentication)

## Testing Checklist

### Authentication
- [ ] API key authentication works
- [ ] Connection test succeeds
- [ ] Invalid credentials are rejected
- [ ] Connection label displays correctly

### Triggers
- [ ] All triggers return data correctly
- [ ] Sample data is provided
- [ ] Deduplication works (no duplicates)
- [ ] Polling triggers respect intervals
- [ ] REST Hooks subscribe/unsubscribe work

### Actions
- [ ] All actions execute successfully
- [ ] Input validation works
- [ ] Error messages are clear
- [ ] Required fields are enforced
- [ ] Sample output is accurate

### End-to-End
- [ ] Test Zaps with Gmail, Slack, Google Sheets
- [ ] Multi-step Zaps work correctly
- [ ] Filters and formatters work
- [ ] Performance is acceptable
- [ ] No rate limit issues

## Success Metrics
- Zapier app users: > 500 active users in first 6 months
- Most popular trigger: New Ticket Purchase
- Average Zaps per user: > 2
- User satisfaction: > 4.5/5
- Support ticket rate: < 5% of users

## Additional Resources
- [Zapier CLI Documentation](https://github.com/zapier/zapier-platform/tree/main/packages/cli)
- [Zapier Platform Schema](https://github.com/zapier/zapier-platform/blob/main/packages/schema/docs/build/schema.md)
- [Zapier Best Practices](https://platform.zapier.com/partners/integration-design-guide)
- [REST Hooks Guide](https://resthooks.org/)

## Notes
- Submit app to Zapier for review and public listing
- Consider Make.com (Integromat) integration after Zapier
- Plan for rate limiting to avoid API abuse
- Monitor usage to optimize polling intervals
- Create video tutorials for popular workflows