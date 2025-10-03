# MOB-007: App Analytics Integration

**Epic:** EPIC-015 Mobile Applications
**Story Points:** 3
**Priority:** High
**Status:** Not Started

---

## User Story

**As a** product manager
**I want** comprehensive analytics tracking in the mobile apps
**So that** I can understand user behavior, track conversions, monitor app health, and make data-driven decisions

---

## Acceptance Criteria

### 1. Firebase Analytics Integration
- [ ] Firebase SDK integrated (iOS & Android)
- [ ] Custom event tracking
- [ ] User property tracking
- [ ] Screen view tracking
- [ ] Conversion funnel tracking
- [ ] E-commerce event tracking
- [ ] User engagement metrics
- [ ] Audience segmentation

### 2. Amplitude Integration
- [ ] Amplitude SDK integrated
- [ ] Event tracking with properties
- [ ] User identification
- [ ] Revenue tracking
- [ ] Cohort analysis setup
- [ ] Funnel analysis
- [ ] Retention tracking
- [ ] User journey mapping

### 3. Crash Reporting
- [ ] Firebase Crashlytics integrated
- [ ] Sentry SDK integrated
- [ ] Automatic crash detection
- [ ] Custom error logging
- [ ] Breadcrumb tracking
- [ ] User context in crash reports
- [ ] Crash-free rate monitoring (> 99.5%)
- [ ] ANR tracking (Android)

### 4. Performance Monitoring
- [ ] Firebase Performance Monitoring
- [ ] App startup time tracking
- [ ] Screen rendering time
- [ ] Network request monitoring
- [ ] Custom trace measurements
- [ ] Slow frame detection
- [ ] Memory usage tracking
- [ ] Battery usage optimization

### 5. User Behavior Tracking
- [ ] Screen views
- [ ] Button clicks
- [ ] Form submissions
- [ ] Search queries
- [ ] Filter usage
- [ ] Share actions
- [ ] Time spent per screen
- [ ] Session duration

### 6. E-commerce Tracking
- [ ] Product views (event views)
- [ ] Add to cart (ticket selection)
- [ ] Begin checkout
- [ ] Purchase complete
- [ ] Purchase value
- [ ] Refund tracking
- [ ] Promotional campaign tracking
- [ ] Revenue attribution

### 7. A/B Testing Support
- [ ] Firebase Remote Config
- [ ] Feature flag system
- [ ] A/B test setup capability
- [ ] Variant assignment
- [ ] Success metric tracking
- [ ] Statistical significance calculation
- [ ] Rollout controls
- [ ] Test result analysis

### 8. Privacy & Compliance
- [ ] GDPR compliance (opt-out)
- [ ] CCPA compliance
- [ ] Data anonymization options
- [ ] User consent management
- [ ] Data retention policies
- [ ] PII scrubbing
- [ ] Analytics opt-out functionality
- [ ] Compliance documentation

---

## Technical Specifications

### Analytics Service Abstraction
```typescript
// src/services/Analytics.ts
import analytics from '@react-native-firebase/analytics';
import { Amplitude } from '@amplitude/react-native';
import * as Sentry from '@sentry/react-native';

interface EventProperties {
  [key: string]: string | number | boolean | null;
}

interface UserProperties {
  userId?: string;
  email?: string;
  name?: string;
  plan?: string;
  [key: string]: string | number | boolean | undefined;
}

export class AnalyticsService {
  private static amplitude: Amplitude;

  static async initialize(): Promise<void> {
    // Initialize Amplitude
    this.amplitude = Amplitude.getInstance();
    await this.amplitude.init(process.env.AMPLITUDE_API_KEY!);

    // Initialize Sentry
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: __DEV__ ? 'development' : 'production',
      tracesSampleRate: 1.0,
      enableAutoSessionTracking: true,
    });
  }

  // Event tracking
  static async logEvent(eventName: string, properties?: EventProperties): Promise<void> {
    // Firebase Analytics
    await analytics().logEvent(eventName, properties);

    // Amplitude
    await this.amplitude.logEvent(eventName, properties);

    // Console log in development
    if (__DEV__) {
      console.log('[Analytics]', eventName, properties);
    }
  }

  // Screen tracking
  static async logScreenView(screenName: string, screenClass?: string): Promise<void> {
    await analytics().logScreenView({
      screen_name: screenName,
      screen_class: screenClass || screenName,
    });

    await this.amplitude.logEvent('screen_view', {
      screen_name: screenName,
      screen_class: screenClass,
    });
  }

  // User identification
  static async identifyUser(properties: UserProperties): Promise<void> {
    const { userId, ...rest } = properties;

    if (userId) {
      // Firebase
      await analytics().setUserId(userId);

      // Amplitude
      await this.amplitude.setUserId(userId);

      // Sentry
      Sentry.setUser({ id: userId, email: rest.email, username: rest.name });
    }

    // Set user properties
    await this.setUserProperties(rest);
  }

  static async setUserProperties(properties: Record<string, any>): Promise<void> {
    // Firebase
    for (const [key, value] of Object.entries(properties)) {
      await analytics().setUserProperty(key, String(value));
    }

    // Amplitude
    const identify = new this.amplitude.Identify();
    Object.entries(properties).forEach(([key, value]) => {
      identify.set(key, value);
    });
    await this.amplitude.identify(identify);
  }

  // E-commerce tracking
  static async logPurchase(
    transactionId: string,
    value: number,
    currency: string,
    items: any[]
  ): Promise<void> {
    // Firebase
    await analytics().logPurchase({
      transaction_id: transactionId,
      value,
      currency,
      items,
    });

    // Amplitude Revenue
    const revenue = new this.amplitude.Revenue()
      .setProductId(items[0]?.item_id || 'unknown')
      .setPrice(value)
      .setQuantity(items.length);
    await this.amplitude.logRevenueV2(revenue);

    // Also log as event
    await this.logEvent('purchase_completed', {
      transaction_id: transactionId,
      value,
      currency,
      item_count: items.length,
    });
  }

  static async logBeginCheckout(value: number, items: any[]): Promise<void> {
    await analytics().logBeginCheckout({
      value,
      currency: 'USD',
      items,
    });

    await this.logEvent('begin_checkout', {
      value,
      item_count: items.length,
    });
  }

  static async logAddToCart(item: any): Promise<void> {
    await analytics().logAddToCart({
      items: [item],
      value: item.price,
      currency: 'USD',
    });

    await this.logEvent('add_to_cart', {
      item_id: item.item_id,
      item_name: item.item_name,
      price: item.price,
    });
  }

  // Error tracking
  static logError(error: Error, context?: Record<string, any>): void {
    // Firebase Crashlytics
    crashlytics().recordError(error);
    if (context) {
      crashlytics().log(JSON.stringify(context));
    }

    // Sentry
    Sentry.captureException(error, { extra: context });

    // Amplitude
    this.amplitude.logEvent('error_occurred', {
      error_message: error.message,
      error_stack: error.stack,
      ...context,
    });
  }

  // Custom metrics
  static async logMetric(metricName: string, value: number): Promise<void> {
    await this.amplitude.logEvent('metric_recorded', {
      metric_name: metricName,
      value,
    });
  }

  // Reset on logout
  static async reset(): Promise<void> {
    await analytics().resetAnalyticsData();
    await this.amplitude.setUserId(null);
    Sentry.setUser(null);
  }
}
```

### Pre-defined Events
```typescript
// src/services/AnalyticsEvents.ts
export const AnalyticsEvents = {
  // Authentication
  SIGNUP_STARTED: 'signup_started',
  SIGNUP_COMPLETED: 'signup_completed',
  LOGIN_SUCCESS: 'login_success',
  LOGIN_FAILED: 'login_failed',
  LOGOUT: 'logout',
  BIOMETRIC_AUTH_ENABLED: 'biometric_auth_enabled',

  // Event Discovery
  EVENT_VIEWED: 'event_viewed',
  EVENT_SEARCHED: 'event_searched',
  EVENT_FILTERED: 'event_filtered',
  EVENT_SHARED: 'event_shared',
  EVENT_FAVORITED: 'event_favorited',

  // Ticket Purchase
  TICKET_SELECTION_STARTED: 'ticket_selection_started',
  TICKET_QUANTITY_CHANGED: 'ticket_quantity_changed',
  CHECKOUT_STARTED: 'checkout_started',
  PAYMENT_METHOD_SELECTED: 'payment_method_selected',
  PURCHASE_COMPLETED: 'purchase_completed',
  PURCHASE_FAILED: 'purchase_failed',

  // Tickets
  TICKET_VIEWED: 'ticket_viewed',
  TICKET_DOWNLOADED: 'ticket_downloaded',
  TICKET_ADDED_TO_WALLET: 'ticket_added_to_wallet',
  TICKET_QR_SCANNED: 'ticket_qr_scanned',
  TICKET_TRANSFERRED: 'ticket_transferred',

  // Engagement
  NOTIFICATION_RECEIVED: 'notification_received',
  NOTIFICATION_OPENED: 'notification_opened',
  DEEP_LINK_OPENED: 'deep_link_opened',
  SHARE_INITIATED: 'share_initiated',
  REVIEW_SUBMITTED: 'review_submitted',

  // Settings
  NOTIFICATION_PREFERENCES_UPDATED: 'notification_preferences_updated',
  PROFILE_UPDATED: 'profile_updated',
  PAYMENT_METHOD_ADDED: 'payment_method_added',

  // Errors
  API_ERROR: 'api_error',
  PAYMENT_ERROR: 'payment_error',
  NETWORK_ERROR: 'network_error',
};

// Usage example
import { AnalyticsService } from './Analytics';
import { AnalyticsEvents } from './AnalyticsEvents';

// Track event view
AnalyticsService.logEvent(AnalyticsEvents.EVENT_VIEWED, {
  event_id: event.id,
  event_name: event.title,
  event_category: event.category,
  event_price: event.price,
  event_date: event.startDate,
});
```

### Screen Tracking Hook
```typescript
// src/hooks/useAnalyticsScreenView.ts
import { useEffect } from 'react';
import { useRoute } from '@react-navigation/native';
import { AnalyticsService } from '../services/Analytics';

export const useAnalyticsScreenView = (screenName?: string): void => {
  const route = useRoute();

  useEffect(() => {
    const name = screenName || route.name;
    AnalyticsService.logScreenView(name);
  }, [screenName, route.name]);
};

// Usage in screen component
export const EventDetailScreen: React.FC = () => {
  useAnalyticsScreenView('EventDetail');

  return (
    <View>
      {/* Screen content */}
    </View>
  );
};
```

### Performance Monitoring
```typescript
// src/services/PerformanceMonitoring.ts
import perf from '@react-native-firebase/perf';

export class PerformanceMonitoring {
  static async measureScreenLoad(screenName: string, callback: () => Promise<void>): Promise<void> {
    const trace = await perf().startTrace(`screen_load_${screenName}`);

    try {
      await callback();
      trace.putAttribute('success', 'true');
    } catch (error) {
      trace.putAttribute('success', 'false');
      throw error;
    } finally {
      await trace.stop();
    }
  }

  static async measureNetworkRequest(
    url: string,
    method: string,
    callback: () => Promise<Response>
  ): Promise<Response> {
    const httpMetric = perf().newHttpMetric(url, method);
    await httpMetric.start();

    try {
      const response = await callback();
      httpMetric.setHttpResponseCode(response.status);
      httpMetric.setResponseContentType(response.headers.get('content-type') || '');
      await httpMetric.stop();
      return response;
    } catch (error) {
      httpMetric.setHttpResponseCode(0);
      await httpMetric.stop();
      throw error;
    }
  }

  static async measureCustomMetric(
    metricName: string,
    value: number,
    attributes?: Record<string, string>
  ): Promise<void> {
    const trace = await perf().startTrace(metricName);
    trace.putMetric(metricName, value);

    if (attributes) {
      Object.entries(attributes).forEach(([key, val]) => {
        trace.putAttribute(key, val);
      });
    }

    await trace.stop();
  }
}

// Usage
await PerformanceMonitoring.measureScreenLoad('EventDetail', async () => {
  await fetchEventDetails(eventId);
});
```

### Firebase Remote Config
```typescript
// src/services/RemoteConfig.ts
import remoteConfig from '@react-native-firebase/remote-config';

export class RemoteConfigService {
  static async initialize(): Promise<void> {
    await remoteConfig().setDefaults({
      enable_apple_pay: true,
      enable_google_pay: true,
      min_app_version: '1.0.0',
      feature_new_checkout: false,
      promotional_banner_text: 'Welcome to SteppersLife Events!',
    });

    await remoteConfig().setConfigSettings({
      minimumFetchIntervalMillis: 3600000, // 1 hour
    });

    await remoteConfig().fetchAndActivate();
  }

  static async getValue(key: string): Promise<any> {
    const value = remoteConfig().getValue(key);
    return value.asString();
  }

  static async getBoolean(key: string): Promise<boolean> {
    const value = remoteConfig().getValue(key);
    return value.asBoolean();
  }

  static async getNumber(key: string): Promise<number> {
    const value = remoteConfig().getValue(key);
    return value.asNumber();
  }

  static async refresh(): Promise<void> {
    await remoteConfig().fetchAndActivate();
  }
}

// Usage
const enableApplePay = await RemoteConfigService.getBoolean('enable_apple_pay');
if (enableApplePay) {
  // Show Apple Pay button
}
```

### Analytics Debugging Tool
```typescript
// src/components/AnalyticsDebugger.tsx (Development only)
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { AnalyticsService } from '../services/Analytics';

interface AnalyticsEvent {
  name: string;
  properties: any;
  timestamp: Date;
}

export const AnalyticsDebugger: React.FC = () => {
  const [events, setEvents] = useState<AnalyticsEvent[]>([]);

  if (!__DEV__) return null;

  // Intercept analytics calls
  const originalLogEvent = AnalyticsService.logEvent;
  AnalyticsService.logEvent = async (name, properties) => {
    setEvents((prev) => [
      { name, properties, timestamp: new Date() },
      ...prev.slice(0, 49), // Keep last 50 events
    ]);
    return originalLogEvent(name, properties);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Analytics Events</Text>
      <ScrollView>
        {events.map((event, index) => (
          <View key={index} style={styles.event}>
            <Text style={styles.eventName}>{event.name}</Text>
            <Text style={styles.eventTime}>
              {event.timestamp.toLocaleTimeString()}
            </Text>
            <Text style={styles.eventProps}>
              {JSON.stringify(event.properties, null, 2)}
            </Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 200,
    backgroundColor: 'rgba(0,0,0,0.9)',
    padding: 10,
  },
  title: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  event: {
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    paddingVertical: 8,
  },
  eventName: {
    color: '#4CAF50',
    fontSize: 14,
    fontWeight: 'bold',
  },
  eventTime: {
    color: '#999',
    fontSize: 12,
  },
  eventProps: {
    color: '#fff',
    fontSize: 11,
    marginTop: 4,
  },
});
```

### Privacy Consent Management
```typescript
// src/services/PrivacyConsent.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import analytics from '@react-native-firebase/analytics';

export class PrivacyConsentService {
  private static readonly CONSENT_KEY = 'analytics_consent';

  static async hasConsent(): Promise<boolean> {
    const consent = await AsyncStorage.getItem(this.CONSENT_KEY);
    return consent === 'true';
  }

  static async grantConsent(): Promise<void> {
    await AsyncStorage.setItem(this.CONSENT_KEY, 'true');
    await analytics().setAnalyticsCollectionEnabled(true);
  }

  static async revokeConsent(): Promise<void> {
    await AsyncStorage.setItem(this.CONSENT_KEY, 'false');
    await analytics().setAnalyticsCollectionEnabled(false);
    await analytics().resetAnalyticsData();
  }

  static async showConsentDialog(): Promise<boolean> {
    // Show consent UI to user
    return new Promise((resolve) => {
      Alert.alert(
        'Analytics Consent',
        'We use analytics to improve your experience. Do you consent to analytics tracking?',
        [
          {
            text: 'No',
            onPress: async () => {
              await this.revokeConsent();
              resolve(false);
            },
          },
          {
            text: 'Yes',
            onPress: async () => {
              await this.grantConsent();
              resolve(true);
            },
          },
        ]
      );
    });
  }
}
```

---

## Testing Requirements

### Analytics Tests
```typescript
// __tests__/Analytics.test.ts
describe('AnalyticsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should log events to all providers', async () => {
    await AnalyticsService.logEvent('test_event', { foo: 'bar' });
    expect(analytics().logEvent).toHaveBeenCalledWith('test_event', { foo: 'bar' });
  });

  it('should identify user', async () => {
    await AnalyticsService.identifyUser({
      userId: 'user123',
      email: 'test@example.com',
    });
    expect(analytics().setUserId).toHaveBeenCalledWith('user123');
  });

  it('should track purchases', async () => {
    await AnalyticsService.logPurchase('txn123', 50.0, 'USD', []);
    expect(analytics().logPurchase).toHaveBeenCalled();
  });
});
```

---

## Definition of Done

- [ ] All acceptance criteria met
- [ ] Firebase Analytics integrated and tested
- [ ] Amplitude integrated and tested
- [ ] Crashlytics capturing crashes
- [ ] Performance monitoring active
- [ ] E-commerce events tracking
- [ ] Privacy consent implemented
- [ ] Remote config functional
- [ ] Unit tests passing (>80% coverage)
- [ ] Documentation complete

---

## Dependencies

- MOB-002: iOS app development (prerequisite)
- MOB-003: Android app development (prerequisite)
- MOB-004: App store deployment (parallel)

---

## Estimated Timeline

- Week 1: Firebase and Amplitude integration
- Week 2: Custom events and user properties
- Week 3: Performance monitoring and crash reporting
- Week 4: Testing and optimization

**Total Duration:** 4 weeks
**Story Points:** 3