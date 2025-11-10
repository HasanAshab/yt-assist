import React, { useState, useMemo, useCallback } from 'react';
import type { Content, ContentFilters } from '../../types';
import { CONTENT_STAGES, CONTENT_CATEGORIES } from '../../constants';
import { useContent } from '../../hooks/useContent';
import { ContentCard } from './ContentCard';
import { VirtualizedContentList } from './VirtualizedContentList';
import { ContentFilters as ContentFiltersComponent } from './ContentFilters';
import { SearchInput } from '../common/SearchInput';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { EmptyState } from '../common/EmptyState';

interface ContentListProps {
  className?: string;
  onContentSelect?: (content: Content) => void;
  onContentEdit?: (content: Content) => void;
  onContentDelete?: (content: Content) => void;
  onContentView?: (content: Content) => void;
  showFilters?: boolean;
  showSearch?: boolean;
  layout?: 'grid' | 'list';
}

export const ContentList: React.FC<ContentListProps> = ({
  className = '',
  onContentSelect,
  onContentEdit,
  onContentDelete,
  onContentView,
  showFilters = true,
  showSearch = true,
  layout = 'grid'
}) => {
  const { 
    contents, 
    filters, 
    loading, 
    filteredContents, 
    setFilters 
  } = useContent();

  const [localLayout, setLocalLayout] = useState<'grid' | 'list'>(layout);

  // Handle filter changes
  const handleFilterChange = useCallback((newFilters: Partial<ContentFilters>) => {
    setFilters(newFilters);
  }, [setFilters]);

  // Handle search
  const handleSearch = useCallback((searchTerm: string) => {
    handleFilterChange({ search: searchTerm });
  }, [handleFilterChange]);

  // Clear all filters
  const handleClearFilters = useCallback(() => {
    setFilters({ category: undefined, stage: undefined, search: undefined });
  }, [setFilters]);

  // Check if any filters are active
  const hasActiveFilters = useMemo(() => {
    return !!(filters.category || filters.stage !== undefined || filters.search);
  }, [filters]);

  // Get filtered and sorted contents
  const displayContents = useMemo(() => {
    return filteredContents.sort((a, b) => {
      // Sort by stage first (ascending), then by updated_at (descending)
      if (a.current_stage !== b.current_stage) {
        return a.current_stage - b.current_stage;
      }
      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
    });
  }, [filteredContents]);

  // Loading state
  if (loading) {
    return (
      <div className={`flex justify-center items-center min-h-64 ${className}`}>
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header with search and layout toggle */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex-1 w-full sm:w-auto">
          {showSearch && (
            <SearchInput
              placeholder="Search by topic or title..."
              value={filters.search || ''}
              onChange={handleSearch}
              className="w-full sm:max-w-md"
            />
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {/* Layout toggle */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setLocalLayout('grid')}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                localLayout === 'grid'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Grid
            </button>
            <button
              onClick={() => setLocalLayout('list')}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                localLayout === 'list'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              List
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <ContentFiltersComponent
          filters={filters}
          onFilterChange={handleFilterChange}
          onClearFilters={handleClearFilters}
          hasActiveFilters={hasActiveFilters}
        />
      )}

      {/* Results summary */}
      <div className="flex items-center justify-between text-sm text-gray-600">
        <span>
          {displayContents.length} of {contents.length} content{contents.length !== 1 ? 's' : ''}
          {hasActiveFilters && ' (filtered)'}
        </span>
        
        {hasActiveFilters && (
          <button
            onClick={handleClearFilters}
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Content list */}
      {displayContents.length === 0 ? (
        <EmptyState
          title={hasActiveFilters ? "No content matches your filters" : "No content yet"}
          description={
            hasActiveFilters 
              ? "Try adjusting your filters or search terms to find content."
              : "Create your first piece of content to get started with your pipeline."
          }
          action={
            hasActiveFilters ? (
              <button
                onClick={handleClearFilters}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Clear filters
              </button>
            ) : undefined
          }
        />
      ) : displayContents.length > 50 ? (
        // Use virtualized list for large datasets
        <VirtualizedContentList
          contents={displayContents}
          layout={localLayout}
          onContentSelect={onContentSelect}
          onContentEdit={onContentEdit}
          onContentDelete={onContentDelete}
          onContentView={onContentView}
        />
      ) : (
        // Use regular rendering for smaller datasets
        <div
          className={
            localLayout === 'grid'
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
              : 'space-y-4'
          }
        >
          {displayContents.map((content) => (
            <ContentCard
              key={content.id}
              content={content}
              layout={localLayout}
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
};