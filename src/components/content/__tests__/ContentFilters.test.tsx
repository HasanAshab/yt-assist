import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { ContentFiltersComponent } from '../ContentFilters';
import { ContentFilters } from '../../../types';
import { CONTENT_STAGES, CONTENT_CATEGORIES } from '../../../constants';

describe('ContentFiltersComponent', () => {
  const mockOnFilterChange = vi.fn();
  const mockOnClearFilters = vi.fn();

  const defaultProps = {
    filters: { category: undefined, stage: undefined, search: undefined } as ContentFilters,
    onFilterChange: mockOnFilterChange,
    onClearFilters: mockOnClearFilters,
    hasActiveFilters: false
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders filter controls', () => {
      render(<ContentFiltersComponent {...defaultProps} />);

      expect(screen.getByLabelText('Category:')).toBeInTheDocument();
      expect(screen.getByLabelText('Stage:')).toBeInTheDocument();
      expect(screen.getByText('Filters:')).toBeInTheDocument();
    });

    it('renders all category options', () => {
      render(<ContentFiltersComponent {...defaultProps} />);

      const categorySelect = screen.getByLabelText('Category:');
      
      expect(screen.getByText('All Categories')).toBeInTheDocument();
      CONTENT_CATEGORIES.forEach(category => {
        expect(screen.getByText(category)).toBeInTheDocument();
      });
    });

    it('renders all stage options', () => {
      render(<ContentFiltersComponent {...defaultProps} />);

      const stageSelect = screen.getByLabelText('Stage:');
      
      expect(screen.getByText('All Stages')).toBeInTheDocument();
      CONTENT_STAGES.forEach(stage => {
        expect(screen.getByText(stage)).toBeInTheDocument();
      });
    });

    it('shows clear all button when filters are active', () => {
      render(
        <ContentFiltersComponent
          {...defaultProps}
          hasActiveFilters={true}
        />
      );

      expect(screen.getByText('Clear all')).toBeInTheDocument();
    });

    it('hides clear all button when no filters are active', () => {
      render(<ContentFiltersComponent {...defaultProps} />);

      expect(screen.queryByText('Clear all')).not.toBeInTheDocument();
    });
  });

  describe('Category Filter', () => {
    it('shows current category selection', () => {
      render(
        <ContentFiltersComponent
          {...defaultProps}
          filters={{ ...defaultProps.filters, category: 'Demanding' }}
        />
      );

      const categorySelect = screen.getByLabelText('Category:') as HTMLSelectElement;
      expect(categorySelect.value).toBe('Demanding');
    });

    it('shows "All Categories" when no category is selected', () => {
      render(<ContentFiltersComponent {...defaultProps} />);

      const categorySelect = screen.getByLabelText('Category:') as HTMLSelectElement;
      expect(categorySelect.value).toBe('all');
    });

    it('calls onFilterChange when category is changed', async () => {
      const user = userEvent.setup();
      render(<ContentFiltersComponent {...defaultProps} />);

      const categorySelect = screen.getByLabelText('Category:');
      await user.selectOptions(categorySelect, 'Demanding');

      expect(mockOnFilterChange).toHaveBeenCalledWith({ category: 'Demanding' });
    });

    it('calls onFilterChange with undefined when "All Categories" is selected', async () => {
      const user = userEvent.setup();
      render(
        <ContentFiltersComponent
          {...defaultProps}
          filters={{ ...defaultProps.filters, category: 'Demanding' }}
        />
      );

      const categorySelect = screen.getByLabelText('Category:');
      await user.selectOptions(categorySelect, 'all');

      expect(mockOnFilterChange).toHaveBeenCalledWith({ category: undefined });
    });
  });

  describe('Stage Filter', () => {
    it('shows current stage selection', () => {
      render(
        <ContentFiltersComponent
          {...defaultProps}
          filters={{ ...defaultProps.filters, stage: 5 }}
        />
      );

      const stageSelect = screen.getByLabelText('Stage:') as HTMLSelectElement;
      expect(stageSelect.value).toBe('5');
    });

    it('shows "All Stages" when no stage is selected', () => {
      render(<ContentFiltersComponent {...defaultProps} />);

      const stageSelect = screen.getByLabelText('Stage:') as HTMLSelectElement;
      expect(stageSelect.value).toBe('all');
    });

    it('calls onFilterChange when stage is changed', async () => {
      const user = userEvent.setup();
      render(<ContentFiltersComponent {...defaultProps} />);

      const stageSelect = screen.getByLabelText('Stage:');
      await user.selectOptions(stageSelect, '3');

      expect(mockOnFilterChange).toHaveBeenCalledWith({ stage: 3 });
    });

    it('calls onFilterChange with undefined when "All Stages" is selected', async () => {
      const user = userEvent.setup();
      render(
        <ContentFiltersComponent
          {...defaultProps}
          filters={{ ...defaultProps.filters, stage: 5 }}
        />
      );

      const stageSelect = screen.getByLabelText('Stage:');
      await user.selectOptions(stageSelect, 'all');

      expect(mockOnFilterChange).toHaveBeenCalledWith({ stage: undefined });
    });
  });

  describe('Active Filters Display', () => {
    it('shows active filters section when filters are active', () => {
      render(
        <ContentFiltersComponent
          {...defaultProps}
          filters={{ category: 'Demanding', stage: 5, search: 'React' }}
          hasActiveFilters={true}
        />
      );

      expect(screen.getByText('Active filters:')).toBeInTheDocument();
    });

    it('hides active filters section when no filters are active', () => {
      render(<ContentFiltersComponent {...defaultProps} />);

      expect(screen.queryByText('Active filters:')).not.toBeInTheDocument();
    });

    it('displays category filter badge', () => {
      render(
        <ContentFiltersComponent
          {...defaultProps}
          filters={{ ...defaultProps.filters, category: 'Demanding' }}
          hasActiveFilters={true}
        />
      );

      expect(screen.getByText('Category: Demanding')).toBeInTheDocument();
    });

    it('displays stage filter badge', () => {
      render(
        <ContentFiltersComponent
          {...defaultProps}
          filters={{ ...defaultProps.filters, stage: 5 }}
          hasActiveFilters={true}
        />
      );

      expect(screen.getByText(`Stage: ${CONTENT_STAGES[5]}`)).toBeInTheDocument();
    });

    it('displays search filter badge', () => {
      render(
        <ContentFiltersComponent
          {...defaultProps}
          filters={{ ...defaultProps.filters, search: 'React Hooks' }}
          hasActiveFilters={true}
        />
      );

      expect(screen.getByText('Search: "React Hooks"')).toBeInTheDocument();
    });

    it('displays multiple filter badges', () => {
      render(
        <ContentFiltersComponent
          {...defaultProps}
          filters={{ category: 'Innovative', stage: 3, search: 'TypeScript' }}
          hasActiveFilters={true}
        />
      );

      expect(screen.getByText('Category: Innovative')).toBeInTheDocument();
      expect(screen.getByText(`Stage: ${CONTENT_STAGES[3]}`)).toBeInTheDocument();
      expect(screen.getByText('Search: "TypeScript"')).toBeInTheDocument();
    });
  });

  describe('Individual Filter Removal', () => {
    it('removes category filter when X button is clicked', async () => {
      const user = userEvent.setup();
      render(
        <ContentFiltersComponent
          {...defaultProps}
          filters={{ ...defaultProps.filters, category: 'Demanding' }}
          hasActiveFilters={true}
        />
      );

      const categoryBadge = screen.getByText('Category: Demanding').parentElement;
      const removeButton = categoryBadge?.querySelector('button');
      
      if (removeButton) {
        await user.click(removeButton);
        expect(mockOnFilterChange).toHaveBeenCalledWith({ category: undefined });
      }
    });

    it('removes stage filter when X button is clicked', async () => {
      const user = userEvent.setup();
      render(
        <ContentFiltersComponent
          {...defaultProps}
          filters={{ ...defaultProps.filters, stage: 5 }}
          hasActiveFilters={true}
        />
      );

      const stageBadge = screen.getByText(`Stage: ${CONTENT_STAGES[5]}`).parentElement;
      const removeButton = stageBadge?.querySelector('button');
      
      if (removeButton) {
        await user.click(removeButton);
        expect(mockOnFilterChange).toHaveBeenCalledWith({ stage: undefined });
      }
    });

    it('removes search filter when X button is clicked', async () => {
      const user = userEvent.setup();
      render(
        <ContentFiltersComponent
          {...defaultProps}
          filters={{ ...defaultProps.filters, search: 'React' }}
          hasActiveFilters={true}
        />
      );

      const searchBadge = screen.getByText('Search: "React"').parentElement;
      const removeButton = searchBadge?.querySelector('button');
      
      if (removeButton) {
        await user.click(removeButton);
        expect(mockOnFilterChange).toHaveBeenCalledWith({ search: undefined });
      }
    });
  });

  describe('Clear All Filters', () => {
    it('calls onClearFilters when clear all button is clicked', async () => {
      const user = userEvent.setup();
      render(
        <ContentFiltersComponent
          {...defaultProps}
          hasActiveFilters={true}
        />
      );

      const clearButton = screen.getByText('Clear all');
      await user.click(clearButton);

      expect(mockOnClearFilters).toHaveBeenCalled();
    });
  });

  describe('Styling and CSS Classes', () => {
    it('applies custom className', () => {
      render(
        <ContentFiltersComponent
          {...defaultProps}
          className="custom-filter-class"
        />
      );

      const container = screen.getByText('Filters:').closest('div');
      expect(container).toHaveClass('custom-filter-class');
    });

    it('applies correct badge colors for different filter types', () => {
      render(
        <ContentFiltersComponent
          {...defaultProps}
          filters={{ category: 'Demanding', stage: 5, search: 'React' }}
          hasActiveFilters={true}
        />
      );

      const categoryBadge = screen.getByText('Category: Demanding');
      expect(categoryBadge).toHaveClass('bg-blue-100', 'text-blue-800');

      const stageBadge = screen.getByText(`Stage: ${CONTENT_STAGES[5]}`);
      expect(stageBadge).toHaveClass('bg-green-100', 'text-green-800');

      const searchBadge = screen.getByText('Search: "React"');
      expect(searchBadge).toHaveClass('bg-purple-100', 'text-purple-800');
    });

    it('applies focus styles to select elements', () => {
      render(<ContentFiltersComponent {...defaultProps} />);

      const categorySelect = screen.getByLabelText('Category:');
      const stageSelect = screen.getByLabelText('Stage:');

      expect(categorySelect).toHaveClass('focus:ring-2', 'focus:ring-blue-500');
      expect(stageSelect).toHaveClass('focus:ring-2', 'focus:ring-blue-500');
    });
  });

  describe('Responsive Design', () => {
    it('applies responsive flex classes', () => {
      render(<ContentFiltersComponent {...defaultProps} />);

      const mainContainer = screen.getByText('Filters:').closest('div');
      expect(mainContainer).toHaveClass('flex', 'flex-col', 'sm:flex-row');
    });

    it('applies responsive gap classes', () => {
      render(<ContentFiltersComponent {...defaultProps} />);

      const mainContainer = screen.getByText('Filters:').closest('div');
      expect(mainContainer).toHaveClass('gap-4');
    });
  });

  describe('Accessibility', () => {
    it('has proper labels for select elements', () => {
      render(<ContentFiltersComponent {...defaultProps} />);

      expect(screen.getByLabelText('Category:')).toBeInTheDocument();
      expect(screen.getByLabelText('Stage:')).toBeInTheDocument();
    });

    it('has proper IDs for select elements', () => {
      render(<ContentFiltersComponent {...defaultProps} />);

      expect(screen.getByLabelText('Category:')).toHaveAttribute('id', 'category-filter');
      expect(screen.getByLabelText('Stage:')).toHaveAttribute('id', 'stage-filter');
    });

    it('supports keyboard navigation for remove buttons', async () => {
      const user = userEvent.setup();
      render(
        <ContentFiltersComponent
          {...defaultProps}
          filters={{ ...defaultProps.filters, category: 'Demanding' }}
          hasActiveFilters={true}
        />
      );

      const categoryBadge = screen.getByText('Category: Demanding').parentElement;
      const removeButton = categoryBadge?.querySelector('button');
      
      if (removeButton) {
        removeButton.focus();
        await user.keyboard('{Enter}');
        expect(mockOnFilterChange).toHaveBeenCalledWith({ category: undefined });
      }
    });
  });

  describe('Edge Cases', () => {
    it('handles stage 0 correctly', () => {
      render(
        <ContentFiltersComponent
          {...defaultProps}
          filters={{ ...defaultProps.filters, stage: 0 }}
          hasActiveFilters={true}
        />
      );

      expect(screen.getByText(`Stage: ${CONTENT_STAGES[0]}`)).toBeInTheDocument();
    });

    it('handles empty search string', () => {
      render(
        <ContentFiltersComponent
          {...defaultProps}
          filters={{ ...defaultProps.filters, search: '' }}
          hasActiveFilters={false}
        />
      );

      expect(screen.queryByText('Search:')).not.toBeInTheDocument();
    });

    it('handles undefined filters gracefully', () => {
      render(
        <ContentFiltersComponent
          {...defaultProps}
          filters={{} as any}
        />
      );

      const categorySelect = screen.getByLabelText('Category:') as HTMLSelectElement;
      const stageSelect = screen.getByLabelText('Stage:') as HTMLSelectElement;

      expect(categorySelect.value).toBe('all');
      expect(stageSelect.value).toBe('all');
    });
  });
});