'use client';

import React, { useState } from 'react';
import { FontSelector } from './FontSelector';
import { LetterSpacingControl } from './LetterSpacingControl';
import { useTheme, TypographySettings } from '@/lib/contexts/ThemeContext';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

export function TypographySidebar() {
  const { theme, updateTypography } = useTheme();
  const [expandedSections, setExpandedSections] = useState({
    fontFamily: true,
    letterSpacing: true,
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const handleUpdate = (key: keyof TypographySettings, value: string | number) => {
    updateTypography({ [key]: value } as Partial<TypographySettings>);
  };

  return (
    <div className="w-80 border-r border-border bg-card flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <h2 className="text-lg font-semibold">Font Family</h2>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          {/* Font Family Section */}
          <div className="space-y-4">
            <div>
              <Button
                variant="ghost"
                className="w-full justify-between p-2 h-auto"
                onClick={() => toggleSection('fontFamily')}
              >
                <span className="text-sm font-medium">Sans-Serif Font</span>
                {expandedSections.fontFamily ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </Button>

              {expandedSections.fontFamily && (
                <div className="mt-3 space-y-4">
                  <FontSelector
                    label="Sans-Serif"
                    value={theme.typography['font-sans']}
                    onChange={(value) => handleUpdate('font-sans', value)}
                    category="sans-serif"
                  />

                  <FontSelector
                    label="Serif Font"
                    value={theme.typography['font-serif']}
                    onChange={(value) => handleUpdate('font-serif', value)}
                    category="serif"
                  />

                  <FontSelector
                    label="Monospace Font"
                    value={theme.typography['font-mono']}
                    onChange={(value) => handleUpdate('font-mono', value)}
                    category="monospace"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Letter Spacing Section */}
          <div>
            <Button
              variant="ghost"
              className="w-full justify-between p-2 h-auto mb-3"
              onClick={() => toggleSection('letterSpacing')}
            >
              <span className="text-sm font-medium">Letter Spacing</span>
              {expandedSections.letterSpacing ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>

            {expandedSections.letterSpacing && (
              <div className="space-y-4">
                <LetterSpacingControl
                  value={theme.typography['letter-spacing']}
                  onChange={(value) => handleUpdate('letter-spacing', value)}
                />

                {/* Line Height */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Line Height</Label>
                    <Input
                      type="text"
                      value={theme.typography['line-height']}
                      onChange={(e) => handleUpdate('line-height', e.target.value)}
                      className="w-20 h-8 text-xs text-right"
                    />
                  </div>
                  <Slider
                    value={[parseFloat(theme.typography['line-height']) || 1.5]}
                    onValueChange={([v]) => v !== undefined && handleUpdate('line-height', v.toFixed(2))}
                    min={1}
                    max={2.5}
                    step={0.1}
                    className="w-full"
                  />
                </div>

                {/* Font Size Base */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Base Font Size</Label>
                    <Input
                      type="text"
                      value={theme.typography['font-size-base']}
                      onChange={(e) => handleUpdate('font-size-base', e.target.value)}
                      className="w-20 h-8 text-xs text-right"
                    />
                  </div>
                  <Slider
                    value={[parseInt(theme.typography['font-size-base']) || 16]}
                    onValueChange={([v]) => v !== undefined && handleUpdate('font-size-base', `${v}px`)}
                    min={12}
                    max={24}
                    step={1}
                    className="w-full"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Font Weights */}
          <div className="space-y-3 pt-4 border-t">
            <h3 className="text-sm font-medium">Font Weights</h3>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-xs text-muted-foreground">Light</Label>
                <Input
                  type="number"
                  value={theme.typography['font-weight-light']}
                  onChange={(e) => handleUpdate('font-weight-light', parseInt(e.target.value))}
                  className="w-16 h-7 text-xs text-right"
                  min={100}
                  max={900}
                  step={100}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label className="text-xs text-muted-foreground">Regular</Label>
                <Input
                  type="number"
                  value={theme.typography['font-weight-regular']}
                  onChange={(e) => handleUpdate('font-weight-regular', parseInt(e.target.value))}
                  className="w-16 h-7 text-xs text-right"
                  min={100}
                  max={900}
                  step={100}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label className="text-xs text-muted-foreground">Medium</Label>
                <Input
                  type="number"
                  value={theme.typography['font-weight-medium']}
                  onChange={(e) => handleUpdate('font-weight-medium', parseInt(e.target.value))}
                  className="w-16 h-7 text-xs text-right"
                  min={100}
                  max={900}
                  step={100}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label className="text-xs text-muted-foreground">Semibold</Label>
                <Input
                  type="number"
                  value={theme.typography['font-weight-semibold']}
                  onChange={(e) => handleUpdate('font-weight-semibold', parseInt(e.target.value))}
                  className="w-16 h-7 text-xs text-right"
                  min={100}
                  max={900}
                  step={100}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label className="text-xs text-muted-foreground">Bold</Label>
                <Input
                  type="number"
                  value={theme.typography['font-weight-bold']}
                  onChange={(e) => handleUpdate('font-weight-bold', parseInt(e.target.value))}
                  className="w-16 h-7 text-xs text-right"
                  min={100}
                  max={900}
                  step={100}
                />
              </div>
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
