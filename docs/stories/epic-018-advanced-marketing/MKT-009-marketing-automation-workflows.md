# MKT-009: Marketing Automation Workflows

**Epic:** [EPIC-018: Advanced Marketing Automation](../epics/EPIC-018-advanced-marketing.md)
**Story Points:** 5
**Priority:** E3 (Expansion)
**Status:** Not Started
**Assignee:** TBD
**Sprint:** TBD

---

## User Story

**As an** event organizer
**I want** to create automated marketing workflows with triggers, conditions, and multi-step sequences
**So that** I can nurture leads, engage attendees, and increase conversions without manual intervention

---

## Acceptance Criteria

### AC1: Visual Workflow Builder
**Given** I am on the marketing automation page
**When** I create a new workflow
**Then** I should see a drag-and-drop canvas to build multi-step workflows
**And** I can add triggers, actions, delays, and conditions
**And** I can preview the workflow before activation

### AC2: Trigger Configuration
**Given** I am building a workflow
**When** I select a trigger type
**Then** I can choose from: event registration, ticket purchase, abandoned cart, email open, link click, or custom events
**And** I can set trigger conditions (e.g., event category, ticket price range)
**And** the workflow activates automatically when the trigger fires

### AC3: Multi-Step Campaign Builder
**Given** I am creating a workflow
**When** I add multiple steps
**Then** I can set delays between steps (minutes, hours, days)
**And** I can add conditional branches based on user behavior
**And** I can include multiple communication channels (email, SMS, push)
**And** the system executes steps in the defined sequence

### AC4: A/B Testing Integration
**Given** I am configuring an email step
**When** I enable A/B testing
**Then** I can create variant versions (subject line, content, CTA)
**And** I can set traffic split percentages
**And** the system automatically selects the winning variant
**And** I receive performance comparison analytics

### AC5: Workflow Analytics
**Given** a workflow is active
**When** I view workflow analytics
**Then** I see conversion rates at each step
**And** I see drop-off rates and bottlenecks
**And** I can track goal completions (ticket purchases, registrations)
**And** I receive optimization recommendations

### AC6: Template Library
**Given** I want to create a new workflow
**When** I browse the template library
**Then** I see pre-built workflows for common scenarios
**And** I can customize templates to fit my needs
**And** I can save custom workflows as templates
**And** templates include best-practice recommendations

---

## Technical Specifications

### Database Schema (Prisma)

```prisma
model MarketingWorkflow {
  id            String               @id @default(cuid())
  organizerId   String
  name          String
  description   String?
  status        WorkflowStatus       @default(DRAFT)
  triggerType   WorkflowTriggerType
  triggerConfig Json                 // Conditions, filters
  steps         WorkflowStep[]
  analytics     WorkflowAnalytics[]
  isTemplate    Boolean              @default(false)
  createdAt     DateTime             @default(now())
  updatedAt     DateTime             @updatedAt

  organizer     User                 @relation(fields: [organizerId], references: [id])
  enrollments   WorkflowEnrollment[]

  @@index([organizerId, status])
  @@index([triggerType, status])
}

model WorkflowStep {
  id           String           @id @default(cuid())
  workflowId   String
  stepNumber   Int
  stepType     WorkflowStepType
  config       Json             // Email template, SMS content, delay settings
  conditions   Json?            // Branch conditions
  abTest       Json?            // A/B test configuration
  createdAt    DateTime         @default(now())

  workflow     MarketingWorkflow @relation(fields: [workflowId], references: [id], onDelete: Cascade)
  executions   StepExecution[]

  @@unique([workflowId, stepNumber])
  @@index([workflowId])
}

model WorkflowEnrollment {
  id           String           @id @default(cuid())
  workflowId   String
  userId       String
  status       EnrollmentStatus @default(ACTIVE)
  currentStep  Int              @default(0)
  enrolledAt   DateTime         @default(now())
  completedAt  DateTime?
  metadata     Json?            // Custom data for personalization

  workflow     MarketingWorkflow @relation(fields: [workflowId], references: [id], onDelete: Cascade)
  user         User             @relation(fields: [userId], references: [id])
  executions   StepExecution[]

  @@unique([workflowId, userId])
  @@index([status, currentStep])
}

model StepExecution {
  id           String              @id @default(cuid())
  enrollmentId String
  stepId       String
  status       ExecutionStatus     @default(PENDING)
  scheduledFor DateTime
  executedAt   DateTime?
  variant      String?             // For A/B tests
  result       Json?               // Success/failure details

  enrollment   WorkflowEnrollment  @relation(fields: [enrollmentId], references: [id], onDelete: Cascade)
  step         WorkflowStep        @relation(fields: [stepId], references: [id], onDelete: Cascade)

  @@index([status, scheduledFor])
  @@index([enrollmentId])
}

model WorkflowAnalytics {
  id                String              @id @default(cuid())
  workflowId        String
  date              DateTime
  enrollments       Int                 @default(0)
  completions       Int                 @default(0)
  conversions       Int                 @default(0)
  revenue           Decimal             @default(0) @db.Decimal(10, 2)
  stepPerformance   Json                // Per-step metrics
  abTestResults     Json?               // A/B test outcomes

  workflow          MarketingWorkflow   @relation(fields: [workflowId], references: [id], onDelete: Cascade)

  @@unique([workflowId, date])
  @@index([workflowId, date])
}

enum WorkflowStatus {
  DRAFT
  ACTIVE
  PAUSED
  ARCHIVED
}

enum WorkflowTriggerType {
  EVENT_REGISTRATION
  TICKET_PURCHASE
  ABANDONED_CART
  EMAIL_OPEN
  LINK_CLICK
  CUSTOM_EVENT
  SCHEDULE
}

enum WorkflowStepType {
  SEND_EMAIL
  SEND_SMS
  WAIT_DELAY
  CONDITIONAL_BRANCH
  UPDATE_USER_TAG
  WEBHOOK
  GOAL_CHECK
}

enum EnrollmentStatus {
  ACTIVE
  COMPLETED
  EXITED
  FAILED
}

enum ExecutionStatus {
  PENDING
  SCHEDULED
  EXECUTING
  COMPLETED
  FAILED
  SKIPPED
}
```

### TypeScript Interfaces

```typescript
// types/marketing-automation.ts

export interface WorkflowConfig {
  id: string;
  name: string;
  description?: string;
  trigger: WorkflowTrigger;
  steps: WorkflowStepConfig[];
  goals?: WorkflowGoal[];
}

export interface WorkflowTrigger {
  type: 'EVENT_REGISTRATION' | 'TICKET_PURCHASE' | 'ABANDONED_CART' | 'EMAIL_OPEN' | 'LINK_CLICK' | 'CUSTOM_EVENT' | 'SCHEDULE';
  conditions: TriggerCondition[];
  delayFromTrigger?: number; // minutes
}

export interface TriggerCondition {
  field: string;
  operator: 'equals' | 'contains' | 'greater_than' | 'less_than' | 'in_list';
  value: any;
}

export interface WorkflowStepConfig {
  stepNumber: number;
  type: 'SEND_EMAIL' | 'SEND_SMS' | 'WAIT_DELAY' | 'CONDITIONAL_BRANCH' | 'UPDATE_USER_TAG' | 'WEBHOOK' | 'GOAL_CHECK';
  config: EmailStepConfig | SMSStepConfig | DelayStepConfig | BranchStepConfig;
  abTest?: ABTestConfig;
}

export interface EmailStepConfig {
  templateId?: string;
  subject: string;
  content: string;
  fromName: string;
  fromEmail: string;
  personalization: Record<string, string>;
}

export interface ABTestConfig {
  enabled: boolean;
  variants: ABVariant[];
  splitPercentage: number[];
  winnerCriteria: 'open_rate' | 'click_rate' | 'conversion_rate';
  duration: number; // hours
}

export interface ABVariant {
  name: string;
  subject?: string;
  content?: string;
  cta?: string;
}

export interface WorkflowGoal {
  type: 'TICKET_PURCHASE' | 'EVENT_REGISTRATION' | 'LINK_CLICK' | 'CUSTOM';
  value?: number;
  timeframe?: number; // days
}

export interface WorkflowAnalytics {
  workflowId: string;
  enrollments: number;
  activeEnrollments: number;
  completions: number;
  conversionRate: number;
  revenue: number;
  stepPerformance: StepPerformance[];
  abTestResults?: ABTestResults[];
}

export interface StepPerformance {
  stepNumber: number;
  stepType: string;
  sent: number;
  delivered: number;
  opened?: number;
  clicked?: number;
  converted: number;
  dropoffRate: number;
}
```

### API Routes

```typescript
// app/api/marketing/workflows/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth.config';
import { WorkflowService } from '@/lib/services/workflow.service';

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const status = searchParams.get('status');
  const isTemplate = searchParams.get('template') === 'true';

  const workflows = await WorkflowService.listWorkflows({
    organizerId: session.user.id,
    status: status as any,
    isTemplate,
  });

  return NextResponse.json(workflows);
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const workflow = await WorkflowService.createWorkflow({
    organizerId: session.user.id,
    ...body,
  });

  return NextResponse.json(workflow, { status: 201 });
}

// app/api/marketing/workflows/[workflowId]/route.ts

export async function PUT(
  request: NextRequest,
  { params }: { params: { workflowId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const workflow = await WorkflowService.updateWorkflow(
    params.workflowId,
    session.user.id,
    body
  );

  return NextResponse.json(workflow);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { workflowId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await WorkflowService.deleteWorkflow(params.workflowId, session.user.id);
  return NextResponse.json({ success: true });
}

// app/api/marketing/workflows/[workflowId]/activate/route.ts

export async function POST(
  request: NextRequest,
  { params }: { params: { workflowId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const workflow = await WorkflowService.activateWorkflow(
    params.workflowId,
    session.user.id
  );

  return NextResponse.json(workflow);
}

// app/api/marketing/workflows/[workflowId]/analytics/route.ts

export async function GET(
  request: NextRequest,
  { params }: { params: { workflowId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');

  const analytics = await WorkflowService.getWorkflowAnalytics(
    params.workflowId,
    session.user.id,
    { startDate, endDate }
  );

  return NextResponse.json(analytics);
}
```

### Service Layer

```typescript
// lib/services/workflow.service.ts

import { prisma } from '@/lib/prisma';
import { WorkflowConfig, WorkflowAnalytics } from '@/types/marketing-automation';
import { WorkflowExecutor } from './workflow-executor.service';
import { ABTestService } from './ab-test.service';

export class WorkflowService {
  static async createWorkflow(data: any) {
    return prisma.marketingWorkflow.create({
      data: {
        organizerId: data.organizerId,
        name: data.name,
        description: data.description,
        triggerType: data.triggerType,
        triggerConfig: data.triggerConfig,
        steps: {
          create: data.steps.map((step: any, index: number) => ({
            stepNumber: index + 1,
            stepType: step.type,
            config: step.config,
            conditions: step.conditions,
            abTest: step.abTest,
          })),
        },
      },
      include: {
        steps: true,
      },
    });
  }

  static async activateWorkflow(workflowId: string, organizerId: string) {
    const workflow = await prisma.marketingWorkflow.findFirst({
      where: { id: workflowId, organizerId },
      include: { steps: true },
    });

    if (!workflow) {
      throw new Error('Workflow not found');
    }

    // Validate workflow configuration
    this.validateWorkflow(workflow);

    // Update status
    const updated = await prisma.marketingWorkflow.update({
      where: { id: workflowId },
      data: { status: 'ACTIVE' },
    });

    // Start listening for triggers
    await WorkflowExecutor.registerWorkflowTrigger(workflow);

    return updated;
  }

  static async enrollUser(workflowId: string, userId: string, metadata?: any) {
    return prisma.workflowEnrollment.create({
      data: {
        workflowId,
        userId,
        metadata,
        status: 'ACTIVE',
      },
    });
  }

  static async getWorkflowAnalytics(
    workflowId: string,
    organizerId: string,
    dateRange?: { startDate?: string; endDate?: string }
  ): Promise<WorkflowAnalytics> {
    const workflow = await prisma.marketingWorkflow.findFirst({
      where: { id: workflowId, organizerId },
      include: {
        enrollments: true,
        analytics: {
          where: dateRange ? {
            date: {
              gte: dateRange.startDate ? new Date(dateRange.startDate) : undefined,
              lte: dateRange.endDate ? new Date(dateRange.endDate) : undefined,
            },
          } : undefined,
        },
        steps: {
          include: {
            executions: true,
          },
        },
      },
    });

    if (!workflow) {
      throw new Error('Workflow not found');
    }

    // Calculate aggregated analytics
    const enrollments = workflow.enrollments.length;
    const activeEnrollments = workflow.enrollments.filter(e => e.status === 'ACTIVE').length;
    const completions = workflow.enrollments.filter(e => e.status === 'COMPLETED').length;

    const totalRevenue = workflow.analytics.reduce(
      (sum, a) => sum + Number(a.revenue),
      0
    );

    // Calculate step performance
    const stepPerformance = workflow.steps.map(step => {
      const executions = step.executions;
      const sent = executions.length;
      const delivered = executions.filter(e => e.status === 'COMPLETED').length;
      const failed = executions.filter(e => e.status === 'FAILED').length;

      return {
        stepNumber: step.stepNumber,
        stepType: step.stepType,
        sent,
        delivered,
        converted: 0, // Calculate based on goals
        dropoffRate: sent > 0 ? (failed / sent) * 100 : 0,
      };
    });

    return {
      workflowId,
      enrollments,
      activeEnrollments,
      completions,
      conversionRate: enrollments > 0 ? (completions / enrollments) * 100 : 0,
      revenue: totalRevenue,
      stepPerformance,
    };
  }

  private static validateWorkflow(workflow: any) {
    if (!workflow.steps || workflow.steps.length === 0) {
      throw new Error('Workflow must have at least one step');
    }

    // Additional validation logic
    const hasGoalCheck = workflow.steps.some((s: any) => s.stepType === 'GOAL_CHECK');
    if (!hasGoalCheck) {
      console.warn('Workflow does not have a goal check step');
    }
  }
}
```

---

## Testing Requirements

### Unit Tests
- Workflow creation and validation
- Step execution logic
- A/B test variant selection
- Trigger condition evaluation
- Analytics calculation

### Integration Tests
- Complete workflow execution flow
- Enrollment and step progression
- Trigger firing and workflow activation
- A/B test winner determination
- Analytics data aggregation

### E2E Tests
- Create workflow from template
- Configure multi-step campaign
- Activate workflow and verify trigger
- Monitor workflow analytics
- User receives emails at correct intervals

---

## Dependencies

### Before
- [AUTH-001: User Authentication](../epic-001-auth/AUTH-001-user-authentication.md)
- [MKT-001: Email Campaign Management](../epic-010-marketing/MKT-001-email-campaign-management.md)

### After
- MKT-010: AI-Powered Audience Segmentation
- MKT-011: Dynamic Personalization Engine

---

## Definition of Done

- [ ] Prisma schema includes all workflow models
- [ ] Visual workflow builder with drag-and-drop interface
- [ ] All trigger types implemented and tested
- [ ] Multi-step campaigns with delays and conditions
- [ ] A/B testing for email variants
- [ ] Workflow analytics dashboard
- [ ] Template library with 5+ pre-built workflows
- [ ] API routes tested and documented
- [ ] Unit tests achieve >80% coverage
- [ ] Integration tests pass for complete flows
- [ ] E2E tests verify user experience
- [ ] Code reviewed and approved
- [ ] Documentation complete

---

## Notes

- Use Bull/BullMQ for workflow execution queue
- Implement graceful failure handling and retry logic
- Consider rate limiting for email/SMS sends
- Store workflow execution logs for debugging
- Implement workflow versioning for updates
- Use Redis for real-time workflow state tracking