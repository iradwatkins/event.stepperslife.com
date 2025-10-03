'use client';

import React from 'react';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';

interface LetterSpacingControlProps {
  value: string;
  onChange: (value: string) => void;
}

export function LetterSpacingControl({ value, onChange }: LetterSpacingControlProps) {
  // Convert em value to slider value (0-10 range for -0.05em to 0.05em)
  const parseValue = (val: string): number => {
    const num = parseFloat(val);
    if (isNaN(num)) return 5; // default middle
    // Map -0.05 to 0.05 range to 0-10
    return Math.round(((num + 0.05) / 0.1) * 10);
  };

  const formatValue = (sliderVal: number): string => {
    // Map 0-10 to -0.05 to 0.05
    const em = ((sliderVal / 10) * 0.1) - 0.05;
    return `${em.toFixed(3)}em`;
  };

  const sliderValue = parseValue(value);

  const handleSliderChange = (values: number[]) => {
    const val = values[0];
    if (val !== undefined) {
      onChange(formatValue(val));
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">Letter Spacing</Label>
        <Input
          type="text"
          value={value}
          onChange={handleInputChange}
          className="w-24 h-8 text-xs text-right"
          placeholder="0em"
        />
      </div>
      <Slider
        value={[sliderValue]}
        onValueChange={handleSliderChange}
        min={0}
        max={10}
        step={0.1}
        className="w-full"
      />
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>Tight</span>
        <span>Normal</span>
        <span>Wide</span>
      </div>
    </div>
  );
}
