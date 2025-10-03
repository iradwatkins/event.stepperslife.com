# Theme Customization Admin Panel - User Guide

## Overview

The Theme Customization Admin Panel is a comprehensive visual theme editor that allows you to customize your website's color themes for both light and dark modes. Built with React/Next.js, it features a modern interface with live preview functionality and OKLCH color space support.

## Access

**URL**: `/admin/theme`

**Required Role**: `SUPER_ADMIN`

Only users with the SUPER_ADMIN role can access the theme editor for security reasons.

## Features

### 1. **Visual Theme Editor**
- Clean, modern interface matching Figma design aesthetic
- Sidebar navigation with organized color sections
- Live preview showing changes in real-time
- Support for both light and dark theme customization

### 2. **Color Management**

#### Color Sections
The theme editor organizes colors into logical groups:

- **Primary Colors**: Background, Foreground, Primary, Primary Foreground
- **Secondary Colors**: Secondary, Secondary Foreground
- **Accent Colors**: Accent, Accent Foreground
- **Card Colors**: Card, Card Foreground
- **Popover Colors**: Popover, Popover Foreground
- **Muted Colors**: Muted, Muted Foreground
- **Destructive Colors**: Destructive, Destructive Foreground
- **Border & Input Colors**: Border, Input, Ring
- **Chart Colors**: Chart 1-5
- **Sidebar Colors**: 8 sidebar-specific color variables

#### OKLCH Color Picker
Each color features an advanced color picker with:
- **Visual Preview**: See the color before applying
- **OKLCH Sliders**:
  - **Lightness (L)**: 0-1 range
  - **Chroma (C)**: 0-0.4 range
  - **Hue (H)**: 0-360° range
- **Hex Input**: Quick color entry via hex codes
- **OKLCH Value Display**: Copy exact OKLCH values

### 3. **Theme Import**

#### From tweakcn.com
Import themes directly from tweakcn.com:
```
1. Copy the theme URL (e.g., https://tweakcn.com/r/themes/cmffm3zz1000004la9lfv4eke)
2. Paste into the URL input field
3. Click "Import"
```

#### From File
Upload theme files:
- **JSON**: Complete theme configuration
- **CSS**: CSS variables file

### 4. **Theme Export**

#### CSS Export
Export as CSS for direct use in your project:
```css
@layer base {
  :root {
    --background: oklch(1.0000 0 0);
    --foreground: oklch(0.1884 0.0128 248.5103);
    /* ... */
  }

  .dark {
    --background: oklch(0 0 0);
    --foreground: oklch(0.9328 0.0025 228.7857);
    /* ... */
  }
}
```

#### JSON Export
Export as JSON for sharing or backup:
```json
{
  "light": {
    "background": "oklch(1.0000 0 0)",
    "foreground": "oklch(0.1884 0.0128 248.5103)"
  },
  "dark": {
    "background": "oklch(0 0 0)",
    "foreground": "oklch(0.9328 0.0025 228.7857)"
  },
  "typography": {
    "font-sans": "Open Sans, sans-serif",
    "font-serif": "Georgia, serif",
    "font-mono": "Menlo, monospace"
  },
  "other": {
    "radius": "1.3rem"
  }
}
```

### 5. **Live Preview**
Toggle the live preview to see your theme applied to sample components:
- Buttons (all variants)
- Badges
- Form inputs
- Alerts
- Cards
- Charts
- Sidebar elements
- Typography samples

### 6. **Typography Settings**
Configure font families:
- **Sans Serif**: Default body font
- **Serif**: Alternative font for headings
- **Monospace**: Code and technical text

### 7. **Other Settings**
- **Border Radius**: Adjust global border radius (e.g., 0.5rem, 1rem, 1.3rem)
- Visual preview of radius sizes

### 8. **History & Undo/Redo**
- **Undo**: Revert the last change (↩️ button)
- **Redo**: Reapply undone changes (↪️ button)
- **History Limit**: Last 50 changes tracked
- **Auto-Save**: Changes saved to localStorage

## Quick Start Guide

### 1. Access the Theme Editor
```
Navigate to: https://events.stepperslife.com/admin/theme
```

### 2. Select Theme Mode
Click either "Light" or "Dark" to edit that mode's colors.

### 3. Edit Colors
1. Expand a color section (e.g., "Primary Colors")
2. Click on any color circle to open the picker
3. Adjust OKLCH sliders or enter hex codes
4. Changes apply instantly

### 4. Preview Changes
Click "Show Preview" to see your theme applied to UI components.

### 5. Export Theme
1. Go to the "Export" tab
2. Choose CSS or JSON format
3. Click "Copy to Clipboard" or "Download"

### 6. Apply to Production
**Option A: CSS Method**
```bash
1. Copy the exported CSS
2. Replace the @layer base section in app/globals.css
3. Save the file
4. Rebuild: npm run build
5. Restart: pm2 restart events-stepperslife
```

**Option B: Direct Edit**
Edit colors directly in the theme editor, as changes persist in localStorage.

## Understanding OKLCH

OKLCH (Oklab Lightness Chroma Hue) is a perceptually uniform color space:

- **Lightness (L)**: 0 = black, 1 = white
- **Chroma (C)**: 0 = grayscale, higher = more saturated
- **Hue (H)**: 0-360° color wheel angle

### Why OKLCH?
- **Perceptually uniform**: Equal changes look equal
- **Predictable lightness**: L=0.5 always looks medium bright
- **Wide gamut**: Supports modern display colors
- **Better than HSL**: More accurate color relationships

## Color Palette Strategy

### Light Mode Best Practices
- **Background**: Very light (L ≈ 0.95-1.0)
- **Foreground**: Very dark (L ≈ 0.15-0.25)
- **Primary**: Medium lightness (L ≈ 0.55-0.75)
- **Muted**: Light gray (L ≈ 0.90-0.95, C ≈ 0.01)

### Dark Mode Best Practices
- **Background**: Very dark (L ≈ 0.0-0.15)
- **Foreground**: Very light (L ≈ 0.85-0.95)
- **Primary**: Slightly lighter than light mode
- **Muted**: Dark gray (L ≈ 0.20-0.25, C ≈ 0.01)

### Accessibility
- **Minimum Contrast**: 4.5:1 for text
- **Large Text**: 3:1 minimum
- Use the preview to check readability

## Keyboard Shortcuts

- **Ctrl/Cmd + Z**: Undo
- **Ctrl/Cmd + Shift + Z**: Redo
- **Tab**: Navigate between inputs
- **Enter**: Apply color picker changes

## Technical Details

### Architecture
```
components/theme/
├── ThemeEditor.tsx          # Main container with sidebar
├── ColorPicker.tsx          # OKLCH color picker
├── ColorSection.tsx         # Grouped color variables
├── ThemeImporter.tsx        # Import functionality
├── ThemeExporter.tsx        # Export functionality
└── ThemePreview.tsx         # Live preview component

lib/contexts/
└── ThemeContext.tsx         # State management
```

### State Management
The theme editor uses React Context for state management:
- **Current Theme**: Active light/dark configuration
- **History**: Last 50 changes for undo/redo
- **Saved Themes**: User-saved theme presets
- **Persistence**: localStorage for auto-save

### CSS Variables
All theme colors map to CSS custom properties:
```css
--background
--foreground
--primary
--primary-foreground
/* etc... */
```

### Tailwind Integration
Theme colors are integrated with Tailwind CSS v4:
```tsx
<div className="bg-background text-foreground">
  <button className="bg-primary text-primary-foreground">
    Click me
  </button>
</div>
```

## Troubleshooting

### Issue: Changes not appearing
**Solution**: Hard refresh the page (Ctrl+Shift+R)

### Issue: Colors look wrong after import
**Solution**: Check that you imported for the correct mode (light/dark)

### Issue: Export button not working
**Solution**: Check browser console for errors, ensure clipboard access

### Issue: Preview not updating
**Solution**: Toggle the preview off and on again

### Issue: Lost changes after page reload
**Solution**: Changes are auto-saved to localStorage. If cleared, use the exported JSON backup.

## Advanced Usage

### Creating Theme Presets
1. Create your theme
2. Export as JSON
3. Save multiple variants
4. Switch between them via Import

### Sharing Themes
1. Export as JSON
2. Share the JSON file
3. Recipients import via "Import from File"

### Version Control
For production themes:
1. Export final theme as CSS
2. Commit to git
3. Track changes in version control

## Support

For issues or questions:
- Check this documentation first
- Review the console for error messages
- Contact the development team
- File an issue in the project repository

## Future Enhancements

Planned features:
- [ ] Color harmony suggestions
- [ ] Accessibility contrast checker
- [ ] Theme templates/presets
- [ ] A/B testing integration
- [ ] Multi-theme support
- [ ] Real-time collaboration

## Version History

- **v1.0.0** (2025): Initial release
  - OKLCH color picker
  - Import/Export functionality
  - Live preview
  - History/Undo/Redo
  - Light/Dark mode support

---

**Last Updated**: October 2, 2025
**Author**: Development Team
**Access**: SUPER_ADMIN only
