import { renderHook, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { useContentForm } from '../useContentForm';
import type { Content } from '../../types';

const mockContent: Content = {
  id: '1',
  topic: 'Test Topic',
  category: 'Demanding',
  current_stage: 0,
  title: 'Test Title',
  script: 'Test script',
  final_checks: [],
  publish_after: '',
  publish_before: '',
  link: '',
  morals: [],
  flags: [],
  created_at: '2023-01-01T00:00:00Z',
  updated_at: '2023-01-01T00:00:00Z'
};

describe('useContentForm', () => {
  const mockOnContentCreated = vi.fn();
  const mockOnContentUpdated = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial State', () => {
    it('initializes with correct default values', () => {
      const { result } = renderHook(() => useContentForm());

      expect(result.current.isModalOpen).toBe(false);
      expect(result.current.editingContent).toBeUndefined();
    });
  });

  describe('Modal Management', () => {
    it('opens create modal correctly', () => {
      const { result } = renderHook(() => useContentForm());

      act(() => {
        result.current.openCreateModal();
      });

      expect(result.current.isModalOpen).toBe(true);
      expect(result.current.editingContent).toBeUndefined();
    });

    it('opens edit modal with content', () => {
      const { result } = renderHook(() => useContentForm());

      act(() => {
        result.current.openEditModal(mockContent);
      });

      expect(result.current.isModalOpen).toBe(true);
      expect(result.current.editingContent).toBe(mockContent);
    });

    it('closes modal and resets state', () => {
      const { result } = renderHook(() => useContentForm());

      // First open modal with content
      act(() => {
        result.current.openEditModal(mockContent);
      });

      expect(result.current.isModalOpen).toBe(true);
      expect(result.current.editingContent).toBe(mockContent);

      // Then close modal
      act(() => {
        result.current.closeModal();
      });

      expect(result.current.isModalOpen).toBe(false);
      expect(result.current.editingContent).toBeUndefined();
    });
  });

  describe('Content Handlers', () => {
    it('handles content created', () => {
      const { result } = renderHook(() => 
        useContentForm(mockOnContentCreated, mockOnContentUpdated)
      );

      // Open modal first
      act(() => {
        result.current.openCreateModal();
      });

      expect(result.current.isModalOpen).toBe(true);

      // Handle content created
      act(() => {
        result.current.handleContentCreated(mockContent);
      });

      expect(mockOnContentCreated).toHaveBeenCalledWith(mockContent);
      expect(result.current.isModalOpen).toBe(false);
      expect(result.current.editingContent).toBeUndefined();
    });

    it('handles content updated', () => {
      const { result } = renderHook(() => 
        useContentForm(mockOnContentCreated, mockOnContentUpdated)
      );

      // Open edit modal first
      act(() => {
        result.current.openEditModal(mockContent);
      });

      expect(result.current.isModalOpen).toBe(true);

      // Handle content updated
      const updatedContent = { ...mockContent, title: 'Updated Title' };
      act(() => {
        result.current.handleContentUpdated(updatedContent);
      });

      expect(mockOnContentUpdated).toHaveBeenCalledWith(updatedContent);
      expect(result.current.isModalOpen).toBe(false);
      expect(result.current.editingContent).toBeUndefined();
    });

    it('works without callback functions', () => {
      const { result } = renderHook(() => useContentForm());

      // Should not throw errors when callbacks are not provided
      expect(() => {
        act(() => {
          result.current.handleContentCreated(mockContent);
        });
      }).not.toThrow();

      expect(() => {
        act(() => {
          result.current.handleContentUpdated(mockContent);
        });
      }).not.toThrow();
    });
  });

  describe('State Transitions', () => {
    it('transitions from create to edit mode', () => {
      const { result } = renderHook(() => useContentForm());

      // Start with create modal
      act(() => {
        result.current.openCreateModal();
      });

      expect(result.current.isModalOpen).toBe(true);
      expect(result.current.editingContent).toBeUndefined();

      // Switch to edit modal
      act(() => {
        result.current.openEditModal(mockContent);
      });

      expect(result.current.isModalOpen).toBe(true);
      expect(result.current.editingContent).toBe(mockContent);
    });

    it('transitions from edit to create mode', () => {
      const { result } = renderHook(() => useContentForm());

      // Start with edit modal
      act(() => {
        result.current.openEditModal(mockContent);
      });

      expect(result.current.isModalOpen).toBe(true);
      expect(result.current.editingContent).toBe(mockContent);

      // Switch to create modal
      act(() => {
        result.current.openCreateModal();
      });

      expect(result.current.isModalOpen).toBe(true);
      expect(result.current.editingContent).toBeUndefined();
    });

    it('handles multiple open/close cycles', () => {
      const { result } = renderHook(() => useContentForm());

      // First cycle
      act(() => {
        result.current.openCreateModal();
      });
      expect(result.current.isModalOpen).toBe(true);

      act(() => {
        result.current.closeModal();
      });
      expect(result.current.isModalOpen).toBe(false);

      // Second cycle with different content
      act(() => {
        result.current.openEditModal(mockContent);
      });
      expect(result.current.isModalOpen).toBe(true);
      expect(result.current.editingContent).toBe(mockContent);

      act(() => {
        result.current.closeModal();
      });
      expect(result.current.isModalOpen).toBe(false);
      expect(result.current.editingContent).toBeUndefined();
    });
  });

  describe('Callback Integration', () => {
    it('calls callbacks and closes modal in correct order', () => {
      const { result } = renderHook(() => 
        useContentForm(mockOnContentCreated, mockOnContentUpdated)
      );

      act(() => {
        result.current.openCreateModal();
      });

      // Mock callback to verify modal state when called
      const mockCallback = vi.fn(() => {
        // Modal should still be open when callback is called
        expect(result.current.isModalOpen).toBe(true);
      });

      // Replace the callback temporarily
      mockOnContentCreated.mockImplementation(mockCallback);

      act(() => {
        result.current.handleContentCreated(mockContent);
      });

      expect(mockCallback).toHaveBeenCalledWith(mockContent);
      // Modal should be closed after callback
      expect(result.current.isModalOpen).toBe(false);
    });

    it('handles callback errors gracefully', () => {
      const mockCallbackWithError = vi.fn(() => {
        throw new Error('Callback error');
      });

      const { result } = renderHook(() => 
        useContentForm(mockCallbackWithError, mockOnContentUpdated)
      );

      act(() => {
        result.current.openCreateModal();
      });

      // Should not throw error even if callback throws
      expect(() => {
        act(() => {
          result.current.handleContentCreated(mockContent);
        });
      }).not.toThrow();

      // Modal should still be closed despite callback error
      expect(result.current.isModalOpen).toBe(false);
    });
  });

  describe('Memory Management', () => {
    it('maintains referential stability of functions', () => {
      const { result, rerender } = renderHook(() => useContentForm());

      const initialFunctions = {
        openCreateModal: result.current.openCreateModal,
        openEditModal: result.current.openEditModal,
        closeModal: result.current.closeModal,
        handleContentCreated: result.current.handleContentCreated,
        handleContentUpdated: result.current.handleContentUpdated
      };

      // Rerender should not change function references
      rerender();

      expect(result.current.openCreateModal).toBe(initialFunctions.openCreateModal);
      expect(result.current.openEditModal).toBe(initialFunctions.openEditModal);
      expect(result.current.closeModal).toBe(initialFunctions.closeModal);
      expect(result.current.handleContentCreated).toBe(initialFunctions.handleContentCreated);
      expect(result.current.handleContentUpdated).toBe(initialFunctions.handleContentUpdated);
    });

    it('updates function references when callbacks change', () => {
      const { result, rerender } = renderHook(
        ({ onCreated, onUpdated }) => useContentForm(onCreated, onUpdated),
        {
          initialProps: {
            onCreated: mockOnContentCreated,
            onUpdated: mockOnContentUpdated
          }
        }
      );

      const initialHandlers = {
        handleContentCreated: result.current.handleContentCreated,
        handleContentUpdated: result.current.handleContentUpdated
      };

      // Change callbacks
      const newOnCreated = vi.fn();
      const newOnUpdated = vi.fn();

      rerender({
        onCreated: newOnCreated,
        onUpdated: newOnUpdated
      });

      // Handler functions should be updated
      expect(result.current.handleContentCreated).not.toBe(initialHandlers.handleContentCreated);
      expect(result.current.handleContentUpdated).not.toBe(initialHandlers.handleContentUpdated);
    });
  });
});