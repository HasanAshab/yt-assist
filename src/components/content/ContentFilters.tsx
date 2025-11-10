import React from 'react';
import type { ContentFilters } from '../../types';
import { CONTENT_STAGES, CONTENT_CATEGORIES } from '../../constants';

interface ContentFiltersComponentProps {
  filters: ContentFilters;
  onFilterChange: (filters: Partial<ContentFilters>) => void;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
  className?: string;
}

export const ContentFiltersComponent: React.FC<ContentFiltersComponentProps> = ({
  filters,
  onFilterChange,
  onClearFilters,
  hasActiveFilters,
  className = ''
}) => {
  const handleCategoryChange = (category: string) => {
    const newCategory = category === 'all' ? undefined : category as 'Demanding' | 'Innovative';
    onFilterChange({ category: newCategory });
  };

  const handleStageChange = (stage: string) => {
    const newStage = stage === 'all' ? undefined : parseInt(stage, 10);
    onFilterChange({ stage: newStage });
  };

  return (
    <div className={`bg-gray-50 border border-gray-200 rounded-lg p-4 ${className}`}>
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700 whitespace-nowrap">
            Filters:
          </span>
        </div>
        
        {/* Category Filter */}
        <div className="flex items-center gap-2">
          <label htmlFor="category-filter" className="text-sm text-gray-600 whitespace-nowrap">
            Category:
          </label>
          <select
            id="category-filter"
            value={filters.category || 'all'}
            onChange={(e) => handleCategoryChange(e.target.value)}
            className="text-sm border border-gray-300 rounded-md px-3 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Categories</option>
            {CONTENT_CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>
        
        {/* Stage Filter */}
        <div className="flex items-center gap-2">
          <label htmlFor="stage-filter" className="text-sm text-gray-600 whitespace-nowrap">
            Stage:
          </label>
          <select
            id="stage-filter"
            value={filters.stage !== undefined ? filters.stage.toString() : 'all'}
            onChange={(e) => handleStageChange(e.target.value)}
            className="text-sm border border-gray-300 rounded-md px-3 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Stages</option>
            {CONTENT_STAGES.map((stage, index) => (
              <option key={index} value={index.toString()}>
                {stage}
              </option>
            ))}
          </select>
        </div>
        
        {/* Clear Filters Button */}
        {hasActiveFilters && (
          <button
            onClick={onClearFilters}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium whitespace-nowrap"
          >
            Clear all
          </button>
        )}
      </div>
      
      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <div className="flex flex-wrap gap-2">
            <span className="text-xs text-gray-500">Active filters:</span>
            
            {filters.category && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                Category: {filters.category}
                <button
                  onClick={() => onFilterChange({ category: undefined })}
                  className="hover:text-blue-900"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </span>
            )}
            
            {filters.stage !== undefined && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                Stage: {CONTENT_STAGES[filters.stage]}
                <button
                  onClick={() => onFilterChange({ stage: undefined })}
                  className="hover:text-green-900"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </span>
            )}
            
            {filters.search && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                Search: "{filters.search}"
                <button
                  onClick={() => onFilterChange({ search: undefined })}
                  className="hover:text-purple-900"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};