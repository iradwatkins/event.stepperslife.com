'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useTheme, ThemeConfig } from '@/lib/contexts/ThemeContext';
import { Download, AlertCircle, CheckCircle2 } from 'lucide-react';

export function ThemeImporter() {
  const { importTheme } = useTheme();
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleImportFromUrl = async () => {
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      // Validate URL
      if (!url.includes('tweakcn.com')) {
        throw new Error('Please enter a valid tweakcn.com theme URL');
      }

      // Fetch theme from URL
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch theme from URL');
      }

      const html = await response.text();

      // Parse CSS variables from the HTML
      // This is a simple parser - a real implementation would need more robust parsing
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      const styleElement = doc.querySelector('style');

      if (!styleElement) {
        throw new Error('No theme CSS found in the URL');
      }

      const css = styleElement.textContent || '';
      const themeConfig = parseCSSToTheme(css);

      if (!themeConfig) {
        throw new Error('Failed to parse theme CSS');
      }

      importTheme(themeConfig);
      setSuccess('Theme imported successfully!');
      setUrl('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import theme');
    } finally {
      setLoading(false);
    }
  };

  const handleImportFromJSON = (jsonString: string) => {
    setError('');
    setSuccess('');

    try {
      const config = JSON.parse(jsonString);

      // Validate the theme config
      if (!config.light || !config.dark || !config.typography || !config.other) {
        throw new Error('Invalid theme JSON structure');
      }

      importTheme(config as ThemeConfig);
      setSuccess('Theme imported from JSON successfully!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse JSON');
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (file.name.endsWith('.json')) {
        handleImportFromJSON(content);
      } else if (file.name.endsWith('.css')) {
        const themeConfig = parseCSSToTheme(content);
        if (themeConfig) {
          importTheme(themeConfig);
          setSuccess('Theme imported from CSS successfully!');
        } else {
          setError('Failed to parse CSS file');
        }
      }
    };
    reader.readAsText(file);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="h-5 w-5" />
          Import Theme
        </CardTitle>
        <CardDescription>
          Import themes from tweakcn.com, JSON, or CSS files
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Import from URL */}
        <div className="space-y-2">
          <Label htmlFor="theme-url">Import from tweakcn.com</Label>
          <div className="flex gap-2">
            <Input
              id="theme-url"
              type="url"
              placeholder="https://tweakcn.com/r/themes/..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={loading}
            />
            <Button onClick={handleImportFromUrl} disabled={loading || !url}>
              {loading ? 'Importing...' : 'Import'}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Paste a theme URL from tweakcn.com to import it directly
          </p>
        </div>

        {/* Import from file */}
        <div className="space-y-2">
          <Label htmlFor="theme-file">Import from File</Label>
          <Input
            id="theme-file"
            type="file"
            accept=".json,.css"
            onChange={handleFileUpload}
          />
          <p className="text-xs text-muted-foreground">
            Upload a JSON or CSS file containing theme variables
          </p>
        </div>

        {/* Success message */}
        {success && (
          <Alert className="bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800">
            <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
            <AlertDescription className="text-green-800 dark:text-green-200">
              {success}
            </AlertDescription>
          </Alert>
        )}

        {/* Error message */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}

// Helper function to parse CSS to theme config
function parseCSSToTheme(css: string): ThemeConfig | null {
  try {
    const themeConfig: ThemeConfig = {
      light: {} as any,
      dark: {} as any,
      typography: {
        'font-sans': 'Open Sans, sans-serif',
        'font-serif': 'Georgia, serif',
        'font-mono': 'Menlo, monospace',
        'font-weight-light': 300,
        'font-weight-regular': 400,
        'font-weight-medium': 500,
        'font-weight-semibold': 600,
        'font-weight-bold': 700,
        'letter-spacing': '0em',
        'line-height': '1.5',
        'font-size-base': '16px',
      },
      other: {
        radius: '1.3rem',
      },
    };

    // Parse :root section (light theme)
    const rootMatch = css.match(/:root\s*{([^}]*)}/);
    if (rootMatch && rootMatch[1]) {
      const rootVars = rootMatch[1];
      const varMatches = rootVars.matchAll(/--([a-z-]+):\s*([^;]+);/g);
      for (const [, key, value] of varMatches) {
        if (!key || !value) continue;
        const trimmedValue = value.trim();
        if (key.startsWith('font-')) {
          (themeConfig.typography as any)[key] = trimmedValue;
        } else if (key === 'radius') {
          themeConfig.other.radius = trimmedValue;
        } else {
          (themeConfig.light as any)[key] = trimmedValue;
        }
      }
    }

    // Parse .dark section (dark theme)
    const darkMatch = css.match(/\.dark\s*{([^}]*)}/);
    if (darkMatch && darkMatch[1]) {
      const darkVars = darkMatch[1];
      const varMatches = darkVars.matchAll(/--([a-z-]+):\s*([^;]+);/g);
      for (const [, key, value] of varMatches) {
        if (!key || !value) continue;
        const trimmedValue = value.trim();
        if (!key.startsWith('font-') && key !== 'radius') {
          (themeConfig.dark as any)[key] = trimmedValue;
        }
      }
    }

    return themeConfig;
  } catch (e) {
    console.error('Failed to parse CSS:', e);
    return null;
  }
}
