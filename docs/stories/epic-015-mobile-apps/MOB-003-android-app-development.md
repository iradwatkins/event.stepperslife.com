# MOB-003: Android App Development

**Epic:** EPIC-015 Mobile Applications
**Story Points:** 13
**Priority:** High
**Status:** Not Started

---

## User Story

**As an** Android mobile user
**I want** a native Android app for Events SteppersLife
**So that** I can purchase tickets, manage my orders, and access event information directly from my Android device with native Android features

---

## Acceptance Criteria

### 1. Native Android App Foundation
- [ ] React Native Android app with TypeScript setup
- [ ] Android 8.0 (API 26)+ minimum SDK version
- [ ] Target Android 13+ (API 33+)
- [ ] Material Design 3 implementation
- [ ] Dark theme support
- [ ] Edge-to-edge display support
- [ ] Proper status bar and navigation bar handling
- [ ] TalkBack accessibility support
- [ ] Multi-window and split-screen support

### 2. Google Play Store Submission
- [ ] Google Play Console account setup
- [ ] App bundle (.aab) generation
- [ ] Store listing metadata complete
- [ ] Feature graphic, screenshots (phone, tablet, TV)
- [ ] Content rating questionnaire
- [ ] Privacy policy and data safety form
- [ ] Internal testing track setup
- [ ] Closed beta testing track
- [ ] Successful Play Store approval
- [ ] Production release published

### 3. Android-Specific Features
- [ ] Biometric authentication (Fingerprint, Face)
- [ ] Google Pay integration for ticket purchases
- [ ] Android Wallet API for digital tickets
- [ ] Google Sign-In
- [ ] Android share sheet integration
- [ ] App shortcuts (static and dynamic)
- [ ] Widgets for upcoming events
- [ ] Picture-in-Picture (if applicable)

### 4. Push Notifications (FCM)
- [ ] Firebase Cloud Messaging (FCM) setup
- [ ] google-services.json configuration
- [ ] Notification channels implementation
- [ ] Notification permissions (Android 13+)
- [ ] Rich notifications with images and actions
- [ ] Background message handling
- [ ] Foreground message handling
- [ ] Badge count management

### 5. Deep Linking
- [ ] Android App Links configuration
- [ ] Digital Asset Links JSON file
- [ ] Intent filter setup
- [ ] Deep link routing system
- [ ] Handle event/:id links
- [ ] Handle ticket/:id links
- [ ] Handle order/:id links
- [ ] Launch handling from notifications
- [ ] Launch handling from browser/email

### 6. Performance Optimization
- [ ] App startup time < 2 seconds (cold start)
- [ ] Smooth 60fps scrolling
- [ ] Image loading with Glide/Coil
- [ ] Memory optimization (no leaks)
- [ ] ProGuard/R8 code shrinking
- [ ] Network request optimization
- [ ] APK/Bundle size optimization
- [ ] Lazy loading and code splitting

### 7. Security
- [ ] Network security config
- [ ] Certificate pinning
- [ ] SafetyNet Attestation API
- [ ] Encrypted SharedPreferences
- [ ] Android Keystore for credentials
- [ ] Root detection
- [ ] Secure payment handling
- [ ] Data encryption at rest

### 8. Testing
- [ ] JUnit unit tests (>80% coverage)
- [ ] Espresso UI tests
- [ ] Instrumentation tests
- [ ] Internal testing track validation
- [ ] Real device testing (various manufacturers)
- [ ] Android 8-13+ version testing
- [ ] Performance profiling (Android Profiler)
- [ ] ANR (Application Not Responding) rate < 0.1%
- [ ] Crash-free rate > 99.5%

---

## Technical Specifications

### Tech Stack
```yaml
Framework: React Native 0.72+
Language: TypeScript 5.0+
Build Tool: Android Studio / Gradle 8.0+
Package Manager: npm/yarn
State Management: Redux Toolkit / Zustand
Navigation: React Navigation
UI Components: React Native Paper / Native Base
Material Design: react-native-paper (MD3)
```

### Android-Specific Libraries
```json
{
  "@react-native-firebase/app": "^18.6.1",
  "@react-native-firebase/messaging": "^18.6.1",
  "react-native-biometrics": "^3.0.1",
  "@react-native-google-signin/google-signin": "^10.1.0",
  "react-native-google-pay": "^1.5.0",
  "react-native-encrypted-storage": "^4.0.3",
  "react-native-device-info": "^10.11.0",
  "react-native-splash-screen": "^3.3.0",
  "react-native-config": "^1.5.1",
  "react-native-fast-image": "^8.6.3"
}
```

### Project Structure
```
android/
├── app/
│   ├── src/
│   │   ├── main/
│   │   │   ├── AndroidManifest.xml
│   │   │   ├── java/com/eventsstepperslife/
│   │   │   │   └── MainActivity.java
│   │   │   ├── res/
│   │   │   │   ├── mipmap-*/           # App icons
│   │   │   │   ├── drawable-*/         # Images
│   │   │   │   ├── values/             # Strings, colors
│   │   │   │   └── xml/
│   │   │   │       └── network_security_config.xml
│   │   │   └── assets/
│   │   └── debug/
│   ├── build.gradle                     # App build config
│   ├── proguard-rules.pro              # Code obfuscation
│   └── google-services.json            # Firebase config
├── gradle/
├── build.gradle                         # Project build config
├── gradle.properties
└── settings.gradle

src/
├── android/
│   ├── Biometric/                      # Fingerprint/Face auth
│   ├── GooglePay/                      # Payment integration
│   ├── Wallet/                         # Wallet API integration
│   ├── Notifications/                  # FCM handling
│   └── DeepLinking/                    # App Links
```

### AndroidManifest.xml Configuration
```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    <!-- Permissions -->
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.CAMERA" />
    <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
    <uses-permission android:name="android.permission.USE_BIOMETRIC" />

    <!-- Biometric authentication -->
    <uses-feature android:name="android.hardware.fingerprint" android:required="false" />
    <uses-feature android:name="android.hardware.camera" android:required="false" />

    <application
        android:name=".MainApplication"
        android:label="@string/app_name"
        android:icon="@mipmap/ic_launcher"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:allowBackup="false"
        android:theme="@style/AppTheme"
        android:usesCleartextTraffic="false"
        android:networkSecurityConfig="@xml/network_security_config">

        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:launchMode="singleTask"
            android:windowSoftInputMode="adjustResize">

            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>

            <!-- Deep linking -->
            <intent-filter android:autoVerify="true">
                <action android:name="android.intent.action.VIEW" />
                <category android:name="android.intent.category.DEFAULT" />
                <category android:name="android.intent.category.BROWSABLE" />
                <data
                    android:scheme="https"
                    android:host="events.stepperslife.com"
                    android:pathPrefix="/events" />
                <data
                    android:scheme="https"
                    android:host="events.stepperslife.com"
                    android:pathPrefix="/tickets" />
            </intent-filter>
        </activity>

        <!-- Firebase Messaging Service -->
        <service
            android:name=".FCMService"
            android:exported="false">
            <intent-filter>
                <action android:name="com.google.firebase.MESSAGING_EVENT" />
            </intent-filter>
        </service>

        <!-- Default notification channel -->
        <meta-data
            android:name="com.google.firebase.messaging.default_notification_channel_id"
            android:value="@string/default_notification_channel_id" />

        <!-- Google Pay -->
        <meta-data
            android:name="com.google.android.gms.wallet.api.enabled"
            android:value="true" />
    </application>
</manifest>
```

### Network Security Configuration
```xml
<!-- android/app/src/main/res/xml/network_security_config.xml -->
<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <base-config cleartextTrafficPermitted="false">
        <trust-anchors>
            <certificates src="system" />
        </trust-anchors>
    </base-config>

    <!-- Certificate pinning -->
    <domain-config>
        <domain includeSubdomains="true">events.stepperslife.com</domain>
        <pin-set expiration="2025-12-31">
            <pin digest="SHA-256">AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=</pin>
            <pin digest="SHA-256">BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB=</pin>
        </pin-set>
    </domain-config>
</network-security-config>
```

### Google Pay Integration
```typescript
// src/android/GooglePay/GooglePayService.ts
import { GooglePay } from 'react-native-google-pay';

export class GooglePayService {
  private static readonly allowedCardNetworks = ['VISA', 'MASTERCARD', 'AMEX', 'DISCOVER'];
  private static readonly allowedCardAuthMethods = ['PAN_ONLY', 'CRYPTOGRAM_3DS'];

  static async isReadyToPay(): Promise<boolean> {
    const request = {
      allowedPaymentMethods: [
        {
          type: 'CARD',
          parameters: {
            allowedAuthMethods: this.allowedCardAuthMethods,
            allowedCardNetworks: this.allowedCardNetworks,
          },
        },
      ],
    };

    try {
      await GooglePay.isReadyToPay(request);
      return true;
    } catch (error) {
      return false;
    }
  }

  static async requestPayment(
    amount: number,
    eventTitle: string
  ): Promise<PaymentToken> {
    const paymentDataRequest = {
      apiVersion: 2,
      apiVersionMinor: 0,
      allowedPaymentMethods: [
        {
          type: 'CARD',
          parameters: {
            allowedAuthMethods: this.allowedCardAuthMethods,
            allowedCardNetworks: this.allowedCardNetworks,
          },
          tokenizationSpecification: {
            type: 'PAYMENT_GATEWAY',
            parameters: {
              gateway: 'square',
              gatewayMerchantId: process.env.SQUARE_MERCHANT_ID,
            },
          },
        },
      ],
      merchantInfo: {
        merchantName: 'Events SteppersLife',
      },
      transactionInfo: {
        totalPriceStatus: 'FINAL',
        totalPrice: amount.toFixed(2),
        currencyCode: 'USD',
        countryCode: 'US',
        transactionId: `event-${Date.now()}`,
        displayItems: [
          {
            label: eventTitle,
            type: 'LINE_ITEM',
            price: amount.toFixed(2),
          },
        ],
      },
    };

    const token = await GooglePay.requestPayment(paymentDataRequest);
    return JSON.parse(token.paymentMethodData.tokenizationData.token);
  }
}
```

### Biometric Authentication
```typescript
// src/android/Biometric/BiometricAuth.ts
import ReactNativeBiometrics from 'react-native-biometrics';

export class BiometricAuthService {
  static async isBiometricsAvailable(): Promise<{
    available: boolean;
    biometryType: string;
  }> {
    const { available, biometryType } = await ReactNativeBiometrics.isSensorAvailable();
    return { available, biometryType };
  }

  static async authenticate(reason: string): Promise<boolean> {
    try {
      const { success } = await ReactNativeBiometrics.simplePrompt({
        promptMessage: reason,
        cancelButtonText: 'Cancel',
      });
      return success;
    } catch (error) {
      console.error('Biometric authentication failed:', error);
      return false;
    }
  }

  static async createSignature(payload: string): Promise<{
    signature: string;
    success: boolean;
  }> {
    try {
      const { success, signature } = await ReactNativeBiometrics.createSignature({
        promptMessage: 'Authenticate to sign',
        payload: payload,
      });
      return { success, signature };
    } catch (error) {
      console.error('Signature creation failed:', error);
      return { success: false, signature: '' };
    }
  }
}
```

### Firebase Cloud Messaging
```typescript
// src/android/Notifications/FCMService.ts
import messaging from '@react-native-firebase/messaging';
import notifee, { AndroidImportance } from '@notifee/react-native';

export class FCMService {
  static async requestPermission(): Promise<boolean> {
    const authStatus = await messaging().requestPermission();
    return (
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL
    );
  }

  static async getToken(): Promise<string> {
    return await messaging().getToken();
  }

  static async createNotificationChannels(): Promise<void> {
    // Create channels for Android 8.0+
    await notifee.createChannel({
      id: 'default',
      name: 'Default Notifications',
      importance: AndroidImportance.DEFAULT,
    });

    await notifee.createChannel({
      id: 'event-reminders',
      name: 'Event Reminders',
      importance: AndroidImportance.HIGH,
      sound: 'default',
      vibration: true,
    });

    await notifee.createChannel({
      id: 'ticket-updates',
      name: 'Ticket Updates',
      importance: AndroidImportance.DEFAULT,
    });
  }

  static setupMessageHandlers(): void {
    // Handle background messages
    messaging().setBackgroundMessageHandler(async (remoteMessage) => {
      console.log('Background message:', remoteMessage);
      await this.displayNotification(remoteMessage);
    });

    // Handle foreground messages
    messaging().onMessage(async (remoteMessage) => {
      console.log('Foreground message:', remoteMessage);
      await this.displayNotification(remoteMessage);
    });

    // Handle notification opened
    messaging().onNotificationOpenedApp((remoteMessage) => {
      console.log('Notification opened:', remoteMessage);
      this.handleNotificationOpen(remoteMessage);
    });

    // Check if app opened from notification
    messaging()
      .getInitialNotification()
      .then((remoteMessage) => {
        if (remoteMessage) {
          console.log('App opened from notification:', remoteMessage);
          this.handleNotificationOpen(remoteMessage);
        }
      });
  }

  private static async displayNotification(message: any): Promise<void> {
    const channelId = message.data?.channelId || 'default';

    await notifee.displayNotification({
      title: message.notification?.title,
      body: message.notification?.body,
      android: {
        channelId,
        smallIcon: 'ic_notification',
        largeIcon: message.notification?.android?.imageUrl,
        pressAction: {
          id: 'default',
          launchActivity: 'default',
        },
        actions: message.data?.actions
          ? JSON.parse(message.data.actions)
          : undefined,
      },
      data: message.data,
    });
  }

  private static handleNotificationOpen(message: any): void {
    const { data } = message;
    // Navigate based on notification data
    if (data?.type === 'event') {
      // Navigate to event details
    } else if (data?.type === 'ticket') {
      // Navigate to ticket details
    }
  }
}
```

### Deep Linking Configuration
```typescript
// src/android/DeepLinking/DeepLinkingService.ts
import { Linking } from 'react-native';
import { NavigationContainerRef } from '@react-navigation/native';

export class DeepLinkingService {
  private static navigationRef: NavigationContainerRef<any> | null = null;

  static setNavigationRef(ref: NavigationContainerRef<any>): void {
    this.navigationRef = ref;
  }

  static async configure(): Promise<void> {
    // Handle initial URL (app opened from link)
    const initialUrl = await Linking.getInitialURL();
    if (initialUrl) {
      this.handleDeepLink(initialUrl);
    }

    // Handle URLs while app is running
    Linking.addEventListener('url', (event) => {
      this.handleDeepLink(event.url);
    });
  }

  static handleDeepLink(url: string): void {
    const route = this.parseDeepLink(url);
    if (route && this.navigationRef) {
      this.navigationRef.navigate(route.screen, route.params);
    }
  }

  private static parseDeepLink(url: string): DeepLinkRoute | null {
    // events.stepperslife.com/events/123
    const eventMatch = url.match(/events\/([a-zA-Z0-9]+)/);
    if (eventMatch) {
      return { screen: 'EventDetail', params: { eventId: eventMatch[1] } };
    }

    // events.stepperslife.com/tickets/456
    const ticketMatch = url.match(/tickets\/([a-zA-Z0-9]+)/);
    if (ticketMatch) {
      return { screen: 'TicketDetail', params: { ticketId: ticketMatch[1] } };
    }

    // events.stepperslife.com/orders/789
    const orderMatch = url.match(/orders\/([a-zA-Z0-9]+)/);
    if (orderMatch) {
      return { screen: 'OrderDetail', params: { orderId: orderMatch[1] } };
    }

    return null;
  }
}

interface DeepLinkRoute {
  screen: string;
  params: Record<string, string>;
}
```

### Digital Asset Links (App Links Verification)
```json
// .well-known/assetlinks.json (hosted on events.stepperslife.com)
[{
  "relation": ["delegate_permission/common.handle_all_urls"],
  "target": {
    "namespace": "android_app",
    "package_name": "com.stepperslife.events",
    "sha256_cert_fingerprints": [
      "AA:BB:CC:DD:EE:FF:00:11:22:33:44:55:66:77:88:99:AA:BB:CC:DD:EE:FF:00:11:22:33:44:55:66:77:88:99"
    ]
  }
}]
```

### Build Configuration (build.gradle)
```gradle
// android/app/build.gradle
android {
    compileSdkVersion 33
    buildToolsVersion "33.0.0"

    defaultConfig {
        applicationId "com.stepperslife.events"
        minSdkVersion 26
        targetSdkVersion 33
        versionCode 1
        versionName "1.0.0"
        multiDexEnabled true
    }

    signingConfigs {
        release {
            storeFile file('release.keystore')
            storePassword System.getenv("KEYSTORE_PASSWORD")
            keyAlias System.getenv("KEY_ALIAS")
            keyPassword System.getenv("KEY_PASSWORD")
        }
    }

    buildTypes {
        release {
            minifyEnabled true
            shrinkResources true
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
            signingConfig signingConfigs.release
        }
        debug {
            applicationIdSuffix ".debug"
            debuggable true
        }
    }

    bundle {
        language {
            enableSplit = false
        }
        density {
            enableSplit = true
        }
        abi {
            enableSplit = true
        }
    }
}

dependencies {
    implementation platform('com.google.firebase:firebase-bom:32.5.0')
    implementation 'com.google.firebase:firebase-messaging'
    implementation 'com.google.firebase:firebase-analytics'
    implementation 'com.google.android.gms:play-services-wallet:19.2.1'
    implementation 'androidx.biometric:biometric:1.1.0'
}

apply plugin: 'com.google.gms.google-services'
```

### Google Play Store Submission Checklist
```markdown
## Pre-Submission
- [ ] App bundle (.aab) built in Release mode
- [ ] ProGuard/R8 enabled and tested
- [ ] All API endpoints use HTTPS
- [ ] Privacy policy URL configured
- [ ] Data safety form completed
- [ ] App icons (all densities: mdpi, hdpi, xhdpi, xxhdpi, xxxhdpi)
- [ ] Feature graphic (1024x500)
- [ ] Screenshots (phone: 16:9, tablet: 16:10)

## Play Console
- [ ] App name (30 chars max)
- [ ] Short description (80 chars)
- [ ] Full description (4000 chars)
- [ ] App category
- [ ] Content rating questionnaire
- [ ] Contact details
- [ ] Store listing experiments (A/B testing)

## Privacy & Data
- [ ] Data safety section filled
- [ ] Third-party libraries disclosed
- [ ] Data collection practices declared
- [ ] Data sharing practices declared
- [ ] Security practices declared

## Build Upload
- [ ] App bundle uploaded
- [ ] Release notes (500 chars)
- [ ] Internal testing completed
- [ ] Closed beta testing completed
- [ ] Production rollout (staged: 10% → 50% → 100%)
```

---

## Testing Requirements

### Unit Tests (Jest)
```typescript
// __tests__/android/BiometricAuth.test.ts
describe('BiometricAuthService', () => {
  it('should check biometric availability', async () => {
    const result = await BiometricAuthService.isBiometricsAvailable();
    expect(result).toHaveProperty('available');
    expect(result).toHaveProperty('biometryType');
  });

  it('should authenticate user with biometrics', async () => {
    const success = await BiometricAuthService.authenticate('Test authentication');
    expect(typeof success).toBe('boolean');
  });
});
```

### Integration Tests (Espresso)
```kotlin
// android/app/src/androidTest/java/com/eventsstepperslife/MainActivityTest.kt
@RunWith(AndroidJUnit4::class)
class MainActivityTest {
    @get:Rule
    val activityRule = ActivityScenarioRule(MainActivity::class.java)

    @Test
    fun testAppLaunches() {
        onView(withText("Welcome"))
            .check(matches(isDisplayed()))
    }

    @Test
    fun testEventPurchaseFlow() {
        // Click browse events
        onView(withId(R.id.browse_events_button))
            .perform(click())

        // Click first event
        onView(withId(R.id.event_list))
            .perform(RecyclerViewActions.actionOnItemAtPosition<RecyclerView.ViewHolder>(0, click()))

        // Click buy tickets
        onView(withId(R.id.buy_tickets_button))
            .perform(click())

        // Verify checkout screen
        onView(withText("Checkout"))
            .check(matches(isDisplayed()))
    }
}
```

### Device Testing Matrix
```yaml
Devices:
  - Samsung Galaxy S21 (Android 13)
  - Samsung Galaxy S22 (Android 13)
  - Google Pixel 6 (Android 13)
  - Google Pixel 7 (Android 13)
  - OnePlus 9 (Android 12)
  - Xiaomi Mi 11 (Android 12)
  - Samsung Galaxy Tab S8 (Android 12)

Screen Sizes:
  - Small (3.5" - 4.7")
  - Medium (4.7" - 6.3")
  - Large (6.3"+)
  - Tablet (7"+)

Android Versions:
  - Android 8.0 (API 26)
  - Android 10 (API 29)
  - Android 11 (API 30)
  - Android 12 (API 31)
  - Android 13 (API 33)
```

---

## Third-Party Integrations

### Required Services
1. **Google Play Console** - $25 one-time fee
2. **Firebase** - Analytics, Crashlytics, FCM, Remote Config
3. **Google Cloud Platform** - API keys, OAuth
4. **Sentry** - Error tracking
5. **Amplitude** - Product analytics
6. **Branch.io** - Deep linking attribution

### Firebase Setup
```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login and init
firebase login
firebase init

# Download google-services.json
# Place in android/app/google-services.json
```

---

## Definition of Done

- [ ] All acceptance criteria met
- [ ] Code reviewed and approved
- [ ] Unit tests passing (>80% coverage)
- [ ] Espresso UI tests passing
- [ ] Performance benchmarks met
- [ ] No memory leaks or ANRs
- [ ] Internal testing completed
- [ ] Closed beta testing completed
- [ ] Play Store approved
- [ ] Production rollout started
- [ ] Documentation updated
- [ ] Analytics tracking verified

---

## Notes

- **Play Store Review Time**: Typically few hours to 2 days
- **App Bundle Size Limit**: 150MB (compressed)
- **Version Codes**: Must increment for each release
- **Staged Rollout**: Start with 10%, monitor crashes, increase gradually
- **SafetyNet Deprecation**: Migrate to Play Integrity API

---

## Dependencies

- MOB-001: Mobile app architecture setup (prerequisite)
- MOB-005: Push notification system (parallel)
- MOB-006: Mobile-specific features (parallel)
- PAY-001: Square payment integration (prerequisite)

---

## Estimated Timeline

- Sprint 1 (Week 1-2): Android project setup, basic screens
- Sprint 2 (Week 3-4): Core features, navigation
- Sprint 3 (Week 5-6): Android-specific features (Google Pay, Biometrics)
- Sprint 4 (Week 7-8): Testing, optimization, internal testing
- Sprint 5 (Week 9-10): Play Store submission, production rollout

**Total Duration:** 10 weeks
**Story Points:** 13