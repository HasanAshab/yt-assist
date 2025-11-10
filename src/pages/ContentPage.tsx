import React, { useState } from 'react';
import { ContentList } from '../components/content/ContentList';
import { ContentForm } from '../components/content/ContentForm';
import type { Content } from '../types';
import { useContent } from '../hooks/useContent';

export function ContentPage() {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingContent, setEditingContent] = useState<Content | null>(null);
  const { addContent, updateContent, deleteContent } = useContent();

  const handleCreateContent = (contentData: any) => {
    const newContent: Content = {
      id: Date.now().toString(),
      topic: contentData.topic,
      category: contentData.category,
      current_stage: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      title: contentData.title,
      script: contentData.script,
      final_checks: [],
      morals: []
    };
    
    addContent(newContent);
    setShowCreateForm(false);
  };

  const handleEditContent = (content: Content) => {
    setEditingContent(content);
  };

  const handleUpdateContent = (contentData: any) => {
    if (editingContent) {
      const updatedContent: Content = {
        ...editingContent,
        ...contentData,
        updated_at: new Date().toISOString()
      };
      updateContent(updatedContent);
      setEditingContent(null);
    }
  };

  const handleDeleteContent = (content: Content) => {
    if (confirm(`Are you sure you want to delete "${content.topic}"?`)) {
      deleteContent(content.id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Content Pipeline</h1>
          <p className="text-gray-600">Manage your YouTube content from idea to publication</p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Create Content
        </button>
      </div>

      {/* Create Form Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Create New Content</h3>
            <ContentForm
              onSubmit={handleCreateContent}
              onCancel={() => setShowCreateForm(false)}
            />
          </div>
        </div>
      )}

      {/* Edit Form Modal */}
      {editingContent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Edit Content</h3>
            <ContentForm
              initialData={editingContent}
              onSubmit={handleUpdateContent}
              onCancel={() => setEditingContent(null)}
            />
          </div>
        </div>
      )}

      {/* Content List */}
      <ContentList
        onContentEdit={handleEditContent}
        onContentDelete={handleDeleteContent}
      />
    </div>
  );
}