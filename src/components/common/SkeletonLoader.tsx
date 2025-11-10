import React from 'react';

interface SkeletonLoaderProps {
  className?: string;
  width?: string;
  height?: string;
  rounded?: boolean;
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  className = '',
  width = 'w-full',
  height = 'h-4',
  rounded = false,
}) => {
  return (
    <div
      className={`animate-pulse bg-gray-200 ${width} ${height} ${
        rounded ? 'rounded-full' : 'rounded'
      } ${className}`}
    />
  );
};

interface SkeletonCardProps {
  showImage?: boolean;
  lines?: number;
  className?: string;
}

export const SkeletonCard: React.FC<SkeletonCardProps> = ({
  showImage = false,
  lines = 3,
  className = '',
}) => {
  return (
    <div className={`bg-white rounded-lg shadow-md p-4 ${className}`}>
      {showImage && (
        <SkeletonLoader className="mb-4" height="h-32" rounded />
      )}
      
      <SkeletonLoader className="mb-3" width="w-3/4" height="h-6" />
      
      {Array.from({ length: lines }).map((_, index) => (
        <SkeletonLoader
          key={index}
          className="mb-2"
          width={index === lines - 1 ? 'w-1/2' : 'w-full'}
          height="h-4"
        />
      ))}
      
      <div className="flex justify-between items-center mt-4">
        <SkeletonLoader width="w-16" height="h-6" rounded />
        <SkeletonLoader width="w-20" height="h-8" rounded />
      </div>
    </div>
  );
};

interface SkeletonListProps {
  items?: number;
  showImage?: boolean;
  className?: string;
}

export const SkeletonList: React.FC<SkeletonListProps> = ({
  items = 3,
  showImage = false,
  className = '',
}) => {
  return (
    <div className={`space-y-4 ${className}`}>
      {Array.from({ length: items }).map((_, index) => (
        <SkeletonCard
          key={index}
          showImage={showImage}
          lines={2}
        />
      ))}
    </div>
  );
};

interface SkeletonTableProps {
  rows?: number;
  columns?: number;
  className?: string;
}

export const SkeletonTable: React.FC<SkeletonTableProps> = ({
  rows = 5,
  columns = 4,
  className = '',
}) => {
  return (
    <div className={`bg-white rounded-lg shadow-md overflow-hidden ${className}`}>
      {/* Header */}
      <div className="bg-gray-50 px-6 py-3 border-b">
        <div className="flex space-x-4">
          {Array.from({ length: columns }).map((_, index) => (
            <SkeletonLoader
              key={index}
              width="flex-1"
              height="h-4"
            />
          ))}
        </div>
      </div>
      
      {/* Rows */}
      <div className="divide-y divide-gray-200">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="px-6 py-4">
            <div className="flex space-x-4">
              {Array.from({ length: columns }).map((_, colIndex) => (
                <SkeletonLoader
                  key={colIndex}
                  width="flex-1"
                  height="h-4"
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};