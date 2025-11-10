import React, { useState, useCallback } from 'react';
import type { Content, FinalCheck } from '../../types';
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

  // Handle stage advancement
  const handleStageAdvance = useCallback(async (newStage: number) => {
    setIsUpdating(true);
    try {
      const updatedContent = await ContentService.updateContentStage(localContent.id, newStage);
      setLocalContent(updatedContent);
      updateContent(updatedContent);
    } catch (error) {
      handleError(error);
    } finally {
      setIsUpdating(false);
    }
  }, [localContent.id, updateContent, handleError]);

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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-semibold text-gray-900 truncate">
                {localContent.topic}
              </h2>
              <div className="flex items-center gap-3 mt-1">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  localContent.category === 'Demanding' 
                    ? 'bg-red-100 text-red-800' 
                    : 'bg-blue-100 text-blue-800'
                }`}>
                  {localContent.category}
                </span>
                <span className={`text-sm font-medium ${
                  isPublished ? 'text-green-600' : 'text-blue-600'
                }`}>
                  {currentStage}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 ml-4">
              <button
                onClick={handleEdit}
                disabled={isUpdating}
                className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
              >
                Edit
              </button>
              <button
                onClick={handleDelete}
                disabled={isUpdating}
                className="px-3 py-1.5 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 disabled:opacity-50"
              >
                Delete
              </button>
              <button
                onClick={onClose}
                disabled={isUpdating}
                className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Progress Overview */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-700">Progress</h3>
              <span className="text-sm text-gray-600">{Math.round(progressPercentage)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all duration-300 ${
                  isPublished ? 'bg-green-500' : 'bg-blue-500'
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
              onStageClick={handleStageAdvance}
              disabled={isUpdating}
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Content Details</h3>
              
              {localContent.title && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                  <p className="text-sm text-gray-900 bg-gray-50 rounded-md p-3">
                    {localContent.title}
                  </p>
                </div>
              )}

              {localContent.script && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Script</label>
                  <div className="text-sm text-gray-900 bg-gray-50 rounded-md p-3 max-h-32 overflow-y-auto">
                    <pre className="whitespace-pre-wrap font-sans">{localContent.script}</pre>
                  </div>
                </div>
              )}

              {localContent.link && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Link</label>
                  <a
                    href={localContent.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:text-blue-800 bg-gray-50 rounded-md p-3 block break-all"
                  >
                    {localContent.link}
                  </a>
                </div>
              )}

              {/* Dependencies */}
              {(localContent.publish_after || localContent.publish_before) && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Dependencies</label>
                  <div className="space-y-2">
                    {localContent.publish_after && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <span className="font-medium">Publish after:</span>
                        <span className="bg-gray-100 px-2 py-1 rounded">{localContent.publish_after}</span>
                      </div>
                    )}
                    {localContent.publish_before && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <span className="font-medium">Publish before:</span>
                        <span className="bg-gray-100 px-2 py-1 rounded">{localContent.publish_before}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Morals */}
              {localContent.morals && localContent.morals.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Morals</label>
                  <div className="space-y-1">
                    {localContent.morals.map((moral, index) => (
                      <div key={index} className="text-sm text-gray-900 bg-gray-50 rounded-md p-2">
                        {moral}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Final Checks */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Final Checks</h3>
              
              {localContent.final_checks && localContent.final_checks.length > 0 ? (
                <div className="space-y-2">
                  {localContent.final_checks.map((check) => (
                    <div key={check.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-md">
                      <input
                        type="checkbox"
                        checked={check.completed}
                        onChange={() => handleFinalCheckToggle(check.id)}
                        disabled={isUpdating}
                        className="mt-0.5 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:opacity-50"
                      />
                      <span className={`text-sm flex-1 ${
                        check.completed ? 'text-gray-500 line-through' : 'text-gray-900'
                      }`}>
                        {check.text || check.description}
                      </span>
                      {isUpdating && (
                        <LoadingSpinner size="sm" />
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 italic">No final checks defined</p>
              )}

              {/* Completion Status */}
              {localContent.final_checks && localContent.final_checks.length > 0 && (
                <div className="mt-4 p-3 bg-blue-50 rounded-md">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-blue-900">Completion Status</span>
                    <span className="text-blue-700">
                      {localContent.final_checks.filter(check => check.completed).length} / {localContent.final_checks.length}
                    </span>
                  </div>
                  <div className="mt-2 w-full bg-blue-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
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
          <div className="border-t pt-4">
            <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
              <div>
                <span className="font-medium">Created:</span> {new Date(localContent.created_at).toLocaleString()}
              </div>
              <div>
                <span className="font-medium">Updated:</span> {new Date(localContent.updated_at).toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};