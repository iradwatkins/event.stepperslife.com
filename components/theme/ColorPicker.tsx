'use client';

import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Slider } from '@/components/ui/slider';

interface ColorPickerProps {
  label: string;
  variableName: string;
  value: string;
  onChange: (value: string) => void;
  showHex?: boolean;
}

// Convert OKLCH to hex (approximate)
function oklchToHex(oklch: string): string {
  try {
    const match = oklch.match(/oklch\(([\d.]+)\s+([\d.]+)\s+([\d.]+)\)/);
    if (!match) return '#000000';

    const [, l, c, h] = match.map(Number);

    // Create a temporary element to convert
    const temp = document.createElement('div');
    temp.style.color = oklch;
    document.body.appendChild(temp);
    const computed = window.getComputedStyle(temp).color;
    document.body.removeChild(temp);

    // Parse rgb
    const rgbMatch = computed.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (!rgbMatch) return '#000000';

    const [, r, g, b] = rgbMatch.map(Number);
    return '#' + [r!, g!, b!].map(x => {
      const hex = x.toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    }).join('');
  } catch (e) {
    return '#000000';
  }
}

// Convert hex to OKLCH (approximate)
function hexToOklch(hex: string): string {
  try {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;

    // Simple conversion (this is approximate)
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const l = (max + min) / 2;

    let h = 0;
    let c = 0;

    if (max !== min) {
      const d = max - min;
      c = l > 0.5 ? d / (2 - max - min) : d / (max + min);

      switch (max) {
        case r:
          h = ((g - b) / d + (g < b ? 6 : 0)) * 60;
          break;
        case g:
          h = ((b - r) / d + 2) * 60;
          break;
        case b:
          h = ((r - g) / d + 4) * 60;
          break;
      }
    }

    return `oklch(${l.toFixed(4)} ${c.toFixed(4)} ${h.toFixed(4)})`;
  } catch (e) {
    return 'oklch(0 0 0)';
  }
}

// Parse OKLCH string
function parseOklch(oklch: string): { l: number; c: number; h: number } {
  const match = oklch.match(/oklch\(([\d.]+)\s+([\d.]+)\s+([\d.]+)\)/);
  if (!match) return { l: 0, c: 0, h: 0 };
  const [, l, c, h] = match.map(Number);
  return { l: l!, c: c!, h: h! };
}

// Format OKLCH string
function formatOklch(l: number, c: number, h: number): string {
  return `oklch(${l.toFixed(4)} ${c.toFixed(4)} ${h.toFixed(4)})`;
}

export function ColorPicker({ label, variableName, value, onChange, showHex = true }: ColorPickerProps) {
  // Check if value is hex or oklch
  const isHexValue = value.startsWith('#');
  const [hexValue, setHexValue] = useState(isHexValue ? value : oklchToHex(value));
  const [oklch, setOklch] = useState(isHexValue ? parseOklch(hexToOklch(value)) : parseOklch(value));
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const isHex = value.startsWith('#');
    if (isHex) {
      setHexValue(value);
      setOklch(parseOklch(hexToOklch(value)));
    } else {
      setOklch(parseOklch(value));
      setHexValue(oklchToHex(value));
    }
  }, [value]);

  const updateOklch = (key: 'l' | 'c' | 'h', newValue: number) => {
    const updated = { ...oklch, [key]: newValue };
    setOklch(updated);
    const oklchString = formatOklch(updated.l, updated.c, updated.h);
    const hex = oklchToHex(oklchString);
    setHexValue(hex);
    // Output HEX value instead of OKLCH
    onChange(hex);
  };

  const handleHexChange = (hex: string) => {
    if (/^#[0-9A-F]{6}$/i.test(hex)) {
      setHexValue(hex);
      // Output HEX value directly
      onChange(hex);
      setOklch(parseOklch(hexToOklch(hex)));
    }
  };

  return (
    <div className="space-y-2">
      <Label htmlFor={variableName} className="text-sm font-medium">
        {label}
      </Label>
      <div className="flex gap-2 items-center">
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="w-12 h-12 p-0 border-2"
              style={{ backgroundColor: hexValue }}
              aria-label={`Pick color for ${label}`}
            >
              <span className="sr-only">Pick color</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80" align="start">
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <Label className="text-xs">Preview</Label>
                  {showHex && (
                    <Input
                      type="text"
                      value={hexValue}
                      onChange={(e) => handleHexChange(e.target.value.toUpperCase())}
                      className="w-24 h-7 text-xs font-mono"
                      placeholder="#000000"
                    />
                  )}
                </div>
                <div
                  className="w-full h-16 rounded-md border-2"
                  style={{ backgroundColor: hexValue }}
                />
              </div>

              <div className="space-y-3">
                <div>
                  <div className="flex justify-between mb-2">
                    <Label className="text-xs">Lightness (L)</Label>
                    <span className="text-xs text-muted-foreground">{oklch.l.toFixed(4)}</span>
                  </div>
                  <Slider
                    value={[oklch.l]}
                    onValueChange={([v]) => v !== undefined && updateOklch('l', v)}
                    min={0}
                    max={1}
                    step={0.0001}
                    className="w-full"
                  />
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <Label className="text-xs">Chroma (C)</Label>
                    <span className="text-xs text-muted-foreground">{oklch.c.toFixed(4)}</span>
                  </div>
                  <Slider
                    value={[oklch.c]}
                    onValueChange={([v]) => v !== undefined && updateOklch('c', v)}
                    min={0}
                    max={0.4}
                    step={0.0001}
                    className="w-full"
                  />
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <Label className="text-xs">Hue (H)</Label>
                    <span className="text-xs text-muted-foreground">{oklch.h.toFixed(4)}°</span>
                  </div>
                  <Slider
                    value={[oklch.h]}
                    onValueChange={([v]) => v !== undefined && updateOklch('h', v)}
                    min={0}
                    max={360}
                    step={0.0001}
                    className="w-full"
                  />
                </div>
              </div>

              <div className="pt-2 border-t">
                <Label className="text-xs text-muted-foreground">OKLCH Value</Label>
                <code className="block mt-1 p-2 bg-muted rounded text-xs font-mono break-all">
                  {formatOklch(oklch.l, oklch.c, oklch.h)}
                </code>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        <div className="flex-1">
          <Input
            id={variableName}
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="font-mono text-xs"
            placeholder="oklch(0 0 0)"
          />
        </div>

        {showHex && (
          <div className="w-24">
            <Input
              type="text"
              value={hexValue}
              onChange={(e) => handleHexChange(e.target.value.toUpperCase())}
              className="font-mono text-xs"
              placeholder="#000000"
            />
          </div>
        )}
      </div>
      <p className="text-xs text-muted-foreground">--{variableName}</p>
    </div>
  );
}
