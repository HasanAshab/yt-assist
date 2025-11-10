import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { ErrorToast } from '../ErrorToast';
import { AppError } from '../../../hooks/useErrorHandler';

const mockError: AppError = {
  id: 'test-error-1',
  message: 'Test error message',
  type: 'error',
  timestamp: Date.now(),
  context: 'test-context',
};

const mockOnClose = vi.fn();

describe('ErrorToast', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders error toast with correct message', () => {
    render(<ErrorToast error={mockError} onClose={mockOnClose} />);

    expect(screen.getByText('Test error message')).toBeInTheDocument();
    expect(screen.getByText('Context: test-context')).toBeInTheDocument();
  });

  it('renders error type with red styling', () => {
    render(<ErrorToast error={mockError} onClose={mockOnClose} />);

    const container = screen.getByText('Test error message').closest('div');
    expect(container).toHaveClass('bg-red-50', 'border-red-200');
  });

  it('renders warning type with yellow styling', () => {
    const warningError: AppError = {
      ...mockError,
      type: 'warning',
    };

    render(<ErrorToast error={warningError} onClose={mockOnClose} />);

    const container = screen.getByText('Test error message').closest('div');
    expect(container).toHaveClass('bg-yellow-50', 'border-yellow-200');
  });

  it('renders info type with green styling', () => {
    const infoError: AppError = {
      ...mockError,
      type: 'info',
    };

    render(<ErrorToast error={infoError} onClose={mockOnClose} />);

    const container = screen.getByText('Test error message').closest('div');
    expect(container).toHaveClass('bg-green-50', 'border-green-200');
  });

  it('shows correct icon for error type', () => {
    render(<ErrorToast error={mockError} onClose={mockOnClose} />);

    const icon = screen.getByRole('button', { name: 'Dismiss' }).previousElementSibling;
    expect(icon).toHaveClass('text-red-500');
  });

  it('shows correct icon for warning type', () => {
    const warningError: AppError = {
      ...mockError,
      type: 'warning',
    };

    render(<ErrorToast error={warningError} onClose={mockOnClose} />);

    const icon = screen.getByRole('button', { name: 'Dismiss' }).previousElementSibling;
    expect(icon).toHaveClass('text-yellow-500');
  });

  it('shows correct icon for info type', () => {
    const infoError: AppError = {
      ...mockError,
      type: 'info',
    };

    render(<ErrorToast error={infoError} onClose={mockOnClose} />);

    const icon = screen.getByRole('button', { name: 'Dismiss' }).previousElementSibling;
    expect(icon).toHaveClass('text-green-500');
  });

  it('calls onClose when dismiss button is clicked', () => {
    render(<ErrorToast error={mockError} onClose={mockOnClose} />);

    fireEvent.click(screen.getByRole('button', { name: 'Dismiss' }));

    expect(mockOnClose).toHaveBeenCalledWith('test-error-1');
  });

  it('auto-closes non-error types after 5 seconds', async () => {
    const infoError: AppError = {
      ...mockError,
      type: 'info',
    };

    render(<ErrorToast error={infoError} onClose={mockOnClose} />);

    // Fast-forward time by 5 seconds
    vi.advanceTimersByTime(5000);

    await waitFor(() => {
      expect(mockOnClose).toHaveBeenCalledWith('test-error-1');
    });
  });

  it('does not auto-close error types', async () => {
    render(<ErrorToast error={mockError} onClose={mockOnClose} />);

    // Fast-forward time by 10 seconds
    vi.advanceTimersByTime(10000);

    await waitFor(() => {
      expect(mockOnClose).not.toHaveBeenCalled();
    });
  });

  it('renders without context when context is not provided', () => {
    const errorWithoutContext: AppError = {
      ...mockError,
      context: undefined,
    };

    render(<ErrorToast error={errorWithoutContext} onClose={mockOnClose} />);

    expect(screen.getByText('Test error message')).toBeInTheDocument();
    expect(screen.queryByText(/Context:/)).not.toBeInTheDocument();
  });

  it('clears timeout when component unmounts', () => {
    const infoError: AppError = {
      ...mockError,
      type: 'info',
    };

    const { unmount } = render(<ErrorToast error={infoError} onClose={mockOnClose} />);

    // Unmount before timeout
    unmount();

    // Fast-forward time
    vi.advanceTimersByTime(5000);

    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it('handles keyboard navigation for dismiss button', () => {
    render(<ErrorToast error={mockError} onClose={mockOnClose} />);

    const dismissButton = screen.getByRole('button', { name: 'Dismiss' });
    
    // Focus the button
    dismissButton.focus();
    expect(dismissButton).toHaveFocus();

    // Press Enter
    fireEvent.keyDown(dismissButton, { key: 'Enter', code: 'Enter' });
    fireEvent.click(dismissButton);

    expect(mockOnClose).toHaveBeenCalledWith('test-error-1');
  });
});