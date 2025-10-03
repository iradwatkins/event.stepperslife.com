'use client';

import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';

interface FontOption {
  value: string;
  label: string;
  category: 'sans-serif' | 'serif' | 'monospace';
}

// Popular Google Fonts organized by category
export const FONT_OPTIONS: FontOption[] = [
  // Sans-Serif Fonts
  { value: 'Inter, system-ui, sans-serif', label: 'Inter', category: 'sans-serif' },
  { value: 'Roboto, sans-serif', label: 'Roboto', category: 'sans-serif' },
  { value: 'Open Sans, sans-serif', label: 'Open Sans', category: 'sans-serif' },
  { value: 'Lato, sans-serif', label: 'Lato', category: 'sans-serif' },
  { value: 'Montserrat, sans-serif', label: 'Montserrat', category: 'sans-serif' },
  { value: 'Poppins, sans-serif', label: 'Poppins', category: 'sans-serif' },
  { value: 'Raleway, sans-serif', label: 'Raleway', category: 'sans-serif' },
  { value: 'Work Sans, sans-serif', label: 'Work Sans', category: 'sans-serif' },
  { value: 'Nunito, sans-serif', label: 'Nunito', category: 'sans-serif' },
  { value: 'system-ui, sans-serif', label: 'System UI', category: 'sans-serif' },

  // Serif Fonts
  { value: 'Georgia, serif', label: 'Georgia', category: 'serif' },
  { value: 'Merriweather, serif', label: 'Merriweather', category: 'serif' },
  { value: 'Playfair Display, serif', label: 'Playfair Display', category: 'serif' },
  { value: 'Lora, serif', label: 'Lora', category: 'serif' },
  { value: 'PT Serif, serif', label: 'PT Serif', category: 'serif' },
  { value: 'Crimson Text, serif', label: 'Crimson Text', category: 'serif' },
  { value: 'Libre Baskerville, serif', label: 'Libre Baskerville', category: 'serif' },

  // Monospace Fonts
  { value: 'JetBrains Mono, monospace', label: 'JetBrains Mono', category: 'monospace' },
  { value: 'Fira Code, monospace', label: 'Fira Code', category: 'monospace' },
  { value: 'Source Code Pro, monospace', label: 'Source Code Pro', category: 'monospace' },
  { value: 'IBM Plex Mono, monospace', label: 'IBM Plex Mono', category: 'monospace' },
  { value: 'Roboto Mono, monospace', label: 'Roboto Mono', category: 'monospace' },
  { value: 'Menlo, Monaco, monospace', label: 'Menlo', category: 'monospace' },
  { value: 'Consolas, monospace', label: 'Consolas', category: 'monospace' },
];

interface FontSelectorProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  category?: 'sans-serif' | 'serif' | 'monospace';
}

export function FontSelector({ label, value, onChange, category }: FontSelectorProps) {
  const options = category
    ? FONT_OPTIONS.filter((opt) => opt.category === category)
    : FONT_OPTIONS;

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select a font..." />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem
              key={option.value}
              value={option.value}
              style={{ fontFamily: option.value }}
            >
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
