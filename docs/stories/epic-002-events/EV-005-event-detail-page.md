# EV-005: Event Detail Page for Attendees

**Epic**: EPIC-002: Event Management Core
**Story Points**: 3
**Priority**: High
**Status**: Ready for Development
**Sprint**: TBD

---

## User Story

**As an** event attendee
**I want to** view comprehensive event information on a dedicated detail page
**So that** I can make an informed decision about purchasing tickets and attending the event

---

## Business Value

- **User Value**: Provides all necessary information for purchase decisions, reducing friction in the conversion funnel
- **Business Value**: Professional event presentation increases ticket sales and brand trust
- **Impact**: Critical for conversion rate - estimated 40% of traffic lands on event detail pages
- **Revenue Impact**: Direct correlation to ticket sales - high-quality detail pages improve conversion by 25-35%

---

## INVEST Criteria

- **Independent**: Can be developed independently, depends only on Event model and public API
- **Negotiable**: Design elements and layout can be adjusted based on feedback
- **Valuable**: Directly enables ticket discovery and purchase
- **Estimable**: Clear scope with well-defined requirements
- **Small**: Can be completed within one sprint
- **Testable**: Clear acceptance criteria with measurable outcomes

---

## Acceptance Criteria

### AC1: Event Information Display
**Given** I am an unauthenticated user
**When** I navigate to `/events/[eventId]`
**Then** I should see:
- Event title and subtitle
- Full event description (rich text/markdown)
- Event date and time with timezone
- Venue name and full address
- Event category/type
- Organizer name and contact information
- Event status badge (upcoming/sold out/cancelled)

### AC2: Ticket Information Display
**Given** I am viewing an event detail page
**When** the page loads
**Then** I should see:
- All available ticket types with names and descriptions
- Price for each ticket type
- Remaining quantity for each ticket type
- "Sold Out" indicator when tickets are unavailable
- Clear call-to-action button to purchase tickets
- Total capacity and tickets sold counter

### AC3: Visual Content Display
**Given** the event has uploaded images
**When** I view the event detail page
**Then** I should see:
- Hero image or primary event image
- Image gallery (if multiple images exist)
- Responsive images optimized for device size
- Alt text for accessibility
- Fallback placeholder if no image exists

### AC4: Social Sharing Capabilities
**Given** I want to share an event with others
**When** I view the event detail page
**Then** I should see:
- Share buttons for social media (Facebook, Twitter, LinkedIn)
- Copy link button with success feedback
- Properly configured Open Graph meta tags
- Twitter Card meta tags
- WhatsApp share option on mobile

### AC5: Calendar Integration
**Given** I want to add the event to my calendar
**When** I click the "Add to Calendar" button
**Then** I should be able to:
- Download .ics file for calendar apps
- Choose between Google Calendar, Apple Calendar, Outlook
- File includes event title, description, location, time

### AC6: SEO Optimization
**Given** search engines crawl the event page
**When** they index the content
**Then** the page should include:
- Semantic HTML structure with proper heading hierarchy
- Meta title with event name and date
- Meta description with event summary
- Schema.org Event markup (JSON-LD)
- Canonical URL
- Proper image alt attributes

### AC7: Server-Side Rendering
**Given** I access an event detail page URL
**When** the page loads
**Then**:
- Content is rendered server-side for optimal performance
- Initial page load includes all critical event data
- Time to First Contentful Paint < 1.5s
- No layout shift during hydration

### AC8: Error Handling
**Given** I navigate to an invalid or non-existent event
**When** the page attempts to load
**Then** I should see:
- 404 error page with helpful messaging
- Suggestions for similar events
- Link back to events listing page

### AC9: Mobile Responsiveness
**Given** I access the page on a mobile device
**When** the page renders
**Then**:
- Layout adapts to screen size appropriately
- Images are optimized for mobile bandwidth
- Touch targets are minimum 44x44px
- Ticket purchase button is prominently accessible

### AC10: Performance Requirements
**Given** the event detail page loads
**When** measured with Lighthouse
**Then**:
- Performance score > 90
- Accessibility score > 95
- SEO score > 95
- Best Practices score > 90

---

## Technical Implementation Tasks

### Task 1: Create Event Detail Page Component
- [ ] Create `app/events/[eventId]/page.tsx` route
- [ ] Implement server component with SSR
- [ ] Add loading state (`loading.tsx`)
- [ ] Add error boundary (`error.tsx`)
- [ ] Add not-found handler (`not-found.tsx`)

### Task 2: Implement Data Fetching
- [ ] Create server-side data fetching function
- [ ] Fetch event data with Prisma including relations (organizer, venue, tickets)
- [ ] Add revalidation strategy (ISR with 60s revalidate)
- [ ] Handle event not found scenario
- [ ] Handle draft/unpublished events (403 access control)

### Task 3: Design Event Detail Layout
- [ ] Create responsive layout component
- [ ] Implement hero section with image
- [ ] Design event information section
- [ ] Create ticket types display grid
- [ ] Add organizer information card
- [ ] Implement venue/location section with map embed option

### Task 4: Add Social Sharing Features
- [ ] Create ShareButton component with multiple platforms
- [ ] Add copy-to-clipboard functionality
- [ ] Implement Open Graph meta tags generator
- [ ] Add Twitter Card meta tags
- [ ] Configure dynamic og:image generation

### Task 5: Implement Calendar Export
- [ ] Create calendar export utility function
- [ ] Generate .ics file format
- [ ] Add Google Calendar deep link
- [ ] Add Apple Calendar support
- [ ] Add Outlook calendar support

### Task 6: Add SEO Optimization
- [ ] Generate dynamic metadata function
- [ ] Implement JSON-LD schema for Event
- [ ] Add breadcrumb navigation
- [ ] Configure canonical URLs
- [ ] Add structured data testing

### Task 7: Implement Image Handling
- [ ] Use Next.js Image component for optimization
- [ ] Configure image loader and domains
- [ ] Add responsive image sizes
- [ ] Implement lazy loading for gallery
- [ ] Add fallback placeholder images

### Task 8: Add CTA and Purchase Flow Integration
- [ ] Create prominent "Buy Tickets" button
- [ ] Link to purchase flow with event context
- [ ] Show ticket availability status
- [ ] Add "Sold Out" state handling
- [ ] Implement "Event Ended" state

### Task 9: Testing
- [ ] Unit tests for data fetching functions
- [ ] Component tests for all UI elements
- [ ] E2E tests for page navigation and interactions
- [ ] Lighthouse performance audit
- [ ] Accessibility testing with axe-core
- [ ] Mobile responsive testing
- [ ] Social sharing validation

### Task 10: Documentation
- [ ] Document component API
- [ ] Add code comments for complex logic
- [ ] Update API documentation
- [ ] Create user-facing help content

---

## Dependencies

### Required Before Starting
- ✅ Event model in Prisma schema (completed)
- ✅ Public events API endpoint (completed)
- ⏳ Image upload infrastructure (EV-007)
- ⏳ Next.js Image optimization configured

### Blocks
- None - can proceed independently

### Related Stories
- EV-001: Event creation form (provides data)
- EV-007: Event image upload (provides images)
- PAY-001: Ticket purchase flow (receives traffic from CTA)
- EV-006: Event search and filtering (provides navigation)

---

## Technical Specifications

### Route Structure
```
app/
  events/
    [eventId]/
      page.tsx        # Main detail page (Server Component)
      loading.tsx     # Loading skeleton
      error.tsx       # Error boundary
      not-found.tsx   # 404 handler
```

### Data Fetching Pattern
```typescript
// Server-side data fetching with Prisma
async function getEvent(eventId: string) {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      organizer: true,
      venue: true,
      tickets: {
        where: { isActive: true }
      }
    }
  });

  if (!event || event.status === 'DRAFT') {
    notFound();
  }

  return event;
}
```

### Metadata Generation
```typescript
export async function generateMetadata({ params }): Promise<Metadata> {
  const event = await getEvent(params.eventId);

  return {
    title: `${event.title} - ${formatDate(event.startDate)}`,
    description: truncate(event.description, 160),
    openGraph: {
      title: event.title,
      description: event.description,
      images: [event.imageUrl],
      type: 'website'
    }
  };
}
```

### Schema.org JSON-LD
```json
{
  "@context": "https://schema.org",
  "@type": "Event",
  "name": "Event Title",
  "startDate": "2025-10-15T19:00:00-07:00",
  "endDate": "2025-10-15T23:00:00-07:00",
  "location": {
    "@type": "Place",
    "name": "Venue Name",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "123 Main St",
      "addressLocality": "City",
      "addressRegion": "State",
      "postalCode": "12345"
    }
  },
  "offers": {
    "@type": "Offer",
    "url": "https://events.stepperslife.com/events/123",
    "price": "25.00",
    "priceCurrency": "USD",
    "availability": "https://schema.org/InStock"
  }
}
```

---

## Edge Cases & Error Scenarios

1. **Event Not Found**: Display 404 page with suggestions
2. **Draft Event Access**: Return 403 unless user is organizer
3. **Cancelled Event**: Show cancellation banner and disable ticket purchase
4. **Sold Out Event**: Display sold out status, disable purchase button
5. **Past Event**: Show "Event Ended" status, disable purchases
6. **No Images**: Display placeholder image with event category icon
7. **Missing Venue**: Show "Online Event" or "Location TBA"
8. **Invalid Date/Time**: Handle timezone edge cases gracefully
9. **Network Errors**: Show retry mechanism for failed data fetching
10. **Slow Image Loading**: Use blur placeholder and lazy loading

---

## Definition of Done

- [ ] All acceptance criteria are met and verified
- [ ] Code is written following Next.js 14+ best practices
- [ ] Server-side rendering is properly implemented
- [ ] All metadata and SEO tags are correctly generated
- [ ] Unit tests written with >80% coverage
- [ ] Component tests cover all user interactions
- [ ] E2E test validates full page load and navigation
- [ ] Lighthouse scores meet performance requirements (>90)
- [ ] Accessibility audit passes WCAG 2.1 AA standards
- [ ] Mobile responsive design tested on iOS and Android
- [ ] Social sharing validated on major platforms
- [ ] Calendar export tested with Google, Apple, Outlook
- [ ] Code reviewed and approved by tech lead
- [ ] Documentation updated (component API, technical specs)
- [ ] Deployed to staging and validated
- [ ] Product owner approval obtained

---

## Testing Strategy

### Unit Tests
- Data fetching functions
- Utility functions (date formatting, truncation)
- Calendar export generation
- Schema.org markup generation

### Component Tests
- Event detail component rendering
- Ticket type display logic
- Social share buttons
- Calendar export buttons
- Error states

### Integration Tests
- Full page rendering with real data
- Navigation from events list
- CTA to purchase flow
- Social sharing integration

### E2E Tests
- Navigate to event detail page
- Verify all content displays correctly
- Click purchase button and reach checkout
- Test social sharing buttons
- Download calendar file

### Performance Tests
- Lighthouse audit (automated in CI)
- WebPageTest analysis
- Image optimization validation
- Time to Interactive measurement

---

## Notes & Considerations

- Consider implementing progressive image loading for hero images
- May need to add "Report Event" functionality in future iteration
- Consider adding "Similar Events" recommendation section
- Evaluate need for event FAQ or Q&A section
- Consider adding event updates/announcements section
- Monitor analytics to optimize conversion funnel from detail page to purchase

---

**Created**: 2025-09-30
**Last Updated**: 2025-09-30
**Estimated Effort**: 16-20 hours
**Assigned To**: TBD