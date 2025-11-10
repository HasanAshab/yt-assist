import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TaskForm } from '../TaskForm';
import { TaskService } from '../../../services/task.service';
import { TaskFormData } from '../../../types';

// Mock environment variables
vi.mock('../../../constants', () => ({
  API_CONFIG: {
    SUPABASE_URL: 'http://localhost:54321',
    SUPABASE_ANON_KEY: 'test-key'
  }
}));

// Mock Supabase
vi.mock('../../../services/supabase', () => ({
  supabase: {},
  handleSupabaseError: vi.fn(),
  getEndOfDay: vi.fn()
}));

// Mock TaskService
vi.mock('../../../services/task.service');
const mockTaskService = vi.mocked(TaskService);

const mockProps = {
  onSubmit: vi.fn(),
  onCancel: vi.fn()
};

describe('TaskForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockTaskService.validateTaskData.mockReturnValue({ isValid: true, errors: [] });
  });

  it('should render form fields', () => {
    render(<TaskForm {...mockProps} />);

    expect(screen.getByLabelText(/Task Title/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Description/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Link/)).toBeInTheDocument();
    expect(screen.getByText('Create Task')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  it('should display initial data when provided', () => {
    const initialData = {
      title: 'Initial Title',
      description: 'Initial Description',
      link: 'https://initial.com'
    };

    render(<TaskForm {...mockProps} initialData={initialData} />);

    expect(screen.getByDisplayValue('Initial Title')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Initial Description')).toBeInTheDocument();
    expect(screen.getByDisplayValue('https://initial.com')).toBeInTheDocument();
  });

  it('should update form fields when user types', () => {
    render(<TaskForm {...mockProps} />);

    const titleInput = screen.getByLabelText(/Task Title/);
    const descriptionInput = screen.getByLabelText(/Description/);
    const linkInput = screen.getByLabelText(/Link/);

    fireEvent.change(titleInput, { target: { value: 'New Task Title' } });
    fireEvent.change(descriptionInput, { target: { value: 'New Description' } });
    fireEvent.change(linkInput, { target: { value: 'https://example.com' } });

    expect(titleInput).toHaveValue('New Task Title');
    expect(descriptionInput).toHaveValue('New Description');
    expect(linkInput).toHaveValue('https://example.com');
  });

  it('should show character counts', () => {
    render(<TaskForm {...mockProps} />);

    expect(screen.getByText('0/200 characters')).toBeInTheDocument();
    expect(screen.getByText('0/1000 characters')).toBeInTheDocument();

    const titleInput = screen.getByLabelText(/Task Title/);
    fireEvent.change(titleInput, { target: { value: 'Test' } });

    expect(screen.getByText('4/200 characters')).toBeInTheDocument();
  });

  it('should call onSubmit with form data when form is submitted', async () => {
    render(<TaskForm {...mockProps} />);

    const titleInput = screen.getByLabelText(/Task Title/);
    const descriptionInput = screen.getByLabelText(/Description/);
    const linkInput = screen.getByLabelText(/Link/);

    fireEvent.change(titleInput, { target: { value: 'Test Task' } });
    fireEvent.change(descriptionInput, { target: { value: 'Test Description' } });
    fireEvent.change(linkInput, { target: { value: 'https://test.com' } });

    const submitButton = screen.getByText('Create Task');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockTaskService.validateTaskData).toHaveBeenCalledWith({
        title: 'Test Task',
        description: 'Test Description',
        link: 'https://test.com'
      });
      expect(mockProps.onSubmit).toHaveBeenCalledWith({
        title: 'Test Task',
        description: 'Test Description',
        link: 'https://test.com'
      });
    });
  });

  it('should call onCancel when cancel button is clicked', () => {
    render(<TaskForm {...mockProps} />);

    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    expect(mockProps.onCancel).toHaveBeenCalled();
  });

  it('should display validation errors', async () => {
    mockTaskService.validateTaskData.mockReturnValue({
      isValid: false,
      errors: ['Task title is required', 'Invalid URL format']
    });

    render(<TaskForm {...mockProps} />);

    // Fill in title to enable submit button
    const titleInput = screen.getByLabelText(/Task Title/);
    fireEvent.change(titleInput, { target: { value: 'Test' } });

    const submitButton = screen.getByText('Create Task');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Please fix the following errors:')).toBeInTheDocument();
      expect(screen.getByText('Task title is required')).toBeInTheDocument();
      expect(screen.getByText('Invalid URL format')).toBeInTheDocument();
    });

    expect(mockProps.onSubmit).not.toHaveBeenCalled();
  });

  it('should clear errors when user starts typing', async () => {
    mockTaskService.validateTaskData.mockReturnValue({
      isValid: false,
      errors: ['Task title is required']
    });

    render(<TaskForm {...mockProps} />);

    // Fill in title to enable submit button, then submit to show errors
    const titleInput = screen.getByLabelText(/Task Title/);
    fireEvent.change(titleInput, { target: { value: 'Test' } });
    
    const submitButton = screen.getByText('Create Task');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Task title is required')).toBeInTheDocument();
    });

    // Start typing to clear errors
    fireEvent.change(titleInput, { target: { value: 'Test Updated' } });

    expect(screen.queryByText('Task title is required')).not.toBeInTheDocument();
  });

  it('should disable submit button when title is empty', () => {
    render(<TaskForm {...mockProps} />);

    const submitButton = screen.getByText('Create Task');
    expect(submitButton).toBeDisabled();

    const titleInput = screen.getByLabelText(/Task Title/);
    fireEvent.change(titleInput, { target: { value: 'Test' } });

    expect(submitButton).not.toBeDisabled();
  });

  it('should disable form during submission', async () => {
    let resolveSubmit: (value: any) => void;
    const submitPromise = new Promise(resolve => {
      resolveSubmit = resolve;
    });

    mockProps.onSubmit.mockReturnValue(submitPromise);

    render(<TaskForm {...mockProps} />);

    const titleInput = screen.getByLabelText(/Task Title/);
    fireEvent.change(titleInput, { target: { value: 'Test Task' } });

    const submitButton = screen.getByText('Create Task');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Creating...')).toBeInTheDocument();
      expect(titleInput).toBeDisabled();
      expect(screen.getByText('Cancel')).toBeDisabled();
    });

    // Resolve the promise to finish submission
    resolveSubmit!(undefined);

    await waitFor(() => {
      expect(screen.getByText('Create Task')).toBeInTheDocument();
    });
  });

  it('should handle submission errors', async () => {
    const error = new Error('Submission failed');
    mockProps.onSubmit.mockRejectedValue(error);

    render(<TaskForm {...mockProps} />);

    const titleInput = screen.getByLabelText(/Task Title/);
    fireEvent.change(titleInput, { target: { value: 'Test Task' } });

    const submitButton = screen.getByText('Create Task');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Submission failed')).toBeInTheDocument();
    });
  });

  it('should show task expiration information', () => {
    render(<TaskForm {...mockProps} />);

    expect(screen.getByText('Task Expiration')).toBeInTheDocument();
    expect(screen.getByText(/automatically expire at midnight/)).toBeInTheDocument();
  });

  it('should enforce character limits', () => {
    render(<TaskForm {...mockProps} />);

    const titleInput = screen.getByLabelText(/Task Title/) as HTMLInputElement;
    const descriptionInput = screen.getByLabelText(/Description/) as HTMLTextAreaElement;

    expect(titleInput.maxLength).toBe(200);
    expect(descriptionInput.maxLength).toBe(1000);
  });

  it('should show helpful placeholder text', () => {
    render(<TaskForm {...mockProps} />);

    expect(screen.getByPlaceholderText('Enter task title...')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter task description (optional)...')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('https://example.com or /internal-path')).toBeInTheDocument();
  });

  it('should show helpful text for link field', () => {
    render(<TaskForm {...mockProps} />);

    expect(screen.getByText(/Use full URL for external links or relative path for internal navigation/)).toBeInTheDocument();
  });

  it('should prevent double submission', async () => {
    render(<TaskForm {...mockProps} />);

    const titleInput = screen.getByLabelText(/Task Title/);
    fireEvent.change(titleInput, { target: { value: 'Test Task' } });

    const submitButton = screen.getByText('Create Task');
    
    // Click multiple times rapidly
    fireEvent.click(submitButton);
    fireEvent.click(submitButton);
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockProps.onSubmit).toHaveBeenCalledTimes(1);
    });
  });

  it('should handle form submission with Enter key', async () => {
    render(<TaskForm {...mockProps} />);

    const titleInput = screen.getByLabelText(/Task Title/);
    fireEvent.change(titleInput, { target: { value: 'Test Task' } });

    fireEvent.submit(titleInput.closest('form')!);

    await waitFor(() => {
      expect(mockProps.onSubmit).toHaveBeenCalled();
    });
  });

  it('should handle empty optional fields correctly', async () => {
    render(<TaskForm {...mockProps} />);

    const titleInput = screen.getByLabelText(/Task Title/);
    fireEvent.change(titleInput, { target: { value: 'Test Task' } });

    const submitButton = screen.getByText('Create Task');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockProps.onSubmit).toHaveBeenCalledWith({
        title: 'Test Task',
        description: '',
        link: ''
      });
    });
  });

  it('should apply custom className', () => {
    const { container } = render(<TaskForm {...mockProps} className="custom-class" />);
    
    expect(container.firstChild).toHaveClass('custom-class');
  });
});