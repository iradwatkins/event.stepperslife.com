# ORG-007: Attendee Demographics

**Epic:** EPIC-007 - Organizer Dashboard & Analytics
**Story Points:** 3
**Priority:** Medium
**Status:** Ready for Development

## User Story
As an **event organizer**
I want to **understand attendee demographics and behavior**
So that **I can better target my marketing, improve event planning, and create more relevant experiences**

## Acceptance Criteria

### AC1: Age Distribution Chart
- [ ] Bar chart or histogram showing age ranges
- [ ] Age buckets: 18-24, 25-34, 35-44, 45-54, 55-64, 65+
- [ ] Show percentage and count for each age group
- [ ] Compare age distribution across multiple events
- [ ] Median age indicator
- [ ] Filter by ticket type to see demographic differences

### AC2: Location Breakdown
- [ ] Geographic distribution of attendees
- [ ] Visualizations:
  - Map with city markers and heatmap overlay
  - Bar chart of top cities/states/countries
  - Distance from event venue analysis
- [ ] Statistics: Average distance traveled, farthest attendee
- [ ] Filter by local (within 50 miles) vs out-of-town
- [ ] Export location data for marketing campaigns

### AC3: Purchase Behavior Analysis
- [ ] Average time from registration to event (advance purchase)
- [ ] Purchase timing distribution: Early (>30 days), Medium (7-30 days), Late (<7 days), Day-of
- [ ] Correlation between purchase timing and ticket type
- [ ] Group size analysis: Solo, Pair, Small Group (3-5), Large Group (6+)
- [ ] Repeat attendee identification (attended previous events)
- [ ] Average spending per attendee

### AC4: Ticket Preference Patterns
- [ ] Most popular ticket types by demographic
- [ ] Price sensitivity analysis (early bird vs regular pricing uptake)
- [ ] VIP vs General admission preference by age/location
- [ ] Add-on purchase patterns
- [ ] Group discount usage rates
- [ ] Bundle purchases vs single tickets

### AC5: Gender Demographics (Optional)
- [ ] Gender distribution if data collected (opt-in only)
- [ ] Pie chart or donut chart visualization
- [ ] Filter by ticket type or event
- [ ] GDPR compliant: Only show aggregated data, minimum 10 attendees
- [ ] Option to hide this metric entirely

### AC6: First-time vs Returning Attendees
- [ ] Percentage breakdown: New vs Returning
- [ ] Retention rate calculation
- [ ] Cohort analysis: Track attendees across multiple events
- [ ] Average lifetime value of returning attendees
- [ ] Churn analysis: Attendees who stopped attending

### AC7: Social Media Referral Source
- [ ] If UTM parameters captured during registration
- [ ] Breakdown by source: Direct, Social Media (Facebook, Instagram, Twitter), Email, Paid Ads, Referral
- [ ] Conversion rate by channel
- [ ] Revenue attribution by source
- [ ] Top performing campaigns

### AC8: Privacy and Compliance
- [ ] All demographic data aggregated (no individual identification)
- [ ] Minimum threshold: Show demographics only if ≥10 attendees
- [ ] Clear notice about data usage in registration flow
- [ ] Opt-out option for attendees
- [ ] GDPR/CCPA compliant data handling
- [ ] Anonymization of sensitive attributes

### AC9: Demographic Insights Summary
- [ ] AI-generated insights based on demographic data:
  - "Your events attract primarily 25-34 year olds from urban areas"
  - "87% of attendees purchase tickets within 2 weeks of event"
  - "VIP tickets are most popular among 35-44 age group"
- [ ] Recommendations for marketing improvements
- [ ] Benchmark against similar events (if industry data available)

## Technical Implementation

### Frontend Components
```typescript
// /components/dashboard/analytics/AttendeeDemographics.tsx
interface AttendeeDemographicsProps {
  eventId?: string; // Optional: null for all events
  dateRange: DateRange;
}

interface DemographicData {
  ageDistribution: AgeGroup[];
  locationBreakdown: LocationData[];
  purchaseBehavior: PurchasePattern;
  ticketPreferences: TicketPreference[];
  genderDistribution?: GenderData[]; // Optional
  attendeeSegmentation: {
    newAttendees: number;
    returningAttendees: number;
    retentionRate: number;
  };
  referralSources: ReferralSource[];
  insights: string[];
}

interface AgeGroup {
  range: string; // "18-24", "25-34", etc.
  count: number;
  percentage: number;
  averageSpend: number;
}

interface LocationData {
  city: string;
  state: string;
  country: string;
  count: number;
  averageDistance: number; // miles from venue
  lat: number;
  lng: number;
}

interface PurchasePattern {
  averageDaysBeforeEvent: number;
  timingDistribution: {
    early: number; // >30 days
    medium: number; // 7-30 days
    late: number; // <7 days
    dayOf: number;
  };
  groupSizes: {
    solo: number;
    pair: number;
    smallGroup: number;
    largeGroup: number;
  };
  averageSpending: number;
}

// Component Structure
- AttendeeDemographics (container)
  - DemographicsHeader
    - DateRangeFilter
    - EventSelector
    - ExportButton
  - DemographicsGrid
    - AgeDistributionChart (BarChart)
    - LocationMap (Mapbox/Google Maps)
    - LocationBarChart (top cities)
    - PurchaseTimingChart (PieChart)
    - GroupSizeChart (BarChart)
    - TicketPreferenceMatrix (Heatmap)
    - AttendeeSegmentation (DonutChart)
    - ReferralSourceChart (BarChart)
  - InsightsSummary (AI-generated recommendations)
  - PrivacyNotice (disclaimer about data usage)
```

### Backend API
```typescript
// /app/api/dashboard/analytics/demographics/route.ts
GET /api/dashboard/analytics/demographics
  ?organizerId={id}
  &eventId={id|all}
  &startDate={date}
  &endDate={date}

Response: {
  success: true,
  data: {
    ageDistribution: [
      { range: "18-24", count: 45, percentage: 15.2, averageSpend: 48.50 },
      { range: "25-34", count: 120, percentage: 40.5, averageSpend: 62.00 },
      { range: "35-44", count: 78, percentage: 26.3, averageSpend: 75.00 },
      { range: "45-54", count: 35, percentage: 11.8, averageSpend: 68.00 },
      { range: "55-64", count: 15, percentage: 5.1, averageSpend: 55.00 },
      { range: "65+", count: 3, percentage: 1.0, averageSpend: 50.00 }
    ],
    locationBreakdown: [
      {
        city: "New York",
        state: "NY",
        country: "USA",
        count: 120,
        averageDistance: 5.2,
        lat: 40.7128,
        lng: -74.0060
      },
      ...
    ],
    purchaseBehavior: {
      averageDaysBeforeEvent: 18.5,
      timingDistribution: {
        early: 25.5, // percentage
        medium: 48.2,
        late: 22.3,
        dayOf: 4.0
      },
      groupSizes: {
        solo: 35.0,
        pair: 45.0,
        smallGroup: 15.0,
        largeGroup: 5.0
      },
      averageSpending: 62.50
    },
    ticketPreferences: [
      {
        ticketType: "VIP",
        ageGroup: "35-44",
        count: 45,
        percentage: 57.7
      },
      ...
    ],
    attendeeSegmentation: {
      newAttendees: 210,
      returningAttendees: 86,
      retentionRate: 29.1
    },
    referralSources: [
      { source: "Direct", count: 120, revenue: 7200.00, conversionRate: 15.2 },
      { source: "Facebook", count: 85, revenue: 5100.00, conversionRate: 12.8 },
      { source: "Instagram", count: 65, revenue: 3900.00, conversionRate: 18.5 },
      { source: "Email", count: 45, revenue: 2700.00, conversionRate: 25.0 },
      { source: "Google Ads", count: 30, revenue: 1800.00, conversionRate: 8.5 }
    ],
    insights: [
      "Your primary audience is 25-34 year olds (40.5%), with strong purchasing power ($62 avg).",
      "87% of tickets are purchased 7+ days in advance, indicating strong early interest.",
      "Most attendees (45%) come in pairs, ideal for 2-for-1 promotions.",
      "Instagram shows highest conversion rate (18.5%), focus marketing efforts there.",
      "29% returning attendee rate suggests strong loyalty, consider VIP membership program."
    ],
    privacyCompliance: {
      minimumThresholdMet: true,
      totalAttendees: 296,
      consentRate: 98.5
    }
  }
}
```

### Analytics Service
```typescript
// /lib/services/demographics.service.ts
export class DemographicsService {
  async getDemographics(
    organizerId: string,
    eventId: string | null,
    dateRange: DateRange
  ): Promise<DemographicData> {
    // Privacy check: Ensure minimum threshold
    const totalAttendees = await this.getTotalAttendees(organizerId, eventId, dateRange);
    if (totalAttendees < 10) {
      throw new Error('Insufficient data for demographic analysis (minimum 10 attendees required)');
    }

    // Fetch attendee data with consent
    const attendees = await prisma.ticket.findMany({
      where: {
        event: { organizerId },
        ...(eventId && { eventId }),
        status: 'ACTIVE',
        order: {
          createdAt: {
            gte: dateRange.start,
            lte: dateRange.end
          }
        },
        // Only include attendees who consented to analytics
        user: {
          analyticsConsent: true
        }
      },
      include: {
        user: {
          select: {
            dateOfBirth: true,
            city: true,
            state: true,
            country: true,
            gender: true // Only if provided
          }
        },
        order: {
          select: {
            createdAt: true,
            totalAmount: true,
            source: true, // UTM source
            items: { include: { ticketType: true } }
          }
        },
        event: {
          select: {
            startDateTime: true,
            venueAddress: true,
            venueLat: true,
            venueLng: true
          }
        }
      }
    });

    return {
      ageDistribution: this.calculateAgeDistribution(attendees),
      locationBreakdown: await this.calculateLocationBreakdown(attendees),
      purchaseBehavior: this.analyzePurchaseBehavior(attendees),
      ticketPreferences: this.analyzeTicketPreferences(attendees),
      genderDistribution: this.calculateGenderDistribution(attendees),
      attendeeSegmentation: await this.segmentAttendees(organizerId, attendees),
      referralSources: this.analyzeReferralSources(attendees),
      insights: await this.generateInsights(attendees)
    };
  }

  private calculateAgeDistribution(attendees: Attendee[]): AgeGroup[] {
    const buckets = [
      { range: '18-24', min: 18, max: 24 },
      { range: '25-34', min: 25, max: 34 },
      { range: '35-44', min: 35, max: 44 },
      { range: '45-54', min: 45, max: 54 },
      { range: '55-64', min: 55, max: 64 },
      { range: '65+', min: 65, max: 999 }
    ];

    const total = attendees.length;

    return buckets.map(bucket => {
      const inBucket = attendees.filter(a => {
        if (!a.user.dateOfBirth) return false;
        const age = differenceInYears(new Date(), a.user.dateOfBirth);
        return age >= bucket.min && age <= bucket.max;
      });

      const totalSpend = inBucket.reduce((sum, a) => sum + a.order.totalAmount, 0);

      return {
        range: bucket.range,
        count: inBucket.length,
        percentage: (inBucket.length / total) * 100,
        averageSpend: inBucket.length > 0 ? totalSpend / inBucket.length : 0
      };
    }).filter(bucket => bucket.count > 0);
  }

  private async calculateLocationBreakdown(attendees: Attendee[]): Promise<LocationData[]> {
    // Group by city
    const cityMap = new Map<string, LocationData>();

    for (const attendee of attendees) {
      const key = `${attendee.user.city},${attendee.user.state}`;
      const existing = cityMap.get(key);

      // Calculate distance from venue
      const distance = this.calculateDistance(
        attendee.user.lat,
        attendee.user.lng,
        attendee.event.venueLat,
        attendee.event.venueLng
      );

      if (existing) {
        existing.count++;
        existing.averageDistance = (existing.averageDistance * (existing.count - 1) + distance) / existing.count;
      } else {
        cityMap.set(key, {
          city: attendee.user.city,
          state: attendee.user.state,
          country: attendee.user.country,
          count: 1,
          averageDistance: distance,
          lat: attendee.user.lat,
          lng: attendee.user.lng
        });
      }
    }

    return Array.from(cityMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 50); // Top 50 cities
  }

  private analyzePurchaseBehavior(attendees: Attendee[]): PurchasePattern {
    const daysBeforeEvent = attendees.map(a =>
      differenceInDays(a.event.startDateTime, a.order.createdAt)
    );

    const averageDaysBeforeEvent = daysBeforeEvent.reduce((sum, d) => sum + d, 0) / daysBeforeEvent.length;

    // Categorize timing
    const timingCounts = {
      early: daysBeforeEvent.filter(d => d > 30).length,
      medium: daysBeforeEvent.filter(d => d >= 7 && d <= 30).length,
      late: daysBeforeEvent.filter(d => d > 0 && d < 7).length,
      dayOf: daysBeforeEvent.filter(d => d === 0).length
    };

    const total = attendees.length;

    // Analyze group sizes (count tickets per order)
    const orderGroups = new Map<string, number>();
    attendees.forEach(a => {
      const count = orderGroups.get(a.order.id) || 0;
      orderGroups.set(a.order.id, count + 1);
    });

    const groupSizes = Array.from(orderGroups.values());
    const groupCounts = {
      solo: groupSizes.filter(g => g === 1).length,
      pair: groupSizes.filter(g => g === 2).length,
      smallGroup: groupSizes.filter(g => g >= 3 && g <= 5).length,
      largeGroup: groupSizes.filter(g => g > 5).length
    };

    const totalSpend = attendees.reduce((sum, a) => sum + a.order.totalAmount, 0);

    return {
      averageDaysBeforeEvent,
      timingDistribution: {
        early: (timingCounts.early / total) * 100,
        medium: (timingCounts.medium / total) * 100,
        late: (timingCounts.late / total) * 100,
        dayOf: (timingCounts.dayOf / total) * 100
      },
      groupSizes: {
        solo: (groupCounts.solo / groupSizes.length) * 100,
        pair: (groupCounts.pair / groupSizes.length) * 100,
        smallGroup: (groupCounts.smallGroup / groupSizes.length) * 100,
        largeGroup: (groupCounts.largeGroup / groupSizes.length) * 100
      },
      averageSpending: totalSpend / total
    };
  }

  private async segmentAttendees(
    organizerId: string,
    currentAttendees: Attendee[]
  ): Promise<AttendeeSegmentation> {
    const currentUserIds = new Set(currentAttendees.map(a => a.userId));

    // Find users who attended previous events
    const previousAttendees = await prisma.ticket.findMany({
      where: {
        event: { organizerId },
        createdAt: { lt: currentAttendees[0]?.order.createdAt },
        status: 'ACTIVE'
      },
      select: { userId: true },
      distinct: ['userId']
    });

    const previousUserIds = new Set(previousAttendees.map(a => a.userId));

    // Count returning attendees
    const returningCount = Array.from(currentUserIds).filter(id =>
      previousUserIds.has(id)
    ).length;

    const newCount = currentUserIds.size - returningCount;
    const retentionRate = (returningCount / currentUserIds.size) * 100;

    return {
      newAttendees: newCount,
      returningAttendees: returningCount,
      retentionRate
    };
  }

  private async generateInsights(attendees: Attendee[]): Promise<string[]> {
    const insights: string[] = [];

    // Age insight
    const ageDistribution = this.calculateAgeDistribution(attendees);
    const primaryAge = ageDistribution.sort((a, b) => b.percentage - a.percentage)[0];
    if (primaryAge) {
      insights.push(
        `Your primary audience is ${primaryAge.range} year olds (${primaryAge.percentage.toFixed(1)}%), ` +
        `with average spending of $${primaryAge.averageSpend.toFixed(2)}.`
      );
    }

    // Purchase timing insight
    const behavior = this.analyzePurchaseBehavior(attendees);
    const advancePurchase = behavior.timingDistribution.early + behavior.timingDistribution.medium;
    if (advancePurchase > 70) {
      insights.push(
        `${advancePurchase.toFixed(0)}% of tickets are purchased 7+ days in advance, ` +
        `indicating strong early interest.`
      );
    }

    // Group size insight
    if (behavior.groupSizes.pair > 40) {
      insights.push(
        `Most attendees (${behavior.groupSizes.pair.toFixed(0)}%) come in pairs, ` +
        `ideal for 2-for-1 promotions.`
      );
    }

    // Referral source insight
    const referrals = this.analyzeReferralSources(attendees);
    const topReferral = referrals.sort((a, b) => b.conversionRate - a.conversionRate)[0];
    if (topReferral) {
      insights.push(
        `${topReferral.source} shows highest conversion rate (${topReferral.conversionRate.toFixed(1)}%), ` +
        `focus marketing efforts there.`
      );
    }

    // Retention insight
    const segmentation = await this.segmentAttendees(attendees[0]?.event.organizerId, attendees);
    if (segmentation.retentionRate > 25) {
      insights.push(
        `${segmentation.retentionRate.toFixed(0)}% returning attendee rate suggests strong loyalty, ` +
        `consider VIP membership program.`
      );
    }

    return insights;
  }
}
```

## UI/UX Design

### Layout
```
┌─────────────────────────────────────────────────────────────┐
│ Attendee Demographics                                       │
│                                                              │
│ Event: [All Events ▼]  Date: [Last 30 days ▼]  [Export]   │
│                                                              │
│ 🔒 Privacy: All data is aggregated. No individual tracking.│
│                                                              │
│ ┌──────────────────┐ ┌──────────────────┐                  │
│ │ Age Distribution │ │ Location Map     │                  │
│ │ [Bar Chart]      │ │ [Mapbox]         │                  │
│ │  ████ 25-34: 40% │ │  🗺️               │                  │
│ │  ███  35-44: 26% │ │                  │                  │
│ │  ██   18-24: 15% │ │  • New York: 120 │                  │
│ │  █    45-54: 12% │ │  • LA: 85        │                  │
│ └──────────────────┘ └──────────────────┘                  │
│                                                              │
│ ┌──────────────────┐ ┌──────────────────┐                  │
│ │ Purchase Timing  │ │ Group Sizes      │                  │
│ │ [Pie Chart]      │ │ [Bar Chart]      │                  │
│ │  • 7-30 days: 48%│ │  ████ Pair: 45%  │                  │
│ │  • >30 days: 26% │ │  ███  Solo: 35%  │                  │
│ │  • <7 days: 22%  │ │  ██   Group: 15% │                  │
│ └──────────────────┘ └──────────────────┘                  │
│                                                              │
│ ┌──────────────────┐ ┌──────────────────┐                  │
│ │ New vs Returning │ │ Referral Sources │                  │
│ │ [Donut Chart]    │ │ [Bar Chart]      │                  │
│ │  🟦 New: 71%     │ │  Instagram: 18.5%│                  │
│ │  🟩 Return: 29%  │ │  Direct: 15.2%   │                  │
│ │                  │ │  Facebook: 12.8% │                  │
│ └──────────────────┘ └──────────────────┘                  │
│                                                              │
│ 💡 Key Insights:                                            │
│ • Primary audience is 25-34 year olds (40.5%)              │
│ • 87% purchase tickets 7+ days in advance                  │
│ • Most attendees come in pairs (45%)                       │
│ • Instagram has highest conversion rate (18.5%)            │
└─────────────────────────────────────────────────────────────┘
```

## Integration Points

### Dependencies
- **EPIC-004**: Ticket data
- **EPIC-003**: Order data with UTM parameters
- **EPIC-001**: User profile data (with consent)
- **Analytics tracking**: Page views, referral sources

### Privacy Compliance
- GDPR Article 6: Lawful basis for processing
- CCPA: Right to opt-out
- Data minimization: Only collect necessary data
- Consent management: Explicit opt-in for analytics

## Performance Requirements

- **Dashboard load**: < 3 seconds
- **Chart rendering**: < 500ms per chart
- **Map rendering**: < 1 second
- **Insights generation**: < 2 seconds

## Testing Requirements

### Unit Tests
```typescript
describe('DemographicsService', () => {
  it('calculates age distribution correctly', () => {
    const distribution = service.calculateAgeDistribution(attendees);
    expect(distribution).toHaveLength(6);
    expect(distribution[0].range).toBe('18-24');
  });

  it('enforces minimum threshold', async () => {
    await expect(service.getDemographics(orgId, eventId, range))
      .rejects.toThrow('Insufficient data');
  });
});
```

### Integration Tests
- [ ] Test demographics API with consent filtering
- [ ] Test privacy threshold enforcement
- [ ] Test location distance calculations
- [ ] Test insights generation

### E2E Tests
```typescript
test('organizer views demographics', async ({ page }) => {
  await page.goto('/dashboard/analytics/demographics');

  // Verify charts loaded
  await expect(page.locator('.age-distribution-chart')).toBeVisible();
  await expect(page.locator('.location-map')).toBeVisible();

  // Verify privacy notice
  await expect(page.locator('text=All data is aggregated')).toBeVisible();
});
```

## Security Considerations

- [ ] Enforce minimum 10 attendees for analytics
- [ ] Filter by analyticsConsent = true
- [ ] Anonymize all location data (no exact addresses)
- [ ] Audit log for demographic data access
- [ ] Rate limit API (20 req/min)

## Accessibility

- [ ] Charts have text alternatives
- [ ] Map has keyboard navigation
- [ ] Screen readers announce insights
- [ ] High contrast mode for charts

## Success Metrics

- **Target**: 60% of organizers view demographics
- **Target**: Average insights read >3 per session
- **Target**: 40% use location data for marketing
- **Target**: 98% consent rate from attendees

## Definition of Done

- [ ] All acceptance criteria met
- [ ] Privacy compliance verified
- [ ] Charts render correctly
- [ ] Insights generate accurately
- [ ] Unit tests pass (>80% coverage)
- [ ] Integration tests pass
- [ ] E2E tests pass
- [ ] Performance benchmarks met
- [ ] Security audit completed
- [ ] Privacy audit passed (GDPR/CCPA)
- [ ] Code reviewed and approved
- [ ] QA sign-off received
- [ ] Product Owner acceptance

## Notes

- Consider A/B testing insights presentation
- Future: Predictive demographics (ML forecasting)
- Monitor consent rates and adjust strategy
- Consider industry benchmark comparisons