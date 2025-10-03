# MOB-002: iOS App Development

**Epic:** EPIC-015 Mobile Applications
**Story Points:** 13
**Priority:** High
**Status:** Not Started

---

## User Story

**As a** mobile iOS user
**I want** a native iOS app for Events SteppersLife
**So that** I can purchase tickets, manage my orders, and access event information directly from my iPhone or iPad with native iOS features

---

## Acceptance Criteria

### 1. Native iOS App Foundation
- [ ] React Native iOS app with TypeScript setup
- [ ] iOS 15.0+ minimum deployment target
- [ ] Universal app (iPhone and iPad support)
- [ ] Dark mode support
- [ ] iOS design language compliance (Human Interface Guidelines)
- [ ] Proper status bar, safe area, and notch handling
- [ ] Dynamic Type support for accessibility
- [ ] VoiceOver compatibility

### 2. App Store Submission
- [ ] Apple Developer account setup
- [ ] App Store Connect configuration
- [ ] App metadata and screenshots (all required sizes)
- [ ] Privacy policy and terms of service
- [ ] App Review Information complete
- [ ] TestFlight beta testing setup
- [ ] Successful App Store approval
- [ ] Production release published

### 3. iOS-Specific Features
- [ ] Face ID / Touch ID authentication
- [ ] Apple Pay integration for ticket purchases
- [ ] Apple Wallet pass integration for tickets
- [ ] Sign in with Apple
- [ ] iOS share sheet integration
- [ ] Haptic feedback for interactions
- [ ] 3D Touch / Haptic Touch quick actions
- [ ] Spotlight search integration

### 4. Push Notifications (APNs)
- [ ] Apple Push Notification service (APNs) configuration
- [ ] Push notification certificate setup
- [ ] Notification permissions handling
- [ ] Rich notifications with images and actions
- [ ] Background notification handling
- [ ] Notification center integration
- [ ] Badge count management
- [ ] Silent push for data updates

### 5. Deep Linking
- [ ] Universal Links configuration
- [ ] App domain association file
- [ ] Deep link routing system
- [ ] Handle event/:id links
- [ ] Handle ticket/:id links
- [ ] Handle order/:id links
- [ ] Launch handling from notifications
- [ ] Launch handling from Safari/email

### 6. Performance Optimization
- [ ] App launch time < 2 seconds
- [ ] 60fps scrolling on all devices
- [ ] Image caching and optimization
- [ ] Memory management (no leaks)
- [ ] Background task optimization
- [ ] Network request optimization
- [ ] Bundle size optimization
- [ ] Code splitting and lazy loading

### 7. Security
- [ ] Certificate pinning for API calls
- [ ] Keychain storage for sensitive data
- [ ] Secure credential management
- [ ] Biometric authentication integration
- [ ] App Transport Security (ATS) compliance
- [ ] Jailbreak detection
- [ ] Secure payment handling
- [ ] Data encryption at rest

### 8. Testing
- [ ] XCTest unit tests (>80% coverage)
- [ ] XCUITest integration tests
- [ ] TestFlight beta testing cycle
- [ ] Real device testing (iPhone 11-15, iPad)
- [ ] Different iOS versions (15.0-17.x)
- [ ] Performance profiling with Instruments
- [ ] Memory leak detection
- [ ] Crash-free rate > 99.5%

---

## Technical Specifications

### Tech Stack
```yaml
Framework: React Native 0.72+
Language: TypeScript 5.0+
Build Tool: Xcode 15+
Package Manager: npm/yarn
State Management: Redux Toolkit / Zustand
Navigation: React Navigation
UI Components: React Native Paper / Native Base
```

### iOS-Specific Libraries
```json
{
  "@react-native-community/push-notification-ios": "^1.11.0",
  "react-native-biometrics": "^3.0.1",
  "react-native-wallet-manager": "^1.0.6",
  "@invertase/react-native-apple-authentication": "^2.2.2",
  "react-native-iap": "^12.10.5",
  "react-native-haptic-feedback": "^2.2.0",
  "react-native-splash-screen": "^3.3.0",
  "react-native-config": "^1.5.1",
  "react-native-keychain": "^8.1.2"
}
```

### Project Structure
```
ios/
├── EventsSteppersLife/
│   ├── Info.plist                  # App configuration
│   ├── AppDelegate.mm              # App lifecycle
│   ├── EventsSteppersLife.entitlements
│   └── Images.xcassets/            # App icons, splash
├── EventsSteppersLife.xcodeproj/
├── EventsSteppersLifeTests/
└── Podfile                         # CocoaPods dependencies

src/
├── ios/
│   ├── FaceID/                     # Biometric auth
│   ├── ApplePay/                   # Payment integration
│   ├── Wallet/                     # Wallet pass integration
│   ├── Notifications/              # APNs handling
│   └── DeepLinking/                # Universal Links
```

### Info.plist Configuration
```xml
<dict>
    <!-- Face ID -->
    <key>NSFaceIDUsageDescription</key>
    <string>We use Face ID to securely authenticate your account</string>

    <!-- Camera (for QR scanning) -->
    <key>NSCameraUsageDescription</key>
    <string>We need camera access to scan QR codes at events</string>

    <!-- Notifications -->
    <key>UIBackgroundModes</key>
    <array>
        <string>remote-notification</string>
    </array>

    <!-- Universal Links -->
    <key>com.apple.developer.associated-domains</key>
    <array>
        <string>applinks:events.stepperslife.com</string>
    </array>

    <!-- Apple Pay -->
    <key>com.apple.developer.in-app-payments</key>
    <array>
        <string>merchant.com.stepperslife.events</string>
    </array>
</dict>
```

### Apple Pay Integration
```typescript
// src/ios/ApplePay/ApplePayService.ts
import { PaymentRequest, PKPaymentButton } from 'react-native-wallet-manager';

export class ApplePayService {
  static async canMakePayments(): Promise<boolean> {
    return await ApplePay.canMakePayments();
  }

  static async processPayment(
    amount: number,
    eventTitle: string
  ): Promise<PaymentToken> {
    const paymentRequest: PaymentRequest = {
      merchantIdentifier: 'merchant.com.stepperslife.events',
      supportedNetworks: ['visa', 'mastercard', 'amex', 'discover'],
      countryCode: 'US',
      currencyCode: 'USD',
      paymentSummaryItems: [
        {
          label: eventTitle,
          amount: amount.toFixed(2),
        },
      ],
      merchantCapabilities: ['3DS', 'debit', 'credit'],
    };

    const token = await ApplePay.show(paymentRequest);
    return token;
  }
}
```

### Face ID Authentication
```typescript
// src/ios/FaceID/BiometricAuth.ts
import ReactNativeBiometrics from 'react-native-biometrics';

export class BiometricAuthService {
  static async isBiometricsAvailable(): Promise<boolean> {
    const { available, biometryType } = await ReactNativeBiometrics.isSensorAvailable();
    return available && (biometryType === 'FaceID' || biometryType === 'TouchID');
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

  static async createKeys(): Promise<string> {
    const { publicKey } = await ReactNativeBiometrics.createKeys();
    return publicKey;
  }
}
```

### Apple Wallet Pass Integration
```typescript
// src/ios/Wallet/WalletPassService.ts
import PassKit from 'react-native-wallet-manager';

interface TicketPassData {
  ticketId: string;
  eventName: string;
  eventDate: string;
  venueName: string;
  qrCode: string;
}

export class WalletPassService {
  static async addTicketToWallet(ticket: TicketPassData): Promise<void> {
    // Generate pass on backend
    const passUrl = await this.generatePassUrl(ticket);

    // Check if wallet is available
    const canAddPasses = await PassKit.canAddPasses();
    if (!canAddPasses) {
      throw new Error('Apple Wallet not available');
    }

    // Add pass to wallet
    await PassKit.addPass(passUrl);
  }

  private static async generatePassUrl(ticket: TicketPassData): Promise<string> {
    const response = await fetch('/api/tickets/generate-wallet-pass', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(ticket),
    });
    const { passUrl } = await response.json();
    return passUrl;
  }
}
```

### Push Notifications Setup
```typescript
// src/ios/Notifications/PushNotificationService.ts
import PushNotificationIOS from '@react-native-community/push-notification-ios';

export class PushNotificationService {
  static async requestPermissions(): Promise<boolean> {
    const permissions = await PushNotificationIOS.requestPermissions();
    return permissions.alert && permissions.badge && permissions.sound;
  }

  static async getDeviceToken(): Promise<string> {
    return new Promise((resolve, reject) => {
      PushNotificationIOS.addEventListener('register', (token) => {
        resolve(token);
      });
      PushNotificationIOS.addEventListener('registrationError', (error) => {
        reject(error);
      });
    });
  }

  static setupNotificationHandlers(): void {
    // Handle notification received while app in foreground
    PushNotificationIOS.addEventListener('notification', (notification) => {
      const data = notification.getData();
      this.handleNotification(data);
      notification.finish(PushNotificationIOS.FetchResult.NoData);
    });

    // Handle notification opened
    PushNotificationIOS.addEventListener('localNotification', (notification) => {
      const data = notification.getData();
      this.handleNotificationOpen(data);
    });
  }

  private static handleNotification(data: any): void {
    // Show in-app notification
    console.log('Received notification:', data);
  }

  private static handleNotificationOpen(data: any): void {
    // Navigate to relevant screen
    console.log('Notification opened:', data);
  }
}
```

### Deep Linking Configuration
```typescript
// src/ios/DeepLinking/DeepLinkingService.ts
import { Linking } from 'react-native';

export class DeepLinkingService {
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
    if (route) {
      // Navigate using React Navigation
      // navigationRef.current?.navigate(route.screen, route.params);
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

    return null;
  }
}

interface DeepLinkRoute {
  screen: string;
  params: Record<string, string>;
}
```

### App Store Submission Checklist
```markdown
## Pre-Submission
- [ ] App built in Release mode
- [ ] No console.log statements in production
- [ ] All API endpoints use HTTPS
- [ ] Privacy policy URL configured
- [ ] Terms of service URL configured
- [ ] Support URL configured
- [ ] App icons (all sizes: 1024x1024, 180x180, 120x120, etc.)
- [ ] Launch screens (all devices)
- [ ] Screenshots (6.5", 6.7", 5.5" displays)

## App Store Connect
- [ ] App name and subtitle
- [ ] Primary/secondary category
- [ ] App description (4000 chars)
- [ ] Keywords (100 chars)
- [ ] Age rating questionnaire
- [ ] Copyright information
- [ ] Contact information
- [ ] App Review notes

## Privacy & Permissions
- [ ] Privacy nutrition label filled
- [ ] Data collection practices declared
- [ ] Third-party SDK disclosures
- [ ] Tracking authorization (if applicable)

## Build Upload
- [ ] Archive created in Xcode
- [ ] Build uploaded to App Store Connect
- [ ] Processing completed (15-30 mins)
- [ ] Build selected for review
- [ ] Submit for review
```

---

## Testing Requirements

### Unit Tests
```typescript
// __tests__/ios/BiometricAuth.test.ts
describe('BiometricAuthService', () => {
  it('should check biometric availability', async () => {
    const available = await BiometricAuthService.isBiometricsAvailable();
    expect(typeof available).toBe('boolean');
  });

  it('should authenticate user with Face ID', async () => {
    const result = await BiometricAuthService.authenticate('Test authentication');
    expect(typeof result).toBe('boolean');
  });
});
```

### Integration Tests (XCUITest)
```swift
// EventsSteppersLifeUITests.swift
class EventsSteppersLifeUITests: XCTestCase {
    func testAppLaunch() {
        let app = XCUIApplication()
        app.launch()

        // Verify home screen loads
        XCTAssertTrue(app.staticTexts["Welcome"].exists)
    }

    func testEventPurchaseFlow() {
        let app = XCUIApplication()
        app.launch()

        // Navigate to event
        app.buttons["Browse Events"].tap()
        app.tables.cells.firstMatch.tap()

        // Purchase ticket
        app.buttons["Buy Tickets"].tap()
        app.textFields["Quantity"].tap()
        app.textFields["Quantity"].typeText("2")
        app.buttons["Continue"].tap()

        // Verify checkout screen
        XCTAssertTrue(app.staticTexts["Checkout"].exists)
    }
}
```

### TestFlight Beta Testing
- Minimum 25 external testers
- Test on various devices (iPhone 11-15, iPad)
- Test on iOS 15.0, 16.0, 17.0
- Collect feedback via TestFlight
- Monitor crash reports
- Address critical issues before release

---

## Third-Party Integrations

### Required Services
1. **Apple Developer Program** - $99/year
2. **App Store Connect** - App management
3. **Firebase** - Analytics, Crashlytics, Remote Config
4. **Sentry** - Error tracking
5. **Amplitude** - Product analytics
6. **Branch.io** - Deep linking attribution
7. **RevenueCat** - In-app purchase management (if needed)

### Firebase Configuration
```typescript
// ios/GoogleService-Info.plist downloaded from Firebase Console
// Added to Xcode project

import firebase from '@react-native-firebase/app';
import analytics from '@react-native-firebase/analytics';
import crashlytics from '@react-native-firebase/crashlytics';

export const initializeFirebase = () => {
  analytics().logAppOpen();
  crashlytics().log('App initialized');
};
```

---

## Definition of Done

- [ ] All acceptance criteria met
- [ ] Code reviewed and approved
- [ ] Unit tests passing (>80% coverage)
- [ ] Integration tests passing
- [ ] Performance benchmarks met
- [ ] No memory leaks detected
- [ ] TestFlight beta completed
- [ ] App Store approved
- [ ] Production release published
- [ ] Documentation updated
- [ ] Analytics tracking verified

---

## Notes

- **App Store Review Time**: Typically 24-48 hours
- **Rejection Reasons**: Most common are incomplete features, crashes, privacy issues
- **Version Numbering**: Use semantic versioning (1.0.0)
- **Build Numbers**: Increment for each upload
- **Certificate Expiry**: Distribution certificates expire annually

---

## Dependencies

- MOB-001: Mobile app architecture setup (prerequisite)
- MOB-005: Push notification system (parallel)
- MOB-006: Mobile-specific features (parallel)
- PAY-001: Square payment integration (prerequisite)

---

## Estimated Timeline

- Sprint 1 (Week 1-2): iOS project setup, basic screens
- Sprint 2 (Week 3-4): Core features, navigation
- Sprint 3 (Week 5-6): iOS-specific features (Apple Pay, Face ID, Wallet)
- Sprint 4 (Week 7-8): Testing, optimization, TestFlight
- Sprint 5 (Week 9-10): App Store submission, launch

**Total Duration:** 10 weeks
**Story Points:** 13