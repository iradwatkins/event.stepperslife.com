# WL-002: Theme Customization System

**Epic:** EPIC-011: White-Label Features
**Story Points:** 5
**Priority:** High
**Status:** Not Started

---

## User Story

**As a** white-label client
**I want to** customize the platform's appearance (colors, fonts, logos, styles)
**So that** the platform matches my brand identity and provides a seamless branded experience

### Acceptance Criteria

1. **Theme Editor Interface**
   - [ ] Visual theme editor in admin dashboard
   - [ ] Live preview of theme changes
   - [ ] Organized sections: Colors, Typography, Branding, Advanced
   - [ ] Reset to default theme option
   - [ ] Save draft themes (not published yet)
   - [ ] Publish theme to make it live

2. **Color Customization**
   - [ ] Primary brand color picker
   - [ ] Secondary/accent color picker
   - [ ] Background colors (main, surface, elevated)
   - [ ] Text colors (primary, secondary, disabled)
   - [ ] Success, warning, error, info colors
   - [ ] Generate color palette from primary color (shades/tints)
   - [ ] Contrast checker to ensure WCAG accessibility
   - [ ] Preview colors across all components

3. **Typography Customization**
   - [ ] Font family selection for headings
   - [ ] Font family selection for body text
   - [ ] Font size scale customization
   - [ ] Font weight options
   - [ ] Line height controls
   - [ ] Letter spacing controls
   - [ ] Support for Google Fonts
   - [ ] Support for custom font uploads

4. **Logo & Brand Assets**
   - [ ] Upload primary logo (header)
   - [ ] Upload logo variants (light/dark mode)
   - [ ] Upload favicon
   - [ ] Upload email header logo
   - [ ] Logo dimensions and positioning controls
   - [ ] Automatic image optimization
   - [ ] Preview logos in different contexts

5. **Advanced CSS Overrides**
   - [ ] Custom CSS editor (for advanced users)
   - [ ] CSS validation and sanitization
   - [ ] Scoped to tenant only
   - [ ] Syntax highlighting in editor
   - [ ] Preview before applying
   - [ ] Version history for CSS changes

6. **Theme Templates**
   - [ ] Pre-designed theme templates (Light, Dark, Professional, Modern, etc.)
   - [ ] One-click apply template
   - [ ] Templates as starting points for customization
   - [ ] Export/import theme JSON

7. **Responsive Preview**
   - [ ] Preview desktop, tablet, mobile views
   - [ ] Preview light and dark mode
   - [ ] Preview across key pages (home, events, checkout)
   - [ ] Side-by-side comparison with default theme

---

## Technical Requirements

### Theme Data Model

```prisma
// prisma/schema.prisma

model Theme {
  id          String   @id @default(cuid())
  tenantId    String   @unique
  tenant      Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  name        String   @default("Custom Theme")
  isPublished Boolean  @default(false)

  // Colors
  primaryColor      String @default("#3b82f6")
  secondaryColor    String @default("#8b5cf6")
  backgroundColor   String @default("#ffffff")
  surfaceColor      String @default("#f9fafb")
  textPrimary       String @default("#111827")
  textSecondary     String @default("#6b7280")
  successColor      String @default("#10b981")
  warningColor      String @default("#f59e0b")
  errorColor        String @default("#ef4444")
  infoColor         String @default("#3b82f6")

  // Typography
  fontHeading       String @default("Inter")
  fontBody          String @default("Inter")
  fontSizeBase      String @default("16px")
  fontSizeScale     Json   @default("{\"xs\":\"12px\",\"sm\":\"14px\",\"base\":\"16px\",\"lg\":\"18px\",\"xl\":\"20px\",\"2xl\":\"24px\"}")
  lineHeight        String @default("1.5")
  letterSpacing     String @default("normal")

  // Brand Assets
  logoUrl           String?
  logoDarkUrl       String?
  faviconUrl        String?
  emailLogoUrl      String?
  logoWidth         Int    @default(200)
  logoHeight        Int    @default(50)

  // Advanced
  customCSS         String?
  borderRadius      String @default("0.375rem")
  shadowIntensity   String @default("medium")

  // Metadata
  version           Int      @default(1)
  publishedAt       DateTime?
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  @@index([tenantId])
  @@index([isPublished])
}

model ThemeHistory {
  id          String   @id @default(cuid())
  themeId     String
  tenantId    String

  snapshot    Json
  version     Int
  publishedBy String?

  createdAt   DateTime @default(now())

  @@index([themeId])
  @@index([tenantId])
  @@index([createdAt])
}
```

### Theme Engine

```typescript
// lib/theme/theme-engine.ts

interface ThemeConfig {
  colors: {
    primary: string;
    secondary: string;
    background: string;
    surface: string;
    text: {
      primary: string;
      secondary: string;
    };
    semantic: {
      success: string;
      warning: string;
      error: string;
      info: string;
    };
  };
  typography: {
    fonts: {
      heading: string;
      body: string;
    };
    sizes: {
      xs: string;
      sm: string;
      base: string;
      lg: string;
      xl: string;
      '2xl': string;
    };
    lineHeight: string;
    letterSpacing: string;
  };
  branding: {
    logo: string;
    logoDark?: string;
    favicon: string;
    emailLogo?: string;
    dimensions: {
      width: number;
      height: number;
    };
  };
  advanced: {
    customCSS?: string;
    borderRadius: string;
    shadowIntensity: 'none' | 'light' | 'medium' | 'strong';
  };
}

class ThemeEngine {
  // Generate CSS variables from theme
  generateCSSVariables(theme: Theme): string {
    return `
      :root {
        /* Colors */
        --color-primary: ${theme.primaryColor};
        --color-secondary: ${theme.secondaryColor};
        --color-background: ${theme.backgroundColor};
        --color-surface: ${theme.surfaceColor};
        --color-text-primary: ${theme.textPrimary};
        --color-text-secondary: ${theme.textSecondary};
        --color-success: ${theme.successColor};
        --color-warning: ${theme.warningColor};
        --color-error: ${theme.errorColor};
        --color-info: ${theme.infoColor};

        /* Typography */
        --font-heading: ${theme.fontHeading}, sans-serif;
        --font-body: ${theme.fontBody}, sans-serif;
        --font-size-base: ${theme.fontSizeBase};
        --line-height: ${theme.lineHeight};
        --letter-spacing: ${theme.letterSpacing};

        /* Layout */
        --border-radius: ${theme.borderRadius};
        --shadow-sm: ${this.getShadow('sm', theme.shadowIntensity)};
        --shadow-md: ${this.getShadow('md', theme.shadowIntensity)};
        --shadow-lg: ${this.getShadow('lg', theme.shadowIntensity)};
      }
    `;
  }

  // Generate color palette from primary color
  generateColorPalette(baseColor: string): ColorPalette {
    // Use color manipulation library (e.g., chroma-js)
    const chromaColor = chroma(baseColor);

    return {
      50: chromaColor.brighten(2.5).hex(),
      100: chromaColor.brighten(2).hex(),
      200: chromaColor.brighten(1.5).hex(),
      300: chromaColor.brighten(1).hex(),
      400: chromaColor.brighten(0.5).hex(),
      500: baseColor,
      600: chromaColor.darken(0.5).hex(),
      700: chromaColor.darken(1).hex(),
      800: chromaColor.darken(1.5).hex(),
      900: chromaColor.darken(2).hex(),
    };
  }

  // Check color contrast for accessibility
  checkContrast(foreground: string, background: string): ContrastResult {
    const contrast = chroma.contrast(foreground, background);

    return {
      ratio: contrast,
      AA: contrast >= 4.5,
      AAA: contrast >= 7,
      AALarge: contrast >= 3,
      AAALarge: contrast >= 4.5,
    };
  }

  // Sanitize custom CSS
  sanitizeCSS(css: string): string {
    // Remove dangerous patterns
    let sanitized = css;

    // Remove @import (prevent external resource loading)
    sanitized = sanitized.replace(/@import\s+.*?;/g, '');

    // Remove javascript: protocol
    sanitized = sanitized.replace(/javascript:/gi, '');

    // Remove expression() (IE specific)
    sanitized = sanitized.replace(/expression\s*\(/gi, '');

    // Scope all rules to tenant class
    sanitized = this.scopeCSS(sanitized);

    return sanitized;
  }

  // Scope CSS to tenant
  private scopeCSS(css: string, tenantId: string): string {
    const scope = `.tenant-${tenantId}`;

    // Parse CSS and prepend scope to each selector
    // This is simplified - use a proper CSS parser like postcss
    const rules = css.split('}').filter(r => r.trim());

    const scoped = rules.map(rule => {
      const [selectors, declarations] = rule.split('{');
      const scopedSelectors = selectors
        .split(',')
        .map(s => `${scope} ${s.trim()}`)
        .join(', ');
      return `${scopedSelectors} { ${declarations} }`;
    });

    return scoped.join('\n');
  }

  private getShadow(size: 'sm' | 'md' | 'lg', intensity: string): string {
    const shadows = {
      none: { sm: 'none', md: 'none', lg: 'none' },
      light: {
        sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
      },
      medium: {
        sm: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
        md: '0 4px 6px -1px rgba(0, 0, 0, 0.15)',
        lg: '0 10px 15px -3px rgba(0, 0, 0, 0.15)',
      },
      strong: {
        sm: '0 2px 4px 0 rgba(0, 0, 0, 0.15)',
        md: '0 6px 10px -1px rgba(0, 0, 0, 0.2)',
        lg: '0 15px 25px -3px rgba(0, 0, 0, 0.2)',
      },
    };

    return shadows[intensity]?.[size] || shadows.medium[size];
  }
}
```

### Theme Context & Provider

```typescript
// lib/context/theme-context.tsx

'use client';

import { createContext, useContext, useEffect, useState } from 'react';

interface ThemeContextValue {
  theme: ThemeConfig;
  isLoading: boolean;
  updateTheme: (updates: Partial<ThemeConfig>) => Promise<void>;
  publishTheme: () => Promise<void>;
  resetTheme: () => Promise<void>;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({
  children,
  initialTheme
}: {
  children: React.ReactNode;
  initialTheme: ThemeConfig;
}) {
  const [theme, setTheme] = useState(initialTheme);
  const [isLoading, setIsLoading] = useState(false);

  // Apply theme on mount and when it changes
  useEffect(() => {
    applyThemeToDOM(theme);
  }, [theme]);

  const updateTheme = async (updates: Partial<ThemeConfig>) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/theme', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      const updatedTheme = await response.json();
      setTheme(updatedTheme);
    } finally {
      setIsLoading(false);
    }
  };

  const publishTheme = async () => {
    setIsLoading(true);
    try {
      await fetch('/api/admin/theme/publish', { method: 'POST' });
    } finally {
      setIsLoading(false);
    }
  };

  const resetTheme = async () => {
    setIsLoading(true);
    try {
      await fetch('/api/admin/theme/reset', { method: 'POST' });
      // Reload theme from server
      const response = await fetch('/api/admin/theme');
      const resetTheme = await response.json();
      setTheme(resetTheme);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, isLoading, updateTheme, publishTheme, resetTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

function applyThemeToDOM(theme: ThemeConfig) {
  const themeEngine = new ThemeEngine();
  const cssVars = themeEngine.generateCSSVariables(theme);

  // Create or update style tag
  let styleTag = document.getElementById('dynamic-theme');
  if (!styleTag) {
    styleTag = document.createElement('style');
    styleTag.id = 'dynamic-theme';
    document.head.appendChild(styleTag);
  }

  styleTag.textContent = cssVars;

  // Apply custom CSS if exists
  if (theme.advanced.customCSS) {
    let customStyleTag = document.getElementById('custom-theme-css');
    if (!customStyleTag) {
      customStyleTag = document.createElement('style');
      customStyleTag.id = 'custom-theme-css';
      document.head.appendChild(customStyleTag);
    }
    customStyleTag.textContent = theme.advanced.customCSS;
  }
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}
```

---

## API Endpoints

### GET /api/admin/theme
Get current theme configuration

**Response:**
```json
{
  "id": "theme_abc123",
  "name": "Custom Theme",
  "isPublished": true,
  "colors": {
    "primary": "#3b82f6",
    "secondary": "#8b5cf6",
    "background": "#ffffff",
    "surface": "#f9fafb",
    "text": {
      "primary": "#111827",
      "secondary": "#6b7280"
    },
    "semantic": {
      "success": "#10b981",
      "warning": "#f59e0b",
      "error": "#ef4444",
      "info": "#3b82f6"
    }
  },
  "typography": {
    "fonts": {
      "heading": "Poppins",
      "body": "Inter"
    },
    "sizes": {
      "xs": "12px",
      "sm": "14px",
      "base": "16px",
      "lg": "18px",
      "xl": "20px",
      "2xl": "24px"
    }
  },
  "branding": {
    "logo": "https://cdn.example.com/logo.png",
    "favicon": "https://cdn.example.com/favicon.ico"
  }
}
```

### PATCH /api/admin/theme
Update theme (saves as draft)

**Request:**
```json
{
  "colors": {
    "primary": "#ff0000"
  }
}
```

### POST /api/admin/theme/publish
Publish current draft theme

### POST /api/admin/theme/reset
Reset to default theme

### GET /api/admin/theme/templates
Get pre-designed theme templates

### POST /api/admin/theme/preview
Generate preview of theme changes

---

## UI Components

### Theme Editor Component

```tsx
// app/dashboard/settings/theme-editor.tsx

'use client';

import { useState } from 'react';
import { useTheme } from '@/lib/context/theme-context';
import { ColorPicker } from '@/components/ui/color-picker';
import { FontSelector } from '@/components/ui/font-selector';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function ThemeEditor() {
  const { theme, updateTheme, publishTheme, isLoading } = useTheme();
  const [activeTab, setActiveTab] = useState('colors');

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Editor Panel */}
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Theme Editor</h2>
          <div className="space-x-2">
            <Button variant="outline" onClick={() => updateTheme(theme)}>
              Save Draft
            </Button>
            <Button onClick={publishTheme} disabled={isLoading}>
              Publish Theme
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="colors">Colors</TabsTrigger>
            <TabsTrigger value="typography">Typography</TabsTrigger>
            <TabsTrigger value="branding">Branding</TabsTrigger>
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
          </TabsList>

          <TabsContent value="colors" className="space-y-4">
            <ColorPicker
              label="Primary Color"
              value={theme.colors.primary}
              onChange={(color) => updateTheme({
                colors: { ...theme.colors, primary: color }
              })}
            />
            <ColorPicker
              label="Secondary Color"
              value={theme.colors.secondary}
              onChange={(color) => updateTheme({
                colors: { ...theme.colors, secondary: color }
              })}
            />
            {/* More color pickers... */}
          </TabsContent>

          <TabsContent value="typography" className="space-y-4">
            <FontSelector
              label="Heading Font"
              value={theme.typography.fonts.heading}
              onChange={(font) => updateTheme({
                typography: {
                  ...theme.typography,
                  fonts: { ...theme.typography.fonts, heading: font }
                }
              })}
            />
            <FontSelector
              label="Body Font"
              value={theme.typography.fonts.body}
              onChange={(font) => updateTheme({
                typography: {
                  ...theme.typography,
                  fonts: { ...theme.typography.fonts, body: font }
                }
              })}
            />
            {/* More typography controls... */}
          </TabsContent>

          <TabsContent value="branding" className="space-y-4">
            <LogoUpload
              label="Primary Logo"
              value={theme.branding.logo}
              onChange={(url) => updateTheme({
                branding: { ...theme.branding, logo: url }
              })}
            />
            {/* More branding controls... */}
          </TabsContent>

          <TabsContent value="advanced" className="space-y-4">
            <CustomCSSEditor
              value={theme.advanced.customCSS || ''}
              onChange={(css) => updateTheme({
                advanced: { ...theme.advanced, customCSS: css }
              })}
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* Live Preview Panel */}
      <div className="border rounded-lg p-4 bg-gray-50">
        <h3 className="text-lg font-semibold mb-4">Live Preview</h3>
        <ThemePreview theme={theme} />
      </div>
    </div>
  );
}
```

---

## Testing Requirements

### Unit Tests
- Theme CSS generation
- Color palette generation
- Contrast checking
- CSS sanitization

### Integration Tests
- Theme application across components
- Theme persistence
- Publishing workflow
- Reset functionality

### Visual Regression Tests
- Component rendering with custom themes
- Responsive behavior
- Dark mode variants

---

## Security Considerations

1. **CSS Injection Prevention**
   - Sanitize all custom CSS
   - Remove dangerous patterns (@import, javascript:, expression())
   - Scope CSS to tenant

2. **Asset Upload Security**
   - Validate file types (images only)
   - Scan for malware
   - Size limits (5MB per asset)
   - CDN delivery only

3. **XSS Prevention**
   - Escape all theme values in CSS
   - Content Security Policy headers
   - No inline scripts from theme

---

## Dependencies

- **chroma-js**: Color manipulation and contrast checking
- **Google Fonts API**: Font loading
- **Image optimization**: Sharp or Next.js Image
- **CSS parser**: PostCSS for advanced CSS manipulation
- **Code editor**: Monaco or CodeMirror for custom CSS

---

## Success Metrics

- Theme customization adoption rate > 80%
- Average theme setup time < 30 minutes
- Zero XSS incidents from custom CSS
- Customer satisfaction with theming > 4.5/5
- Performance: No degradation from custom themes

---

## Notes

- Consider theme marketplace for pre-built themes
- Add theme export/import for easy migration
- Provide theme documentation and best practices
- Consider A/B testing themes
- Plan for theme versioning and rollback