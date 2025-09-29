# Story: US-004 - User Profile Management

**Epic**: EPIC-001 - User Authentication & Management
**Story Points**: 2
**Priority**: P1 (High)
**Status**: Draft
**Dependencies**: US-002 (User Login), Image storage solution

---

## Story

**As a** registered user
**I want to** manage my profile information
**So that** my account details are current and personalized

---

## Acceptance Criteria

1. GIVEN I am logged in
   WHEN I access my profile page
   THEN I should see my current profile information:
   - Name (first and last)
   - Email address (read-only)
   - Profile picture placeholder
   - Account creation date
   - Account type (organizer/attendee)
   - Notification preferences

2. GIVEN I update my profile information
   WHEN I make changes and click "Save"
   THEN changes should be saved successfully
   AND I should see confirmation message "Profile updated"
   AND updated information should display immediately

3. GIVEN I upload a profile picture
   WHEN I select an image file (<5MB, JPG/PNG)
   THEN image should be uploaded and resized
   AND appear as my profile avatar
   AND be visible in header navigation

4. GIVEN I try to upload invalid file type
   WHEN I select the file
   THEN I should see error "Please select JPG or PNG image"
   AND upload should be prevented

5. GIVEN I want to change my password
   WHEN I click "Change Password"
   THEN I should see password change form requiring:
   - Current password
   - New password (with strength indicator)
   - Confirm new password
   AND successful change should log me out of other sessions

---

## Tasks / Subtasks

- [ ] Create user profile API endpoints (AC: 1, 2)
  - [ ] Create GET /api/user/profile endpoint
  - [ ] Create PATCH /api/user/profile endpoint
  - [ ] Add profile validation

- [ ] Design profile management UI (AC: 1, 2)
  - [ ] Create profile page component
  - [ ] Add profile form with validation
  - [ ] Implement edit mode toggle

- [ ] Add image upload functionality (AC: 3, 4)
  - [ ] Create image upload component
  - [ ] Add file type validation
  - [ ] Implement file size checking

- [ ] Implement image resizing/optimization (AC: 3)
  - [ ] Install Sharp or similar library
  - [ ] Create image processing utility
  - [ ] Generate multiple sizes (thumbnail, avatar)

- [ ] Create profile update validation (AC: 2)
  - [ ] Validate name fields
  - [ ] Sanitize input data
  - [ ] Prevent XSS attacks

- [ ] Add notification preferences (AC: 1)
  - [ ] Create preferences data model
  - [ ] Build preferences UI
  - [ ] Save preference choices

- [ ] Implement password change flow (AC: 5)
  - [ ] Create password change form
  - [ ] Verify current password
  - [ ] Update password and invalidate sessions

- [ ] Create profile picture storage (AC: 3)
  - [ ] Set up cloud storage (S3 or similar)
  - [ ] Generate secure upload URLs
  - [ ] Store image URLs in database

- [ ] Add form validation and error handling (AC: 2, 4)
  - [ ] Client-side validation with Zod
  - [ ] Server-side validation
  - [ ] Display error messages

- [ ] Implement optimistic UI updates (AC: 2)
  - [ ] Update UI before server response
  - [ ] Revert on error
  - [ ] Show loading states

---

## Dev Notes

### Architecture References

**User Profile** (`docs/architecture/system-overview.md`):
- User profile stored in PostgreSQL
- Profile images stored in cloud storage (S3-compatible)
- Image CDN for fast delivery
- Multiple image sizes for different use cases

**Image Processing** (`docs/architecture/system-overview.md`):
- Maximum file size: 5MB
- Supported formats: JPG, PNG
- Generated sizes: 32x32 (thumbnail), 128x128 (avatar), 512x512 (profile)
- WebP format for modern browsers

**Source Tree** (`docs/architecture/source-tree.md`):
```
src/
├── app/
│   ├── api/
│   │   └── user/
│   │       ├── profile/route.ts
│   │       └── avatar/route.ts
│   └── profile/page.tsx
├── components/
│   └── profile/
│       ├── ProfileForm.tsx
│       ├── AvatarUpload.tsx
│       └── PasswordChange.tsx
├── lib/
│   ├── image-processing.ts
│   └── storage.ts
```

### Testing

**Testing Requirements for this story**:
- Unit tests for profile validation
- Unit tests for image processing
- Integration test for profile update API
- Integration test for avatar upload API
- E2E test for profile editing flow
- E2E test for avatar upload flow
- E2E test for password change flow
- Test file type validation
- Test file size limits
- Test optimistic UI updates

---

## Change Log

| Date | Version | Description | Author |
|------|---------|-------------|---------|
| 2024-01-15 | 1.0 | Initial story creation | SM Agent |

---

## Dev Agent Record

### Agent Model Used
*To be populated by dev agent*

### Debug Log References
*To be populated by dev agent*

### Completion Notes List
*To be populated by dev agent*

### File List
*To be populated by dev agent*

---

## QA Results
*To be populated by QA agent*