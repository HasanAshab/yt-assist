import { useState, useCallback } from 'react';
import type { Content } from '../types';

interface UseContentFormReturn {
  isModalOpen: boolean;
  editingContent: Content | undefined;
  openCreateModal: () => void;
  openEditModal: (content: Content) => void;
  closeModal: () => void;
  handleContentCreated: (content: Content) => void;
  handleContentUpdated: (content: Content) => void;
}

export const useContentForm = (
  onContentCreated?: (content: Content) => void,
  onContentUpdated?: (content: Content) => void
): UseContentFormReturn => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingContent, setEditingContent] = useState<Content | undefined>();

  const openCreateModal = useCallback(() => {
    setEditingContent(undefined);
    setIsModalOpen(true);
  }, []);

  const openEditModal = useCallback((content: Content) => {
    setEditingContent(content);
    setIsModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    setEditingContent(undefined);
  }, []);

  const handleContentCreated = useCallback((content: Content) => {
    onContentCreated?.(content);
    closeModal();
  }, [onContentCreated, closeModal]);

  const handleContentUpdated = useCallback((content: Content) => {
    onContentUpdated?.(content);
    closeModal();
  }, [onContentUpdated, closeModal]);

  return {
    isModalOpen,
    editingContent,
    openCreateModal,
    openEditModal,
    closeModal,
    handleContentCreated,
    handleContentUpdated
  };
};