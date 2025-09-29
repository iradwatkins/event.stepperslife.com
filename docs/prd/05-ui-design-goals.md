# SteppersLife Events and Tickets System
## User Interface Design Goals
### Version 1.0

---

## Design System & Theme

- **Color System**: OKLCH color space with custom theme variables
- **Component Library**: shadcn/ui with tailored theme configuration
- **CSS Framework**: Tailwind CSS v4 with OKLCH support
- **Theme Support**: Full light/dark mode with system preference detection
- **Border Radius**: 1.3rem for consistent rounded corners
- **Typography**: Open Sans (sans-serif), Georgia (serif), Menlo (monospace)

## Theme Colors (OKLCH)

### Primary Brand
- Light Mode: `oklch(0.6723 0.1606 244.9955)` (Blue)
- Dark Mode: `oklch(0.6692 0.1607 245.0110)` (Blue)

### System Colors
- **Background**: Pure white/black for maximum contrast
- **Cards**: Subtle off-white/dark gray for depth
- **Destructive**: `oklch(0.6188 0.2376 25.7658)` for errors
- **Success**: Green shades for confirmations
- **Warning**: Amber for cautions

## Key UI Components

### Organizer Dashboard
- Real-time sales ticker with animation
- Revenue cards with trend indicators
- Interactive charts using provided chart colors
- Quick action buttons for common tasks
- Event calendar view with heat map overlay

### Event Creation Wizard
- Step-by-step progress indicator
- Auto-save with visual confirmation
- Live preview of event page
- Inline validation with helpful error messages
- Contextual help tooltips

### Ticket Purchase Flow
- Single-column checkout on mobile
- Clear pricing breakdown before payment
- Square payment form embedded securely
- Progress indicator showing checkout steps
- Trust badges and security indicators

### Mobile Check-in App (PWA)
- Large scan button (minimum 44x44px touch target)
- Full-screen QR scanner interface
- Offline mode indicator badge
- Clear success/failure animations
- Quick stats dashboard for event staff

## Responsive Breakpoints
- **Mobile**: 320px - 640px (primary focus)
- **Tablet**: 640px - 1024px
- **Desktop**: 1024px - 1280px
- **Wide**: 1280px+

## UI Development Stack
- **Testing**: Puppeteer for automated E2E testing
- **DevTools**: Chrome DevTools integration for debugging
- **Design Bridge**: Drawbridge for design-to-code workflow
- **Component Server**: shadcn-ui-mcp-server for rapid development

---

*Part of the complete PRD - See [Main PRD](../business/product-requirements.md)*