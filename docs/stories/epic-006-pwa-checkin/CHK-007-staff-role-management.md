# Story: CHK-007 - Staff Role Management

**Epic**: EPIC-006 - Mobile Check-in PWA
**Story Points**: 3
**Priority**: P2 (Medium)
**Status**: Draft
**Dependencies**: CHK-001 (PWA Framework), AUTH-001 (User Authentication), RBAC system

---

## Story

**As an** event organizer
**I want to** assign different staff roles with appropriate check-in permissions
**So that** I can control access levels and delegate responsibilities effectively

---

## Acceptance Criteria

1. GIVEN I'm an event organizer
   WHEN I access staff management
   THEN I should be able to:
   - View all assigned staff members
   - Invite new staff by email
   - Assign role: Scanner, Manager, or Supervisor
   - Set per-event permissions
   - Remove or deactivate staff
   - See who has accessed check-in app
   - Track staff activity

2. GIVEN I invite a staff member
   WHEN I send the invitation
   THEN the system should:
   - Send email with invitation link
   - Include event details
   - Specify assigned role
   - Provide app download/access instructions
   - Set expiration (7 days)
   - Allow re-sending if needed
   - Track invitation status (pending, accepted, expired)

3. GIVEN I'm assigned as "Scanner" role
   WHEN I log into check-in app
   THEN I should be able to:
   - Scan QR codes and check in attendees
   - Search for attendees manually
   - View check-in statistics (read-only)
   - Access my assigned event(s) only
   - NOT override check-in conflicts
   - NOT access sensitive attendee data
   - NOT modify event settings

4. GIVEN I'm assigned as "Manager" role
   WHEN I log into check-in app
   THEN I should be able to:
   - All Scanner permissions PLUS:
   - Override duplicate check-in warnings
   - Check out attendees
   - View detailed analytics
   - Access all ticket types
   - Export check-in reports
   - View all staff activity
   - Manage other Scanners (not other Managers)

5. GIVEN I'm assigned as "Supervisor" role
   WHEN I log into check-in app
   THEN I should be able to:
   - All Manager permissions PLUS:
   - Add/remove staff members
   - Change staff roles
   - Access multi-event dashboard
   - Configure check-in settings
   - View audit logs
   - Emergency stop check-ins
   - Manage all staff levels

6. GIVEN a staff member's role is changed
   WHEN the change is saved
   THEN the system should:
   - Update permissions immediately
   - Invalidate their current session
   - Require them to log in again
   - Notify them of role change via email
   - Log the change with timestamp
   - Reflect new permissions on next login

---

## Tasks / Subtasks

- [ ] Create staff management interface (AC: 1)
  - [ ] Design staff list view
  - [ ] Add staff management actions
  - [ ] Show staff status
  - [ ] Track staff activity

- [ ] Implement staff invitation system (AC: 2)
  - [ ] Create invitation email template
  - [ ] Generate invitation tokens
  - [ ] Send invitation emails
  - [ ] Track invitation status

- [ ] Define role permission system (AC: 3, 4, 5)
  - [ ] Create role definitions
  - [ ] Map permissions per role
  - [ ] Implement RBAC checks
  - [ ] Document permission matrix

- [ ] Build Scanner role implementation (AC: 3)
  - [ ] Restrict to basic check-in
  - [ ] Limit data access
  - [ ] Hide management features
  - [ ] Read-only statistics

- [ ] Build Manager role implementation (AC: 4)
  - [ ] Add override capabilities
  - [ ] Enable analytics access
  - [ ] Allow report export
  - [ ] Show staff management (limited)

- [ ] Build Supervisor role implementation (AC: 5)
  - [ ] Full staff management
  - [ ] Multi-event access
  - [ ] Audit log access
  - [ ] System configuration

- [ ] Implement role-based UI rendering (AC: 3, 4, 5)
  - [ ] Show/hide features by role
  - [ ] Disable unauthorized actions
  - [ ] Display role badge
  - [ ] Contextual help per role

- [ ] Add permission middleware (AC: 3, 4, 5)
  - [ ] Server-side permission checks
  - [ ] API endpoint protection
  - [ ] Role validation
  - [ ] Error handling

- [ ] Create role change handling (AC: 6)
  - [ ] Update user role
  - [ ] Invalidate sessions
  - [ ] Send notification email
  - [ ] Log role changes

- [ ] Build invitation acceptance flow (AC: 2)
  - [ ] Validate invitation token
  - [ ] Create/link user account
  - [ ] Activate staff role
  - [ ] Redirect to check-in app

- [ ] Add staff activity tracking (AC: 1)
  - [ ] Log staff logins
  - [ ] Track check-in actions
  - [ ] Record last activity
  - [ ] Generate activity reports

- [ ] Implement session management (AC: 6)
  - [ ] Role-based session data
  - [ ] Automatic session refresh
  - [ ] Session invalidation
  - [ ] Multi-device handling

- [ ] Create audit logging (AC: 5, 6)
  - [ ] Log all role changes
  - [ ] Log permission grants/revokes
  - [ ] Log staff invitations
  - [ ] Searchable audit trail

- [ ] Add bulk staff operations (AC: 1)
  - [ ] Bulk invite staff
  - [ ] Bulk role assignment
  - [ ] Bulk deactivation
  - [ ] CSV import/export

---

## Dev Notes

### Architecture References

**Role-Based Access Control** (`docs/architecture/rbac.md`):
- Three-tier role system: Scanner → Manager → Supervisor
- Hierarchical permissions (higher roles inherit lower)
- Per-event role assignment
- Server-side permission enforcement
- Client-side UI adaptation

**Permission Matrix** (`docs/architecture/permissions.md`):
```typescript
enum Permission {
  // Basic check-in
  CHECK_IN_SCAN = 'check_in:scan',
  CHECK_IN_SEARCH = 'check_in:search',
  CHECK_IN_VIEW_STATS = 'check_in:view_stats',

  // Manager
  CHECK_IN_OVERRIDE = 'check_in:override',
  CHECK_IN_CHECKOUT = 'check_in:checkout',
  CHECK_IN_ANALYTICS = 'check_in:analytics',
  CHECK_IN_EXPORT = 'check_in:export',
  STAFF_VIEW = 'staff:view',
  STAFF_MANAGE_SCANNERS = 'staff:manage_scanners',

  // Supervisor
  STAFF_MANAGE_ALL = 'staff:manage_all',
  STAFF_INVITE = 'staff:invite',
  STAFF_REMOVE = 'staff:remove',
  EVENT_SETTINGS = 'event:settings',
  AUDIT_VIEW = 'audit:view',
  MULTI_EVENT_ACCESS = 'multi_event:access'
}

const ROLE_PERMISSIONS = {
  SCANNER: [
    Permission.CHECK_IN_SCAN,
    Permission.CHECK_IN_SEARCH,
    Permission.CHECK_IN_VIEW_STATS
  ],
  MANAGER: [
    // All Scanner permissions plus:
    Permission.CHECK_IN_OVERRIDE,
    Permission.CHECK_IN_CHECKOUT,
    Permission.CHECK_IN_ANALYTICS,
    Permission.CHECK_IN_EXPORT,
    Permission.STAFF_VIEW,
    Permission.STAFF_MANAGE_SCANNERS
  ],
  SUPERVISOR: [
    // All Manager permissions plus:
    Permission.STAFF_MANAGE_ALL,
    Permission.STAFF_INVITE,
    Permission.STAFF_REMOVE,
    Permission.EVENT_SETTINGS,
    Permission.AUDIT_VIEW,
    Permission.MULTI_EVENT_ACCESS
  ]
};
```

**Staff Data Model** (`prisma/schema.prisma`):
```prisma
model EventStaff {
  id        String   @id @default(cuid())
  eventId   String
  userId    String
  role      StaffRole
  invitedBy String
  invitedAt DateTime @default(now())
  acceptedAt DateTime?
  active    Boolean  @default(true)
  lastSeen  DateTime?

  event     Event    @relation(fields: [eventId], references: [id])
  user      User     @relation(fields: [userId], references: [id])
  inviter   User     @relation("StaffInviter", fields: [invitedBy], references: [id])

  @@unique([eventId, userId])
  @@index([eventId])
  @@index([userId])
}

enum StaffRole {
  SCANNER
  MANAGER
  SUPERVISOR
}

model StaffInvitation {
  id        String   @id @default(cuid())
  email     String
  eventId   String
  role      StaffRole
  token     String   @unique
  invitedBy String
  expiresAt DateTime
  accepted  Boolean  @default(false)
  createdAt DateTime @default(now())

  event     Event    @relation(fields: [eventId], references: [id])
  inviter   User     @relation(fields: [invitedBy], references: [id])
}
```

**Permission Check Middleware**:
```typescript
// lib/auth/check-permission.ts
export function checkPermission(permission: Permission) {
  return async (req: NextRequest) => {
    const session = await getSession(req);
    if (!session) {
      return new Response('Unauthorized', { status: 401 });
    }

    const staffRole = await getStaffRole(
      session.user.id,
      req.query.eventId
    );

    if (!hasPermission(staffRole, permission)) {
      return new Response('Forbidden', { status: 403 });
    }

    return null; // Allow
  };
}

// Usage in API route
export async function POST(req: NextRequest) {
  const permissionError = await checkPermission(
    Permission.CHECK_IN_OVERRIDE
  )(req);
  if (permissionError) return permissionError;

  // Handle request...
}
```

**Client-Side Permission Hook**:
```typescript
// hooks/usePermissions.ts
export function usePermissions(eventId: string) {
  const { data: staffRole } = useStaffRole(eventId);

  return {
    can: (permission: Permission) => {
      const rolePermissions = ROLE_PERMISSIONS[staffRole];
      return rolePermissions.includes(permission);
    },
    hasRole: (role: StaffRole) => {
      return staffRole === role;
    },
    isAtLeast: (role: StaffRole) => {
      const hierarchy = ['SCANNER', 'MANAGER', 'SUPERVISOR'];
      return hierarchy.indexOf(staffRole) >= hierarchy.indexOf(role);
    }
  };
}

// Usage in component
function CheckInOverride() {
  const { can } = usePermissions(eventId);

  if (!can(Permission.CHECK_IN_OVERRIDE)) {
    return null; // Hide component
  }

  return <button>Override Check-in</button>;
}
```

**Invitation Email Template**:
```typescript
// lib/emails/staff-invitation.tsx
export const StaffInvitationEmail = ({
  eventName,
  role,
  inviterName,
  acceptUrl,
  expiresAt
}: Props) => (
  <Email>
    <h1>You've been invited to help with {eventName}</h1>
    <p>{inviterName} has invited you to join the check-in team as a {role}.</p>

    <h2>Your Role: {role}</h2>
    <ul>
      {role === 'SCANNER' && (
        <>
          <li>Scan and check in attendees</li>
          <li>Search for attendees manually</li>
          <li>View check-in statistics</li>
        </>
      )}
      {/* Other role descriptions */}
    </ul>

    <Button href={acceptUrl}>Accept Invitation</Button>

    <p>This invitation expires on {format(expiresAt, 'PPP')}.</p>
  </Email>
);
```

**Source Tree** (`docs/architecture/source-tree.md`):
```
src/
├── app/
│   ├── api/
│   │   └── events/
│   │       └── [eventId]/
│   │           └── staff/
│   │               ├── route.ts
│   │               ├── invite/route.ts
│   │               └── [staffId]/route.ts
│   └── dashboard/
│       └── events/
│           └── [eventId]/
│               └── staff/page.tsx
├── components/
│   └── staff/
│       ├── StaffList.tsx
│       ├── StaffInvite.tsx
│       ├── RoleBadge.tsx
│       └── PermissionGate.tsx
├── lib/
│   └── auth/
│       ├── rbac.ts
│       ├── permissions.ts
│       └── check-permission.ts
└── hooks/
    ├── usePermissions.ts
    └── useStaffRole.ts
```

**Security Considerations**:
- Never trust client-side permission checks alone
- Always validate permissions server-side
- Invalidate sessions on role change
- Rate limit invitation sending
- Validate invitation tokens server-side
- Encrypt invitation tokens
- Log all permission changes

**Activity Tracking**:
```typescript
interface StaffActivity {
  staffId: string;
  action: 'LOGIN' | 'CHECK_IN' | 'OVERRIDE' | 'EXPORT';
  timestamp: Date;
  metadata: Record<string, any>;
}

// Log activity
await logStaffActivity({
  staffId: session.user.id,
  action: 'CHECK_IN',
  metadata: {
    ticketId: ticket.id,
    method: 'QR_SCAN'
  }
});
```

### Testing

**Testing Requirements for this story**:
- Unit tests for permission checks
- Unit tests for role hierarchy
- Unit tests for RBAC functions
- Integration test for staff invitation
- Integration test for role assignment
- Integration test for permission enforcement
- E2E test for Scanner role workflow
- E2E test for Manager role workflow
- E2E test for Supervisor role workflow
- Test permission middleware
- Test session invalidation on role change
- Test invitation acceptance flow
- Test invitation expiration
- Test bulk staff operations
- Security testing (privilege escalation)
- Test multi-event staff access
- Test UI adaptation per role
- Audit log verification

---

## Change Log

| Date | Version | Description | Author |
|------|---------|-------------|---------|
| 2025-09-30 | 1.0 | Initial story creation | SM Agent |

---

## Dev Agent Record

### Agent Model Used
*To be populated by dev agent*

### Debug Log References
*To be populated by dev agent*

### Completion Notes List
*To be populated by dev agent*

### File List
*To be populated by dev agent*

---

## QA Results
*To be populated by QA agent*