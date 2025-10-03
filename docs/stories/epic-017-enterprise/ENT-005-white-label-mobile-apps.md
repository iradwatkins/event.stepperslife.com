# ENT-005: White-Label Mobile Apps

**Epic:** EPIC-017 Enterprise Features
**Story Points:** 5
**Priority:** E3 (Expansion)
**Status:** Not Started

---

## User Story

**As an** enterprise organization
**I want** custom branded iOS and Android mobile apps published under my organization name
**So that** I can provide a seamless branded experience to my customers

---

## Acceptance Criteria

### 1. Custom Branded iOS/Android Apps
- [ ] Base React Native app codebase
- [ ] White-label configuration system
- [ ] Custom app name per organization
- [ ] Custom bundle identifier (iOS) / package name (Android)
- [ ] Custom app icons (multiple sizes)
- [ ] Custom splash screen
- [ ] Custom color scheme (primary, secondary, accent)
- [ ] Custom fonts and typography

### 2. App Store Publishing
- [ ] Automated build pipeline for iOS
- [ ] Automated build pipeline for Android
- [ ] Apple Developer account integration
- [ ] Google Play Console integration
- [ ] App store listing generation
- [ ] Screenshots and preview generation
- [ ] Privacy policy and terms integration
- [ ] Version management and updates

### 3. Push Notification Customization
- [ ] Custom notification sender name
- [ ] Custom notification icons
- [ ] Branded notification templates
- [ ] Deep linking to app screens
- [ ] Rich notifications (images, actions)
- [ ] Notification preference management
- [ ] A/B testing for notifications
- [ ] Analytics for notification engagement

### 4. In-App Branding
- [ ] Custom logo in navigation bar
- [ ] Branded color palette application
- [ ] Custom loading screens
- [ ] Branded error messages
- [ ] Custom empty states
- [ ] Branded success/confirmation screens
- [ ] Custom onboarding flow
- [ ] Branded help/support section

### 5. Custom App Domains & Deep Linking
- [ ] Custom deep link domain (app.yourcompany.com)
- [ ] Universal links (iOS)
- [ ] App links (Android)
- [ ] Deep link routing configuration
- [ ] Fallback to web for uninstalled users
- [ ] Share link generation
- [ ] QR code integration
- [ ] Link analytics and tracking

### 6. App Analytics Dashboard
- [ ] Daily active users (DAU)
- [ ] Monthly active users (MAU)
- [ ] Session duration analytics
- [ ] Screen view tracking
- [ ] Conversion funnel analytics
- [ ] Crash and error reporting
- [ ] App store ratings and reviews
- [ ] Download and install tracking

### 7. Testing & Quality
- [ ] Unit tests for shared components (>85% coverage)
- [ ] Integration tests for API connectivity
- [ ] E2E tests for critical user flows
- [ ] iOS device testing (iPhone, iPad)
- [ ] Android device testing (various manufacturers)
- [ ] Performance benchmarks met
- [ ] App store compliance verification
- [ ] Beta testing program

---

## Technical Specifications

### Database Schema
```prisma
// prisma/schema.prisma

model WhiteLabelApp {
  id                String   @id @default(cuid())
  organizationId    String   @unique
  organization      Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)

  // App Identity
  appName           String
  bundleId          String   @unique // iOS: com.yourcompany.app
  packageName       String   @unique // Android: com.yourcompany.app
  appSlug           String   @unique

  // Branding
  primaryColor      String
  secondaryColor    String
  accentColor       String
  logoUrl           String
  iconUrl           String
  splashScreenUrl   String
  customFonts       Json?

  // App Store Details
  appleAppId        String?  @unique
  googlePlayAppId   String?  @unique
  appStoreUrl       String?
  playStoreUrl      String?

  // Publishing Status
  iosStatus         String   @default("not_published") // 'not_published', 'pending_review', 'published'
  androidStatus     String   @default("not_published")
  currentVersion    String?
  latestBuildNumber Int      @default(1)

  // Developer Accounts
  appleDeveloperId  String?
  googleDeveloperId String?

  // Deep Linking
  customDomain      String?  @unique
  deepLinkConfig    Json?

  // Push Notifications
  fcmServerKey      String?  // Firebase Cloud Messaging
  apnsKeyId         String?  // Apple Push Notification Service
  apnsTeamId        String?
  apnsAuthKey       String?  // Encrypted

  // Settings
  settings          Json?
  features          Json?    // Enabled features per app

  // Analytics
  analytics         AppAnalytics[]
  crashReports      CrashReport[]

  metadata          Json?
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  @@index([organizationId])
}

model AppBuild {
  id                String   @id @default(cuid())
  whiteLabelAppId   String
  whiteLabelApp     WhiteLabelApp @relation(fields: [whiteLabelAppId], references: [id], onDelete: Cascade)

  // Build info
  platform          String   // 'ios', 'android'
  version           String
  buildNumber       Int
  buildType         String   // 'debug', 'release', 'testflight', 'production'

  // Build status
  status            String   // 'pending', 'building', 'success', 'failed'
  startedAt         DateTime?
  completedAt       DateTime?
  errorMessage      String?

  // Artifacts
  downloadUrl       String?
  qrCodeUrl         String?
  installUrl        String?

  // Metadata
  gitCommit         String?
  buildConfig       Json?
  metadata          Json?

  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  @@index([whiteLabelAppId, platform, status])
}

model AppAnalytics {
  id                String   @id @default(cuid())
  whiteLabelAppId   String
  whiteLabelApp     WhiteLabelApp @relation(fields: [whiteLabelAppId], references: [id], onDelete: Cascade)

  // Date
  date              DateTime

  // User metrics
  dailyActiveUsers  Int      @default(0)
  newUsers          Int      @default(0)
  totalSessions     Int      @default(0)
  avgSessionDuration Float   @default(0) // minutes

  // Engagement
  screenViews       Json?    // {screen: count}
  events            Json?    // {event: count}
  conversions       Int      @default(0)

  // Performance
  avgLoadTime       Float    @default(0) // seconds
  crashRate         Float    @default(0) // percentage
  errorRate         Float    @default(0) // percentage

  // App Store
  downloads         Int      @default(0)
  rating            Float?
  reviews           Int      @default(0)

  metadata          Json?
  createdAt         DateTime @default(now())

  @@unique([whiteLabelAppId, date])
  @@index([whiteLabelAppId, date])
}

model CrashReport {
  id                String   @id @default(cuid())
  whiteLabelAppId   String
  whiteLabelApp     WhiteLabelApp @relation(fields: [whiteLabelAppId], references: [id], onDelete: Cascade)

  // Crash details
  platform          String   // 'ios', 'android'
  appVersion        String
  osVersion         String
  deviceModel       String

  // Error info
  errorType         String
  errorMessage      String
  stackTrace        String   @db.Text
  userId            String?

  // Context
  screenPath        String?
  breadcrumbs       Json?
  customData        Json?

  // Status
  status            String   @default("new") // 'new', 'investigating', 'resolved', 'ignored'
  resolvedAt        DateTime?

  createdAt         DateTime @default(now())

  @@index([whiteLabelAppId, status, createdAt])
}

// Update Organization model
model Organization {
  // ... existing fields
  whiteLabelApp     WhiteLabelApp?
  // ... rest of fields
}
```

### White-Label App Service
```typescript
// lib/services/white-label-app.service.ts
import { PrismaClient } from '@prisma/client';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const prisma = new PrismaClient();

export class WhiteLabelAppService {
  // Create white-label app configuration
  async createWhiteLabelApp(data: CreateWhiteLabelAppInput): Promise<WhiteLabelApp> {
    const app = await prisma.whiteLabelApp.create({
      data: {
        organizationId: data.organizationId,
        appName: data.appName,
        bundleId: data.bundleId,
        packageName: data.packageName,
        appSlug: this.generateSlug(data.appName),
        primaryColor: data.primaryColor,
        secondaryColor: data.secondaryColor,
        accentColor: data.accentColor,
        logoUrl: data.logoUrl,
        iconUrl: data.iconUrl,
        splashScreenUrl: data.splashScreenUrl,
        customDomain: data.customDomain,
      },
      include: { organization: true },
    });

    // Generate app icons in multiple sizes
    await this.generateAppIcons(app.id, data.iconUrl);

    return app;
  }

  // Build iOS app
  async buildIOSApp(appId: string, buildType: string): Promise<AppBuild> {
    const app = await prisma.whiteLabelApp.findUnique({
      where: { id: appId },
    });

    if (!app) {
      throw new Error('White-label app not found');
    }

    // Create build record
    const build = await prisma.appBuild.create({
      data: {
        whiteLabelAppId: appId,
        platform: 'ios',
        version: app.currentVersion || '1.0.0',
        buildNumber: app.latestBuildNumber + 1,
        buildType,
        status: 'pending',
      },
    });

    // Start build process asynchronously
    this.executeBuildProcess(build.id, app, 'ios', buildType);

    return build;
  }

  // Build Android app
  async buildAndroidApp(appId: string, buildType: string): Promise<AppBuild> {
    const app = await prisma.whiteLabelApp.findUnique({
      where: { id: appId },
    });

    if (!app) {
      throw new Error('White-label app not found');
    }

    const build = await prisma.appBuild.create({
      data: {
        whiteLabelAppId: appId,
        platform: 'android',
        version: app.currentVersion || '1.0.0',
        buildNumber: app.latestBuildNumber + 1,
        buildType,
        status: 'pending',
      },
    });

    this.executeBuildProcess(build.id, app, 'android', buildType);

    return build;
  }

  // Execute build process
  private async executeBuildProcess(
    buildId: string,
    app: WhiteLabelApp,
    platform: string,
    buildType: string
  ): Promise<void> {
    try {
      await prisma.appBuild.update({
        where: { id: buildId },
        data: {
          status: 'building',
          startedAt: new Date(),
        },
      });

      // Generate app configuration
      const config = this.generateBuildConfig(app, platform);

      // Write configuration to build directory
      const buildDir = `/builds/${app.appSlug}-${platform}-${Date.now()}`;
      await this.prepareBuildDirectory(buildDir, config);

      // Execute platform-specific build
      let buildCommand: string;
      if (platform === 'ios') {
        buildCommand = `cd ${buildDir} && xcodebuild -workspace ios/App.xcworkspace -scheme App -configuration ${buildType} archive`;
      } else {
        buildCommand = `cd ${buildDir} && cd android && ./gradlew assemble${buildType}`;
      }

      const { stdout, stderr } = await execAsync(buildCommand);

      // Upload build artifact
      const artifactUrl = await this.uploadBuildArtifact(buildDir, platform);

      await prisma.appBuild.update({
        where: { id: buildId },
        data: {
          status: 'success',
          completedAt: new Date(),
          downloadUrl: artifactUrl,
        },
      });

      // Update app build number
      await prisma.whiteLabelApp.update({
        where: { id: app.id },
        data: { latestBuildNumber: { increment: 1 } },
      });
    } catch (error) {
      await prisma.appBuild.update({
        where: { id: buildId },
        data: {
          status: 'failed',
          completedAt: new Date(),
          errorMessage: error.message,
        },
      });
    }
  }

  // Send push notification
  async sendPushNotification(
    appId: string,
    userTokens: string[],
    notification: PushNotification
  ): Promise<void> {
    const app = await prisma.whiteLabelApp.findUnique({
      where: { id: appId },
    });

    if (!app) {
      throw new Error('White-label app not found');
    }

    // Send via Firebase Cloud Messaging (for both iOS and Android)
    const fcm = this.initializeFCM(app.fcmServerKey!);

    const message = {
      notification: {
        title: notification.title,
        body: notification.body,
        image: notification.imageUrl,
      },
      data: notification.data,
      tokens: userTokens,
    };

    await fcm.sendMulticast(message);
  }

  // Track app analytics
  async trackAnalytics(
    appId: string,
    date: Date,
    metrics: AnalyticsMetrics
  ): Promise<void> {
    await prisma.appAnalytics.upsert({
      where: {
        whiteLabelAppId_date: { whiteLabelAppId: appId, date },
      },
      update: {
        dailyActiveUsers: metrics.dailyActiveUsers,
        newUsers: { increment: metrics.newUsers },
        totalSessions: { increment: metrics.sessions },
        avgSessionDuration: metrics.avgSessionDuration,
        screenViews: metrics.screenViews,
        events: metrics.events,
        conversions: { increment: metrics.conversions },
      },
      create: {
        whiteLabelAppId: appId,
        date,
        ...metrics,
      },
    });
  }

  // Log crash report
  async logCrashReport(appId: string, crash: CrashReportInput): Promise<void> {
    await prisma.crashReport.create({
      data: {
        whiteLabelAppId: appId,
        platform: crash.platform,
        appVersion: crash.appVersion,
        osVersion: crash.osVersion,
        deviceModel: crash.deviceModel,
        errorType: crash.errorType,
        errorMessage: crash.errorMessage,
        stackTrace: crash.stackTrace,
        userId: crash.userId,
        screenPath: crash.screenPath,
        breadcrumbs: crash.breadcrumbs,
        customData: crash.customData,
      },
    });
  }

  // Helper methods
  private generateSlug(name: string): string {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  }

  private generateBuildConfig(app: WhiteLabelApp, platform: string): any {
    return {
      appName: app.appName,
      bundleId: platform === 'ios' ? app.bundleId : app.packageName,
      primaryColor: app.primaryColor,
      secondaryColor: app.secondaryColor,
      accentColor: app.accentColor,
      logoUrl: app.logoUrl,
      iconUrl: app.iconUrl,
      splashScreenUrl: app.splashScreenUrl,
      customDomain: app.customDomain,
      deepLinkConfig: app.deepLinkConfig,
    };
  }

  private async prepareBuildDirectory(buildDir: string, config: any): Promise<void> {
    // Implementation: Copy base app template, inject configuration, etc.
  }

  private async uploadBuildArtifact(buildDir: string, platform: string): Promise<string> {
    // Implementation: Upload to S3, return URL
    return `https://cdn.example.com/builds/${buildDir}.${platform === 'ios' ? 'ipa' : 'apk'}`;
  }

  private async generateAppIcons(appId: string, iconUrl: string): Promise<void> {
    // Implementation: Generate icons in multiple sizes for iOS and Android
  }

  private initializeFCM(serverKey: string): any {
    // Implementation: Initialize Firebase Cloud Messaging
  }
}

interface CreateWhiteLabelAppInput {
  organizationId: string;
  appName: string;
  bundleId: string;
  packageName: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  logoUrl: string;
  iconUrl: string;
  splashScreenUrl: string;
  customDomain?: string;
}

interface PushNotification {
  title: string;
  body: string;
  imageUrl?: string;
  data?: any;
}

interface AnalyticsMetrics {
  dailyActiveUsers: number;
  newUsers: number;
  sessions: number;
  avgSessionDuration: number;
  screenViews?: any;
  events?: any;
  conversions?: number;
}

interface CrashReportInput {
  platform: string;
  appVersion: string;
  osVersion: string;
  deviceModel: string;
  errorType: string;
  errorMessage: string;
  stackTrace: string;
  userId?: string;
  screenPath?: string;
  breadcrumbs?: any;
  customData?: any;
}
```

### API Routes
```typescript
// app/api/white-label-apps/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { WhiteLabelAppService } from '@/lib/services/white-label-app.service';

const appService = new WhiteLabelAppService();

export async function POST(req: NextRequest) {
  const session = await getServerSession();
  if (!session?.user?.organizationId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const data = await req.json();
  const app = await appService.createWhiteLabelApp({
    ...data,
    organizationId: session.user.organizationId,
  });

  return NextResponse.json({ app }, { status: 201 });
}

// app/api/white-label-apps/[appId]/build/route.ts
export async function POST(
  req: NextRequest,
  { params }: { params: { appId: string } }
) {
  const session = await getServerSession();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { platform, buildType } = await req.json();

  let build;
  if (platform === 'ios') {
    build = await appService.buildIOSApp(params.appId, buildType);
  } else {
    build = await appService.buildAndroidApp(params.appId, buildType);
  }

  return NextResponse.json({ build }, { status: 202 });
}
```

---

## Testing Requirements

### Unit Tests
```typescript
describe('WhiteLabelAppService', () => {
  it('should create white-label app configuration', async () => {
    const app = await appService.createWhiteLabelApp({
      appName: 'My Event App',
      ...
    });
    expect(app.appName).toBe('My Event App');
  });

  it('should build iOS app', async () => {
    const build = await appService.buildIOSApp(appId, 'release');
    expect(build.status).toBe('pending');
  });

  it('should track app analytics', async () => {
    await appService.trackAnalytics(appId, new Date(), {
      dailyActiveUsers: 100,
      newUsers: 10,
      sessions: 250,
      avgSessionDuration: 5.5,
    });
    // Verify analytics recorded
  });
});
```

---

## Definition of Done

- [ ] All acceptance criteria met
- [ ] White-label app creation functional
- [ ] iOS build pipeline operational
- [ ] Android build pipeline operational
- [ ] Push notifications working
- [ ] Deep linking functional
- [ ] Analytics tracking complete
- [ ] Unit tests passing (>85% coverage)
- [ ] Beta testing completed
- [ ] Documentation complete

---

## Dependencies

- MOB-001: Mobile app foundation (prerequisite)
- ENT-002: Organization management (prerequisite)
- PUSH-001: Push notification infrastructure (prerequisite)

---

## Estimated Timeline

**Total Duration:** 6-8 weeks
**Story Points:** 5