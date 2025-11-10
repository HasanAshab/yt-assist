import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { ContentCard } from '../ContentCard';
import { Content } from '../../../types';
import { CONTENT_STAGES } from '../../../constants';

// Mock the StageIndicator component
vi.mock('../StageIndicator', () => ({
  StageIndicator: ({ currentStage, size }: any) => (
    <div data-testid="stage-indicator" data-stage={currentStage} data-size={size}>
      Stage {currentStage}
    </div>
  )
}));

describe('ContentCard', () => {
  const mockContent: Content = {
    id: '1',
    topic: 'React Hooks Tutorial',
    category: 'Innovative',
    current_stage: 5,
    title: 'Complete Guide to React Hooks',
    script: 'This is the script content...',
    final_checks: [
      { id: 'check1', description: 'Review content', completed: false },
      { id: 'check2', description: 'Check SEO', completed: true }
    ],
    publish_after: 'JavaScript Fundamentals',
    publish_before: undefined,
    link: undefined,
    morals: ['Always use hooks correctly', 'Test your components'],
    flags: [],
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-02T12:30:00Z'
  };

  const mockOnSelect = vi.fn();
  const mockOnEdit = vi.fn();
  const mockOnDelete = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Grid Layout', () => {
    it('renders content information in grid layout', () => {
      render(
        <ContentCard
          content={mockContent}
          layout="grid"
          onSelect={mockOnSelect}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      expect(screen.getByText('React Hooks Tutorial')).toBeInTheDocument();
      expect(screen.getByText('Complete Guide to React Hooks')).toBeInTheDocument();
      expect(screen.getByText('Innovative')).toBeInTheDocument();
      expect(screen.getByText(CONTENT_STAGES[5])).toBeInTheDocument();
    });

    it('shows progress bar with correct percentage', () => {
      render(<ContentCard content={mockContent} layout="grid" />);

      const progressPercentage = ((mockContent.current_stage + 1) / CONTENT_STAGES.length) * 100;
      expect(screen.getByText(`${Math.round(progressPercentage)}%`)).toBeInTheDocument();
    });

    it('shows category badge with correct styling', () => {
      render(<ContentCard content={mockContent} layout="grid" />);

      const categoryBadge = screen.getByText('Innovative');
      expect(categoryBadge).toHaveClass('bg-blue-100', 'text-blue-800', 'border-blue-200');
    });

    it('shows demanding category with red styling', () => {
      const demandingContent = { ...mockContent, category: 'Demanding' as const };
      render(<ContentCard content={demandingContent} layout="grid" />);

      const categoryBadge = screen.getByText('Demanding');
      expect(categoryBadge).toHaveClass('bg-red-100', 'text-red-800', 'border-red-200');
    });

    it('shows incomplete final checks indicator', () => {
      render(<ContentCard content={mockContent} layout="grid" />);

      expect(screen.getByText('Final checks pending')).toBeInTheDocument();
    });

    it('shows dependency information', () => {
      render(<ContentCard content={mockContent} layout="grid" />);

      expect(screen.getByText('Depends on: JavaScript Fundamentals')).toBeInTheDocument();
    });

    it('shows morals count', () => {
      render(<ContentCard content={mockContent} layout="grid" />);

      expect(screen.getByText('2 morals')).toBeInTheDocument();
    });

    it('shows singular moral text for single moral', () => {
      const singleMoralContent = { ...mockContent, morals: ['Single moral'] };
      render(<ContentCard content={singleMoralContent} layout="grid" />);

      expect(screen.getByText('1 moral')).toBeInTheDocument();
    });

    it('shows updated date', () => {
      render(<ContentCard content={mockContent} layout="grid" />);

      const updatedDate = new Date(mockContent.updated_at).toLocaleDateString();
      expect(screen.getByText(`Updated ${updatedDate}`)).toBeInTheDocument();
    });

    it('renders action buttons when handlers provided', () => {
      render(
        <ContentCard
          content={mockContent}
          layout="grid"
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      expect(screen.getByTitle('Edit content')).toBeInTheDocument();
      expect(screen.getByTitle('Delete content')).toBeInTheDocument();
    });

    it('does not render action buttons when handlers not provided', () => {
      render(<ContentCard content={mockContent} layout="grid" />);

      expect(screen.queryByTitle('Edit content')).not.toBeInTheDocument();
      expect(screen.queryByTitle('Delete content')).not.toBeInTheDocument();
    });
  });

  describe('List Layout', () => {
    it('renders content information in list layout', () => {
      render(
        <ContentCard
          content={mockContent}
          layout="list"
          onSelect={mockOnSelect}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      expect(screen.getByText('React Hooks Tutorial')).toBeInTheDocument();
      expect(screen.getByText('Complete Guide to React Hooks')).toBeInTheDocument();
      expect(screen.getByText('Innovative')).toBeInTheDocument();
      expect(screen.getByText(CONTENT_STAGES[5])).toBeInTheDocument();
    });

    it('shows checks pending badge for incomplete final checks', () => {
      render(<ContentCard content={mockContent} layout="list" />);

      expect(screen.getByText('Checks pending')).toBeInTheDocument();
    });

    it('shows dependency as badge in list layout', () => {
      render(<ContentCard content={mockContent} layout="list" />);

      expect(screen.getByText('Depends on: JavaScript Fundamentals')).toBeInTheDocument();
    });
  });

  describe('Stage-specific Rendering', () => {
    it('shows pending stage with gray color', () => {
      const pendingContent = { ...mockContent, current_stage: 0 };
      render(<ContentCard content={pendingContent} layout="grid" />);

      const stageText = screen.getByText(CONTENT_STAGES[0]);
      expect(stageText).toHaveClass('text-gray-600');
    });

    it('shows published stage with green color', () => {
      const publishedContent = { ...mockContent, current_stage: 11 };
      render(<ContentCard content={publishedContent} layout="grid" />);

      const stageText = screen.getByText(CONTENT_STAGES[11]);
      expect(stageText).toHaveClass('text-green-600');
    });

    it('shows in-progress stage with blue color', () => {
      render(<ContentCard content={mockContent} layout="grid" />);

      const stageText = screen.getByText(CONTENT_STAGES[5]);
      expect(stageText).toHaveClass('text-blue-600');
    });

    it('shows green progress bar for published content', () => {
      const publishedContent = { ...mockContent, current_stage: 11 };
      render(<ContentCard content={publishedContent} layout="grid" />);

      const progressBar = document.querySelector('.bg-green-500');
      expect(progressBar).toBeInTheDocument();
    });

    it('shows blue progress bar for in-progress content', () => {
      render(<ContentCard content={mockContent} layout="grid" />);

      const progressBar = document.querySelector('.bg-blue-500');
      expect(progressBar).toBeInTheDocument();
    });
  });

  describe('Content Variations', () => {
    it('handles content without title', () => {
      const noTitleContent = { ...mockContent, title: undefined };
      render(<ContentCard content={noTitleContent} layout="grid" />);

      expect(screen.getByText('React Hooks Tutorial')).toBeInTheDocument();
      expect(screen.queryByText('Complete Guide to React Hooks')).not.toBeInTheDocument();
    });

    it('handles content without morals', () => {
      const noMoralsContent = { ...mockContent, morals: [] };
      render(<ContentCard content={noMoralsContent} layout="grid" />);

      expect(screen.queryByText(/morals?/)).not.toBeInTheDocument();
    });

    it('handles content without dependencies', () => {
      const noDepsContent = { ...mockContent, publish_after: undefined };
      render(<ContentCard content={noDepsContent} layout="grid" />);

      expect(screen.queryByText(/Depends on:/)).not.toBeInTheDocument();
    });

    it('handles content with all final checks completed', () => {
      const completedChecksContent = {
        ...mockContent,
        final_checks: [
          { id: 'check1', description: 'Review content', completed: true },
          { id: 'check2', description: 'Check SEO', completed: true }
        ]
      };
      render(<ContentCard content={completedChecksContent} layout="grid" />);

      expect(screen.queryByText('Final checks pending')).not.toBeInTheDocument();
      expect(screen.queryByText('Checks pending')).not.toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('calls onSelect when card is clicked', async () => {
      const user = userEvent.setup();
      render(<ContentCard content={mockContent} layout="grid" onSelect={mockOnSelect} />);

      const card = screen.getByText('React Hooks Tutorial').closest('div');
      await user.click(card!);

      expect(mockOnSelect).toHaveBeenCalledWith(mockContent);
    });

    it('calls onEdit when edit button is clicked', async () => {
      const user = userEvent.setup();
      render(<ContentCard content={mockContent} layout="grid" onEdit={mockOnEdit} />);

      const editButton = screen.getByTitle('Edit content');
      await user.click(editButton);

      expect(mockOnEdit).toHaveBeenCalledWith(mockContent);
    });

    it('calls onDelete when delete button is clicked', async () => {
      const user = userEvent.setup();
      render(<ContentCard content={mockContent} layout="grid" onDelete={mockOnDelete} />);

      const deleteButton = screen.getByTitle('Delete content');
      await user.click(deleteButton);

      expect(mockOnDelete).toHaveBeenCalledWith(mockContent);
    });

    it('prevents event propagation when edit button is clicked', async () => {
      const user = userEvent.setup();
      render(
        <ContentCard
          content={mockContent}
          layout="grid"
          onSelect={mockOnSelect}
          onEdit={mockOnEdit}
        />
      );

      const editButton = screen.getByTitle('Edit content');
      await user.click(editButton);

      expect(mockOnEdit).toHaveBeenCalledWith(mockContent);
      expect(mockOnSelect).not.toHaveBeenCalled();
    });

    it('prevents event propagation when delete button is clicked', async () => {
      const user = userEvent.setup();
      render(
        <ContentCard
          content={mockContent}
          layout="grid"
          onSelect={mockOnSelect}
          onDelete={mockOnDelete}
        />
      );

      const deleteButton = screen.getByTitle('Delete content');
      await user.click(deleteButton);

      expect(mockOnDelete).toHaveBeenCalledWith(mockContent);
      expect(mockOnSelect).not.toHaveBeenCalled();
    });
  });

  describe('StageIndicator Integration', () => {
    it('renders StageIndicator with correct props', () => {
      render(<ContentCard content={mockContent} layout="grid" />);

      const stageIndicator = screen.getByTestId('stage-indicator');
      expect(stageIndicator).toHaveAttribute('data-stage', '5');
      expect(stageIndicator).toHaveAttribute('data-size', 'sm');
    });
  });

  describe('Accessibility', () => {
    it('has proper cursor pointer for clickable card', () => {
      render(<ContentCard content={mockContent} layout="grid" onSelect={mockOnSelect} />);

      const card = screen.getByText('React Hooks Tutorial').closest('div');
      expect(card).toHaveClass('cursor-pointer');
    });

    it('has proper button titles for screen readers', () => {
      render(
        <ContentCard
          content={mockContent}
          layout="grid"
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      expect(screen.getByTitle('Edit content')).toBeInTheDocument();
      expect(screen.getByTitle('Delete content')).toBeInTheDocument();
    });

    it('supports keyboard navigation for buttons', async () => {
      const user = userEvent.setup();
      render(<ContentCard content={mockContent} layout="grid" onEdit={mockOnEdit} />);

      const editButton = screen.getByTitle('Edit content');
      editButton.focus();
      
      await user.keyboard('{Enter}');
      expect(mockOnEdit).toHaveBeenCalledWith(mockContent);
    });
  });

  describe('CSS Classes and Styling', () => {
    it('applies custom className', () => {
      render(
        <ContentCard
          content={mockContent}
          layout="grid"
          className="custom-class"
        />
      );

      const card = screen.getByText('React Hooks Tutorial').closest('div');
      expect(card).toHaveClass('custom-class');
    });

    it('applies hover effects', () => {
      render(<ContentCard content={mockContent} layout="grid" />);

      const card = screen.getByText('React Hooks Tutorial').closest('div');
      expect(card).toHaveClass('hover:shadow-lg');
    });

    it('applies transition effects', () => {
      render(<ContentCard content={mockContent} layout="grid" />);

      const card = screen.getByText('React Hooks Tutorial').closest('div');
      expect(card).toHaveClass('transition-shadow');
    });
  });
});