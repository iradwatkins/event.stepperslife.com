# PERF-003: CDN Implementation

**Epic:** EPIC-012 Performance & Security
**Story Points:** 5
**Priority:** High
**Status:** Ready for Development

---

## User Story

**As a** global user
**I want** static assets delivered via CDN
**So that** I experience fast page loads regardless of my geographic location (<100ms asset delivery)

---

## Acceptance Criteria

### Functional Requirements
- [ ] CDN configured for all static assets (images, CSS, JS, fonts)
- [ ] Cache headers optimized for each asset type
- [ ] Automatic cache invalidation on deployments
- [ ] Geographic distribution across major regions
- [ ] HTTPS/TLS enforcement for all CDN traffic
- [ ] Custom domain support (cdn.stepperslife.com)
- [ ] Compression enabled (gzip/brotli)
- [ ] Version-based cache busting implemented
- [ ] Fallback mechanism if CDN fails
- [ ] Origin shield for reduced origin load

### Performance Requirements
- [ ] Global asset delivery: <100ms (p95)
- [ ] Cache hit ratio: >95%
- [ ] Origin requests reduction: >90%
- [ ] First byte time: <50ms from edge
- [ ] Compression ratio: >70% for text assets
- [ ] Image optimization: WebP/AVIF support
- [ ] Edge location coverage: 50+ global locations

### Technical Requirements
- [ ] Vercel Edge Network integration
- [ ] CloudFront as backup/alternative CDN
- [ ] Proper Cache-Control headers
- [ ] ETags for cache validation
- [ ] Immutable asset strategy
- [ ] CDN monitoring and analytics
- [ ] Cost optimization and budgeting

---

## Technical Specifications

### CDN Configuration

```typescript
// next.config.js
const CDN_URL = process.env.NEXT_PUBLIC_CDN_URL || '';

module.exports = {
  assetPrefix: CDN_URL,

  images: {
    domains: ['cdn.stepperslife.com'],
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 31536000, // 1 year
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  async headers() {
    return [
      {
        source: '/:all*(svg|jpg|jpeg|png|webp|avif|gif|ico)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};
```

### Cache Control Strategy

```typescript
// lib/cdn/cache-control.ts
export const CacheControlHeaders = {
  // Static assets - long cache (1 year)
  STATIC_ASSETS: {
    'Cache-Control': 'public, max-age=31536000, immutable',
    'CDN-Cache-Control': 'max-age=31536000',
  },

  // Images - long cache with stale-while-revalidate
  IMAGES: {
    'Cache-Control': 'public, max-age=31536000, stale-while-revalidate=86400',
    'CDN-Cache-Control': 'max-age=31536000',
  },

  // CSS/JS bundles - long cache (versioned)
  BUNDLES: {
    'Cache-Control': 'public, max-age=31536000, immutable',
    'CDN-Cache-Control': 'max-age=31536000',
    'Content-Encoding': 'br, gzip',
  },

  // Fonts - long cache
  FONTS: {
    'Cache-Control': 'public, max-age=31536000, immutable',
    'CDN-Cache-Control': 'max-age=31536000',
    'Access-Control-Allow-Origin': '*',
  },

  // HTML pages - short cache with revalidation
  PAGES: {
    'Cache-Control': 'public, max-age=60, stale-while-revalidate=3600',
    'CDN-Cache-Control': 'max-age=3600',
  },

  // API responses - conditional caching
  API: {
    'Cache-Control': 'private, max-age=0, must-revalidate',
    'CDN-Cache-Control': 'no-cache',
  },
} as const;

export function getCacheHeaders(assetType: keyof typeof CacheControlHeaders) {
  return CacheControlHeaders[assetType];
}
```

### Asset Optimization Service

```typescript
// lib/cdn/asset-optimizer.ts
import sharp from 'sharp';
import { Logger } from '@/lib/monitoring/logger';

export interface OptimizationOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'webp' | 'avif' | 'jpeg' | 'png';
  fit?: 'cover' | 'contain' | 'fill';
}

export class AssetOptimizer {
  private logger = new Logger('AssetOptimizer');

  async optimizeImage(
    buffer: Buffer,
    options: OptimizationOptions = {}
  ): Promise<Buffer> {
    try {
      const {
        width,
        height,
        quality = 85,
        format = 'webp',
        fit = 'cover',
      } = options;

      let processor = sharp(buffer);

      // Resize if dimensions provided
      if (width || height) {
        processor = processor.resize({
          width,
          height,
          fit,
          withoutEnlargement: true,
        });
      }

      // Convert to optimized format
      switch (format) {
        case 'avif':
          processor = processor.avif({ quality, effort: 4 });
          break;
        case 'webp':
          processor = processor.webp({ quality, effort: 4 });
          break;
        case 'jpeg':
          processor = processor.jpeg({ quality, progressive: true });
          break;
        case 'png':
          processor = processor.png({ compressionLevel: 9 });
          break;
      }

      const optimized = await processor.toBuffer();

      const originalSize = buffer.length;
      const optimizedSize = optimized.length;
      const reduction = ((1 - optimizedSize / originalSize) * 100).toFixed(1);

      this.logger.info(
        `Image optimized: ${originalSize} -> ${optimizedSize} bytes (${reduction}% reduction)`
      );

      return optimized;
    } catch (error) {
      this.logger.error('Image optimization failed', error);
      return buffer; // Return original on error
    }
  }

  async generateResponsiveImages(
    buffer: Buffer,
    sizes: number[] = [640, 1080, 1920]
  ): Promise<Record<number, Buffer>> {
    const images: Record<number, Buffer> = {};

    await Promise.all(
      sizes.map(async (size) => {
        images[size] = await this.optimizeImage(buffer, {
          width: size,
          format: 'webp',
        });
      })
    );

    return images;
  }
}
```

### CDN Helper Utilities

```typescript
// lib/cdn/helpers.ts
const CDN_BASE_URL = process.env.NEXT_PUBLIC_CDN_URL || '';

export function getCDNUrl(path: string): string {
  if (!CDN_BASE_URL) return path;

  // Ensure path starts with /
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;

  return `${CDN_BASE_URL}${normalizedPath}`;
}

export function getImageCDNUrl(
  src: string,
  options?: {
    width?: number;
    quality?: number;
    format?: 'webp' | 'avif';
  }
): string {
  const params = new URLSearchParams();

  if (options?.width) params.set('w', options.width.toString());
  if (options?.quality) params.set('q', options.quality.toString());
  if (options?.format) params.set('fm', options.format);

  const queryString = params.toString();
  const cdnUrl = getCDNUrl(src);

  return queryString ? `${cdnUrl}?${queryString}` : cdnUrl;
}

export function prefetchCDNAssets(urls: string[]): void {
  if (typeof window === 'undefined') return;

  urls.forEach((url) => {
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = getCDNUrl(url);
    document.head.appendChild(link);
  });
}

export function preloadCriticalAssets(assets: Array<{ url: string; type: string }>): void {
  if (typeof window === 'undefined') return;

  assets.forEach(({ url, type }) => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = getCDNUrl(url);
    link.as = type;
    document.head.appendChild(link);
  });
}
```

### Next.js Image Component Integration

```typescript
// components/common/OptimizedImage.tsx
import Image from 'next/image';
import { getCDNUrl } from '@/lib/cdn/helpers';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  priority?: boolean;
  className?: string;
}

export function OptimizedImage({
  src,
  alt,
  width,
  height,
  priority = false,
  className,
}: OptimizedImageProps) {
  const cdnSrc = getCDNUrl(src);

  return (
    <Image
      src={cdnSrc}
      alt={alt}
      width={width}
      height={height}
      priority={priority}
      className={className}
      loading={priority ? 'eager' : 'lazy'}
      placeholder="blur"
      blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mN8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=="
      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
    />
  );
}
```

---

## Implementation Details

### Vercel Edge Network Configuration

```json
// vercel.json
{
  "github": {
    "silent": true
  },
  "headers": [
    {
      "source": "/static/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        }
      ]
    },
    {
      "source": "/_next/image(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ],
  "rewrites": [
    {
      "source": "/cdn/:path*",
      "destination": "https://cdn.stepperslife.com/:path*"
    }
  ]
}
```

### CloudFront Alternative Configuration

```typescript
// infrastructure/cloudfront-config.ts
export const cloudFrontConfig = {
  Origins: [
    {
      Id: 'nextjs-origin',
      DomainName: 'events.stepperslife.com',
      CustomOriginConfig: {
        HTTPPort: 80,
        HTTPSPort: 443,
        OriginProtocolPolicy: 'https-only',
        OriginSSLProtocols: ['TLSv1.2'],
      },
    },
  ],

  DefaultCacheBehavior: {
    TargetOriginId: 'nextjs-origin',
    ViewerProtocolPolicy: 'redirect-to-https',
    AllowedMethods: ['GET', 'HEAD', 'OPTIONS'],
    CachedMethods: ['GET', 'HEAD'],
    Compress: true,

    ForwardedValues: {
      QueryString: true,
      Cookies: { Forward: 'none' },
      Headers: ['Accept', 'Accept-Encoding'],
    },

    MinTTL: 0,
    DefaultTTL: 86400,
    MaxTTL: 31536000,
  },

  CacheBehaviors: [
    {
      PathPattern: '/static/*',
      TargetOriginId: 'nextjs-origin',
      Compress: true,
      ViewerProtocolPolicy: 'redirect-to-https',
      MinTTL: 31536000,
      DefaultTTL: 31536000,
      MaxTTL: 31536000,
    },
    {
      PathPattern: '/_next/static/*',
      TargetOriginId: 'nextjs-origin',
      Compress: true,
      ViewerProtocolPolicy: 'redirect-to-https',
      MinTTL: 31536000,
      DefaultTTL: 31536000,
      MaxTTL: 31536000,
    },
  ],

  PriceClass: 'PriceClass_100', // US, Canada, Europe
  ViewerCertificate: {
    ACMCertificateArn: 'arn:aws:acm:us-east-1:ACCOUNT:certificate/CERT_ID',
    SSLSupportMethod: 'sni-only',
    MinimumProtocolVersion: 'TLSv1.2_2021',
  },
};
```

---

## Testing Requirements

### Performance Tests

```typescript
// tests/cdn/performance.test.ts
describe('CDN Performance', () => {
  it('should deliver assets in <100ms globally', async () => {
    const regions = ['us-east', 'eu-west', 'ap-southeast'];

    for (const region of regions) {
      const start = Date.now();
      await fetch(`https://cdn.stepperslife.com/static/logo.png`, {
        headers: { 'X-Test-Region': region },
      });
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(100);
    }
  });

  it('should achieve >95% cache hit ratio', async () => {
    const requests = 1000;
    let hits = 0;

    for (let i = 0; i < requests; i++) {
      const response = await fetch('https://cdn.stepperslife.com/test-asset.js');
      const cacheStatus = response.headers.get('x-cache');

      if (cacheStatus?.includes('HIT')) hits++;
    }

    const hitRatio = hits / requests;
    expect(hitRatio).toBeGreaterThan(0.95);
  });
});
```

### Integration Tests

```typescript
describe('CDN Integration', () => {
  it('should serve correct cache headers', async () => {
    const response = await fetch('https://cdn.stepperslife.com/static/main.css');
    const cacheControl = response.headers.get('cache-control');

    expect(cacheControl).toContain('max-age=31536000');
    expect(cacheControl).toContain('immutable');
  });

  it('should compress assets', async () => {
    const response = await fetch('https://cdn.stepperslife.com/static/bundle.js');
    const encoding = response.headers.get('content-encoding');

    expect(['gzip', 'br']).toContain(encoding);
  });

  it('should support WebP/AVIF formats', async () => {
    const response = await fetch('https://cdn.stepperslife.com/image.jpg', {
      headers: { 'Accept': 'image/webp,image/avif' },
    });
    const contentType = response.headers.get('content-type');

    expect(['image/webp', 'image/avif']).toContain(contentType);
  });
});
```

---

## Infrastructure Requirements

### CDN Provider Setup
- **Primary:** Vercel Edge Network (included with hosting)
- **Backup:** AWS CloudFront (optional for hybrid approach)
- **DNS:** Custom domain (cdn.stepperslife.com)
- **SSL/TLS:** Automatic certificate provisioning
- **Regions:** Global distribution (50+ edge locations)

### Monitoring Setup
- **Metrics:** Cache hit ratio, latency by region, bandwidth usage
- **Alerts:** Cache hit ratio <90%, latency >200ms
- **Logs:** Access logs, error rates, popular assets

### Cost Estimates
- **Vercel Edge:** Included in Pro plan
- **CloudFront:** ~$0.085/GB (first 10TB)
- **Bandwidth:** Estimate 500GB/month = ~$42.50/month

---

## Monitoring and Alerting

### Key Metrics
- Cache hit ratio (target: >95%)
- Edge latency p95 (target: <100ms)
- Origin requests (target: <5% of total)
- Bandwidth usage (budget: 500GB/month)
- Error rate (target: <0.1%)
- Popular assets analysis

### Alerts
- Critical: Cache hit ratio <85%
- Critical: CDN unavailable >5 minutes
- Warning: Edge latency >150ms
- Warning: Bandwidth >400GB/month
- Info: Cache invalidation completed

---

## Cache Invalidation Strategy

```typescript
// lib/cdn/invalidation.ts
export async function invalidateCDNCache(patterns: string[]): Promise<void> {
  if (process.env.VERCEL_ENV) {
    await invalidateVercelCache(patterns);
  }

  if (process.env.CLOUDFRONT_DISTRIBUTION_ID) {
    await invalidateCloudFrontCache(patterns);
  }
}

async function invalidateVercelCache(patterns: string[]): Promise<void> {
  // Vercel handles this automatically on deployment
  // Manual purge via API if needed
}

async function invalidateCloudFrontCache(patterns: string[]): Promise<void> {
  const cloudfront = new AWS.CloudFront();

  await cloudfront.createInvalidation({
    DistributionId: process.env.CLOUDFRONT_DISTRIBUTION_ID!,
    InvalidationBatch: {
      CallerReference: Date.now().toString(),
      Paths: {
        Quantity: patterns.length,
        Items: patterns,
      },
    },
  }).promise();
}
```

---

## Dependencies
- @vercel/edge-config
- sharp ^0.32.0
- AWS SDK (if using CloudFront)

## Related Stories
- PERF-002: Redis Caching
- PERF-004: Image Optimization
- PERF-005: Lazy Loading

---

**Notes:**
- Prioritize Vercel Edge Network for simplicity
- Monitor bandwidth costs closely
- Implement proper versioning for cache busting
- Test CDN performance across regions before production