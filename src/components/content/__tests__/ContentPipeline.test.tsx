import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { ContentPipeline } from '../ContentPipeline';
import { Content } from '../../../types';
import { CONTENT_STAGES } from '../../../constants';

// Mock the ContentService
vi.mock('../../../services/content.service', () => ({
  ContentService: {
    validateStageRequirements: vi.fn()
  }
}));

// Mock Supabase to avoid environment variable issues
vi.mock('../../../services/supabase', () => ({
  supabase: {},
  handleSupabaseError: vi.fn()
}));

const { ContentService } = await import('../../../services/content.service');
const mockContentService = vi.mocked(ContentService);

describe('ContentPipeline', () => {
  const mockContent: Content = {
    id: '1',
    topic: 'Test Content',
    category: 'Demanding',
    current_stage: 2, // Thumbnail stage
    title: 'Test Title',
    script: undefined,
    final_checks: [
      { id: '1', description: 'Check 1', completed: false },
      { id: '2', description: 'Check 2', completed: true }
    ],
    publish_after: undefined,
    publish_before: undefined,
    link: undefined,
    morals: ['Test moral'],
    flags: [],
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z'
  };

  const mockOnStageUpdate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockContentService.validateStageRequirements.mockReturnValue({
      isValid: true,
      errors: []
    });
  });

  describe('Rendering', () => {
    it('renders the pipeline with correct content information', () => {
      render(
        <ContentPipeline
          content={mockContent}
          onStageUpdate={mockOnStageUpdate}
        />
      );

      expect(screen.getByText('Content Pipeline: Test Content')).toBeInTheDocument();
      expect(screen.getByText('Demanding')).toBeInTheDocument();
      expect(screen.getByText(/Stage: Thumbnail \(3\/12\)/)).toBeInTheDocument();
    });

    it('renders all pipeline stages', () => {
      render(
        <ContentPipeline
          content={mockContent}
          onStageUpdate={mockOnStageUpdate}
        />
      );

      // Check that all stages are rendered (using getAllByText to handle duplicates)
      CONTENT_STAGES.forEach(stage => {
        const stageElements = screen.getAllByText(stage);
        expect(stageElements.length).toBeGreaterThan(0);
      });
    });

    it('displays progress bar correctly', () => {
      render(
        <ContentPipeline
          content={mockContent}
          onStageUpdate={mockOnStageUpdate}
        />
      );

      const progressText = screen.getByText('3 of 12');
      expect(progressText).toBeInTheDocument();
      
      // Find the progress bar more specifically
      const progressContainer = progressText.closest('div')?.parentElement;
      const progressBar = progressContainer?.querySelector('.bg-blue-500');
      expect(progressBar).toBeInTheDocument();
      expect(progressBar).toHaveStyle({ width: '25%' }); // 3/12 = 25%
    });
  });

  describe('Dependencies', () => {
    it('shows dependency warnings when publish_after is set', () => {
      const contentWithDependency = {
        ...mockContent,
        publish_after: 'dependency-content'
      };

      render(
        <ContentPipeline
          content={contentWithDependency}
          onStageUpdate={mockOnStageUpdate}
        />
      );

      expect(screen.getByText('Dependencies')).toBeInTheDocument();
      expect(screen.getByText('Depends on: dependency-content')).toBeInTheDocument();
    });

    it('shows dependency warnings when publish_before is set', () => {
      const contentWithDependency = {
        ...mockContent,
        publish_before: 'dependent-content'
      };

      render(
        <ContentPipeline
          content={contentWithDependency}
          onStageUpdate={mockOnStageUpdate}
        />
      );

      expect(screen.getByText('Dependencies')).toBeInTheDocument();
      expect(screen.getByText('Must publish before: dependent-content')).toBeInTheDocument();
    });

    it('does not show dependency section when no dependencies exist', () => {
      render(
        <ContentPipeline
          content={mockContent}
          onStageUpdate={mockOnStageUpdate}
        />
      );

      expect(screen.queryByText('Dependencies')).not.toBeInTheDocument();
    });
  });

  describe('Stage Interactions', () => {
    it('allows clicking on the next stage when validation passes', async () => {
      render(
        <ContentPipeline
          content={mockContent}
          onStageUpdate={mockOnStageUpdate}
        />
      );

      // Find the next stage (ToC - stage 3) in mobile view by looking for the clickable container
      const mobileView = document.querySelector('.md\\:hidden');
      const tocStageContainer = Array.from(mobileView?.querySelectorAll('h4') || [])
        .find(el => el.textContent === 'ToC')?.closest('div');
      expect(tocStageContainer).toBeInTheDocument();

      fireEvent.click(tocStageContainer!);

      await waitFor(() => {
        expect(mockOnStageUpdate).toHaveBeenCalledWith('1', 3);
      });
    });

    it('prevents clicking when validation fails', async () => {
      mockContentService.validateStageRequirements.mockReturnValue({
        isValid: false,
        errors: ['Title is required']
      });

      render(
        <ContentPipeline
          content={mockContent}
          onStageUpdate={mockOnStageUpdate}
        />
      );

      const mobileView = document.querySelector('.md\\:hidden');
      const tocStageContainer = Array.from(mobileView?.querySelectorAll('h4') || [])
        .find(el => el.textContent === 'ToC')?.closest('div');
      fireEvent.click(tocStageContainer!);

      // Should not call onStageUpdate
      expect(mockOnStageUpdate).not.toHaveBeenCalled();

      // Should show error message
      await waitFor(() => {
        expect(screen.getByText('Title is required')).toBeInTheDocument();
      });
    });

    it('shows loading state during stage update', async () => {
      // Mock a delayed response
      mockOnStageUpdate.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

      render(
        <ContentPipeline
          content={mockContent}
          onStageUpdate={mockOnStageUpdate}
        />
      );

      const mobileView = document.querySelector('.md\\:hidden');
      const tocStageContainer = Array.from(mobileView?.querySelectorAll('h4') || [])
        .find(el => el.textContent === 'ToC')?.closest('div');
      fireEvent.click(tocStageContainer!);

      // Should show loading state
      expect(screen.getByText('Updating stage...')).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.queryByText('Updating stage...')).not.toBeInTheDocument();
      });
    });
  });

  describe('Requirements Display', () => {
    it('shows required fields for stages that need them', () => {
      const contentWithoutScript = {
        ...mockContent,
        current_stage: 4, // Ordered stage
        script: undefined
      };

      render(
        <ContentPipeline
          content={contentWithoutScript}
          onStageUpdate={mockOnStageUpdate}
        />
      );

      // Should show script requirement for Scripted stage
      expect(screen.getAllByText('Script required')[0]).toBeInTheDocument();
    });

    it('shows final checks requirement for Published stage', () => {
      const contentNearPublish = {
        ...mockContent,
        current_stage: 10, // SEO Optimised stage
        link: 'https://example.com',
        final_checks: [
          { id: '1', description: 'Check 1', completed: false },
          { id: '2', description: 'Check 2', completed: true }
        ]
      };

      render(
        <ContentPipeline
          content={contentNearPublish}
          onStageUpdate={mockOnStageUpdate}
        />
      );

      // Should show incomplete final checks
      expect(screen.getByText('1 final checks incomplete')).toBeInTheDocument();
    });

    it('shows link requirement for Published stage', () => {
      const contentNearPublish = {
        ...mockContent,
        current_stage: 10, // SEO Optimised stage
        link: undefined
      };

      render(
        <ContentPipeline
          content={contentNearPublish}
          onStageUpdate={mockOnStageUpdate}
        />
      );

      expect(screen.getByText('Link required')).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    it('renders both desktop and mobile views', () => {
      render(
        <ContentPipeline
          content={mockContent}
          onStageUpdate={mockOnStageUpdate}
        />
      );

      // Desktop view should exist (hidden on mobile)
      const desktopView = document.querySelector('.hidden.md\\:block');
      expect(desktopView).toBeInTheDocument();

      // Mobile view should exist (hidden on desktop)
      const mobileView = document.querySelector('.md\\:hidden');
      expect(mobileView).toBeInTheDocument();
    });
  });

  describe('Tooltips', () => {
    it('shows stage name on hover in desktop view', async () => {
      render(
        <ContentPipeline
          content={mockContent}
          onStageUpdate={mockOnStageUpdate}
        />
      );

      // Find a stage indicator in desktop view
      const stageIndicators = screen.getAllByLabelText(/Stage \d+:/);
      const firstStage = stageIndicators[0];

      fireEvent.mouseEnter(firstStage);

      await waitFor(() => {
        // The tooltip should appear with the stage name
        const tooltips = screen.getAllByText('Pending');
        expect(tooltips.length).toBeGreaterThan(0);
      });

      fireEvent.mouseLeave(firstStage);
    });

    it('shows error message in tooltip when validation fails', async () => {
      mockContentService.validateStageRequirements.mockReturnValue({
        isValid: false,
        errors: ['Script is required']
      });

      render(
        <ContentPipeline
          content={mockContent}
          onStageUpdate={mockOnStageUpdate}
        />
      );

      const mobileView = document.querySelector('.md\\:hidden');
      const tocStageContainer = Array.from(mobileView?.querySelectorAll('h4') || [])
        .find(el => el.textContent === 'ToC')?.closest('div');
      fireEvent.click(tocStageContainer!);

      // Click should trigger validation and show error
      await waitFor(() => {
        expect(screen.getByText('Script is required')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels for stage indicators', () => {
      render(
        <ContentPipeline
          content={mockContent}
          onStageUpdate={mockOnStageUpdate}
        />
      );

      CONTENT_STAGES.forEach((stage, index) => {
        const stageElement = screen.getByLabelText(`Stage ${index + 1}: ${stage}`);
        expect(stageElement).toBeInTheDocument();
      });
    });

    it('sets proper tabIndex for clickable and non-clickable stages', () => {
      render(
        <ContentPipeline
          content={mockContent}
          onStageUpdate={mockOnStageUpdate}
        />
      );

      const stageIndicators = screen.getAllByLabelText(/Stage \d+:/);
      
      // Next stage should be focusable
      const nextStage = stageIndicators[3]; // ToC stage
      expect(nextStage).toHaveAttribute('tabIndex', '0');

      // Future stages should not be focusable
      const futureStage = stageIndicators[5]; // Recorded stage
      expect(futureStage).toHaveAttribute('tabIndex', '-1');
    });

    it('sets aria-disabled for non-clickable stages', () => {
      render(
        <ContentPipeline
          content={mockContent}
          onStageUpdate={mockOnStageUpdate}
        />
      );

      const stageIndicators = screen.getAllByLabelText(/Stage \d+:/);
      
      // Future stages should be disabled
      const futureStage = stageIndicators[5]; // Recorded stage
      expect(futureStage).toHaveAttribute('aria-disabled', 'true');

      // Next stage should not be disabled
      const nextStage = stageIndicators[3]; // ToC stage
      expect(nextStage).toHaveAttribute('aria-disabled', 'false');
    });
  });

  describe('Error Handling', () => {
    it('handles stage update errors gracefully', async () => {
      const errorMessage = 'Network error';
      mockOnStageUpdate.mockRejectedValue(new Error(errorMessage));

      render(
        <ContentPipeline
          content={mockContent}
          onStageUpdate={mockOnStageUpdate}
        />
      );

      const mobileView = document.querySelector('.md\\:hidden');
      const tocStageContainer = Array.from(mobileView?.querySelectorAll('h4') || [])
        .find(el => el.textContent === 'ToC')?.closest('div');
      fireEvent.click(tocStageContainer!);

      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
      });

      // Loading state should be cleared
      expect(screen.queryByText('Updating stage...')).not.toBeInTheDocument();
    });

    it('clears previous errors when successful update occurs', async () => {
      // First, create an error
      mockContentService.validateStageRequirements.mockReturnValue({
        isValid: false,
        errors: ['Validation error']
      });

      const { rerender } = render(
        <ContentPipeline
          content={mockContent}
          onStageUpdate={mockOnStageUpdate}
        />
      );

      const mobileView = document.querySelector('.md\\:hidden');
      const tocStageContainer = Array.from(mobileView?.querySelectorAll('h4') || [])
        .find(el => el.textContent === 'ToC')?.closest('div');
      fireEvent.click(tocStageContainer!);

      await waitFor(() => {
        expect(screen.getByText('Validation error')).toBeInTheDocument();
      });

      // Now fix the validation and try again
      mockContentService.validateStageRequirements.mockReturnValue({
        isValid: true,
        errors: []
      });

      rerender(
        <ContentPipeline
          content={mockContent}
          onStageUpdate={mockOnStageUpdate}
        />
      );

      const updatedMobileView = document.querySelector('.md\\:hidden');
      const updatedTocStageContainer = Array.from(updatedMobileView?.querySelectorAll('h4') || [])
        .find(el => el.textContent === 'ToC')?.closest('div');
      fireEvent.click(updatedTocStageContainer!);

      await waitFor(() => {
        expect(mockOnStageUpdate).toHaveBeenCalledWith('1', 3);
      });

      // Error should be cleared
      expect(screen.queryByText('Validation error')).not.toBeInTheDocument();
    });
  });

  describe('Stage Status Logic', () => {
    it('correctly identifies completed, active, and next stages', () => {
      render(
        <ContentPipeline
          content={mockContent}
          onStageUpdate={mockOnStageUpdate}
        />
      );

      // Stages 0 and 1 should be completed (have checkmarks in desktop view)
      const completedStages = screen.getAllByLabelText(/Stage [12]:/);
      completedStages.forEach(stage => {
        // Should have completed styling
        expect(stage).toHaveClass('bg-green-500');
      });

      // Stage 2 should be active (current stage)
      const activeStage = screen.getByLabelText('Stage 3: Thumbnail');
      expect(activeStage).toHaveClass('bg-blue-500');

      // Stage 3 should be clickable (next stage)
      const nextStage = screen.getByLabelText('Stage 4: ToC');
      expect(nextStage).toHaveClass('bg-gray-100');
      expect(nextStage).toHaveAttribute('tabIndex', '0');
    });

    it('prevents interaction with current stage', async () => {
      render(
        <ContentPipeline
          content={mockContent}
          onStageUpdate={mockOnStageUpdate}
        />
      );

      // Try to click on current stage (should not trigger update)
      const mobileView = document.querySelector('.md\\:hidden');
      const currentStageContainer = Array.from(mobileView?.querySelectorAll('h4') || [])
        .find(el => el.textContent === 'Thumbnail')?.closest('div');
      fireEvent.click(currentStageContainer!);

      // Should not call onStageUpdate
      expect(mockOnStageUpdate).not.toHaveBeenCalled();
    });
  });
});