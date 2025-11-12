import React, { useState, useCallback } from 'react';
import type { Content } from '../../types';
import { CONTENT_STAGES } from '../../constants';
import { ContentService } from '../../services/content.service';
import { useContent } from '../../hooks/useContent';
import { useErrorHandler } from '../../hooks/useErrorHandler';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { StageManager } from './StageManager';
import { ContentPipeline } from './ContentPipeline';

interface ContentDetailModalProps {
  content: Content;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (content: Content) => void;
  onDelete: (content: Content) => void;
}

export const ContentDetailModal: React.FC<ContentDetailModalProps> = ({
  content,
  isOpen,
  onClose,
  onEdit,
  onDelete
}) => {
  const { updateContent } = useContent();
  const { handleError } = useErrorHandler();
  const [isUpdating, setIsUpdating] = useState(false);
  const [localContent, setLocalContent] = useState(content);

  // Handle stage advancement for ContentPipeline
  const handleStageUpdate = useCallback(async (contentId: string, newStage: number) => {
    setIsUpdating(true);
    try {
      const updatedContent = await ContentService.updateContentStage(contentId, newStage);
      setLocalContent(updatedContent);
      updateContent(updatedContent);
    } catch (error) {
      handleError(error);
    } finally {
      setIsUpdating(false);
    }
  }, [updateContent, handleError]);

  // Handle stage advancement for StageManager
  const handleStageAdvance = useCallback(async (newStage: number) => {
    await handleStageUpdate(localContent.id, newStage);
  }, [handleStageUpdate, localContent.id]);

  // Handle final check toggle
  const handleFinalCheckToggle = useCallback(async (checkId: string) => {
    const updatedFinalChecks = localContent.final_checks.map(check =>
      check.id === checkId ? { ...check, completed: !check.completed } : check
    );

    setIsUpdating(true);
    try {
      const updatedContent = await ContentService.updateContent(localContent.id, {
        topic: localContent.topic,
        category: localContent.category,
        title: localContent.title,
        script: localContent.script,
        publish_after: localContent.publish_after,
        publish_before: localContent.publish_before,
        link: localContent.link,
        morals: localContent.morals
      });

      // Update final checks separately (this would need to be implemented in ContentService)
      const contentWithUpdatedChecks = { ...updatedContent, final_checks: updatedFinalChecks };
      setLocalContent(contentWithUpdatedChecks);
      updateContent(contentWithUpdatedChecks);
    } catch (error) {
      handleError(error);
    } finally {
      setIsUpdating(false);
    }
  }, [localContent, updateContent, handleError]);

  const handleEdit = () => {
    onEdit(localContent);
  };

  const handleDelete = () => {
    if (confirm(`Are you sure you want to delete "${localContent.topic}"?`)) {
      onDelete(localContent);
      onClose();
    }
  };

  if (!isOpen) return null;

  const currentStage = CONTENT_STAGES[localContent.current_stage];
  const isPublished = localContent.current_stage === CONTENT_STAGES.length - 1;
  const progressPercentage = ((localContent.current_stage + 1) / CONTENT_STAGES.length) * 100;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center p-0 sm:p-4 z-50 overflow-hidden">
      <div className="bg-white rounded-t-xl sm:rounded-lg shadow-xl w-full max-w-4xl h-[95vh] sm:max-h-[90vh] overflow-y-auto overflow-x-hidden">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-4 sm:px-6 py-4 overflow-x-hidden">
          <div className="flex items-start justify-between w-full">
            <div className="flex-1 min-w-0 pr-4 flex-safe">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 leading-tight text-safe">
                {localContent.topic}
              </h2>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${localContent.category === 'Demanding'
                  ? 'bg-red-100 text-red-800'
                  : 'bg-blue-100 text-blue-800'
                  }`}>
                  {localContent.category}
                </span>
                <span className={`text-sm font-medium flex-shrink-0 ${isPublished ? 'text-green-600' : 'text-blue-600'
                  }`}>
                  {currentStage}
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={isUpdating}
              className="flex-shrink-0 p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 touch-target"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Mobile Action Buttons */}
          <div className="flex gap-2 mt-4 sm:hidden">
            <button
              onClick={handleEdit}
              disabled={isUpdating}
              className="flex-1 px-4 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 touch-target"
            >
              Edit
            </button>
            <button
              onClick={handleDelete}
              disabled={isUpdating}
              className="flex-1 px-4 py-3 text-sm font-medium text-white bg-red-600 border border-transparent rounded-lg hover:bg-red-700 disabled:opacity-50 touch-target"
            >
              Delete
            </button>
          </div>

          {/* Desktop Action Buttons */}
          <div className="hidden sm:flex items-center gap-2 mt-4">
            <button
              onClick={handleEdit}
              disabled={isUpdating}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
            >
              Edit
            </button>
            <button
              onClick={handleDelete}
              disabled={isUpdating}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 disabled:opacity-50"
            >
              Delete
            </button>
          </div>
        </div>

        <div className="p-4 sm:p-6 space-y-6 pb-20 sm:pb-6 w-full overflow-x-hidden">
          {/* Progress Overview */}
          <div className="bg-gray-50 rounded-lg p-4 w-full">
            <div className="flex items-center justify-between mb-3 w-full">
              <h3 className="text-base sm:text-sm font-medium text-gray-700 flex-shrink-0">Progress</h3>
              <span className="text-base sm:text-sm text-gray-600 font-medium flex-shrink-0">{Math.round(progressPercentage)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4 sm:h-3">
              <div
                className={`h-4 sm:h-3 rounded-full transition-all duration-300 ${isPublished ? 'bg-green-500' : 'bg-blue-500'
                  }`}
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>

          {/* Content Pipeline Visualization */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Pipeline Progress</h3>
            <ContentPipeline
              content={localContent}
              onStageUpdate={handleStageUpdate}
            />
          </div>

          {/* Stage Management */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Stage Management</h3>
            <StageManager
              content={localContent}
              onStageAdvance={handleStageAdvance}
              disabled={isUpdating}
            />
          </div>

          {/* Content Details */}
          <div className="space-y-6 w-full overflow-x-hidden">
            {/* Basic Information */}
            <div className="space-y-4 w-full">
              <h3 className="text-lg font-medium text-gray-900">Content Details</h3>

              {localContent.title && (
                <div className="w-full">
                  <label className="block text-base sm:text-sm font-medium text-gray-700 mb-2">Title</label>
                  <p className="text-base sm:text-sm text-gray-900 bg-gray-50 rounded-lg p-4 text-safe w-full">
                    {localContent.title}
                  </p>
                </div>
              )}

              {localContent.script && (
                <div className="w-full">
                  <label className="block text-base sm:text-sm font-medium text-gray-700 mb-2">Script</label>
                  <div className="text-base sm:text-sm text-gray-900 bg-gray-50 rounded-lg p-4 max-h-100 sm:max-h-32 overflow-y-auto overflow-x-hidden w-full">
                    <pre className="whitespace-pre-wrap font-sans leading-relaxed text-safe w-full">{localContent.script}</pre>
                  </div>
                </div>
              )}

              {localContent.link && (
                <div className="w-full">
                  <label className="block text-base sm:text-sm font-medium text-gray-700 mb-2">Link</label>
                  <a
                    href={localContent.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-base sm:text-sm text-blue-600 hover:text-blue-800 bg-gray-50 rounded-lg p-4 block text-safe touch-target w-full"
                  >
                    {localContent.link}
                  </a>
                </div>
              )}

              {/* Dependencies */}
              {(localContent.publish_after || localContent.publish_before) && (
                <div className="w-full">
                  <label className="block text-base sm:text-sm font-medium text-gray-700 mb-3">Dependencies</label>
                  <div className="space-y-3 w-full">
                    {localContent.publish_after && (
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-base sm:text-sm text-gray-600 w-full">
                        <span className="font-medium flex-shrink-0">Publish after:</span>
                        <span className="bg-gray-100 px-3 py-2 rounded-lg text-safe flex-1 min-w-0">{localContent.publish_after}</span>
                      </div>
                    )}
                    {localContent.publish_before && (
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-base sm:text-sm text-gray-600 w-full">
                        <span className="font-medium flex-shrink-0">Publish before:</span>
                        <span className="bg-gray-100 px-3 py-2 rounded-lg text-safe flex-1 min-w-0">{localContent.publish_before}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Morals */}
              {localContent.morals && localContent.morals.length > 0 && (
                <div className="w-full">
                  <label className="block text-base sm:text-sm font-medium text-gray-700 mb-3">Morals</label>
                  <div className="space-y-2 w-full">
                    {localContent.morals.map((moral, index) => (
                      <div key={index} className="text-base sm:text-sm text-gray-900 bg-gray-50 rounded-lg p-3 text-safe w-full">
                        {moral}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Final Checks */}
            <div className="space-y-4 w-full">
              <h3 className="text-lg font-medium text-gray-900">Final Checks</h3>

              {localContent.final_checks && localContent.final_checks.length > 0 ? (
                <div className="space-y-3 w-full">
                  {localContent.final_checks.map((check) => (
                    <div key={check.id} className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg touch-target w-full">
                      <input
                        type="checkbox"
                        checked={check.completed}
                        onChange={() => handleFinalCheckToggle(check.id)}
                        disabled={isUpdating}
                        className="mt-1 h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:opacity-50 flex-shrink-0"
                      />
                      <span className={`text-base sm:text-sm flex-1 leading-relaxed text-safe min-w-0 ${check.completed ? 'text-gray-500 line-through' : 'text-gray-900'
                        }`}>
                        {check.text}
                      </span>
                      {isUpdating && (
                        <LoadingSpinner size="sm" />
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-base sm:text-sm text-gray-500 italic">No final checks defined</p>
              )}

              {/* Completion Status */}
              {localContent.final_checks && localContent.final_checks.length > 0 && (
                <div className="mt-4 p-4 bg-blue-50 rounded-lg w-full">
                  <div className="flex items-center justify-between text-base sm:text-sm mb-3 w-full">
                    <span className="font-medium text-blue-900 flex-shrink-0">Completion Status</span>
                    <span className="text-blue-700 font-medium flex-shrink-0">
                      {localContent.final_checks.filter(check => check.completed).length} / {localContent.final_checks.length}
                    </span>
                  </div>
                  <div className="w-full bg-blue-200 rounded-full h-3">
                    <div
                      className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                      style={{
                        width: `${(localContent.final_checks.filter(check => check.completed).length / localContent.final_checks.length) * 100}%`
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Metadata */}
          <div className="border-t pt-4 w-full">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-base sm:text-sm text-gray-600 w-full">
              <div className="text-safe">
                <span className="font-medium">Created:</span><br className="sm:hidden" />
                <span className="sm:ml-1">{new Date(localContent.created_at).toLocaleString()}</span>
              </div>
              <div className="text-safe">
                <span className="font-medium">Updated:</span><br className="sm:hidden" />
                <span className="sm:ml-1">{new Date(localContent.updated_at).toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};