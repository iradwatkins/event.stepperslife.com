# MOB-008: App Update Mechanisms

**Epic:** EPIC-015 Mobile Applications
**Story Points:** 3
**Priority:** Medium
**Status:** Not Started

---

## User Story

**As a** product team
**I want** seamless app update mechanisms including OTA updates and version management
**So that** we can quickly deploy bug fixes, push new features, and ensure users always have the latest version

---

## Acceptance Criteria

### 1. Over-the-Air (OTA) Updates
- [ ] CodePush integration for React Native updates
- [ ] Silent background updates for minor changes
- [ ] Optional updates (user can skip)
- [ ] Mandatory updates for critical fixes
- [ ] Update download progress indicator
- [ ] Rollback capability for failed updates
- [ ] Staged rollout (10% → 50% → 100%)
- [ ] Update size optimization

### 2. Force Update Logic
- [ ] Minimum version enforcement
- [ ] API version compatibility checking
- [ ] Force update dialog (cannot dismiss)
- [ ] Direct link to App Store / Play Store
- [ ] Grace period for updates
- [ ] Bypass mechanism for internal testing
- [ ] Configurable via remote config
- [ ] Clear update messaging

### 3. What's New Screen
- [ ] Release notes display after update
- [ ] Feature highlights with visuals
- [ ] Video tutorials for major features
- [ ] Skip/dismiss functionality
- [ ] "Don't show again" option
- [ ] Deep links to new features
- [ ] Analytics on engagement
- [ ] A/B testing for content

### 4. Version Compatibility
- [ ] Server API version checking
- [ ] Deprecation warnings
- [ ] Graceful degradation for old versions
- [ ] Feature flags for version-specific features
- [ ] Backend compatibility matrix
- [ ] Client-side version validation
- [ ] Sunset old versions strategy
- [ ] Migration guides for breaking changes

### 5. Update Notifications
- [ ] In-app update available banner
- [ ] Push notification for critical updates
- [ ] Badge indicator for optional updates
- [ ] Update changelog display
- [ ] Scheduled maintenance notices
- [ ] Downtime warnings
- [ ] Update frequency preferences
- [ ] Notification throttling

### 6. Rollback Capability
- [ ] Automatic rollback on crash rate spike
- [ ] Manual rollback via admin panel
- [ ] Version history tracking
- [ ] Rollback to last stable version
- [ ] User data preservation during rollback
- [ ] Rollback notification to users
- [ ] Metrics for rollback triggers
- [ ] Post-rollback analysis

### 7. Testing & QA
- [ ] Staging environment for OTA updates
- [ ] Internal testing track for updates
- [ ] Beta tester group for early access
- [ ] Automated update testing
- [ ] Crash rate monitoring post-update
- [ ] Performance regression testing
- [ ] Update success rate > 99%
- [ ] Rollback testing

### 8. User Experience
- [ ] Seamless update installation
- [ ] No data loss during updates
- [ ] Quick restart after update (< 3s)
- [ ] Update size indicator
- [ ] WiFi-only update option
- [ ] Battery level check before update
- [ ] Storage space validation
- [ ] Clear progress communication

---

## Technical Specifications

### CodePush Setup
```bash
# Install CodePush CLI
npm install -g appcenter-cli

# Login to App Center
appcenter login

# Create apps
appcenter apps create -d EventsSteppersLife-iOS -o iOS -p React-Native
appcenter apps create -d EventsSteppersLife-Android -o Android -p React-Native

# Generate deployment keys
appcenter codepush deployment list -a <username>/EventsSteppersLife-iOS
appcenter codepush deployment list -a <username>/EventsSteppersLife-Android
```

### CodePush Integration
```typescript
// src/services/CodePushService.ts
import CodePush from 'react-native-code-push';
import { Alert } from 'react-native';
import { AnalyticsService } from './Analytics';

interface UpdateCheckResult {
  updateAvailable: boolean;
  isMandatory: boolean;
  description?: string;
  packageSize?: number;
}

export class CodePushService {
  static async checkForUpdate(): Promise<UpdateCheckResult> {
    try {
      const update = await CodePush.checkForUpdate();

      if (update) {
        AnalyticsService.logEvent('codepush_update_available', {
          version: update.label,
          is_mandatory: update.isMandatory,
          size: update.packageSize,
        });

        return {
          updateAvailable: true,
          isMandatory: update.isMandatory,
          description: update.description,
          packageSize: update.packageSize,
        };
      }

      return { updateAvailable: false, isMandatory: false };
    } catch (error) {
      console.error('Error checking for updates:', error);
      return { updateAvailable: false, isMandatory: false };
    }
  }

  static async downloadAndInstallUpdate(
    isMandatory: boolean,
    onDownloadProgress?: (progress: number) => void
  ): Promise<void> {
    try {
      const updateResult = await CodePush.sync(
        {
          updateDialog: isMandatory ? {
            title: 'Update Required',
            mandatoryUpdateMessage:
              'A critical update is required. The app will update now.',
            mandatoryContinueButtonLabel: 'Update',
          } : {
            title: 'Update Available',
            optionalUpdateMessage:
              'An update is available. Would you like to install it?',
            optionalInstallButtonLabel: 'Install',
            optionalIgnoreButtonLabel: 'Later',
          },
          installMode: isMandatory
            ? CodePush.InstallMode.IMMEDIATE
            : CodePush.InstallMode.ON_NEXT_RESTART,
        },
        (status) => {
          switch (status) {
            case CodePush.SyncStatus.DOWNLOADING_PACKAGE:
              AnalyticsService.logEvent('codepush_downloading');
              break;
            case CodePush.SyncStatus.INSTALLING_UPDATE:
              AnalyticsService.logEvent('codepush_installing');
              break;
            case CodePush.SyncStatus.UP_TO_DATE:
              AnalyticsService.logEvent('codepush_up_to_date');
              break;
            case CodePush.SyncStatus.UPDATE_INSTALLED:
              AnalyticsService.logEvent('codepush_installed');
              break;
          }
        },
        (progress) => {
          const percentage = (progress.receivedBytes / progress.totalBytes) * 100;
          onDownloadProgress?.(percentage);
        }
      );

      if (updateResult === CodePush.SyncStatus.UPDATE_INSTALLED) {
        Alert.alert(
          'Update Installed',
          'The update has been installed. Restart the app to see the changes.',
          [
            {
              text: 'Restart Now',
              onPress: () => CodePush.restartApp(),
            },
            { text: 'Later', style: 'cancel' },
          ]
        );
      }
    } catch (error) {
      console.error('Error downloading update:', error);
      AnalyticsService.logError(error as Error, { context: 'codepush_download' });
    }
  }

  static async rollbackToLastVersion(): Promise<void> {
    try {
      await CodePush.restartApp();
      AnalyticsService.logEvent('codepush_rollback');
    } catch (error) {
      console.error('Error rolling back:', error);
    }
  }

  static async getCurrentVersion(): Promise<string> {
    const metadata = await CodePush.getUpdateMetadata();
    return metadata?.label || 'Unknown';
  }
}

// CodePush configuration
const codePushOptions = {
  checkFrequency: CodePush.CheckFrequency.ON_APP_RESUME,
  installMode: CodePush.InstallMode.ON_NEXT_RESTART,
};

export default CodePush(codePushOptions);
```

### App.tsx Integration
```typescript
// App.tsx
import React, { useEffect, useState } from 'react';
import CodePush from 'react-native-code-push';
import { View, Text, ActivityIndicator } from 'react-native';
import { CodePushService } from './src/services/CodePushService';

const App: React.FC = () => {
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    checkForUpdates();
  }, []);

  const checkForUpdates = async () => {
    const result = await CodePushService.checkForUpdate();

    if (result.updateAvailable) {
      await CodePushService.downloadAndInstallUpdate(
        result.isMandatory,
        setDownloadProgress
      );
    }

    setIsChecking(false);
  };

  if (isChecking) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
        <Text>Checking for updates...</Text>
        {downloadProgress > 0 && (
          <Text>{downloadProgress.toFixed(0)}% downloaded</Text>
        )}
      </View>
    );
  }

  return (
    // Your app content
  );
};

export default CodePush({
  checkFrequency: CodePush.CheckFrequency.ON_APP_RESUME,
  installMode: CodePush.InstallMode.ON_NEXT_RESTART,
})(App);
```

### Force Update Service
```typescript
// src/services/ForceUpdateService.ts
import { Alert, Linking, Platform } from 'react-native';
import DeviceInfo from 'react-native-device-info';
import { RemoteConfigService } from './RemoteConfig';

export class ForceUpdateService {
  private static readonly APP_STORE_URL = 'https://apps.apple.com/app/id1234567890';
  private static readonly PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.stepperslife.events';

  static async checkForForceUpdate(): Promise<boolean> {
    try {
      const currentVersion = DeviceInfo.getVersion();
      const minVersion = await RemoteConfigService.getValue('min_app_version');

      if (this.isVersionLower(currentVersion, minVersion)) {
        this.showForceUpdateDialog();
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error checking force update:', error);
      return false;
    }
  }

  private static isVersionLower(current: string, minimum: string): boolean {
    const currentParts = current.split('.').map(Number);
    const minimumParts = minimum.split('.').map(Number);

    for (let i = 0; i < 3; i++) {
      if (currentParts[i] < minimumParts[i]) return true;
      if (currentParts[i] > minimumParts[i]) return false;
    }

    return false;
  }

  private static showForceUpdateDialog(): void {
    Alert.alert(
      'Update Required',
      'A new version of the app is available. Please update to continue using the app.',
      [
        {
          text: 'Update Now',
          onPress: () => {
            const url = Platform.OS === 'ios'
              ? this.APP_STORE_URL
              : this.PLAY_STORE_URL;
            Linking.openURL(url);
          },
        },
      ],
      { cancelable: false }
    );
  }

  static async checkAPICompatibility(apiVersion: string): Promise<boolean> {
    const supportedVersions = await RemoteConfigService.getValue('supported_api_versions');
    const versions = supportedVersions.split(',');
    return versions.includes(apiVersion);
  }
}
```

### What's New Screen
```typescript
// src/screens/WhatsNewScreen.tsx
import React from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AnalyticsService } from '../services/Analytics';

interface Feature {
  title: string;
  description: string;
  image?: string;
  videoUrl?: string;
}

const WHATS_NEW_VERSION = '1.5.0';

const features: Feature[] = [
  {
    title: 'Apple Wallet Integration',
    description: 'Add your tickets to Apple Wallet for easy access at the venue',
    image: require('../assets/feature-wallet.png'),
  },
  {
    title: 'Offline Ticket Access',
    description: 'Access your tickets even without internet connection',
    image: require('../assets/feature-offline.png'),
  },
  {
    title: 'Improved Performance',
    description: 'Faster loading times and smoother animations',
    image: require('../assets/feature-performance.png'),
  },
];

export const WhatsNewScreen: React.FC = ({ navigation }) => {
  useEffect(() => {
    AnalyticsService.logScreenView('WhatsNew');
  }, []);

  const handleContinue = async () => {
    await AsyncStorage.setItem('last_seen_whats_new', WHATS_NEW_VERSION);
    AnalyticsService.logEvent('whats_new_completed', {
      version: WHATS_NEW_VERSION,
    });
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <ScrollView>
        <Text style={styles.title}>What's New in v{WHATS_NEW_VERSION}</Text>

        {features.map((feature, index) => (
          <View key={index} style={styles.featureContainer}>
            {feature.image && (
              <Image source={feature.image} style={styles.featureImage} />
            )}
            <Text style={styles.featureTitle}>{feature.title}</Text>
            <Text style={styles.featureDescription}>{feature.description}</Text>
          </View>
        ))}
      </ScrollView>

      <TouchableOpacity style={styles.button} onPress={handleContinue}>
        <Text style={styles.buttonText}>Continue</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 20,
  },
  featureContainer: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  featureImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 12,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  featureDescription: {
    fontSize: 14,
    color: '#666',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 16,
    margin: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

// Helper to check if should show
export async function shouldShowWhatsNew(): Promise<boolean> {
  const lastSeen = await AsyncStorage.getItem('last_seen_whats_new');
  return lastSeen !== WHATS_NEW_VERSION;
}
```

### Update Banner Component
```typescript
// src/components/UpdateBanner.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { CodePushService } from '../services/CodePushService';

export const UpdateBanner: React.FC = () => {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [progress, setProgress] = useState(0);
  const slideAnim = useState(new Animated.Value(-100))[0];

  useEffect(() => {
    checkForUpdate();
  }, []);

  const checkForUpdate = async () => {
    const result = await CodePushService.checkForUpdate();
    if (result.updateAvailable && !result.isMandatory) {
      setUpdateAvailable(true);
      showBanner();
    }
  };

  const showBanner = () => {
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const hideBanner = () => {
    Animated.timing(slideAnim, {
      toValue: -100,
      duration: 300,
      useNativeDriver: true,
    }).start(() => setUpdateAvailable(false));
  };

  const handleUpdate = async () => {
    setIsDownloading(true);
    await CodePushService.downloadAndInstallUpdate(false, setProgress);
    setIsDownloading(false);
    hideBanner();
  };

  if (!updateAvailable) return null;

  return (
    <Animated.View
      style={[
        styles.banner,
        { transform: [{ translateY: slideAnim }] },
      ]}
    >
      <View style={styles.content}>
        <Text style={styles.text}>
          {isDownloading
            ? `Downloading update... ${progress.toFixed(0)}%`
            : 'A new update is available'}
        </Text>
        {!isDownloading && (
          <View style={styles.buttons}>
            <TouchableOpacity onPress={hideBanner}>
              <Text style={styles.laterButton}>Later</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleUpdate} style={styles.updateButton}>
              <Text style={styles.updateButtonText}>Update</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#007AFF',
    paddingTop: 50,
    paddingBottom: 12,
    paddingHorizontal: 16,
    zIndex: 1000,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  text: {
    color: '#fff',
    fontSize: 14,
    flex: 1,
  },
  buttons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  laterButton: {
    color: '#fff',
    marginRight: 16,
  },
  updateButton: {
    backgroundColor: '#fff',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 4,
  },
  updateButtonText: {
    color: '#007AFF',
    fontWeight: 'bold',
  },
});
```

### Deployment Script
```bash
#!/bin/bash
# scripts/deploy-codepush.sh

VERSION=$1
ENVIRONMENT=${2:-Staging}

if [ -z "$VERSION" ]; then
  echo "Usage: ./deploy-codepush.sh <version> [environment]"
  exit 1
fi

echo "Deploying CodePush update v$VERSION to $ENVIRONMENT..."

# iOS
appcenter codepush release-react \
  -a YourOrg/EventsSteppersLife-iOS \
  -d $ENVIRONMENT \
  -t $VERSION \
  --description "$(git log -1 --pretty=%B)" \
  --mandatory false \
  --rollout 10

# Android
appcenter codepush release-react \
  -a YourOrg/EventsSteppersLife-Android \
  -d $ENVIRONMENT \
  -t $VERSION \
  --description "$(git log -1 --pretty=%B)" \
  --mandatory false \
  --rollout 10

echo "Deployment complete! Monitor at appcenter.ms"
```

### Rollback Monitoring
```typescript
// src/services/RollbackMonitoring.ts
import crashlytics from '@react-native-firebase/crashlytics';
import { CodePushService } from './CodePushService';

export class RollbackMonitoring {
  private static readonly CRASH_THRESHOLD = 0.05; // 5%
  private static readonly CHECK_INTERVAL = 300000; // 5 minutes

  static async monitorCrashRate(): Promise<void> {
    setInterval(async () => {
      const crashRate = await this.getCurrentCrashRate();

      if (crashRate > this.CRASH_THRESHOLD) {
        console.warn('Crash rate threshold exceeded, initiating rollback');
        await this.initiateRollback();
      }
    }, this.CHECK_INTERVAL);
  }

  private static async getCurrentCrashRate(): Promise<number> {
    // Fetch crash rate from Firebase or backend
    // This is a simplified example
    return 0.02; // 2%
  }

  private static async initiateRollback(): Promise<void> {
    await CodePushService.rollbackToLastVersion();

    // Notify backend
    await fetch('/api/admin/rollback-alert', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        version: await CodePushService.getCurrentVersion(),
        reason: 'High crash rate',
        timestamp: new Date().toISOString(),
      }),
    });
  }
}
```

---

## Testing Requirements

### CodePush Tests
```typescript
describe('CodePushService', () => {
  it('should check for updates', async () => {
    const result = await CodePushService.checkForUpdate();
    expect(result).toHaveProperty('updateAvailable');
  });

  it('should download and install update', async () => {
    await CodePushService.downloadAndInstallUpdate(false);
    // Assert update installed
  });
});
```

### Force Update Tests
```typescript
describe('ForceUpdateService', () => {
  it('should detect outdated version', async () => {
    const needsUpdate = await ForceUpdateService.checkForForceUpdate();
    expect(typeof needsUpdate).toBe('boolean');
  });
});
```

---

## Definition of Done

- [ ] All acceptance criteria met
- [ ] CodePush integrated and functional
- [ ] Force update logic working
- [ ] What's New screen implemented
- [ ] Rollback capability tested
- [ ] Update success rate > 99%
- [ ] No data loss during updates
- [ ] Unit tests passing (>80% coverage)
- [ ] Documentation complete

---

## Dependencies

- MOB-002: iOS app development (prerequisite)
- MOB-003: Android app development (prerequisite)
- MOB-004: App store deployment (prerequisite)

---

## Estimated Timeline

- Week 1: CodePush setup and integration
- Week 2: Force update and version checking
- Week 3: What's New screen and update banners
- Week 4: Testing and rollback mechanisms

**Total Duration:** 4 weeks
**Story Points:** 3