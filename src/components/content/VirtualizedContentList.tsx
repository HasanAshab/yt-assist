import React, { useMemo, useRef, useEffect, useState } from 'react';
import type { Content } from '../../types';
import { ContentCard } from './ContentCard';
import { VirtualScrollList } from '../common/VirtualScrollList';

interface VirtualizedContentListProps {
  contents: Content[];
  layout: 'grid' | 'list';
  onContentSelect?: (content: Content) => void;
  onContentEdit?: (content: Content) => void;
  onContentDelete?: (content: Content) => void;
  onContentView?: (content: Content) => void;
  className?: string;
}

const ITEM_HEIGHTS = {
  list: 120, // Height for list layout items
  grid: 280, // Height for grid layout items
};

const GRID_COLUMNS = {
  sm: 1,
  md: 2,
  lg: 3,
};

export const VirtualizedContentList: React.FC<VirtualizedContentListProps> = ({
  contents,
  layout,
  onContentSelect,
  onContentEdit,
  onContentDelete,
  onContentView,
  className = ''
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerHeight, setContainerHeight] = useState(600);
  const [screenSize, setScreenSize] = useState<'sm' | 'md' | 'lg'>('lg');

  // Update container height on resize
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setContainerHeight(Math.max(400, window.innerHeight - rect.top - 100));
      }
      
      // Update screen size
      const width = window.innerWidth;
      if (width < 768) {
        setScreenSize('sm');
      } else if (width < 1024) {
        setScreenSize('md');
      } else {
        setScreenSize('lg');
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // Prepare items for virtual scrolling
  const virtualItems = useMemo(() => {
    if (layout === 'list') {
      return contents.map(content => ({ content, type: 'single' as const }));
    }
    
    // For grid layout, group items by rows
    const columns = GRID_COLUMNS[screenSize];
    const rows = [];
    for (let i = 0; i < contents.length; i += columns) {
      rows.push({
        contents: contents.slice(i, i + columns),
        type: 'row' as const
      });
    }
    return rows;
  }, [contents, layout, screenSize]);

  const itemHeight = ITEM_HEIGHTS[layout];

  // Render function for virtual scroll
  const renderItem = (item: any, index: number) => {
    if (item.type === 'single') {
      // List layout - single item
      return (
        <div className="px-4">
          <ContentCard
            content={item.content}
            layout="list"
            onSelect={onContentSelect}
            onEdit={onContentEdit}
            onDelete={onContentDelete}
            onView={onContentView}
          />
        </div>
      );
    } else {
      // Grid layout - row of items
      const columns = GRID_COLUMNS[screenSize];
      return (
        <div className={`px-4 grid gap-6 ${
          columns === 1 ? 'grid-cols-1' :
          columns === 2 ? 'grid-cols-2' :
          'grid-cols-3'
        }`}>
          {item.contents.map((content: Content) => (
            <ContentCard
              key={content.id}
              content={content}
              layout="grid"
              onSelect={onContentSelect}
              onEdit={onContentEdit}
              onDelete={onContentDelete}
              onView={onContentView}
            />
          ))}
        </div>
      );
    }
  };

  // Fallback for small lists (< 20 items) - no need for virtualization
  if (contents.length < 20) {
    return (
      <div className={className}>
        {layout === 'grid' ? (
          <div className={`grid gap-6 ${
            screenSize === 'sm' ? 'grid-cols-1' :
            screenSize === 'md' ? 'grid-cols-2' :
            'grid-cols-3'
          }`}>
            {contents.map((content) => (
              <ContentCard
                key={content.id}
                content={content}
                layout="grid"
                onSelect={onContentSelect}
                onEdit={onContentEdit}
                onDelete={onContentDelete}
                onView={onContentView}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {contents.map((content) => (
              <ContentCard
                key={content.id}
                content={content}
                layout="list"
                onSelect={onContentSelect}
                onEdit={onContentEdit}
                onDelete={onContentDelete}
                onView={onContentView}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div ref={containerRef} className={className}>
      <VirtualScrollList
        items={virtualItems}
        itemHeight={itemHeight}
        containerHeight={containerHeight}
        renderItem={renderItem}
        overscan={3}
        className="w-full"
      />
    </div>
  );
};