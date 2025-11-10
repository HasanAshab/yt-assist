import React, { useState, useCallback } from 'react';
import { Content } from '../../types';
import { CONTENT_STAGES, STAGE_REQUIREMENTS } from '../../constants';
import { ContentService } from '../../services/content.service';

interface ContentPipelineProps {
  content: Content;
  onStageUpdate: (contentId: string, newStage: number) => void;
  className?: string;
}

interface StageIndicatorProps {
  stage: string;
  index: number;
  isActive: boolean;
  isCompleted: boolean;
  isClickable: boolean;
  hasError: boolean;
  errorMessage?: string;
  onClick: () => void;
}

const StageIndicator: React.FC<StageIndicatorProps> = ({
  stage,
  index,
  isActive,
  isCompleted,
  isClickable,
  hasError,
  errorMessage,
  onClick
}) => {
  const [showTooltip, setShowTooltip] = useState(false);

  const getStageClasses = () => {
    const baseClasses = 'relative flex items-center justify-center w-8 h-8 rounded-full text-xs font-medium transition-all duration-200 cursor-pointer';
    
    if (hasError) {
      return `${baseClasses} bg-red-100 text-red-700 border-2 border-red-300 hover:bg-red-200`;
    }
    
    if (isCompleted) {
      return `${baseClasses} bg-green-500 text-white border-2 border-green-500 hover:bg-green-600`;
    }
    
    if (isActive) {
      return `${baseClasses} bg-blue-500 text-white border-2 border-blue-500 hover:bg-blue-600`;
    }
    
    if (isClickable) {
      return `${baseClasses} bg-gray-100 text-gray-600 border-2 border-gray-300 hover:bg-gray-200 hover:border-gray-400`;
    }
    
    return `${baseClasses} bg-gray-50 text-gray-400 border-2 border-gray-200 cursor-not-allowed`;
  };

  const getConnectorClasses = () => {
    const baseClasses = 'absolute left-full top-1/2 transform -translate-y-1/2 w-4 h-0.5 transition-colors duration-200';
    
    if (isCompleted) {
      return `${baseClasses} bg-green-500`;
    }
    
    return `${baseClasses} bg-gray-300`;
  };

  return (
    <div className="relative flex items-center">
      <div
        className={getStageClasses()}
        onClick={isClickable ? onClick : undefined}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        role="button"
        tabIndex={isClickable ? 0 : -1}
        aria-label={`Stage ${index + 1}: ${stage}`}
        aria-disabled={!isClickable}
      >
        {isCompleted ? (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        ) : (
          <span>{index + 1}</span>
        )}
      </div>
      
      {/* Connector line */}
      {index < CONTENT_STAGES.length - 1 && (
        <div className={getConnectorClasses()} />
      )}
      
      {/* Tooltip */}
      {showTooltip && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap z-10">
          {stage}
          {hasError && errorMessage && (
            <div className="text-red-300 mt-1">{errorMessage}</div>
          )}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-2 border-r-2 border-t-2 border-transparent border-t-gray-900" />
        </div>
      )}
    </div>
  );
};

export const ContentPipeline: React.FC<ContentPipelineProps> = ({
  content,
  onStageUpdate,
  className = ''
}) => {
  const [validationErrors, setValidationErrors] = useState<Record<number, string>>({});
  const [isUpdating, setIsUpdating] = useState(false);

  const validateStageRequirements = useCallback((targetStage: number): string | null => {
    const validation = ContentService.validateStageRequirements(content, targetStage);
    return validation.isValid ? null : validation.errors[0];
  }, [content]);

  const handleStageClick = useCallback(async (targetStage: number) => {
    if (isUpdating || targetStage === content.current_stage) {
      return;
    }

    // Validate stage requirements
    const errorMessage = validateStageRequirements(targetStage);
    if (errorMessage) {
      setValidationErrors(prev => ({ ...prev, [targetStage]: errorMessage }));
      return;
    }

    // Clear any previous errors for this stage
    setValidationErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[targetStage];
      return newErrors;
    });

    setIsUpdating(true);
    try {
      await onStageUpdate(content.id, targetStage);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update stage';
      setValidationErrors(prev => ({ ...prev, [targetStage]: message }));
    } finally {
      setIsUpdating(false);
    }
  }, [content.id, content.current_stage, isUpdating, onStageUpdate, validateStageRequirements]);

  const getStageStatus = useCallback((stageIndex: number) => {
    const isCompleted = stageIndex < content.current_stage;
    const isActive = stageIndex === content.current_stage;
    const isNext = stageIndex === content.current_stage + 1;
    const isClickable = isNext && !isUpdating;
    const hasError = validationErrors[stageIndex] !== undefined;
    
    return {
      isCompleted,
      isActive,
      isClickable,
      hasError,
      errorMessage: validationErrors[stageIndex]
    };
  }, [content.current_stage, validationErrors, isUpdating]);

  const getDependencyWarnings = useCallback(() => {
    const warnings: string[] = [];
    
    if (content.publish_after) {
      warnings.push(`Depends on: ${content.publish_after}`);
    }
    
    if (content.publish_before) {
      warnings.push(`Must publish before: ${content.publish_before}`);
    }
    
    return warnings;
  }, [content.publish_after, content.publish_before]);

  const getRequiredFields = useCallback((stageIndex: number) => {
    const requirements: string[] = [];
    
    if (stageIndex >= STAGE_REQUIREMENTS.TITLE_REQUIRED_STAGE && !content.title) {
      requirements.push('Title required');
    }
    
    if (stageIndex >= STAGE_REQUIREMENTS.SCRIPT_REQUIRED_STAGE && !content.script) {
      requirements.push('Script required');
    }
    
    if (stageIndex >= STAGE_REQUIREMENTS.LINK_REQUIRED_STAGE && !content.link) {
      requirements.push('Link required');
    }
    
    if (stageIndex >= STAGE_REQUIREMENTS.FINAL_CHECKS_REQUIRED_STAGE) {
      const incompleteFinalChecks = content.final_checks.filter(check => !check.completed);
      if (incompleteFinalChecks.length > 0) {
        requirements.push(`${incompleteFinalChecks.length} final checks incomplete`);
      }
    }
    
    return requirements;
  }, [content.title, content.script, content.link, content.final_checks]);

  const dependencyWarnings = getDependencyWarnings();

  return (
    <div className={`content-pipeline ${className}`}>
      {/* Header */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Content Pipeline: {content.topic}
        </h3>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span className="px-2 py-1 bg-gray-100 rounded">
            {content.category}
          </span>
          <span>
            Stage: {CONTENT_STAGES[content.current_stage]} ({content.current_stage + 1}/{CONTENT_STAGES.length})
          </span>
        </div>
      </div>

      {/* Dependency warnings */}
      {dependencyWarnings.length > 0 && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-yellow-400 mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div>
              <h4 className="text-sm font-medium text-yellow-800">Dependencies</h4>
              <ul className="mt-1 text-sm text-yellow-700">
                {dependencyWarnings.map((warning, index) => (
                  <li key={index}>{warning}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Pipeline visualization */}
      <div className="relative">
        {/* Desktop view */}
        <div className="hidden md:block">
          <div className="flex items-center justify-between space-x-2 overflow-x-auto pb-4">
            {CONTENT_STAGES.map((stage, index) => {
              const status = getStageStatus(index);
              return (
                <div key={stage} className="flex flex-col items-center min-w-0">
                  <StageIndicator
                    stage={stage}
                    index={index}
                    {...status}
                    onClick={() => handleStageClick(index)}
                  />
                  <div className="mt-2 text-xs text-center text-gray-600 max-w-20">
                    <div className="truncate" title={stage}>
                      {stage}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Mobile view */}
        <div className="md:hidden">
          <div className="space-y-3">
            {CONTENT_STAGES.map((stage, index) => {
              const status = getStageStatus(index);
              const requirements = getRequiredFields(index);
              
              return (
                <div
                  key={stage}
                  className={`flex items-center p-3 rounded-lg border-2 transition-all duration-200 ${
                    status.isCompleted
                      ? 'bg-green-50 border-green-200'
                      : status.isActive
                      ? 'bg-blue-50 border-blue-200'
                      : status.isClickable
                      ? 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                      : 'bg-gray-25 border-gray-100'
                  }`}
                  onClick={status.isClickable ? () => handleStageClick(index) : undefined}
                  role={status.isClickable ? 'button' : undefined}
                >
                  <div className="flex-shrink-0 mr-3">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                        status.hasError
                          ? 'bg-red-100 text-red-700 border-2 border-red-300'
                          : status.isCompleted
                          ? 'bg-green-500 text-white'
                          : status.isActive
                          ? 'bg-blue-500 text-white'
                          : status.isClickable
                          ? 'bg-gray-200 text-gray-600'
                          : 'bg-gray-100 text-gray-400'
                      }`}
                    >
                      {status.isCompleted ? (
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        index + 1
                      )}
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium text-gray-900 truncate">
                        {stage}
                      </h4>
                      {status.isClickable && (
                        <svg className="w-4 h-4 text-gray-400 flex-shrink-0 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      )}
                    </div>
                    
                    {/* Requirements or errors */}
                    {status.hasError && status.errorMessage && (
                      <p className="mt-1 text-xs text-red-600">{status.errorMessage}</p>
                    )}
                    
                    {!status.hasError && requirements.length > 0 && (
                      <div className="mt-1">
                        <p className="text-xs text-gray-500">Required:</p>
                        <ul className="text-xs text-gray-600 list-disc list-inside">
                          {requirements.map((req, reqIndex) => (
                            <li key={reqIndex}>{req}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Progress indicator */}
      <div className="mt-4">
        <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
          <span>Progress</span>
          <span>{content.current_stage + 1} of {CONTENT_STAGES.length}</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${((content.current_stage + 1) / CONTENT_STAGES.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Loading overlay */}
      {isUpdating && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center rounded-lg">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500" />
            <span className="text-sm text-gray-600">Updating stage...</span>
          </div>
        </div>
      )}
    </div>
  );
};