import React, { useCallback } from 'react';
import type { Content } from '../../types';
import { ContentForm } from './ContentForm';

interface ContentModalProps {
  content?: Content;
  isOpen: boolean;
  onClose: () => void;
  onContentCreated?: (content: Content) => void;
  onContentUpdated?: (content: Content) => void;
}

export const ContentModal: React.FC<ContentModalProps> = ({
  content,
  isOpen,
  onClose,
  onContentCreated,
  onContentUpdated
}) => {
  const handleSubmit = useCallback((updatedContent: Content) => {
    if (content) {
      onContentUpdated?.(updatedContent);
    } else {
      onContentCreated?.(updatedContent);
    }
  }, [content, onContentCreated, onContentUpdated]);

  return (
    <ContentForm
      content={content}
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={handleSubmit}
    />
  );
};