# PERF-005: Lazy Loading Implementation

**Epic:** EPIC-012 Performance & Security
**Story Points:** 3
**Priority:** High
**Status:** Ready for Development

---

## User Story

**As a** user accessing the platform
**I want** page content to load progressively
**So that** I see the initial content immediately (FCP <1.8s, TTI <3.8s)

---

## Acceptance Criteria

### Functional Requirements
- [ ] Component-level lazy loading for heavy features
- [ ] Route-based code splitting for all pages
- [ ] Image lazy loading with intersection observer
- [ ] Progressive data loading for lists
- [ ] Skeleton screens during loading states
- [ ] Infinite scroll for event listings
- [ ] Prefetching for likely next interactions
- [ ] Dynamic imports for modals and dialogs
- [ ] Lazy load third-party scripts
- [ ] Viewport detection for below-the-fold content

### Performance Requirements
- [ ] First Contentful Paint (FCP): <1.8s
- [ ] Time to Interactive (TTI): <3.8s
- [ ] Initial bundle size: <200KB
- [ ] Lazy-loaded chunks: <100KB each
- [ ] Total bundle reduction: >40%
- [ ] Intersection observer overhead: <5ms
- [ ] Smooth scroll performance: 60fps

### Technical Requirements
- [ ] React.lazy() for component splitting
- [ ] Next.js dynamic imports
- [ ] Intersection Observer API
- [ ] Suspense boundaries with fallbacks
- [ ] Error boundaries for lazy components
- [ ] Loading state management
- [ ] Preload hints for critical paths

---

## Technical Specifications

### Component Lazy Loading

```typescript
// lib/lazy/lazy-component.ts
import { lazy, ComponentType, LazyExoticComponent } from 'react';

export interface LazyComponentOptions {
  fallback?: React.ReactNode;
  preload?: boolean;
  delay?: number;
}

export function lazyComponent<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  options: LazyComponentOptions = {}
): LazyExoticComponent<T> & { preload: () => Promise<void> } {
  let importPromise: Promise<{ default: T }> | null = null;

  const preload = () => {
    if (!importPromise) {
      importPromise = importFn();
    }
    return importPromise.then(() => {});
  };

  const LazyComponent = lazy(() => {
    if (importPromise) {
      return importPromise;
    }
    importPromise = importFn();
    return importPromise;
  });

  // Add preload method to lazy component
  (LazyComponent as any).preload = preload;

  // Preload immediately if requested
  if (options.preload) {
    preload();
  }

  return LazyComponent as LazyExoticComponent<T> & { preload: () => Promise<void> };
}
```

### Lazy Component Registry

```typescript
// components/lazy/index.ts
import { lazyComponent } from '@/lib/lazy/lazy-component';

// Heavy components - load only when needed
export const EventAnalytics = lazyComponent(
  () => import('./EventAnalytics'),
  { preload: false }
);

export const EventManagement = lazyComponent(
  () => import('./EventManagement'),
  { preload: false }
);

export const TicketPurchaseModal = lazyComponent(
  () => import('./TicketPurchaseModal'),
  { preload: false }
);

export const CheckInScanner = lazyComponent(
  () => import('./CheckInScanner'),
  { preload: false }
);

export const AdvancedFilters = lazyComponent(
  () => import('./AdvancedFilters'),
  { preload: false }
);

export const PaymentForm = lazyComponent(
  () => import('./PaymentForm'),
  { preload: true } // Preload since often used
);

export const EventCalendar = lazyComponent(
  () => import('./EventCalendar'),
  { preload: false }
);

export const UserProfile = lazyComponent(
  () => import('./UserProfile'),
  { preload: false }
);
```

### Intersection Observer Hook

```typescript
// hooks/useIntersectionObserver.ts
import { useEffect, useRef, useState } from 'react';

export interface IntersectionObserverOptions {
  threshold?: number;
  root?: Element | null;
  rootMargin?: string;
  triggerOnce?: boolean;
}

export function useIntersectionObserver(
  options: IntersectionObserverOptions = {}
) {
  const {
    threshold = 0,
    root = null,
    rootMargin = '50px',
    triggerOnce = true,
  } = options;

  const [isIntersecting, setIsIntersecting] = useState(false);
  const [hasIntersected, setHasIntersected] = useState(false);
  const elementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element || (triggerOnce && hasIntersected)) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const isElementIntersecting = entry.isIntersecting;
        setIsIntersecting(isElementIntersecting);

        if (isElementIntersecting && triggerOnce) {
          setHasIntersected(true);
        }
      },
      {
        threshold,
        root,
        rootMargin,
      }
    );

    observer.observe(element);

    return () => {
      if (element) {
        observer.unobserve(element);
      }
    };
  }, [threshold, root, rootMargin, triggerOnce, hasIntersected]);

  return {
    elementRef,
    isIntersecting: isIntersecting || hasIntersected,
  };
}
```

### Lazy Load Component Wrapper

```typescript
// components/lazy/LazyLoad.tsx
'use client';

import { ReactNode } from 'react';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';

interface LazyLoadProps {
  children: ReactNode;
  fallback?: ReactNode;
  threshold?: number;
  rootMargin?: string;
  className?: string;
}

export function LazyLoad({
  children,
  fallback = null,
  threshold = 0,
  rootMargin = '100px',
  className,
}: LazyLoadProps) {
  const { elementRef, isIntersecting } = useIntersectionObserver({
    threshold,
    rootMargin,
    triggerOnce: true,
  });

  return (
    <div ref={elementRef as any} className={className}>
      {isIntersecting ? children : fallback}
    </div>
  );
}
```

### Infinite Scroll Hook

```typescript
// hooks/useInfiniteScroll.ts
import { useEffect, useRef, useState } from 'react';
import { useIntersectionObserver } from './useIntersectionObserver';

export interface UseInfiniteScrollOptions<T> {
  fetchData: (page: number) => Promise<T[]>;
  initialPage?: number;
  pageSize?: number;
}

export function useInfiniteScroll<T>({
  fetchData,
  initialPage = 1,
  pageSize = 20,
}: UseInfiniteScrollOptions<T>) {
  const [data, setData] = useState<T[]>([]);
  const [page, setPage] = useState(initialPage);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const { elementRef, isIntersecting } = useIntersectionObserver({
    threshold: 0.5,
    rootMargin: '200px',
    triggerOnce: false,
  });

  const loadMore = async () => {
    if (isLoading || !hasMore) return;

    setIsLoading(true);
    setError(null);

    try {
      const newData = await fetchData(page);

      if (newData.length === 0 || newData.length < pageSize) {
        setHasMore(false);
      }

      setData((prev) => [...prev, ...newData]);
      setPage((prev) => prev + 1);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load data'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isIntersecting && hasMore && !isLoading) {
      loadMore();
    }
  }, [isIntersecting, hasMore, isLoading]);

  return {
    data,
    isLoading,
    error,
    hasMore,
    loadMoreRef: elementRef,
    reload: () => {
      setData([]);
      setPage(initialPage);
      setHasMore(true);
      setError(null);
    },
  };
}
```

### Skeleton Loading Component

```typescript
// components/common/Skeleton.tsx
interface SkeletonProps {
  variant?: 'text' | 'rect' | 'circle';
  width?: string | number;
  height?: string | number;
  className?: string;
}

export function Skeleton({
  variant = 'rect',
  width,
  height,
  className = '',
}: SkeletonProps) {
  const baseClass = 'animate-pulse bg-gray-200 dark:bg-gray-700';

  const variantClass = {
    text: 'rounded h-4',
    rect: 'rounded-lg',
    circle: 'rounded-full',
  }[variant];

  const style = {
    width: width || (variant === 'text' ? '100%' : undefined),
    height: height || (variant === 'text' ? undefined : '100%'),
  };

  return <div className={`${baseClass} ${variantClass} ${className}`} style={style} />;
}

// Event card skeleton
export function EventCardSkeleton() {
  return (
    <div className="border rounded-lg p-4 space-y-4">
      <Skeleton variant="rect" height={200} />
      <Skeleton variant="text" width="80%" />
      <Skeleton variant="text" width="60%" />
      <div className="flex justify-between">
        <Skeleton variant="text" width={100} />
        <Skeleton variant="text" width={80} />
      </div>
    </div>
  );
}
```

### Progressive Event List

```typescript
// components/events/EventList.tsx
'use client';

import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';
import { EventCard } from './EventCard';
import { EventCardSkeleton } from '../common/Skeleton';
import { LazyLoad } from '../lazy/LazyLoad';

export function EventList() {
  const {
    data: events,
    isLoading,
    hasMore,
    loadMoreRef,
    error,
  } = useInfiniteScroll({
    fetchData: async (page) => {
      const response = await fetch(`/api/events?page=${page}&limit=20`);
      return response.json();
    },
    pageSize: 20,
  });

  return (
    <div className="space-y-4">
      {/* Initial events */}
      {events.map((event, index) => (
        <LazyLoad
          key={event.id}
          fallback={<EventCardSkeleton />}
          rootMargin="200px"
        >
          <EventCard event={event} />
        </LazyLoad>
      ))}

      {/* Loading indicator */}
      {isLoading && (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <EventCardSkeleton key={i} />
          ))}
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="text-center text-red-600 p-4">
          Failed to load events. Please try again.
        </div>
      )}

      {/* Load more trigger */}
      {hasMore && !isLoading && (
        <div ref={loadMoreRef as any} className="h-10" />
      )}

      {/* End of list */}
      {!hasMore && events.length > 0 && (
        <div className="text-center text-gray-500 p-4">
          No more events to load
        </div>
      )}
    </div>
  );
}
```

### Route Code Splitting

```typescript
// app/dashboard/layout.tsx
import { Suspense } from 'react';
import dynamic from 'next/dynamic';

// Lazy load heavy dashboard components
const DashboardSidebar = dynamic(() => import('@/components/dashboard/Sidebar'), {
  loading: () => <SidebarSkeleton />,
  ssr: false,
});

const DashboardHeader = dynamic(() => import('@/components/dashboard/Header'), {
  loading: () => <HeaderSkeleton />,
});

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen">
      <Suspense fallback={<SidebarSkeleton />}>
        <DashboardSidebar />
      </Suspense>

      <div className="flex-1 flex flex-col overflow-hidden">
        <Suspense fallback={<HeaderSkeleton />}>
          <DashboardHeader />
        </Suspense>

        <main className="flex-1 overflow-auto p-6">
          <Suspense fallback={<PageSkeleton />}>
            {children}
          </Suspense>
        </main>
      </div>
    </div>
  );
}
```

### Prefetching Strategy

```typescript
// lib/prefetch/strategy.ts
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export function usePrefetchRoutes() {
  const router = useRouter();

  useEffect(() => {
    // Prefetch likely next routes
    const routes = [
      '/dashboard/events',
      '/dashboard/analytics',
      '/events',
    ];

    routes.forEach((route) => {
      router.prefetch(route);
    });
  }, [router]);
}

export function usePrefetchOnHover(href: string) {
  const router = useRouter();

  const handleMouseEnter = () => {
    router.prefetch(href);
  };

  return { onMouseEnter: handleMouseEnter };
}
```

---

## Implementation Details

### Third-Party Script Lazy Loading

```typescript
// components/common/LazyScript.tsx
'use client';

import { useEffect } from 'react';

interface LazyScriptProps {
  src: string;
  onLoad?: () => void;
  strategy?: 'idle' | 'visible' | 'immediate';
}

export function LazyScript({
  src,
  onLoad,
  strategy = 'idle',
}: LazyScriptProps) {
  useEffect(() => {
    const loadScript = () => {
      const script = document.createElement('script');
      script.src = src;
      script.async = true;
      script.onload = () => onLoad?.();
      document.body.appendChild(script);
    };

    if (strategy === 'immediate') {
      loadScript();
    } else if (strategy === 'idle') {
      if ('requestIdleCallback' in window) {
        requestIdleCallback(loadScript);
      } else {
        setTimeout(loadScript, 1);
      }
    } else if (strategy === 'visible') {
      const observer = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) {
          loadScript();
          observer.disconnect();
        }
      });

      observer.observe(document.body);
    }
  }, [src, onLoad, strategy]);

  return null;
}
```

### Bundle Analysis Configuration

```javascript
// next.config.js
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

module.exports = withBundleAnalyzer({
  experimental: {
    optimizeCss: true,
  },
  webpack: (config, { dev, isServer }) => {
    // Optimize chunks
    if (!dev && !isServer) {
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          default: false,
          vendors: false,
          commons: {
            name: 'commons',
            chunks: 'all',
            minChunks: 2,
          },
          lib: {
            test: /[\\/]node_modules[\\/]/,
            name(module) {
              const packageName = module.context.match(
                /[\\/]node_modules[\\/](.*?)([\\/]|$)/
              )?.[1];
              return `npm.${packageName?.replace('@', '')}`;
            },
          },
        },
      };
    }

    return config;
  },
});
```

---

## Testing Requirements

### Performance Tests

```typescript
describe('Lazy Loading Performance', () => {
  it('should achieve FCP <1.8s', async () => {
    const metrics = await measurePageMetrics('/events');
    expect(metrics.fcp).toBeLessThan(1800);
  });

  it('should achieve TTI <3.8s', async () => {
    const metrics = await measurePageMetrics('/dashboard');
    expect(metrics.tti).toBeLessThan(3800);
  });

  it('should reduce initial bundle <200KB', () => {
    const bundleSize = getBundleSize('main');
    expect(bundleSize).toBeLessThan(200 * 1024);
  });

  it('should load components only when visible', async () => {
    const { container } = render(<EventList />);
    const belowFoldEvent = container.querySelector('[data-index="10"]');

    expect(belowFoldEvent).toBeNull();

    // Scroll down
    window.scrollTo(0, 2000);
    await waitFor(() => {
      expect(container.querySelector('[data-index="10"]')).toBeInTheDocument();
    });
  });
});
```

---

## Infrastructure Requirements

### Dependencies
```json
{
  "dependencies": {
    "next": "^14.0.0",
    "react": "^18.0.0"
  },
  "devDependencies": {
    "@next/bundle-analyzer": "^14.0.0"
  }
}
```

### Bundle Size Monitoring
- Setup bundle-analyzer in CI/CD
- Alert on bundle size increases >10%
- Track lazy chunk sizes

---

## Monitoring and Alerting

### Key Metrics
- FCP (First Contentful Paint)
- TTI (Time to Interactive)
- Initial bundle size
- Lazy chunk sizes
- Intersection observer performance
- Prefetch effectiveness

### Alerts
- Critical: FCP >2.5s
- Critical: TTI >5s
- Warning: Bundle size >250KB
- Warning: Lazy chunk >150KB

---

## Dependencies
- next ^14.0.0
- @next/bundle-analyzer ^14.0.0

## Related Stories
- PERF-003: CDN Implementation
- PERF-004: Image Optimization

---

**Notes:**
- Use Suspense boundaries generously
- Implement proper error boundaries
- Monitor bundle sizes in CI/CD
- Test intersection observer performance on low-end devices