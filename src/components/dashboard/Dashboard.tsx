import React from 'react';
import { useDashboardMetrics } from '../../hooks/useDashboardMetrics';
import { MetricsCard } from './MetricsCard';

// Simple icons using Unicode symbols for lightweight implementation
const PendingIcon = () => <span>⏳</span>;
const InProgressIcon = () => <span>🔄</span>;
const TasksIcon = () => <span>✅</span>;

export const Dashboard: React.FC = () => {
  const metrics = useDashboardMetrics();

  return (
    <div className="p-4 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Dashboard</h1>
        <p className="text-gray-600">Overview of your content pipeline and tasks</p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <MetricsCard
          title="Pending Content"
          value={metrics.pendingCount}
          icon={<PendingIcon />}
          color="yellow"
        />

        <MetricsCard
          title="In Progress"
          value={metrics.inProgressCount}
          icon={<InProgressIcon />}
          color="blue"
        />

        <MetricsCard
          title="Remaining Tasks"
          value={metrics.remainingTasksCount}
          icon={<TasksIcon />}
          color="green"
        />
      </div>
    </div>
  );
};