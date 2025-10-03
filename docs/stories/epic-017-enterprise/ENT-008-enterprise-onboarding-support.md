# ENT-008: Enterprise Onboarding & Support

**Epic:** EPIC-017 Enterprise Features
**Story Points:** 7
**Priority:** E3 (Expansion)
**Status:** Not Started

---

## User Story

**As an** enterprise customer
**I want** comprehensive onboarding assistance and dedicated ongoing support
**So that** I can successfully deploy the platform and maximize value for my organization

---

## Acceptance Criteria

### 1. Dedicated Onboarding Specialist
- [ ] Assign dedicated onboarding specialist per enterprise customer
- [ ] Kickoff meeting scheduling system
- [ ] Onboarding project plan creation
- [ ] Stakeholder identification and mapping
- [ ] Requirements gathering sessions
- [ ] Implementation timeline development
- [ ] Resource allocation planning
- [ ] Weekly check-in scheduling

### 2. Custom Training Materials & Sessions
- [ ] Organization-specific training documentation
- [ ] Custom video tutorials for workflows
- [ ] Live training session scheduling
- [ ] Role-based training tracks (admin, manager, staff)
- [ ] Training for different departments
- [ ] Hands-on workshop sessions
- [ ] Training completion tracking
- [ ] Post-training assessments and certification

### 3. White-Glove Setup Assistance
- [ ] Initial platform configuration
- [ ] Organization structure setup
- [ ] User account provisioning
- [ ] Role and permission configuration
- [ ] Venue and event setup
- [ ] Payment integration setup
- [ ] Branding customization
- [ ] Integration configuration (SSO, APIs)

### 4. Migration from Other Platforms
- [ ] Data export from legacy systems
- [ ] Data mapping and transformation
- [ ] Bulk import tools for events, users, orders
- [ ] Historical data preservation
- [ ] Data validation and verification
- [ ] Test migration in staging environment
- [ ] Production migration cutover plan
- [ ] Post-migration verification

### 5. Dedicated Support Channels
- [ ] Private Slack Connect channel
- [ ] Dedicated email support queue
- [ ] Direct phone line with priority routing
- [ ] Video call support (Zoom/Teams integration)
- [ ] Emergency escalation hotline
- [ ] Support portal access
- [ ] Ticket priority management
- [ ] SLA-based response times

### 6. Quarterly Business Reviews (QBRs)
- [ ] QBR scheduling system
- [ ] Performance metrics reporting
- [ ] Usage analytics presentation
- [ ] ROI analysis and reporting
- [ ] Feature adoption tracking
- [ ] Goal setting and tracking
- [ ] Improvement recommendations
- [ ] Roadmap alignment discussion

### 7. Success Metrics Tracking
- [ ] Define success criteria with customer
- [ ] Onboarding milestone tracking
- [ ] User adoption metrics
- [ ] Feature utilization metrics
- [ ] Customer satisfaction scores (CSAT, NPS)
- [ ] Support ticket resolution metrics
- [ ] Time-to-value measurement
- [ ] Business outcome tracking

### 8. Knowledge Base & Resources
- [ ] Enterprise-specific knowledge base
- [ ] Best practices documentation
- [ ] Architecture decision records
- [ ] API integration guides
- [ ] Troubleshooting guides
- [ ] Video library
- [ ] Community forum access
- [ ] Release notes and changelog

### 9. Testing & Quality
- [ ] Onboarding process documentation complete
- [ ] Support SLA monitoring automated
- [ ] Training materials tested with pilot customers
- [ ] Migration tools tested with sample data
- [ ] Customer satisfaction measurement implemented
- [ ] Support team training completed
- [ ] Escalation procedures documented
- [ ] QBR templates and materials prepared

---

## Technical Specifications

### Database Schema
```prisma
// prisma/schema.prisma

model OnboardingProject {
  id                String   @id @default(cuid())
  organizationId    String   @unique
  organization      Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)

  // Project details
  projectName       String
  startDate         DateTime
  targetGoLiveDate  DateTime
  actualGoLiveDate  DateTime?

  // Team
  onboardingSpecialistId String
  onboardingSpecialist User  @relation("OnboardingSpecialist", fields: [onboardingSpecialistId], references: [id])
  technicalAccountManagerId String?
  technicalAccountManager User? @relation("TechnicalAccountManager", fields: [technicalAccountManagerId], references: [id])
  customerChampionId String?
  customerChampion  User?    @relation("CustomerChampion", fields: [customerChampionId], references: [id])

  // Status
  status            String   @default("not_started") // 'not_started', 'kickoff', 'discovery', 'setup', 'training', 'migration', 'go_live', 'complete'
  progress          Float    @default(0) // 0-100
  phase             String?

  // Milestones
  milestones        OnboardingMilestone[]
  tasks             OnboardingTask[]
  meetings          OnboardingMeeting[]
  documents         OnboardingDocument[]

  // Success Criteria
  successCriteria   Json?
  kpis              Json?

  metadata          Json?
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  @@index([status, startDate])
}

model OnboardingMilestone {
  id                String   @id @default(cuid())
  projectId         String
  project           OnboardingProject @relation(fields: [projectId], references: [id], onDelete: Cascade)

  // Milestone details
  name              String
  description       String?
  dueDate           DateTime
  completedDate     DateTime?
  status            String   @default("pending") // 'pending', 'in_progress', 'completed', 'blocked'

  // Dependencies
  dependsOn         Json?    // Array of milestone IDs
  blockers          Json?    // Array of blocker descriptions

  // Owner
  ownerId           String?
  owner             User?    @relation(fields: [ownerId], references: [id])

  metadata          Json?
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  @@index([projectId, status])
}

model OnboardingTask {
  id                String   @id @default(cuid())
  projectId         String
  project           OnboardingProject @relation(fields: [projectId], references: [id], onDelete: Cascade)

  // Task details
  title             String
  description       String?  @db.Text
  category          String   // 'setup', 'training', 'migration', 'configuration', 'documentation'
  priority          String   @default("medium") // 'low', 'medium', 'high', 'critical'

  // Assignment
  assignedToId      String?
  assignedTo        User?    @relation(fields: [assignedToId], references: [id])
  dueDate           DateTime?

  // Status
  status            String   @default("todo") // 'todo', 'in_progress', 'review', 'completed'
  completedDate     DateTime?
  completedById     String?
  completedBy       User?    @relation("TaskCompleter", fields: [completedById], references: [id])

  metadata          Json?
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  @@index([projectId, status, priority])
  @@index([assignedToId, status])
}

model OnboardingMeeting {
  id                String   @id @default(cuid())
  projectId         String
  project           OnboardingProject @relation(fields: [projectId], references: [id], onDelete: Cascade)

  // Meeting details
  title             String
  type              String   // 'kickoff', 'training', 'check_in', 'go_live', 'qbr'
  scheduledDate     DateTime
  duration          Int      // minutes
  meetingUrl        String?  // Zoom/Teams link

  // Attendees
  attendees         Json     // Array of user IDs or emails
  required          Boolean  @default(true)

  // Status
  status            String   @default("scheduled") // 'scheduled', 'completed', 'cancelled', 'rescheduled'
  completedDate     DateTime?

  // Notes
  agenda            String?  @db.Text
  notes             String?  @db.Text
  actionItems       Json?
  recordingUrl      String?

  metadata          Json?
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  @@index([projectId, status, scheduledDate])
  @@index([type, scheduledDate])
}

model OnboardingDocument {
  id                String   @id @default(cuid())
  projectId         String
  project           OnboardingProject @relation(fields: [projectId], references: [id], onDelete: Cascade)

  // Document details
  title             String
  description       String?
  type              String   // 'guide', 'checklist', 'recording', 'presentation', 'report'
  category          String?  // 'training', 'setup', 'migration', 'architecture'

  // File
  fileUrl           String
  fileType          String   // 'pdf', 'video', 'slide', 'document'
  fileSize          Int      // bytes

  // Access
  accessLevel       String   @default("organization") // 'organization', 'team', 'public'
  downloadable      Boolean  @default(true)

  // Tracking
  viewCount         Int      @default(0)
  lastViewedAt      DateTime?

  // Upload
  uploadedById      String
  uploadedBy        User     @relation(fields: [uploadedById], references: [id])

  metadata          Json?
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  @@index([projectId, type])
}

model TrainingSession {
  id                String   @id @default(cuid())
  organizationId    String
  organization      Organization @relation(fields: [organizationId], references: [id])

  // Session details
  title             String
  description       String?  @db.Text
  type              String   // 'live', 'recorded', 'workshop', 'webinar'
  track             String?  // 'admin', 'manager', 'staff', 'developer'

  // Schedule
  scheduledDate     DateTime?
  duration          Int      // minutes
  timezone          String?

  // Delivery
  instructorId      String?
  instructor        User?    @relation(fields: [instructorId], references: [id])
  meetingUrl        String?
  recordingUrl      String?
  materialsUrl      String?

  // Enrollment
  maxAttendees      Int?
  enrollments       TrainingEnrollment[]

  // Status
  status            String   @default("scheduled") // 'scheduled', 'in_progress', 'completed', 'cancelled'
  completedDate     DateTime?

  metadata          Json?
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  @@index([organizationId, status, scheduledDate])
  @@index([type, status])
}

model TrainingEnrollment {
  id                String   @id @default(cuid())
  sessionId         String
  session           TrainingSession @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  userId            String
  user              User     @relation(fields: [userId], references: [id])

  // Status
  status            String   @default("enrolled") // 'enrolled', 'attended', 'completed', 'cancelled'
  attended          Boolean  @default(false)
  completedAt       DateTime?

  // Assessment
  assessmentScore   Float?
  certified         Boolean  @default(false)
  certificateUrl    String?

  // Feedback
  rating            Int?     // 1-5 stars
  feedback          String?  @db.Text

  metadata          Json?
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  @@unique([sessionId, userId])
  @@index([userId, status])
}

model SupportTicket {
  id                String   @id @default(cuid())
  organizationId    String
  organization      Organization @relation(fields: [organizationId], references: [id])
  userId            String?
  user              User?    @relation(fields: [userId], references: [id])

  // Ticket details
  subject           String
  description       String   @db.Text
  priority          String   @default("medium") // 'low', 'medium', 'high', 'critical'
  category          String   // 'technical', 'billing', 'training', 'feature_request', 'bug'

  // Assignment
  assignedToId      String?
  assignedTo        User?    @relation("TicketAssignee", fields: [assignedToId], references: [id])
  teamQueue         String?  // 'tier1', 'tier2', 'tier3', 'engineering'

  // Status
  status            String   @default("open") // 'open', 'in_progress', 'waiting_customer', 'resolved', 'closed'
  resolution        String?  @db.Text

  // SLA
  slaResponseTime   Int?     // minutes
  slaResolutionTime Int?     // minutes
  respondedAt       DateTime?
  resolvedAt        DateTime?
  slaBreach         Boolean  @default(false)

  // Relations
  comments          SupportTicketComment[]
  attachments       SupportTicketAttachment[]

  metadata          Json?
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  @@index([organizationId, status, priority])
  @@index([assignedToId, status])
  @@index([status, createdAt])
}

model SupportTicketComment {
  id                String   @id @default(cuid())
  ticketId          String
  ticket            SupportTicket @relation(fields: [ticketId], references: [id], onDelete: Cascade)
  userId            String
  user              User     @relation(fields: [userId], references: [id])

  // Comment
  comment           String   @db.Text
  isInternal        Boolean  @default(false)

  metadata          Json?
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  @@index([ticketId, createdAt])
}

model SupportTicketAttachment {
  id                String   @id @default(cuid())
  ticketId          String
  ticket            SupportTicket @relation(fields: [ticketId], references: [id], onDelete: Cascade)

  // File details
  fileName          String
  fileUrl           String
  fileType          String
  fileSize          Int

  uploadedById      String
  uploadedBy        User     @relation(fields: [uploadedById], references: [id])

  createdAt         DateTime @default(now())

  @@index([ticketId])
}

model QuarterlyBusinessReview {
  id                String   @id @default(cuid())
  organizationId    String
  organization      Organization @relation(fields: [organizationId], references: [id])

  // QBR details
  quarter           String   // 'Q1 2024', 'Q2 2024', etc.
  scheduledDate     DateTime
  completedDate     DateTime?

  // Attendees
  conductedById     String
  conductedBy       User     @relation(fields: [conductedById], references: [id])
  customerAttendees Json     // Array of customer attendees

  // Metrics
  metrics           Json     // Usage, adoption, ROI metrics
  achievements      Json?    // Goals achieved
  challenges        Json?    // Challenges faced
  actionItems       Json?    // Follow-up actions

  // Documents
  presentationUrl   String?
  recordingUrl      String?
  reportUrl         String?

  // Status
  status            String   @default("scheduled") // 'scheduled', 'completed', 'cancelled'

  metadata          Json?
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  @@index([organizationId, quarter])
  @@index([status, scheduledDate])
}

model SuccessMetric {
  id                String   @id @default(cuid())
  organizationId    String
  organization      Organization @relation(fields: [organizationId], references: [id])

  // Metric details
  name              String
  description       String?
  category          String   // 'adoption', 'engagement', 'satisfaction', 'business_outcome'
  metricType        String   // 'percentage', 'count', 'currency', 'duration'

  // Target
  targetValue       Float
  currentValue      Float    @default(0)
  unit              String?  // '%', 'users', '$', 'hours'

  // Timeline
  startDate         DateTime
  targetDate        DateTime
  achievedDate      DateTime?

  // Status
  status            String   @default("in_progress") // 'in_progress', 'achieved', 'at_risk', 'missed'

  // Tracking
  lastUpdated       DateTime @default(now())
  updateFrequency   String   @default("weekly") // 'daily', 'weekly', 'monthly'

  metadata          Json?
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  @@index([organizationId, status])
}

// Update User model
model User {
  // ... existing fields
  onboardingProjectsAsSpecialist OnboardingProject[] @relation("OnboardingSpecialist")
  onboardingProjectsAsTAM OnboardingProject[] @relation("TechnicalAccountManager")
  onboardingProjectsAsChampion OnboardingProject[] @relation("CustomerChampion")
  onboardingMilestones OnboardingMilestone[]
  onboardingTasks OnboardingTask[]
  completedTasks OnboardingTask[] @relation("TaskCompleter")
  uploadedDocuments OnboardingDocument[]
  trainingSessions TrainingSession[]
  trainingEnrollments TrainingEnrollment[]
  supportTickets SupportTicket[]
  assignedTickets SupportTicket[] @relation("TicketAssignee")
  ticketComments SupportTicketComment[]
  ticketAttachments SupportTicketAttachment[]
  qbrsAsHost QuarterlyBusinessReview[]
  // ... rest of fields
}

// Update Organization model
model Organization {
  // ... existing fields
  onboardingProject OnboardingProject?
  trainingSessions TrainingSession[]
  supportTickets SupportTicket[]
  qbrs QuarterlyBusinessReview[]
  successMetrics SuccessMetric[]
  // ... rest of fields
}
```

### Onboarding Service
```typescript
// lib/services/onboarding.service.ts
import { PrismaClient } from '@prisma/client';
import { sendEmail } from '@/lib/services/email';

const prisma = new PrismaClient();

export class OnboardingService {
  // Create onboarding project
  async createOnboardingProject(
    organizationId: string,
    onboardingSpecialistId: string,
    data: CreateOnboardingInput
  ): Promise<OnboardingProject> {
    const project = await prisma.onboardingProject.create({
      data: {
        organizationId,
        onboardingSpecialistId,
        projectName: data.projectName,
        startDate: data.startDate,
        targetGoLiveDate: data.targetGoLiveDate,
        status: 'kickoff',
        successCriteria: data.successCriteria,
        kpis: data.kpis,
      },
      include: {
        organization: true,
        onboardingSpecialist: true,
      },
    });

    // Create default milestones
    await this.createDefaultMilestones(project.id);

    // Schedule kickoff meeting
    await this.scheduleKickoffMeeting(project.id);

    // Send welcome email
    await this.sendWelcomeEmail(project);

    return project;
  }

  // Create default onboarding milestones
  private async createDefaultMilestones(projectId: string): Promise<void> {
    const defaultMilestones = [
      { name: 'Kickoff Meeting', description: 'Initial project kickoff', daysOffset: 0 },
      { name: 'Discovery & Requirements', description: 'Gather requirements', daysOffset: 7 },
      { name: 'Initial Setup', description: 'Platform configuration', daysOffset: 14 },
      { name: 'Data Migration', description: 'Migrate data from legacy systems', daysOffset: 21 },
      { name: 'Training Sessions', description: 'Conduct user training', daysOffset: 28 },
      { name: 'User Acceptance Testing', description: 'UAT with customer', daysOffset: 35 },
      { name: 'Go-Live', description: 'Production cutover', daysOffset: 42 },
      { name: 'Post Go-Live Support', description: '30-day stabilization', daysOffset: 72 },
    ];

    const project = await prisma.onboardingProject.findUnique({
      where: { id: projectId },
    });

    if (!project) return;

    await prisma.onboardingMilestone.createMany({
      data: defaultMilestones.map((milestone) => ({
        projectId,
        name: milestone.name,
        description: milestone.description,
        dueDate: new Date(project.startDate.getTime() + milestone.daysOffset * 24 * 60 * 60 * 1000),
        status: 'pending',
      })),
    });
  }

  // Schedule training session
  async scheduleTrainingSession(
    organizationId: string,
    data: CreateTrainingSessionInput
  ): Promise<TrainingSession> {
    const session = await prisma.trainingSession.create({
      data: {
        organizationId,
        title: data.title,
        description: data.description,
        type: data.type,
        track: data.track,
        scheduledDate: data.scheduledDate,
        duration: data.duration,
        instructorId: data.instructorId,
        meetingUrl: data.meetingUrl,
        maxAttendees: data.maxAttendees,
        status: 'scheduled',
      },
      include: {
        organization: true,
        instructor: true,
      },
    });

    // Send invitations to organization users
    await this.sendTrainingInvitations(session);

    return session;
  }

  // Enroll user in training
  async enrollInTraining(
    sessionId: string,
    userId: string
  ): Promise<TrainingEnrollment> {
    const session = await prisma.trainingSession.findUnique({
      where: { id: sessionId },
      include: { _count: { select: { enrollments: true } } },
    });

    if (!session) {
      throw new Error('Training session not found');
    }

    if (session.maxAttendees && session._count.enrollments >= session.maxAttendees) {
      throw new Error('Training session is full');
    }

    const enrollment = await prisma.trainingEnrollment.create({
      data: {
        sessionId,
        userId,
        status: 'enrolled',
      },
      include: {
        session: true,
        user: true,
      },
    });

    // Send confirmation email
    await this.sendEnrollmentConfirmation(enrollment);

    return enrollment;
  }

  // Create support ticket
  async createSupportTicket(
    organizationId: string,
    userId: string,
    data: CreateSupportTicketInput
  ): Promise<SupportTicket> {
    // Determine SLA based on organization's infrastructure tier
    const org = await prisma.organization.findUnique({
      where: { id: organizationId },
      include: { infrastructureTier: true },
    });

    const slaResponseTime = this.calculateSLAResponseTime(
      data.priority,
      org?.infrastructureTier?.supportTier || 'standard'
    );

    const ticket = await prisma.supportTicket.create({
      data: {
        organizationId,
        userId,
        subject: data.subject,
        description: data.description,
        priority: data.priority,
        category: data.category,
        slaResponseTime,
        status: 'open',
      },
      include: {
        organization: true,
        user: true,
      },
    });

    // Auto-assign to appropriate queue
    await this.autoAssignTicket(ticket.id, data.category, data.priority);

    // Send notification to support team
    await this.notifySupportTeam(ticket);

    return ticket;
  }

  // Schedule Quarterly Business Review
  async scheduleQBR(
    organizationId: string,
    quarter: string,
    scheduledDate: Date,
    conductedById: string
  ): Promise<QuarterlyBusinessReview> {
    const qbr = await prisma.quarterlyBusinessReview.create({
      data: {
        organizationId,
        quarter,
        scheduledDate,
        conductedById,
        status: 'scheduled',
      },
      include: {
        organization: true,
        conductedBy: true,
      },
    });

    // Generate QBR metrics report
    await this.generateQBRMetrics(qbr.id);

    // Send calendar invites
    await this.sendQBRInvitations(qbr);

    return qbr;
  }

  // Track success metric
  async trackSuccessMetric(
    organizationId: string,
    metricName: string,
    currentValue: number
  ): Promise<void> {
    const metric = await prisma.successMetric.findFirst({
      where: {
        organizationId,
        name: metricName,
        status: 'in_progress',
      },
    });

    if (!metric) return;

    const status = currentValue >= metric.targetValue ? 'achieved' :
                   currentValue >= metric.targetValue * 0.8 ? 'in_progress' : 'at_risk';

    await prisma.successMetric.update({
      where: { id: metric.id },
      data: {
        currentValue,
        status,
        lastUpdated: new Date(),
        achievedDate: status === 'achieved' ? new Date() : null,
      },
    });

    // Send alerts if at risk or achieved
    if (status === 'at_risk' || status === 'achieved') {
      await this.sendMetricAlert(metric, status);
    }
  }

  // Generate onboarding progress report
  async generateProgressReport(projectId: string): Promise<OnboardingReport> {
    const project = await prisma.onboardingProject.findUnique({
      where: { id: projectId },
      include: {
        milestones: true,
        tasks: true,
        meetings: true,
        organization: {
          include: { successMetrics: true },
        },
      },
    });

    if (!project) {
      throw new Error('Onboarding project not found');
    }

    const completedMilestones = project.milestones.filter((m) => m.status === 'completed').length;
    const totalMilestones = project.milestones.length;
    const progress = (completedMilestones / totalMilestones) * 100;

    const completedTasks = project.tasks.filter((t) => t.status === 'completed').length;
    const totalTasks = project.tasks.length;

    const onTrack = project.milestones.every((m) => {
      if (m.status === 'completed') return true;
      return m.dueDate >= new Date();
    });

    return {
      projectId,
      progress,
      completedMilestones,
      totalMilestones,
      completedTasks,
      totalTasks,
      onTrack,
      currentPhase: project.phase || project.status,
      nextMilestone: project.milestones.find((m) => m.status !== 'completed'),
      successMetrics: project.organization.successMetrics,
    };
  }

  // Helper methods
  private calculateSLAResponseTime(priority: string, supportTier: string): number {
    const slaMatrix: Record<string, Record<string, number>> = {
      critical: { standard: 60, priority: 30, '24x7': 15 },
      high: { standard: 240, priority: 120, '24x7': 60 },
      medium: { standard: 480, priority: 240, '24x7': 120 },
      low: { standard: 1440, priority: 720, '24x7': 480 },
    };
    return slaMatrix[priority]?.[supportTier] || 480;
  }

  private async scheduleKickoffMeeting(projectId: string): Promise<void> {
    const project = await prisma.onboardingProject.findUnique({
      where: { id: projectId },
    });

    if (!project) return;

    await prisma.onboardingMeeting.create({
      data: {
        projectId,
        title: 'Onboarding Kickoff',
        type: 'kickoff',
        scheduledDate: new Date(project.startDate.getTime() + 24 * 60 * 60 * 1000), // Next day
        duration: 60,
        attendees: [],
        status: 'scheduled',
      },
    });
  }

  private async sendWelcomeEmail(project: OnboardingProject): Promise<void> {
    // Implementation: Send welcome email to organization
  }

  private async sendTrainingInvitations(session: TrainingSession): Promise<void> {
    // Implementation: Send training invitations
  }

  private async sendEnrollmentConfirmation(enrollment: TrainingEnrollment): Promise<void> {
    // Implementation: Send enrollment confirmation
  }

  private async autoAssignTicket(ticketId: string, category: string, priority: string): Promise<void> {
    // Implementation: Auto-assign ticket based on category and priority
  }

  private async notifySupportTeam(ticket: SupportTicket): Promise<void> {
    // Implementation: Notify support team of new ticket
  }

  private async sendQBRInvitations(qbr: QuarterlyBusinessReview): Promise<void> {
    // Implementation: Send QBR calendar invites
  }

  private async generateQBRMetrics(qbrId: string): Promise<void> {
    // Implementation: Generate metrics report for QBR
  }

  private async sendMetricAlert(metric: SuccessMetric, status: string): Promise<void> {
    // Implementation: Send alert about metric status change
  }
}

interface CreateOnboardingInput {
  projectName: string;
  startDate: Date;
  targetGoLiveDate: Date;
  successCriteria?: any;
  kpis?: any;
}

interface CreateTrainingSessionInput {
  title: string;
  description?: string;
  type: string;
  track?: string;
  scheduledDate: Date;
  duration: number;
  instructorId?: string;
  meetingUrl?: string;
  maxAttendees?: number;
}

interface CreateSupportTicketInput {
  subject: string;
  description: string;
  priority: string;
  category: string;
}

interface OnboardingReport {
  projectId: string;
  progress: number;
  completedMilestones: number;
  totalMilestones: number;
  completedTasks: number;
  totalTasks: number;
  onTrack: boolean;
  currentPhase: string;
  nextMilestone?: any;
  successMetrics: any[];
}
```

### API Routes
```typescript
// app/api/onboarding/projects/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { OnboardingService } from '@/lib/services/onboarding.service';

const onboardingService = new OnboardingService();

export async function POST(req: NextRequest) {
  const session = await getServerSession();
  if (!session?.user?.organizationId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const data = await req.json();
  const project = await onboardingService.createOnboardingProject(
    session.user.organizationId,
    data.onboardingSpecialistId,
    data
  );

  return NextResponse.json({ project }, { status: 201 });
}

// app/api/support/tickets/route.ts
export async function POST(req: NextRequest) {
  const session = await getServerSession();
  if (!session?.user?.organizationId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const data = await req.json();
  const ticket = await onboardingService.createSupportTicket(
    session.user.organizationId,
    session.user.id,
    data
  );

  return NextResponse.json({ ticket }, { status: 201 });
}
```

---

## Testing Requirements

### Unit Tests
```typescript
describe('OnboardingService', () => {
  it('should create onboarding project with default milestones', async () => {
    const project = await onboardingService.createOnboardingProject(
      orgId, specialistId, data
    );
    const milestones = await prisma.onboardingMilestone.findMany({
      where: { projectId: project.id },
    });
    expect(milestones.length).toBeGreaterThan(0);
  });

  it('should schedule training session', async () => {
    const session = await onboardingService.scheduleTrainingSession(orgId, data);
    expect(session.status).toBe('scheduled');
  });

  it('should create support ticket with correct SLA', async () => {
    const ticket = await onboardingService.createSupportTicket(orgId, userId, {
      priority: 'critical',
      ...
    });
    expect(ticket.slaResponseTime).toBeLessThanOrEqual(60);
  });

  it('should generate onboarding progress report', async () => {
    const report = await onboardingService.generateProgressReport(projectId);
    expect(report.progress).toBeGreaterThanOrEqual(0);
  });
});
```

---

## Definition of Done

- [ ] All acceptance criteria met
- [ ] Onboarding project workflow functional
- [ ] Training session management operational
- [ ] Support ticket system working
- [ ] QBR scheduling and tracking complete
- [ ] Success metrics tracking functional
- [ ] Migration tools tested and documented
- [ ] Unit tests passing (>85% coverage)
- [ ] Customer satisfaction measurement implemented
- [ ] Documentation complete (guides, runbooks, templates)

---

## Dependencies

- ENT-002: Organization management (prerequisite)
- ENT-003: SSO integration (for setup assistance)
- ENT-007: Infrastructure SLA (for support tiers)
- US-001: User management (prerequisite)

---

## Estimated Timeline

**Total Duration:** 6-8 weeks
**Story Points:** 7

---

## Notes

This is the most comprehensive story in EPIC-017 due to the 7-point weight. It encompasses:
- Complete onboarding lifecycle management
- Multi-faceted training program
- Comprehensive support infrastructure
- Business relationship management (QBRs)
- Success tracking and optimization

The implementation should prioritize customer experience and white-glove service delivery, as this is a key differentiator for enterprise customers.