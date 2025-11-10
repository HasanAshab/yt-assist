import React, { useState } from 'react';
import { ContentPipeline } from './ContentPipeline';
import { Content } from '../../types';
import { ContentService } from '../../services/content.service';

/**
 * Example component demonstrating how to use ContentPipeline
 * This shows the integration with content state management and stage updates
 */
export const ContentPipelineExample: React.FC = () => {
  const [content, setContent] = useState<Content>({
    id: 'example-1',
    topic: 'How to Build a React App',
    category: 'Innovative',
    current_stage: 2, // Thumbnail stage
    title: 'Complete Guide to Building Modern React Applications',
    script: undefined,
    final_checks: [
      { id: '1', description: 'Content reviewed for accuracy', completed: true },
      { id: '2', description: 'SEO optimization completed', completed: false },
      { id: '3', description: 'Thumbnail approved', completed: false },
      { id: '4', description: 'Description finalized', completed: false },
      { id: '5', description: 'Tags and categories set', completed: false }
    ],
    publish_after: undefined,
    publish_before: undefined,
    link: undefined,
    morals: ['Always write clean, maintainable code', 'User experience comes first'],
    flags: [],
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z'
  });

  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleStageUpdate = async (contentId: string, newStage: number) => {
    setIsUpdating(true);
    setError(null);

    try {
      // In a real application, this would call the ContentService
      // and update the content in your global state management system
      const updatedContent = await ContentService.updateContentStage(contentId, newStage);
      
      // Update local state (in real app, this would be handled by your state management)
      setContent(updatedContent);
      
      console.log(`Content "${content.topic}" updated to stage ${newStage}`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update stage';
      setError(errorMessage);
      console.error('Stage update failed:', errorMessage);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Content Pipeline Example
        </h2>
        <p className="text-gray-600 mb-6">
          This example demonstrates the ContentPipeline component with interactive stage progression.
          Click on the next stage to advance the content through the pipeline.
        </p>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <div className="flex">
              <svg className="w-5 h-5 text-red-400 mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <div>
                <h4 className="text-sm font-medium text-red-800">Error</h4>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        <ContentPipeline
          content={content}
          onStageUpdate={handleStageUpdate}
          className="mb-6"
        />

        {isUpdating && (
          <div className="text-center py-4">
            <div className="inline-flex items-center space-x-2 text-blue-600">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600" />
              <span className="text-sm">Updating content stage...</span>
            </div>
          </div>
        )}
      </div>

      {/* Content Details */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Content Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Topic</label>
            <p className="text-sm text-gray-900">{content.topic}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <p className="text-sm text-gray-900">{content.category}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <p className="text-sm text-gray-900">{content.title || 'Not set'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Link</label>
            <p className="text-sm text-gray-900">{content.link || 'Not set'}</p>
          </div>
        </div>

        {/* Final Checks */}
        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Final Checks</label>
          <div className="space-y-2">
            {content.final_checks.map((check) => (
              <div key={check.id} className="flex items-center">
                <input
                  type="checkbox"
                  checked={check.completed}
                  onChange={(e) => {
                    const updatedChecks = content.final_checks.map(c =>
                      c.id === check.id ? { ...c, completed: e.target.checked } : c
                    );
                    setContent({ ...content, final_checks: updatedChecks });
                  }}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label className="ml-2 text-sm text-gray-900">{check.description}</label>
              </div>
            ))}
          </div>
        </div>

        {/* Morals */}
        {content.morals.length > 0 && (
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Morals</label>
            <ul className="space-y-1">
              {content.morals.map((moral, index) => (
                <li key={index} className="text-sm text-gray-900">
                  • {moral}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Usage Instructions */}
      <div className="bg-blue-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">Usage Instructions</h3>
        <div className="text-sm text-blue-800 space-y-2">
          <p>• Click on the next stage (highlighted in gray) to advance the content</p>
          <p>• Completed stages are shown in green with checkmarks</p>
          <p>• The current stage is highlighted in blue</p>
          <p>• Requirements for each stage are shown when missing</p>
          <p>• Dependencies (if any) are displayed as warnings</p>
          <p>• The component is fully responsive for mobile and desktop</p>
        </div>
      </div>
    </div>
  );
};