import React from 'react';

interface MetricsCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: 'blue' | 'green' | 'yellow' | 'purple';
  className?: string;
}

const colorClasses = {
  blue: 'bg-blue-50 border-blue-200 text-blue-800',
  green: 'bg-green-50 border-green-200 text-green-800',
  yellow: 'bg-yellow-50 border-yellow-200 text-yellow-800',
  purple: 'bg-purple-50 border-purple-200 text-purple-800',
};

const iconColorClasses = {
  blue: 'text-blue-600',
  green: 'text-green-600',
  yellow: 'text-yellow-600',
  purple: 'text-purple-600',
};

export const MetricsCard: React.FC<MetricsCardProps> = ({
  title,
  value,
  icon,
  color,
  className = '',
}) => {
  return (
    <div
      className={`
        p-4 rounded-lg border-2 transition-all duration-200 hover:shadow-md
        ${colorClasses[color]}
        ${className}
      `}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium opacity-80">{title}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
        </div>
        <div className={`text-2xl ${iconColorClasses[color]}`}>
          {icon}
        </div>
      </div>
    </div>
  );
};