# ENT-007: Dedicated Infrastructure & SLA

**Epic:** EPIC-017 Enterprise Features
**Story Points:** 5
**Priority:** E3 (Expansion)
**Status:** Not Started

---

## User Story

**As an** enterprise customer
**I want** dedicated infrastructure with guaranteed uptime and performance SLAs
**So that** I have reliable service for my mission-critical events

---

## Acceptance Criteria

### 1. Dedicated Database Instances
- [ ] Isolated PostgreSQL database per enterprise customer
- [ ] Database provisioning automation
- [ ] Read replicas for high availability
- [ ] Automated database backups (daily, retention policy)
- [ ] Point-in-time recovery capability
- [ ] Database performance monitoring
- [ ] Connection pooling configuration
- [ ] Database scaling capability (vertical/horizontal)

### 2. Custom Domain SSL Certificates
- [ ] Custom domain support (events.company.com)
- [ ] Automatic SSL certificate provisioning (Let's Encrypt)
- [ ] SSL certificate renewal automation
- [ ] Wildcard certificate support
- [ ] Custom certificate upload option
- [ ] DNS verification workflow
- [ ] HTTPS enforcement
- [ ] SSL monitoring and expiration alerts

### 3. Guaranteed Uptime SLA
- [ ] 99.9% uptime guarantee (Tier 1)
- [ ] 99.95% uptime guarantee (Tier 2)
- [ ] 99.99% uptime guarantee (Tier 3)
- [ ] Real-time uptime monitoring
- [ ] Automated failover mechanisms
- [ ] Load balancing configuration
- [ ] CDN integration for static assets
- [ ] Health check endpoints

### 4. Priority Support Channels
- [ ] Dedicated Slack channel
- [ ] Direct phone support (24/7 for Tier 3)
- [ ] Email support with SLA response times
- [ ] Technical account manager assignment
- [ ] Escalation procedures
- [ ] Support ticket system integration
- [ ] Emergency hotline for critical issues
- [ ] Support satisfaction tracking

### 5. Disaster Recovery & Backup Guarantees
- [ ] Automated daily backups
- [ ] Multi-region backup replication
- [ ] Backup retention: 30 days (Tier 1), 90 days (Tier 2), 1 year (Tier 3)
- [ ] Backup encryption at rest
- [ ] Backup verification testing
- [ ] Disaster recovery runbook
- [ ] Recovery Time Objective (RTO): 4 hours
- [ ] Recovery Point Objective (RPO): 1 hour

### 6. Infrastructure Monitoring Dashboard
- [ ] Real-time system status page
- [ ] Performance metrics (CPU, memory, disk, network)
- [ ] Database performance metrics
- [ ] API response time tracking
- [ ] Error rate monitoring
- [ ] Alert configuration and notifications
- [ ] Historical performance reports
- [ ] Incident timeline and postmortems

### 7. Testing & Quality
- [ ] Infrastructure provisioning automation tested
- [ ] Failover testing completed
- [ ] Disaster recovery drill conducted
- [ ] Load testing for guaranteed performance
- [ ] Security audit of infrastructure
- [ ] SLA monitoring and reporting automated
- [ ] Documentation complete
- [ ] Runbooks for operations team

---

## Technical Specifications

### Database Schema
```prisma
// prisma/schema.prisma

model InfrastructureTier {
  id                String   @id @default(cuid())
  name              String   @unique
  slug              String   @unique
  description       String?

  // SLA Guarantees
  uptimeGuarantee   Float    // 99.9, 99.95, 99.99
  responseTimeSLA   Int      // milliseconds
  supportResponseTime Int    // minutes

  // Infrastructure
  dedicatedDatabase Boolean  @default(false)
  dedicatedServer   Boolean  @default(false)
  customDomain      Boolean  @default(false)
  cdnEnabled        Boolean  @default(false)
  multiRegion       Boolean  @default(false)

  // Backup & DR
  backupFrequency   String   @default("daily") // 'hourly', 'daily'
  backupRetentionDays Int    @default(30)
  rto               Int      @default(240) // minutes
  rpo               Int      @default(60)  // minutes

  // Support
  supportTier       String   @default("standard") // 'standard', 'priority', '24x7'
  technicalAccountManager Boolean @default(false)

  // Pricing
  monthlyPrice      Float
  setupFee          Float    @default(0)

  // Status
  active            Boolean  @default(true)

  // Relations
  organizations     Organization[]

  metadata          Json?
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  @@index([active])
}

model DedicatedInfrastructure {
  id                String   @id @default(cuid())
  organizationId    String   @unique
  organization      Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)

  // Database
  databaseHost      String?
  databasePort      Int?
  databaseName      String?
  databaseUser      String?
  databasePassword  String?  // Encrypted
  databaseReplicas  Json?    // Array of replica hosts
  databaseRegion    String?

  // Server
  serverHost        String?
  serverRegion      String?
  loadBalancerUrl   String?
  cdnDistributionId String?

  // Custom Domain
  customDomain      String?  @unique
  sslCertificateId  String?
  dnsVerified       Boolean  @default(false)
  sslExpiry         DateTime?

  // Status
  provisioningStatus String  @default("pending") // 'pending', 'provisioning', 'active', 'failed'
  provisionedAt     DateTime?
  lastHealthCheck   DateTime?
  healthStatus      String   @default("unknown") // 'healthy', 'degraded', 'down'

  // Relations
  backups           InfrastructureBackup[]
  healthChecks      HealthCheck[]
  incidents         Incident[]

  metadata          Json?
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  @@index([organizationId, provisioningStatus])
}

model InfrastructureBackup {
  id                String   @id @default(cuid())
  infrastructureId  String
  infrastructure    DedicatedInfrastructure @relation(fields: [infrastructureId], references: [id], onDelete: Cascade)

  // Backup details
  backupType        String   // 'full', 'incremental', 'snapshot'
  backupSize        Float    // GB
  backupLocation    String   // S3 path or similar
  region            String
  encryptionKey     String?  // Encrypted

  // Status
  status            String   // 'pending', 'in_progress', 'completed', 'failed'
  startedAt         DateTime
  completedAt       DateTime?
  errorMessage      String?

  // Verification
  verified          Boolean  @default(false)
  verifiedAt        DateTime?

  // Retention
  expiresAt         DateTime

  metadata          Json?
  createdAt         DateTime @default(now())

  @@index([infrastructureId, status])
  @@index([status, expiresAt])
}

model HealthCheck {
  id                String   @id @default(cuid())
  infrastructureId  String
  infrastructure    DedicatedInfrastructure @relation(fields: [infrastructureId], references: [id], onDelete: Cascade)

  // Check details
  checkType         String   // 'http', 'database', 'cdn', 'overall'
  endpoint          String?
  status            String   // 'healthy', 'degraded', 'down'

  // Metrics
  responseTime      Int?     // milliseconds
  statusCode        Int?
  errorMessage      String?

  // Timestamp
  checkedAt         DateTime @default(now())

  metadata          Json?

  @@index([infrastructureId, checkType, checkedAt])
  @@index([status, checkedAt])
}

model UptimeMetric {
  id                String   @id @default(cuid())
  organizationId    String
  organization      Organization @relation(fields: [organizationId], references: [id])

  // Period
  date              DateTime
  hour              Int?     // 0-23 for hourly metrics

  // Metrics
  totalMinutes      Int      @default(60)
  uptimeMinutes     Int      @default(60)
  downtimeMinutes   Int      @default(0)
  uptimePercentage  Float    @default(100)

  // Performance
  avgResponseTime   Float?
  maxResponseTime   Float?
  errorRate         Float    @default(0)

  metadata          Json?
  createdAt         DateTime @default(now())

  @@unique([organizationId, date, hour])
  @@index([organizationId, date])
}

model Incident {
  id                String   @id @default(cuid())
  infrastructureId  String?
  infrastructure    DedicatedInfrastructure? @relation(fields: [infrastructureId], references: [id])
  organizationId    String
  organization      Organization @relation(fields: [organizationId], references: [id])

  // Incident details
  title             String
  description       String   @db.Text
  severity          String   // 'low', 'medium', 'high', 'critical'
  status            String   // 'investigating', 'identified', 'monitoring', 'resolved'

  // Impact
  impactedServices  Json?    // Array of affected services
  affectedUsers     Int?

  // Timeline
  detectedAt        DateTime
  acknowledgedAt    DateTime?
  resolvedAt        DateTime?
  duration          Int?     // minutes

  // Root cause
  rootCause         String?  @db.Text
  resolution        String?  @db.Text

  // SLA impact
  slaBreached       Boolean  @default(false)
  slaCreditsIssued  Float    @default(0)

  // Relations
  updates           IncidentUpdate[]

  metadata          Json?
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  @@index([organizationId, status, severity])
  @@index([status, detectedAt])
}

model IncidentUpdate {
  id                String   @id @default(cuid())
  incidentId        String
  incident          Incident @relation(fields: [incidentId], references: [id], onDelete: Cascade)

  // Update details
  status            String
  message           String   @db.Text
  updatedBy         String?

  createdAt         DateTime @default(now())

  @@index([incidentId, createdAt])
}

// Update Organization model
model Organization {
  // ... existing fields
  infrastructureTierId String?
  infrastructureTier   InfrastructureTier? @relation(fields: [infrastructureTierId], references: [id])
  dedicatedInfrastructure DedicatedInfrastructure?
  uptimeMetrics     UptimeMetric[]
  incidents         Incident[]
  // ... rest of fields
}
```

### Infrastructure Service
```typescript
// lib/services/infrastructure.service.ts
import { PrismaClient } from '@prisma/client';
import AWS from 'aws-sdk';

const prisma = new PrismaClient();
const rds = new AWS.RDS();
const acm = new AWS.ACM();
const route53 = new AWS.Route53();

export class InfrastructureService {
  // Provision dedicated infrastructure
  async provisionInfrastructure(organizationId: string): Promise<DedicatedInfrastructure> {
    const org = await prisma.organization.findUnique({
      where: { id: organizationId },
      include: { infrastructureTier: true },
    });

    if (!org || !org.infrastructureTier) {
      throw new Error('Organization or infrastructure tier not found');
    }

    const tier = org.infrastructureTier;

    // Create infrastructure record
    const infra = await prisma.dedicatedInfrastructure.create({
      data: {
        organizationId,
        provisioningStatus: 'provisioning',
      },
    });

    try {
      // Provision dedicated database if required
      if (tier.dedicatedDatabase) {
        const dbInstance = await this.provisionDatabase(organizationId);
        await prisma.dedicatedInfrastructure.update({
          where: { id: infra.id },
          data: {
            databaseHost: dbInstance.host,
            databasePort: dbInstance.port,
            databaseName: dbInstance.name,
            databaseUser: dbInstance.user,
            databasePassword: this.encrypt(dbInstance.password),
            databaseRegion: dbInstance.region,
          },
        });
      }

      // Setup custom domain if required
      if (tier.customDomain && org.customDomain) {
        await this.setupCustomDomain(infra.id, org.customDomain);
      }

      // Setup CDN if enabled
      if (tier.cdnEnabled) {
        const cdnDistribution = await this.setupCDN(organizationId);
        await prisma.dedicatedInfrastructure.update({
          where: { id: infra.id },
          data: { cdnDistributionId: cdnDistribution.id },
        });
      }

      // Mark as active
      await prisma.dedicatedInfrastructure.update({
        where: { id: infra.id },
        data: {
          provisioningStatus: 'active',
          provisionedAt: new Date(),
          healthStatus: 'healthy',
        },
      });

      // Start health checks
      this.startHealthChecks(infra.id);

      return await prisma.dedicatedInfrastructure.findUnique({
        where: { id: infra.id },
      }) as DedicatedInfrastructure;
    } catch (error) {
      await prisma.dedicatedInfrastructure.update({
        where: { id: infra.id },
        data: {
          provisioningStatus: 'failed',
          metadata: { error: error.message },
        },
      });
      throw error;
    }
  }

  // Provision dedicated database
  private async provisionDatabase(organizationId: string): Promise<DatabaseInstance> {
    const params = {
      DBInstanceIdentifier: `events-${organizationId}`,
      DBInstanceClass: 'db.t3.medium',
      Engine: 'postgres',
      MasterUsername: 'admin',
      MasterUserPassword: this.generatePassword(),
      AllocatedStorage: 100,
      BackupRetentionPeriod: 30,
      MultiAZ: true,
      PubliclyAccessible: false,
      StorageEncrypted: true,
    };

    const result = await rds.createDBInstance(params).promise();

    return {
      host: result.DBInstance!.Endpoint!.Address!,
      port: result.DBInstance!.Endpoint!.Port!,
      name: params.DBInstanceIdentifier,
      user: params.MasterUsername,
      password: params.MasterUserPassword,
      region: 'us-east-1',
    };
  }

  // Setup custom domain with SSL
  private async setupCustomDomain(
    infrastructureId: string,
    customDomain: string
  ): Promise<void> {
    // Request SSL certificate
    const certParams = {
      DomainName: customDomain,
      ValidationMethod: 'DNS',
    };

    const certResult = await acm.requestCertificate(certParams).promise();
    const certificateArn = certResult.CertificateArn!;

    // Get DNS validation records
    const certDetails = await acm.describeCertificate({
      CertificateArn: certificateArn,
    }).promise();

    const dnsValidation = certDetails.Certificate!.DomainValidationOptions![0];

    // Update infrastructure with certificate
    await prisma.dedicatedInfrastructure.update({
      where: { id: infrastructureId },
      data: {
        customDomain,
        sslCertificateId: certificateArn,
        dnsVerified: false,
      },
    });

    // Return DNS validation records for customer to add
    console.log('Add this DNS record:', dnsValidation.ResourceRecord);
  }

  // Perform health check
  async performHealthCheck(infrastructureId: string): Promise<void> {
    const infra = await prisma.dedicatedInfrastructure.findUnique({
      where: { id: infrastructureId },
    });

    if (!infra) return;

    try {
      // Check database connectivity
      if (infra.databaseHost) {
        await this.checkDatabase(infra);
      }

      // Check HTTP endpoints
      const responseTime = await this.checkHTTPEndpoint(infra.customDomain || infra.serverHost);

      // Record health check
      await prisma.healthCheck.create({
        data: {
          infrastructureId,
          checkType: 'overall',
          status: 'healthy',
          responseTime,
          checkedAt: new Date(),
        },
      });

      // Update infrastructure health status
      await prisma.dedicatedInfrastructure.update({
        where: { id: infrastructureId },
        data: {
          lastHealthCheck: new Date(),
          healthStatus: 'healthy',
        },
      });
    } catch (error) {
      // Record failed health check
      await prisma.healthCheck.create({
        data: {
          infrastructureId,
          checkType: 'overall',
          status: 'down',
          errorMessage: error.message,
          checkedAt: new Date(),
        },
      });

      // Update infrastructure health status
      await prisma.dedicatedInfrastructure.update({
        where: { id: infrastructureId },
        data: {
          lastHealthCheck: new Date(),
          healthStatus: 'down',
        },
      });

      // Create incident if not already exists
      await this.createIncident(infra.organizationId, 'Infrastructure Health Check Failed', error.message);
    }
  }

  // Create automated backup
  async createBackup(infrastructureId: string): Promise<InfrastructureBackup> {
    const infra = await prisma.dedicatedInfrastructure.findUnique({
      where: { id: infrastructureId },
      include: { organization: { include: { infrastructureTier: true } } },
    });

    if (!infra) {
      throw new Error('Infrastructure not found');
    }

    const backup = await prisma.infrastructureBackup.create({
      data: {
        infrastructureId,
        backupType: 'full',
        backupSize: 0,
        backupLocation: '',
        region: infra.databaseRegion!,
        status: 'pending',
        startedAt: new Date(),
        expiresAt: new Date(
          Date.now() + infra.organization.infrastructureTier!.backupRetentionDays * 24 * 60 * 60 * 1000
        ),
      },
    });

    // Execute backup asynchronously
    this.executeBackup(backup.id, infra);

    return backup;
  }

  // Calculate uptime percentage
  async calculateUptime(
    organizationId: string,
    startDate: Date,
    endDate: Date
  ): Promise<UptimeReport> {
    const metrics = await prisma.uptimeMetric.findMany({
      where: {
        organizationId,
        date: { gte: startDate, lte: endDate },
      },
    });

    const totalMinutes = metrics.reduce((sum, m) => sum + m.totalMinutes, 0);
    const uptimeMinutes = metrics.reduce((sum, m) => sum + m.uptimeMinutes, 0);
    const uptimePercentage = (uptimeMinutes / totalMinutes) * 100;

    const incidents = await prisma.incident.findMany({
      where: {
        organizationId,
        detectedAt: { gte: startDate, lte: endDate },
      },
    });

    return {
      startDate,
      endDate,
      uptimePercentage,
      totalMinutes,
      uptimeMinutes,
      downtimeMinutes: totalMinutes - uptimeMinutes,
      incidents: incidents.length,
      slaBreached: incidents.some((i) => i.slaBreached),
    };
  }

  // Create incident
  private async createIncident(
    organizationId: string,
    title: string,
    description: string
  ): Promise<void> {
    const existingIncident = await prisma.incident.findFirst({
      where: {
        organizationId,
        title,
        status: { in: ['investigating', 'identified', 'monitoring'] },
      },
    });

    if (existingIncident) return; // Don't create duplicate

    await prisma.incident.create({
      data: {
        organizationId,
        title,
        description,
        severity: 'high',
        status: 'investigating',
        detectedAt: new Date(),
      },
    });
  }

  // Helper methods
  private startHealthChecks(infrastructureId: string): void {
    // Implementation: Start periodic health checks (every 5 minutes)
  }

  private async checkDatabase(infra: DedicatedInfrastructure): Promise<void> {
    // Implementation: Check database connectivity
  }

  private async checkHTTPEndpoint(endpoint: string | null): Promise<number> {
    // Implementation: Check HTTP endpoint and return response time
    return 150; // milliseconds
  }

  private async executeBackup(backupId: string, infra: DedicatedInfrastructure): Promise<void> {
    // Implementation: Execute backup to S3
  }

  private async setupCDN(organizationId: string): Promise<{ id: string }> {
    // Implementation: Setup CloudFront distribution
    return { id: 'cdn-123' };
  }

  private generatePassword(): string {
    return Math.random().toString(36).slice(-16);
  }

  private encrypt(value: string): string {
    // Implementation: Encrypt sensitive data
    return value;
  }
}

interface DatabaseInstance {
  host: string;
  port: number;
  name: string;
  user: string;
  password: string;
  region: string;
}

interface UptimeReport {
  startDate: Date;
  endDate: Date;
  uptimePercentage: number;
  totalMinutes: number;
  uptimeMinutes: number;
  downtimeMinutes: number;
  incidents: number;
  slaBreached: boolean;
}
```

---

## Testing Requirements

### Unit Tests
```typescript
describe('InfrastructureService', () => {
  it('should provision dedicated infrastructure', async () => {
    const infra = await infraService.provisionInfrastructure(organizationId);
    expect(infra.provisioningStatus).toBe('active');
  });

  it('should perform health checks', async () => {
    await infraService.performHealthCheck(infrastructureId);
    // Verify health check recorded
  });

  it('should calculate uptime percentage', async () => {
    const report = await infraService.calculateUptime(orgId, startDate, endDate);
    expect(report.uptimePercentage).toBeGreaterThanOrEqual(99.9);
  });
});
```

---

## Definition of Done

- [ ] All acceptance criteria met
- [ ] Dedicated infrastructure provisioning automated
- [ ] Custom domain and SSL working
- [ ] Health checks operational
- [ ] Backup system functional
- [ ] Uptime monitoring complete
- [ ] SLA tracking and reporting operational
- [ ] Unit tests passing (>85% coverage)
- [ ] Disaster recovery tested
- [ ] Documentation complete

---

## Dependencies

- ENT-002: Organization management (prerequisite)
- Infrastructure: AWS/cloud provider setup (prerequisite)
- Monitoring: Observability tools configured (prerequisite)

---

## Estimated Timeline

**Total Duration:** 5-6 weeks
**Story Points:** 5