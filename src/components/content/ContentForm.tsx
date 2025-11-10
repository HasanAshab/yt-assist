import React, { useState, useEffect, useCallback } from 'react';
import type { Content, ContentFormData, FinalCheck } from '../../types';
import { CONTENT_CATEGORIES, VALIDATION_RULES } from '../../constants';
import { ContentService } from '../../services/content.service';
import { useContent } from '../../hooks/useContent';
import { useErrorHandler } from '../../hooks/useErrorHandler';
import { LoadingSpinner } from '../common/LoadingSpinner';

interface ContentFormProps {
  content?: Content;
  initialData?: Content;
  isOpen?: boolean;
  onClose?: () => void;
  onCancel?: () => void;
  onSubmit?: (content: Content) => void;
}

interface FormErrors {
  topic?: string;
  category?: string;
  title?: string;
  script?: string;
  link?: string;
  publish_after?: string;
  publish_before?: string;
  morals?: string;
  general?: string;
}

export const ContentForm: React.FC<ContentFormProps> = ({
  content,
  initialData,
  isOpen = true,
  onClose,
  onCancel,
  onSubmit
}) => {
  // Use initialData if provided, otherwise use content
  const editingContent = initialData || content;
  const { contents, addContent, updateContent } = useContent();
  const { handleError } = useErrorHandler();
  
  // Form state
  const [formData, setFormData] = useState<ContentFormData>({
    topic: '',
    category: 'Demanding',
    title: '',
    script: '',
    publish_after: '',
    publish_before: '',
    link: '',
    morals: []
  });
  
  const [finalChecks, setFinalChecks] = useState<FinalCheck[]>([]);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availableContents, setAvailableContents] = useState<Content[]>([]);

  // Initialize form data when content changes
  useEffect(() => {
    if (editingContent) {
      setFormData({
        topic: editingContent.topic,
        category: editingContent.category,
        title: editingContent.title || '',
        script: editingContent.script || '',
        publish_after: editingContent.publish_after || '',
        publish_before: editingContent.publish_before || '',
        link: editingContent.link || '',
        morals: editingContent.morals ? [...editingContent.morals] : []
      });
      setFinalChecks(editingContent.final_checks ? [...editingContent.final_checks] : []);
    } else {
      // Reset form for new content
      setFormData({
        topic: '',
        category: 'Demanding',
        title: '',
        script: '',
        publish_after: '',
        publish_before: '',
        link: '',
        morals: []
      });
      setFinalChecks([]);
    }
    setErrors({});
  }, [editingContent, isOpen]);

  // Load available contents for dependencies
  useEffect(() => {
    if (isOpen) {
      const filtered = contents.filter(c => c.topic !== editingContent?.topic);
      setAvailableContents(filtered);
    }
  }, [isOpen, contents, editingContent?.topic]);

  // Real-time validation
  const validateField = useCallback((field: keyof ContentFormData, value: any): string | undefined => {
    switch (field) {
      case 'topic':
        if (!value || value.trim().length < VALIDATION_RULES.MIN_TOPIC_LENGTH) {
          return `Topic must be at least ${VALIDATION_RULES.MIN_TOPIC_LENGTH} characters long`;
        }
        if (value.length > VALIDATION_RULES.MAX_TOPIC_LENGTH) {
          return `Topic must be no more than ${VALIDATION_RULES.MAX_TOPIC_LENGTH} characters long`;
        }
        // Check uniqueness for new content or changed topic
        if ((!editingContent || editingContent.topic !== value) && contents.some(c => c.topic === value)) {
          return 'A content with this topic already exists';
        }
        break;
        
      case 'title':
        if (value && value.length > VALIDATION_RULES.MAX_TITLE_LENGTH) {
          return `Title must be no more than ${VALIDATION_RULES.MAX_TITLE_LENGTH} characters long`;
        }
        break;
        
      case 'script':
        if (value && value.length < VALIDATION_RULES.MIN_SCRIPT_LENGTH) {
          return `Script must be at least ${VALIDATION_RULES.MIN_SCRIPT_LENGTH} characters long`;
        }
        break;
        
      case 'link':
        if (value && value.trim()) {
          try {
            new URL(value);
          } catch {
            return 'Please enter a valid URL';
          }
        }
        break;
        
      case 'publish_after':
      case 'publish_before':
        if (value && value.trim() && value === formData.topic) {
          return 'Content cannot depend on itself';
        }
        if (formData.publish_after?.trim() && formData.publish_before?.trim() && 
            formData.publish_after === formData.publish_before) {
          return 'Cannot have the same content as both dependencies';
        }
        break;
    }
    return undefined;
  }, [formData, editingContent, contents]);

  // Handle input changes with validation
  const handleInputChange = useCallback((field: keyof ContentFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Real-time validation
    const error = validateField(field, value);
    setErrors(prev => ({ ...prev, [field]: error }));
  }, [validateField]);

  // Handle morals array changes
  const handleMoralsChange = useCallback((morals: string[]) => {
    if (morals.length > VALIDATION_RULES.MAX_MORALS_COUNT) {
      setErrors(prev => ({ 
        ...prev, 
        morals: `Cannot have more than ${VALIDATION_RULES.MAX_MORALS_COUNT} morals` 
      }));
      return;
    }
    
    setFormData(prev => ({ ...prev, morals }));
    setErrors(prev => ({ ...prev, morals: undefined }));
  }, []);

  // Handle final checks changes
  const handleFinalChecksChange = useCallback((checks: FinalCheck[]) => {
    setFinalChecks(checks);
  }, []);

  // Validate entire form
  const validateForm = useCallback((): boolean => {
    const newErrors: FormErrors = {};
    
    // Validate all fields
    Object.keys(formData).forEach(key => {
      const field = key as keyof ContentFormData;
      const error = validateField(field, formData[field]);
      if (error) {
        newErrors[field] = error;
      }
    });

    // Additional validations
    if (!formData.topic.trim()) {
      newErrors.topic = 'Topic is required';
    }
    
    if (!formData.category) {
      newErrors.category = 'Category is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, validateField]);

  // Normalize form data (convert empty strings to undefined)
  const normalizeFormData = useCallback((data: ContentFormData): ContentFormData => {
    return {
      ...data,
      title: data.title?.trim() || undefined,
      script: data.script?.trim() || undefined,
      publish_after: data.publish_after?.trim() || undefined,
      publish_before: data.publish_before?.trim() || undefined,
      link: data.link?.trim() || undefined
    };
  }, []);

  // Handle form submission
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      let result: Content;
      const normalizedData = normalizeFormData(formData);
      
      if (editingContent) {
        // Update existing content
        result = await ContentService.updateContent(editingContent.id, normalizedData);
        updateContent(result);
      } else {
        // Create new content
        result = await ContentService.createContent(normalizedData);
        addContent(result);
      }

      // Update final checks if they changed
      if (finalChecks.length > 0 && editingContent) {
        // Note: Final checks update would be handled by a separate service method
        // For now, we'll include them in the content update
      }

      onSubmit?.(result);
      onClose();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      setErrors({ general: errorMessage });
      handleError(error);
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, finalChecks, editingContent, validateForm, normalizeFormData, addContent, updateContent, onSubmit, onClose, handleError]);

  // Handle modal close
  const handleClose = useCallback(() => {
    if (!isSubmitting) {
      onClose?.();
      onCancel?.();
    }
  }, [isSubmitting, onClose, onCancel]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center p-0 sm:p-4 z-50">
      <div className="bg-white rounded-t-xl sm:rounded-lg shadow-xl w-full max-w-2xl h-[95vh] sm:max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
              {editingContent ? 'Edit Content' : 'Create New Content'}
            </h2>
            <button
              onClick={handleClose}
              disabled={isSubmitting}
              className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 touch-target"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-6 pb-24 sm:pb-6">
          {errors.general && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-base sm:text-sm text-red-600">{errors.general}</p>
            </div>
          )}

          {/* Topic Field */}
          <div>
            <label htmlFor="topic" className="block text-base sm:text-sm font-medium text-gray-700 mb-3">
              Topic *
            </label>
            <input
              type="text"
              id="topic"
              value={formData.topic}
              onChange={(e) => handleInputChange('topic', e.target.value)}
              className={`w-full px-4 py-3 text-base border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 touch-target ${
                errors.topic ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Enter content topic"
              disabled={isSubmitting}
            />
            {errors.topic && (
              <p className="mt-2 text-base sm:text-sm text-red-600">{errors.topic}</p>
            )}
          </div>

          {/* Category Field */}
          <div>
            <label htmlFor="category" className="block text-base sm:text-sm font-medium text-gray-700 mb-3">
              Category *
            </label>
            <input
              type="text"
              id="category"
              list="category-suggestions"
              value={formData.category}
              onChange={(e) => handleInputChange('category', e.target.value)}
              className={`w-full px-4 py-3 text-base border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 touch-target ${
                errors.category ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Enter or select a category"
              disabled={isSubmitting}
            />
            <datalist id="category-suggestions">
              {CONTENT_CATEGORIES.map(category => (
                <option key={category} value={category} />
              ))}
            </datalist>
            <p className="mt-2 text-sm text-gray-500">
              You can enter any category or choose from suggestions
            </p>
            {errors.category && (
              <p className="mt-2 text-base sm:text-sm text-red-600">{errors.category}</p>
            )}
          </div>

          {/* Title Field */}
          <div>
            <label htmlFor="title" className="block text-base sm:text-sm font-medium text-gray-700 mb-3">
              Title
            </label>
            <input
              type="text"
              id="title"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              className={`w-full px-4 py-3 text-base border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 touch-target ${
                errors.title ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Enter content title"
              disabled={isSubmitting}
            />
            {errors.title && (
              <p className="mt-2 text-base sm:text-sm text-red-600">{errors.title}</p>
            )}
          </div>

          {/* Script Field */}
          <div>
            <label htmlFor="script" className="block text-base sm:text-sm font-medium text-gray-700 mb-3">
              Script
            </label>
            <textarea
              id="script"
              value={formData.script}
              onChange={(e) => handleInputChange('script', e.target.value)}
              rows={6}
              className={`w-full px-4 py-3 text-base border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 touch-target resize-y ${
                errors.script ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Enter content script"
              disabled={isSubmitting}
            />
            {errors.script && (
              <p className="mt-2 text-base sm:text-sm text-red-600">{errors.script}</p>
            )}
          </div>

          {/* Dependencies */}
          <div className="space-y-6">
            {/* Publish After */}
            <div>
              <label htmlFor="publish_after" className="block text-base sm:text-sm font-medium text-gray-700 mb-3">
                Publish After
              </label>
              <select
                id="publish_after"
                value={formData.publish_after}
                onChange={(e) => handleInputChange('publish_after', e.target.value)}
                className={`w-full px-4 py-3 text-base border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 touch-target ${
                  errors.publish_after ? 'border-red-300' : 'border-gray-300'
                }`}
                disabled={isSubmitting}
              >
                <option value="">Select dependency</option>
                {availableContents.map(c => (
                  <option key={c.id} value={c.topic}>
                    {c.topic}
                  </option>
                ))}
              </select>
              {errors.publish_after && (
                <p className="mt-2 text-base sm:text-sm text-red-600">{errors.publish_after}</p>
              )}
            </div>

            {/* Publish Before */}
            <div>
              <label htmlFor="publish_before" className="block text-base sm:text-sm font-medium text-gray-700 mb-3">
                Publish Before
              </label>
              <select
                id="publish_before"
                value={formData.publish_before}
                onChange={(e) => handleInputChange('publish_before', e.target.value)}
                className={`w-full px-4 py-3 text-base border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 touch-target ${
                  errors.publish_before ? 'border-red-300' : 'border-gray-300'
                }`}
                disabled={isSubmitting}
              >
                <option value="">Select dependency</option>
                {availableContents.map(c => (
                  <option key={c.id} value={c.topic}>
                    {c.topic}
                  </option>
                ))}
              </select>
              {errors.publish_before && (
                <p className="mt-2 text-base sm:text-sm text-red-600">{errors.publish_before}</p>
              )}
            </div>
          </div>

          {/* Link Field */}
          <div>
            <label htmlFor="link" className="block text-base sm:text-sm font-medium text-gray-700 mb-3">
              Link
            </label>
            <input
              type="url"
              id="link"
              value={formData.link}
              onChange={(e) => handleInputChange('link', e.target.value)}
              className={`w-full px-4 py-3 text-base border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 touch-target ${
                errors.link ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="https://example.com"
              disabled={isSubmitting}
            />
            {errors.link && (
              <p className="mt-2 text-base sm:text-sm text-red-600">{errors.link}</p>
            )}
          </div>

          {/* Morals Array Input */}
          <MoralsInput
            morals={formData.morals}
            onChange={handleMoralsChange}
            error={errors.morals}
            disabled={isSubmitting}
          />

          {/* Final Checks Management */}
          {editingContent && (
            <FinalChecksManager
              finalChecks={finalChecks}
              onChange={handleFinalChecksChange}
              disabled={isSubmitting}
            />
          )}

          {/* Form Actions */}
          <div className="sticky bottom-0 bg-white border-t pt-4 -mx-4 sm:-mx-6 px-4 sm:px-6 pb-4 sm:pb-0 sm:static sm:border-t-0 sm:pt-6">
            <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
              <button
                type="button"
                onClick={handleClose}
                disabled={isSubmitting}
                className="w-full sm:w-auto px-6 py-3 text-base sm:text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 touch-target"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:w-auto px-6 py-3 text-base sm:text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 flex items-center justify-center touch-target"
              >
                {isSubmitting && <LoadingSpinner size="sm" className="mr-2" />}
                {editingContent ? 'Update Content' : 'Create Content'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

// Morals Input Component
interface MoralsInputProps {
  morals: string[];
  onChange: (morals: string[]) => void;
  error?: string;
  disabled?: boolean;
}

const MoralsInput: React.FC<MoralsInputProps> = ({ morals, onChange, error, disabled }) => {
  const [inputValue, setInputValue] = useState('');

  const addMoral = useCallback(() => {
    const trimmed = inputValue.trim();
    if (trimmed && !morals.includes(trimmed)) {
      onChange([...morals, trimmed]);
      setInputValue('');
    }
  }, [inputValue, morals, onChange]);

  const removeMoral = useCallback((index: number) => {
    onChange(morals.filter((_, i) => i !== index));
  }, [morals, onChange]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addMoral();
    }
  }, [addMoral]);

  return (
    <div>
      <label className="block text-base sm:text-sm font-medium text-gray-700 mb-3">
        Morals
      </label>
      
      {/* Existing morals */}
      {morals.length > 0 && (
        <div className="mb-4 space-y-3">
          {morals.map((moral, index) => (
            <div key={index} className="flex items-start gap-3 bg-gray-50 px-4 py-3 rounded-lg">
              <span className="flex-1 text-base sm:text-sm text-gray-700 leading-relaxed">{moral}</span>
              <button
                type="button"
                onClick={() => removeMoral(index)}
                disabled={disabled}
                className="flex-shrink-0 p-1 text-red-500 hover:text-red-700 disabled:opacity-50 touch-target"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add new moral */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={handleKeyPress}
          className={`flex-1 px-4 py-3 text-base border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 touch-target ${
            error ? 'border-red-300' : 'border-gray-300'
          }`}
          placeholder="Enter a moral"
          disabled={disabled}
        />
        <button
          type="button"
          onClick={addMoral}
          disabled={disabled || !inputValue.trim()}
          className="w-full sm:w-auto px-6 py-3 text-base sm:text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 touch-target"
        >
          Add
        </button>
      </div>
      
      {error && (
        <p className="mt-2 text-base sm:text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};

// Final Checks Manager Component
interface FinalChecksManagerProps {
  finalChecks: FinalCheck[];
  onChange: (checks: FinalCheck[]) => void;
  disabled?: boolean;
}

const FinalChecksManager: React.FC<FinalChecksManagerProps> = ({ finalChecks, onChange, disabled }) => {
  const [newCheckDescription, setNewCheckDescription] = useState('');

  const toggleCheck = useCallback((checkId: string) => {
    onChange(finalChecks.map(check => 
      check.id === checkId 
        ? { ...check, completed: !check.completed }
        : check
    ));
  }, [finalChecks, onChange]);

  const addCheck = useCallback(() => {
    const trimmed = newCheckDescription.trim();
    if (trimmed) {
      const newCheck: FinalCheck = {
        id: `check_${Date.now()}`,
        text: trimmed,
        description: trimmed,
        completed: false
      };
      onChange([...finalChecks, newCheck]);
      setNewCheckDescription('');
    }
  }, [newCheckDescription, finalChecks, onChange]);

  const removeCheck = useCallback((checkId: string) => {
    onChange(finalChecks.filter(check => check.id !== checkId));
  }, [finalChecks, onChange]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addCheck();
    }
  }, [addCheck]);

  return (
    <div>
      <label className="block text-base sm:text-sm font-medium text-gray-700 mb-3">
        Final Checks
      </label>
      
      {/* Existing checks */}
      {finalChecks.length > 0 && (
        <div className="mb-4 space-y-3">
          {finalChecks.map((check) => (
            <div key={check.id} className="flex items-start gap-4 bg-gray-50 px-4 py-3 rounded-lg touch-target">
              <input
                type="checkbox"
                checked={check.completed}
                onChange={() => toggleCheck(check.id)}
                disabled={disabled}
                className="mt-1 h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className={`flex-1 text-base sm:text-sm leading-relaxed ${check.completed ? 'text-gray-500 line-through' : 'text-gray-700'}`}>
                {check.text || check.description}
              </span>
              <button
                type="button"
                onClick={() => removeCheck(check.id)}
                disabled={disabled}
                className="flex-shrink-0 p-1 text-red-500 hover:text-red-700 disabled:opacity-50 touch-target"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add new check */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          value={newCheckDescription}
          onChange={(e) => setNewCheckDescription(e.target.value)}
          onKeyPress={handleKeyPress}
          className="flex-1 px-4 py-3 text-base border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 touch-target"
          placeholder="Enter final check description"
          disabled={disabled}
        />
        <button
          type="button"
          onClick={addCheck}
          disabled={disabled || !newCheckDescription.trim()}
          className="w-full sm:w-auto px-6 py-3 text-base sm:text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 touch-target"
        >
          Add
        </button>
      </div>
    </div>
  );
};