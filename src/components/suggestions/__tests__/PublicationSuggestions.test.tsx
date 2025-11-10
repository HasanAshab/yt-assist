import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PublicationSuggestions } from '../PublicationSuggestions';
import { SuggestionService } from '@/services/suggestion.service';
import type { ContentSuggestion, Content } from '@/types';

// Mock SuggestionService
vi.mock('@/services/suggestion.service');

const mockSuggestionService = vi.mocked(SuggestionService);

describe('PublicationSuggestions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const createMockContent = (overrides: Partial<Content> = {}): Content => ({
    id: 'test-id',
    topic: 'test-topic',
    category: 'Demanding',
    current_stage: 0,
    title: 'Test Title',
    script: 'Test Script',
    final_checks: [
      { id: 'check1', description: 'Check 1', completed: true },
      { id: 'check2', description: 'Check 2', completed: false }
    ],
    publish_after: undefined,
    publish_before: undefined,
    link: undefined,
    morals: [],
    flags: [],
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    ...overrides
  });

  const createMockSuggestion = (overrides: Partial<ContentSuggestion> = {}): ContentSuggestion => ({
    content: createMockContent(),
    score: 85,
    remainingSteps: 2.5,
    blockedBy: [],
    ...overrides
  });

  describe('Loading State', () => {
    it('should show loading spinner while fetching suggestions', async () => {
      mockSuggestionService.getPublicationSuggestions.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve([]), 100))
      );

      render(<PublicationSuggestions />);

      expect(screen.getByText('Publication Suggestions')).toBeInTheDocument();
      expect(screen.getByRole('status', { hidden: true })).toBeInTheDocument(); // Loading spinner
    });

    it('should show loading skeleton cards', async () => {
      mockSuggestionService.getPublicationSuggestions.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve([]), 100))
      );

      render(<PublicationSuggestions />);

      const skeletonElements = screen.getAllByRole('generic');
      expect(skeletonElements.some(el => el.classList.contains('animate-pulse'))).toBe(true);
    });
  });

  describe('Error State', () => {
    it('should show error message when suggestions fail to load', async () => {
      const errorMessage = 'Failed to load suggestions';
      mockSuggestionService.getPublicationSuggestions.mockRejectedValue(
        new Error(errorMessage)
      );

      render(<PublicationSuggestions />);

      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
      });

      expect(screen.getByText('Retry')).toBeInTheDocument();
    });

    it('should retry loading suggestions when retry button is clicked', async () => {
      mockSuggestionService.getPublicationSuggestions
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce([]);

      render(<PublicationSuggestions />);

      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Retry'));

      await waitFor(() => {
        expect(screen.getByText('No publication suggestions available')).toBeInTheDocument();
      });

      expect(mockSuggestionService.getPublicationSuggestions).toHaveBeenCalledTimes(2);
    });
  });

  describe('Empty State', () => {
    it('should show empty state when no suggestions are available', async () => {
      mockSuggestionService.getPublicationSuggestions.mockResolvedValue([]);

      render(<PublicationSuggestions />);

      await waitFor(() => {
        expect(screen.getByText('No publication suggestions available')).toBeInTheDocument();
      });

      expect(screen.getByText('All contents are either published or blocked by dependencies')).toBeInTheDocument();
    });
  });

  describe('Suggestions Display', () => {
    it('should display suggestions with correct information', async () => {
      const mockSuggestions: ContentSuggestion[] = [
        createMockSuggestion({
          content: createMockContent({
            id: '1',
            topic: 'content-1',
            title: 'First Content',
            category: 'Demanding',
            current_stage: 10
          }),
          score: 95,
          remainingSteps: 1.2
        }),
        createMockSuggestion({
          content: createMockContent({
            id: '2',
            topic: 'content-2',
            title: 'Second Content',
            category: 'Innovative',
            current_stage: 8
          }),
          score: 78,
          remainingSteps: 3.5
        })
      ];

      mockSuggestionService.getPublicationSuggestions.mockResolvedValue(mockSuggestions);

      render(<PublicationSuggestions />);

      await waitFor(() => {
        expect(screen.getByText('content-1')).toBeInTheDocument();
        expect(screen.getByText('content-2')).toBeInTheDocument();
      });

      // Check suggestion rankings
      expect(screen.getByText('#1')).toBeInTheDocument();
      expect(screen.getByText('#2')).toBeInTheDocument();

      // Check titles
      expect(screen.getByText('First Content')).toBeInTheDocument();
      expect(screen.getByText('Second Content')).toBeInTheDocument();

      // Check categories
      expect(screen.getByText('Demanding')).toBeInTheDocument();
      expect(screen.getByText('Innovative')).toBeInTheDocument();

      // Check readiness scores
      expect(screen.getByText('95')).toBeInTheDocument();
      expect(screen.getByText('78')).toBeInTheDocument();

      // Check remaining steps
      expect(screen.getByText('1.2 steps remaining')).toBeInTheDocument();
      expect(screen.getByText('3.5 steps remaining')).toBeInTheDocument();
    });

    it('should show "No title set" when content has no title', async () => {
      const mockSuggestions: ContentSuggestion[] = [
        createMockSuggestion({
          content: createMockContent({
            title: undefined
          })
        })
      ];

      mockSuggestionService.getPublicationSuggestions.mockResolvedValue(mockSuggestions);

      render(<PublicationSuggestions />);

      await waitFor(() => {
        expect(screen.getByText('No title set')).toBeInTheDocument();
      });
    });

    it('should display current stage and next stage information', async () => {
      const mockSuggestions: ContentSuggestion[] = [
        createMockSuggestion({
          content: createMockContent({
            current_stage: 8 // "Edited" stage
          })
        })
      ];

      mockSuggestionService.getPublicationSuggestions.mockResolvedValue(mockSuggestions);

      render(<PublicationSuggestions />);

      await waitFor(() => {
        expect(screen.getByText('Stage: Edited')).toBeInTheDocument();
        expect(screen.getByText('Next: Revised')).toBeInTheDocument();
      });
    });

    it('should display progress bar with correct percentage', async () => {
      const mockSuggestions: ContentSuggestion[] = [
        createMockSuggestion({
          content: createMockContent({
            current_stage: 6 // 6/11 = ~55%
          })
        })
      ];

      mockSuggestionService.getPublicationSuggestions.mockResolvedValue(mockSuggestions);

      render(<PublicationSuggestions />);

      await waitFor(() => {
        expect(screen.getByText('55%')).toBeInTheDocument();
      });
    });

    it('should show requirements status with checkmarks and circles', async () => {
      const mockSuggestions: ContentSuggestion[] = [
        createMockSuggestion({
          content: createMockContent({
            title: 'Has Title',
            script: undefined,
            link: 'https://example.com'
          })
        })
      ];

      mockSuggestionService.getPublicationSuggestions.mockResolvedValue(mockSuggestions);

      render(<PublicationSuggestions />);

      await waitFor(() => {
        expect(screen.getByText('Title ✓')).toBeInTheDocument();
        expect(screen.getByText('Script ○')).toBeInTheDocument();
        expect(screen.getByText('Link ✓')).toBeInTheDocument();
      });
    });

    it('should show final checks progress', async () => {
      const mockSuggestions: ContentSuggestion[] = [
        createMockSuggestion({
          content: createMockContent({
            final_checks: [
              { id: 'check1', description: 'Check 1', completed: true },
              { id: 'check2', description: 'Check 2', completed: true },
              { id: 'check3', description: 'Check 3', completed: false }
            ]
          })
        })
      ];

      mockSuggestionService.getPublicationSuggestions.mockResolvedValue(mockSuggestions);

      render(<PublicationSuggestions />);

      await waitFor(() => {
        expect(screen.getByText('Final Checks 2/3')).toBeInTheDocument();
      });
    });
  });

  describe('User Interactions', () => {
    it('should call onContentSelect when suggestion is clicked', async () => {
      const mockOnContentSelect = vi.fn();
      const mockSuggestions: ContentSuggestion[] = [
        createMockSuggestion({
          content: createMockContent({ id: 'content-1' })
        })
      ];

      mockSuggestionService.getPublicationSuggestions.mockResolvedValue(mockSuggestions);

      render(<PublicationSuggestions onContentSelect={mockOnContentSelect} />);

      await waitFor(() => {
        expect(screen.getByText('test-topic')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('test-topic').closest('div')!);

      expect(mockOnContentSelect).toHaveBeenCalledWith('content-1');
    });

    it('should refresh suggestions when refresh button is clicked', async () => {
      const mockOnRefresh = vi.fn();
      mockSuggestionService.getPublicationSuggestions.mockResolvedValue([]);

      render(<PublicationSuggestions onRefresh={mockOnRefresh} />);

      await waitFor(() => {
        expect(screen.getByText('Refresh')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Refresh'));

      await waitFor(() => {
        expect(mockSuggestionService.getPublicationSuggestions).toHaveBeenCalledTimes(2);
        expect(mockOnRefresh).toHaveBeenCalled();
      });
    });
  });

  describe('Score Color Coding', () => {
    it('should apply correct color classes based on score', async () => {
      const mockSuggestions: ContentSuggestion[] = [
        createMockSuggestion({ score: 120 }), // High score - green
        createMockSuggestion({ 
          content: createMockContent({ id: '2', topic: 'content-2' }),
          score: 80 
        }), // Medium score - yellow
        createMockSuggestion({ 
          content: createMockContent({ id: '3', topic: 'content-3' }),
          score: 50 
        }) // Low score - red
      ];

      mockSuggestionService.getPublicationSuggestions.mockResolvedValue(mockSuggestions);

      render(<PublicationSuggestions />);

      await waitFor(() => {
        const scoreElements = screen.getAllByText(/^\d+$/);
        
        // High score should have green color
        expect(scoreElements[0]).toHaveClass('text-green-600');
        
        // Medium score should have yellow color  
        expect(scoreElements[1]).toHaveClass('text-yellow-600');
      });
    });
  });

  describe('Responsive Design', () => {
    it('should apply custom className', async () => {
      mockSuggestionService.getPublicationSuggestions.mockResolvedValue([]);

      const { container } = render(
        <PublicationSuggestions className="custom-class" />
      );

      await waitFor(() => {
        expect(container.firstChild).toHaveClass('custom-class');
      });
    });
  });

  describe('Footer Information', () => {
    it('should show correct footer text for multiple suggestions', async () => {
      const mockSuggestions: ContentSuggestion[] = [
        createMockSuggestion(),
        createMockSuggestion({ content: createMockContent({ id: '2' }) })
      ];

      mockSuggestionService.getPublicationSuggestions.mockResolvedValue(mockSuggestions);

      render(<PublicationSuggestions />);

      await waitFor(() => {
        expect(screen.getByText('Showing top 2 contents closest to publication')).toBeInTheDocument();
      });
    });

    it('should show correct footer text for single suggestion', async () => {
      const mockSuggestions: ContentSuggestion[] = [
        createMockSuggestion()
      ];

      mockSuggestionService.getPublicationSuggestions.mockResolvedValue(mockSuggestions);

      render(<PublicationSuggestions />);

      await waitFor(() => {
        expect(screen.getByText('Showing top 1 content closest to publication')).toBeInTheDocument();
      });
    });
  });
});