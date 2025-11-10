import React, { useState } from 'react';
import type { Content } from '../../types';
import { CONTENT_STAGES } from '../../constants';
import { ContentService } from '../../services/content.service';
import { useContent } from '../../hooks/useContent';
import { useErrorHandler } from '../../hooks/useErrorHandler';
import { LoadingSpinner } from '../common/LoadingSpinner';

interface ContentActionsProps {
  content: Content;
  onEdit?: (content: Content) => void;
  onView?: (content: Content) => void;
  onDelete?: (content: Content) => void;
  showAdvanceStage?: boolean;
  compact?: boolean;
}

export const ContentActions: React.FC<ContentActionsProps> = ({
  content,
  onEdit,
  onView,
  onDelete,
  showAdvanceStage = true,
  compact = false
}) => {
  const { updateContent } = useContent();
  const { handleError } = useErrorHandler();
  const [isAdvancing, setIsAdvancing] = useState(false);

  const canAdvanceStage = content.current_stage < CONTENT_STAGES.length - 1;
  const nextStage = content.current_stage + 1;
  const nextStageName = CONTENT_STAGES[nextStage];

  // Quick stage advancement
  const handleQuickAdvance = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!canAdvanceStage) return;

    setIsAdvancing(true);
    try {
      // Validate stage requirements first
      const validation = ContentService.validateStageRequirements(content, nextStage);
      if (!validation.isValid) {
        alert(`Cannot advance: ${validation.errors.join(', ')}`);
        return;
      }

      // For published stage, check dependencies
      if (nextStage === CONTENT_STAGES.length - 1) {
        const depValidation = await ContentService.validatePublishDependencies(content);
        if (!depValidation.isValid) {
          alert(`Cannot publish: ${depValidation.errors.join(', ')}`);
          return;
        }
      }

      const updatedContent = await ContentService.updateContentStage(content.id, nextStage);
      updateContent(updatedContent);
    } catch (error) {
      handleError(error);
    } finally {
      setIsAdvancing(false);
    }
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit?.(content);
  };

  const handleView = (e: React.MouseEvent) => {
    e.stopPropagation();
    onView?.(content);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete?.(content);
  };

  if (compact) {
    return (
      <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
        {/* View/Details */}
        {onView && (
          <button
            onClick={handleView}
            className="p-2 sm:p-1.5 text-gray-400 hover:text-gray-600 transition-colors touch-target rounded-lg hover:bg-gray-100 flex-shrink-0"
            title="View details"
          >
            <svg className="w-5 h-5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </button>
        )}

        {/* Quick Advance */}
        {showAdvanceStage && canAdvanceStage && (
          <button
            onClick={handleQuickAdvance}
            disabled={isAdvancing}
            className="p-2 sm:p-1.5 text-gray-400 hover:text-green-600 transition-colors disabled:opacity-50 touch-target rounded-lg hover:bg-green-50 flex-shrink-0"
            title={`Advance to ${nextStageName}`}
          >
            {isAdvancing ? (
              <LoadingSpinner size="sm" />
            ) : (
              <svg className="w-5 h-5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            )}
          </button>
        )}

        {/* Edit */}
        {onEdit && (
          <button
            onClick={handleEdit}
            className="p-2 sm:p-1.5 text-gray-400 hover:text-blue-600 transition-colors touch-target rounded-lg hover:bg-blue-50 flex-shrink-0"
            title="Edit content"
          >
            <svg className="w-5 h-5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
        )}

        {/* Delete */}
        {onDelete && (
          <button
            onClick={handleDelete}
            className="p-2 sm:p-1.5 text-gray-400 hover:text-red-600 transition-colors touch-target rounded-lg hover:bg-red-50 flex-shrink-0"
            title="Delete content"
          >
            <svg className="w-5 h-5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
      {/* View Details */}
      {onView && (
        <button
          onClick={handleView}
          className="px-4 py-3 sm:px-3 sm:py-1.5 text-base sm:text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors touch-target flex-shrink-0"
        >
          View Details
        </button>
      )}

      {/* Quick Stage Advance */}
      {showAdvanceStage && canAdvanceStage && (
        <button
          onClick={handleQuickAdvance}
          disabled={isAdvancing}
          className="px-4 py-3 sm:px-3 sm:py-1.5 text-base sm:text-sm font-medium text-white bg-green-600 border border-transparent rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2 touch-target flex-shrink-0"
        >
          {isAdvancing && <LoadingSpinner size="sm" />}
          <svg className="w-5 h-5 sm:w-4 sm:h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
          <span className="hidden sm:inline whitespace-nowrap">Advance to {nextStageName}</span>
          <span className="sm:hidden">Next Stage</span>
        </button>
      )}

      {/* Published Badge */}
      {!canAdvanceStage && (
        <span className="px-4 py-3 sm:px-3 sm:py-1.5 text-base sm:text-sm font-medium text-green-800 bg-green-100 border border-green-200 rounded-lg text-center flex-shrink-0">
          Published
        </span>
      )}

      {/* Edit */}
      {onEdit && (
        <button
          onClick={handleEdit}
          className="px-4 py-3 sm:px-3 sm:py-1.5 text-base sm:text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors touch-target flex-shrink-0"
        >
          Edit
        </button>
      )}

      {/* Delete */}
      {onDelete && (
        <button
          onClick={handleDelete}
          className="px-4 py-3 sm:px-3 sm:py-1.5 text-base sm:text-sm font-medium text-white bg-red-600 border border-transparent rounded-lg hover:bg-red-700 transition-colors touch-target flex-shrink-0"
        >
          Delete
        </button>
      )}
    </div>
  );
};