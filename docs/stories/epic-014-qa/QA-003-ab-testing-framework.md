# QA-003: A/B Testing Framework

**Epic:** EPIC-014 - QA & Testing
**Story Points:** 5
**Priority:** Medium
**Status:** To Do

## User Story

**As a** product manager
**I want** an A/B testing framework
**So that** I can experiment with features and optimize conversion rates

## Description

Implement a comprehensive A/B testing framework that allows for controlled experiments on features, UI components, pricing strategies, and checkout flows. The system should support variant assignment, tracking, analytics, and statistical significance testing to make data-driven product decisions.

## Acceptance Criteria

### 1. Feature Flag System
- [ ] Feature flag configuration and management
- [ ] Boolean flags (on/off)
- [ ] Variant flags (A/B/C/D testing)
- [ ] Percentage-based rollout
- [ ] User targeting and segmentation
- [ ] Environment-specific flags (dev, staging, prod)

### 2. Experiment Management
- [ ] Create experiments with multiple variants
- [ ] Set experiment duration and sample size
- [ ] Define success metrics (conversion, revenue, etc.)
- [ ] Control vs treatment group allocation
- [ ] Randomized variant assignment
- [ ] Experiment status tracking (draft, running, completed)

### 3. Variant Assignment
- [ ] Consistent user assignment (sticky sessions)
- [ ] Traffic allocation percentage per variant
- [ ] User bucketing algorithm (hash-based)
- [ ] Assignment override for testing
- [ ] Assignment tracking and logging
- [ ] Support for logged-in and anonymous users

### 4. Event Tracking
- [ ] Track experiment exposure events
- [ ] Track conversion events
- [ ] Track custom metrics
- [ ] Event batching and queueing
- [ ] Integration with analytics platform
- [ ] Real-time event streaming

### 5. Statistical Analysis
- [ ] Sample size calculator
- [ ] Statistical significance testing (Chi-squared, t-test)
- [ ] Confidence intervals (95% confidence)
- [ ] P-value calculation
- [ ] Effect size measurement
- [ ] Bayesian probability (optional)
- [ ] Multiple testing correction (Bonferroni)

### 6. Analytics Dashboard
- [ ] Real-time experiment metrics
- [ ] Variant performance comparison
- [ ] Conversion rate visualization
- [ ] Statistical significance indicators
- [ ] Confidence interval charts
- [ ] Time-series performance graphs
- [ ] Export experiment results

### 7. Common Experiments
- [ ] Pricing experiments
- [ ] Checkout flow variations
- [ ] Call-to-action button tests
- [ ] Landing page layouts
- [ ] Email subject line tests
- [ ] Ticket display formats
- [ ] Search result ranking algorithms

## Technical Requirements

### Feature Flag Configuration
```typescript
// lib/ab-testing/feature-flags.config.ts
export interface FeatureFlag {
  key: string;
  name: string;
  description: string;
  type: 'boolean' | 'variant' | 'number' | 'string';
  defaultValue: any;
  variants?: Variant[];
  enabled: boolean;
  rolloutPercentage?: number;
  targeting?: TargetingRule[];
}

export interface Variant {
  key: string;
  name: string;
  weight: number; // Percentage allocation (0-100)
  payload?: any;
}

export const featureFlags: FeatureFlag[] = [
  {
    key: 'new_checkout_flow',
    name: 'New Checkout Flow',
    description: 'Test new streamlined checkout process',
    type: 'variant',
    enabled: true,
    rolloutPercentage: 50,
    variants: [
      { key: 'control', name: 'Original Checkout', weight: 50 },
      { key: 'treatment', name: 'New Checkout', weight: 50 },
    ],
  },
  {
    key: 'dynamic_pricing',
    name: 'Dynamic Pricing',
    description: 'Test price optimization algorithm',
    type: 'boolean',
    defaultValue: false,
    enabled: true,
    rolloutPercentage: 10,
  },
];
```

### A/B Testing Service
```typescript
// lib/ab-testing/ab-testing.service.ts
import crypto from 'crypto';

export class ABTestingService {
  /**
   * Get variant assignment for a user
   */
  getVariant(
    experimentKey: string,
    userId: string,
    context?: Record<string, any>
  ): string {
    const experiment = this.getExperiment(experimentKey);

    if (!experiment || !experiment.enabled) {
      return 'control';
    }

    // Check if user matches targeting rules
    if (!this.matchesTargeting(experiment, context)) {
      return 'control';
    }

    // Get bucket (0-100)
    const bucket = this.getUserBucket(userId, experimentKey);

    // Check rollout percentage
    if (bucket >= experiment.rolloutPercentage) {
      return 'control';
    }

    // Assign variant based on weights
    let cumulativeWeight = 0;
    for (const variant of experiment.variants) {
      cumulativeWeight += variant.weight;
      if (bucket < cumulativeWeight) {
        // Track exposure
        this.trackExposure(experimentKey, variant.key, userId);
        return variant.key;
      }
    }

    return 'control';
  }

  /**
   * Hash-based bucketing for consistent assignment
   */
  private getUserBucket(userId: string, experimentKey: string): number {
    const hash = crypto
      .createHash('md5')
      .update(`${userId}:${experimentKey}`)
      .digest('hex');

    // Convert first 4 bytes to number and mod 100
    const bucket = parseInt(hash.substring(0, 8), 16) % 100;
    return bucket;
  }

  /**
   * Track experiment exposure event
   */
  async trackExposure(
    experimentKey: string,
    variantKey: string,
    userId: string
  ): Promise<void> {
    await this.analyticsService.track({
      event: 'experiment_exposure',
      userId,
      properties: {
        experimentKey,
        variantKey,
        timestamp: new Date(),
      },
    });

    // Store in database for analysis
    await prisma.experimentExposure.create({
      data: {
        experimentKey,
        variantKey,
        userId,
        exposedAt: new Date(),
      },
    });
  }

  /**
   * Track conversion event
   */
  async trackConversion(
    experimentKey: string,
    userId: string,
    metricName: string,
    value?: number
  ): Promise<void> {
    const variant = await this.getUserVariant(experimentKey, userId);

    await this.analyticsService.track({
      event: 'experiment_conversion',
      userId,
      properties: {
        experimentKey,
        variantKey: variant,
        metricName,
        value,
        timestamp: new Date(),
      },
    });

    await prisma.experimentConversion.create({
      data: {
        experimentKey,
        variantKey: variant,
        userId,
        metricName,
        value,
        convertedAt: new Date(),
      },
    });
  }
}
```

### React Hook for A/B Testing
```typescript
// hooks/useExperiment.ts
import { useEffect, useState } from 'react';
import { useUser } from '@/hooks/useUser';
import { ABTestingService } from '@/lib/ab-testing/ab-testing.service';

export function useExperiment(experimentKey: string) {
  const { user } = useUser();
  const [variant, setVariant] = useState<string>('control');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const abService = new ABTestingService();
    const userId = user?.id || getAnonymousId();

    const assignedVariant = abService.getVariant(experimentKey, userId);
    setVariant(assignedVariant);
    setIsLoading(false);
  }, [experimentKey, user]);

  const trackConversion = (metricName: string, value?: number) => {
    const abService = new ABTestingService();
    const userId = user?.id || getAnonymousId();
    abService.trackConversion(experimentKey, userId, metricName, value);
  };

  return {
    variant,
    isLoading,
    trackConversion,
    isControl: variant === 'control',
    isTreatment: variant === 'treatment',
  };
}

// Helper to get or create anonymous ID
function getAnonymousId(): string {
  let id = localStorage.getItem('anonymous_id');
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem('anonymous_id', id);
  }
  return id;
}
```

### Example: Checkout Flow A/B Test
```typescript
// components/checkout/CheckoutFlow.tsx
import { useExperiment } from '@/hooks/useExperiment';

export function CheckoutFlow() {
  const { variant, trackConversion } = useExperiment('new_checkout_flow');

  const handlePurchaseComplete = (orderId: string, amount: number) => {
    // Track conversion
    trackConversion('purchase', amount);
  };

  if (variant === 'treatment') {
    return <NewCheckoutFlow onComplete={handlePurchaseComplete} />;
  }

  return <OriginalCheckoutFlow onComplete={handlePurchaseComplete} />;
}
```

### Statistical Analysis Service
```typescript
// lib/ab-testing/statistics.service.ts
export class StatisticsService {
  /**
   * Calculate sample size needed
   */
  calculateSampleSize(
    baselineConversion: number,
    minimumDetectableEffect: number,
    alpha: number = 0.05,
    power: number = 0.80
  ): number {
    // Using normal approximation
    const z_alpha = 1.96; // 95% confidence
    const z_beta = 0.84;  // 80% power

    const p1 = baselineConversion;
    const p2 = baselineConversion * (1 + minimumDetectableEffect);
    const p_avg = (p1 + p2) / 2;

    const numerator = (z_alpha + z_beta) ** 2 * 2 * p_avg * (1 - p_avg);
    const denominator = (p2 - p1) ** 2;

    return Math.ceil(numerator / denominator);
  }

  /**
   * Chi-squared test for statistical significance
   */
  chiSquaredTest(
    controlConversions: number,
    controlTotal: number,
    treatmentConversions: number,
    treatmentTotal: number
  ): {
    pValue: number;
    isSignificant: boolean;
    chiSquared: number;
  } {
    const n1 = controlTotal;
    const n2 = treatmentTotal;
    const x1 = controlConversions;
    const x2 = treatmentConversions;

    const p1 = x1 / n1;
    const p2 = x2 / n2;
    const p_pooled = (x1 + x2) / (n1 + n2);

    const numerator = (p2 - p1) ** 2;
    const denominator = p_pooled * (1 - p_pooled) * (1 / n1 + 1 / n2);

    const chiSquared = numerator / denominator;
    const pValue = 1 - this.chiSquaredCDF(chiSquared, 1);

    return {
      chiSquared,
      pValue,
      isSignificant: pValue < 0.05,
    };
  }

  /**
   * Calculate confidence interval
   */
  calculateConfidenceInterval(
    conversions: number,
    total: number,
    confidenceLevel: number = 0.95
  ): { lower: number; upper: number } {
    const p = conversions / total;
    const z = 1.96; // 95% confidence
    const se = Math.sqrt((p * (1 - p)) / total);

    return {
      lower: Math.max(0, p - z * se),
      upper: Math.min(1, p + z * se),
    };
  }

  /**
   * Calculate effect size (Cohen's d)
   */
  calculateEffectSize(
    controlMean: number,
    treatmentMean: number,
    pooledStdDev: number
  ): number {
    return (treatmentMean - controlMean) / pooledStdDev;
  }
}
```

### Experiment Dashboard Component
```typescript
// components/ab-testing/ExperimentDashboard.tsx
export function ExperimentDashboard({ experimentKey }: { experimentKey: string }) {
  const { data: experiment } = useQuery({
    queryKey: ['experiment', experimentKey],
    queryFn: () => fetch(`/api/experiments/${experimentKey}`).then(r => r.json()),
  });

  if (!experiment) return <Spinner />;

  const { control, treatment } = experiment.results;
  const stats = calculateStatistics(control, treatment);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-6">
        {/* Control Variant */}
        <Card>
          <CardHeader>
            <CardTitle>Control</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <MetricRow
                label="Exposures"
                value={control.exposures.toLocaleString()}
              />
              <MetricRow
                label="Conversions"
                value={control.conversions.toLocaleString()}
              />
              <MetricRow
                label="Conversion Rate"
                value={`${(control.conversionRate * 100).toFixed(2)}%`}
              />
              <MetricRow
                label="95% CI"
                value={`${(control.ci.lower * 100).toFixed(2)}% - ${(control.ci.upper * 100).toFixed(2)}%`}
              />
            </div>
          </CardContent>
        </Card>

        {/* Treatment Variant */}
        <Card>
          <CardHeader>
            <CardTitle>Treatment</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <MetricRow
                label="Exposures"
                value={treatment.exposures.toLocaleString()}
              />
              <MetricRow
                label="Conversions"
                value={treatment.conversions.toLocaleString()}
              />
              <MetricRow
                label="Conversion Rate"
                value={`${(treatment.conversionRate * 100).toFixed(2)}%`}
              />
              <MetricRow
                label="95% CI"
                value={`${(treatment.ci.lower * 100).toFixed(2)}% - ${(treatment.ci.upper * 100).toFixed(2)}%`}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Statistical Significance */}
      <Card>
        <CardHeader>
          <CardTitle>Statistical Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span>P-Value:</span>
              <Badge variant={stats.pValue < 0.05 ? 'success' : 'secondary'}>
                {stats.pValue.toFixed(4)}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Statistical Significance:</span>
              <Badge variant={stats.isSignificant ? 'success' : 'secondary'}>
                {stats.isSignificant ? 'Yes' : 'No'}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Relative Improvement:</span>
              <span className={stats.improvement > 0 ? 'text-green-600' : 'text-red-600'}>
                {(stats.improvement * 100).toFixed(2)}%
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Sample Size Achieved:</span>
              <span>
                {((control.exposures / stats.requiredSampleSize) * 100).toFixed(0)}%
              </span>
            </div>
          </div>

          {stats.isSignificant && (
            <Alert className="mt-4">
              <CheckCircle className="h-4 w-4" />
              <AlertTitle>Experiment Complete</AlertTitle>
              <AlertDescription>
                The treatment variant shows a statistically significant
                {stats.improvement > 0 ? ' improvement' : ' decrease'} over the control.
                {stats.improvement > 0
                  ? ' Consider rolling out to 100% of users.'
                  : ' Consider reverting to the control variant.'}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Conversion Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Conversion Rate Over Time</CardTitle>
        </CardHeader>
        <CardContent>
          <ConversionChart data={experiment.timeSeriesData} />
        </CardContent>
      </Card>
    </div>
  );
}
```

### Database Schema
```prisma
model Experiment {
  id              String   @id @default(cuid())
  key             String   @unique
  name            String
  description     String?
  status          String   @default("draft") // draft, running, completed, archived
  startDate       DateTime?
  endDate         DateTime?
  variants        Json     // Array of variants with weights
  targetMetric    String   // Metric to optimize
  requiredSampleSize Int?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  exposures       ExperimentExposure[]
  conversions     ExperimentConversion[]

  @@index([status])
  @@index([key])
}

model ExperimentExposure {
  id              String   @id @default(cuid())
  experimentKey   String
  variantKey      String
  userId          String
  exposedAt       DateTime @default(now())

  experiment      Experiment @relation(fields: [experimentKey], references: [key])

  @@index([experimentKey, userId])
  @@index([exposedAt])
}

model ExperimentConversion {
  id              String   @id @default(cuid())
  experimentKey   String
  variantKey      String
  userId          String
  metricName      String
  value           Float?
  convertedAt     DateTime @default(now())

  experiment      Experiment @relation(fields: [experimentKey], references: [key])

  @@index([experimentKey, variantKey])
  @@index([convertedAt])
}
```

## Implementation Details

### Phase 1: Infrastructure (Day 1-2)
1. Set up feature flag system
2. Implement variant assignment logic
3. Create bucketing algorithm
4. Build event tracking
5. Test assignment consistency

### Phase 2: Analytics & Stats (Day 3)
1. Implement statistical tests
2. Build analysis service
3. Create metrics calculations
4. Add confidence intervals
5. Test statistical accuracy

### Phase 3: Dashboard & UI (Day 4)
1. Build experiment dashboard
2. Create variant comparison views
3. Add real-time metrics
4. Implement charts
5. Test all visualizations

### Phase 4: Integration & Testing (Day 5)
1. Integrate with existing features
2. Create example experiments
3. Document A/B testing patterns
4. Train team on usage
5. Launch first experiments

### File Structure
```
/lib/ab-testing/
├── ab-testing.service.ts
├── statistics.service.ts
├── feature-flags.config.ts
└── types.ts

/hooks/
├── useExperiment.ts
└── useFeatureFlag.ts

/app/api/experiments/
├── route.ts
├── [experimentKey]/route.ts
└── [experimentKey]/results/route.ts

/app/dashboard/experiments/
├── page.tsx
├── [experimentKey]/page.tsx
└── components/
    ├── ExperimentDashboard.tsx
    ├── VariantComparison.tsx
    ├── ConversionChart.tsx
    └── CreateExperiment.tsx
```

## Dependencies
- Related: QA-004 (Unit Test Coverage)
- Integrates: Analytics platform

## Testing Checklist

### Assignment Logic
- [ ] Users get consistent variants
- [ ] Traffic split percentages are accurate
- [ ] Bucketing is uniform
- [ ] Targeting rules work correctly
- [ ] Override functionality works

### Tracking
- [ ] Exposure events are tracked
- [ ] Conversion events are tracked
- [ ] Events are attributed correctly
- [ ] No double-counting
- [ ] Anonymous users tracked

### Statistical Analysis
- [ ] Calculations are accurate
- [ ] Significance tests work correctly
- [ ] Confidence intervals are correct
- [ ] Sample size calculations accurate
- [ ] Multiple testing handled

### Dashboard
- [ ] Metrics display correctly
- [ ] Charts render properly
- [ ] Real-time updates work
- [ ] Export functionality works
- [ ] Mobile responsive

## Success Metrics
- Number of active experiments: > 5
- Experiment completion rate: > 80%
- Statistical significance achievement: > 60%
- Average experiment duration: < 30 days
- Conversion lift from winning variants: > 5%

## Additional Resources
- [Optimizely Best Practices](https://www.optimizely.com/optimization-glossary/)
- [Google Optimize Guide](https://support.google.com/optimize)
- [Statistical Significance Calculator](https://www.evanmiller.org/ab-testing/)

## Notes
- Consider using third-party services (Optimizely, LaunchDarkly)
- Implement gradual rollouts for winning variants
- Add support for multivariate testing (testing multiple variables)
- Monitor for Simpson's Paradox and novelty effects
- Document experiment results for organizational learning