import React from 'react';
import { ContentList } from './ContentList';
import { Content } from '../../types';

/**
 * Example usage of ContentList component
 * 
 * This example demonstrates how to use the ContentList component
 * with all its features including filtering, search, and interactions.
 */
export const ContentListExample: React.FC = () => {
  // Example handlers for content interactions
  const handleContentSelect = (content: Content) => {
    console.log('Selected content:', content.topic);
    // Navigate to content detail view
  };

  const handleContentEdit = (content: Content) => {
    console.log('Edit content:', content.topic);
    // Open edit modal or navigate to edit page
  };

  const handleContentDelete = (content: Content) => {
    console.log('Delete content:', content.topic);
    // Show confirmation dialog and delete
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Content Management
        </h1>
        <p className="text-gray-600">
          Manage your YouTube content pipeline with filtering, search, and stage tracking.
        </p>
      </div>

      {/* Full-featured ContentList */}
      <ContentList
        onContentSelect={handleContentSelect}
        onContentEdit={handleContentEdit}
        onContentDelete={handleContentDelete}
        showFilters={true}
        showSearch={true}
        layout="grid"
        className="mb-8"
      />

      {/* Example with custom configuration */}
      <div className="mt-12">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          List View (No Filters)
        </h2>
        <ContentList
          onContentSelect={handleContentSelect}
          showFilters={false}
          showSearch={true}
          layout="list"
        />
      </div>

      {/* Example with minimal configuration */}
      <div className="mt-12">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Minimal View
        </h2>
        <ContentList
          showFilters={false}
          showSearch={false}
          layout="grid"
        />
      </div>
    </div>
  );
};

export default ContentListExample;