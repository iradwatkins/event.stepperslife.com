'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useTheme } from '@/lib/contexts/ThemeContext';
import { Copy, Download, CheckCircle2, Upload } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export function ThemeExporter() {
  const { exportTheme, exportThemeJSON } = useTheme();
  const [copied, setCopied] = useState(false);
  const [format, setFormat] = useState<'css' | 'json'>('css');

  const handleCopy = async () => {
    const content = format === 'css' ? exportTheme() : exportThemeJSON();
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const content = format === 'css' ? exportTheme() : exportThemeJSON();
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = format === 'css' ? 'theme.css' : 'theme.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Export Theme
        </CardTitle>
        <CardDescription>
          Export your theme as CSS or JSON
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs value={format} onValueChange={(v) => setFormat(v as 'css' | 'json')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="css">CSS</TabsTrigger>
            <TabsTrigger value="json">JSON</TabsTrigger>
          </TabsList>

          <TabsContent value="css" className="space-y-4">
            <div className="space-y-2">
              <Textarea
                value={exportTheme()}
                readOnly
                className="font-mono text-xs h-64"
                placeholder="CSS will appear here..."
              />
              <p className="text-xs text-muted-foreground">
                Copy this CSS and paste it into your globals.css file
              </p>
            </div>
          </TabsContent>

          <TabsContent value="json" className="space-y-4">
            <div className="space-y-2">
              <Textarea
                value={exportThemeJSON()}
                readOnly
                className="font-mono text-xs h-64"
                placeholder="JSON will appear here..."
              />
              <p className="text-xs text-muted-foreground">
                Copy this JSON to save or share your theme configuration
              </p>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex gap-2">
          <Button onClick={handleCopy} className="flex-1" variant="outline">
            {copied ? (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4 text-green-600" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="mr-2 h-4 w-4" />
                Copy to Clipboard
              </>
            )}
          </Button>
          <Button onClick={handleDownload} className="flex-1">
            <Download className="mr-2 h-4 w-4" />
            Download {format.toUpperCase()}
          </Button>
        </div>

        {/* Installation Instructions */}
        <div className="mt-4 p-4 bg-muted rounded-lg space-y-2">
          <h4 className="text-sm font-medium">Installation Instructions</h4>
          {format === 'css' ? (
            <>
              <p className="text-xs text-muted-foreground">
                1. Copy the CSS code above
              </p>
              <p className="text-xs text-muted-foreground">
                2. Open your <code className="bg-background px-1 rounded">app/globals.css</code> file
              </p>
              <p className="text-xs text-muted-foreground">
                3. Replace the <code className="bg-background px-1 rounded">@layer base</code> section with the copied CSS
              </p>
              <p className="text-xs text-muted-foreground">
                4. Save the file and your theme will be applied
              </p>
            </>
          ) : (
            <>
              <p className="text-xs text-muted-foreground">
                1. Save the JSON configuration to a file
              </p>
              <p className="text-xs text-muted-foreground">
                2. Use the Import function to load this theme later
              </p>
              <p className="text-xs text-muted-foreground">
                3. Share the JSON with others to distribute your theme
              </p>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
