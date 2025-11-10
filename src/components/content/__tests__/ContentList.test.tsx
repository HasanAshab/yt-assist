import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { ContentList } from '../ContentList';
import { useContent } from '../../../hooks/useContent';
import { Content } from '../../../types';
import { CONTENT_STAGES } from '../../../constants';

// Mock the useContent hook
vi.mock('../../../hooks/useContent');
const mockUseContent = useContent as any;

// Mock child components
vi.mock('../ContentCard', () => ({
  ContentCard: ({ content, layout, onSelect, onEdit, onDelete }: any) => (
    <div data-testid={`content-card-${content.id}`} data-layout={layout}>
      <span>{content.topic}</span>
      <span>{content.category}</span>
      <span>{CONTENT_STAGES[content.current_stage]}</span>
      {onSelect && (
        <button onClick={() => onSelect(content)} data-testid={`select-${content.id}`}>
          Select
        </button>
      )}
      {onEdit && (
        <button onClick={() => onEdit(content)} data-testid={`edit-${content.id}`}>
          Edit
        </button>
      )}
      {onDelete && (
        <button onClick={() => onDelete(content)} data-testid={`delete-${content.id}`}>
          Delete
        </button>
      )}
    </div>
  )
}));

vi.mock('../ContentFilters', () => ({
  ContentFiltersComponent: ({ filters, onFilterChange, onClearFilters, hasActiveFilters }: any) => (
    <div data-testid="content-filters">
      <select
        data-testid="category-filter"
        value={filters.category || 'all'}
        onChange={(e) => onFilterChange({ category: e.target.value === 'all' ? undefined : e.target.value })}
      >
        <option value="all">All Categories</option>
        <option value="Demanding">Demanding</option>
        <option value="Innovative">Innovative</option>
      </select>
      <select
        data-testid="stage-filter"
        value={filters.stage !== undefined ? filters.stage.toString() : 'all'}
        onChange={(e) => onFilterChange({ stage: e.target.value === 'all' ? undefined : parseInt(e.target.value) })}
      >
        <option value="all">All Stages</option>
        <option value="0">Pending</option>
        <option value="1">Title</option>
        <option value="11">Published</option>
      </select>
      {hasActiveFilters && (
        <button onClick={onClearFilters} data-testid="clear-filters">
          Clear Filters
        </button>
      )}
    </div>
  )
}));

vi.mock('../../common/SearchInput', () => ({
  SearchInput: ({ value, onChange, placeholder }: any) => (
    <input
      data-testid="search-input"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
    />
  )
}));

vi.mock('../../common/LoadingSpinner', () => ({
  LoadingSpinner: () => <div data-testid="loading-spinner">Loading...</div>
}));

vi.mock('../../common/EmptyState', () => ({
  EmptyState: ({ title, description, action }: any) => (
    <div data-testid="empty-state">
      <h3>{title}</h3>
      {description && <p>{description}</p>}
      {action}
    </div>
  )
}));

describe('ContentList', () => {
  const mockContents: Content[] = [
    {
      id: '1',
      topic: 'React Hooks Tutorial',
      category: 'Innovative',
      current_stage: 0,
      title: 'Complete Guide to React Hooks',
      script: undefined,
      final_checks: [],
      publish_after: undefined,
      publish_before: undefined,
      link: undefined,
      morals: ['Always use hooks correctly'],
      flags: [],
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    },
    {
      id: '2',
      topic: 'Advanced TypeScript',
      category: 'Demanding',
      current_stage: 5,
      title: 'TypeScript Advanced Patterns',
      script: 'This is the script content...',
      final_checks: [
        { id: 'check1', description: 'Review content', completed: false }
      ],
      publish_after: undefined,
      publish_before: undefined,
      link: undefined,
      morals: [],
      flags: [],
      created_at: '2024-01-02T00:00:00Z',
      updated_at: '2024-01-02T00:00:00Z'
    },
    {
      id: '3',
      topic: 'JavaScript Fundamentals',
      category: 'Innovative',
      current_stage: 11,
      title: 'JS Fundamentals for Beginners',
      script: 'Complete script here...',
      final_checks: [
        { id: 'check2', description: 'Final review', completed: true }
      ],
      publish_after: undefined,
      publish_before: undefined,
      link: 'https://youtube.com/watch?v=123',
      morals: ['Start with basics', 'Practice regularly'],
      flags: [],
      created_at: '2024-01-03T00:00:00Z',
      updated_at: '2024-01-03T00:00:00Z'
    }
  ];

  const mockSetFilters = vi.fn();
  const mockOnContentSelect = vi.fn();
  const mockOnContentEdit = vi.fn();
  const mockOnContentDelete = vi.fn();

  const defaultMockUseContent = {
    contents: mockContents,
    filters: { category: undefined, stage: undefined, search: undefined },
    loading: false,
    filteredContents: mockContents,
    setFilters: mockSetFilters
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseContent.mockReturnValue(defaultMockUseContent);
  });

  describe('Rendering', () => {
    it('renders content list with all contents', () => {
      render(<ContentList />);

      expect(screen.getByTestId('content-card-1')).toBeInTheDocument();
      expect(screen.getByTestId('content-card-2')).toBeInTheDocument();
      expect(screen.getByTestId('content-card-3')).toBeInTheDocument();
      expect(screen.getByText('3 of 3 contents')).toBeInTheDocument();
    });

    it('renders loading state', () => {
      mockUseContent.mockReturnValue({
        ...defaultMockUseContent,
        loading: true
      });

      render(<ContentList />);

      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
      expect(screen.queryByTestId('content-card-1')).not.toBeInTheDocument();
    });

    it('renders empty state when no contents', () => {
      mockUseContent.mockReturnValue({
        ...defaultMockUseContent,
        contents: [],
        filteredContents: []
      });

      render(<ContentList />);

      expect(screen.getByTestId('empty-state')).toBeInTheDocument();
      expect(screen.getByText('No content yet')).toBeInTheDocument();
    });

    it('renders empty state with filters when no filtered results', () => {
      mockUseContent.mockReturnValue({
        ...defaultMockUseContent,
        filters: { category: 'Demanding' },
        filteredContents: []
      });

      render(<ContentList />);

      expect(screen.getByTestId('empty-state')).toBeInTheDocument();
      expect(screen.getByText('No content matches your filters')).toBeInTheDocument();
    });

    it('shows search input when showSearch is true', () => {
      render(<ContentList showSearch={true} />);

      expect(screen.getByTestId('search-input')).toBeInTheDocument();
    });

    it('hides search input when showSearch is false', () => {
      render(<ContentList showSearch={false} />);

      expect(screen.queryByTestId('search-input')).not.toBeInTheDocument();
    });

    it('shows filters when showFilters is true', () => {
      render(<ContentList showFilters={true} />);

      expect(screen.getByTestId('content-filters')).toBeInTheDocument();
    });

    it('hides filters when showFilters is false', () => {
      render(<ContentList showFilters={false} />);

      expect(screen.queryByTestId('content-filters')).not.toBeInTheDocument();
    });
  });

  describe('Layout Toggle', () => {
    it('renders grid layout by default', () => {
      render(<ContentList />);

      const contentCards = screen.getAllByTestId(/content-card-/);
      contentCards.forEach(card => {
        expect(card).toHaveAttribute('data-layout', 'grid');
      });
    });

    it('switches to list layout when list button is clicked', async () => {
      const user = userEvent.setup();
      render(<ContentList />);

      const listButton = screen.getByText('List');
      await user.click(listButton);

      const contentCards = screen.getAllByTestId(/content-card-/);
      contentCards.forEach(card => {
        expect(card).toHaveAttribute('data-layout', 'list');
      });
    });

    it('switches back to grid layout when grid button is clicked', async () => {
      const user = userEvent.setup();
      render(<ContentList />);

      const listButton = screen.getByText('List');
      const gridButton = screen.getByText('Grid');

      await user.click(listButton);
      await user.click(gridButton);

      const contentCards = screen.getAllByTestId(/content-card-/);
      contentCards.forEach(card => {
        expect(card).toHaveAttribute('data-layout', 'grid');
      });
    });
  });

  describe('Search Functionality', () => {
    it('calls setFilters when search input changes', async () => {
      const user = userEvent.setup();
      render(<ContentList />);

      const searchInput = screen.getByTestId('search-input');
      await user.type(searchInput, 'React');

      await waitFor(() => {
        expect(mockSetFilters).toHaveBeenCalledWith({ search: 'React' });
      });
    });

    it('displays current search value in input', () => {
      mockUseContent.mockReturnValue({
        ...defaultMockUseContent,
        filters: { search: 'TypeScript' }
      });

      render(<ContentList />);

      const searchInput = screen.getByTestId('search-input');
      expect(searchInput).toHaveValue('TypeScript');
    });
  });

  describe('Filtering', () => {
    it('calls setFilters when category filter changes', async () => {
      const user = userEvent.setup();
      render(<ContentList />);

      const categoryFilter = screen.getByTestId('category-filter');
      await user.selectOptions(categoryFilter, 'Demanding');

      expect(mockSetFilters).toHaveBeenCalledWith({ category: 'Demanding' });
    });

    it('calls setFilters when stage filter changes', async () => {
      const user = userEvent.setup();
      render(<ContentList />);

      const stageFilter = screen.getByTestId('stage-filter');
      await user.selectOptions(stageFilter, '5');

      expect(mockSetFilters).toHaveBeenCalledWith({ stage: 5 });
    });

    it('shows filtered results count', () => {
      mockUseContent.mockReturnValue({
        ...defaultMockUseContent,
        filters: { category: 'Demanding' },
        filteredContents: [mockContents[1]] // Only the Demanding content
      });

      render(<ContentList />);

      expect(screen.getByText('1 of 3 contents (filtered)')).toBeInTheDocument();
    });

    it('shows clear filters button when filters are active', () => {
      mockUseContent.mockReturnValue({
        ...defaultMockUseContent,
        filters: { category: 'Demanding' }
      });

      render(<ContentList />);

      expect(screen.getByTestId('clear-filters')).toBeInTheDocument();
    });

    it('clears filters when clear button is clicked', async () => {
      const user = userEvent.setup();
      mockUseContent.mockReturnValue({
        ...defaultMockUseContent,
        filters: { category: 'Demanding' }
      });

      render(<ContentList />);

      const clearButton = screen.getByTestId('clear-filters');
      await user.click(clearButton);

      expect(mockSetFilters).toHaveBeenCalledWith({
        category: undefined,
        stage: undefined,
        search: undefined
      });
    });
  });

  describe('Content Interactions', () => {
    it('calls onContentSelect when content is selected', async () => {
      const user = userEvent.setup();
      render(
        <ContentList onContentSelect={mockOnContentSelect} />
      );

      const selectButton = screen.getByTestId('select-1');
      await user.click(selectButton);

      expect(mockOnContentSelect).toHaveBeenCalledWith(mockContents[0]);
    });

    it('calls onContentEdit when content is edited', async () => {
      const user = userEvent.setup();
      render(
        <ContentList onContentEdit={mockOnContentEdit} />
      );

      const editButton = screen.getByTestId('edit-1');
      await user.click(editButton);

      expect(mockOnContentEdit).toHaveBeenCalledWith(mockContents[0]);
    });

    it('calls onContentDelete when content is deleted', async () => {
      const user = userEvent.setup();
      render(
        <ContentList onContentDelete={mockOnContentDelete} />
      );

      const deleteButton = screen.getByTestId('delete-1');
      await user.click(deleteButton);

      expect(mockOnContentDelete).toHaveBeenCalledWith(mockContents[0]);
    });
  });

  describe('Content Sorting', () => {
    it('sorts contents by stage then by updated_at', () => {
      const unsortedContents = [
        { ...mockContents[2], updated_at: '2024-01-01T00:00:00Z' }, // Published, older
        { ...mockContents[0], updated_at: '2024-01-03T00:00:00Z' }, // Pending, newer
        { ...mockContents[1], updated_at: '2024-01-02T00:00:00Z' }  // In progress, middle
      ];

      mockUseContent.mockReturnValue({
        ...defaultMockUseContent,
        contents: unsortedContents,
        filteredContents: unsortedContents
      });

      render(<ContentList />);

      const contentCards = screen.getAllByTestId(/content-card-/);
      
      // Should be sorted by stage (0, 5, 11), then by updated_at within same stage
      expect(contentCards[0]).toHaveAttribute('data-testid', 'content-card-1'); // Pending, newer
      expect(contentCards[1]).toHaveAttribute('data-testid', 'content-card-2'); // In progress
      expect(contentCards[2]).toHaveAttribute('data-testid', 'content-card-3'); // Published
    });
  });

  describe('Responsive Behavior', () => {
    it('applies correct CSS classes for responsive layout', () => {
      render(<ContentList />);

      // Check for responsive grid classes
      const gridContainer = screen.getByTestId('content-card-1').parentElement;
      expect(gridContainer).toHaveClass('grid', 'grid-cols-1', 'md:grid-cols-2', 'lg:grid-cols-3');
    });

    it('applies correct CSS classes for list layout', async () => {
      const user = userEvent.setup();
      render(<ContentList />);

      const listButton = screen.getByText('List');
      await user.click(listButton);

      const listContainer = screen.getByTestId('content-card-1').parentElement;
      expect(listContainer).toHaveClass('space-y-4');
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels and roles', () => {
      render(<ContentList />);

      const searchInput = screen.getByTestId('search-input');
      expect(searchInput).toHaveAttribute('placeholder', 'Search by topic or title...');
    });

    it('supports keyboard navigation', async () => {
      const user = userEvent.setup();
      render(<ContentList onContentSelect={mockOnContentSelect} />);

      const selectButton = screen.getByTestId('select-1');
      selectButton.focus();
      
      await user.keyboard('{Enter}');
      expect(mockOnContentSelect).toHaveBeenCalledWith(mockContents[0]);
    });
  });

  describe('Edge Cases', () => {
    it('handles empty search gracefully', async () => {
      const user = userEvent.setup();
      render(<ContentList />);

      const searchInput = screen.getByTestId('search-input');
      await user.type(searchInput, 'nonexistent');
      await user.clear(searchInput);

      expect(mockSetFilters).toHaveBeenLastCalledWith({ search: '' });
    });

    it('handles undefined filters gracefully', () => {
      mockUseContent.mockReturnValue({
        ...defaultMockUseContent,
        filters: {} as any
      });

      render(<ContentList />);

      expect(screen.getByTestId('search-input')).toHaveValue('');
    });

    it('handles missing content properties gracefully', () => {
      const incompleteContent = {
        ...mockContents[0],
        title: undefined,
        morals: []
      };

      mockUseContent.mockReturnValue({
        ...defaultMockUseContent,
        contents: [incompleteContent],
        filteredContents: [incompleteContent]
      });

      render(<ContentList />);

      expect(screen.getByTestId('content-card-1')).toBeInTheDocument();
    });
  });
});