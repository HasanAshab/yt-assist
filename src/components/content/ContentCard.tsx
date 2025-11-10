import React from 'react';
import type { Content } from '../../types';
import { CONTENT_STAGES } from '../../constants';
import { StageIndicator } from './StageIndicator';
import { ContentActions } from './ContentActions';

interface ContentCardProps {
  content: Content;
  layout: 'grid' | 'list';
  onSelect?: (content: Content) => void;
  onEdit?: (content: Content) => void;
  onDelete?: (content: Content) => void;
  onView?: (content: Content) => void;
  className?: string;
}

export const ContentCard: React.FC<ContentCardProps> = ({
  content,
  layout,
  onSelect,
  onEdit,
  onDelete,
  onView,
  className = ''
}) => {
  const currentStage = CONTENT_STAGES[content.current_stage];
  const isPublished = content.current_stage === CONTENT_STAGES.length - 1;
  const hasIncompleteFinalChecks = content.final_checks?.some(check => !check.completed) || false;
  
  // Calculate progress percentage
  const progressPercentage = ((content.current_stage + 1) / CONTENT_STAGES.length) * 100;

  // Get category color
  const getCategoryColor = (category: string) => {
    return category === 'Demanding' 
      ? 'bg-red-100 text-red-800 border-red-200'
      : 'bg-blue-100 text-blue-800 border-blue-200';
  };

  // Get stage color
  const getStageColor = (stage: number) => {
    if (stage === 0) return 'text-gray-600'; // Pending
    if (stage === CONTENT_STAGES.length - 1) return 'text-green-600'; // Published
    return 'text-blue-600'; // In progress
  };

  const handleCardClick = () => {
    if (onSelect) {
      onSelect(content);
    }
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onEdit) {
      onEdit(content);
    }
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete(content);
    }
  };

  if (layout === 'list') {
    return (
      <div
        className={`bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer ${className}`}
        onClick={handleCardClick}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-lg font-semibold text-gray-900 truncate">
                {content.topic}
              </h3>
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getCategoryColor(content.category)}`}
              >
                {content.category}
              </span>
            </div>
            
            {content.title && (
              <p className="text-sm text-gray-600 mb-2 truncate">
                {content.title}
              </p>
            )}
            
            <div className="flex items-center gap-4">
              <StageIndicator 
                currentStage={content.current_stage}
                size="sm"
              />
              
              <span className={`text-sm font-medium ${getStageColor(content.current_stage)}`}>
                {currentStage}
              </span>
              
              {hasIncompleteFinalChecks && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                  Checks pending
                </span>
              )}
              
              {content.publish_after && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                  Depends on: {content.publish_after}
                </span>
              )}
            </div>
          </div>
          
          <div className="ml-4">
            <ContentActions
              content={content}
              onEdit={onEdit}
              onView={onView}
              onDelete={onDelete}
              compact={true}
            />
          </div>
        </div>
        
        {/* Progress bar */}
        <div className="mt-3">
          <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
            <span>Progress</span>
            <span>{Math.round(progressPercentage)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${
                isPublished ? 'bg-green-500' : 'bg-blue-500'
              }`}
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>
      </div>
    );
  }

  // Grid layout
  return (
    <div
      className={`bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow cursor-pointer ${className}`}
      onClick={handleCardClick}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
            {content.topic}
          </h3>
          
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getCategoryColor(content.category)}`}
          >
            {content.category}
          </span>
        </div>
        
        <div className="ml-2">
          <ContentActions
            content={content}
            onEdit={onEdit}
            onView={onView}
            onDelete={onDelete}
            compact={true}
          />
        </div>
      </div>
      
      {content.title && (
        <p className="text-sm text-gray-600 mb-4 line-clamp-2">
          {content.title}
        </p>
      )}
      
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className={`text-sm font-medium ${getStageColor(content.current_stage)}`}>
            {currentStage}
          </span>
          <StageIndicator 
            currentStage={content.current_stage}
            size="sm"
          />
        </div>
        
        {/* Progress bar */}
        <div>
          <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
            <span>Progress</span>
            <span>{Math.round(progressPercentage)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${
                isPublished ? 'bg-green-500' : 'bg-blue-500'
              }`}
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>
        
        {/* Additional info */}
        <div className="space-y-2">
          {hasIncompleteFinalChecks && (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
              <span className="text-xs text-gray-600">Final checks pending</span>
            </div>
          )}
          
          {content.publish_after && (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
              <span className="text-xs text-gray-600">
                Depends on: {content.publish_after}
              </span>
            </div>
          )}
          
          {content.morals && content.morals.length > 0 && (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
              <span className="text-xs text-gray-600">
                {content.morals.length} moral{content.morals.length !== 1 ? 's' : ''}
              </span>
            </div>
          )}
        </div>
        
        <div className="text-xs text-gray-400 pt-2 border-t border-gray-100">
          Updated {new Date(content.updated_at).toLocaleDateString()}
        </div>
      </div>
    </div>
  );
};