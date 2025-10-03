'use client';

import { LayoutGrid, List, LayoutDashboard } from 'lucide-react';
import { Button } from '@/components/ui/button';

type ViewType = 'masonry' | 'grid' | 'list';

interface ViewToggleProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
}

export function ViewToggle({ currentView, onViewChange }: ViewToggleProps) {
  return (
    <div className="flex items-center gap-1 p-1 bg-muted rounded-lg">
      <Button
        variant={currentView === 'masonry' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onViewChange('masonry')}
        className="gap-2"
        title="Masonry View"
      >
        <LayoutDashboard className="w-4 h-4" />
        <span className="hidden sm:inline">Masonry</span>
      </Button>
      <Button
        variant={currentView === 'grid' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onViewChange('grid')}
        className="gap-2"
        title="Grid View"
      >
        <LayoutGrid className="w-4 h-4" />
        <span className="hidden sm:inline">Grid</span>
      </Button>
      <Button
        variant={currentView === 'list' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onViewChange('list')}
        className="gap-2"
        title="List View"
      >
        <List className="w-4 h-4" />
        <span className="hidden sm:inline">List</span>
      </Button>
    </div>
  );
}
