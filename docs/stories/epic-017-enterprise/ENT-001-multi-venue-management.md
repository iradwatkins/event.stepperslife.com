# ENT-001: Multi-Venue Management

**Epic:** EPIC-017 Enterprise Features
**Story Points:** 5
**Priority:** E3 (Expansion)
**Status:** Not Started

---

## User Story

**As an** enterprise organization with multiple venues
**I want** to manage events across multiple locations with centralized control
**So that** I can maintain consistency while allowing location-specific customization

---

## Acceptance Criteria

### 1. Venue Hierarchy
- [ ] Create parent-child venue relationships
- [ ] Support unlimited nesting depth for venue groups
- [ ] Venue inheritance for settings and branding
- [ ] Regional grouping (East Coast, West Coast, International)
- [ ] Venue type classification (Theater, Stadium, Conference Center)
- [ ] Capacity tracking per venue
- [ ] Address and geolocation data per venue
- [ ] Venue timezone handling

### 2. Multi-Location Event Management
- [ ] Create events across multiple venues simultaneously
- [ ] Clone events to different venues
- [ ] Venue-specific pricing variations
- [ ] Venue-specific inventory management
- [ ] Cross-venue event search and filtering
- [ ] Venue availability calendar
- [ ] Conflict detection across venues
- [ ] Bulk event operations by venue

### 3. Permission Management
- [ ] Centralized permissions for corporate admins
- [ ] Venue-level manager permissions
- [ ] Department-scoped access control
- [ ] Permission inheritance from parent venues
- [ ] Override permissions at venue level
- [ ] Role templates (Corporate Admin, Venue Manager, Staff)
- [ ] Audit logs for permission changes
- [ ] Permission approval workflow

### 4. Cross-Venue Reporting
- [ ] Consolidated revenue dashboard across all venues
- [ ] Venue comparison analytics
- [ ] Top performing venues report
- [ ] Attendance trends by venue
- [ ] Revenue by venue and region
- [ ] Inventory status across venues
- [ ] Staff performance by venue
- [ ] Export multi-venue reports

### 5. Venue Branding & Customization
- [ ] Venue-specific logo and colors
- [ ] Custom domain per venue (optional)
- [ ] Venue-specific email templates
- [ ] Localized content and language
- [ ] Venue contact information
- [ ] Social media links per venue
- [ ] Venue-specific terms and conditions
- [ ] Photo galleries per venue

### 6. Testing & Quality
- [ ] Unit tests for venue hierarchy (>85% coverage)
- [ ] Integration tests for cross-venue operations
- [ ] Permission inheritance tests
- [ ] Performance tests with 100+ venues
- [ ] Security audit for venue isolation
- [ ] Documentation complete
- [ ] Migration script for existing venues
- [ ] Rollback plan documented

---

## Technical Specifications

### Database Schema
```prisma
// prisma/schema.prisma

model Venue {
  id                String   @id @default(cuid())
  name              String
  slug              String   @unique
  description       String?
  type              String   // 'theater', 'stadium', 'conference_center', 'arena', 'outdoor'
  parentVenueId     String?
  parentVenue       Venue?   @relation("VenueHierarchy", fields: [parentVenueId], references: [id])
  childVenues       Venue[]  @relation("VenueHierarchy")

  // Location details
  address           String
  city              String
  state             String
  zipCode           String
  country           String   @default("US")
  timezone          String   @default("America/New_York")
  latitude          Float?
  longitude         Float?

  // Capacity & features
  capacity          Int?
  accessibilityFeatures Json?
  amenities         Json?    // Parking, WiFi, Concessions, etc.

  // Organizational structure
  organizationId    String
  organization      Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  region            String?  // 'east', 'west', 'midwest', 'south', 'international'
  department        String?

  // Branding
  logo              String?
  colors            Json?    // Primary, secondary, accent colors
  customDomain      String?  @unique
  customEmail       String?
  socialMedia       Json?

  // Settings
  settings          Json?    // Venue-specific configurations
  inheritSettings   Boolean  @default(true)
  active            Boolean  @default(true)

  // Relations
  events            Event[]
  staff             VenueStaff[]
  permissions       VenuePermission[]
  analytics         VenueAnalytics[]

  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  @@index([organizationId, active])
  @@index([parentVenueId])
  @@index([region, active])
  @@index([slug])
}

model VenueStaff {
  id           String   @id @default(cuid())
  venueId      String
  venue        Venue    @relation(fields: [venueId], references: [id], onDelete: Cascade)
  userId       String
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  role         String   // 'manager', 'staff', 'viewer'
  permissions  Json?    // Granular permissions
  active       Boolean  @default(true)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  @@unique([venueId, userId])
  @@index([userId, active])
}

model VenuePermission {
  id           String   @id @default(cuid())
  venueId      String
  venue        Venue    @relation(fields: [venueId], references: [id], onDelete: Cascade)
  resource     String   // 'events', 'staff', 'analytics', 'settings'
  action       String   // 'create', 'read', 'update', 'delete'
  roleRequired String   // 'manager', 'staff', 'viewer'
  inherited    Boolean  @default(false)
  createdAt    DateTime @default(now())

  @@unique([venueId, resource, action])
  @@index([venueId, roleRequired])
}

model VenueAnalytics {
  id              String   @id @default(cuid())
  venueId         String
  venue           Venue    @relation(fields: [venueId], references: [id], onDelete: Cascade)
  date            DateTime
  totalRevenue    Float    @default(0)
  totalTickets    Int      @default(0)
  totalEvents     Int      @default(0)
  avgAttendance   Float    @default(0)
  capacityUtilization Float @default(0)
  metadata        Json?
  createdAt       DateTime @default(now())

  @@unique([venueId, date])
  @@index([venueId, date])
}

// Update Event model to support venue
model Event {
  // ... existing fields
  venueId         String?
  venue           Venue?   @relation(fields: [venueId], references: [id])
  // ... rest of fields
}
```

### Venue Service
```typescript
// lib/services/venue.service.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class VenueService {
  // Get venue hierarchy
  async getVenueHierarchy(organizationId: string): Promise<Venue[]> {
    const venues = await prisma.venue.findMany({
      where: {
        organizationId,
        active: true,
        parentVenueId: null, // Top-level venues only
      },
      include: {
        childVenues: {
          include: {
            childVenues: true, // Nested children
          },
        },
        _count: {
          select: { events: true, staff: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    return venues;
  }

  // Create venue with parent relationship
  async createVenue(data: CreateVenueInput): Promise<Venue> {
    // Validate parent venue exists
    if (data.parentVenueId) {
      const parentVenue = await prisma.venue.findUnique({
        where: { id: data.parentVenueId },
      });

      if (!parentVenue || parentVenue.organizationId !== data.organizationId) {
        throw new Error('Invalid parent venue');
      }

      // Inherit settings from parent if specified
      if (data.inheritSettings) {
        data.settings = parentVenue.settings;
        data.colors = parentVenue.colors;
      }
    }

    const venue = await prisma.venue.create({
      data: {
        ...data,
        slug: this.generateSlug(data.name),
      },
      include: {
        parentVenue: true,
        organization: true,
      },
    });

    // Create default permissions
    await this.createDefaultPermissions(venue.id);

    return venue;
  }

  // Clone event to multiple venues
  async cloneEventToVenues(
    eventId: string,
    targetVenueIds: string[]
  ): Promise<Event[]> {
    const sourceEvent = await prisma.event.findUnique({
      where: { id: eventId },
      include: { ticketTypes: true },
    });

    if (!sourceEvent) {
      throw new Error('Source event not found');
    }

    const clonedEvents = await Promise.all(
      targetVenueIds.map(async (venueId) => {
        const venue = await prisma.venue.findUnique({ where: { id: venueId } });

        if (!venue) {
          throw new Error(`Venue ${venueId} not found`);
        }

        // Create event with venue-specific adjustments
        return await prisma.event.create({
          data: {
            ...sourceEvent,
            id: undefined, // Generate new ID
            venueId,
            title: `${sourceEvent.title} - ${venue.name}`,
            slug: `${sourceEvent.slug}-${venue.slug}`,
            ticketTypes: {
              create: sourceEvent.ticketTypes.map((tt) => ({
                ...tt,
                id: undefined,
              })),
            },
          },
          include: { venue: true, ticketTypes: true },
        });
      })
    );

    return clonedEvents;
  }

  // Get cross-venue analytics
  async getCrossVenueAnalytics(
    organizationId: string,
    startDate: Date,
    endDate: Date
  ): Promise<VenuAnalyticsReport> {
    const analytics = await prisma.venueAnalytics.findMany({
      where: {
        venue: { organizationId },
        date: { gte: startDate, lte: endDate },
      },
      include: { venue: true },
    });

    const venueGroups = analytics.reduce((acc, curr) => {
      const venueName = curr.venue.name;
      if (!acc[venueName]) {
        acc[venueName] = {
          venueName,
          totalRevenue: 0,
          totalTickets: 0,
          totalEvents: 0,
          avgAttendance: 0,
        };
      }

      acc[venueName].totalRevenue += curr.totalRevenue;
      acc[venueName].totalTickets += curr.totalTickets;
      acc[venueName].totalEvents += curr.totalEvents;

      return acc;
    }, {} as Record<string, VenueAnalyticsSummary>);

    return {
      venues: Object.values(venueGroups),
      totalRevenue: Object.values(venueGroups).reduce((sum, v) => sum + v.totalRevenue, 0),
      totalEvents: Object.values(venueGroups).reduce((sum, v) => sum + v.totalEvents, 0),
    };
  }

  // Check user permissions for venue
  async checkVenuePermission(
    userId: string,
    venueId: string,
    resource: string,
    action: string
  ): Promise<boolean> {
    const venueStaff = await prisma.venueStaff.findUnique({
      where: {
        venueId_userId: { venueId, userId },
      },
    });

    if (!venueStaff || !venueStaff.active) {
      return false;
    }

    const permission = await prisma.venuePermission.findUnique({
      where: {
        venueId_resource_action: {
          venueId,
          resource,
          action,
        },
      },
    });

    if (!permission) {
      return false;
    }

    // Check if user's role meets required role
    const roleHierarchy = ['viewer', 'staff', 'manager', 'admin'];
    const userRoleLevel = roleHierarchy.indexOf(venueStaff.role);
    const requiredRoleLevel = roleHierarchy.indexOf(permission.roleRequired);

    return userRoleLevel >= requiredRoleLevel;
  }

  // Helper: Generate unique slug
  private generateSlug(name: string): string {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  }

  // Helper: Create default permissions
  private async createDefaultPermissions(venueId: string): Promise<void> {
    const defaultPermissions = [
      { resource: 'events', action: 'create', roleRequired: 'manager' },
      { resource: 'events', action: 'read', roleRequired: 'viewer' },
      { resource: 'events', action: 'update', roleRequired: 'staff' },
      { resource: 'events', action: 'delete', roleRequired: 'manager' },
      { resource: 'analytics', action: 'read', roleRequired: 'manager' },
      { resource: 'settings', action: 'update', roleRequired: 'manager' },
    ];

    await prisma.venuePermission.createMany({
      data: defaultPermissions.map((p) => ({ ...p, venueId })),
    });
  }
}

interface CreateVenueInput {
  name: string;
  organizationId: string;
  parentVenueId?: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  timezone: string;
  capacity?: number;
  inheritSettings?: boolean;
  settings?: any;
  colors?: any;
}
```

### API Routes
```typescript
// app/api/venues/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { VenueService } from '@/lib/services/venue.service';

const venueService = new VenueService();

export async function GET(req: NextRequest) {
  const session = await getServerSession();
  if (!session?.user?.organizationId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const venues = await venueService.getVenueHierarchy(
    session.user.organizationId
  );

  return NextResponse.json({ venues });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession();
  if (!session?.user?.organizationId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const data = await req.json();
  const venue = await venueService.createVenue({
    ...data,
    organizationId: session.user.organizationId,
  });

  return NextResponse.json({ venue }, { status: 201 });
}
```

---

## Testing Requirements

### Unit Tests
```typescript
describe('VenueService', () => {
  it('should create venue hierarchy', async () => {
    const parent = await venueService.createVenue({ name: 'Parent Venue', ...});
    const child = await venueService.createVenue({
      name: 'Child Venue',
      parentVenueId: parent.id,
      ...
    });
    expect(child.parentVenueId).toBe(parent.id);
  });

  it('should inherit settings from parent venue', async () => {
    const parent = await venueService.createVenue({
      settings: { theme: 'dark' },
      ...
    });
    const child = await venueService.createVenue({
      parentVenueId: parent.id,
      inheritSettings: true,
      ...
    });
    expect(child.settings).toEqual(parent.settings);
  });

  it('should clone event to multiple venues', async () => {
    const cloned = await venueService.cloneEventToVenues(eventId, [venue1Id, venue2Id]);
    expect(cloned).toHaveLength(2);
  });

  it('should check venue permissions correctly', async () => {
    const hasPermission = await venueService.checkVenuePermission(
      userId, venueId, 'events', 'create'
    );
    expect(hasPermission).toBe(true);
  });
});
```

### Integration Tests
```typescript
describe('Multi-Venue Management', () => {
  it('should fetch cross-venue analytics', async () => {
    const report = await venueService.getCrossVenueAnalytics(
      orgId, startDate, endDate
    );
    expect(report.venues.length).toBeGreaterThan(0);
  });
});
```

---

## Definition of Done

- [ ] All acceptance criteria met
- [ ] Database schema deployed with migrations
- [ ] Venue hierarchy functional
- [ ] Permission system working correctly
- [ ] Cross-venue analytics operational
- [ ] Venue branding customization working
- [ ] Unit tests passing (>85% coverage)
- [ ] Integration tests passing
- [ ] API documentation updated
- [ ] User documentation complete

---

## Dependencies

- US-005: RBAC system (prerequisite)
- EV-001: Event creation (prerequisite)
- ORG-001: Organization management (prerequisite)

---

## Estimated Timeline

**Total Duration:** 3-4 weeks
**Story Points:** 5