import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { ToastContainer } from '../ToastContainer';
import { AppError } from '../../../hooks/useErrorHandler';

const createMockError = (id: string, type: AppError['type'] = 'error'): AppError => ({
  id,
  message: `Test error ${id}`,
  type,
  timestamp: Date.now(),
  context: 'test-context',
});

const mockOnRemoveError = vi.fn();

describe('ToastContainer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing when no errors are provided', () => {
    const { container } = render(
      <ToastContainer errors={[]} onRemoveError={mockOnRemoveError} />
    );

    expect(container.firstChild).toBeNull();
  });

  it('renders single error toast', () => {
    const errors = [createMockError('1')];

    render(<ToastContainer errors={errors} onRemoveError={mockOnRemoveError} />);

    expect(screen.getByText('Test error 1')).toBeInTheDocument();
  });

  it('renders multiple error toasts', () => {
    const errors = [
      createMockError('1'),
      createMockError('2'),
      createMockError('3'),
    ];

    render(<ToastContainer errors={errors} onRemoveError={mockOnRemoveError} />);

    expect(screen.getByText('Test error 1')).toBeInTheDocument();
    expect(screen.getByText('Test error 2')).toBeInTheDocument();
    expect(screen.getByText('Test error 3')).toBeInTheDocument();
  });

  it('limits the number of displayed toasts based on maxToasts prop', () => {
    const errors = [
      createMockError('1'),
      createMockError('2'),
      createMockError('3'),
      createMockError('4'),
      createMockError('5'),
      createMockError('6'),
    ];

    render(
      <ToastContainer 
        errors={errors} 
        onRemoveError={mockOnRemoveError} 
        maxToasts={3}
      />
    );

    // Should only show the last 3 toasts
    expect(screen.queryByText('Test error 1')).not.toBeInTheDocument();
    expect(screen.queryByText('Test error 2')).not.toBeInTheDocument();
    expect(screen.queryByText('Test error 3')).not.toBeInTheDocument();
    expect(screen.getByText('Test error 4')).toBeInTheDocument();
    expect(screen.getByText('Test error 5')).toBeInTheDocument();
    expect(screen.getByText('Test error 6')).toBeInTheDocument();
  });

  it('applies correct position classes for top-right', () => {
    const errors = [createMockError('1')];

    render(
      <ToastContainer 
        errors={errors} 
        onRemoveError={mockOnRemoveError} 
        position="top-right"
      />
    );

    const container = screen.getByRole('alert');
    expect(container).toHaveClass('top-4', 'right-4');
  });

  it('applies correct position classes for top-left', () => {
    const errors = [createMockError('1')];

    render(
      <ToastContainer 
        errors={errors} 
        onRemoveError={mockOnRemoveError} 
        position="top-left"
      />
    );

    const container = screen.getByRole('alert');
    expect(container).toHaveClass('top-4', 'left-4');
  });

  it('applies correct position classes for bottom-right', () => {
    const errors = [createMockError('1')];

    render(
      <ToastContainer 
        errors={errors} 
        onRemoveError={mockOnRemoveError} 
        position="bottom-right"
      />
    );

    const container = screen.getByRole('alert');
    expect(container).toHaveClass('bottom-4', 'right-4');
  });

  it('applies correct position classes for bottom-left', () => {
    const errors = [createMockError('1')];

    render(
      <ToastContainer 
        errors={errors} 
        onRemoveError={mockOnRemoveError} 
        position="bottom-left"
      />
    );

    const container = screen.getByRole('alert');
    expect(container).toHaveClass('bottom-4', 'left-4');
  });

  it('applies correct position classes for top-center', () => {
    const errors = [createMockError('1')];

    render(
      <ToastContainer 
        errors={errors} 
        onRemoveError={mockOnRemoveError} 
        position="top-center"
      />
    );

    const container = screen.getByRole('alert');
    expect(container).toHaveClass('top-4', 'left-1/2', 'transform', '-translate-x-1/2');
  });

  it('uses default position when invalid position is provided', () => {
    const errors = [createMockError('1')];

    render(
      <ToastContainer 
        errors={errors} 
        onRemoveError={mockOnRemoveError} 
        position={'invalid' as any}
      />
    );

    const container = screen.getByRole('alert');
    expect(container).toHaveClass('top-4', 'right-4');
  });

  it('passes onRemoveError to individual toasts', () => {
    const errors = [createMockError('1')];

    render(<ToastContainer errors={errors} onRemoveError={mockOnRemoveError} />);

    const dismissButton = screen.getByRole('button', { name: 'Dismiss' });
    fireEvent.click(dismissButton);

    expect(mockOnRemoveError).toHaveBeenCalledWith('1');
  });

  it('has proper accessibility attributes', () => {
    const errors = [createMockError('1')];

    render(<ToastContainer errors={errors} onRemoveError={mockOnRemoveError} />);

    const container = screen.getByRole('alert');
    expect(container).toHaveAttribute('aria-live', 'polite');
  });

  it('applies transition classes to individual toasts', () => {
    const errors = [createMockError('1')];

    render(<ToastContainer errors={errors} onRemoveError={mockOnRemoveError} />);

    const toastWrapper = screen.getByText('Test error 1').closest('div')?.parentElement;
    expect(toastWrapper).toHaveClass('transform', 'transition-all', 'duration-300', 'ease-in-out');
  });

  it('uses default maxToasts value when not provided', () => {
    const errors = Array.from({ length: 10 }, (_, i) => createMockError(`${i + 1}`));

    render(<ToastContainer errors={errors} onRemoveError={mockOnRemoveError} />);

    // Should show last 5 toasts (default maxToasts)
    expect(screen.queryByText('Test error 1')).not.toBeInTheDocument();
    expect(screen.queryByText('Test error 5')).not.toBeInTheDocument();
    expect(screen.getByText('Test error 6')).toBeInTheDocument();
    expect(screen.getByText('Test error 10')).toBeInTheDocument();
  });
});