import React, { useState, useEffect } from 'react';
import { SuggestionService } from '../../services/suggestion.service';
import { CONTENT_STAGES } from '../../constants';
import type { ContentSuggestion } from '../../types';

interface PublicationSuggestionsProps {
  onContentSelect?: (contentId: string) => void;
  onRefresh?: () => void;
  className?: string;
}

/**
 * Component displaying top 2 publication suggestions
 * Requirements: 5.1, 5.2, 5.3
 */
export const PublicationSuggestions: React.FC<PublicationSuggestionsProps> = ({
  onContentSelect,
  onRefresh,
  className = ''
}) => {
  const [suggestions, setSuggestions] = useState<ContentSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSuggestions = async () => {
    try {
      setLoading(true);
      setError(null);
      const newSuggestions = await SuggestionService.getPublicationSuggestions();
      setSuggestions(newSuggestions);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load suggestions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSuggestions();
  }, []);

  const handleRefresh = async () => {
    await loadSuggestions();
    onRefresh?.();
  };

  const handleContentClick = (contentId: string) => {
    onContentSelect?.(contentId);
  };

  const getStageProgress = (currentStage: number): number => {
    return Math.round((currentStage / (CONTENT_STAGES.length - 1)) * 100);
  };

  const getScoreColor = (score: number): string => {
    if (score >= 100) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getProgressBarColor = (score: number): string => {
    if (score >= 100) return 'bg-green-500';
    if (score >= 70) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Publication Suggestions</h2>
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
        </div>
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Publication Suggestions</h2>
          <button
            onClick={handleRefresh}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            Retry
          </button>
        </div>
        <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-800">Publication Suggestions</h2>
        <button
          onClick={handleRefresh}
          className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>

      {suggestions.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-gray-400 mb-2">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-gray-600 font-medium">No publication suggestions available</p>
          <p className="text-gray-500 text-sm mt-1">
            All contents are either published or blocked by dependencies
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {suggestions.map((suggestion, index) => (
            <div
              key={suggestion.content.id}
              className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => handleContentClick(suggestion.content.id)}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded">
                      #{index + 1}
                    </span>
                    <h3 className="font-semibold text-gray-800 truncate">
                      {suggestion.content.topic}
                    </h3>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    {suggestion.content.title || 'No title set'}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span className="bg-gray-100 px-2 py-1 rounded">
                      {suggestion.content.category}
                    </span>
                    <span>
                      Stage: {CONTENT_STAGES[suggestion.content.current_stage]}
                    </span>
                  </div>
                </div>
                <div className="text-right ml-4">
                  <div className={`text-lg font-bold ${getScoreColor(suggestion.score)}`}>
                    {Math.round(suggestion.score)}
                  </div>
                  <div className="text-xs text-gray-500">Readiness</div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-3">
                <div className="flex justify-between text-xs text-gray-600 mb-1">
                  <span>Progress to Published</span>
                  <span>{getStageProgress(suggestion.content.current_stage)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${getProgressBarColor(suggestion.score)}`}
                    style={{ width: `${getStageProgress(suggestion.content.current_stage)}%` }}
                  ></div>
                </div>
              </div>

              {/* Remaining Steps */}
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                  <span className="text-gray-600">
                    {suggestion.remainingSteps} steps remaining
                  </span>
                </div>
                <div className="text-blue-600 font-medium">
                  Next: {CONTENT_STAGES[Math.min(suggestion.content.current_stage + 1, CONTENT_STAGES.length - 1)]}
                </div>
              </div>

              {/* Requirements Status */}
              <div className="mt-3 pt-3 border-t border-gray-100">
                <div className="flex flex-wrap gap-2 text-xs">
                  <span className={`px-2 py-1 rounded ${
                    suggestion.content.title 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    Title {suggestion.content.title ? '✓' : '○'}
                  </span>
                  <span className={`px-2 py-1 rounded ${
                    suggestion.content.script 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    Script {suggestion.content.script ? '✓' : '○'}
                  </span>
                  <span className={`px-2 py-1 rounded ${
                    suggestion.content.link 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    Link {suggestion.content.link ? '✓' : '○'}
                  </span>
                  {suggestion.content.final_checks.length > 0 && (
                    <span className={`px-2 py-1 rounded ${
                      suggestion.content.final_checks.every(check => check.completed)
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      Final Checks {suggestion.content.final_checks.filter(c => c.completed).length}/{suggestion.content.final_checks.length}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {suggestions.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-100 text-center">
          <p className="text-xs text-gray-500">
            Showing top {suggestions.length} content{suggestions.length !== 1 ? 's' : ''} closest to publication
          </p>
        </div>
      )}
    </div>
  );
};

export default PublicationSuggestions;