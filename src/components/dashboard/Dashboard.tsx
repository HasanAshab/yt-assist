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

      {/* Additional Dashboard Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <button className="w-full text-left p-3 rounded-md bg-blue-50 hover:bg-blue-100 transition-colors border border-blue-200">
              <div className="font-medium text-blue-900">Create New Content</div>
              <div className="text-sm text-blue-700">Start a new content piece</div>
            </button>
            
            <button className="w-full text-left p-3 rounded-md bg-green-50 hover:bg-green-100 transition-colors border border-green-200">
              <div className="font-medium text-green-900">Add Task</div>
              <div className="text-sm text-green-700">Create a new task for today</div>
            </button>
            
            <button className="w-full text-left p-3 rounded-md bg-purple-50 hover:bg-purple-100 transition-colors border border-purple-200">
              <div className="font-medium text-purple-900">View Suggestions</div>
              <div className="text-sm text-purple-700">See publication recommendations</div>
            </button>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
          <div className="space-y-3">
            {metrics.pendingCount > 0 && (
              <div className="flex items-center p-3 bg-yellow-50 rounded-md border border-yellow-200">
                <span className="text-yellow-600 mr-3">⏳</span>
                <div>
                  <div className="font-medium text-yellow-900">
                    {metrics.pendingCount} content{metrics.pendingCount !== 1 ? 's' : ''} pending
                  </div>
                  <div className="text-sm text-yellow-700">Ready to start working on</div>
                </div>
              </div>
            )}
            
            {metrics.inProgressCount > 0 && (
              <div className="flex items-center p-3 bg-blue-50 rounded-md border border-blue-200">
                <span className="text-blue-600 mr-3">🔄</span>
                <div>
                  <div className="font-medium text-blue-900">
                    {metrics.inProgressCount} content{metrics.inProgressCount !== 1 ? 's' : ''} in progress
                  </div>
                  <div className="text-sm text-blue-700">Continue working on these</div>
                </div>
              </div>
            )}
            
            {metrics.remainingTasksCount > 0 && (
              <div className="flex items-center p-3 bg-green-50 rounded-md border border-green-200">
                <span className="text-green-600 mr-3">✅</span>
                <div>
                  <div className="font-medium text-green-900">
                    {metrics.remainingTasksCount} task{metrics.remainingTasksCount !== 1 ? 's' : ''} remaining
                  </div>
                  <div className="text-sm text-green-700">Complete before end of day</div>
                </div>
              </div>
            )}
            
            {metrics.pendingCount === 0 && metrics.inProgressCount === 0 && metrics.remainingTasksCount === 0 && (
              <div className="text-center py-8 text-gray-500">
                <span className="text-4xl mb-2 block">🎉</span>
                <div className="font-medium">All caught up!</div>
                <div className="text-sm">No pending content or tasks</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};