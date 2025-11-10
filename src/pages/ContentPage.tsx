import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ContentList } from '../components/content/ContentList';
import { ContentForm } from '../components/content/ContentForm';
import { ContentDetailModal } from '../components/content/ContentDetailModal';
import type { Content } from '../types';
import { useContent } from '../hooks/useContent';
import { ContentService } from '../services/content.service';
import { useErrorHandler } from '../hooks/useErrorHandler';

export function ContentPage() {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingContent, setEditingContent] = useState<Content | null>(null);
  const [viewingContent, setViewingContent] = useState<Content | null>(null);
  const { contents, setContents, setLoading, addContent, updateContent, deleteContent } = useContent();
  const { handleError } = useErrorHandler();

  // Load content on component mount
  useEffect(() => {
    const loadContent = async () => {
      try {
        setLoading(true);
        const loadedContents = await ContentService.getContents();
        setContents(loadedContents);
      } catch (error) {
        handleError(error);
      } finally {
        setLoading(false);
      }
    };

    loadContent();
  }, [setContents, setLoading, handleError]);

  const handleCreateContent = async (content: Content) => {
    // Content is already created by the form using ContentService
    // Just close the form - the content is already added to state by the form
    setShowCreateForm(false);
  };

  const handleEditContent = (content: Content) => {
    setEditingContent(content);
    setViewingContent(null); // Close detail modal if open
  };

  const handleViewContent = (content: Content) => {
    setViewingContent(content);
  };

  const handleUpdateContent = async (content: Content) => {
    // Content is already updated by the form using ContentService
    // Just close the form - the content is already updated in state by the form
    setEditingContent(null);
  };

  const handleDeleteContent = async (content: Content) => {
    if (confirm(`Are you sure you want to delete "${content.topic}"?`)) {
      try {
        await ContentService.deleteContent(content.id);
        deleteContent(content.id);
        setViewingContent(null); // Close detail modal if open
      } catch (error) {
        handleError(error);
      }
    }
  };

  return (
    <div className="space-y-6 pb-20 sm:pb-0 w-full overflow-x-hidden">
      {/* Header */}
      <div className="flex flex-col gap-4 w-full">
        <div className="w-full">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 text-safe">Content Pipeline</h1>
          <p className="text-base sm:text-gray-600 text-gray-500 mt-1 text-safe">Manage your YouTube content from idea to publication</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full">
          <Link
            to="/content/manage"
            className="flex-1 sm:flex-none px-4 py-3 text-base sm:text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-center touch-target"
          >
            Advanced Management
          </Link>
          <button
            onClick={() => setShowCreateForm(true)}
            className="flex-1 sm:flex-none px-4 py-3 text-base sm:text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors touch-target"
          >
            Create Content
          </button>
        </div>
      </div>

      {/* Create Form Modal */}
      {showCreateForm && (
        <ContentForm
          isOpen={showCreateForm}
          onClose={() => setShowCreateForm(false)}
          onSubmit={handleCreateContent}
        />
      )}

      {/* Edit Form Modal */}
      {editingContent && (
        <ContentForm
          content={editingContent}
          isOpen={!!editingContent}
          onClose={() => setEditingContent(null)}
          onSubmit={handleUpdateContent}
        />
      )}

      {/* Content Detail Modal */}
      {viewingContent && (
        <ContentDetailModal
          content={viewingContent}
          isOpen={!!viewingContent}
          onClose={() => setViewingContent(null)}
          onEdit={handleEditContent}
          onDelete={handleDeleteContent}
        />
      )}

      {/* Content List */}
      <ContentList
        onContentEdit={handleEditContent}
        onContentView={handleViewContent}
        onContentDelete={handleDeleteContent}
      />
    </div>
  );
}