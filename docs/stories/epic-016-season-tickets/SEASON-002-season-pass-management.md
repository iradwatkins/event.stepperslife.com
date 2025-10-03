# SEASON-002: Season Pass Management

**Epic:** EPIC-016 Season Tickets & Subscriptions
**Story Points:** 5
**Priority:** High
**Status:** Not Started

---

## User Story

**As an** event organizer
**I want** comprehensive season pass creation and management tools
**So that** I can create event series, manage pass holders, set restrictions, and track usage effectively

---

## Acceptance Criteria

### 1. Season Pass Creation
- [ ] Create season passes with event series linking
- [ ] Set pass duration (dates, event count)
- [ ] Define included events and categories
- [ ] Set pricing tiers (standard, VIP, family)
- [ ] Configure blackout dates
- [ ] Set capacity limits for pass holders
- [ ] Early bird pricing options
- [ ] Bundle multiple seasons

### 2. Event Series Management
- [ ] Link events to season passes
- [ ] Create recurring event series
- [ ] Set series frequency (weekly, monthly)
- [ ] Auto-generate events from templates
- [ ] Series-level blackout dates
- [ ] Manage series capacity
- [ ] Series substitution rules
- [ ] Cross-series pass options

### 3. Pass Holder Management
- [ ] View all active pass holders
- [ ] Search and filter pass holders
- [ ] Individual pass holder profiles
- [ ] Usage history per pass holder
- [ ] Attendance tracking
- [ ] No-show tracking
- [ ] Pass holder communications
- [ ] Family member management

### 4. Blackout Dates & Restrictions
- [ ] Set blackout dates per pass
- [ ] Holiday blackout rules
- [ ] Peak event restrictions
- [ ] Special event exclusions
- [ ] Advance booking requirements
- [ ] Blackout override for VIP
- [ ] Blackout date calendar view
- [ ] Automated blackout notifications

### 5. Pass Usage Tracking
- [ ] Real-time usage dashboard
- [ ] Events attended vs remaining
- [ ] Check-in history
- [ ] Usage patterns analytics
- [ ] Redemption rates
- [ ] No-show rates
- [ ] Peak usage times
- [ ] Export usage reports

### 6. Capacity Management
- [ ] Set pass holder capacity per event
- [ ] Reserved seating for pass holders
- [ ] Priority access periods
- [ ] Waitlist for sold-out events
- [ ] Capacity alerts
- [ ] Override capacity for special cases
- [ ] Real-time availability display
- [ ] Automated capacity adjustments

### 7. Pass Holder Communications
- [ ] Welcome emails
- [ ] Usage reminder emails
- [ ] Upcoming events notifications
- [ ] Blackout date reminders
- [ ] Renewal reminders
- [ ] Series updates
- [ ] Exclusive offers
- [ ] Survey and feedback requests

### 8. Reporting & Analytics
- [ ] Pass sales reports
- [ ] Revenue per pass type
- [ ] Utilization rates
- [ ] Most/least popular events
- [ ] Pass holder demographics
- [ ] Renewal prediction
- [ ] Churn analysis
- [ ] ROI calculations

---

## Technical Specifications

### Season Pass Service
```typescript
// lib/services/season-pass.service.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class SeasonPassService {
  async createSeasonPass(data: CreateSeasonPassInput): Promise<SeasonPass> {
    const pass = await prisma.seasonPass.create({
      data: {
        name: data.name,
        description: data.description,
        season: data.season,
        startDate: data.startDate,
        endDate: data.endDate,
        totalEvents: data.totalEvents,
        eventsRemaining: data.totalEvents,
        blackoutDates: data.blackoutDates || [],
        metadata: {
          pricing: data.pricing,
          capacity: data.capacity,
          restrictions: data.restrictions,
        },
      },
    });

    // Create event series if provided
    if (data.eventSeries) {
      await prisma.eventSeries.createMany({
        data: data.eventSeries.map((series) => ({
          ...series,
          seasonPassId: pass.id,
        })),
      });
    }

    return pass;
  }

  async linkEventsToPass(passId: string, eventIds: string[]): Promise<void> {
    const pass = await prisma.seasonPass.findUnique({
      where: { id: passId },
      include: { eventSeries: true },
    });

    if (!pass) throw new Error('Season pass not found');

    // Update events to link to series
    for (const eventId of eventIds) {
      await prisma.event.update({
        where: { id: eventId },
        data: {
          seriesId: pass.eventSeries[0]?.id,
          metadata: {
            seasonPassEligible: true,
            seasonPassId: passId,
          },
        },
      });
    }
  }

  async checkPassAccess(
    userId: string,
    eventId: string
  ): Promise<{ hasAccess: boolean; reason?: string; passId?: string }> {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: { series: { include: { seasonPass: true } } },
    });

    if (!event || !event.series?.seasonPass) {
      return { hasAccess: false, reason: 'Event not part of season pass' };
    }

    const pass = event.series.seasonPass;

    // Check if user has this pass
    const userPass = await prisma.seasonPass.findFirst({
      where: {
        id: pass.id,
        subscription: {
          userId,
          status: 'active',
        },
      },
    });

    if (!userPass) {
      return { hasAccess: false, reason: 'User does not have this season pass' };
    }

    // Check blackout dates
    const eventDate = event.startDate.toISOString().split('T')[0];
    const blackoutDates = pass.blackoutDates as string[] || [];
    
    if (blackoutDates.includes(eventDate)) {
      return { hasAccess: false, reason: 'Event is on blackout date' };
    }

    // Check remaining events
    if (userPass.eventsRemaining <= 0) {
      return { hasAccess: false, reason: 'No remaining events on pass' };
    }

    // Check if already used for this event
    const usage = await prisma.passUsage.findFirst({
      where: {
        seasonPassId: userPass.id,
        eventId,
        userId,
      },
    });

    if (usage) {
      return { hasAccess: false, reason: 'Pass already used for this event' };
    }

    return { hasAccess: true, passId: userPass.id };
  }

  async recordPassUsage(
    passId: string,
    userId: string,
    eventId: string,
    orderId?: string
  ): Promise<PassUsage> {
    // Create usage record
    const usage = await prisma.passUsage.create({
      data: {
        seasonPassId: passId,
        userId,
        eventId,
        orderId,
      },
    });

    // Decrement events remaining
    await prisma.seasonPass.update({
      where: { id: passId },
      data: {
        eventsRemaining: { decrement: 1 },
        eventsAttended: { increment: 1 },
      },
    });

    return usage;
  }

  async getPassHolderStats(passId: string): Promise<PassHolderStats> {
    const pass = await prisma.seasonPass.findUnique({
      where: { id: passId },
      include: {
        usage: true,
        subscription: { include: { user: true } },
      },
    });

    if (!pass) throw new Error('Season pass not found');

    const totalHolders = await prisma.subscription.count({
      where: {
        seasonPass: { some: { id: passId } },
        status: 'active',
      },
    });

    const utilizationRate = (pass.eventsAttended / pass.totalEvents) * 100;

    return {
      totalHolders,
      eventsAttended: pass.eventsAttended,
      eventsRemaining: pass.eventsRemaining,
      utilizationRate,
      checkIns: pass.usage.filter((u) => u.checkedIn).length,
      noShows: pass.usage.filter((u) => !u.checkedIn).length,
    };
  }

  async applyBlackoutDates(
    passId: string,
    dates: string[]
  ): Promise<SeasonPass> {
    return await prisma.seasonPass.update({
      where: { id: passId },
      data: {
        blackoutDates: dates,
      },
    });
  }

  async getUpcomingEventsForPass(
    userId: string,
    passId: string
  ): Promise<Event[]> {
    const pass = await prisma.seasonPass.findUnique({
      where: { id: passId },
      include: {
        eventSeries: {
          include: {
            events: {
              where: {
                startDate: { gte: new Date() },
                published: true,
              },
              orderBy: { startDate: 'asc' },
            },
          },
        },
      },
    });

    if (!pass) return [];

    // Flatten events from all series
    const events = pass.eventSeries.flatMap((series) => series.events);

    // Filter out blackout dates
    const blackoutDates = pass.blackoutDates as string[] || [];
    
    return events.filter((event) => {
      const eventDate = event.startDate.toISOString().split('T')[0];
      return !blackoutDates.includes(eventDate);
    });
  }
}

interface CreateSeasonPassInput {
  name: string;
  description?: string;
  season: string;
  startDate: Date;
  endDate: Date;
  totalEvents: number;
  blackoutDates?: string[];
  pricing?: any;
  capacity?: number;
  restrictions?: any;
  eventSeries?: Array<{
    name: string;
    description?: string;
    startDate: Date;
    endDate: Date;
    frequency?: string;
  }>;
}

interface PassHolderStats {
  totalHolders: number;
  eventsAttended: number;
  eventsRemaining: number;
  utilizationRate: number;
  checkIns: number;
  noShows: number;
}
```

### Event Series Generator
```typescript
// lib/services/event-series-generator.ts
import { PrismaClient } from '@prisma/client';
import { addDays, addWeeks, addMonths } from 'date-fns';

const prisma = new PrismaClient();

export class EventSeriesGenerator {
  async generateRecurringEvents(
    seriesId: string,
    template: EventTemplate,
    frequency: 'daily' | 'weekly' | 'bi-weekly' | 'monthly',
    occurrences: number
  ): Promise<Event[]> {
    const series = await prisma.eventSeries.findUnique({
      where: { id: seriesId },
    });

    if (!series) throw new Error('Event series not found');

    const events: Event[] = [];
    let currentDate = series.startDate;

    for (let i = 0; i < occurrences; i++) {
      const event = await prisma.event.create({
        data: {
          ...template,
          seriesId,
          title: `${template.title} - ${i + 1}`,
          startDate: currentDate,
          endDate: addDays(currentDate, 1),
        },
      });

      events.push(event);

      // Calculate next occurrence
      switch (frequency) {
        case 'daily':
          currentDate = addDays(currentDate, 1);
          break;
        case 'weekly':
          currentDate = addWeeks(currentDate, 1);
          break;
        case 'bi-weekly':
          currentDate = addWeeks(currentDate, 2);
          break;
        case 'monthly':
          currentDate = addMonths(currentDate, 1);
          break;
      }
    }

    return events;
  }
}

interface EventTemplate {
  title: string;
  description: string;
  categoryId: string;
  venueId: string;
  price: number;
  capacity: number;
  [key: string]: any;
}
```

### Pass Holder Dashboard API
```typescript
// app/api/season-pass/[passId]/dashboard/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth';
import { SeasonPassService } from '@/lib/services/season-pass.service';

const service = new SeasonPassService();

export async function GET(
  req: NextRequest,
  { params }: { params: { passId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { passId } = params;

  try {
    const [upcomingEvents, stats, usage] = await Promise.all([
      service.getUpcomingEventsForPass(session.user.id, passId),
      service.getPassHolderStats(passId),
      prisma.passUsage.findMany({
        where: {
          seasonPassId: passId,
          userId: session.user.id,
        },
        include: { event: true },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return NextResponse.json({
      upcomingEvents,
      stats,
      usage,
    });
  } catch (error) {
    console.error('Error fetching pass dashboard:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}
```

---

## Testing Requirements

### Unit Tests
```typescript
describe('SeasonPassService', () => {
  it('should create season pass', async () => {
    const pass = await service.createSeasonPass(mockPassData);
    expect(pass).toHaveProperty('id');
  });

  it('should check pass access correctly', async () => {
    const result = await service.checkPassAccess(userId, eventId);
    expect(result).toHaveProperty('hasAccess');
  });

  it('should apply blackout dates', async () => {
    const pass = await service.applyBlackoutDates(passId, ['2025-12-25']);
    expect(pass.blackoutDates).toContain('2025-12-25');
  });
});
```

---

## Definition of Done

- [ ] All acceptance criteria met
- [ ] Season pass CRUD operations functional
- [ ] Event series generation working
- [ ] Blackout date enforcement tested
- [ ] Pass holder dashboard complete
- [ ] Usage tracking accurate
- [ ] Unit tests passing (>85% coverage)
- [ ] Integration tests passing
- [ ] Documentation complete

---

## Dependencies

- SEASON-001: Subscription model setup (prerequisite)
- EVENT-001: Event management (prerequisite)

---

## Estimated Timeline

**Total Duration:** 5-6 weeks
**Story Points:** 5
