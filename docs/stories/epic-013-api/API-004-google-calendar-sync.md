# API-004: Google Calendar Sync

**Epic:** EPIC-013 - API & Developer Tools
**Story Points:** 3
**Priority:** Medium
**Status:** To Do

## User Story

**As an** event organizer
**I want** to sync my events with Google Calendar
**So that** my events appear in my calendar and I can manage them in one place

## Description

Implement two-way synchronization with Google Calendar API, allowing users to automatically add events to their calendar, receive updates when events change, and optionally sync calendar events back to the platform. This integration enhances user experience by keeping calendars synchronized across platforms.

## Acceptance Criteria

### 1. Google OAuth Integration
- [ ] Google OAuth 2.0 consent flow implementation
- [ ] Request calendar.events scope permission
- [ ] Store and refresh access tokens securely
- [ ] Handle authorization expiration gracefully
- [ ] Disconnect/revoke calendar access option

### 2. Event to Calendar Sync (One-Way)
- [ ] Automatically create Google Calendar events when event is published
- [ ] Update calendar events when event details change
- [ ] Delete calendar events when event is cancelled
- [ ] Add event location with map link
- [ ] Include event description and details
- [ ] Set reminders (1 day before, 1 hour before)
- [ ] Add organizer information

### 3. Calendar Selection
- [ ] List user's Google Calendars
- [ ] Allow user to choose which calendar to sync to
- [ ] Support syncing to multiple calendars
- [ ] Default to primary calendar
- [ ] Remember calendar selection per user

### 4. Two-Way Sync (Optional)
- [ ] Import calendar events to create platform events
- [ ] Sync time/date changes from calendar to platform
- [ ] Conflict resolution when changes occur in both places
- [ ] Sync status updates (cancelled, rescheduled)
- [ ] Batch sync for existing events

### 5. Sync Settings & Controls
- [ ] Enable/disable calendar sync per event
- [ ] Global sync settings in user preferences
- [ ] Choose which event types to sync
- [ ] Notification preferences for sync status
- [ ] Manual sync trigger option
- [ ] View sync history and status

### 6. Event Attendees Sync (Advanced)
- [ ] Add ticket purchasers as calendar attendees
- [ ] Send calendar invites to attendees
- [ ] Update attendee status from check-ins
- [ ] Sync RSVP status back to platform
- [ ] Handle attendee limit (max 1,000 per event)

## Technical Requirements

### Google Calendar API Setup
```typescript
// lib/integrations/google-calendar.config.ts
export const googleCalendarConfig = {
  clientId: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  redirectUri: `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/google/callback`,
  scopes: [
    'https://www.googleapis.com/auth/calendar.events',
    'https://www.googleapis.com/auth/userinfo.email',
  ],
};
```

### OAuth Flow Implementation
```typescript
// lib/integrations/google-calendar.service.ts
import { google } from 'googleapis';

class GoogleCalendarService {
  private oauth2Client;

  constructor() {
    this.oauth2Client = new google.auth.OAuth2(
      googleCalendarConfig.clientId,
      googleCalendarConfig.clientSecret,
      googleCalendarConfig.redirectUri
    );
  }

  getAuthUrl(userId: string): string {
    const state = this.encryptState({ userId, timestamp: Date.now() });

    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: googleCalendarConfig.scopes,
      state,
      prompt: 'consent', // Force consent to get refresh token
    });
  }

  async handleCallback(code: string): Promise<GoogleTokens> {
    const { tokens } = await this.oauth2Client.getToken(code);
    this.oauth2Client.setCredentials(tokens);

    return {
      accessToken: tokens.access_token!,
      refreshToken: tokens.refresh_token!,
      expiryDate: tokens.expiry_date!,
    };
  }

  async refreshAccessToken(refreshToken: string): Promise<string> {
    this.oauth2Client.setCredentials({ refresh_token: refreshToken });
    const { credentials } = await this.oauth2Client.refreshAccessToken();
    return credentials.access_token!;
  }
}
```

### Create Calendar Event
```typescript
async createCalendarEvent(
  event: Event,
  accessToken: string,
  calendarId: string = 'primary'
): Promise<string> {
  this.oauth2Client.setCredentials({ access_token: accessToken });
  const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });

  const calendarEvent = {
    summary: event.title,
    description: this.formatDescription(event),
    location: event.location,
    start: {
      dateTime: event.startDate.toISOString(),
      timeZone: event.timezone || 'America/New_York',
    },
    end: {
      dateTime: event.endDate.toISOString(),
      timeZone: event.timezone || 'America/New_York',
    },
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'email', minutes: 24 * 60 },
        { method: 'popup', minutes: 60 },
      ],
    },
    source: {
      title: 'Events SteppersLife',
      url: `${process.env.NEXT_PUBLIC_APP_URL}/events/${event.id}`,
    },
  };

  const response = await calendar.events.insert({
    calendarId,
    requestBody: calendarEvent,
    sendUpdates: 'none', // Don't send email notifications
  });

  return response.data.id!;
}

private formatDescription(event: Event): string {
  return `
${event.description}

Event Details:
- Organizer: ${event.organizer.name}
- Capacity: ${event.capacity} attendees
- Status: ${event.status}

View full event: ${process.env.NEXT_PUBLIC_APP_URL}/events/${event.id}
  `.trim();
}
```

### Update Calendar Event
```typescript
async updateCalendarEvent(
  event: Event,
  calendarEventId: string,
  accessToken: string,
  calendarId: string = 'primary'
): Promise<void> {
  this.oauth2Client.setCredentials({ access_token: accessToken });
  const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });

  await calendar.events.patch({
    calendarId,
    eventId: calendarEventId,
    requestBody: {
      summary: event.title,
      description: this.formatDescription(event),
      location: event.location,
      start: {
        dateTime: event.startDate.toISOString(),
        timeZone: event.timezone,
      },
      end: {
        dateTime: event.endDate.toISOString(),
        timeZone: event.timezone,
      },
    },
    sendUpdates: 'all', // Notify attendees of changes
  });
}
```

### Delete Calendar Event
```typescript
async deleteCalendarEvent(
  calendarEventId: string,
  accessToken: string,
  calendarId: string = 'primary'
): Promise<void> {
  this.oauth2Client.setCredentials({ access_token: accessToken });
  const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });

  await calendar.events.delete({
    calendarId,
    eventId: calendarEventId,
    sendUpdates: 'all', // Notify attendees of cancellation
  });
}
```

### List User Calendars
```typescript
async listCalendars(accessToken: string): Promise<CalendarInfo[]> {
  this.oauth2Client.setCredentials({ access_token: accessToken });
  const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });

  const response = await calendar.calendarList.list();

  return response.data.items?.map(cal => ({
    id: cal.id!,
    name: cal.summary!,
    isPrimary: cal.primary || false,
    color: cal.backgroundColor,
    accessRole: cal.accessRole!,
  })) || [];
}
```

### Database Schema
```prisma
model CalendarIntegration {
  id                String   @id @default(cuid())
  userId            String   @unique
  provider          String   @default("google")
  accessToken       String   @db.Text
  refreshToken      String   @db.Text
  expiryDate        DateTime
  calendarId        String   @default("primary")
  isEnabled         Boolean  @default(true)
  syncAttendees     Boolean  @default(false)
  lastSyncAt        DateTime?
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  user              User     @relation(fields: [userId], references: [id])
  syncedEvents      CalendarEventSync[]

  @@index([userId])
}

model CalendarEventSync {
  id                String   @id @default(cuid())
  eventId           String
  integrationId     String
  calendarEventId   String
  lastSyncedAt      DateTime @default(now())
  syncStatus        String   @default("synced") // synced, error, deleted
  errorMessage      String?

  event             Event    @relation(fields: [eventId], references: [id])
  integration       CalendarIntegration @relation(fields: [integrationId], references: [id])

  @@unique([eventId, integrationId])
  @@index([eventId])
  @@index([integrationId])
}
```

### Automatic Sync on Event Changes
```typescript
// lib/integrations/calendar-sync-handler.ts
export async function syncEventToCalendar(
  eventId: string,
  action: 'create' | 'update' | 'delete'
) {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: { organizer: true },
  });

  const integration = await prisma.calendarIntegration.findUnique({
    where: { userId: event.organizerId },
  });

  if (!integration?.isEnabled) {
    return; // Sync not enabled
  }

  const calendarService = new GoogleCalendarService();

  try {
    if (action === 'create') {
      const calendarEventId = await calendarService.createCalendarEvent(
        event,
        integration.accessToken,
        integration.calendarId
      );

      await prisma.calendarEventSync.create({
        data: {
          eventId: event.id,
          integrationId: integration.id,
          calendarEventId,
          syncStatus: 'synced',
        },
      });
    } else if (action === 'update') {
      const sync = await prisma.calendarEventSync.findUnique({
        where: { eventId_integrationId: { eventId, integrationId: integration.id } },
      });

      if (sync) {
        await calendarService.updateCalendarEvent(
          event,
          sync.calendarEventId,
          integration.accessToken,
          integration.calendarId
        );

        await prisma.calendarEventSync.update({
          where: { id: sync.id },
          data: { lastSyncedAt: new Date(), syncStatus: 'synced' },
        });
      }
    } else if (action === 'delete') {
      const sync = await prisma.calendarEventSync.findUnique({
        where: { eventId_integrationId: { eventId, integrationId: integration.id } },
      });

      if (sync) {
        await calendarService.deleteCalendarEvent(
          sync.calendarEventId,
          integration.accessToken,
          integration.calendarId
        );

        await prisma.calendarEventSync.update({
          where: { id: sync.id },
          data: { syncStatus: 'deleted' },
        });
      }
    }
  } catch (error) {
    console.error('Calendar sync error:', error);

    await prisma.calendarEventSync.updateMany({
      where: { eventId },
      data: {
        syncStatus: 'error',
        errorMessage: error.message,
      },
    });
  }
}
```

## Implementation Details

### Phase 1: OAuth & Basic Integration (Day 1)
1. Set up Google Cloud project and credentials
2. Implement OAuth 2.0 flow
3. Create token storage and refresh logic
4. Build calendar connection UI
5. Test authorization flow

### Phase 2: Event Sync (Day 2)
1. Implement create calendar event
2. Implement update calendar event
3. Implement delete calendar event
4. Add sync status tracking
5. Test sync operations

### Phase 3: Settings & Controls (Day 3)
1. Build calendar selection UI
2. Create sync settings page
3. Add enable/disable toggle
4. Implement sync history view
5. Test all UI components

### File Structure
```
/lib/integrations/
├── google-calendar.config.ts
├── google-calendar.service.ts
├── calendar-sync-handler.ts
└── types.ts

/app/api/integrations/
├── google/
│   ├── connect/route.ts
│   ├── callback/route.ts
│   ├── disconnect/route.ts
│   └── calendars/route.ts

/app/dashboard/settings/
├── integrations/
│   ├── page.tsx
│   ├── components/
│   │   ├── GoogleCalendarConnect.tsx
│   │   ├── CalendarSettings.tsx
│   │   └── SyncHistory.tsx
```

## Dependencies
- Related: API-005 (API Authentication Keys)
- Integrates: Event CRUD operations

## Testing Checklist

### OAuth Flow
- [ ] Authorization URL generates correctly
- [ ] Callback handles tokens correctly
- [ ] Refresh token works
- [ ] Disconnect revokes access
- [ ] Error handling for expired tokens

### Event Sync
- [ ] Create event syncs to calendar
- [ ] Update event updates calendar
- [ ] Delete event removes from calendar
- [ ] Sync status is tracked correctly
- [ ] Errors are handled gracefully

### Calendar Selection
- [ ] List calendars works
- [ ] User can select calendar
- [ ] Selection is saved correctly
- [ ] Multiple calendars supported

## Performance Metrics
- OAuth flow completion time: < 10 seconds
- Calendar sync latency: < 3 seconds
- Token refresh time: < 2 seconds

## Success Metrics
- Calendar sync adoption: > 40% of organizers
- Sync success rate: > 95%
- User satisfaction: > 4.5/5

## Additional Resources
- [Google Calendar API](https://developers.google.com/calendar/api/guides/overview)
- [OAuth 2.0 for Google APIs](https://developers.google.com/identity/protocols/oauth2)
- [googleapis npm package](https://github.com/googleapis/google-api-nodejs-client)

## Notes
- Consider adding Outlook Calendar integration later
- Rate limit: 1,000,000 queries per day (should be sufficient)
- Store refresh tokens securely (encrypted at rest)
- Handle timezone conversions carefully