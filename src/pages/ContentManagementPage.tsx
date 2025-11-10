import React, { useState, useEffect } from 'react';
import { ContentList } from '../components/content/ContentList';
import { ContentForm } from '../components/content/ContentForm';
import { ContentDetailModal } from '../components/content/ContentDetailModal';
import { ContentQuickActions } from '../components/content/ContentQuickActions';
import type { Content } from '../types';
import { useContent } from '../hooks/useContent';
import { ContentService } from '../services/content.service';
import { useErrorHandler } from '../hooks/useErrorHandler';
import { CONTENT_STAGES } from '../constants';

export function ContentManagementPage() {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingContent, setEditingContent] = useState<Content | null>(null);
  const [viewingContent, setViewingContent] = useState<Content | null>(null);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    inProgress: 0,
    published: 0,
    readyToAdvance: 0
  });
  
  const { contents, setContents, setLoading, addContent, updateContent, deleteContent } = useContent();
  const { handleError } = useErrorHandler();

  // Load content and stats on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [loadedContents, contentStats, readyContents] = await Promise.all([
          ContentService.getContents(),
          ContentService.getContentStatistics(),
          ContentService.getContentsReadyForNextStage()
        ]);
        
        setContents(loadedContents);
        setStats({
          total: contentStats.total,
          pending: contentStats.pending,
          inProgress: contentStats.inProgress,
          published: contentStats.published,
          readyToAdvance: readyContents.length
        });
      } catch (error) {
        handleError(error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [setContents, setLoading, handleError]);

  // Update stats when contents change
  useEffect(() => {
    const updateStats = async () => {
      try {
        const [contentStats, readyContents] = await Promise.all([
          ContentService.getContentStatistics(),
          ContentService.getContentsReadyForNextStage()
        ]);
        
        setStats({
          total: contentStats.total,
          pending: contentStats.pending,
          inProgress: contentStats.inProgress,
          published: contentStats.published,
          readyToAdvance: readyContents.length
        });
      } catch (error) {
        // Silently handle errors for stats updates
        console.error('Failed to update stats:', error);
      }
    };

    if (contents.length > 0) {
      updateStats();
    }
  }, [contents]);

  const handleCreateContent = async (content: Content) => {
    setShowCreateForm(false);
  };

  const handleEditContent = (content: Content) => {
    setEditingContent(content);
    setViewingContent(null);
  };

  const handleViewContent = (content: Content) => {
    setViewingContent(content);
  };

  const handleUpdateContent = async (content: Content) => {
    setEditingContent(null);
  };

  const handleDeleteContent = async (content: Content) => {
    if (confirm(`Are you sure you want to delete "${content.topic}"?`)) {
      try {
        await ContentService.deleteContent(content.id);
        deleteContent(content.id);
        setViewingContent(null);
      } catch (error) {
        handleError(error);
      }
    }
  };

  // Bulk actions
  const handleBulkDeletePublished = async () => {
    if (confirm('Are you sure you want to delete all published content? This action cannot be undone.')) {
      try {
        const deletedCount = await ContentService.bulkDeletePublishedContents();
        // Reload contents
        const updatedContents = await ContentService.getContents();
        setContents(updatedContents);
        alert(`Deleted ${deletedCount} published content items.`);
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
          <h1 className="text-2xl font-bold text-gray-900">Content Management</h1>
          <p className="text-gray-600">Manage your YouTube content pipeline from idea to publication</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleBulkDeletePublished}
            disabled={stats.published === 0}
            className="px-4 py-2 text-sm font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Clear Published ({stats.published})
          </button>
          <button
            onClick={() => setShowCreateForm(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Create Content
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
          <div className="text-sm text-gray-600">Total Content</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-2xl font-bold text-gray-600">{stats.pending}</div>
          <div className="text-sm text-gray-600">Pending</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-2xl font-bold text-blue-600">{stats.inProgress}</div>
          <div className="text-sm text-gray-600">In Progress</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-2xl font-bold text-green-600">{stats.published}</div>
          <div className="text-sm text-gray-600">Published</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-2xl font-bold text-orange-600">{stats.readyToAdvance}</div>
          <div className="text-sm text-gray-600">Ready to Advance</div>
        </div>
      </div>

      {/* Quick Actions and Content List */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Quick Actions Sidebar */}
        <div className="lg:col-span-1">
          <ContentQuickActions />
        </div>

        {/* Main Content List */}
        <div className="lg:col-span-3">
          <ContentList
            onContentEdit={handleEditContent}
            onContentView={handleViewContent}
            onContentDelete={handleDeleteContent}
          />
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
    </div>
  );
}