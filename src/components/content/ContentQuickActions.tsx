import React, { useState, useEffect } from 'react';
import type { Content } from '../../types';
import { ContentService } from '../../services/content.service';
import { useContent } from '../../hooks/useContent';
import { useErrorHandler } from '../../hooks/useErrorHandler';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { CONTENT_STAGES } from '../../constants';

interface ContentQuickActionsProps {
  className?: string;
}

export const ContentQuickActions: React.FC<ContentQuickActionsProps> = ({
  className = ''
}) => {
  const { contents } = useContent();
  const { handleError } = useErrorHandler();
  const [readyToAdvance, setReadyToAdvance] = useState<Content[]>([]);
  const [loading, setLoading] = useState(false);
  const [advancing, setAdvancing] = useState<string | null>(null);

  // Find contents ready to advance
  useEffect(() => {
    const findReadyContents = async () => {
      setLoading(true);
      try {
        const ready = await ContentService.getContentsReadyForNextStage();
        setReadyToAdvance(ready.slice(0, 5)); // Show top 5
      } catch (error) {
        handleError(error);
      } finally {
        setLoading(false);
      }
    };

    if (contents.length > 0) {
      findReadyContents();
    }
  }, [contents, handleError]);

  // Quick advance content
  const handleQuickAdvance = async (content: Content) => {
    setAdvancing(content.id);
    try {
      await ContentService.updateContentStage(content.id, content.current_stage + 1);
      // Remove from ready list
      setReadyToAdvance(prev => prev.filter(c => c.id !== content.id));
    } catch (error) {
      handleError(error);
    } finally {
      setAdvancing(null);
    }
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
        <div className="flex items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow ${className}`}>
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Ready to Advance</h3>
          <span className="text-sm text-gray-500">
            {readyToAdvance.length} content{readyToAdvance.length !== 1 ? 's' : ''}
          </span>
        </div>

        {readyToAdvance.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-sm text-gray-500">No content ready to advance</p>
            <p className="text-xs text-gray-400 mt-1">
              Complete requirements to advance content through the pipeline
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {readyToAdvance.map((content) => {
              const nextStage = content.current_stage + 1;
              const nextStageName = CONTENT_STAGES[nextStage];
              const isAdvancing = advancing === content.id;

              return (
                <div
                  key={content.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-gray-900 truncate">
                      {content.topic}
                    </h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-500">
                        {CONTENT_STAGES[content.current_stage]}
                      </span>
                      <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                      <span className="text-xs text-blue-600 font-medium">
                        {nextStageName}
                      </span>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => handleQuickAdvance(content)}
                    disabled={isAdvancing}
                    className="ml-3 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1"
                  >
                    {isAdvancing ? (
                      <LoadingSpinner size="sm" />
                    ) : (
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    )}
                    Advance
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};