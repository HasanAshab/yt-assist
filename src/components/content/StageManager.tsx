import React, { useState, useCallback } from 'react';
import type { Content } from '../../types';
import { CONTENT_STAGES, STAGE_REQUIREMENTS } from '../../constants';
import { ContentService } from '../../services/content.service';
import { LoadingSpinner } from '../common/LoadingSpinner';

interface StageManagerProps {
  content: Content;
  onStageAdvance: (newStage: number) => Promise<void>;
  disabled?: boolean;
}

export const StageManager: React.FC<StageManagerProps> = ({
  content,
  onStageAdvance,
  disabled = false
}) => {
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isValidating, setIsValidating] = useState(false);

  const currentStage = content.current_stage;
  const nextStage = currentStage + 1;
  const isLastStage = currentStage >= CONTENT_STAGES.length - 1;

  // Check if content can advance to next stage
  const validateNextStage = useCallback(async (): Promise<boolean> => {
    if (isLastStage) return false;

    setIsValidating(true);
    setValidationErrors([]);

    try {
      // Validate stage requirements
      const stageValidation = ContentService.validateStageRequirements(content, nextStage);
      
      if (!stageValidation.isValid) {
        setValidationErrors(stageValidation.errors);
        return false;
      }

      // For published stage, also check dependencies
      if (nextStage === CONTENT_STAGES.length - 1) {
        const depValidation = await ContentService.validatePublishDependencies(content);
        if (!depValidation.isValid) {
          setValidationErrors(depValidation.errors);
          return false;
        }
      }

      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Validation failed';
      setValidationErrors([errorMessage]);
      return false;
    } finally {
      setIsValidating(false);
    }
  }, [content, nextStage, isLastStage]);

  // Handle stage advancement
  const handleAdvanceStage = useCallback(async () => {
    const isValid = await validateNextStage();
    if (isValid) {
      await onStageAdvance(nextStage);
    }
  }, [validateNextStage, onStageAdvance, nextStage]);

  // Get stage requirements for display
  const getStageRequirements = (stage: number): string[] => {
    const requirements: string[] = [];

    if (stage >= STAGE_REQUIREMENTS.TITLE_REQUIRED_STAGE) {
      requirements.push('Title must be provided');
    }
    if (stage >= STAGE_REQUIREMENTS.SCRIPT_REQUIRED_STAGE) {
      requirements.push('Script must be written');
    }
    if (stage >= STAGE_REQUIREMENTS.LINK_REQUIRED_STAGE) {
      requirements.push('Link must be provided');
    }
    if (stage >= STAGE_REQUIREMENTS.FINAL_CHECKS_REQUIRED_STAGE) {
      requirements.push('All final checks must be completed');
    }

    return requirements;
  };

  // Check which requirements are met
  const checkRequirementsMet = (stage: number): { [key: string]: boolean } => {
    return {
      hasTitle: !!content.title,
      hasScript: !!content.script,
      hasLink: !!content.link,
      finalChecksComplete: content.final_checks.every(check => check.completed)
    };
  };

  const nextStageRequirements = getStageRequirements(nextStage);
  const requirementsMet = checkRequirementsMet(nextStage);

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">Current Stage</h3>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
          currentStage === 0 
            ? 'bg-gray-100 text-gray-800'
            : currentStage === CONTENT_STAGES.length - 1
            ? 'bg-green-100 text-green-800'
            : 'bg-blue-100 text-blue-800'
        }`}>
          {CONTENT_STAGES[currentStage]}
        </span>
      </div>

      {/* Current Stage Info */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <div className={`w-3 h-3 rounded-full ${
            currentStage === CONTENT_STAGES.length - 1 ? 'bg-green-500' : 'bg-blue-500'
          }`} />
          <span className="text-sm font-medium text-gray-700">
            Stage {currentStage + 1} of {CONTENT_STAGES.length}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${
              currentStage === CONTENT_STAGES.length - 1 ? 'bg-green-500' : 'bg-blue-500'
            }`}
            style={{ width: `${((currentStage + 1) / CONTENT_STAGES.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Next Stage Section */}
      {!isLastStage && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-md font-medium text-gray-900">Next Stage</h4>
            <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-sm">
              {CONTENT_STAGES[nextStage]}
            </span>
          </div>

          {/* Requirements */}
          {nextStageRequirements.length > 0 && (
            <div>
              <h5 className="text-sm font-medium text-gray-700 mb-2">Requirements</h5>
              <div className="space-y-2">
                {nextStageRequirements.map((requirement, index) => {
                  let isMet = true;
                  let icon = '✓';
                  let textColor = 'text-green-600';

                  // Check specific requirements
                  if (requirement.includes('Title') && !requirementsMet.hasTitle) {
                    isMet = false;
                  } else if (requirement.includes('Script') && !requirementsMet.hasScript) {
                    isMet = false;
                  } else if (requirement.includes('Link') && !requirementsMet.hasLink) {
                    isMet = false;
                  } else if (requirement.includes('final checks') && !requirementsMet.finalChecksComplete) {
                    isMet = false;
                  }

                  if (!isMet) {
                    icon = '✗';
                    textColor = 'text-red-600';
                  }

                  return (
                    <div key={index} className="flex items-center gap-2">
                      <span className={`text-sm font-medium ${textColor}`}>{icon}</span>
                      <span className={`text-sm ${isMet ? 'text-gray-600' : 'text-red-600'}`}>
                        {requirement}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Validation Errors */}
          {validationErrors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <h5 className="text-sm font-medium text-red-800 mb-2">Cannot advance to next stage:</h5>
              <ul className="text-sm text-red-700 space-y-1">
                {validationErrors.map((error, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-red-500 mt-0.5">•</span>
                    <span>{error}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t">
            <button
              onClick={validateNextStage}
              disabled={disabled || isValidating}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 flex items-center gap-2"
            >
              {isValidating && <LoadingSpinner size="sm" />}
              Check Requirements
            </button>
            
            <button
              onClick={handleAdvanceStage}
              disabled={disabled || isValidating}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
            >
              {isValidating && <LoadingSpinner size="sm" />}
              Advance to {CONTENT_STAGES[nextStage]}
            </button>
          </div>
        </div>
      )}

      {/* Completed Stage */}
      {isLastStage && (
        <div className="text-center py-6">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h4 className="text-lg font-medium text-gray-900 mb-2">Content Published!</h4>
          <p className="text-sm text-gray-600">
            This content has completed all stages in the pipeline.
          </p>
        </div>
      )}
    </div>
  );
};