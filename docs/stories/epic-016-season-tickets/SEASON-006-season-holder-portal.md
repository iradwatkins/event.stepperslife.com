# SEASON-006: Season Holder Member Portal

**Epic:** EPIC-016 Season Tickets & Subscriptions
**Story Points:** 5
**Priority:** High
**Status:** Not Started

---

## User Story

**As a** season pass holder
**I want** a dedicated member portal to manage my subscription and track my benefits
**So that** I can easily view my pass status, upcoming events, payment history, and member benefits in one place

---

## Acceptance Criteria

### 1. Member Dashboard
- [ ] Subscription status overview (active, expiring soon, suspended)
- [ ] Current tier badge display (Basic, Premium, VIP)
- [ ] Pass expiration date countdown
- [ ] Quick stats (events attended, remaining benefits, total savings)
- [ ] Upcoming events auto-registered for
- [ ] Recent activity feed
- [ ] Renewal status and options
- [ ] Account health indicator

### 2. Event Calendar & Auto-Registration
- [ ] Integrated event calendar view (month/week/day)
- [ ] Auto-registration for included events
- [ ] Event filtering by type, date, location
- [ ] One-click manual registration
- [ ] Waitlist management for capacity events
- [ ] Event reminders and notifications
- [ ] Add to personal calendar (Google, Apple, Outlook)
- [ ] Past events archive

### 3. Payment History
- [ ] Complete payment transaction list
- [ ] Invoice downloads (PDF)
- [ ] Payment method display (last 4 digits)
- [ ] Payment status indicators
- [ ] Failed payment details and resolution
- [ ] Upcoming payment schedule
- [ ] Payment receipt resend option
- [ ] Annual payment summary

### 4. Benefit Usage Tracking
- [ ] Active benefits list with descriptions
- [ ] Benefit usage counter (X of Y used)
- [ ] Benefit value redeemed tracker
- [ ] Total savings calculator
- [ ] Benefit expiration dates
- [ ] Usage history log
- [ ] Tier comparison chart
- [ ] Upgrade incentives display

### 5. Profile & Preferences Management
- [ ] Personal information editing
- [ ] Payment method management
- [ ] Email notification preferences
- [ ] SMS notification opt-in/out
- [ ] Event preference tags
- [ ] Accessibility requirements
- [ ] Emergency contact information
- [ ] Language and timezone settings

### 6. Subscription Management
- [ ] View subscription details
- [ ] Change payment method
- [ ] Update billing address
- [ ] Pause subscription option (if allowed)
- [ ] Cancel subscription with feedback
- [ ] Upgrade/downgrade tier
- [ ] Early renewal option
- [ ] Reactivation workflow

### 7. Mobile Responsive Design
- [ ] Mobile-optimized layout
- [ ] Touch-friendly interactions
- [ ] Progressive Web App (PWA) support
- [ ] Offline viewing capabilities
- [ ] Fast page load times (<2s)
- [ ] Mobile navigation menu
- [ ] QR code ticket display
- [ ] Push notification support

### 8. Testing & Quality
- [ ] Unit tests for portal components (>85% coverage)
- [ ] Integration tests for data fetching
- [ ] E2E tests for user flows
- [ ] Accessibility audit (WCAG 2.1 AA)
- [ ] Cross-browser testing (Chrome, Safari, Firefox, Edge)
- [ ] Mobile device testing (iOS, Android)
- [ ] Performance testing (Lighthouse >90)
- [ ] Security testing (XSS, CSRF protection)

---

## Technical Specifications

### Database Schema Updates
```prisma
// prisma/schema.prisma

model UserPreferences {
  id                    String   @id @default(cuid())
  userId                String   @unique
  user                  User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  emailNotifications    Boolean  @default(true)
  smsNotifications      Boolean  @default(false)
  pushNotifications     Boolean  @default(true)
  eventReminders        Boolean  @default(true)
  paymentReminders      Boolean  @default(true)
  marketingEmails       Boolean  @default(false)
  eventPreferenceTags   String[] // ['dance', 'workshop', 'social']
  timezone              String   @default("America/New_York")
  language              String   @default("en")
  accessibility         Json?    // Accessibility requirements
  metadata              Json?
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt
}

model MemberActivity {
  id             String   @id @default(cuid())
  userId         String
  user           User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  activityType   String   // 'registration', 'checkin', 'benefit_used', 'payment', 'subscription_change'
  description    String
  eventId        String?
  event          Event?   @relation(fields: [eventId], references: [id])
  metadata       Json?
  createdAt      DateTime @default(now())

  @@index([userId, createdAt])
  @@index([activityType, createdAt])
}

model DashboardWidget {
  id          String   @id @default(cuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  widgetType  String   // 'upcoming_events', 'benefits', 'stats', 'activity'
  position    Int
  visible     Boolean  @default(true)
  config      Json?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@unique([userId, widgetType])
  @@index([userId, position])
}
```

### TypeScript Interfaces
```typescript
// types/member-portal.types.ts

export interface DashboardStats {
  subscription: {
    status: string;
    tier: string;
    expiresAt: Date;
    daysUntilExpiration: number;
    autoRenew: boolean;
  };
  events: {
    attended: number;
    upcoming: number;
    remaining: number;
  };
  benefits: {
    active: number;
    used: number;
    remaining: number;
    totalValueRedeemed: number;
  };
  payments: {
    totalPaid: number;
    nextPaymentDate?: Date;
    nextPaymentAmount?: number;
  };
}

export interface UpcomingEvent {
  id: string;
  title: string;
  startDate: Date;
  endDate: Date;
  location: string;
  isAutoRegistered: boolean;
  canRegister: boolean;
  capacity?: number;
  spotsRemaining?: number;
}

export interface PaymentHistoryItem {
  id: string;
  invoiceNumber: string;
  date: Date;
  amount: number;
  status: string;
  paymentMethod: string;
  invoicePdfUrl?: string;
  receiptPdfUrl?: string;
}

export interface ActivityFeedItem {
  id: string;
  type: string;
  description: string;
  timestamp: Date;
  icon: string;
  metadata?: any;
}

export interface MemberPortalPreferences {
  notifications: {
    email: boolean;
    sms: boolean;
    push: boolean;
  };
  eventPreferences: string[];
  timezone: string;
  language: string;
}
```

### Member Portal Service
```typescript
// lib/services/member-portal.service.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class MemberPortalService {
  // Get dashboard stats
  async getDashboardStats(userId: string): Promise<DashboardStats> {
    const subscription = await prisma.subscription.findFirst({
      where: {
        userId,
        status: { in: ['active', 'past_due', 'trialing'] },
      },
      include: {
        plan: true,
        tier: true,
        billingCycle: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!subscription) {
      throw new Error('No active subscription found');
    }

    // Calculate days until expiration
    const now = new Date();
    const expiresAt = subscription.currentPeriodEnd;
    const daysUntilExpiration = Math.ceil(
      (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Get event stats
    const passUsage = await prisma.passUsage.findMany({
      where: { subscriptionId: subscription.id },
      include: { event: true },
    });

    const eventsAttended = passUsage.filter((u) => u.checkedIn).length;
    const upcomingEvents = await prisma.event.count({
      where: {
        startDate: { gte: now },
        // TODO: Filter by events included in subscription
      },
    });

    // Get benefit stats
    const benefits = await this.getUserBenefitsSummary(userId);

    // Get payment stats
    const payments = await prisma.invoice.findMany({
      where: {
        userId,
        status: 'paid',
      },
    });

    const totalPaid = payments.reduce((sum, p) => sum + p.total, 0);

    const nextPayment = await prisma.invoice.findFirst({
      where: {
        userId,
        status: { in: ['open', 'draft'] },
      },
      orderBy: { dueDate: 'asc' },
    });

    return {
      subscription: {
        status: subscription.status,
        tier: subscription.tier?.name || 'Basic',
        expiresAt,
        daysUntilExpiration,
        autoRenew: subscription.autoRenew,
      },
      events: {
        attended: eventsAttended,
        upcoming: upcomingEvents,
        remaining: Math.max(0, upcomingEvents - passUsage.length),
      },
      benefits: {
        active: benefits.benefits.length,
        used: benefits.benefits.reduce((sum, b) => sum + b.usedCount, 0),
        remaining: benefits.benefits.reduce(
          (sum, b) => sum + (b.remainingUses || 0),
          0
        ),
        totalValueRedeemed: benefits.totalValueRedeemed,
      },
      payments: {
        totalPaid,
        nextPaymentDate: nextPayment?.dueDate,
        nextPaymentAmount: nextPayment?.total,
      },
    };
  }

  // Get upcoming events
  async getUpcomingEvents(userId: string, limit: number = 10): Promise<UpcomingEvent[]> {
    const subscription = await prisma.subscription.findFirst({
      where: { userId, status: 'active' },
      include: { usage: { include: { event: true } } },
    });

    if (!subscription) return [];

    const now = new Date();
    const events = await prisma.event.findMany({
      where: {
        startDate: { gte: now },
        // TODO: Filter by events included in subscription
      },
      orderBy: { startDate: 'asc' },
      take: limit,
    });

    return events.map((event) => {
      const isRegistered = subscription.usage.some(
        (u) => u.eventId === event.id
      );

      return {
        id: event.id,
        title: event.title,
        startDate: event.startDate,
        endDate: event.endDate,
        location: event.location,
        isAutoRegistered: isRegistered,
        canRegister: !isRegistered && (event.capacity ? event.spotsRemaining > 0 : true),
        capacity: event.capacity || undefined,
        spotsRemaining: event.spotsRemaining || undefined,
      };
    });
  }

  // Get payment history
  async getPaymentHistory(userId: string, limit?: number): Promise<PaymentHistoryItem[]> {
    const invoices = await prisma.invoice.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        payments: {
          take: 1,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    return invoices.map((invoice) => ({
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      date: invoice.createdAt,
      amount: invoice.total,
      status: invoice.status,
      paymentMethod: invoice.payments[0]?.paymentMethod || 'N/A',
      invoicePdfUrl: invoice.pdfUrl || undefined,
      receiptPdfUrl: invoice.payments[0]?.metadata?.receiptUrl,
    }));
  }

  // Get activity feed
  async getActivityFeed(userId: string, limit: number = 20): Promise<ActivityFeedItem[]> {
    const activities = await prisma.memberActivity.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return activities.map((activity) => ({
      id: activity.id,
      type: activity.activityType,
      description: activity.description,
      timestamp: activity.createdAt,
      icon: this.getActivityIcon(activity.activityType),
      metadata: activity.metadata,
    }));
  }

  // Log activity
  async logActivity(
    userId: string,
    activityType: string,
    description: string,
    metadata?: any
  ): Promise<void> {
    await prisma.memberActivity.create({
      data: {
        userId,
        activityType,
        description,
        metadata,
      },
    });
  }

  // Get user preferences
  async getUserPreferences(userId: string): Promise<UserPreferences> {
    let preferences = await prisma.userPreferences.findUnique({
      where: { userId },
    });

    if (!preferences) {
      preferences = await prisma.userPreferences.create({
        data: { userId },
      });
    }

    return preferences;
  }

  // Update user preferences
  async updateUserPreferences(
    userId: string,
    updates: Partial<UserPreferences>
  ): Promise<UserPreferences> {
    return await prisma.userPreferences.upsert({
      where: { userId },
      create: {
        userId,
        ...updates,
      },
      update: updates,
    });
  }

  // Helper: Get benefit summary
  private async getUserBenefitsSummary(userId: string) {
    // Implementation from BenefitService
    // Returns benefit usage summary
    return {
      benefits: [],
      totalValueRedeemed: 0,
    };
  }

  // Helper: Get activity icon
  private getActivityIcon(activityType: string): string {
    const iconMap: Record<string, string> = {
      registration: 'calendar-plus',
      checkin: 'check-circle',
      benefit_used: 'gift',
      payment: 'credit-card',
      subscription_change: 'refresh',
    };
    return iconMap[activityType] || 'activity';
  }
}
```

### React Components
```typescript
// components/member-portal/Dashboard.tsx
'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface DashboardProps {
  userId: string;
}

export function MemberDashboard({ userId }: DashboardProps) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, [userId]);

  const fetchDashboardStats = async () => {
    const response = await fetch('/api/member-portal/dashboard');
    const data = await response.json();
    setStats(data);
    setLoading(false);
  };

  if (loading) return <div>Loading...</div>;
  if (!stats) return <div>No subscription found</div>;

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      {/* Subscription Status */}
      <Card>
        <CardHeader>
          <CardTitle>Subscription</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.subscription.tier}</div>
          <p className="text-sm text-muted-foreground">
            {stats.subscription.daysUntilExpiration} days remaining
          </p>
        </CardContent>
      </Card>

      {/* Events */}
      <Card>
        <CardHeader>
          <CardTitle>Events</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.events.attended}</div>
          <p className="text-sm text-muted-foreground">
            {stats.events.upcoming} upcoming
          </p>
        </CardContent>
      </Card>

      {/* Benefits */}
      <Card>
        <CardHeader>
          <CardTitle>Benefits</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            ${stats.benefits.totalValueRedeemed.toFixed(2)}
          </div>
          <p className="text-sm text-muted-foreground">Total savings</p>
        </CardContent>
      </Card>

      {/* Payments */}
      <Card>
        <CardHeader>
          <CardTitle>Next Payment</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            ${stats.payments.nextPaymentAmount?.toFixed(2) || 'N/A'}
          </div>
          <p className="text-sm text-muted-foreground">
            {stats.payments.nextPaymentDate
              ? new Date(stats.payments.nextPaymentDate).toLocaleDateString()
              : 'No upcoming payment'}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

// components/member-portal/EventCalendar.tsx
'use client';

import { Calendar } from '@/components/ui/calendar';
import { useState, useEffect } from 'react';

export function EventCalendar() {
  const [events, setEvents] = useState<UpcomingEvent[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  useEffect(() => {
    fetchUpcomingEvents();
  }, []);

  const fetchUpcomingEvents = async () => {
    const response = await fetch('/api/member-portal/events/upcoming');
    const data = await response.json();
    setEvents(data);
  };

  return (
    <div className="space-y-4">
      <Calendar
        mode="single"
        selected={selectedDate}
        onSelect={setSelectedDate}
        className="rounded-md border"
      />
      <div className="space-y-2">
        {events.map((event) => (
          <div
            key={event.id}
            className="rounded-lg border p-4 hover:bg-accent"
          >
            <h3 className="font-semibold">{event.title}</h3>
            <p className="text-sm text-muted-foreground">
              {new Date(event.startDate).toLocaleDateString()}
            </p>
            {event.isAutoRegistered && (
              <span className="text-xs text-green-600">Auto-registered</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
```

### API Routes
```typescript
// app/api/member-portal/dashboard/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth.config';
import { MemberPortalService } from '@/lib/services/member-portal.service';

const portalService = new MemberPortalService();

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const stats = await portalService.getDashboardStats(session.user.id);
  return NextResponse.json(stats);
}

// app/api/member-portal/events/upcoming/route.ts
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const events = await portalService.getUpcomingEvents(session.user.id);
  return NextResponse.json(events);
}

// app/api/member-portal/payment-history/route.ts
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const history = await portalService.getPaymentHistory(session.user.id);
  return NextResponse.json(history);
}
```

---

## Testing Requirements

### Unit Tests
```typescript
describe('MemberPortalService', () => {
  it('should get dashboard stats', async () => {
    const stats = await service.getDashboardStats(userId);
    expect(stats.subscription).toBeDefined();
    expect(stats.events.attended).toBeGreaterThanOrEqual(0);
  });

  it('should get upcoming events', async () => {
    const events = await service.getUpcomingEvents(userId, 5);
    expect(events).toBeInstanceOf(Array);
    expect(events.length).toBeLessThanOrEqual(5);
  });

  it('should get payment history', async () => {
    const history = await service.getPaymentHistory(userId);
    expect(history).toBeInstanceOf(Array);
  });
});
```

### E2E Tests
```typescript
describe('Member Portal E2E', () => {
  it('should navigate to member dashboard', async () => {
    await page.goto('/member-portal');
    await expect(page.locator('h1')).toContainText('Member Dashboard');
  });

  it('should display subscription stats', async () => {
    await page.goto('/member-portal');
    await expect(page.locator('[data-testid="subscription-tier"]')).toBeVisible();
  });
});
```

---

## Definition of Done

- [ ] All acceptance criteria met
- [ ] Member dashboard implemented
- [ ] Event calendar functional
- [ ] Payment history working
- [ ] Benefit tracking displayed
- [ ] Profile management complete
- [ ] Mobile responsive
- [ ] Unit tests passing (>85% coverage)
- [ ] E2E tests passing
- [ ] Accessibility audit passed
- [ ] Performance metrics met
- [ ] Documentation complete

---

## Dependencies

- SEASON-001: Subscription model setup (prerequisite)
- SEASON-004: Member benefits system (prerequisite)
- AUTH-001: User authentication (prerequisite)

---

## Estimated Timeline

**Total Duration:** 3 weeks
**Story Points:** 5