# PERF-004: Image Optimization

**Epic:** EPIC-012 Performance & Security
**Story Points:** 3
**Priority:** High
**Status:** Ready for Development

---

## User Story

**As a** user browsing events
**I want** images to load quickly without sacrificing quality
**So that** I can see event details immediately (LCP <2.5s, 70%+ size reduction)

---

## Acceptance Criteria

### Functional Requirements
- [ ] Automatic format conversion (WebP/AVIF with JPEG/PNG fallback)
- [ ] Dynamic image resizing based on viewport
- [ ] Lazy loading for below-the-fold images
- [ ] Blur placeholder during load
- [ ] Responsive image srcsets generated automatically
- [ ] Original image preservation in storage
- [ ] Upload size validation and rejection
- [ ] Automatic orientation correction (EXIF)
- [ ] Lossless compression for PNG/JPEG
- [ ] Image metadata stripping for privacy

### Performance Requirements
- [ ] File size reduction: >70% on average
- [ ] LCP (Largest Contentful Paint): <2.5s
- [ ] WebP support: 95%+ browser coverage
- [ ] AVIF support: Modern browsers
- [ ] Processing time: <2s per image
- [ ] Concurrent upload processing: 10+ images
- [ ] CDN cache hit ratio: >95% for images

### Technical Requirements
- [ ] Next.js Image component integration
- [ ] Sharp library for server-side optimization
- [ ] Client-side upload optimization
- [ ] Progressive JPEG encoding
- [ ] Blur hash generation
- [ ] Image dimensions validation
- [ ] Storage optimization

---

## Technical Specifications

### Image Optimization Service

```typescript
// lib/images/optimizer.ts
import sharp from 'sharp';
import { Logger } from '@/lib/monitoring/logger';

export interface ImageOptimizationOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  formats?: Array<'webp' | 'avif' | 'jpeg' | 'png'>;
  stripMetadata?: boolean;
  progressive?: boolean;
}

export interface OptimizedImage {
  format: string;
  buffer: Buffer;
  width: number;
  height: number;
  size: number;
}

export class ImageOptimizer {
  private logger = new Logger('ImageOptimizer');

  private defaultOptions: ImageOptimizationOptions = {
    maxWidth: 2048,
    maxHeight: 2048,
    quality: 85,
    formats: ['webp', 'avif', 'jpeg'],
    stripMetadata: true,
    progressive: true,
  };

  async optimize(
    input: Buffer,
    options: ImageOptimizationOptions = {}
  ): Promise<Map<string, OptimizedImage>> {
    const opts = { ...this.defaultOptions, ...options };
    const results = new Map<string, OptimizedImage>();

    try {
      // Get image metadata
      const metadata = await sharp(input).metadata();
      const originalSize = input.length;

      this.logger.info('Optimizing image', {
        originalFormat: metadata.format,
        originalSize,
        dimensions: `${metadata.width}x${metadata.height}`,
      });

      // Base processor with common operations
      let processor = sharp(input);

      // Auto-rotate based on EXIF
      processor = processor.rotate();

      // Resize if exceeds max dimensions
      if (
        metadata.width! > opts.maxWidth! ||
        metadata.height! > opts.maxHeight!
      ) {
        processor = processor.resize(opts.maxWidth, opts.maxHeight, {
          fit: 'inside',
          withoutEnlargement: true,
        });
      }

      // Strip metadata if requested
      if (opts.stripMetadata) {
        processor = processor.withMetadata({
          // Keep only essential metadata
          orientation: metadata.orientation,
        });
      }

      // Generate optimized versions in each format
      for (const format of opts.formats!) {
        const optimized = await this.generateFormat(
          processor.clone(),
          format,
          opts
        );
        results.set(format, optimized);
      }

      // Log optimization results
      const bestOptimization = Array.from(results.values()).reduce((best, current) =>
        current.size < best.size ? current : best
      );

      const reduction = (
        ((originalSize - bestOptimization.size) / originalSize) *
        100
      ).toFixed(1);

      this.logger.info('Image optimization complete', {
        originalSize,
        bestSize: bestOptimization.size,
        bestFormat: bestOptimization.format,
        reduction: `${reduction}%`,
      });

      return results;
    } catch (error) {
      this.logger.error('Image optimization failed', error);
      throw new Error('Failed to optimize image');
    }
  }

  private async generateFormat(
    processor: sharp.Sharp,
    format: string,
    options: ImageOptimizationOptions
  ): Promise<OptimizedImage> {
    let formatted: sharp.Sharp;

    switch (format) {
      case 'webp':
        formatted = processor.webp({
          quality: options.quality,
          effort: 4, // Balance between speed and compression
        });
        break;

      case 'avif':
        formatted = processor.avif({
          quality: options.quality,
          effort: 4,
        });
        break;

      case 'jpeg':
        formatted = processor.jpeg({
          quality: options.quality,
          progressive: options.progressive,
          mozjpeg: true, // Better compression
        });
        break;

      case 'png':
        formatted = processor.png({
          compressionLevel: 9,
          adaptiveFiltering: true,
        });
        break;

      default:
        throw new Error(`Unsupported format: ${format}`);
    }

    const buffer = await formatted.toBuffer();
    const metadata = await sharp(buffer).metadata();

    return {
      format,
      buffer,
      width: metadata.width!,
      height: metadata.height!,
      size: buffer.length,
    };
  }

  async generateResponsiveSet(
    input: Buffer,
    sizes: number[] = [640, 750, 828, 1080, 1200, 1920]
  ): Promise<Map<number, Map<string, OptimizedImage>>> {
    const results = new Map<number, Map<string, OptimizedImage>>();

    await Promise.all(
      sizes.map(async (size) => {
        const optimized = await this.optimize(input, {
          maxWidth: size,
          maxHeight: size,
        });
        results.set(size, optimized);
      })
    );

    return results;
  }

  async generateBlurHash(input: Buffer): Promise<string> {
    try {
      const { data, info } = await sharp(input)
        .resize(32, 32, { fit: 'inside' })
        .ensureAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });

      // Convert to base64 data URL
      const blurred = await sharp(data, {
        raw: {
          width: info.width,
          height: info.height,
          channels: 4,
        },
      })
        .blur(5)
        .png()
        .toBuffer();

      return `data:image/png;base64,${blurred.toString('base64')}`;
    } catch (error) {
      this.logger.error('Failed to generate blur hash', error);
      return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mN8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';
    }
  }
}
```

### Upload Handler with Optimization

```typescript
// app/api/images/upload/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { ImageOptimizer } from '@/lib/images/optimizer';
import { uploadToStorage } from '@/lib/storage/s3';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('image') as File;

    if (!file) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only JPEG, PNG, and WebP are allowed.' },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 10MB.' },
        { status: 400 }
      );
    }

    // Convert to buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Optimize image
    const optimizer = new ImageOptimizer();
    const optimizedImages = await optimizer.optimize(buffer);
    const blurHash = await optimizer.generateBlurHash(buffer);

    // Upload optimized versions to storage
    const uploadPromises: Promise<any>[] = [];
    const imageUrls: Record<string, string> = {};

    for (const [format, optimized] of optimizedImages) {
      const filename = `${Date.now()}-${Math.random().toString(36).substring(7)}.${format}`;
      const uploadPromise = uploadToStorage(optimized.buffer, filename).then(
        (url) => {
          imageUrls[format] = url;
        }
      );
      uploadPromises.push(uploadPromise);
    }

    await Promise.all(uploadPromises);

    // Save to database
    const image = await prisma.image.create({
      data: {
        userId: session.user.id,
        originalUrl: imageUrls.jpeg || imageUrls.png,
        webpUrl: imageUrls.webp,
        avifUrl: imageUrls.avif,
        blurHash,
        width: optimizedImages.get('jpeg')?.width || 0,
        height: optimizedImages.get('jpeg')?.height || 0,
        size: buffer.length,
        optimizedSize: optimizedImages.get('webp')?.size || 0,
      },
    });

    return NextResponse.json({
      success: true,
      image: {
        id: image.id,
        urls: imageUrls,
        blurHash,
        dimensions: {
          width: image.width,
          height: image.height,
        },
      },
    });
  } catch (error) {
    console.error('Image upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload image' },
      { status: 500 }
    );
  }
}
```

### Optimized Image Component

```typescript
// components/common/OptimizedImage.tsx
'use client';

import Image from 'next/image';
import { useState } from 'react';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width: number;
  height: number;
  blurHash?: string;
  priority?: boolean;
  className?: string;
  fill?: boolean;
}

export function OptimizedImage({
  src,
  alt,
  width,
  height,
  blurHash,
  priority = false,
  className,
  fill = false,
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true);

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {isLoading && blurHash && (
        <div
          className="absolute inset-0 blur-xl scale-110"
          style={{
            backgroundImage: `url(${blurHash})`,
            backgroundSize: 'cover',
          }}
        />
      )}

      <Image
        src={src}
        alt={alt}
        width={fill ? undefined : width}
        height={fill ? undefined : height}
        fill={fill}
        priority={priority}
        loading={priority ? 'eager' : 'lazy'}
        quality={85}
        className={`transition-opacity duration-300 ${
          isLoading ? 'opacity-0' : 'opacity-100'
        }`}
        onLoadingComplete={() => setIsLoading(false)}
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
      />
    </div>
  );
}
```

### Image Format Detection

```typescript
// lib/images/format-detector.ts
export function getSupportedFormats(): string[] {
  if (typeof window === 'undefined') return ['jpeg'];

  const formats: string[] = ['jpeg'];

  // Check WebP support
  const webpSupport = document
    .createElement('canvas')
    .toDataURL('image/webp')
    .indexOf('data:image/webp') === 0;

  if (webpSupport) formats.push('webp');

  // Check AVIF support
  const avifImage = new Image();
  avifImage.src =
    'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAABcAAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAEAAAABAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQAMAAAAABNjb2xybmNseAACAAIABoAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAAB9tZGF0EgAKCBgABogQEDQgMgkQAAAAB8dSLfI=';

  avifImage.onload = () => formats.push('avif');

  return formats;
}

export function getBestImageUrl(urls: {
  avif?: string;
  webp?: string;
  jpeg?: string;
  png?: string;
}): string {
  const supportedFormats = getSupportedFormats();

  if (supportedFormats.includes('avif') && urls.avif) return urls.avif;
  if (supportedFormats.includes('webp') && urls.webp) return urls.webp;
  if (urls.jpeg) return urls.jpeg;
  if (urls.png) return urls.png;

  return '';
}
```

---

## Implementation Details

### Database Schema Addition

```prisma
model Image {
  id            String   @id @default(cuid())
  userId        String
  user          User     @relation(fields: [userId], references: [id])

  originalUrl   String
  webpUrl       String?
  avifUrl       String?
  blurHash      String?

  width         Int
  height        Int
  size          Int      // Original size in bytes
  optimizedSize Int      // Best optimized size

  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@index([userId])
}
```

### Client-Side Upload Optimization

```typescript
// lib/images/client-optimizer.ts
export async function optimizeBeforeUpload(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();

      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d')!;

        // Calculate new dimensions (max 2048px)
        let { width, height } = img;
        const maxDimension = 2048;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = (height / width) * maxDimension;
            width = maxDimension;
          } else {
            width = (width / height) * maxDimension;
            height = maxDimension;
          }
        }

        canvas.width = width;
        canvas.height = height;

        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) resolve(blob);
            else reject(new Error('Failed to optimize image'));
          },
          'image/jpeg',
          0.85
        );
      };

      img.src = e.target?.result as string;
    };

    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
```

---

## Testing Requirements

### Performance Tests

```typescript
describe('Image Optimization Performance', () => {
  it('should reduce image size by >70%', async () => {
    const optimizer = new ImageOptimizer();
    const input = await readTestImage('large-photo.jpg');
    const originalSize = input.length;

    const optimized = await optimizer.optimize(input);
    const webpSize = optimized.get('webp')!.size;

    const reduction = ((originalSize - webpSize) / originalSize) * 100;
    expect(reduction).toBeGreaterThan(70);
  });

  it('should process images in <2s', async () => {
    const optimizer = new ImageOptimizer();
    const input = await readTestImage('test-photo.jpg');

    const start = Date.now();
    await optimizer.optimize(input);
    const duration = Date.now() - start;

    expect(duration).toBeLessThan(2000);
  });

  it('should generate blur hash quickly', async () => {
    const optimizer = new ImageOptimizer();
    const input = await readTestImage('test-photo.jpg');

    const start = Date.now();
    const blurHash = await optimizer.generateBlurHash(input);
    const duration = Date.now() - start;

    expect(duration).toBeLessThan(500);
    expect(blurHash).toContain('data:image/png;base64');
  });
});
```

---

## Infrastructure Requirements

### Dependencies
```json
{
  "dependencies": {
    "sharp": "^0.32.6",
    "next": "^14.0.0"
  }
}
```

### Environment Variables
```env
MAX_IMAGE_SIZE=10485760
SUPPORTED_IMAGE_FORMATS=jpeg,png,webp
IMAGE_QUALITY=85
```

---

## Monitoring and Alerting

### Key Metrics
- Average file size reduction
- Image processing time
- WebP/AVIF adoption rate
- LCP scores
- Failed optimizations

### Alerts
- Warning: Size reduction <60%
- Warning: Processing time >3s
- Critical: Failed optimizations >5%

---

## Dependencies
- sharp ^0.32.6
- next ^14.0.0

## Related Stories
- PERF-003: CDN Implementation
- PERF-005: Lazy Loading

---

**Notes:**
- Always preserve original images
- Consider implementing progressive JPEG
- Monitor Sharp memory usage in production
- Test across different browsers for format support