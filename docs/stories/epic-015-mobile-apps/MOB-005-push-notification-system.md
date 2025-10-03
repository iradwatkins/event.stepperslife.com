# MOB-005: Push Notification System

**Epic:** EPIC-015 Mobile Applications
**Story Points:** 5
**Priority:** High
**Status:** Not Started

---

## User Story

**As a** mobile app user
**I want** to receive push notifications about my tickets, event updates, and promotions
**So that** I stay informed about important information and never miss an event

---

## Acceptance Criteria

### 1. Cross-Platform Push Infrastructure
- [ ] Firebase Cloud Messaging (FCM) for Android
- [ ] Apple Push Notification service (APNs) for iOS
- [ ] Unified backend notification service
- [ ] Device token management and storage
- [ ] Multi-device support per user
- [ ] Token refresh handling
- [ ] Notification delivery tracking
- [ ] Failed notification retry mechanism

### 2. Notification Types
- [ ] **Ticket Purchase Confirmation** - Immediate after purchase
- [ ] **Event Reminder** - 24 hours before event
- [ ] **Event Updates** - Venue changes, delays, cancellations
- [ ] **Check-in Reminder** - 1 hour before event start
- [ ] **Post-Event Survey** - After event completion
- [ ] **Promotional Offers** - New events, discounts
- [ ] **Order Updates** - Refund processed, ticket transferred
- [ ] **Account Activity** - Login from new device, password change

### 3. Notification Preferences
- [ ] Opt-in/opt-out for each notification type
- [ ] Quiet hours configuration (e.g., 10 PM - 8 AM)
- [ ] Frequency limits (max per day/week)
- [ ] Channel preferences (push, email, SMS)
- [ ] Event-specific preferences
- [ ] Marketing communication toggle
- [ ] Do Not Disturb mode
- [ ] Preference sync across devices

### 4. Rich Notifications
- [ ] Images in notifications (event posters)
- [ ] Action buttons (View Ticket, Directions, Share)
- [ ] Expandable notifications with full details
- [ ] Notification grouping/stacking
- [ ] Custom sounds per notification type
- [ ] Notification badges on app icon
- [ ] Progress notifications (download tickets)
- [ ] Interactive replies (confirm attendance)

### 5. Deep Linking from Notifications
- [ ] Tap notification opens relevant screen
- [ ] Handle event/:id deep links
- [ ] Handle ticket/:id deep links
- [ ] Handle order/:id deep links
- [ ] Handle promotion/:id deep links
- [ ] App launch from killed state
- [ ] App foreground from background
- [ ] Navigation state restoration

### 6. Notification Analytics
- [ ] Delivery tracking (sent, delivered, failed)
- [ ] Open rate tracking
- [ ] Click-through rate tracking
- [ ] Conversion tracking (notification → purchase)
- [ ] Time-to-open metrics
- [ ] Device-specific performance
- [ ] A/B testing support
- [ ] Notification heatmap (best send times)

### 7. Advanced Features
- [ ] Silent notifications for data sync
- [ ] Notification scheduling (send at optimal time)
- [ ] Geofence-based notifications (near venue)
- [ ] Personalized notification content
- [ ] Multi-language notification support
- [ ] Notification priority levels
- [ ] Rate limiting to prevent spam
- [ ] Notification templates with variables

### 8. Testing & Quality
- [ ] Unit tests for notification logic
- [ ] Integration tests for delivery
- [ ] Test on various devices and OS versions
- [ ] Test notification permissions flow
- [ ] Test with/without network connectivity
- [ ] Test app in killed/background/foreground states
- [ ] Delivery rate > 99%
- [ ] Average delivery time < 5 seconds

---

## Technical Specifications

### Backend Notification Service
```typescript
// lib/services/push-notification.service.ts
import { Expo } from 'expo-server-sdk';
import admin from 'firebase-admin';
import { PrismaClient } from '@prisma/client';

interface NotificationPayload {
  userId: string;
  title: string;
  body: string;
  data?: Record<string, any>;
  image?: string;
  actions?: NotificationAction[];
  priority?: 'high' | 'normal' | 'low';
  sound?: string;
  badge?: number;
}

interface NotificationAction {
  id: string;
  title: string;
  icon?: string;
}

export class PushNotificationService {
  private prisma = new PrismaClient();
  private fcm = admin.messaging();

  async sendNotification(payload: NotificationPayload): Promise<void> {
    // Get user's devices
    const devices = await this.prisma.deviceToken.findMany({
      where: { userId: payload.userId, active: true },
    });

    if (devices.length === 0) {
      console.log(`No devices found for user ${payload.userId}`);
      return;
    }

    // Check user preferences
    const canSend = await this.checkNotificationPreferences(
      payload.userId,
      payload.data?.type
    );

    if (!canSend) {
      console.log(`User ${payload.userId} opted out of this notification type`);
      return;
    }

    // Send to each device
    const promises = devices.map((device) =>
      this.sendToDevice(device.token, device.platform, payload)
    );

    const results = await Promise.allSettled(promises);

    // Track delivery
    await this.trackNotificationDelivery(payload, results);

    // Clean up invalid tokens
    await this.cleanupInvalidTokens(devices, results);
  }

  private async sendToDevice(
    token: string,
    platform: 'ios' | 'android',
    payload: NotificationPayload
  ): Promise<string> {
    const message: admin.messaging.Message = {
      token,
      notification: {
        title: payload.title,
        body: payload.body,
        imageUrl: payload.image,
      },
      data: {
        ...payload.data,
        timestamp: Date.now().toString(),
      },
      apns: platform === 'ios' ? {
        payload: {
          aps: {
            sound: payload.sound || 'default',
            badge: payload.badge,
            category: payload.data?.type,
          },
        },
      } : undefined,
      android: platform === 'android' ? {
        priority: payload.priority || 'high',
        notification: {
          channelId: payload.data?.type || 'default',
          sound: payload.sound || 'default',
          imageUrl: payload.image,
          clickAction: 'FLUTTER_NOTIFICATION_CLICK',
        },
      } : undefined,
    };

    return await this.fcm.send(message);
  }

  async sendBulkNotifications(
    userIds: string[],
    payload: Omit<NotificationPayload, 'userId'>
  ): Promise<void> {
    const batchSize = 500;
    for (let i = 0; i < userIds.length; i += batchSize) {
      const batch = userIds.slice(i, i + batchSize);
      const promises = batch.map((userId) =>
        this.sendNotification({ ...payload, userId })
      );
      await Promise.allSettled(promises);
    }
  }

  private async checkNotificationPreferences(
    userId: string,
    notificationType?: string
  ): Promise<boolean> {
    const preferences = await this.prisma.notificationPreference.findUnique({
      where: { userId },
    });

    if (!preferences) return true; // Default to enabled

    // Check quiet hours
    if (this.isQuietHours(preferences.quietHoursStart, preferences.quietHoursEnd)) {
      return false;
    }

    // Check specific notification type preference
    if (notificationType && preferences[`${notificationType}Enabled`] === false) {
      return false;
    }

    // Check daily limit
    const dailyCount = await this.getDailyNotificationCount(userId);
    if (dailyCount >= preferences.maxDailyNotifications) {
      return false;
    }

    return true;
  }

  private isQuietHours(start?: string, end?: string): boolean {
    if (!start || !end) return false;

    const now = new Date();
    const currentHour = now.getHours();
    const [startHour] = start.split(':').map(Number);
    const [endHour] = end.split(':').map(Number);

    if (startHour < endHour) {
      return currentHour >= startHour && currentHour < endHour;
    } else {
      return currentHour >= startHour || currentHour < endHour;
    }
  }

  private async getDailyNotificationCount(userId: string): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return await this.prisma.notificationLog.count({
      where: {
        userId,
        sentAt: { gte: today },
      },
    });
  }

  private async trackNotificationDelivery(
    payload: NotificationPayload,
    results: PromiseSettledResult<string>[]
  ): Promise<void> {
    const successful = results.filter((r) => r.status === 'fulfilled').length;
    const failed = results.filter((r) => r.status === 'rejected').length;

    await this.prisma.notificationLog.create({
      data: {
        userId: payload.userId,
        type: payload.data?.type || 'generic',
        title: payload.title,
        body: payload.body,
        sentAt: new Date(),
        delivered: successful,
        failed: failed,
        metadata: payload.data,
      },
    });
  }

  private async cleanupInvalidTokens(
    devices: any[],
    results: PromiseSettledResult<string>[]
  ): Promise<void> {
    const invalidTokens = results
      .map((result, index) => {
        if (result.status === 'rejected') {
          const error = result.reason;
          if (
            error.code === 'messaging/invalid-registration-token' ||
            error.code === 'messaging/registration-token-not-registered'
          ) {
            return devices[index].token;
          }
        }
        return null;
      })
      .filter((token): token is string => token !== null);

    if (invalidTokens.length > 0) {
      await this.prisma.deviceToken.updateMany({
        where: { token: { in: invalidTokens } },
        data: { active: false },
      });
    }
  }
}
```

### Notification Templates
```typescript
// lib/notifications/templates.ts
export const NotificationTemplates = {
  ticketPurchased: (eventName: string, ticketCount: number) => ({
    title: '🎉 Tickets Confirmed!',
    body: `You've successfully purchased ${ticketCount} ticket${ticketCount > 1 ? 's' : ''} for ${eventName}`,
    type: 'ticket_purchase',
    sound: 'success',
    image: undefined,
    actions: [
      { id: 'view_ticket', title: 'View Tickets' },
      { id: 'add_calendar', title: 'Add to Calendar' },
    ],
  }),

  eventReminder: (eventName: string, startTime: Date) => ({
    title: `📅 Event Tomorrow: ${eventName}`,
    body: `Don't forget! Your event starts at ${startTime.toLocaleTimeString()}`,
    type: 'event_reminder',
    sound: 'reminder',
    actions: [
      { id: 'view_ticket', title: 'View Ticket' },
      { id: 'get_directions', title: 'Get Directions' },
    ],
  }),

  checkinReminder: (eventName: string, venue: string) => ({
    title: `⏰ Check-in opens soon!`,
    body: `${eventName} at ${venue} starts in 1 hour. Get ready!`,
    type: 'checkin_reminder',
    sound: 'default',
    actions: [
      { id: 'view_qr', title: 'Show QR Code' },
      { id: 'get_directions', title: 'Directions' },
    ],
  }),

  eventUpdated: (eventName: string, updateType: string) => ({
    title: `⚠️ Event Update: ${eventName}`,
    body: `Important: ${updateType}. Tap to view details.`,
    type: 'event_update',
    priority: 'high' as const,
    sound: 'alert',
    actions: [
      { id: 'view_details', title: 'View Details' },
      { id: 'contact_support', title: 'Contact Support' },
    ],
  }),

  promotion: (title: string, discount: number) => ({
    title: `🎁 ${title}`,
    body: `Get ${discount}% off your next ticket purchase. Limited time offer!`,
    type: 'promotion',
    sound: 'default',
    actions: [
      { id: 'view_offer', title: 'View Offer' },
      { id: 'browse_events', title: 'Browse Events' },
    ],
  }),

  refundProcessed: (eventName: string, amount: number) => ({
    title: '💰 Refund Processed',
    body: `$${amount.toFixed(2)} refunded for ${eventName}. It may take 5-10 business days to appear in your account.`,
    type: 'refund',
    sound: 'default',
    actions: [
      { id: 'view_order', title: 'View Order' },
    ],
  }),
};
```

### React Native Client
```typescript
// src/services/PushNotificationClient.ts
import messaging from '@react-native-firebase/messaging';
import PushNotificationIOS from '@react-native-community/push-notification-ios';
import { Platform } from 'react-native';
import notifee, { AndroidImportance, AuthorizationStatus } from '@notifee/react-native';

export class PushNotificationClient {
  static async initialize(): Promise<void> {
    // Request permissions
    await this.requestPermissions();

    // Create notification channels (Android)
    if (Platform.OS === 'android') {
      await this.createAndroidChannels();
    }

    // Get FCM token
    const token = await this.getToken();
    await this.registerToken(token);

    // Setup message handlers
    this.setupMessageHandlers();

    // Handle token refresh
    messaging().onTokenRefresh(async (newToken) => {
      await this.registerToken(newToken);
    });
  }

  static async requestPermissions(): Promise<boolean> {
    if (Platform.OS === 'ios') {
      const authStatus = await messaging().requestPermission();
      return (
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL
      );
    } else {
      const settings = await notifee.requestPermission();
      return settings.authorizationStatus === AuthorizationStatus.AUTHORIZED;
    }
  }

  private static async createAndroidChannels(): Promise<void> {
    await notifee.createChannel({
      id: 'ticket_purchase',
      name: 'Ticket Purchases',
      importance: AndroidImportance.HIGH,
      sound: 'success',
    });

    await notifee.createChannel({
      id: 'event_reminder',
      name: 'Event Reminders',
      importance: AndroidImportance.HIGH,
      sound: 'reminder',
    });

    await notifee.createChannel({
      id: 'event_update',
      name: 'Event Updates',
      importance: AndroidImportance.HIGH,
      sound: 'alert',
    });

    await notifee.createChannel({
      id: 'promotion',
      name: 'Promotions',
      importance: AndroidImportance.DEFAULT,
    });

    await notifee.createChannel({
      id: 'default',
      name: 'General',
      importance: AndroidImportance.DEFAULT,
    });
  }

  private static async getToken(): Promise<string> {
    return await messaging().getToken();
  }

  private static async registerToken(token: string): Promise<void> {
    const response = await fetch('/api/notifications/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token,
        platform: Platform.OS,
        deviceId: DeviceInfo.getUniqueId(),
        model: DeviceInfo.getModel(),
        osVersion: DeviceInfo.getSystemVersion(),
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to register device token');
    }
  }

  private static setupMessageHandlers(): void {
    // Background message handler
    messaging().setBackgroundMessageHandler(async (remoteMessage) => {
      console.log('Background message:', remoteMessage);
      await this.displayNotification(remoteMessage);
    });

    // Foreground message handler
    messaging().onMessage(async (remoteMessage) => {
      console.log('Foreground message:', remoteMessage);
      await this.displayNotification(remoteMessage);
    });

    // Notification opened handler
    messaging().onNotificationOpenedApp((remoteMessage) => {
      console.log('Notification opened:', remoteMessage);
      this.handleNotificationPress(remoteMessage);
    });

    // Check if app opened from notification
    messaging()
      .getInitialNotification()
      .then((remoteMessage) => {
        if (remoteMessage) {
          console.log('App opened from notification:', remoteMessage);
          this.handleNotificationPress(remoteMessage);
        }
      });
  }

  private static async displayNotification(remoteMessage: any): Promise<void> {
    const { notification, data } = remoteMessage;

    if (Platform.OS === 'ios') {
      PushNotificationIOS.addNotificationRequest({
        id: data.id || Date.now().toString(),
        title: notification?.title,
        body: notification?.body,
        sound: data.sound || 'default',
        badge: data.badge ? parseInt(data.badge) : undefined,
        userInfo: data,
      });
    } else {
      await notifee.displayNotification({
        id: data.id || Date.now().toString(),
        title: notification?.title,
        body: notification?.body,
        android: {
          channelId: data.type || 'default',
          smallIcon: 'ic_notification',
          largeIcon: notification?.android?.imageUrl,
          sound: data.sound || 'default',
          pressAction: {
            id: 'default',
          },
          actions: data.actions ? JSON.parse(data.actions) : [],
        },
        data,
      });
    }

    // Track notification received
    await this.trackNotificationReceived(remoteMessage);
  }

  private static handleNotificationPress(remoteMessage: any): void {
    const { data } = remoteMessage;

    // Track notification opened
    this.trackNotificationOpened(remoteMessage);

    // Navigate based on notification type
    switch (data.type) {
      case 'ticket_purchase':
      case 'checkin_reminder':
        // Navigate to ticket details
        NavigationService.navigate('TicketDetail', { ticketId: data.ticketId });
        break;

      case 'event_reminder':
      case 'event_update':
        // Navigate to event details
        NavigationService.navigate('EventDetail', { eventId: data.eventId });
        break;

      case 'promotion':
        // Navigate to promotion or events list
        NavigationService.navigate('EventsList', { promotionId: data.promotionId });
        break;

      case 'refund':
        // Navigate to order details
        NavigationService.navigate('OrderDetail', { orderId: data.orderId });
        break;

      default:
        // Navigate to home
        NavigationService.navigate('Home');
    }
  }

  private static async trackNotificationReceived(remoteMessage: any): Promise<void> {
    await fetch('/api/notifications/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        notificationId: remoteMessage.data.id,
        action: 'received',
        timestamp: new Date().toISOString(),
      }),
    });
  }

  private static async trackNotificationOpened(remoteMessage: any): Promise<void> {
    await fetch('/api/notifications/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        notificationId: remoteMessage.data.id,
        action: 'opened',
        timestamp: new Date().toISOString(),
      }),
    });
  }

  static async updateNotificationPreferences(preferences: any): Promise<void> {
    await fetch('/api/notifications/preferences', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(preferences),
    });
  }
}
```

### Database Schema
```prisma
// prisma/schema.prisma additions
model DeviceToken {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  token     String   @unique
  platform  String   // 'ios' or 'android'
  deviceId  String
  model     String?
  osVersion String?
  active    Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([userId])
}

model NotificationPreference {
  id                        String   @id @default(cuid())
  userId                    String   @unique
  user                      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  ticketPurchaseEnabled     Boolean  @default(true)
  eventReminderEnabled      Boolean  @default(true)
  eventUpdateEnabled        Boolean  @default(true)
  checkinReminderEnabled    Boolean  @default(true)
  promotionEnabled          Boolean  @default(true)
  refundEnabled             Boolean  @default(true)
  quietHoursStart           String?  // "22:00"
  quietHoursEnd             String?  // "08:00"
  maxDailyNotifications     Int      @default(10)
  createdAt                 DateTime @default(now())
  updatedAt                 DateTime @updatedAt
}

model NotificationLog {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  type      String
  title     String
  body      String
  sentAt    DateTime
  delivered Int
  failed    Int
  opened    Boolean  @default(false)
  openedAt  DateTime?
  metadata  Json?

  @@index([userId, sentAt])
  @@index([type, sentAt])
}
```

---

## Testing Requirements

### Unit Tests
```typescript
describe('PushNotificationService', () => {
  it('should send notification to user', async () => {
    const service = new PushNotificationService();
    await service.sendNotification({
      userId: 'user123',
      title: 'Test',
      body: 'Test notification',
    });
    // Assert notification sent
  });

  it('should respect quiet hours', async () => {
    // Test quiet hours logic
  });

  it('should clean up invalid tokens', async () => {
    // Test token cleanup
  });
});
```

---

## Definition of Done

- [ ] All acceptance criteria met
- [ ] Code reviewed and approved
- [ ] Unit tests passing (>80% coverage)
- [ ] Integration tests passing
- [ ] Tested on iOS and Android
- [ ] Notification delivery rate > 99%
- [ ] Average delivery time < 5 seconds
- [ ] Analytics tracking verified
- [ ] Documentation complete

---

## Dependencies

- MOB-002: iOS app development (prerequisite)
- MOB-003: Android app development (prerequisite)
- AUTH-001: User authentication (prerequisite)

---

## Estimated Timeline

- Week 1: Backend notification service setup
- Week 2: Mobile client integration
- Week 3: Notification templates and preferences
- Week 4: Analytics and testing
- Week 5: Production deployment

**Total Duration:** 5 weeks
**Story Points:** 5