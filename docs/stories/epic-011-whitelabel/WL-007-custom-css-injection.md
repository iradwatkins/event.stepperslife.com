# WL-007: Custom CSS Injection for Advanced Styling

**Epic:** EPIC-011: White-Label Features
**Story Points:** 3
**Priority:** Low
**Status:** Not Started

---

## User Story

**As an** advanced white-label client (Pro/Enterprise tier)
**I want to** inject custom CSS to fine-tune platform styling beyond theme settings
**So that** I can achieve pixel-perfect brand alignment for unique design requirements

### Acceptance Criteria

1. **CSS Editor Interface**
   - [ ] Code editor with syntax highlighting
   - [ ] Line numbers and error highlighting
   - [ ] Auto-completion for CSS properties
   - [ ] Fold/unfold code blocks
   - [ ] Search and replace functionality
   - [ ] Full-screen editor mode
   - [ ] Dark mode support in editor

2. **CSS Validation & Sanitization**
   - [ ] Real-time CSS syntax validation
   - [ ] Block dangerous CSS patterns (@import, javascript:, etc.)
   - [ ] Validate CSS against safe properties list
   - [ ] Show validation errors inline
   - [ ] Warning for performance-impacting CSS
   - [ ] Size limit (50KB max)

3. **CSS Scoping**
   - [ ] Automatically scope all CSS rules to tenant
   - [ ] Prevent global style pollution
   - [ ] Namespace classes with tenant ID
   - [ ] Prevent !important overuse (warn only)
   - [ ] Respect component boundaries

4. **Live Preview**
   - [ ] Real-time preview while editing
   - [ ] Preview on different pages (home, events, checkout)
   - [ ] Device preview (desktop, tablet, mobile)
   - [ ] Before/after comparison
   - [ ] Reset to see without custom CSS

5. **Version Control**
   - [ ] Save drafts without publishing
   - [ ] Version history (last 10 versions)
   - [ ] Compare versions side-by-side
   - [ ] Revert to previous version
   - [ ] Publish to make live
   - [ ] Rollback published version

6. **Performance Safeguards**
   - [ ] CSS minification on publish
   - [ ] Check for performance issues (large selectors, etc.)
   - [ ] Warn about render-blocking CSS
   - [ ] Limit number of rules (1000 max)
   - [ ] Monitor CSS load time impact

7. **Documentation & Help**
   - [ ] CSS class reference (available classes to target)
   - [ ] Example snippets library
   - [ ] Best practices guide
   - [ ] Limitations documentation
   - [ ] Support contact for CSS help

8. **Feature Gating**
   - [ ] Only available on Pro/Enterprise tiers
   - [ ] Upgrade prompt for Basic tier
   - [ ] Clear feature comparison

---

## Technical Requirements

### CSS Sanitization Engine

```typescript
// lib/utils/css-sanitizer.ts

interface SanitizationResult {
  sanitized: string;
  errors: string[];
  warnings: string[];
  isValid: boolean;
}

class CSSSanitizer {
  private BLOCKED_PATTERNS = [
    /@import/gi,
    /javascript:/gi,
    /expression\(/gi,
    /behavior:/gi,
    /<script/gi,
    /onclick/gi,
    /onerror/gi,
    /onload/gi,
  ];

  private BLOCKED_PROPERTIES = [
    'behavior',
    '-moz-binding',
  ];

  private MAX_SIZE = 50 * 1024; // 50KB
  private MAX_RULES = 1000;

  sanitize(css: string, tenantId: string): SanitizationResult {
    const result: SanitizationResult = {
      sanitized: '',
      errors: [],
      warnings: [],
      isValid: true,
    };

    // Check size
    if (css.length > this.MAX_SIZE) {
      result.errors.push(`CSS exceeds maximum size of ${this.MAX_SIZE / 1024}KB`);
      result.isValid = false;
      return result;
    }

    // Check for blocked patterns
    for (const pattern of this.BLOCKED_PATTERNS) {
      if (pattern.test(css)) {
        result.errors.push(`Blocked pattern detected: ${pattern.source}`);
        result.isValid = false;
      }
    }

    if (!result.isValid) {
      return result;
    }

    // Parse and sanitize CSS
    try {
      const parsed = this.parseCSS(css);

      // Check rule count
      if (parsed.rules.length > this.MAX_RULES) {
        result.warnings.push(
          `High number of rules (${parsed.rules.length}). Consider optimizing.`
        );
      }

      // Sanitize each rule
      const sanitizedRules = parsed.rules
        .map((rule) => this.sanitizeRule(rule, tenantId, result))
        .filter(Boolean);

      result.sanitized = sanitizedRules.join('\n\n');
    } catch (error) {
      result.errors.push(`CSS parsing error: ${error.message}`);
      result.isValid = false;
    }

    return result;
  }

  private parseCSS(css: string): { rules: any[] } {
    // Use postcss or css-tree for parsing
    const postcss = require('postcss');
    const root = postcss.parse(css);

    const rules: any[] = [];

    root.walkRules((rule) => {
      rules.push({
        selector: rule.selector,
        declarations: rule.nodes
          .filter((node) => node.type === 'decl')
          .map((decl) => ({
            property: decl.prop,
            value: decl.value,
          })),
      });
    });

    return { rules };
  }

  private sanitizeRule(
    rule: any,
    tenantId: string,
    result: SanitizationResult
  ): string | null {
    // Scope selector to tenant
    const scopedSelector = this.scopeSelector(rule.selector, tenantId);

    // Filter declarations
    const sanitizedDeclarations = rule.declarations
      .filter((decl) => {
        // Check for blocked properties
        if (this.BLOCKED_PROPERTIES.includes(decl.property.toLowerCase())) {
          result.warnings.push(`Blocked property removed: ${decl.property}`);
          return false;
        }

        // Check for suspicious values
        if (this.hasSuspiciousValue(decl.value)) {
          result.warnings.push(
            `Suspicious value in ${decl.property}: ${decl.value}`
          );
          return false;
        }

        return true;
      })
      .map((decl) => `  ${decl.property}: ${decl.value};`)
      .join('\n');

    if (!sanitizedDeclarations) {
      return null;
    }

    return `${scopedSelector} {\n${sanitizedDeclarations}\n}`;
  }

  private scopeSelector(selector: string, tenantId: string): string {
    const scope = `.tenant-${tenantId}`;

    // Parse selector and add scope
    const selectors = selector.split(',').map((s) => s.trim());

    const scoped = selectors.map((sel) => {
      // Handle pseudo-elements and pseudo-classes
      if (sel.includes(':')) {
        const parts = sel.split(':');
        return `${scope} ${parts[0]}:${parts.slice(1).join(':')}`;
      }

      return `${scope} ${sel}`;
    });

    return scoped.join(',\n');
  }

  private hasSuspiciousValue(value: string): boolean {
    const suspiciousPatterns = [
      /javascript:/gi,
      /expression\(/gi,
      /behavior:/gi,
      /<script/gi,
    ];

    return suspiciousPatterns.some((pattern) => pattern.test(value));
  }

  minify(css: string): string {
    // Use cssnano or similar for minification
    const postcss = require('postcss');
    const cssnano = require('cssnano');

    const result = postcss([cssnano]).process(css, { from: undefined });
    return result.css;
  }
}

export default new CSSSanitizer();
```

### CSS Injection Service

```typescript
// lib/services/custom-css.service.ts

interface CustomCSSVersion {
  id: string;
  tenantId: string;
  css: string;
  sanitizedCss: string;
  minifiedCss: string;
  isPublished: boolean;
  version: number;
  publishedAt?: Date;
  createdAt: Date;
}

class CustomCSSService {
  async saveCSS(
    tenantId: string,
    css: string,
    publish: boolean = false
  ): Promise<CustomCSSVersion> {
    // Sanitize CSS
    const sanitizationResult = cssSanitizer.sanitize(css, tenantId);

    if (!sanitizationResult.isValid) {
      throw new Error(
        `CSS validation failed: ${sanitizationResult.errors.join(', ')}`
      );
    }

    // Minify if publishing
    const minifiedCss = publish
      ? cssSanitizer.minify(sanitizationResult.sanitized)
      : sanitizationResult.sanitized;

    // Get current version number
    const latestVersion = await prisma.customCSS.findFirst({
      where: { tenantId },
      orderBy: { version: 'desc' },
    });

    const newVersion = (latestVersion?.version || 0) + 1;

    // If publishing, unpublish previous version
    if (publish && latestVersion?.isPublished) {
      await prisma.customCSS.update({
        where: { id: latestVersion.id },
        data: { isPublished: false },
      });
    }

    // Save new version
    const cssVersion = await prisma.customCSS.create({
      data: {
        tenantId,
        css,
        sanitizedCss: sanitizationResult.sanitized,
        minifiedCss,
        isPublished: publish,
        version: newVersion,
        publishedAt: publish ? new Date() : null,
        metadata: {
          errors: sanitizationResult.errors,
          warnings: sanitizationResult.warnings,
        },
      },
    });

    // Invalidate cache
    await this.invalidateCache(tenantId);

    return cssVersion;
  }

  async getPublishedCSS(tenantId: string): Promise<string | null> {
    // Try cache first
    const cached = await redis.get(`tenant:${tenantId}:custom-css`);
    if (cached) {
      return cached;
    }

    // Get from database
    const cssVersion = await prisma.customCSS.findFirst({
      where: { tenantId, isPublished: true },
      orderBy: { version: 'desc' },
    });

    if (!cssVersion) {
      return null;
    }

    // Cache for 1 hour
    await redis.setex(
      `tenant:${tenantId}:custom-css`,
      3600,
      cssVersion.minifiedCss
    );

    return cssVersion.minifiedCss;
  }

  async getVersionHistory(tenantId: string): Promise<CustomCSSVersion[]> {
    return await prisma.customCSS.findMany({
      where: { tenantId },
      orderBy: { version: 'desc' },
      take: 10,
    });
  }

  async revertToVersion(tenantId: string, versionId: string): Promise<void> {
    const version = await prisma.customCSS.findUnique({
      where: { id: versionId },
    });

    if (!version || version.tenantId !== tenantId) {
      throw new Error('Version not found');
    }

    // Publish this version (creates a new version with same CSS)
    await this.saveCSS(tenantId, version.css, true);
  }

  async deleteCSS(tenantId: string): Promise<void> {
    await prisma.customCSS.updateMany({
      where: { tenantId, isPublished: true },
      data: { isPublished: false },
    });

    await this.invalidateCache(tenantId);
  }

  private async invalidateCache(tenantId: string): Promise<void> {
    await redis.del(`tenant:${tenantId}:custom-css`);
  }

  async validateCSS(css: string, tenantId: string): SanitizationResult {
    return cssSanitizer.sanitize(css, tenantId);
  }
}

export default new CustomCSSService();
```

### Database Schema

```prisma
// prisma/schema.prisma

model CustomCSS {
  id            String   @id @default(cuid())
  tenantId      String
  tenant        Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  css           String   @db.Text  // Original CSS
  sanitizedCss  String   @db.Text  // Sanitized CSS
  minifiedCss   String   @db.Text  // Minified for production

  isPublished   Boolean  @default(false)
  version       Int

  metadata      Json?    // Errors, warnings, etc.

  publishedAt   DateTime?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@index([tenantId, isPublished])
  @@index([tenantId, version])
}
```

---

## API Endpoints

### POST /api/admin/custom-css
Save custom CSS (draft or publish)

**Request:**
```json
{
  "css": ".custom-button { background: red; }",
  "publish": false
}
```

**Response:**
```json
{
  "id": "css_abc123",
  "version": 5,
  "isPublished": false,
  "warnings": ["Consider using more specific selectors"],
  "errors": [],
  "createdAt": "2025-01-15T10:30:00Z"
}
```

### GET /api/admin/custom-css
Get current published CSS

### POST /api/admin/custom-css/validate
Validate CSS without saving

### GET /api/admin/custom-css/history
Get version history

### POST /api/admin/custom-css/revert/:versionId
Revert to specific version

### DELETE /api/admin/custom-css
Remove custom CSS (unpublish)

### GET /api/public/custom-css/:tenantId
Public endpoint to load CSS (cached)

---

## UI Components

### Custom CSS Editor

```tsx
// app/dashboard/settings/custom-css.tsx

'use client';

import { useState, useEffect } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { css } from '@codemirror/lang-css';
import { oneDark } from '@codemirror/theme-one-dark';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function CustomCSSEditor() {
  const [cssCode, setCssCode] = useState('');
  const [validationResult, setValidationResult] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const handleValidate = async () => {
    const response = await fetch('/api/admin/custom-css/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ css: cssCode }),
    });

    const result = await response.json();
    setValidationResult(result);
  };

  const handleSave = async (publish: boolean) => {
    setSaving(true);
    try {
      await fetch('/api/admin/custom-css', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ css: cssCode, publish }),
      });

      if (publish) {
        alert('CSS published successfully!');
      } else {
        alert('CSS saved as draft');
      }
    } finally {
      setSaving(false);
    }
  };

  // Auto-validate on change (debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (cssCode) handleValidate();
    }, 1000);

    return () => clearTimeout(timer);
  }, [cssCode]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Custom CSS</h2>
          <p className="text-gray-600">Advanced styling customization</p>
        </div>
        <div className="space-x-2">
          <Button
            variant="outline"
            onClick={() => setShowPreview(!showPreview)}
          >
            {showPreview ? 'Hide' : 'Show'} Preview
          </Button>
          <Button variant="outline" onClick={() => handleSave(false)} disabled={saving}>
            Save Draft
          </Button>
          <Button onClick={() => handleSave(true)} disabled={saving}>
            Publish
          </Button>
        </div>
      </div>

      {/* Validation Feedback */}
      {validationResult && (
        <div className="space-y-2">
          {validationResult.errors?.length > 0 && (
            <Alert variant="destructive">
              <h4 className="font-semibold">Errors:</h4>
              <ul className="list-disc list-inside">
                {validationResult.errors.map((err: string, i: number) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </Alert>
          )}

          {validationResult.warnings?.length > 0 && (
            <Alert>
              <h4 className="font-semibold">Warnings:</h4>
              <ul className="list-disc list-inside">
                {validationResult.warnings.map((warn: string, i: number) => (
                  <li key={i}>{warn}</li>
                ))}
              </ul>
            </Alert>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Editor */}
        <div>
          <Tabs defaultValue="editor">
            <TabsList>
              <TabsTrigger value="editor">Editor</TabsTrigger>
              <TabsTrigger value="reference">CSS Reference</TabsTrigger>
              <TabsTrigger value="examples">Examples</TabsTrigger>
            </TabsList>

            <TabsContent value="editor">
              <CodeMirror
                value={cssCode}
                height="600px"
                theme={oneDark}
                extensions={[css()]}
                onChange={(value) => setCssCode(value)}
              />
            </TabsContent>

            <TabsContent value="reference">
              <CSSClassReference />
            </TabsContent>

            <TabsContent value="examples">
              <CSSExamples onSelect={(example) => setCssCode(example)} />
            </TabsContent>
          </Tabs>
        </div>

        {/* Preview */}
        {showPreview && (
          <div className="border rounded-lg p-4 bg-gray-50">
            <h3 className="font-semibold mb-4">Live Preview</h3>
            <CSSPreview css={validationResult?.sanitized || cssCode} />
          </div>
        )}
      </div>

      {/* Version History */}
      <CSSVersionHistory />
    </div>
  );
}
```

---

## Testing Requirements

### Unit Tests
- CSS sanitization logic
- Scope generation
- Validation rules
- Minification

### Integration Tests
- Full CSS save/publish flow
- Version management
- Cache invalidation

### Security Tests
- XSS injection attempts
- CSS injection attacks
- Dangerous pattern blocking

---

## Security Considerations

1. **XSS Prevention**
   - Block all script-related patterns
   - Sanitize all CSS before saving
   - Scope to tenant namespace

2. **Performance Protection**
   - Size limits (50KB)
   - Rule count limits (1000)
   - Minification required for production

3. **Feature Gating**
   - Pro/Enterprise only
   - Enforce at API level
   - Check subscription status

---

## Dependencies

- **CodeMirror** or **Monaco Editor**: Code editor
- **PostCSS**: CSS parsing and processing
- **cssnano**: CSS minification
- **css-tree**: CSS AST parsing

---

## Success Metrics

- Custom CSS adoption rate (Pro+ users) > 40%
- Zero XSS incidents from custom CSS
- CSS validation accuracy > 99%
- Performance impact < 50ms per page
- Customer satisfaction > 4.5/5

---

## Notes

- Consider WYSIWYG CSS editor for less technical users
- Add CSS linting (stylelint)
- Provide CSS starter templates
- Document common use cases
- Consider CSS preprocessor support (SCSS)