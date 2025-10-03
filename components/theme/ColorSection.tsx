'use client';

import React, { useState } from 'react';
import { ColorPicker } from './ColorPicker';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeColors } from '@/lib/contexts/ThemeContext';

interface ColorItem {
  key: string;
  label: string;
  variableName: string;
}

interface ColorSectionProps {
  title: string;
  colors: ColorItem[];
  values: ThemeColors | Record<string, string>;
  onChange: (key: string, value: string) => void;
  defaultExpanded?: boolean;
}

export function ColorSection({
  title,
  colors,
  values,
  onChange,
  defaultExpanded = true,
}: ColorSectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div className="border-b border-border last:border-b-0">
      <Button
        variant="ghost"
        className="w-full justify-between p-4 h-auto hover:bg-muted/50"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <span className="text-sm font-medium">{title}</span>
        {isExpanded ? (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        )}
      </Button>

      {isExpanded && (
        <div className="p-4 pt-0 space-y-4">
          {colors.map(({ key, label, variableName }) => (
            <ColorPicker
              key={key}
              label={label}
              variableName={variableName}
              value={(values as any)[key] || '#000000'}
              onChange={(value) => onChange(key, value)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
