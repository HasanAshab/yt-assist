import React, { useState, useEffect, useMemo } from 'react';
import { MoralsService, type MoralEntry } from '../../services/morals.service';
import { SearchInput } from '../common/SearchInput';

interface MoralsListProps {
  className?: string;
}

interface MoralsFilters {
  search: string;
  topic: string;
}

/**
 * Component for displaying all morals from content with filtering and search
 */
export const MoralsList: React.FC<MoralsListProps> = ({ className = '' }) => {
  const [morals, setMorals] = useState<MoralEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<MoralsFilters>({
    search: '',
    topic: ''
  });
  const [availableTopics, setAvailableTopics] = useState<string[]>([]);

  // Load morals and topics on component mount
  useEffect(() => {
    loadMorals();
    loadTopics();
  }, []);

  const loadMorals = async () => {
    try {
      setLoading(true);
      setError(null);
      const allMorals = await MoralsService.getAllMorals();
      setMorals(allMorals);
    } catch (err) {
      setError('Failed to load morals');
      console.error('Error loading morals:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadTopics = async () => {
    try {
      const topics = await MoralsService.getTopicsWithMorals();
      setAvailableTopics(topics);
    } catch (err) {
      console.error('Error loading topics:', err);
    }
  };

  // Filter morals based on search and topic filters
  const filteredMorals = useMemo(() => {
    let filtered = morals;

    // Apply search filter
    if (filters.search.trim()) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(moral => 
        moral.text.toLowerCase().includes(searchTerm) ||
        moral.contentTopic.toLowerCase().includes(searchTerm)
      );
    }

    // Apply topic filter
    if (filters.topic) {
      filtered = filtered.filter(moral => moral.contentTopic === filters.topic);
    }

    return filtered;
  }, [morals, filters]);

  const handleSearchChange = (search: string) => {
    setFilters(prev => ({ ...prev, search }));
  };

  const handleTopicChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setFilters(prev => ({ ...prev, topic: event.target.value }));
  };

  const clearFilters = () => {
    setFilters({ search: '', topic: '' });
  };

  const handleMoralClick = (moral: MoralEntry) => {
    // Navigate to content edit page (implementation depends on routing setup)
    console.log('Navigate to content:', moral.contentId);
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading morals...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error</h3>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
        </div>
        <div className="mt-4">
          <button
            onClick={loadMorals}
            className="bg-red-100 hover:bg-red-200 text-red-800 px-3 py-1 rounded text-sm font-medium transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Content Morals</h2>
          <p className="text-gray-600 mt-1">
            {filteredMorals.length} of {morals.length} morals
          </p>
        </div>
        
        {/* Export Actions */}
        <div className="flex gap-2">
          <button
            onClick={async () => {
              const text = await MoralsService.exportMoralsAsText();
              navigator.clipboard.writeText(text);
              // Show toast notification (implementation depends on toast system)
              console.log('Morals copied to clipboard');
            }}
            className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            Copy All
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg border border-gray-200 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search Input */}
          <div className="flex-1">
            <SearchInput
              value={filters.search}
              onChange={handleSearchChange}
              placeholder="Search morals or content topics..."
              className="w-full"
            />
          </div>

          {/* Topic Filter */}
          <div className="sm:w-64">
            <select
              value={filters.topic}
              onChange={handleTopicChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Topics</option>
              {availableTopics.map(topic => (
                <option key={topic} value={topic}>
                  {topic}
                </option>
              ))}
            </select>
          </div>

          {/* Clear Filters */}
          {(filters.search || filters.topic) && (
            <button
              onClick={clearFilters}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Morals List */}
      {filteredMorals.length === 0 ? (
        <div className="text-center py-12">
          <div className="mx-auto h-12 w-12 text-gray-400">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No morals found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {filters.search || filters.topic 
              ? 'Try adjusting your filters to see more results.'
              : 'No content has morals defined yet.'
            }
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredMorals.map((moral) => (
            <MoralCard
              key={moral.id}
              moral={moral}
              onClick={() => handleMoralClick(moral)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

/**
 * Individual moral card component
 */
interface MoralCardProps {
  moral: MoralEntry;
  onClick: () => void;
}

const MoralCard: React.FC<MoralCardProps> = ({ moral, onClick }) => {
  return (
    <div 
      className="bg-white border border-gray-200 rounded-lg p-4 hover:border-gray-300 hover:shadow-sm transition-all cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-gray-900 font-medium leading-relaxed">
            {moral.text}
          </p>
          <div className="mt-2 flex items-center text-sm text-gray-500">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              {moral.contentTopic}
            </span>
          </div>
        </div>
        
        {/* Action Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClick();
          }}
          className="ml-4 flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
          title="View content"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default MoralsList;