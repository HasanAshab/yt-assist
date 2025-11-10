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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Content Pipeline</h1>
          <p className="text-gray-600">Manage your YouTube content from idea to publication</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/content/manage"
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Advanced Management
          </Link>
          <button
            onClick={() => setShowCreateForm(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
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