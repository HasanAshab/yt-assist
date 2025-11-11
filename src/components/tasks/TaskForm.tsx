import React, { useState } from 'react';
import type { TaskFormData } from '../../types';
import { TaskService } from '../../services/task.service';

interface TaskFormProps {
  onSubmit: (taskData: TaskFormData) => void;
  onCancel: () => void;
  initialData?: Partial<TaskFormData>;
  className?: string;
}

export const TaskForm: React.FC<TaskFormProps> = ({
  onSubmit,
  onCancel,
  initialData = {},
  className = ''
}) => {
  const [formData, setFormData] = useState<TaskFormData>({
    title: initialData.title || '',
    description: initialData.description || '',
    link: initialData.link || '',
    assigned_to: initialData.assigned_to || ''
  });
  
  const [errors, setErrors] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (
    field: keyof TaskFormData,
    value: string
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear errors when user starts typing
    if (errors.length > 0) {
      setErrors([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    setErrors([]);
    
    try {
      // Validate form data
      const validation = TaskService.validateTaskData(formData);
      
      if (!validation.isValid) {
        setErrors(validation.errors);
        return;
      }
      
      // Submit the form
      await onSubmit(formData);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create task';
      setErrors([errorMessage]);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (!isSubmitting) {
      onCancel();
    }
  };

  return (
    <form onSubmit={handleSubmit} className={`task-form ${className}`}>
      {/* Error Display */}
      {errors.length > 0 && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2 text-red-800">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <span className="font-medium">Please fix the following errors:</span>
          </div>
          <ul className="mt-2 text-sm text-red-700 list-disc list-inside">
            {errors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Title Field */}
      <div className="mb-4">
        <label htmlFor="task-title" className="block text-sm font-medium text-gray-700 mb-2">
          Task Title *
        </label>
        <input
          id="task-title"
          type="text"
          value={formData.title}
          onChange={(e) => handleInputChange('title', e.target.value)}
          placeholder="Enter task title..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          maxLength={200}
          disabled={isSubmitting}
          required
        />
        <div className="mt-1 text-xs text-gray-500">
          {formData.title.length}/200 characters
        </div>
      </div>

      {/* Description Field */}
      <div className="mb-4">
        <label htmlFor="task-description" className="block text-sm font-medium text-gray-700 mb-2">
          Description
        </label>
        <textarea
          id="task-description"
          value={formData.description}
          onChange={(e) => handleInputChange('description', e.target.value)}
          placeholder="Enter task description (optional)..."
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-vertical"
          maxLength={1000}
          disabled={isSubmitting}
        />
        <div className="mt-1 text-xs text-gray-500">
          {formData.description.length}/1000 characters
        </div>
      </div>

      {/* Assigned To Field */}
      <div className="mb-4">
        <label htmlFor="task-assigned-to" className="block text-sm font-medium text-gray-700 mb-2">
          Assigned To
        </label>
        <input
          id="task-assigned-to"
          type="text"
          value={formData.assigned_to}
          onChange={(e) => handleInputChange('assigned_to', e.target.value)}
          placeholder="Enter assignee name..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          maxLength={100}
          disabled={isSubmitting}
        />
        <div className="mt-1 text-xs text-gray-500">
          Optional: Name or identifier of the person assigned to this task
        </div>
      </div>

      {/* Link Field */}
      <div className="mb-6">
        <label htmlFor="task-link" className="block text-sm font-medium text-gray-700 mb-2">
          Link
        </label>
        <input
          id="task-link"
          type="text"
          value={formData.link}
          onChange={(e) => handleInputChange('link', e.target.value)}
          placeholder="https://example.com or /internal-path"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          disabled={isSubmitting}
        />
        <div className="mt-1 text-xs text-gray-500">
          Optional link to redirect to when task is clicked. Use full URL for external links or relative path for internal navigation.
        </div>
      </div>

      {/* Task Expiration Info */}
      <div className="mb-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-center gap-2 text-blue-800">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
          </svg>
          <span className="text-sm font-medium">Daily Task</span>
        </div>
        <p className="mt-1 text-sm text-blue-700">
          This task will automatically expire at the end of today (23:59) and be removed from your task list.
        </p>
      </div>

      {/* Form Actions */}
      <div className="flex gap-3 justify-end">
        <button
          type="button"
          onClick={handleCancel}
          disabled={isSubmitting}
          className="px-4 py-2 text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting || !formData.title.trim()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isSubmitting && (
            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          )}
          {isSubmitting ? 'Creating...' : 'Create Task'}
        </button>
      </div>
    </form>
  );
};