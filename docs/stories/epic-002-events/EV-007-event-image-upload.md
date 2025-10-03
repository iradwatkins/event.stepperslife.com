# EV-007: Event Image Upload

**Epic**: EPIC-002: Event Management Core
**Story Points**: 2
**Priority**: Medium
**Status**: Ready for Development
**Sprint**: TBD

---

## User Story

**As an** event organizer
**I want to** upload promotional images for my events
**So that** attendees can see visually appealing event photos that attract them to purchase tickets

---

## Business Value

- **User Value**: Professional event images increase trust and interest, making events more discoverable and appealing
- **Business Value**: Events with images have 3x higher conversion rates than those without
- **Impact**: Visual content is critical for social sharing and event promotion
- **Revenue Impact**: High-quality event images directly correlate to ticket sales increase of 40-60%

---

## INVEST Criteria

- **Independent**: Can be developed independently with standard file upload patterns
- **Negotiable**: Storage solution and image specifications can be adjusted
- **Valuable**: Essential for professional event presentation
- **Estimable**: Clear scope with well-defined file upload requirements
- **Small**: Can be completed within one sprint
- **Testable**: Clear acceptance criteria with measurable upload success metrics

---

## Acceptance Criteria

### AC1: Image Upload Interface
**Given** I am creating or editing an event
**When** I access the image upload section
**Then** I should see:
- Clear "Upload Image" or "Add Image" button
- Drag-and-drop zone for image files
- File input that accepts image files only
- Preview of currently uploaded image (if exists)
- Option to remove/replace existing image
- Upload progress indicator

### AC2: Image Format Validation
**Given** I attempt to upload a file
**When** the file is selected
**Then** the system should:
- Accept only image formats: JPG, JPEG, PNG, WebP, GIF
- Reject non-image files with clear error message
- Display rejected file name and reason
- Allow user to select a different file

### AC3: Image Size Validation
**Given** I upload an image file
**When** the file is validated
**Then** the system should:
- Accept files up to 10MB in size
- Reject files larger than 10MB with clear error message
- Display current file size and maximum allowed size
- Suggest image compression tools or techniques

### AC4: Image Dimension Requirements
**Given** I upload an image
**When** the image is processed
**Then** the system should:
- Accept images with minimum dimensions of 800x600 pixels
- Warn if image is below recommended dimensions (1200x630 for social sharing)
- Accept aspect ratios between 16:9 and 4:3
- Display image dimensions after upload

### AC5: Image Processing and Optimization
**Given** I successfully upload an image
**When** the image is stored
**Then** the system should:
- Automatically compress image to optimize file size
- Generate multiple sizes (thumbnail, medium, large, original)
- Convert to WebP format for modern browsers (with fallback)
- Maintain reasonable quality (85% compression)
- Store processed images in CDN or cloud storage

### AC6: Image Preview and Confirmation
**Given** I have uploaded an image
**When** the upload completes
**Then** I should see:
- Immediate preview of the uploaded image
- Confirmation message "Image uploaded successfully"
- Option to replace or remove the image
- Image appears in event preview/detail view

### AC7: Multiple Image Support (Future - Gallery)
**Given** I want to add multiple event images
**When** I upload additional images
**Then** I should be able to:
- Upload up to 5 images per event
- Set one image as the primary/hero image
- Reorder images via drag-and-drop
- Delete individual images from gallery
- See all images in management interface

### AC8: Error Handling
**Given** an error occurs during upload
**When** the upload fails
**Then** I should see:
- Clear error message explaining what went wrong
- Retry option to attempt upload again
- No partial data saved (atomic operation)
- Option to continue editing event without image

### AC9: Accessibility
**Given** I use assistive technology
**When** I interact with image upload
**Then**:
- Upload button is keyboard accessible
- Screen reader announces upload status
- Error messages are announced to screen readers
- Alt text input field is available for uploaded images
- Focus management during upload process

### AC10: Performance Requirements
**Given** I upload an image
**When** the upload and processing occurs
**Then**:
- Upload progress is visible and accurate
- Processing completes in < 5 seconds for typical images (< 5MB)
- No UI blocking during upload/processing
- Upload can be cancelled mid-process
- Uploaded images are immediately available in preview

---

## Technical Implementation Tasks

### Task 1: Choose Storage Solution
- [ ] Evaluate storage options (AWS S3, Cloudinary, Vercel Blob, local storage)
- [ ] Configure selected storage service
- [ ] Set up CDN for image delivery
- [ ] Configure access permissions and security
- [ ] Set up environment variables for storage credentials

### Task 2: Create Image Upload Component
- [ ] Create ImageUpload client component
- [ ] Implement drag-and-drop functionality
- [ ] Add file input with accept attribute
- [ ] Create upload progress bar component
- [ ] Add image preview component
- [ ] Implement remove/replace image functionality

### Task 3: Implement File Validation
- [ ] Create file type validation (client-side)
- [ ] Create file size validation (client-side and server-side)
- [ ] Create image dimension validation
- [ ] Add validation error display
- [ ] Create validation utility functions

### Task 4: Build Upload API Endpoint
- [ ] Create POST `/api/events/upload-image` endpoint
- [ ] Implement multipart/form-data handling
- [ ] Add server-side validation (type, size, dimensions)
- [ ] Implement upload to storage service
- [ ] Return image URLs and metadata

### Task 5: Implement Image Processing
- [ ] Install image processing library (Sharp or similar)
- [ ] Create image compression function
- [ ] Generate multiple image sizes (thumbnail: 300x200, medium: 800x600, large: 1200x800)
- [ ] Implement WebP conversion with fallback
- [ ] Optimize image quality settings

### Task 6: Database Integration
- [ ] Update Event model to include image fields (imageUrl, thumbnailUrl, imageMetadata)
- [ ] Create migration for image fields
- [ ] Update event creation/editing mutations to handle images
- [ ] Store image metadata (size, dimensions, format)

### Task 7: Integrate Upload with Event Forms
- [ ] Add ImageUpload component to event creation form
- [ ] Add ImageUpload component to event editing form
- [ ] Handle image state in form
- [ ] Validate image before form submission
- [ ] Show uploaded image in form preview

### Task 8: Implement Image Deletion
- [ ] Create DELETE endpoint for removing images
- [ ] Delete images from storage service
- [ ] Update database to remove image references
- [ ] Handle orphaned images (images not linked to events)
- [ ] Implement cleanup job for unused images

### Task 9: Testing
- [ ] Unit tests for validation functions
- [ ] Unit tests for image processing utilities
- [ ] Component tests for ImageUpload component
- [ ] Integration tests for upload API endpoint
- [ ] E2E tests for full upload workflow
- [ ] Test various file types and sizes
- [ ] Test error scenarios (network failure, large files, invalid formats)
- [ ] Performance testing for image processing

### Task 10: Documentation
- [ ] Document image requirements for users
- [ ] Document API endpoint specifications
- [ ] Add code comments for image processing logic
- [ ] Create troubleshooting guide for common upload issues

---

## Dependencies

### Required Before Starting
- ✅ Event model in Prisma schema
- ✅ Event creation/editing forms (EV-001)
- ⏳ Cloud storage service account and configuration
- ⏳ Image processing library installed

### Blocks
- None - can proceed with storage solution selection

### Related Stories
- EV-001: Event creation form (receives image upload component)
- EV-002: Event editing form (receives image upload component)
- EV-005: Event detail page (displays uploaded images)

---

## Technical Specifications

### Storage Solution Options

#### Option 1: Vercel Blob (Recommended)
```typescript
import { put } from '@vercel/blob';

const blob = await put(file.name, file, {
  access: 'public',
  token: process.env.BLOB_READ_WRITE_TOKEN
});
// Returns: { url: 'https://...', pathname: '...' }
```

**Pros**: Native Vercel integration, simple API, automatic CDN
**Cons**: Pricing based on storage and bandwidth

#### Option 2: AWS S3
```typescript
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const s3Client = new S3Client({ region: 'us-east-1' });
await s3Client.send(new PutObjectCommand({
  Bucket: 'events-stepperslife',
  Key: filename,
  Body: buffer,
  ContentType: file.type
}));
```

**Pros**: Industry standard, scalable, cost-effective at scale
**Cons**: More complex setup, requires CloudFront for CDN

#### Option 3: Cloudinary
```typescript
import { v2 as cloudinary } from 'cloudinary';

const result = await cloudinary.uploader.upload(file.path, {
  folder: 'events',
  transformation: [
    { width: 1200, height: 800, crop: 'limit' }
  ]
});
```

**Pros**: Built-in image processing, transformations, CDN included
**Cons**: Higher cost, vendor lock-in

### Image Processing with Sharp
```typescript
import sharp from 'sharp';

async function processImage(buffer: Buffer) {
  // Original optimized
  const original = await sharp(buffer)
    .jpeg({ quality: 85 })
    .toBuffer();

  // Large (1200x800)
  const large = await sharp(buffer)
    .resize(1200, 800, { fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 85 })
    .toBuffer();

  // Medium (800x600)
  const medium = await sharp(buffer)
    .resize(800, 600, { fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 85 })
    .toBuffer();

  // Thumbnail (300x200)
  const thumbnail = await sharp(buffer)
    .resize(300, 200, { fit: 'cover' })
    .jpeg({ quality: 80 })
    .toBuffer();

  // WebP versions
  const webpLarge = await sharp(buffer)
    .resize(1200, 800, { fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 85 })
    .toBuffer();

  return { original, large, medium, thumbnail, webpLarge };
}
```

### Upload API Endpoint
```typescript
// app/api/events/upload-image/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { put } from '@vercel/blob';
import sharp from 'sharp';

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get('file') as File;

  // Validation
  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  }

  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
  if (!validTypes.includes(file.type)) {
    return NextResponse.json({ error: 'Invalid file type' }, { status: 400 });
  }

  if (file.size > 10 * 1024 * 1024) { // 10MB
    return NextResponse.json({ error: 'File too large (max 10MB)' }, { status: 400 });
  }

  // Process image
  const buffer = Buffer.from(await file.arrayBuffer());
  const metadata = await sharp(buffer).metadata();

  if (!metadata.width || !metadata.height) {
    return NextResponse.json({ error: 'Invalid image' }, { status: 400 });
  }

  if (metadata.width < 800 || metadata.height < 600) {
    return NextResponse.json({
      error: 'Image too small (minimum 800x600)'
    }, { status: 400 });
  }

  // Process and upload
  const processed = await processImage(buffer);
  const timestamp = Date.now();
  const userId = session.user.id;

  const [originalBlob, largeBlob, mediumBlob, thumbnailBlob] = await Promise.all([
    put(`events/${userId}/${timestamp}-original.jpg`, processed.original, { access: 'public' }),
    put(`events/${userId}/${timestamp}-large.jpg`, processed.large, { access: 'public' }),
    put(`events/${userId}/${timestamp}-medium.jpg`, processed.medium, { access: 'public' }),
    put(`events/${userId}/${timestamp}-thumbnail.jpg`, processed.thumbnail, { access: 'public' })
  ]);

  return NextResponse.json({
    success: true,
    urls: {
      original: originalBlob.url,
      large: largeBlob.url,
      medium: mediumBlob.url,
      thumbnail: thumbnailBlob.url
    },
    metadata: {
      width: metadata.width,
      height: metadata.height,
      format: metadata.format,
      size: file.size
    }
  });
}
```

### Database Schema Update
```prisma
model Event {
  id          String   @id @default(cuid())
  title       String
  // ... other fields ...

  // Image fields
  imageUrl        String?  // Large image URL
  thumbnailUrl    String?  // Thumbnail URL
  imageMetadata   Json?    // { width, height, format, size }

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

### ImageUpload Component Interface
```typescript
interface ImageUploadProps {
  value?: string; // Current image URL
  onChange: (urls: ImageUrls) => void;
  onError?: (error: string) => void;
  maxSize?: number; // in bytes, default 10MB
  acceptedFormats?: string[]; // default ['image/jpeg', 'image/png', 'image/webp']
  required?: boolean;
}

interface ImageUrls {
  original: string;
  large: string;
  medium: string;
  thumbnail: string;
}
```

---

## Edge Cases & Error Scenarios

1. **Network Interruption During Upload**: Implement retry mechanism and show clear error
2. **Very Large Images (> 10MB)**: Reject with helpful message and compression suggestions
3. **Corrupted Image Files**: Validate file integrity, show error if file can't be processed
4. **Unsupported Formats**: Clear error message listing supported formats
5. **Image Too Small**: Warn user but allow upload (don't block)
6. **Storage Quota Exceeded**: Graceful error handling with notification to admin
7. **Duplicate Uploads**: Prevent duplicate uploads of same file (use hash)
8. **Browser Compatibility**: Ensure drag-and-drop works across browsers
9. **Mobile Image Upload**: Handle camera photos and orientation issues (EXIF data)
10. **Concurrent Uploads**: Handle multiple simultaneous uploads properly
11. **Upload Cancellation**: Allow user to cancel in-progress upload
12. **Lost Connection**: Queue uploads and retry when connection restored

---

## Definition of Done

- [ ] All acceptance criteria are met and verified
- [ ] Storage solution configured and operational
- [ ] ImageUpload component created and integrated
- [ ] File validation implemented (type, size, dimensions)
- [ ] Image processing and optimization working
- [ ] Multiple image sizes generated automatically
- [ ] Upload API endpoint implemented and secured
- [ ] Database schema updated for image storage
- [ ] Image upload integrated into event creation form
- [ ] Image upload integrated into event editing form
- [ ] Image deletion functionality implemented
- [ ] Unit tests written with >80% coverage
- [ ] Component tests for ImageUpload component
- [ ] Integration tests for upload API
- [ ] E2E tests for full upload workflow
- [ ] Error handling tested for all scenarios
- [ ] Performance validated (upload + processing < 5s)
- [ ] Accessibility audit passes WCAG 2.1 AA standards
- [ ] Mobile upload tested on iOS and Android
- [ ] Code reviewed and approved by tech lead
- [ ] Documentation completed (user guide, API docs)
- [ ] Deployed to staging and validated
- [ ] Product owner approval obtained

---

## Testing Strategy

### Unit Tests
- File validation functions (type, size, dimensions)
- Image processing utilities
- URL generation functions
- Metadata extraction

### Component Tests
- ImageUpload component rendering
- File selection and validation
- Drag-and-drop functionality
- Upload progress display
- Error message display
- Preview functionality

### Integration Tests
- Upload API endpoint with valid files
- Upload API endpoint with invalid files
- Storage service integration
- Database persistence of image URLs

### E2E Tests
- Complete upload workflow from form
- Upload image during event creation
- Replace image during event editing
- Delete uploaded image
- Upload multiple images (if gallery implemented)
- Mobile camera upload

### Performance Tests
- Upload speed for various file sizes
- Image processing time
- Concurrent upload handling
- CDN delivery speed

---

## Notes & Considerations

### Security Considerations
- Implement rate limiting on upload endpoint
- Validate file content (not just extension) to prevent malicious uploads
- Sanitize filenames to prevent directory traversal attacks
- Implement virus scanning for uploaded files (ClamAV integration)
- Use signed URLs for upload operations
- Implement CORS properly for cross-origin uploads

### Future Enhancements
- Image cropping/editing tool in UI
- AI-powered image tagging and alt text generation
- Image library/gallery for reusing images across events
- Bulk image upload
- Integration with Unsplash or other stock photo services
- Image analytics (views, click-through rates)
- Automatic background removal for certain image types

### Cost Optimization
- Implement image compression more aggressively
- Set up lifecycle policies to delete old unused images
- Use CDN caching effectively
- Consider image delivery optimization (lazy loading, responsive images)

### Monitoring
- Track upload success/failure rates
- Monitor storage usage and costs
- Alert on quota approaching limits
- Track average image processing time
- Monitor CDN performance and costs

---

**Created**: 2025-09-30
**Last Updated**: 2025-09-30
**Estimated Effort**: 12-16 hours
**Assigned To**: TBD