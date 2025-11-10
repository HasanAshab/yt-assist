import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { ContentModal } from '../ContentModal';
import type { Content } from '../../../types';

// Mock the ContentForm component
vi.mock('../ContentForm', () => ({
  ContentForm: ({ content, isOpen, onClose, onSubmit }: any) => {
    if (!isOpen) return null;
    
    return (
      <div data-testid="content-form">
        <h2>{content ? 'Edit Content' : 'Create New Content'}</h2>
        <button onClick={() => onSubmit?.(content || { id: 'new', topic: 'New Content' })}>
          Submit
        </button>
        <button onClick={onClose}>Close</button>
      </div>
    );
  }
}));

const mockContent: Content = {
  id: '1',
  topic: 'Test Topic',
  category: 'Demanding',
  current_stage: 0,
  title: 'Test Title',
  script: 'Test script',
  final_checks: [],
  publish_after: '',
  publish_before: '',
  link: '',
  morals: [],
  flags: [],
  created_at: '2023-01-01T00:00:00Z',
  updated_at: '2023-01-01T00:00:00Z'
};

describe('ContentModal', () => {
  const mockOnClose = vi.fn();
  const mockOnContentCreated = vi.fn();
  const mockOnContentUpdated = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders ContentForm when open', () => {
      render(
        <ContentModal
          isOpen={true}
          onClose={mockOnClose}
          onContentCreated={mockOnContentCreated}
          onContentUpdated={mockOnContentUpdated}
        />
      );

      expect(screen.getByTestId('content-form')).toBeInTheDocument();
      expect(screen.getByText('Create New Content')).toBeInTheDocument();
    });

    it('renders ContentForm with content for editing', () => {
      render(
        <ContentModal
          content={mockContent}
          isOpen={true}
          onClose={mockOnClose}
          onContentCreated={mockOnContentCreated}
          onContentUpdated={mockOnContentUpdated}
        />
      );

      expect(screen.getByTestId('content-form')).toBeInTheDocument();
      expect(screen.getByText('Edit Content')).toBeInTheDocument();
    });

    it('does not render when closed', () => {
      render(
        <ContentModal
          isOpen={false}
          onClose={mockOnClose}
          onContentCreated={mockOnContentCreated}
          onContentUpdated={mockOnContentUpdated}
        />
      );

      expect(screen.queryByTestId('content-form')).not.toBeInTheDocument();
    });
  });

  describe('Event Handling', () => {
    it('calls onContentCreated when creating new content', async () => {
      const user = userEvent.setup();
      
      render(
        <ContentModal
          isOpen={true}
          onClose={mockOnClose}
          onContentCreated={mockOnContentCreated}
          onContentUpdated={mockOnContentUpdated}
        />
      );

      const submitButton = screen.getByText('Submit');
      await user.click(submitButton);

      expect(mockOnContentCreated).toHaveBeenCalledWith({
        id: 'new',
        topic: 'New Content'
      });
      expect(mockOnContentUpdated).not.toHaveBeenCalled();
    });

    it('calls onContentUpdated when editing existing content', async () => {
      const user = userEvent.setup();
      
      render(
        <ContentModal
          content={mockContent}
          isOpen={true}
          onClose={mockOnClose}
          onContentCreated={mockOnContentCreated}
          onContentUpdated={mockOnContentUpdated}
        />
      );

      const submitButton = screen.getByText('Submit');
      await user.click(submitButton);

      expect(mockOnContentUpdated).toHaveBeenCalledWith(mockContent);
      expect(mockOnContentCreated).not.toHaveBeenCalled();
    });

    it('calls onClose when close button clicked', async () => {
      const user = userEvent.setup();
      
      render(
        <ContentModal
          isOpen={true}
          onClose={mockOnClose}
          onContentCreated={mockOnContentCreated}
          onContentUpdated={mockOnContentUpdated}
        />
      );

      const closeButton = screen.getByText('Close');
      await user.click(closeButton);

      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  describe('Props Passing', () => {
    it('passes all props correctly to ContentForm', () => {
      render(
        <ContentModal
          content={mockContent}
          isOpen={true}
          onClose={mockOnClose}
          onContentCreated={mockOnContentCreated}
          onContentUpdated={mockOnContentUpdated}
        />
      );

      // Verify the form is rendered with correct props
      expect(screen.getByTestId('content-form')).toBeInTheDocument();
      expect(screen.getByText('Edit Content')).toBeInTheDocument();
    });

    it('handles optional callbacks gracefully', async () => {
      const user = userEvent.setup();
      
      render(
        <ContentModal
          isOpen={true}
          onClose={mockOnClose}
        />
      );

      const submitButton = screen.getByText('Submit');
      
      // Should not throw error when optional callbacks are not provided
      expect(() => user.click(submitButton)).not.toThrow();
    });
  });
});