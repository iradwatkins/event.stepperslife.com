'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, CheckCircle2, Info } from 'lucide-react';

interface ThemePreviewProps {
  mode: 'light' | 'dark';
}

export function ThemePreview({ mode }: ThemePreviewProps) {
  return (
    <div className={mode === 'dark' ? 'dark' : ''}>
      <div className="min-h-screen bg-background p-8 space-y-6 transition-colors duration-300">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">Theme Preview</h1>
            <p className="text-muted-foreground">
              Preview your theme with sample UI components
            </p>
          </div>

          {/* Primary Colors Card */}
          <Card>
            <CardHeader>
              <CardTitle>Primary Theme Colors</CardTitle>
              <CardDescription>
                Examples of primary color usage in the theme
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2 flex-wrap">
                <Button>Primary Button</Button>
                <Button variant="secondary">Secondary Button</Button>
                <Button variant="outline">Outline Button</Button>
                <Button variant="ghost">Ghost Button</Button>
                <Button variant="destructive">Destructive Button</Button>
              </div>

              <div className="flex gap-2 flex-wrap">
                <Badge>Default Badge</Badge>
                <Badge variant="secondary">Secondary Badge</Badge>
                <Badge variant="outline">Outline Badge</Badge>
                <Badge variant="destructive">Destructive Badge</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Form Elements */}
          <Card>
            <CardHeader>
              <CardTitle>Form Elements</CardTitle>
              <CardDescription>
                Input fields and form components
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="Enter your email" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <textarea
                  id="message"
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="Type your message here"
                />
              </div>

              <Button className="w-full">Submit Form</Button>
            </CardContent>
          </Card>

          {/* Alerts */}
          <div className="space-y-4">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>Information</AlertTitle>
              <AlertDescription>
                This is an informational alert using default styling.
              </AlertDescription>
            </Alert>

            <Alert className="bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800">
              <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
              <AlertTitle className="text-green-800 dark:text-green-200">Success</AlertTitle>
              <AlertDescription className="text-green-700 dark:text-green-300">
                This is a success alert showing positive feedback.
              </AlertDescription>
            </Alert>

            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>
                This is an error alert using destructive styling.
              </AlertDescription>
            </Alert>
          </div>

          {/* Muted Content */}
          <Card className="bg-muted">
            <CardHeader>
              <CardTitle>Muted Background</CardTitle>
              <CardDescription>
                This card uses the muted background color
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                This text uses the muted foreground color, which provides lower contrast
                for secondary information.
              </p>
            </CardContent>
          </Card>

          {/* Charts */}
          <Card>
            <CardHeader>
              <CardTitle>Chart Colors</CardTitle>
              <CardDescription>
                Preview of chart color palette
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 h-32">
                <div className="flex-1 bg-[var(--chart-1)] rounded-md" />
                <div className="flex-1 bg-[var(--chart-2)] rounded-md" />
                <div className="flex-1 bg-[var(--chart-3)] rounded-md" />
                <div className="flex-1 bg-[var(--chart-4)] rounded-md" />
                <div className="flex-1 bg-[var(--chart-5)] rounded-md" />
              </div>
              <div className="mt-4 grid grid-cols-5 gap-2 text-center text-xs text-muted-foreground">
                <div>Chart 1</div>
                <div>Chart 2</div>
                <div>Chart 3</div>
                <div>Chart 4</div>
                <div>Chart 5</div>
              </div>
            </CardContent>
          </Card>

          {/* Sidebar Preview */}
          <Card className="bg-sidebar border-sidebar-border">
            <CardHeader>
              <CardTitle className="text-sidebar-foreground">Sidebar Colors</CardTitle>
              <CardDescription className="text-sidebar-foreground/70">
                Preview of sidebar-specific colors
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                className="w-full justify-start bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90"
              >
                Sidebar Primary
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              >
                Sidebar Item
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              >
                Another Item
              </Button>
            </CardContent>
          </Card>

          {/* Typography */}
          <Card>
            <CardHeader>
              <CardTitle>Typography</CardTitle>
              <CardDescription>
                Font family examples
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Sans Serif (Default)</p>
                <p className="text-lg" style={{ fontFamily: 'var(--font-sans)' }}>
                  The quick brown fox jumps over the lazy dog
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Serif</p>
                <p className="text-lg" style={{ fontFamily: 'var(--font-serif)' }}>
                  The quick brown fox jumps over the lazy dog
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Monospace</p>
                <p className="text-lg" style={{ fontFamily: 'var(--font-mono)' }}>
                  The quick brown fox jumps over the lazy dog
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Border Radius */}
          <Card>
            <CardHeader>
              <CardTitle>Border Radius</CardTitle>
              <CardDescription>
                Current radius value: <code className="text-xs bg-muted px-1 py-0.5 rounded">var(--radius)</code>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-1 h-24 bg-primary rounded-sm flex items-center justify-center text-primary-foreground text-xs">
                  Small
                </div>
                <div className="flex-1 h-24 bg-primary rounded-md flex items-center justify-center text-primary-foreground text-xs">
                  Medium
                </div>
                <div className="flex-1 h-24 bg-primary rounded-lg flex items-center justify-center text-primary-foreground text-xs">
                  Large
                </div>
                <div className="flex-1 h-24 bg-primary rounded-xl flex items-center justify-center text-primary-foreground text-xs">
                  XL
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
