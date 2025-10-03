# MKT-007: Automated Email Sequences (Drip Campaigns)

**Epic:** EPIC-010: Marketing & Communications
**Story Points:** 8
**Priority:** Medium
**Status:** Ready for Development

---

## User Story

**As an** event organizer
**I want to** create automated email workflows that trigger based on user actions
**So that** I can nurture attendees with personalized, timely communications throughout the event lifecycle

---

## Acceptance Criteria

### Workflow Builder
- [ ] Organizer can create new email workflow from dashboard
- [ ] System provides visual drag-and-drop workflow builder
- [ ] Organizer can name and describe workflow purpose
- [ ] System saves workflow as draft or publish immediately
- [ ] Organizer can duplicate existing workflows
- [ ] System validates workflow logic before publishing
- [ ] Organizer can pause/resume active workflows

### Trigger Configuration
- [ ] Organizer can set workflow trigger: Event Purchase, Event Registration, Event Check-in, Event Date, Custom Date
- [ ] System supports multiple trigger conditions (AND/OR logic)
- [ ] Organizer can filter triggers by ticket type or user segment
- [ ] System tracks when user enters workflow
- [ ] System prevents duplicate workflow entries
- [ ] Organizer can manually add users to workflow
- [ ] System provides trigger preview with estimated audience size

### Email Steps
- [ ] Organizer can add email steps to workflow
- [ ] Each step has delay configuration (immediately, X minutes/hours/days after previous step)
- [ ] Organizer can compose email content for each step
- [ ] System supports merge tags for personalization
- [ ] Organizer can preview each email before publishing
- [ ] System allows reordering of email steps
- [ ] Organizer can mark step as optional based on conditions

### Branching Logic
- [ ] Organizer can add conditional branches (if/else)
- [ ] System supports conditions: Email opened, Link clicked, Ticket purchased, Date passed
- [ ] Organizer can create A/B split test branches
- [ ] System randomly assigns users to A/B branches
- [ ] Branching supports nested conditions
- [ ] Organizer can set default path if condition not met
- [ ] System visualizes branches in workflow diagram

### Wait/Delay Steps
- [ ] Organizer can add wait steps between emails
- [ ] Wait options: X minutes, X hours, X days, Until specific date, Until specific time of day
- [ ] Organizer can set timezone for time-based waits
- [ ] System waits until condition met before proceeding
- [ ] Organizer can add "wait until" conditions (e.g., wait until 2 days before event)
- [ ] System handles timezone conversions automatically

### Exit Conditions
- [ ] Organizer can define workflow exit conditions
- [ ] Exit triggers: User unsubscribes, User completes purchase, Event passed, Manual removal
- [ ] System immediately stops sending emails when user exits
- [ ] Organizer can view list of users who exited and why
- [ ] System prevents re-entry after exit (unless configured)
- [ ] Organizer can manually remove users from workflow

### Pre-Built Workflow Templates
- [ ] System provides 10+ pre-built workflow templates
- [ ] Templates include: Welcome series, Pre-event reminders, Post-event follow-up, Re-engagement, Abandoned cart
- [ ] Organizer can customize templates before activating
- [ ] Templates have recommended timing and content
- [ ] Organizer can save custom workflows as templates
- [ ] System displays template preview before selection

### Workflow Analytics
- [ ] Dashboard shows workflow performance metrics
- [ ] Metrics include: Total enrolled, Currently active, Completed, Exited
- [ ] Dashboard displays email step performance (sent, opened, clicked)
- [ ] Organizer can view conversion rate per workflow
- [ ] System shows drop-off rate at each step
- [ ] Dashboard displays A/B test results
- [ ] Organizer can export workflow report

### Testing & Preview
- [ ] Organizer can send test workflow to themselves
- [ ] System simulates timing delays in preview mode
- [ ] Organizer can view workflow visualization diagram
- [ ] System highlights potential issues (missing content, broken logic)
- [ ] Organizer can test branching paths
- [ ] System provides workflow validation checklist

---

## Technical Requirements

### Email Workflow Engine
```typescript
// Email Workflow Models
interface EmailWorkflow {
  id: string;
  organizationId: string;
  eventId?: string; // null = organization-wide
  name: string;
  description?: string;
  status: 'draft' | 'active' | 'paused' | 'archived';

  // Trigger
  trigger: WorkflowTrigger;
  triggerConditions?: Json; // Complex trigger logic

  // Workflow Steps
  steps: WorkflowStep[];

  // Analytics
  totalEnrolled: number;
  currentlyActive: number;
  completed: number;
  exited: number;

  createdAt: Date;
  updatedAt: Date;
}

interface WorkflowTrigger {
  type: 'EVENT_PURCHASE' | 'EVENT_REGISTRATION' | 'EVENT_CHECKIN' | 'DATE' | 'MANUAL' | 'ABANDONED_CART' | 'CUSTOM';
  conditions?: {
    eventId?: string;
    ticketTypeIds?: string[];
    userSegment?: string;
    dateOffset?: number; // Days before/after event
  };
}

interface WorkflowStep {
  id: string;
  workflowId: string;
  order: number;
  type: 'EMAIL' | 'WAIT' | 'BRANCH' | 'ACTION';

  // Email Step
  emailSubject?: string;
  emailContent?: string;
  emailTemplateId?: string;

  // Wait Step
  waitDuration?: number; // In minutes
  waitUnit?: 'MINUTES' | 'HOURS' | 'DAYS';
  waitUntil?: Date; // Specific date/time
  waitCondition?: 'DATE_BEFORE_EVENT' | 'DATE_AFTER_EVENT' | 'CUSTOM';

  // Branch Step
  branchCondition?: {
    type: 'EMAIL_OPENED' | 'LINK_CLICKED' | 'PURCHASE_MADE' | 'AB_TEST';
    emailStepId?: string;
    targetUrl?: string;
    abSplit?: number; // Percentage for A/B split
  };
  truePath?: string; // Next step ID if condition true
  falsePath?: string; // Next step ID if condition false

  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

interface WorkflowEnrollment {
  id: string;
  workflowId: string;
  userId: string;
  eventId?: string;
  status: 'ACTIVE' | 'COMPLETED' | 'EXITED';
  currentStepId?: string;

  enrolledAt: Date;
  completedAt?: Date;
  exitedAt?: Date;
  exitReason?: string;

  metadata?: Json; // Store workflow-specific data
}

interface WorkflowStepExecution {
  id: string;
  enrollmentId: string;
  stepId: string;
  status: 'PENDING' | 'EXECUTING' | 'COMPLETED' | 'FAILED';

  scheduledAt: Date;
  executedAt?: Date;
  completedAt?: Date;

  // Email tracking
  emailSent: boolean;
  emailOpened: boolean;
  emailClicked: boolean;
  error?: string;
}

// Workflow Execution Engine
export class WorkflowExecutionEngine {
  async enrollUserInWorkflow(
    workflowId: string,
    userId: string,
    eventId?: string
  ): Promise<WorkflowEnrollment> {
    const workflow = await this.getWorkflow(workflowId);

    // Check if already enrolled
    const existing = await prisma.workflowEnrollment.findFirst({
      where: {
        workflowId,
        userId,
        status: 'ACTIVE',
      },
    });

    if (existing) {
      return existing;
    }

    // Create enrollment
    const enrollment = await prisma.workflowEnrollment.create({
      data: {
        workflowId,
        userId,
        eventId,
        status: 'ACTIVE',
        enrolledAt: new Date(),
        currentStepId: workflow.steps[0].id,
      },
    });

    // Schedule first step
    await this.scheduleNextStep(enrollment, workflow.steps[0]);

    return enrollment;
  }

  async scheduleNextStep(
    enrollment: WorkflowEnrollment,
    step: WorkflowStep
  ): Promise<void> {
    const scheduledAt = this.calculateScheduleTime(step);

    await prisma.workflowStepExecution.create({
      data: {
        enrollmentId: enrollment.id,
        stepId: step.id,
        status: 'PENDING',
        scheduledAt,
      },
    });
  }

  private calculateScheduleTime(step: WorkflowStep): Date {
    const now = new Date();

    if (step.waitUntil) {
      return step.waitUntil;
    }

    if (step.waitDuration) {
      const milliseconds = this.convertToMilliseconds(
        step.waitDuration,
        step.waitUnit
      );
      return new Date(now.getTime() + milliseconds);
    }

    return now; // Execute immediately
  }

  private convertToMilliseconds(duration: number, unit: string): number {
    const multipliers = {
      MINUTES: 60 * 1000,
      HOURS: 60 * 60 * 1000,
      DAYS: 24 * 60 * 60 * 1000,
    };

    return duration * (multipliers[unit] || 1);
  }

  async processPendingSteps(): Promise<void> {
    const now = new Date();

    const pendingSteps = await prisma.workflowStepExecution.findMany({
      where: {
        status: 'PENDING',
        scheduledAt: { lte: now },
      },
      include: {
        enrollment: {
          include: {
            user: true,
            workflow: true,
          },
        },
        step: true,
      },
    });

    for (const execution of pendingSteps) {
      try {
        await this.executeStep(execution);
      } catch (error) {
        await this.handleStepError(execution, error);
      }
    }
  }

  async executeStep(execution: WorkflowStepExecution): Promise<void> {
    const { step, enrollment } = execution;

    // Update status
    await prisma.workflowStepExecution.update({
      where: { id: execution.id },
      data: {
        status: 'EXECUTING',
        executedAt: new Date(),
      },
    });

    switch (step.type) {
      case 'EMAIL':
        await this.executeEmailStep(execution, step, enrollment);
        break;

      case 'WAIT':
        await this.executeWaitStep(execution, step, enrollment);
        break;

      case 'BRANCH':
        await this.executeBranchStep(execution, step, enrollment);
        break;

      case 'ACTION':
        await this.executeActionStep(execution, step, enrollment);
        break;
    }

    // Mark as completed
    await prisma.workflowStepExecution.update({
      where: { id: execution.id },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
      },
    });

    // Schedule next step
    await this.scheduleNextWorkflowStep(execution, enrollment);
  }

  private async executeEmailStep(
    execution: WorkflowStepExecution,
    step: WorkflowStep,
    enrollment: WorkflowEnrollment
  ): Promise<void> {
    const user = await this.getUser(enrollment.userId);

    const emailContent = this.renderEmailTemplate(
      step.emailContent,
      {
        user,
        event: enrollment.event,
        workflow: enrollment.workflow,
      }
    );

    await this.emailService.send({
      to: user.email,
      subject: step.emailSubject,
      html: emailContent,
      trackOpens: true,
      trackClicks: true,
      metadata: {
        workflowId: enrollment.workflowId,
        enrollmentId: enrollment.id,
        stepId: step.id,
        executionId: execution.id,
      },
    });

    await prisma.workflowStepExecution.update({
      where: { id: execution.id },
      data: { emailSent: true },
    });
  }

  private async executeBranchStep(
    execution: WorkflowStepExecution,
    step: WorkflowStep,
    enrollment: WorkflowEnrollment
  ): Promise<void> {
    const condition = step.branchCondition;
    let conditionMet = false;

    switch (condition.type) {
      case 'EMAIL_OPENED':
        conditionMet = await this.checkEmailOpened(
          enrollment.id,
          condition.emailStepId
        );
        break;

      case 'LINK_CLICKED':
        conditionMet = await this.checkLinkClicked(
          enrollment.id,
          condition.targetUrl
        );
        break;

      case 'PURCHASE_MADE':
        conditionMet = await this.checkPurchaseMade(enrollment.userId);
        break;

      case 'AB_TEST':
        conditionMet = Math.random() < (condition.abSplit / 100);
        break;
    }

    // Determine next step based on condition
    const nextStepId = conditionMet ? step.truePath : step.falsePath;

    if (nextStepId) {
      await prisma.workflowEnrollment.update({
        where: { id: enrollment.id },
        data: { currentStepId: nextStepId },
      });
    }
  }

  private async scheduleNextWorkflowStep(
    currentExecution: WorkflowStepExecution,
    enrollment: WorkflowEnrollment
  ): Promise<void> {
    const workflow = await this.getWorkflow(enrollment.workflowId);
    const currentStep = workflow.steps.find(s => s.id === currentExecution.stepId);

    // Find next step in sequence
    const nextStep = workflow.steps.find(s => s.order === currentStep.order + 1);

    if (nextStep) {
      await this.scheduleNextStep(enrollment, nextStep);
    } else {
      // Workflow completed
      await prisma.workflowEnrollment.update({
        where: { id: enrollment.id },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
        },
      });
    }
  }

  async exitUserFromWorkflow(
    enrollmentId: string,
    reason: string
  ): Promise<void> {
    await prisma.workflowEnrollment.update({
      where: { id: enrollmentId },
      data: {
        status: 'EXITED',
        exitedAt: new Date(),
        exitReason: reason,
      },
    });

    // Cancel pending steps
    await prisma.workflowStepExecution.updateMany({
      where: {
        enrollmentId,
        status: 'PENDING',
      },
      data: {
        status: 'FAILED',
        error: `User exited workflow: ${reason}`,
      },
    });
  }

  private renderEmailTemplate(
    template: string,
    data: any
  ): string {
    return template
      .replace(/\{\{user\.firstName\}\}/g, data.user.firstName)
      .replace(/\{\{user\.lastName\}\}/g, data.user.lastName)
      .replace(/\{\{event\.title\}\}/g, data.event?.title || '')
      .replace(/\{\{event\.date\}\}/g, data.event?.startDate || '');
  }
}
```

### Workflow Trigger System
```typescript
// Trigger Handler
export class WorkflowTriggerHandler {
  async handleEventPurchase(
    userId: string,
    orderId: string,
    eventId: string
  ): Promise<void> {
    const workflows = await prisma.emailWorkflow.findMany({
      where: {
        status: 'active',
        'trigger.type': 'EVENT_PURCHASE',
        OR: [
          { eventId },
          { eventId: null }, // Organization-wide
        ],
      },
    });

    for (const workflow of workflows) {
      // Check if user matches trigger conditions
      if (await this.matchesTriggerConditions(workflow, userId, orderId)) {
        await this.executionEngine.enrollUserInWorkflow(
          workflow.id,
          userId,
          eventId
        );
      }
    }
  }

  async handleEventCheckin(
    userId: string,
    eventId: string
  ): Promise<void> {
    const workflows = await prisma.emailWorkflow.findMany({
      where: {
        status: 'active',
        'trigger.type': 'EVENT_CHECKIN',
        OR: [{ eventId }, { eventId: null }],
      },
    });

    for (const workflow of workflows) {
      await this.executionEngine.enrollUserInWorkflow(
        workflow.id,
        userId,
        eventId
      );
    }
  }

  async handleDateTriggers(): Promise<void> {
    // Find workflows with date-based triggers
    const workflows = await prisma.emailWorkflow.findMany({
      where: {
        status: 'active',
        'trigger.type': 'DATE',
      },
      include: { event: true },
    });

    for (const workflow of workflows) {
      const triggerDate = this.calculateTriggerDate(workflow);

      if (this.isToday(triggerDate)) {
        // Enroll all event attendees
        const attendees = await this.getEventAttendees(workflow.eventId);

        for (const attendee of attendees) {
          await this.executionEngine.enrollUserInWorkflow(
            workflow.id,
            attendee.userId,
            workflow.eventId
          );
        }
      }
    }
  }

  private calculateTriggerDate(workflow: EmailWorkflow): Date {
    const event = workflow.event;
    const offset = workflow.trigger.conditions?.dateOffset || 0;

    const eventDate = new Date(event.startDate);
    eventDate.setDate(eventDate.getDate() + offset);

    return eventDate;
  }

  private async matchesTriggerConditions(
    workflow: EmailWorkflow,
    userId: string,
    orderId: string
  ): Promise<boolean> {
    const conditions = workflow.trigger.conditions;

    if (!conditions) return true;

    // Check ticket type filter
    if (conditions.ticketTypeIds && conditions.ticketTypeIds.length > 0) {
      const order = await this.getOrder(orderId);
      const hasMatchingTicket = order.items.some(item =>
        conditions.ticketTypeIds.includes(item.ticketTypeId)
      );

      if (!hasMatchingTicket) return false;
    }

    // Check user segment
    if (conditions.userSegment) {
      const inSegment = await this.userInSegment(userId, conditions.userSegment);
      if (!inSegment) return false;
    }

    return true;
  }
}
```

---

## Database Schema

```prisma
model EmailWorkflow {
  id                String   @id @default(cuid())
  organizationId    String
  organization      Organization @relation(fields: [organizationId], references: [id])
  eventId           String?
  event             Event? @relation(fields: [eventId], references: [id])

  name              String
  description       String?
  status            WorkflowStatus @default(DRAFT)

  trigger           Json     // WorkflowTrigger
  steps             WorkflowStep[]
  enrollments       WorkflowEnrollment[]

  // Analytics
  totalEnrolled     Int      @default(0)
  currentlyActive   Int      @default(0)
  completed         Int      @default(0)
  exited            Int      @default(0)

  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  @@index([organizationId])
  @@index([eventId])
  @@index([status])
}

model WorkflowStep {
  id                String   @id @default(cuid())
  workflowId        String
  workflow          EmailWorkflow @relation(fields: [workflowId], references: [id], onDelete: Cascade)
  order             Int
  type              StepType

  // Email Step
  emailSubject      String?
  emailContent      String?  @db.Text
  emailTemplateId   String?

  // Wait Step
  waitDuration      Int?
  waitUnit          WaitUnit?
  waitUntil         DateTime?
  waitCondition     String?

  // Branch Step
  branchCondition   Json?
  truePath          String?  // Next step ID
  falsePath         String?

  executions        WorkflowStepExecution[]

  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  @@index([workflowId])
  @@unique([workflowId, order])
}

model WorkflowEnrollment {
  id                String   @id @default(cuid())
  workflowId        String
  workflow          EmailWorkflow @relation(fields: [workflowId], references: [id])
  userId            String
  user              User @relation(fields: [userId], references: [id])
  eventId           String?
  event             Event? @relation(fields: [eventId], references: [id])

  status            EnrollmentStatus @default(ACTIVE)
  currentStepId     String?

  enrolledAt        DateTime @default(now())
  completedAt       DateTime?
  exitedAt          DateTime?
  exitReason        String?

  metadata          Json?

  executions        WorkflowStepExecution[]

  @@index([workflowId])
  @@index([userId])
  @@index([status])
}

model WorkflowStepExecution {
  id                String   @id @default(cuid())
  enrollmentId      String
  enrollment        WorkflowEnrollment @relation(fields: [enrollmentId], references: [id])
  stepId            String
  step              WorkflowStep @relation(fields: [stepId], references: [id])

  status            ExecutionStatus @default(PENDING)

  scheduledAt       DateTime
  executedAt        DateTime?
  completedAt       DateTime?

  emailSent         Boolean  @default(false)
  emailOpened       Boolean  @default(false)
  emailClicked      Boolean  @default(false)
  error             String?

  @@index([enrollmentId])
  @@index([stepId])
  @@index([status])
  @@index([scheduledAt])
}

enum WorkflowStatus {
  DRAFT
  ACTIVE
  PAUSED
  ARCHIVED
}

enum StepType {
  EMAIL
  WAIT
  BRANCH
  ACTION
}

enum WaitUnit {
  MINUTES
  HOURS
  DAYS
}

enum EnrollmentStatus {
  ACTIVE
  COMPLETED
  EXITED
}

enum ExecutionStatus {
  PENDING
  EXECUTING
  COMPLETED
  FAILED
}
```

---

## API Endpoints

```typescript
// Workflow Management
POST   /api/workflows                  // Create workflow
GET    /api/workflows                  // List workflows
GET    /api/workflows/:id              // Get workflow details
PUT    /api/workflows/:id              // Update workflow
DELETE /api/workflows/:id              // Delete workflow
POST   /api/workflows/:id/duplicate    // Duplicate workflow
POST   /api/workflows/:id/pause        // Pause workflow
POST   /api/workflows/:id/activate     // Activate workflow

// Workflow Steps
POST   /api/workflows/:id/steps        // Add step
PUT    /api/workflows/:id/steps/:stepId // Update step
DELETE /api/workflows/:id/steps/:stepId // Delete step
POST   /api/workflows/:id/steps/reorder // Reorder steps

// Enrollments
GET    /api/workflows/:id/enrollments  // List enrollments
POST   /api/workflows/:id/enroll       // Manually enroll user
DELETE /api/enrollments/:id            // Remove user from workflow

// Analytics
GET    /api/workflows/:id/analytics    // Get workflow analytics
GET    /api/workflows/:id/steps/:stepId/analytics // Step analytics

// Templates
GET    /api/workflows/templates        // List workflow templates
```

---

## Pre-Built Workflow Templates

### 1. Welcome Series (New Ticket Buyer)
- **Trigger:** Event Purchase
- **Steps:**
  1. Immediate: Welcome email with event details
  2. Wait 1 day: Tips to prepare for the event
  3. Wait 3 days: Introduce event organizer and community

### 2. Pre-Event Reminder Series
- **Trigger:** 7 days before event
- **Steps:**
  1. Immediate: 7-day reminder with event schedule
  2. Wait 5 days: 2-day reminder with parking/venue info
  3. Wait 1 day: Same-day reminder with check-in instructions

### 3. Post-Event Follow-Up
- **Trigger:** Event Check-in
- **Steps:**
  1. Wait 1 day: Thank you email with feedback survey
  2. Wait 3 days: Share event photos and highlights
  3. Wait 7 days: Promote upcoming events

### 4. Re-Engagement Campaign
- **Trigger:** Manual (inactive users)
- **Steps:**
  1. Immediate: "We miss you" email
  2. Wait 3 days: Special discount offer
  3. Branch: If opened → Wait 2 days → Final reminder; If not opened → Exit

### 5. VIP Experience Series
- **Trigger:** VIP Ticket Purchase
- **Steps:**
  1. Immediate: VIP welcome with exclusive perks
  2. Wait 2 days: VIP-only content or early access
  3. Wait 5 days: Pre-event VIP meetup invitation

---

## Workflow Builder UI

### Visual Workflow Editor
1. **Canvas**
   - Drag-and-drop interface
   - Flowchart visualization
   - Zoom in/out controls
   - Auto-layout button

2. **Step Palette (Left Sidebar)**
   - Email step icon
   - Wait/Delay step icon
   - Branch/Decision step icon
   - Action step icon
   - Drag to canvas to add

3. **Step Configuration (Right Sidebar)**
   - Step name input
   - Type-specific fields
   - Advanced settings (collapsible)
   - Delete step button

4. **Toolbar**
   - Save draft button
   - Publish button
   - Test workflow button
   - Workflow settings
   - Analytics button

---

## Testing Requirements

### Unit Tests
- Workflow step scheduling calculation
- Conditional branch logic
- Email template rendering with merge tags
- Enrollment duplication prevention
- Exit condition handling

### Integration Tests
- User enrollment on purchase trigger
- Email sending through workflow steps
- Wait step timing accuracy
- Branch path execution based on conditions
- Analytics aggregation

### E2E Tests
- Create workflow from scratch
- Test complete workflow execution
- Verify A/B branch distribution
- Test workflow pause/resume
- Validate analytics dashboard accuracy

---

## Dependencies
- **Requires:** Email service (MKT-001), Event system, User database
- **Integrates With:** Analytics, Discount codes, Contact lists
- **Blocks:** None

---

## Notes
- Use Redis or similar for step scheduling queue
- Implement workflow execution logs for debugging
- Consider workflow version control for edits
- Future: Add SMS steps to workflows
- Future: Implement workflow AI suggestions based on performance