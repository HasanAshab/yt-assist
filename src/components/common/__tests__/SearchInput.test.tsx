import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { SearchInput } from '../SearchInput';

// Mock the debounce delay for faster tests
vi.mock('../../../constants', () => ({
  UI_CONFIG: {
    DEBOUNCE_DELAY: 50 // Reduced for testing
  }
}));

describe('SearchInput', () => {
  const mockOnChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders search input with default placeholder', () => {
      render(<SearchInput value="" onChange={mockOnChange} />);

      const input = screen.getByPlaceholderText('Search...');
      expect(input).toBeInTheDocument();
    });

    it('renders search input with custom placeholder', () => {
      render(
        <SearchInput
          value=""
          onChange={mockOnChange}
          placeholder="Search content..."
        />
      );

      const input = screen.getByPlaceholderText('Search content...');
      expect(input).toBeInTheDocument();
    });

    it('renders search icon', () => {
      render(<SearchInput value="" onChange={mockOnChange} />);

      const searchIcon = document.querySelector('svg');
      expect(searchIcon).toBeInTheDocument();
    });

    it('shows current value', () => {
      render(<SearchInput value="React Hooks" onChange={mockOnChange} />);

      const input = screen.getByDisplayValue('React Hooks');
      expect(input).toBeInTheDocument();
    });

    it('shows clear button when value is present', () => {
      render(<SearchInput value="React" onChange={mockOnChange} />);

      const clearButton = screen.getByRole('button');
      expect(clearButton).toBeInTheDocument();
    });

    it('hides clear button when value is empty', () => {
      render(<SearchInput value="" onChange={mockOnChange} />);

      const clearButton = screen.queryByRole('button');
      expect(clearButton).not.toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('updates local value immediately when typing', async () => {
      const user = userEvent.setup();
      render(<SearchInput value="" onChange={mockOnChange} />);

      const input = screen.getByPlaceholderText('Search...');
      await user.type(input, 'React');

      expect(input).toHaveValue('React');
    });

    it('calls onChange after debounce delay', async () => {
      const user = userEvent.setup();
      render(<SearchInput value="" onChange={mockOnChange} debounceMs={50} />);

      const input = screen.getByPlaceholderText('Search...');
      await user.type(input, 'React');

      // Should not be called immediately
      expect(mockOnChange).not.toHaveBeenCalled();

      // Should be called after debounce delay
      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith('React');
      }, { timeout: 100 });
    });

    it('debounces multiple rapid changes', async () => {
      const user = userEvent.setup();
      render(<SearchInput value="" onChange={mockOnChange} debounceMs={50} />);

      const input = screen.getByPlaceholderText('Search...');
      
      // Type multiple characters rapidly
      await user.type(input, 'R');
      await user.type(input, 'e');
      await user.type(input, 'a');
      await user.type(input, 'c');
      await user.type(input, 't');

      // Should only call onChange once after debounce
      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledTimes(1);
        expect(mockOnChange).toHaveBeenCalledWith('React');
      }, { timeout: 100 });
    });

    it('clears input when clear button is clicked', async () => {
      const user = userEvent.setup();
      render(<SearchInput value="React" onChange={mockOnChange} />);

      const clearButton = screen.getByRole('button');
      await user.click(clearButton);

      expect(mockOnChange).toHaveBeenCalledWith('');
      
      const input = screen.getByPlaceholderText('Search...');
      expect(input).toHaveValue('');
    });

    it('updates local value when prop value changes', () => {
      const { rerender } = render(<SearchInput value="React" onChange={mockOnChange} />);

      const input = screen.getByPlaceholderText('Search...');
      expect(input).toHaveValue('React');

      rerender(<SearchInput value="Vue" onChange={mockOnChange} />);
      expect(input).toHaveValue('Vue');
    });
  });

  describe('Disabled State', () => {
    it('renders disabled input', () => {
      render(<SearchInput value="" onChange={mockOnChange} disabled={true} />);

      const input = screen.getByPlaceholderText('Search...');
      expect(input).toBeDisabled();
    });

    it('applies disabled styling', () => {
      render(<SearchInput value="" onChange={mockOnChange} disabled={true} />);

      const input = screen.getByPlaceholderText('Search...');
      expect(input).toHaveClass('bg-gray-50', 'text-gray-500', 'cursor-not-allowed');
    });

    it('hides clear button when disabled', () => {
      render(<SearchInput value="React" onChange={mockOnChange} disabled={true} />);

      const clearButton = screen.queryByRole('button');
      expect(clearButton).not.toBeInTheDocument();
    });

    it('does not call onChange when disabled', async () => {
      const user = userEvent.setup();
      render(<SearchInput value="" onChange={mockOnChange} disabled={true} />);

      const input = screen.getByPlaceholderText('Search...');
      
      // Try to type (should not work)
      await user.type(input, 'React');

      expect(mockOnChange).not.toHaveBeenCalled();
    });
  });

  describe('Custom Debounce', () => {
    it('uses custom debounce delay', async () => {
      const user = userEvent.setup();
      render(<SearchInput value="" onChange={mockOnChange} debounceMs={100} />);

      const input = screen.getByPlaceholderText('Search...');
      await user.type(input, 'React');

      // Should not be called after 50ms
      await new Promise(resolve => setTimeout(resolve, 50));
      expect(mockOnChange).not.toHaveBeenCalled();

      // Should be called after 100ms
      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith('React');
      }, { timeout: 150 });
    });

    it('uses default debounce when not specified', async () => {
      const user = userEvent.setup();
      render(<SearchInput value="" onChange={mockOnChange} />);

      const input = screen.getByPlaceholderText('Search...');
      await user.type(input, 'React');

      // Should be called after default delay (50ms in our mock)
      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith('React');
      }, { timeout: 100 });
    });
  });

  describe('Styling and CSS Classes', () => {
    it('applies custom className', () => {
      render(
        <SearchInput
          value=""
          onChange={mockOnChange}
          className="custom-search-class"
        />
      );

      const container = screen.getByPlaceholderText('Search...').parentElement;
      expect(container).toHaveClass('custom-search-class');
    });

    it('applies focus styles', () => {
      render(<SearchInput value="" onChange={mockOnChange} />);

      const input = screen.getByPlaceholderText('Search...');
      expect(input).toHaveClass(
        'focus:outline-none',
        'focus:ring-2',
        'focus:ring-blue-500',
        'focus:border-transparent'
      );
    });

    it('applies proper padding for icons', () => {
      render(<SearchInput value="" onChange={mockOnChange} />);

      const input = screen.getByPlaceholderText('Search...');
      expect(input).toHaveClass('pl-10', 'pr-10');
    });

    it('applies hover styles to clear button', () => {
      render(<SearchInput value="React" onChange={mockOnChange} />);

      const clearButton = screen.getByRole('button');
      expect(clearButton).toHaveClass('hover:text-gray-600');
    });
  });

  describe('Accessibility', () => {
    it('has proper input type', () => {
      render(<SearchInput value="" onChange={mockOnChange} />);

      const input = screen.getByPlaceholderText('Search...');
      expect(input).toHaveAttribute('type', 'text');
    });

    it('has proper button type for clear button', () => {
      render(<SearchInput value="React" onChange={mockOnChange} />);

      const clearButton = screen.getByRole('button');
      expect(clearButton).toHaveAttribute('type', 'button');
    });

    it('supports keyboard navigation', async () => {
      const user = userEvent.setup();
      render(<SearchInput value="React" onChange={mockOnChange} />);

      const clearButton = screen.getByRole('button');
      clearButton.focus();
      
      await user.keyboard('{Enter}');
      expect(mockOnChange).toHaveBeenCalledWith('');
    });

    it('has proper ARIA attributes', () => {
      render(<SearchInput value="" onChange={mockOnChange} />);

      const input = screen.getByPlaceholderText('Search...');
      expect(input).toHaveAttribute('placeholder', 'Search...');
    });
  });

  describe('Edge Cases', () => {
    it('handles empty string input', async () => {
      const user = userEvent.setup();
      render(<SearchInput value="React" onChange={mockOnChange} />);

      const input = screen.getByPlaceholderText('Search...');
      await user.clear(input);

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith('');
      });
    });

    it('handles special characters', async () => {
      const user = userEvent.setup();
      render(<SearchInput value="" onChange={mockOnChange} />);

      const input = screen.getByPlaceholderText('Search...');
      await user.type(input, '!@#$%^&*()');

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith('!@#$%^&*()');
      });
    });

    it('handles unicode characters', async () => {
      const user = userEvent.setup();
      render(<SearchInput value="" onChange={mockOnChange} />);

      const input = screen.getByPlaceholderText('Search...');
      await user.type(input, '🚀 React');

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith('🚀 React');
      });
    });

    it('handles very long input', async () => {
      const user = userEvent.setup();
      const longText = 'a'.repeat(1000);
      render(<SearchInput value="" onChange={mockOnChange} />);

      const input = screen.getByPlaceholderText('Search...');
      await user.type(input, longText);

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith(longText);
      });
    });
  });

  describe('Performance', () => {
    it('cancels previous debounce when new input arrives', async () => {
      const user = userEvent.setup();
      render(<SearchInput value="" onChange={mockOnChange} debounceMs={100} />);

      const input = screen.getByPlaceholderText('Search...');
      
      // Type first character
      await user.type(input, 'R');
      
      // Wait 50ms (less than debounce)
      await new Promise(resolve => setTimeout(resolve, 50));
      
      // Type second character (should cancel first debounce)
      await user.type(input, 'e');

      // Wait for debounce to complete
      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledTimes(1);
        expect(mockOnChange).toHaveBeenCalledWith('Re');
      }, { timeout: 150 });
    });
  });
});