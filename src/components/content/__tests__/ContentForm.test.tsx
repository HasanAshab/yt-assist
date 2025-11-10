import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { ContentForm } from '../ContentForm';
import { ContentService } from '../../../services/content.service';
import { useContent } from '../../../hooks/useContent';
import { useErrorHandler } from '../../../hooks/useErrorHandler';
import type { Content, ContentFormData } from '../../../types';

// Mock dependencies
vi.mock('../../../services/content.service');
vi.mock('../../../hooks/useContent');
vi.mock('../../../hooks/useErrorHandler');

const mockContentService = vi.mocked(ContentService);
const mockUseContent = vi.mocked(useContent);
const mockUseErrorHandler = vi.mocked(useErrorHandler);

// Mock content data
const mockContent: Content = {
  id: '1',
  topic: 'Test Topic',
  category: 'Demanding',
  current_stage: 0,
  title: 'Test Title',
  script: 'Test script content that is long enough to meet minimum requirements',
  final_checks: [
    { id: 'check1', description: 'Check 1', completed: false },
    { id: 'check2', description: 'Check 2', completed: true }
  ],
  publish_after: '',
  publish_before: '',
  link: 'https://example.com',
  morals: ['Test moral 1', 'Test moral 2'],
  flags: [],
  created_at: '2023-01-01T00:00:00Z',
  updated_at: '2023-01-01T00:00:00Z'
};

const mockContents: Content[] = [
  mockContent,
  {
    ...mockContent,
    id: '2',
    topic: 'Another Topic',
    title: 'Another Title'
  }
];

describe('ContentForm', () => {
  const mockAddContent = vi.fn();
  const mockUpdateContent = vi.fn();
  const mockHandleError = vi.fn();
  const mockOnClose = vi.fn();
  const mockOnSubmit = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockUseContent.mockReturnValue({
      contents: mockContents,
      addContent: mockAddContent,
      updateContent: mockUpdateContent,
      filters: {},
      loading: false,
      setContents: vi.fn(),
      deleteContent: vi.fn(),
      setFilters: vi.fn(),
      setLoading: vi.fn(),
      filteredContents: mockContents,
      getContentByTopic: vi.fn(),
      getContentsByStage: vi.fn(),
      getPendingContents: [],
      getInProgressContents: [],
      getPublishedContents: []
    });

    mockUseErrorHandler.mockReturnValue({
      handleError: mockHandleError
    });
  });

  describe('Rendering', () => {
    it('renders create form when no content provided', () => {
      render(
        <ContentForm
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      expect(screen.getByText('Create New Content')).toBeInTheDocument();
      expect(screen.getByLabelText(/topic/i)).toHaveValue('');
      expect(screen.getByLabelText(/category/i)).toHaveValue('Demanding');
    });

    it('renders edit form when content provided', () => {
      render(
        <ContentForm
          content={mockContent}
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      expect(screen.getByText('Edit Content')).toBeInTheDocument();
      expect(screen.getByLabelText(/topic/i)).toHaveValue('Test Topic');
      expect(screen.getByLabelText(/category/i)).toHaveValue('Demanding');
      expect(screen.getByLabelText(/title/i)).toHaveValue('Test Title');
    });

    it('does not render when isOpen is false', () => {
      render(
        <ContentForm
          isOpen={false}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      expect(screen.queryByText('Create New Content')).not.toBeInTheDocument();
    });

    it('renders all form fields', () => {
      render(
        <ContentForm
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      expect(screen.getByLabelText(/topic/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/category/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/script/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/publish after/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/publish before/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/link/i)).toBeInTheDocument();
      expect(screen.getByText(/morals/i)).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('validates required topic field', async () => {
      const user = userEvent.setup();
      
      render(
        <ContentForm
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      const submitButton = screen.getByRole('button', { name: /create content/i });
      await user.click(submitButton);

      expect(screen.getByText(/topic is required/i)).toBeInTheDocument();
    });

    it('validates topic length', async () => {
      const user = userEvent.setup();
      
      render(
        <ContentForm
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      const topicInput = screen.getByLabelText(/topic/i);
      await user.type(topicInput, 'ab'); // Too short

      expect(screen.getByText(/topic must be at least 3 characters/i)).toBeInTheDocument();
    });

    it('validates topic uniqueness for new content', async () => {
      const user = userEvent.setup();
      
      render(
        <ContentForm
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      const topicInput = screen.getByLabelText(/topic/i);
      await user.type(topicInput, 'Test Topic'); // Existing topic

      expect(screen.getByText(/content with this topic already exists/i)).toBeInTheDocument();
    });

    it('validates URL format for link field', async () => {
      const user = userEvent.setup();
      
      render(
        <ContentForm
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      const linkInput = screen.getByLabelText(/link/i);
      await user.type(linkInput, 'invalid-url');

      expect(screen.getByText(/please enter a valid url/i)).toBeInTheDocument();
    });

    it('prevents self-dependency', async () => {
      const user = userEvent.setup();
      
      render(
        <ContentForm
          content={mockContent}
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      const publishAfterSelect = screen.getByLabelText(/publish after/i);
      await user.selectOptions(publishAfterSelect, 'Test Topic');

      expect(screen.getByText(/content cannot depend on itself/i)).toBeInTheDocument();
    });
  });

  describe('Morals Management', () => {
    it('adds new moral', async () => {
      const user = userEvent.setup();
      
      render(
        <ContentForm
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      const moralInput = screen.getByPlaceholderText(/enter a moral/i);
      const addButton = screen.getByRole('button', { name: /add/i });

      await user.type(moralInput, 'New moral');
      await user.click(addButton);

      expect(screen.getByText('New moral')).toBeInTheDocument();
      expect(moralInput).toHaveValue('');
    });

    it('removes existing moral', async () => {
      const user = userEvent.setup();
      
      render(
        <ContentForm
          content={mockContent}
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      expect(screen.getByText('Test moral 1')).toBeInTheDocument();
      
      const removeButtons = screen.getAllByRole('button');
      const removeButton = removeButtons.find(button => 
        button.closest('div')?.textContent?.includes('Test moral 1')
      );
      
      if (removeButton) {
        await user.click(removeButton);
      }

      expect(screen.queryByText('Test moral 1')).not.toBeInTheDocument();
    });

    it('adds moral on Enter key press', async () => {
      const user = userEvent.setup();
      
      render(
        <ContentForm
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      const moralInput = screen.getByPlaceholderText(/enter a moral/i);
      await user.type(moralInput, 'New moral{enter}');

      expect(screen.getByText('New moral')).toBeInTheDocument();
      expect(moralInput).toHaveValue('');
    });

    it('prevents duplicate morals', async () => {
      const user = userEvent.setup();
      
      render(
        <ContentForm
          content={mockContent}
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      const moralInput = screen.getByPlaceholderText(/enter a moral/i);
      const addButton = screen.getByRole('button', { name: /add/i });

      await user.type(moralInput, 'Test moral 1'); // Existing moral
      await user.click(addButton);

      // Should not add duplicate
      const moralElements = screen.getAllByText('Test moral 1');
      expect(moralElements).toHaveLength(1);
    });
  });

  describe('Final Checks Management', () => {
    it('renders existing final checks for edit mode', () => {
      render(
        <ContentForm
          content={mockContent}
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      expect(screen.getByText('Check 1')).toBeInTheDocument();
      expect(screen.getByText('Check 2')).toBeInTheDocument();
    });

    it('toggles final check completion', async () => {
      const user = userEvent.setup();
      
      render(
        <ContentForm
          content={mockContent}
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      const checkboxes = screen.getAllByRole('checkbox');
      const firstCheckbox = checkboxes[0];

      expect(firstCheckbox).not.toBeChecked();
      await user.click(firstCheckbox);
      expect(firstCheckbox).toBeChecked();
    });

    it('adds new final check', async () => {
      const user = userEvent.setup();
      
      render(
        <ContentForm
          content={mockContent}
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      const checkInput = screen.getByPlaceholderText(/enter final check description/i);
      const addButton = screen.getAllByRole('button', { name: /add/i })[1]; // Second add button

      await user.type(checkInput, 'New final check');
      await user.click(addButton);

      expect(screen.getByText('New final check')).toBeInTheDocument();
      expect(checkInput).toHaveValue('');
    });

    it('removes final check', async () => {
      const user = userEvent.setup();
      
      render(
        <ContentForm
          content={mockContent}
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      expect(screen.getByText('Check 1')).toBeInTheDocument();
      
      const removeButtons = screen.getAllByRole('button');
      const removeButton = removeButtons.find(button => 
        button.closest('div')?.textContent?.includes('Check 1')
      );
      
      if (removeButton) {
        await user.click(removeButton);
      }

      expect(screen.queryByText('Check 1')).not.toBeInTheDocument();
    });
  });

  describe('Form Submission', () => {
    it('creates new content successfully', async () => {
      const user = userEvent.setup();
      const newContent = { ...mockContent, id: '3', topic: 'New Topic' };
      
      mockContentService.createContent.mockResolvedValue(newContent);

      render(
        <ContentForm
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      // Fill required fields
      await user.type(screen.getByLabelText(/topic/i), 'New Topic');
      await user.selectOptions(screen.getByLabelText(/category/i), 'Innovative');

      const submitButton = screen.getByRole('button', { name: /create content/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockContentService.createContent).toHaveBeenCalledWith({
          topic: 'New Topic',
          category: 'Innovative',
          title: '',
          script: '',
          publish_after: '',
          publish_before: '',
          link: '',
          morals: []
        });
      });

      expect(mockAddContent).toHaveBeenCalledWith(newContent);
      expect(mockOnSubmit).toHaveBeenCalledWith(newContent);
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('updates existing content successfully', async () => {
      const user = userEvent.setup();
      const updatedContent = { ...mockContent, title: 'Updated Title' };
      
      mockContentService.updateContent.mockResolvedValue(updatedContent);

      render(
        <ContentForm
          content={mockContent}
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      const titleInput = screen.getByLabelText(/title/i);
      await user.clear(titleInput);
      await user.type(titleInput, 'Updated Title');

      const submitButton = screen.getByRole('button', { name: /update content/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockContentService.updateContent).toHaveBeenCalledWith(
          mockContent.id,
          expect.objectContaining({
            title: 'Updated Title'
          })
        );
      });

      expect(mockUpdateContent).toHaveBeenCalledWith(updatedContent);
      expect(mockOnSubmit).toHaveBeenCalledWith(updatedContent);
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('handles submission errors', async () => {
      const user = userEvent.setup();
      const error = new Error('Validation failed');
      
      mockContentService.createContent.mockRejectedValue(error);

      render(
        <ContentForm
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      await user.type(screen.getByLabelText(/topic/i), 'New Topic');

      const submitButton = screen.getByRole('button', { name: /create content/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Validation failed')).toBeInTheDocument();
      });

      expect(mockHandleError).toHaveBeenCalledWith(error);
      expect(mockOnSubmit).not.toHaveBeenCalled();
      expect(mockOnClose).not.toHaveBeenCalled();
    });

    it('prevents submission when form is invalid', async () => {
      const user = userEvent.setup();
      
      render(
        <ContentForm
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      // Don't fill required fields
      const submitButton = screen.getByRole('button', { name: /create content/i });
      await user.click(submitButton);

      expect(mockContentService.createContent).not.toHaveBeenCalled();
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('shows loading state during submission', async () => {
      const user = userEvent.setup();
      
      // Mock a delayed response
      mockContentService.createContent.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve(mockContent), 100))
      );

      render(
        <ContentForm
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      await user.type(screen.getByLabelText(/topic/i), 'New Topic');

      const submitButton = screen.getByRole('button', { name: /create content/i });
      await user.click(submitButton);

      // Should show loading state
      expect(submitButton).toBeDisabled();
      expect(screen.getByRole('button', { name: /create content/i })).toBeInTheDocument();

      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled();
      });
    });
  });

  describe('Modal Behavior', () => {
    it('closes modal when close button clicked', async () => {
      const user = userEvent.setup();
      
      render(
        <ContentForm
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      const closeButton = screen.getByRole('button', { name: /close/i });
      await user.click(closeButton);

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('closes modal when cancel button clicked', async () => {
      const user = userEvent.setup();
      
      render(
        <ContentForm
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('prevents closing during submission', async () => {
      const user = userEvent.setup();
      
      // Mock a delayed response
      mockContentService.createContent.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve(mockContent), 100))
      );

      render(
        <ContentForm
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      await user.type(screen.getByLabelText(/topic/i), 'New Topic');

      const submitButton = screen.getByRole('button', { name: /create content/i });
      await user.click(submitButton);

      // Try to close during submission
      const closeButton = screen.getByRole('button', { name: /close/i });
      expect(closeButton).toBeDisabled();

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      expect(cancelButton).toBeDisabled();
    });
  });

  describe('Dependency Selection', () => {
    it('populates dependency dropdowns with available contents', () => {
      render(
        <ContentForm
          content={mockContent}
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      const publishAfterSelect = screen.getByLabelText(/publish after/i);
      const publishBeforeSelect = screen.getByLabelText(/publish before/i);

      // Should show other content but not current content
      expect(publishAfterSelect).toBeInTheDocument();
      expect(publishBeforeSelect).toBeInTheDocument();
      
      // Check that current content is not in the options
      const options = screen.getAllByRole('option');
      const topicOptions = options.filter(option => option.textContent === 'Test Topic');
      expect(topicOptions).toHaveLength(0);
    });

    it('validates circular dependencies', async () => {
      const user = userEvent.setup();
      
      render(
        <ContentForm
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      const publishAfterSelect = screen.getByLabelText(/publish after/i);
      const publishBeforeSelect = screen.getByLabelText(/publish before/i);

      await user.selectOptions(publishAfterSelect, 'Another Topic');
      await user.selectOptions(publishBeforeSelect, 'Another Topic');

      expect(screen.getByText(/cannot have the same content as both dependencies/i)).toBeInTheDocument();
    });
  });
});