# WL-003: Brand Asset Management System

**Epic:** EPIC-011: White-Label Features
**Story Points:** 3
**Priority:** Medium
**Status:** Not Started

---

## User Story

**As a** white-label client
**I want to** upload and manage my brand assets (logos, favicons, email headers, social images)
**So that** my branding is consistently applied across all touchpoints

### Acceptance Criteria

1. **Asset Upload Interface**
   - [ ] Upload logos (primary, dark variant, small/icon)
   - [ ] Upload favicon (ICO, PNG formats)
   - [ ] Upload email header image
   - [ ] Upload social sharing image (OpenGraph)
   - [ ] Drag-and-drop upload support
   - [ ] Bulk upload capability
   - [ ] File size limits displayed (5MB per file)
   - [ ] Supported formats shown (PNG, SVG, JPG, ICO)

2. **Asset Management**
   - [ ] View all uploaded assets in gallery
   - [ ] Preview assets in context (header, email, social)
   - [ ] Replace existing assets
   - [ ] Delete unused assets
   - [ ] Download original assets
   - [ ] Asset metadata (upload date, file size, dimensions)
   - [ ] Asset version history (last 5 versions)

3. **Image Optimization**
   - [ ] Automatic image compression (maintain quality)
   - [ ] Generate multiple sizes for responsive images
   - [ ] Convert to WebP for modern browsers
   - [ ] Lazy loading support
   - [ ] CDN delivery for all assets
   - [ ] Cache control headers

4. **Asset Formats & Sizes**
   - [ ] Logo: Original, 2x retina, mobile (auto-generated)
   - [ ] Favicon: 16x16, 32x32, 180x180 (Apple touch icon), ICO
   - [ ] Email header: 600px width (auto-resized)
   - [ ] Social image: 1200x630 (OpenGraph standard)
   - [ ] Automatic dimension validation
   - [ ] Aspect ratio preservation

5. **Asset Application**
   - [ ] Logo appears in header/navigation
   - [ ] Favicon in browser tab
   - [ ] Email header in all transactional emails
   - [ ] Social image in meta tags for sharing
   - [ ] Print logo in PDF receipts/tickets
   - [ ] Loading states while assets load

6. **Fallback & Defaults**
   - [ ] Default platform assets if none uploaded
   - [ ] Graceful degradation if asset fails to load
   - [ ] Alt text for accessibility
   - [ ] Placeholder images during upload

---

## Technical Requirements

### Database Schema

```prisma
// prisma/schema.prisma

model BrandAsset {
  id          String       @id @default(cuid())
  tenantId    String
  tenant      Tenant       @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  type        AssetType
  category    AssetCategory @default(BRANDING)

  originalUrl String
  optimizedUrl String?
  cdnUrl      String

  filename    String
  mimeType    String
  fileSize    Int         // bytes
  width       Int?
  height      Int?

  altText     String?
  metadata    Json?       // Additional metadata

  isActive    Boolean     @default(true)
  version     Int         @default(1)

  uploadedBy  String

  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt
  deletedAt   DateTime?

  // Version history
  previousVersionId String?
  previousVersion   BrandAsset? @relation("AssetVersions", fields: [previousVersionId], references: [id])
  nextVersions      BrandAsset[] @relation("AssetVersions")

  @@index([tenantId, type])
  @@index([tenantId, isActive])
  @@index([type])
}

enum AssetType {
  LOGO_PRIMARY
  LOGO_DARK
  LOGO_ICON
  FAVICON
  EMAIL_HEADER
  SOCIAL_IMAGE
  CUSTOM
}

enum AssetCategory {
  BRANDING
  MARKETING
  EMAIL
  SOCIAL
}
```

### Asset Upload Service

```typescript
// lib/services/brand-asset.service.ts

import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';

interface UploadOptions {
  tenantId: string;
  type: AssetType;
  file: File;
  altText?: string;
}

interface OptimizationResult {
  originalUrl: string;
  optimizedUrl: string;
  cdnUrl: string;
  variants: Record<string, string>;
}

class BrandAssetService {
  private s3: S3Client;
  private cdnBaseUrl: string;

  constructor() {
    this.s3 = new S3Client({
      region: process.env.AWS_REGION!,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    });
    this.cdnBaseUrl = process.env.CDN_BASE_URL!;
  }

  async uploadAsset(options: UploadOptions): Promise<BrandAsset> {
    const { tenantId, type, file, altText } = options;

    // Validate file
    this.validateFile(file, type);

    // Generate unique filename
    const fileId = uuidv4();
    const extension = file.name.split('.').pop();
    const filename = `${tenantId}/${type.toLowerCase()}/${fileId}.${extension}`;

    // Upload original
    const originalUrl = await this.uploadToS3(filename, await file.arrayBuffer(), file.type);

    // Optimize and generate variants
    const optimizationResult = await this.optimizeAsset(file, type, tenantId, fileId);

    // Get image dimensions
    const buffer = Buffer.from(await file.arrayBuffer());
    const metadata = await sharp(buffer).metadata();

    // Archive previous version if exists
    await this.archivePreviousVersion(tenantId, type);

    // Save to database
    const asset = await prisma.brandAsset.create({
      data: {
        tenantId,
        type,
        originalUrl,
        optimizedUrl: optimizationResult.optimizedUrl,
        cdnUrl: optimizationResult.cdnUrl,
        filename: file.name,
        mimeType: file.type,
        fileSize: file.size,
        width: metadata.width,
        height: metadata.height,
        altText,
        metadata: { variants: optimizationResult.variants },
        uploadedBy: 'current-user-id', // Get from session
      },
    });

    return asset;
  }

  private validateFile(file: File, type: AssetType): void {
    // Check file size (5MB limit)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new Error('File size exceeds 5MB limit');
    }

    // Check file type
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml'];
    if (type === 'FAVICON') {
      allowedTypes.push('image/x-icon');
    }
    if (!allowedTypes.includes(file.type)) {
      throw new Error(`Invalid file type. Allowed: ${allowedTypes.join(', ')}`);
    }

    // Validate dimensions based on type
    // This would require reading the image first
  }

  private async optimizeAsset(
    file: File,
    type: AssetType,
    tenantId: string,
    fileId: string
  ): Promise<OptimizationResult> {
    const buffer = Buffer.from(await file.arrayBuffer());
    const variants: Record<string, string> = {};

    // Generate variants based on asset type
    switch (type) {
      case 'LOGO_PRIMARY':
        variants.standard = await this.generateVariant(buffer, tenantId, fileId, 'standard', { width: 400 });
        variants.retina = await this.generateVariant(buffer, tenantId, fileId, 'retina', { width: 800 });
        variants.mobile = await this.generateVariant(buffer, tenantId, fileId, 'mobile', { width: 200 });
        break;

      case 'FAVICON':
        variants['16x16'] = await this.generateVariant(buffer, tenantId, fileId, '16x16', { width: 16, height: 16 });
        variants['32x32'] = await this.generateVariant(buffer, tenantId, fileId, '32x32', { width: 32, height: 32 });
        variants['180x180'] = await this.generateVariant(buffer, tenantId, fileId, '180x180', { width: 180, height: 180 });
        break;

      case 'EMAIL_HEADER':
        variants.email = await this.generateVariant(buffer, tenantId, fileId, 'email', { width: 600 });
        break;

      case 'SOCIAL_IMAGE':
        variants.og = await this.generateVariant(buffer, tenantId, fileId, 'og', { width: 1200, height: 630 });
        break;
    }

    // Generate WebP version for modern browsers
    const optimizedFilename = `${tenantId}/${type.toLowerCase()}/${fileId}-optimized.webp`;
    const optimizedBuffer = await sharp(buffer)
      .webp({ quality: 85 })
      .toBuffer();

    const optimizedUrl = await this.uploadToS3(optimizedFilename, optimizedBuffer, 'image/webp');

    return {
      originalUrl: `${this.cdnBaseUrl}/${tenantId}/${type.toLowerCase()}/${fileId}`,
      optimizedUrl,
      cdnUrl: optimizedUrl,
      variants,
    };
  }

  private async generateVariant(
    buffer: Buffer,
    tenantId: string,
    fileId: string,
    variantName: string,
    dimensions: { width?: number; height?: number }
  ): Promise<string> {
    const resized = await sharp(buffer)
      .resize(dimensions.width, dimensions.height, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .png({ quality: 90 })
      .toBuffer();

    const filename = `${tenantId}/variants/${fileId}-${variantName}.png`;
    return await this.uploadToS3(filename, resized, 'image/png');
  }

  private async uploadToS3(
    filename: string,
    buffer: Buffer | ArrayBuffer,
    mimeType: string
  ): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET!,
      Key: filename,
      Body: Buffer.from(buffer),
      ContentType: mimeType,
      CacheControl: 'public, max-age=31536000, immutable',
    });

    await this.s3.send(command);
    return `${this.cdnBaseUrl}/${filename}`;
  }

  private async archivePreviousVersion(tenantId: string, type: AssetType): Promise<void> {
    const currentAsset = await prisma.brandAsset.findFirst({
      where: { tenantId, type, isActive: true },
    });

    if (currentAsset) {
      await prisma.brandAsset.update({
        where: { id: currentAsset.id },
        data: { isActive: false },
      });
    }
  }

  async getAssetByType(tenantId: string, type: AssetType): Promise<BrandAsset | null> {
    return await prisma.brandAsset.findFirst({
      where: { tenantId, type, isActive: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getAllAssets(tenantId: string): Promise<BrandAsset[]> {
    return await prisma.brandAsset.findMany({
      where: { tenantId, isActive: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async deleteAsset(assetId: string): Promise<void> {
    await prisma.brandAsset.update({
      where: { id: assetId },
      data: {
        isActive: false,
        deletedAt: new Date(),
      },
    });
  }

  async getAssetVersionHistory(tenantId: string, type: AssetType): Promise<BrandAsset[]> {
    return await prisma.brandAsset.findMany({
      where: { tenantId, type },
      orderBy: { version: 'desc' },
      take: 5,
    });
  }
}

export default new BrandAssetService();
```

### Asset Delivery Helper

```typescript
// lib/utils/asset-helper.ts

interface AssetOptions {
  type: AssetType;
  variant?: string;
  fallback?: string;
}

export function getAssetUrl(tenantId: string, options: AssetOptions): string {
  const asset = getBrandAsset(tenantId, options.type);

  if (!asset) {
    return options.fallback || getDefaultAsset(options.type);
  }

  if (options.variant && asset.metadata?.variants) {
    return asset.metadata.variants[options.variant] || asset.cdnUrl;
  }

  return asset.optimizedUrl || asset.cdnUrl;
}

function getDefaultAsset(type: AssetType): string {
  const defaults = {
    LOGO_PRIMARY: '/assets/default-logo.png',
    LOGO_DARK: '/assets/default-logo-dark.png',
    LOGO_ICON: '/assets/default-icon.png',
    FAVICON: '/favicon.ico',
    EMAIL_HEADER: '/assets/default-email-header.png',
    SOCIAL_IMAGE: '/assets/default-og-image.png',
  };

  return defaults[type] || '/assets/placeholder.png';
}

// React hook for assets
export function useBrandAsset(type: AssetType, variant?: string) {
  const { tenantId } = useTenant();
  const [assetUrl, setAssetUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadAsset() {
      try {
        const url = await getAssetUrl(tenantId, { type, variant });
        setAssetUrl(url);
      } catch (error) {
        console.error('Failed to load asset:', error);
        setAssetUrl(getDefaultAsset(type));
      } finally {
        setIsLoading(false);
      }
    }

    loadAsset();
  }, [tenantId, type, variant]);

  return { assetUrl, isLoading };
}
```

---

## API Endpoints

### POST /api/admin/brand-assets
Upload new brand asset

**Request (multipart/form-data):**
```
type: LOGO_PRIMARY
file: [binary data]
altText: "Company Logo"
```

**Response:**
```json
{
  "id": "asset_abc123",
  "type": "LOGO_PRIMARY",
  "cdnUrl": "https://cdn.example.com/tenant123/logo-primary/xyz.png",
  "variants": {
    "standard": "https://cdn.example.com/tenant123/variants/xyz-standard.png",
    "retina": "https://cdn.example.com/tenant123/variants/xyz-retina.png",
    "mobile": "https://cdn.example.com/tenant123/variants/xyz-mobile.png"
  },
  "width": 400,
  "height": 100,
  "fileSize": 45678,
  "createdAt": "2025-01-15T10:30:00Z"
}
```

### GET /api/admin/brand-assets
Get all brand assets for tenant

### GET /api/admin/brand-assets/:id
Get specific asset details

### DELETE /api/admin/brand-assets/:id
Delete asset (soft delete)

### GET /api/admin/brand-assets/:type/history
Get version history for asset type

---

## UI Components

### Brand Asset Manager

```tsx
// app/dashboard/settings/brand-assets.tsx

'use client';

import { useState } from 'react';
import { Upload, Image, Trash2, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface AssetUploadProps {
  type: AssetType;
  label: string;
  description: string;
  currentAsset?: BrandAsset;
}

function AssetUploadCard({ type, label, description, currentAsset }: AssetUploadProps) {
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('type', type);
      formData.append('file', file);

      await fetch('/api/admin/brand-assets', {
        method: 'POST',
        body: formData,
      });

      // Refresh assets
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="font-semibold">{label}</h3>
          <p className="text-sm text-gray-600 mt-1">{description}</p>

          {currentAsset && (
            <div className="mt-4">
              <img
                src={currentAsset.cdnUrl}
                alt={currentAsset.altText || label}
                className="max-w-xs border rounded"
              />
              <div className="text-xs text-gray-500 mt-2">
                {currentAsset.width} × {currentAsset.height} • {(currentAsset.fileSize / 1024).toFixed(1)}KB
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <label>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleUpload(file);
              }}
              disabled={uploading}
            />
            <Button variant="outline" size="sm" disabled={uploading}>
              <Upload className="w-4 h-4 mr-2" />
              {currentAsset ? 'Replace' : 'Upload'}
            </Button>
          </label>

          {currentAsset && (
            <>
              <Button variant="ghost" size="sm">
                <Download className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm">
                <Trash2 className="w-4 h-4 text-red-500" />
              </Button>
            </>
          )}
        </div>
      </div>
    </Card>
  );
}

export default function BrandAssetManager() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Brand Assets</h2>
        <p className="text-gray-600">Upload and manage your brand assets</p>
      </div>

      <div className="space-y-4">
        <AssetUploadCard
          type="LOGO_PRIMARY"
          label="Primary Logo"
          description="Main logo for light backgrounds (PNG or SVG, max 5MB)"
        />
        <AssetUploadCard
          type="LOGO_DARK"
          label="Dark Mode Logo"
          description="Logo variant for dark backgrounds"
        />
        <AssetUploadCard
          type="FAVICON"
          label="Favicon"
          description="Browser tab icon (ICO or PNG, 32x32px minimum)"
        />
        <AssetUploadCard
          type="EMAIL_HEADER"
          label="Email Header"
          description="Logo for transactional emails (600px width)"
        />
        <AssetUploadCard
          type="SOCIAL_IMAGE"
          label="Social Sharing Image"
          description="Image for social media previews (1200x630px)"
        />
      </div>
    </div>
  );
}
```

---

## Testing Requirements

### Unit Tests
- Image optimization logic
- Variant generation
- File validation
- S3 upload mocking

### Integration Tests
- Full upload flow
- Asset retrieval
- Version history
- Fallback behavior

### Visual Tests
- Asset display in header
- Email rendering
- Social previews
- Responsive behavior

---

## Security Considerations

1. **File Upload Security**
   - Validate file types strictly
   - Scan for malware
   - Size limits enforced
   - Sanitize filenames

2. **Storage Security**
   - S3 bucket permissions (private)
   - CDN delivery only
   - Signed URLs for private assets
   - No direct S3 access

3. **Access Control**
   - Only tenant admins can upload
   - Assets scoped to tenant
   - No cross-tenant access

---

## Dependencies

- **AWS S3** or **Vercel Blob Storage**
- **Sharp**: Image processing
- **CDN**: CloudFront or Vercel CDN
- **File upload library**: react-dropzone

---

## Success Metrics

- Asset upload success rate > 99%
- Average upload time < 10 seconds
- CDN cache hit rate > 95%
- Zero security incidents
- Customer satisfaction > 4.5/5

---

## Notes

- Consider automatic background removal for logos
- Add asset usage analytics
- Implement asset approval workflow for enterprise
- Consider image AI optimization suggestions