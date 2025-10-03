'use client';

import React, { useState } from 'react';
import { ColorSection } from './ColorSection';
import { ThemeImporter } from './ThemeImporter';
import { ThemeExporter } from './ThemeExporter';
import { ThemePreview } from './ThemePreview';
import { TypographySidebar } from './TypographySidebar';
import { TypographyShowcase } from './TypographyShowcase';
import { useTheme } from '@/lib/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Sun,
  Moon,
  Undo,
  Redo,
  RotateCcw,
  Palette,
  Type,
  Settings,
  Eye,
  Upload,
  Download
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// Color groups matching the Figma screenshots
const colorGroups = {
  primary: [
    { key: 'background', label: 'Background', variableName: 'background' },
    { key: 'foreground', label: 'Foreground', variableName: 'foreground' },
    { key: 'primary', label: 'Primary', variableName: 'primary' },
    { key: 'primary-foreground', label: 'Primary Foreground', variableName: 'primary-foreground' },
  ],
  secondary: [
    { key: 'secondary', label: 'Secondary', variableName: 'secondary' },
    { key: 'secondary-foreground', label: 'Secondary Foreground', variableName: 'secondary-foreground' },
  ],
  accent: [
    { key: 'accent', label: 'Accent', variableName: 'accent' },
    { key: 'accent-foreground', label: 'Accent Foreground', variableName: 'accent-foreground' },
  ],
  card: [
    { key: 'card', label: 'Card', variableName: 'card' },
    { key: 'card-foreground', label: 'Card Foreground', variableName: 'card-foreground' },
  ],
  popover: [
    { key: 'popover', label: 'Popover', variableName: 'popover' },
    { key: 'popover-foreground', label: 'Popover Foreground', variableName: 'popover-foreground' },
  ],
  muted: [
    { key: 'muted', label: 'Muted', variableName: 'muted' },
    { key: 'muted-foreground', label: 'Muted Foreground', variableName: 'muted-foreground' },
  ],
  destructive: [
    { key: 'destructive', label: 'Destructive', variableName: 'destructive' },
    { key: 'destructive-foreground', label: 'Destructive Foreground', variableName: 'destructive-foreground' },
  ],
  border: [
    { key: 'border', label: 'Border', variableName: 'border' },
    { key: 'input', label: 'Input', variableName: 'input' },
    { key: 'ring', label: 'Ring', variableName: 'ring' },
  ],
  chart: [
    { key: 'chart-1', label: 'Chart 1', variableName: 'chart-1' },
    { key: 'chart-2', label: 'Chart 2', variableName: 'chart-2' },
    { key: 'chart-3', label: 'Chart 3', variableName: 'chart-3' },
    { key: 'chart-4', label: 'Chart 4', variableName: 'chart-4' },
    { key: 'chart-5', label: 'Chart 5', variableName: 'chart-5' },
  ],
  sidebar: [
    { key: 'sidebar', label: 'Sidebar Background', variableName: 'sidebar' },
    { key: 'sidebar-foreground', label: 'Sidebar Foreground', variableName: 'sidebar-foreground' },
    { key: 'sidebar-primary', label: 'Sidebar Primary', variableName: 'sidebar-primary' },
    { key: 'sidebar-primary-foreground', label: 'Sidebar Primary Foreground', variableName: 'sidebar-primary-foreground' },
    { key: 'sidebar-accent', label: 'Sidebar Accent', variableName: 'sidebar-accent' },
    { key: 'sidebar-accent-foreground', label: 'Sidebar Accent Foreground', variableName: 'sidebar-accent-foreground' },
    { key: 'sidebar-border', label: 'Sidebar Border', variableName: 'sidebar-border' },
    { key: 'sidebar-ring', label: 'Sidebar Ring', variableName: 'sidebar-ring' },
  ],
};

export function ThemeEditorEnhanced() {
  const {
    theme,
    updateTheme,
    updateTypography,
    updateRadius,
    resetTheme,
    currentMode,
    setCurrentMode,
    undo,
    redo,
    canUndo,
    canRedo,
    isModified,
  } = useTheme();

  const [activeView, setActiveView] = useState<'colors' | 'typography'>('colors');
  const [activeTab, setActiveTab] = useState('colors');
  const [showPreview, setShowPreview] = useState(false);

  const handleColorChange = (key: string, value: string) => {
    const updates = { [key]: value } as any;
    updateTheme(currentMode, updates);
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar - Changes based on view */}
      {activeView === 'colors' ? (
        <div className="w-80 border-r border-border flex flex-col bg-card">
          {/* Sidebar Header */}
          <div className="p-4 border-b border-border">
            <div className="flex items-center gap-2 mb-4">
              <Palette className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-bold">Theme Editor</h1>
            </div>

            {/* Mode Toggle */}
            <div className="flex gap-2">
              <Button
                variant={currentMode === 'light' ? 'default' : 'outline'}
                size="sm"
                className="flex-1"
                onClick={() => setCurrentMode('light')}
              >
                <Sun className="h-4 w-4 mr-2" />
                Light
              </Button>
              <Button
                variant={currentMode === 'dark' ? 'default' : 'outline'}
                size="sm"
                className="flex-1"
                onClick={() => setCurrentMode('dark')}
              >
                <Moon className="h-4 w-4 mr-2" />
                Dark
              </Button>
            </div>
          </div>

          {/* Color Sections */}
          <ScrollArea className="flex-1">
            <div className="p-4 space-y-2">
              <ColorSection
                title="Primary Colors"
                colors={colorGroups.primary}
                values={theme[currentMode]}
                onChange={handleColorChange}
              />
              <ColorSection
                title="Secondary Colors"
                colors={colorGroups.secondary}
                values={theme[currentMode]}
                onChange={handleColorChange}
              />
              <ColorSection
                title="Accent Colors"
                colors={colorGroups.accent}
                values={theme[currentMode]}
                onChange={handleColorChange}
              />
              <ColorSection
                title="Card Colors"
                colors={colorGroups.card}
                values={theme[currentMode]}
                onChange={handleColorChange}
                defaultExpanded={false}
              />
              <ColorSection
                title="Popover Colors"
                colors={colorGroups.popover}
                values={theme[currentMode]}
                onChange={handleColorChange}
                defaultExpanded={false}
              />
              <ColorSection
                title="Muted Colors"
                colors={colorGroups.muted}
                values={theme[currentMode]}
                onChange={handleColorChange}
                defaultExpanded={false}
              />
              <ColorSection
                title="Destructive Colors"
                colors={colorGroups.destructive}
                values={theme[currentMode]}
                onChange={handleColorChange}
                defaultExpanded={false}
              />
              <ColorSection
                title="Border & Input Colors"
                colors={colorGroups.border}
                values={theme[currentMode]}
                onChange={handleColorChange}
                defaultExpanded={false}
              />
              <ColorSection
                title="Chart Colors"
                colors={colorGroups.chart}
                values={theme[currentMode]}
                onChange={handleColorChange}
                defaultExpanded={false}
              />
              <ColorSection
                title="Sidebar Colors"
                colors={colorGroups.sidebar}
                values={theme[currentMode]}
                onChange={handleColorChange}
                defaultExpanded={false}
              />
            </div>
          </ScrollArea>
        </div>
      ) : (
        <TypographySidebar />
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          {/* Top Navigation */}
          <div className="border-b border-border bg-card">
            <div className="flex items-center justify-between p-4">
              <TabsList>
                <TabsTrigger
                  value="colors"
                  onClick={() => setActiveView('colors')}
                >
                  <Palette className="h-4 w-4 mr-2" />
                  Colors
                </TabsTrigger>
                <TabsTrigger
                  value="typography"
                  onClick={() => setActiveView('typography')}
                >
                  <Type className="h-4 w-4 mr-2" />
                  Typography
                </TabsTrigger>
                <TabsTrigger value="other">
                  <Settings className="h-4 w-4 mr-2" />
                  Other
                </TabsTrigger>
                <TabsTrigger value="import">
                  <Upload className="h-4 w-4 mr-2" />
                  Import
                </TabsTrigger>
                <TabsTrigger value="export">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </TabsTrigger>
              </TabsList>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={undo}
                  disabled={!canUndo}
                  title="Undo"
                >
                  <Undo className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={redo}
                  disabled={!canRedo}
                  title="Redo"
                >
                  <Redo className="h-4 w-4" />
                </Button>
                <Separator orientation="vertical" className="h-6" />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPreview(!showPreview)}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  {showPreview ? 'Hide' : 'Show'} Preview
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={resetTheme}
                  disabled={!isModified}
                >
                  <RotateCcw className="h-4 w-4" />
                  Reset
                </Button>
              </div>
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-auto">
            {showPreview ? (
              <ThemePreview mode={currentMode} />
            ) : (
              <div className="p-8 max-w-7xl mx-auto">
                <TabsContent value="colors" className="mt-0">
                <Card>
                  <CardHeader>
                    <CardTitle>Color Palette Editor</CardTitle>
                    <CardDescription>
                      Use the sidebar to edit colors for the {currentMode} theme.
                      Click on any color circle to open the advanced color picker with OKLCH controls.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {Object.entries(theme[currentMode]).slice(0, 8).map(([key, value]) => (
                        <div key={key} className="text-center">
                          <div
                            className="w-full aspect-square rounded-lg border-2 mb-2"
                            style={{ backgroundColor: `var(--${key})` }}
                          />
                          <p className="text-xs font-medium">{key}</p>
                          <code className="text-xs text-muted-foreground">--{key}</code>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="typography" className="mt-0">
                <TypographyShowcase
                  fontFamily={theme.typography['font-sans']}
                  fontCategory="sans-serif"
                />
              </TabsContent>

              <TabsContent value="other" className="mt-0">
                <Card>
                  <CardHeader>
                    <CardTitle>Other Settings</CardTitle>
                    <CardDescription>
                      Configure border radius and other theme properties
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="radius">Border Radius</Label>
                      <Input
                        id="radius"
                        value={theme.other.radius}
                        onChange={(e) => updateRadius(e.target.value)}
                        placeholder="0.5rem"
                      />
                      <p className="text-xs text-muted-foreground">
                        Examples: 0.5rem, 0.75rem, 1rem, 1.3rem
                      </p>
                    </div>

                    <div className="pt-4 border-t">
                      <h4 className="text-sm font-medium mb-3">Preview</h4>
                      <div className="flex gap-4">
                        <div className="flex-1 h-20 bg-primary rounded-sm flex items-center justify-center text-primary-foreground text-xs">
                          Small
                        </div>
                        <div className="flex-1 h-20 bg-primary rounded-md flex items-center justify-center text-primary-foreground text-xs">
                          Medium
                        </div>
                        <div className="flex-1 h-20 bg-primary rounded-lg flex items-center justify-center text-primary-foreground text-xs">
                          Large
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="import" className="mt-0 space-y-4">
                <ThemeImporter />
              </TabsContent>

              <TabsContent value="export" className="mt-0 space-y-4">
                <ThemeExporter />
              </TabsContent>
            </div>
          )}
          </div>
        </Tabs>
      </div>
    </div>
  );
}
