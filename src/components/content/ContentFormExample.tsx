import React from 'react';
import { ContentModal } from './ContentModal';
import { useContentForm } from '../../hooks/useContentForm';
import type { Content } from '../../types';

/**
 * Example component showing how to use ContentModal and useContentForm hook
 * This demonstrates the complete CRUD form functionality for content management
 */
export const ContentFormExample: React.FC = () => {
  const {
    isModalOpen,
    editingContent,
    openCreateModal,
    openEditModal,
    closeModal,
    handleContentCreated,
    handleContentUpdated
  } = useContentForm(
    // Callback when new content is created
    (content: Content) => {
      console.log('Content created:', content);
      // Here you would typically:
      // 1. Show success notification
      // 2. Refresh content list
      // 3. Navigate to content detail page
    },
    // Callback when content is updated
    (content: Content) => {
      console.log('Content updated:', content);
      // Here you would typically:
      // 1. Show success notification
      // 2. Update content in the list
      // 3. Refresh any dependent data
    }
  );

  // Example content for editing
  const exampleContent: Content = {
    id: '1',
    topic: 'Example Topic',
    category: 'Demanding',
    current_stage: 2,
    title: 'Example Title',
    script: 'This is an example script that meets the minimum length requirements for content validation.',
    final_checks: [],
    publish_after: '',
    publish_before: '',
    link: 'https://example.com/video',
    morals: ['Always be honest', 'Help others learn'],
    flags: [],
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z'
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        Content Form Example
      </h1>
      
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          Content CRUD Operations
        </h2>
        
        <p className="text-gray-600 mb-4">
          This example demonstrates the ContentForm component with full CRUD functionality,
          including form validation, morals management, and final checks.
        </p>
        
        <div className="space-x-4">
          <button
            onClick={openCreateModal}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Create New Content
          </button>
          
          <button
            onClick={() => openEditModal(exampleContent)}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
          >
            Edit Example Content
          </button>
        </div>
      </div>

      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-md font-semibold text-gray-800 mb-3">
          Features Demonstrated:
        </h3>
        
        <ul className="space-y-2 text-sm text-gray-600">
          <li className="flex items-start">
            <span className="text-green-500 mr-2">✓</span>
            <span>Real-time form validation with user-friendly error messages</span>
          </li>
          <li className="flex items-start">
            <span className="text-green-500 mr-2">✓</span>
            <span>Dynamic morals array management (add/remove functionality)</span>
          </li>
          <li className="flex items-start">
            <span className="text-green-500 mr-2">✓</span>
            <span>Final checks management with completion tracking</span>
          </li>
          <li className="flex items-start">
            <span className="text-green-500 mr-2">✓</span>
            <span>Dependency selection dropdowns for publish_after/publish_before</span>
          </li>
          <li className="flex items-start">
            <span className="text-green-500 mr-2">✓</span>
            <span>Responsive modal design optimized for mobile devices</span>
          </li>
          <li className="flex items-start">
            <span className="text-green-500 mr-2">✓</span>
            <span>Loading states and error handling during form submission</span>
          </li>
          <li className="flex items-start">
            <span className="text-green-500 mr-2">✓</span>
            <span>Proper form state management and cleanup</span>
          </li>
        </ul>
      </div>

      {/* Content Modal */}
      <ContentModal
        content={editingContent}
        isOpen={isModalOpen}
        onClose={closeModal}
        onContentCreated={handleContentCreated}
        onContentUpdated={handleContentUpdated}
      />
    </div>
  );
};