# EV-008: Event Editing and Updates

**Epic**: EPIC-002: Event Management Core
**Story Points**: 3
**Priority**: High
**Status**: Ready for Development
**Sprint**: TBD

---

## User Story

**As an** event organizer
**I want to** edit and update my event details after creation
**So that** I can correct mistakes, add information, and keep attendees informed of changes

---

## Business Value

- **User Value**: Flexibility to update events reduces organizer frustration and improves event quality
- **Business Value**: Accurate, up-to-date event information increases attendee satisfaction and reduces support requests
- **Impact**: Critical for maintaining event accuracy and organizer confidence
- **Revenue Impact**: Ability to update events reduces cancellations due to correctable errors

---

## INVEST Criteria

- **Independent**: Can be developed independently with existing Event model
- **Negotiable**: Notification strategy and change tracking can be adjusted
- **Valuable**: Essential for event lifecycle management
- **Estimable**: Clear scope with well-defined requirements
- **Small**: Can be completed within one sprint
- **Testable**: Clear acceptance criteria with measurable outcomes

---

## Acceptance Criteria

### AC1: Access Event Edit Page
**Given** I am an authenticated organizer
**When** I view my event in the dashboard
**Then** I should see:
- "Edit Event" button prominently displayed
- Button is only visible for events I created
- Clicking button navigates to edit page at `/dashboard/events/[eventId]/edit`
- Edit page pre-populates with current event data

### AC2: Edit All Event Fields
**Given** I am on the event edit page
**When** the page loads
**Then** I should be able to edit:
- Event title and subtitle
- Description (rich text editor)
- Category/type
- Start date and time
- End date and time
- Venue/location details
- Event images
- Ticket types and pricing
- Capacity limits
- Registration deadline
- Event status (draft/published)

### AC3: Field Validation
**Given** I am editing event fields
**When** I modify values
**Then** the system should:
- Validate required fields in real-time
- Show validation errors inline
- Prevent submission with invalid data
- Validate date/time logic (end after start)
- Validate capacity and pricing constraints
- Highlight changed fields

### AC4: Save Changes
**Given** I have made changes to event fields
**When** I click "Save Changes"
**Then** the system should:
- Validate all fields
- Save changes to database
- Show success confirmation message
- Update the event's `updatedAt` timestamp
- Redirect to event detail page or stay on edit page (user choice)

### AC5: Optimistic UI Updates
**Given** I am saving changes
**When** the save request is processing
**Then**:
- UI shows immediate feedback (optimistic update)
- Save button shows loading state
- Form fields are temporarily disabled
- If save fails, revert to previous values
- Error message displayed if save fails

### AC6: Change Tracking and History
**Given** I edit an event
**When** changes are saved
**Then** the system should:
- Track which fields were changed
- Record timestamp of change
- Store previous values (audit log)
- Show "Last updated" timestamp on event detail page
- Allow viewing change history (future enhancement)

### AC7: Attendee Notifications for Significant Changes
**Given** I make significant changes to a published event with ticket holders
**When** I save the changes
**Then** the system should:
- Detect significant changes (date/time, location, cancellation)
- Prompt me to notify attendees
- Show preview of notification email
- Send email to all ticket holders if I confirm
- Include change details in notification
- Log that notifications were sent

### AC8: Restrictions on Editing Published Events
**Given** my event has active ticket sales
**When** I attempt to edit certain fields
**Then** the system should:
- Allow editing of description, images, and non-critical details
- Warn before changing date/time or location
- Prevent changing ticket prices for already-purchased tickets
- Prevent reducing capacity below current ticket sales
- Show warning if changes may impact attendees

### AC9: Draft vs Published Editing
**Given** I am editing an event
**When** I view the edit form
**Then**:
- Draft events can be edited without restrictions
- Draft events show "Save as Draft" and "Publish" options
- Published events show "Save Changes" option
- Published events require confirmation for major changes
- Cannot revert published event to draft if tickets sold

### AC10: Concurrent Edit Protection
**Given** another admin is editing the same event
**When** I attempt to save my changes
**Then** the system should:
- Detect concurrent edits (optimistic locking)
- Warn me that another user has made changes
- Show comparison of conflicting changes
- Allow me to choose to overwrite or merge
- Prevent data loss from concurrent edits

---

## Technical Implementation Tasks

### Task 1: Create Event Edit Page Route
- [ ] Create `app/dashboard/events/[eventId]/edit/page.tsx`
- [ ] Implement server-side data fetching for event
- [ ] Add authorization check (user must be organizer)
- [ ] Add loading state
- [ ] Add error handling for event not found

### Task 2: Build Event Edit Form Component
- [ ] Create EventEditForm component
- [ ] Reuse form components from event creation (EV-001)
- [ ] Pre-populate form with existing event data
- [ ] Implement controlled form state with React Hook Form
- [ ] Add form validation with Zod schema

### Task 3: Implement Field-Level Validation
- [ ] Add real-time validation for all fields
- [ ] Show inline error messages
- [ ] Highlight changed fields
- [ ] Validate date/time relationships
- [ ] Validate capacity constraints

### Task 4: Create Update API Endpoint
- [ ] Create PATCH `/api/events/[eventId]` endpoint
- [ ] Implement authorization (organizer only)
- [ ] Validate request body
- [ ] Update event in database
- [ ] Return updated event data
- [ ] Handle partial updates (only changed fields)

### Task 5: Implement Change Tracking
- [ ] Create EventAuditLog model in Prisma
- [ ] Track field-level changes
- [ ] Store old and new values
- [ ] Record user who made change
- [ ] Add timestamp for each change

### Task 6: Build Notification System for Changes
- [ ] Create change detection logic
- [ ] Identify "significant" changes (date, time, location, cancellation)
- [ ] Create notification prompt UI
- [ ] Build email template for change notifications
- [ ] Implement bulk email sending to ticket holders
- [ ] Add option to skip notification (with confirmation)

### Task 7: Implement Optimistic Updates
- [ ] Use React Query or SWR for optimistic UI
- [ ] Show immediate feedback on save
- [ ] Handle rollback on error
- [ ] Add loading states during save
- [ ] Implement retry mechanism for failed saves

### Task 8: Add Editing Restrictions
- [ ] Implement business rules for published events
- [ ] Check if event has active ticket sales
- [ ] Add warnings for significant changes
- [ ] Prevent invalid operations (reduce capacity below sales)
- [ ] Create confirmation dialogs for risky changes

### Task 9: Implement Concurrent Edit Protection
- [ ] Add version field to Event model
- [ ] Implement optimistic locking
- [ ] Detect concurrent edits on save
- [ ] Show conflict resolution UI
- [ ] Allow user to review and merge changes

### Task 10: Testing
- [ ] Unit tests for validation logic
- [ ] Unit tests for change detection
- [ ] Component tests for EventEditForm
- [ ] Integration tests for update API endpoint
- [ ] E2E tests for full edit workflow
- [ ] Test authorization and access control
- [ ] Test concurrent edit scenarios
- [ ] Test notification delivery

---

## Dependencies

### Required Before Starting
- ✅ Event model in Prisma schema
- ✅ Event creation form components (EV-001)
- ✅ Authentication system
- ⏳ Email notification system configured
- ⏳ EventAuditLog model created

### Blocks
- None - can proceed independently

### Related Stories
- EV-001: Event creation (shares form components)
- EV-007: Event image upload (integrated in edit form)
- EV-009: Event status management (integrated status changes)
- PAY-002: Ticket management (validates capacity constraints)

---

## Technical Specifications

### Event Update API Endpoint
```typescript
// PATCH /api/events/[eventId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { eventUpdateSchema } from '@/lib/validations/event';

export async function PATCH(
  req: NextRequest,
  { params }: { params: { eventId: string } }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Fetch existing event
  const event = await prisma.event.findUnique({
    where: { id: params.eventId },
    include: {
      tickets: true,
      _count: { select: { orders: true } }
    }
  });

  if (!event) {
    return NextResponse.json({ error: 'Event not found' }, { status: 404 });
  }

  // Authorization check
  if (event.organizerId !== session.user.id && session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json();
  const validatedData = eventUpdateSchema.parse(body);

  // Check for concurrent edits (optimistic locking)
  if (body.version && body.version !== event.version) {
    return NextResponse.json({
      error: 'Event was modified by another user',
      currentVersion: event.version
    }, { status: 409 });
  }

  // Detect significant changes
  const significantChanges = detectSignificantChanges(event, validatedData);

  // Business rule validations for published events
  if (event.status === 'PUBLISHED' && event._count.orders > 0) {
    // Cannot reduce capacity below current sales
    if (validatedData.capacity && validatedData.capacity < event._count.orders) {
      return NextResponse.json({
        error: 'Cannot reduce capacity below current ticket sales'
      }, { status: 400 });
    }
  }

  // Track changes for audit log
  const changes = detectChanges(event, validatedData);

  // Update event
  const updatedEvent = await prisma.event.update({
    where: { id: params.eventId },
    data: {
      ...validatedData,
      version: { increment: 1 }, // Optimistic locking
      updatedAt: new Date()
    },
    include: {
      organizer: true,
      venue: true,
      tickets: true
    }
  });

  // Create audit log entry
  await prisma.eventAuditLog.create({
    data: {
      eventId: params.eventId,
      userId: session.user.id,
      action: 'UPDATE',
      changes: changes,
      timestamp: new Date()
    }
  });

  // Send notifications if significant changes
  if (significantChanges.length > 0 && body.notifyAttendees) {
    await sendChangeNotifications(updatedEvent, significantChanges);
  }

  return NextResponse.json({
    success: true,
    event: updatedEvent,
    significantChanges
  });
}

function detectSignificantChanges(original: Event, updated: Partial<Event>) {
  const significant = [];

  if (updated.startDate && updated.startDate !== original.startDate) {
    significant.push({ field: 'startDate', old: original.startDate, new: updated.startDate });
  }

  if (updated.endDate && updated.endDate !== original.endDate) {
    significant.push({ field: 'endDate', old: original.endDate, new: updated.endDate });
  }

  if (updated.venueId && updated.venueId !== original.venueId) {
    significant.push({ field: 'venue', old: original.venueId, new: updated.venueId });
  }

  if (updated.status === 'CANCELLED' && original.status !== 'CANCELLED') {
    significant.push({ field: 'status', old: original.status, new: 'CANCELLED' });
  }

  return significant;
}
```

### EventAuditLog Model
```prisma
model EventAuditLog {
  id        String   @id @default(cuid())
  eventId   String
  event     Event    @relation(fields: [eventId], references: [id], onDelete: Cascade)
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  action    String   // CREATE, UPDATE, DELETE, PUBLISH, CANCEL
  changes   Json     // { field: { old: value, new: value } }
  timestamp DateTime @default(now())

  @@index([eventId])
  @@index([userId])
  @@index([timestamp])
}

model Event {
  // ... existing fields ...
  version   Int      @default(1)  // For optimistic locking
  auditLogs EventAuditLog[]
}
```

### Change Notification Email Template
```typescript
// Email template for event changes
const changeNotificationTemplate = (event: Event, changes: Change[]) => `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #f4f4f4; padding: 20px; text-align: center; }
    .content { padding: 20px; }
    .change { background-color: #fff3cd; padding: 10px; margin: 10px 0; border-left: 4px solid #ffc107; }
    .button { display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>Event Update: ${event.title}</h2>
    </div>
    <div class="content">
      <p>Hello,</p>
      <p>The event you have tickets for has been updated:</p>

      ${changes.map(change => `
        <div class="change">
          <strong>${formatFieldName(change.field)} changed:</strong><br>
          <del>${formatValue(change.old)}</del> → <strong>${formatValue(change.new)}</strong>
        </div>
      `).join('')}

      <p>Please review the updated event details:</p>
      <a href="${process.env.NEXT_PUBLIC_URL}/events/${event.id}" class="button">View Event Details</a>

      <p>If you have any questions, please contact the event organizer.</p>
    </div>
  </div>
</body>
</html>
`;
```

### Concurrent Edit Detection UI
```typescript
// ConflictResolutionModal component
interface ConflictResolutionProps {
  currentData: Event;
  serverData: Event;
  onResolve: (resolution: 'overwrite' | 'merge' | 'cancel') => void;
}

function ConflictResolutionModal({ currentData, serverData, onResolve }: ConflictResolutionProps) {
  const conflicts = detectConflicts(currentData, serverData);

  return (
    <Modal>
      <h2>Event Modified by Another User</h2>
      <p>This event was updated while you were editing. Please review the conflicts:</p>

      {conflicts.map(conflict => (
        <div key={conflict.field}>
          <h4>{formatFieldName(conflict.field)}</h4>
          <p>Your version: {conflict.yourValue}</p>
          <p>Server version: {conflict.serverValue}</p>
        </div>
      ))}

      <div className="actions">
        <button onClick={() => onResolve('overwrite')}>
          Overwrite with My Changes
        </button>
        <button onClick={() => onResolve('merge')}>
          Keep Server Version
        </button>
        <button onClick={() => onResolve('cancel')}>
          Cancel My Changes
        </button>
      </div>
    </Modal>
  );
}
```

---

## Edge Cases & Error Scenarios

1. **Event Not Found**: Show 404 error page
2. **Unauthorized Access**: Redirect to unauthorized page if user is not organizer
3. **Concurrent Edits**: Detect version conflicts and show resolution UI
4. **Network Failure During Save**: Show error and allow retry
5. **Invalid Field Values**: Show validation errors inline
6. **Reducing Capacity Below Sales**: Prevent with clear error message
7. **Changing Date After Tickets Sold**: Require confirmation and notify attendees
8. **Editing Cancelled Event**: Allow editing but prevent status change to published
9. **Image Upload Failure**: Allow saving event without image changes
10. **Notification Delivery Failure**: Log error but complete event update
11. **Very Long Description**: Validate max length to prevent database errors
12. **Timezone Changes**: Handle timezone conversions carefully

---

## Definition of Done

- [ ] All acceptance criteria are met and verified
- [ ] Event edit page route created and functional
- [ ] Edit form pre-populates with existing event data
- [ ] All event fields are editable
- [ ] Field validation working (real-time and on submit)
- [ ] Update API endpoint implemented and secured
- [ ] Change tracking and audit log working
- [ ] Attendee notifications implemented for significant changes
- [ ] Editing restrictions enforced for published events
- [ ] Optimistic updates implemented with proper error handling
- [ ] Concurrent edit protection working
- [ ] Unit tests written with >80% coverage
- [ ] Component tests for EventEditForm
- [ ] Integration tests for update API endpoint
- [ ] E2E tests for full edit workflow
- [ ] Authorization and access control tested
- [ ] Notification delivery tested
- [ ] Accessibility audit passes WCAG 2.1 AA standards
- [ ] Code reviewed and approved by tech lead
- [ ] Documentation updated (API specs, user guide)
- [ ] Deployed to staging and validated
- [ ] Product owner approval obtained

---

## Testing Strategy

### Unit Tests
- Validation schema and logic
- Change detection functions
- Significant change detection
- Field comparison utilities
- Email template generation

### Component Tests
- EventEditForm component
- Field validation display
- Change highlighting
- Save button states
- Notification prompt UI
- Conflict resolution modal

### Integration Tests
- Update API endpoint with valid data
- Update API endpoint with invalid data
- Authorization checks
- Concurrent edit scenarios
- Change tracking and audit log creation
- Notification email sending

### E2E Tests
- Navigate to edit page from dashboard
- Edit various fields and save
- Edit published event with tickets sold
- Trigger attendee notification
- Handle concurrent edit conflict
- Cancel editing and return to dashboard

### Security Tests
- Authorization bypass attempts
- SQL injection in edit fields
- XSS in text fields
- CSRF protection
- Rate limiting on update endpoint

---

## Notes & Considerations

### Future Enhancements
- Version history with ability to rollback changes
- Bulk edit for multiple events
- Templates for common event types
- Change approval workflow for certain fields
- Integration with calendar systems for automatic updates
- Real-time collaboration (multiple users editing simultaneously)
- Preview changes before publishing
- Schedule changes for future date/time

### Business Rules to Document
- Which changes require attendee notification
- Who can edit published events (organizer, admin, staff)
- Time limits for editing after event ends
- Refund policy for significant changes
- Cancellation notice period requirements

### Monitoring and Analytics
- Track edit frequency per event
- Monitor failed save attempts
- Track notification delivery success rate
- Alert on high-frequency edits (potential issues)
- Track which fields are edited most frequently

### UX Considerations
- Auto-save draft changes periodically
- Show unsaved changes indicator
- Warn before navigating away with unsaved changes
- Provide clear feedback for all save operations
- Highlight what changed after save
- Make it easy to notify attendees of changes

---

**Created**: 2025-09-30
**Last Updated**: 2025-09-30
**Estimated Effort**: 18-22 hours
**Assigned To**: TBD