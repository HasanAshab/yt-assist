import React, { useState, useMemo, useCallback } from 'react';
import type { Content, ContentFilters } from '../../types';
import { CONTENT_STAGES } from '../../constants';
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
  layout = 'list'
}) => {
  const {
    contents,
    filters,
    loading,
    filteredContents,
    setFilters
  } = useContent();

  const [localLayout, setLocalLayout] = useState<'grid' | 'list'>(layout);
  const [showPublished, setShowPublished] = useState(false);

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

  // Separate published and unpublished contents
  const { publishedContents, unpublishedContents } = useMemo(() => {
    const published: Content[] = [];
    const unpublished: Content[] = [];

    filteredContents.forEach(content => {
      if (content.current_stage === 11) { // Published stage
        published.push(content);
      } else {
        unpublished.push(content);
      }
    });

    // Sort both lists by updated_at (descending) - most recent first
    const sortByDate = (a: Content, b: Content) =>
      new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();

    return {
      publishedContents: published.sort(sortByDate),
      unpublishedContents: unpublished.sort(sortByDate)
    };
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
    <div className={`space-y-6 w-full overflow-x-hidden ${className}`}>
      {/* Header with search and layout toggle */}
      <div className="flex flex-col gap-4 w-full">
        <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between w-full">
          <div className="flex-1 min-w-0">
            {showSearch && (
              <SearchInput
                placeholder="Search by topic or title..."
                value={filters.search || ''}
                onChange={handleSearch}
                className="w-full"
              />
            )}
          </div>

          <div className="flex items-center justify-center sm:justify-end flex-shrink-0">
            {/* Layout toggle */}
            <div className="flex bg-gray-100 rounded-lg p-1 w-full sm:w-auto max-w-xs sm:max-w-none">
              <button
                onClick={() => setLocalLayout('grid')}
                className={`flex-1 sm:flex-none px-4 py-2 sm:px-3 sm:py-1 rounded text-base sm:text-sm font-medium transition-colors touch-target ${localLayout === 'grid'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
                  }`}
              >
                Grid
              </button>
              <button
                onClick={() => setLocalLayout('list')}
                className={`flex-1 sm:flex-none px-4 py-2 sm:px-3 sm:py-1 rounded text-base sm:text-sm font-medium transition-colors touch-target ${localLayout === 'list'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
                  }`}
              >
                List
              </button>
            </div>
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
      <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between text-base sm:text-sm text-gray-600">
        <span>
          {unpublishedContents.length + publishedContents.length} of {contents.length} content{contents.length !== 1 ? 's' : ''}
          {hasActiveFilters && ' (filtered)'}
          {unpublishedContents.length > 0 && publishedContents.length > 0 &&
            ` • ${unpublishedContents.length} in progress, ${publishedContents.length} published`
          }
        </span>

        {hasActiveFilters && (
          <button
            onClick={handleClearFilters}
            className="text-blue-600 hover:text-blue-800 font-medium text-left sm:text-right touch-target py-1"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Content lists */}
      {unpublishedContents.length === 0 && publishedContents.length === 0 ? (
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
      ) : (
        <div className="space-y-8">
          {/* Unpublished Content */}
          {unpublishedContents.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
                In Progress ({unpublishedContents.length})
              </h3>
              {unpublishedContents.length > 50 ? (
                <VirtualizedContentList
                  contents={unpublishedContents}
                  layout={localLayout}
                  onContentSelect={onContentSelect}
                  onContentEdit={onContentEdit}
                  onContentDelete={onContentDelete}
                  onContentView={onContentView}
                />
              ) : (
                <div
                  className={
                    localLayout === 'grid'
                      ? 'responsive-grid w-full'
                      : 'space-y-4 w-full'
                  }
                >
                  {unpublishedContents.map((content) => (
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
          )}

          {/* Published Content Toggle */}
          {publishedContents.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                <h3 className="text-lg font-semibold text-gray-900">
                  Published ({publishedContents.length})
                </h3>
                <button
                  onClick={() => setShowPublished(!showPublished)}
                  className="inline-flex items-center px-3 py-1 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
                >
                  {showPublished ? (
                    <>
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                      </svg>
                      Hide
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                      Show
                    </>
                  )}
                </button>
              </div>

              {showPublished && (
                <>
                  {publishedContents.length > 50 ? (
                    <VirtualizedContentList
                      contents={publishedContents}
                      layout={localLayout}
                      onContentSelect={onContentSelect}
                      onContentEdit={onContentEdit}
                      onContentDelete={onContentDelete}
                      onContentView={onContentView}
                    />
                  ) : (
                    <div
                      className={
                        localLayout === 'grid'
                          ? 'responsive-grid w-full'
                          : 'space-y-4 w-full'
                      }
                    >
                      {publishedContents.map((content) => (
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
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};