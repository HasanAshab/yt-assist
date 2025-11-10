import React from 'react';
import { CONTENT_STAGES } from '../../constants';

interface StageIndicatorProps {
  currentStage: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function StageIndicator({ currentStage, size = 'md', className = '' }: StageIndicatorProps) {
  const totalStages = CONTENT_STAGES.length;
  const progressPercentage = ((currentStage + 1) / totalStages) * 100;
  
  const sizeClasses = {
    sm: 'w-16 h-2',
    md: 'w-24 h-3',
    lg: 'w-32 h-4'
  };

  const getProgressColor = () => {
    if (currentStage === 0) return 'bg-gray-400'; // Pending
    if (currentStage === totalStages - 1) return 'bg-green-500'; // Published
    return 'bg-blue-500'; // In progress
  };

  return (
    <div className={`${sizeClasses[size]} bg-gray-200 rounded-full overflow-hidden ${className}`}>
      <div
        className={`h-full transition-all duration-300 ${getProgressColor()}`}
        style={{ width: `${progressPercentage}%` }}
      />
    </div>
  );
}