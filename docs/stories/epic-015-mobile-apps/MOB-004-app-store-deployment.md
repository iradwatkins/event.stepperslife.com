# MOB-004: App Store Deployment

**Epic:** EPIC-015 Mobile Applications
**Story Points:** 5
**Priority:** High
**Status:** Not Started

---

## User Story

**As a** product owner
**I want** streamlined app store deployment processes for both iOS and Android
**So that** we can efficiently publish updates, manage beta testing, and maintain high-quality releases across both platforms

---

## Acceptance Criteria

### 1. App Store Connect Setup (iOS)
- [ ] Apple Developer account configured
- [ ] App Store Connect app record created
- [ ] App ID and bundle identifier registered
- [ ] Certificates and provisioning profiles set up
- [ ] TestFlight enabled and configured
- [ ] App Store review team contact established
- [ ] Age ratings and content advisories configured

### 2. Google Play Console Setup (Android)
- [ ] Google Play Developer account configured
- [ ] App listing created
- [ ] Package name registered
- [ ] App signing key generated and secured
- [ ] Play App Signing enrolled
- [ ] Internal testing track configured
- [ ] Closed testing track configured
- [ ] Open testing track configured (optional)

### 3. Beta Testing Infrastructure
- [ ] TestFlight external testing group (iOS)
- [ ] TestFlight internal testing group (iOS)
- [ ] Google Play internal testing track (Android)
- [ ] Google Play closed beta track (Android)
- [ ] Beta tester recruitment process
- [ ] Feedback collection mechanism
- [ ] Crash reporting and analytics
- [ ] Beta testing documentation

### 4. Release Management
- [ ] Version numbering strategy (semantic versioning)
- [ ] Build number increment automation
- [ ] Release notes template
- [ ] Staged rollout strategy (Android)
- [ ] Phased release strategy (iOS)
- [ ] Rollback procedures
- [ ] Emergency hotfix process
- [ ] Release calendar and scheduling

### 5. Analytics Integration
- [ ] Firebase Analytics configured
- [ ] Google Analytics 4 (if separate)
- [ ] Amplitude SDK integrated
- [ ] Custom event tracking implemented
- [ ] User property tracking
- [ ] Conversion funnel tracking
- [ ] Crash reporting (Crashlytics, Sentry)
- [ ] Performance monitoring

### 6. App Store Optimization (ASO)
- [ ] Keyword research completed
- [ ] App name and subtitle optimized
- [ ] App description optimized (both stores)
- [ ] Screenshots and preview videos created
- [ ] Feature graphic designed (Android)
- [ ] App icon A/B testing setup
- [ ] Localization for key markets
- [ ] Review management strategy

### 7. Compliance and Legal
- [ ] Privacy policy published and linked
- [ ] Terms of service published
- [ ] Data safety questionnaire completed (Android)
- [ ] Privacy nutrition label completed (iOS)
- [ ] COPPA compliance verified
- [ ] GDPR compliance verified
- [ ] California Privacy Rights Act compliance
- [ ] Third-party SDK disclosures

### 8. Post-Launch Monitoring
- [ ] App Store reviews monitoring
- [ ] Play Store reviews monitoring
- [ ] Crash rate monitoring (< 0.5%)
- [ ] ANR rate monitoring (< 0.1% for Android)
- [ ] User retention tracking
- [ ] Conversion rate monitoring
- [ ] Load time monitoring
- [ ] API error rate monitoring

---

## Technical Specifications

### CI/CD Pipeline Configuration

#### Fastlane Setup (iOS & Android)
```ruby
# fastlane/Fastfile
default_platform(:ios)

platform :ios do
  desc "Push a new beta build to TestFlight"
  lane :beta do
    increment_build_number(xcodeproj: "EventsSteppersLife.xcodeproj")
    build_app(
      scheme: "EventsSteppersLife",
      export_method: "app-store",
      export_options: {
        provisioningProfiles: {
          "com.stepperslife.events" => "EventsSteppersLife AppStore"
        }
      }
    )
    upload_to_testflight(
      skip_waiting_for_build_processing: true,
      distribute_external: true,
      groups: ["External Testers"]
    )
    slack(
      message: "New iOS beta build uploaded to TestFlight!",
      success: true
    )
  end

  desc "Deploy to App Store"
  lane :release do
    increment_version_number(
      bump_type: "patch" # or "minor" or "major"
    )
    increment_build_number
    build_app(scheme: "EventsSteppersLife")
    upload_to_app_store(
      submit_for_review: true,
      automatic_release: false,
      phased_release: true,
      submission_information: {
        add_id_info_uses_idfa: false
      }
    )
    slack(
      message: "New iOS app submitted for review!",
      success: true
    )
  end
end

platform :android do
  desc "Push a new beta build to Play Console"
  lane :beta do
    increment_version_code(
      gradle_file_path: "app/build.gradle"
    )
    gradle(
      task: "bundle",
      build_type: "Release"
    )
    upload_to_play_store(
      track: "internal",
      release_status: "completed",
      aab: "app/build/outputs/bundle/release/app-release.aab"
    )
    slack(
      message: "New Android beta build uploaded to Play Console!",
      success: true
    )
  end

  desc "Deploy to Play Store"
  lane :release do
    increment_version_code
    gradle(
      task: "bundle",
      build_type: "Release"
    )
    upload_to_play_store(
      track: "production",
      release_status: "inProgress",
      rollout: "0.1", # 10% rollout
      aab: "app/build/outputs/bundle/release/app-release.aab"
    )
    slack(
      message: "New Android app deployed with 10% rollout!",
      success: true
    )
  end

  desc "Promote rollout to next stage"
  lane :promote do |options|
    percentage = options[:percentage] || 0.5
    upload_to_play_store(
      track: "production",
      rollout: percentage.to_s,
      skip_upload_apk: true,
      skip_upload_aab: true,
      skip_upload_metadata: true,
      skip_upload_changelogs: true,
      skip_upload_images: true,
      skip_upload_screenshots: true
    )
    slack(
      message: "Android rollout promoted to #{(percentage * 100).to_i}%!",
      success: true
    )
  end
end
```

### GitHub Actions Workflow
```yaml
# .github/workflows/mobile-release.yml
name: Mobile App Release

on:
  push:
    tags:
      - 'v*'

jobs:
  ios-release:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Install CocoaPods
        run: cd ios && pod install

      - name: Setup Ruby
        uses: ruby/setup-ruby@v1
        with:
          ruby-version: '3.0'

      - name: Install Fastlane
        run: gem install fastlane

      - name: Build and upload to TestFlight
        env:
          MATCH_PASSWORD: ${{ secrets.MATCH_PASSWORD }}
          FASTLANE_APPLE_APPLICATION_SPECIFIC_PASSWORD: ${{ secrets.FASTLANE_APPLE_PASSWORD }}
          APP_STORE_CONNECT_API_KEY_KEY_ID: ${{ secrets.APP_STORE_CONNECT_API_KEY_ID }}
          APP_STORE_CONNECT_API_KEY_ISSUER_ID: ${{ secrets.APP_STORE_CONNECT_API_ISSUER_ID }}
          APP_STORE_CONNECT_API_KEY_KEY: ${{ secrets.APP_STORE_CONNECT_API_KEY }}
        run: cd ios && fastlane beta

  android-release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Setup Java
        uses: actions/setup-java@v3
        with:
          distribution: 'temurin'
          java-version: '17'

      - name: Setup Ruby
        uses: ruby/setup-ruby@v1
        with:
          ruby-version: '3.0'

      - name: Install Fastlane
        run: gem install fastlane

      - name: Decode keystore
        env:
          KEYSTORE_BASE64: ${{ secrets.KEYSTORE_BASE64 }}
        run: echo $KEYSTORE_BASE64 | base64 -d > android/app/release.keystore

      - name: Build and upload to Play Console
        env:
          KEYSTORE_PASSWORD: ${{ secrets.KEYSTORE_PASSWORD }}
          KEY_ALIAS: ${{ secrets.KEY_ALIAS }}
          KEY_PASSWORD: ${{ secrets.KEY_PASSWORD }}
          PLAY_STORE_CONFIG_JSON: ${{ secrets.PLAY_STORE_CONFIG_JSON }}
        run: |
          echo $PLAY_STORE_CONFIG_JSON > android/play-store-credentials.json
          cd android && fastlane beta

      - name: Upload APK artifact
        uses: actions/upload-artifact@v3
        with:
          name: app-release
          path: android/app/build/outputs/bundle/release/app-release.aab
```

### Version Management Script
```typescript
// scripts/version-bump.ts
import { readFileSync, writeFileSync } from 'fs';
import { execSync } from 'child_process';

type BumpType = 'major' | 'minor' | 'patch';

class VersionManager {
  private packageJsonPath = './package.json';
  private iosProjectPath = './ios/EventsSteppersLife.xcodeproj/project.pbxproj';
  private androidGradlePath = './android/app/build.gradle';

  bump(type: BumpType): void {
    const packageJson = JSON.parse(readFileSync(this.packageJsonPath, 'utf8'));
    const currentVersion = packageJson.version;
    const newVersion = this.calculateNewVersion(currentVersion, type);

    // Update package.json
    packageJson.version = newVersion;
    writeFileSync(this.packageJsonPath, JSON.stringify(packageJson, null, 2));

    // Update iOS
    this.updateiOSVersion(newVersion);

    // Update Android
    this.updateAndroidVersion(newVersion);

    // Create git tag
    execSync(`git tag -a v${newVersion} -m "Release v${newVersion}"`);

    console.log(`Version bumped from ${currentVersion} to ${newVersion}`);
  }

  private calculateNewVersion(current: string, type: BumpType): string {
    const [major, minor, patch] = current.split('.').map(Number);

    switch (type) {
      case 'major':
        return `${major + 1}.0.0`;
      case 'minor':
        return `${major}.${minor + 1}.0`;
      case 'patch':
        return `${major}.${minor}.${patch + 1}`;
    }
  }

  private updateiOSVersion(version: string): void {
    execSync(`cd ios && agvtool new-marketing-version ${version}`);
    execSync(`cd ios && agvtool next-version -all`);
  }

  private updateAndroidVersion(version: string): void {
    const gradle = readFileSync(this.androidGradlePath, 'utf8');

    // Update versionName
    const updatedGradle = gradle.replace(
      /versionName ".*"/,
      `versionName "${version}"`
    );

    // Increment versionCode
    const versionCodeMatch = updatedGradle.match(/versionCode (\d+)/);
    if (versionCodeMatch) {
      const currentCode = parseInt(versionCodeMatch[1]);
      const newCode = currentCode + 1;
      const finalGradle = updatedGradle.replace(
        /versionCode \d+/,
        `versionCode ${newCode}`
      );
      writeFileSync(this.androidGradlePath, finalGradle);
    }
  }
}

// Usage
const manager = new VersionManager();
const bumpType = (process.argv[2] as BumpType) || 'patch';
manager.bump(bumpType);
```

### Firebase Analytics Setup
```typescript
// src/analytics/FirebaseAnalytics.ts
import analytics from '@react-native-firebase/analytics';

export class FirebaseAnalyticsService {
  static async logEvent(eventName: string, params?: Record<string, any>): Promise<void> {
    await analytics().logEvent(eventName, params);
  }

  static async setUserId(userId: string): Promise<void> {
    await analytics().setUserId(userId);
  }

  static async setUserProperty(name: string, value: string): Promise<void> {
    await analytics().setUserProperty(name, value);
  }

  static async logScreenView(screenName: string, screenClass?: string): Promise<void> {
    await analytics().logScreenView({
      screen_name: screenName,
      screen_class: screenClass || screenName,
    });
  }

  // E-commerce events
  static async logPurchase(
    value: number,
    currency: string,
    items: any[]
  ): Promise<void> {
    await analytics().logPurchase({
      value,
      currency,
      items,
      transaction_id: `txn_${Date.now()}`,
    });
  }

  static async logBeginCheckout(
    value: number,
    currency: string,
    items: any[]
  ): Promise<void> {
    await analytics().logBeginCheckout({
      value,
      currency,
      items,
    });
  }

  static async logAddToCart(item: any): Promise<void> {
    await analytics().logAddToCart({
      items: [item],
      value: item.price,
      currency: 'USD',
    });
  }
}
```

### Amplitude Analytics Setup
```typescript
// src/analytics/AmplitudeAnalytics.ts
import { Amplitude } from '@amplitude/react-native';

export class AmplitudeAnalyticsService {
  private static amplitude: Amplitude;

  static async initialize(apiKey: string): Promise<void> {
    this.amplitude = Amplitude.getInstance();
    await this.amplitude.init(apiKey);
  }

  static async logEvent(eventName: string, properties?: Record<string, any>): Promise<void> {
    await this.amplitude.logEvent(eventName, properties);
  }

  static async setUserId(userId: string): Promise<void> {
    await this.amplitude.setUserId(userId);
  }

  static async setUserProperties(properties: Record<string, any>): Promise<void> {
    const identify = new this.amplitude.Identify();
    Object.entries(properties).forEach(([key, value]) => {
      identify.set(key, value);
    });
    await this.amplitude.identify(identify);
  }

  static async logRevenue(amount: number, productId: string): Promise<void> {
    const revenue = new this.amplitude.Revenue()
      .setProductId(productId)
      .setPrice(amount);
    await this.amplitude.logRevenueV2(revenue);
  }
}
```

### Crash Reporting Setup
```typescript
// src/monitoring/CrashReporting.ts
import crashlytics from '@react-native-firebase/crashlytics';
import * as Sentry from '@sentry/react-native';

export class CrashReportingService {
  static initializeSentry(): void {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: __DEV__ ? 'development' : 'production',
      enableAutoSessionTracking: true,
      tracesSampleRate: 1.0,
    });
  }

  static async logError(error: Error, context?: Record<string, any>): Promise<void> {
    // Firebase Crashlytics
    await crashlytics().recordError(error);
    if (context) {
      await crashlytics().log(JSON.stringify(context));
    }

    // Sentry
    Sentry.captureException(error, { extra: context });
  }

  static async setUser(userId: string, email?: string, username?: string): Promise<void> {
    // Firebase
    await crashlytics().setUserId(userId);
    if (email) await crashlytics().setAttribute('email', email);
    if (username) await crashlytics().setAttribute('username', username);

    // Sentry
    Sentry.setUser({ id: userId, email, username });
  }

  static async logMessage(message: string, level: 'info' | 'warning' | 'error' = 'info'): Promise<void> {
    await crashlytics().log(message);

    const sentryLevel = level === 'error' ? Sentry.Severity.Error :
                        level === 'warning' ? Sentry.Severity.Warning :
                        Sentry.Severity.Info;
    Sentry.captureMessage(message, sentryLevel);
  }
}
```

### App Store Assets Generator
```typescript
// scripts/generate-store-assets.ts
import sharp from 'sharp';
import { mkdirSync, existsSync } from 'fs';

const APP_ICON_SIZES = {
  ios: [
    { size: 1024, name: 'AppIcon-1024.png' },
    { size: 180, name: 'AppIcon-60@3x.png' },
    { size: 120, name: 'AppIcon-60@2x.png' },
    { size: 87, name: 'AppIcon-29@3x.png' },
    { size: 80, name: 'AppIcon-40@2x.png' },
  ],
  android: [
    { size: 512, name: 'ic_launcher-512.png', folder: 'xxxhdpi' },
    { size: 192, name: 'ic_launcher.png', folder: 'xxxhdpi' },
    { size: 144, name: 'ic_launcher.png', folder: 'xxhdpi' },
    { size: 96, name: 'ic_launcher.png', folder: 'xhdpi' },
    { size: 72, name: 'ic_launcher.png', folder: 'hdpi' },
    { size: 48, name: 'ic_launcher.png', folder: 'mdpi' },
  ],
};

class StoreAssetsGenerator {
  async generateAppIcons(sourcePath: string): Promise<void> {
    // iOS icons
    const iosDir = './ios/EventsSteppersLife/Images.xcassets/AppIcon.appiconset';
    if (!existsSync(iosDir)) mkdirSync(iosDir, { recursive: true });

    for (const icon of APP_ICON_SIZES.ios) {
      await sharp(sourcePath)
        .resize(icon.size, icon.size)
        .toFile(`${iosDir}/${icon.name}`);
    }

    // Android icons
    for (const icon of APP_ICON_SIZES.android) {
      const androidDir = `./android/app/src/main/res/mipmap-${icon.folder}`;
      if (!existsSync(androidDir)) mkdirSync(androidDir, { recursive: true });

      await sharp(sourcePath)
        .resize(icon.size, icon.size)
        .toFile(`${androidDir}/${icon.name}`);
    }

    console.log('App icons generated successfully!');
  }

  async generateScreenshots(): Promise<void> {
    // Generate screenshots using device simulator
    // Or use tools like fastlane snapshot
    console.log('Use fastlane snapshot to generate screenshots');
  }
}

// Usage
const generator = new StoreAssetsGenerator();
generator.generateAppIcons('./assets/app-icon-1024.png');
```

### Beta Testing Feedback Form
```typescript
// src/screens/BetaFeedback.tsx
import React, { useState } from 'react';
import { View, TextInput, Button, Alert } from 'react-native';

export const BetaFeedbackScreen: React.FC = () => {
  const [feedback, setFeedback] = useState('');
  const [rating, setRating] = useState(0);

  const submitFeedback = async () => {
    try {
      await fetch('/api/beta-feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          feedback,
          rating,
          version: DeviceInfo.getVersion(),
          buildNumber: DeviceInfo.getBuildNumber(),
          device: DeviceInfo.getModel(),
          os: Platform.OS,
          osVersion: DeviceInfo.getSystemVersion(),
        }),
      });

      Alert.alert('Thank you!', 'Your feedback has been submitted.');
      setFeedback('');
      setRating(0);
    } catch (error) {
      Alert.alert('Error', 'Failed to submit feedback');
    }
  };

  return (
    <View>
      {/* Feedback form UI */}
    </View>
  );
};
```

---

## Testing Requirements

### Pre-Release Checklist
```markdown
## iOS Pre-Release
- [ ] TestFlight beta testing (min 25 testers, 7 days)
- [ ] All TestFlight feedback addressed
- [ ] No crash reports in TestFlight
- [ ] App Store Connect metadata complete
- [ ] Screenshots reviewed and approved
- [ ] Privacy policy reviewed
- [ ] App Review notes prepared

## Android Pre-Release
- [ ] Internal testing (min 20 testers, 7 days)
- [ ] Closed beta testing (min 50 testers, 7 days)
- [ ] All Play Console feedback addressed
- [ ] No crash reports in Pre-launch Report
- [ ] Data safety form accurate
- [ ] Store listing reviewed
- [ ] Staged rollout plan confirmed

## Cross-Platform
- [ ] Analytics events firing correctly
- [ ] Crash reporting working
- [ ] Push notifications tested
- [ ] Deep links verified
- [ ] Payment flows tested
- [ ] Performance benchmarks met
```

---

## Third-Party Services

### Required Accounts
1. **Apple Developer Program** - $99/year
2. **Google Play Console** - $25 one-time
3. **Firebase** - Free (Spark) or Blaze plan
4. **Sentry** - Free tier or paid
5. **Amplitude** - Free tier or growth plan
6. **Fastlane Match** - For iOS code signing

---

## Definition of Done

- [ ] All acceptance criteria met
- [ ] CI/CD pipelines configured and tested
- [ ] Beta testing completed on both platforms
- [ ] Analytics tracking verified
- [ ] Crash reporting verified
- [ ] App Store Connect configured
- [ ] Google Play Console configured
- [ ] Release documentation complete
- [ ] Team trained on deployment process
- [ ] Rollback procedures tested

---

## Dependencies

- MOB-002: iOS app development (prerequisite)
- MOB-003: Android app development (prerequisite)
- MOB-007: App analytics integration (parallel)

---

## Estimated Timeline

- Week 1: App Store Connect & Play Console setup
- Week 2: CI/CD pipeline configuration
- Week 3: Beta testing infrastructure
- Week 4: Analytics integration
- Week 5: Beta testing period
- Week 6: Store submission and launch

**Total Duration:** 6 weeks
**Story Points:** 5