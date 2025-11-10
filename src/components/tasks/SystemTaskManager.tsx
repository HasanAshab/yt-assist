import React from 'react';
import { useSystemTasks, useSystemTaskStats } from '../../hooks/useSystemTasks';
// Simple date formatting utility
const formatDistanceToNow = (date: Date, options?: { addSuffix?: boolean }): string => {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  let result = '';
  if (diffDays > 0) {
    result = `${diffDays} day${diffDays > 1 ? 's' : ''}`;
  } else if (diffHours > 0) {
    result = `${diffHours} hour${diffHours > 1 ? 's' : ''}`;
  } else if (diffMinutes > 0) {
    result = `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''}`;
  } else {
    result = 'just now';
  }

  return options?.addSuffix ? `${result} ago` : result;
};

interface SystemTaskManagerProps {
  className?: string;
}

/**
 * Component for managing automated system tasks
 */
export const SystemTaskManager: React.FC<SystemTaskManagerProps> = ({ className = '' }) => {
  const {
    pendingFeedbackTasks,
    contentNeedingAnalysis,
    loading,
    lastCheckTime,
    runDailyChecks,
    handleFeedbackTaskCompletion,
    refreshPendingTasks,
    getSchedulerStatus,
    forceRunDailyTasks
  } = useSystemTasks();

  const stats = useSystemTaskStats();
  const schedulerStatus = getSchedulerStatus();

  const handleTaskClick = async (taskId: string, taskLink?: string) => {
    if (taskLink) {
      // Navigate to the task link (content edit page)
      window.location.href = taskLink;
    }
    
    // Mark task as completed
    await handleFeedbackTaskCompletion(taskId);
  };

  const handleRunDailyChecks = async () => {
    await runDailyChecks();
  };

  const handleForceRun = async () => {
    await forceRunDailyTasks();
  };

  return (
    <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">System Task Manager</h2>
        <div className="flex gap-2">
          <button
            onClick={refreshPendingTasks}
            disabled={loading}
            className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 disabled:opacity-50"
          >
            Refresh
          </button>
          <button
            onClick={handleRunDailyChecks}
            disabled={loading}
            className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200 disabled:opacity-50"
          >
            Run Daily Checks
          </button>
          <button
            onClick={handleForceRun}
            disabled={loading}
            className="px-3 py-1 text-sm bg-orange-100 text-orange-700 rounded hover:bg-orange-200 disabled:opacity-50"
          >
            Force Run
          </button>
        </div>
      </div>

      {/* Scheduler Status */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-sm font-medium text-gray-700 mb-2">Scheduler Status</h3>
        <div className="flex items-center gap-4 text-sm">
          <span className={`px-2 py-1 rounded ${
            schedulerStatus.isRunning 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
          }`}>
            {schedulerStatus.isRunning ? 'Running' : 'Stopped'}
          </span>
          {schedulerStatus.nextRunTime && (
            <span className="text-gray-600">
              Next run: {formatDistanceToNow(schedulerStatus.nextRunTime, { addSuffix: true })}
            </span>
          )}
          {lastCheckTime && (
            <span className="text-gray-600">
              Last check: {formatDistanceToNow(lastCheckTime, { addSuffix: true })}
            </span>
          )}
        </div>
      </div>

      {/* Statistics */}
      <div className="mb-6 grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-blue-50 p-3 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">{stats.totalPendingFeedbackTasks}</div>
          <div className="text-sm text-blue-800">Total Pending</div>
        </div>
        <div className="bg-yellow-50 p-3 rounded-lg">
          <div className="text-2xl font-bold text-yellow-600">{stats.fansFeedbackTasksCount}</div>
          <div className="text-sm text-yellow-800">Fans Feedback</div>
        </div>
        <div className="bg-purple-50 p-3 rounded-lg">
          <div className="text-2xl font-bold text-purple-600">{stats.overallFeedbackTasksCount}</div>
          <div className="text-sm text-purple-800">Overall Feedback</div>
        </div>
        <div className="bg-orange-50 p-3 rounded-lg">
          <div className="text-2xl font-bold text-orange-600">{stats.contentNeedingFansAnalysis}</div>
          <div className="text-sm text-orange-800">Need Fans Analysis</div>
        </div>
        <div className="bg-red-50 p-3 rounded-lg">
          <div className="text-2xl font-bold text-red-600">{stats.contentNeedingOverallAnalysis}</div>
          <div className="text-sm text-red-800">Need Overall Analysis</div>
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Loading...</span>
        </div>
      )}

      {/* Pending Feedback Tasks */}
      <div className="space-y-6">
        {/* Fans Feedback Tasks */}
        {pendingFeedbackTasks.fansFeedbackTasks.length > 0 && (
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">
              Fans Feedback Tasks ({pendingFeedbackTasks.fansFeedbackTasks.length})
            </h3>
            <div className="space-y-2">
              {pendingFeedbackTasks.fansFeedbackTasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-lg hover:bg-yellow-100 transition-colors"
                >
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{task.title}</h4>
                    {task.description && (
                      <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                    )}
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                      <span>Created: {formatDistanceToNow(new Date(task.created_at), { addSuffix: true })}</span>
                      <span>Expires: {formatDistanceToNow(new Date(task.expires_at), { addSuffix: true })}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleTaskClick(task.id, task.link)}
                    className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 transition-colors"
                  >
                    Analyze
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Overall Feedback Tasks */}
        {pendingFeedbackTasks.overallFeedbackTasks.length > 0 && (
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">
              Overall Feedback Tasks ({pendingFeedbackTasks.overallFeedbackTasks.length})
            </h3>
            <div className="space-y-2">
              {pendingFeedbackTasks.overallFeedbackTasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between p-3 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors"
                >
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{task.title}</h4>
                    {task.description && (
                      <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                    )}
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                      <span>Created: {formatDistanceToNow(new Date(task.created_at), { addSuffix: true })}</span>
                      <span>Expires: {formatDistanceToNow(new Date(task.expires_at), { addSuffix: true })}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleTaskClick(task.id, task.link)}
                    className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
                  >
                    Analyze
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Content Needing Analysis */}
        {(contentNeedingAnalysis.needsFansFeedback.length > 0 || contentNeedingAnalysis.needsOverallFeedback.length > 0) && (
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">Content Needing Analysis</h3>
            
            {contentNeedingAnalysis.needsFansFeedback.length > 0 && (
              <div className="mb-4">
                <h4 className="text-md font-medium text-gray-700 mb-2">
                  Needs Fans Feedback Analysis ({contentNeedingAnalysis.needsFansFeedback.length})
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {contentNeedingAnalysis.needsFansFeedback.map((content) => (
                    <div key={content.id} className="p-2 bg-yellow-50 border border-yellow-200 rounded text-sm">
                      <div className="font-medium">{content.topic}</div>
                      <div className="text-gray-600">
                        Published: {formatDistanceToNow(new Date(content.updated_at), { addSuffix: true })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {contentNeedingAnalysis.needsOverallFeedback.length > 0 && (
              <div>
                <h4 className="text-md font-medium text-gray-700 mb-2">
                  Needs Overall Feedback Analysis ({contentNeedingAnalysis.needsOverallFeedback.length})
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {contentNeedingAnalysis.needsOverallFeedback.map((content) => (
                    <div key={content.id} className="p-2 bg-purple-50 border border-purple-200 rounded text-sm">
                      <div className="font-medium">{content.topic}</div>
                      <div className="text-gray-600">
                        Published: {formatDistanceToNow(new Date(content.updated_at), { addSuffix: true })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Empty State */}
        {!loading && 
         pendingFeedbackTasks.fansFeedbackTasks.length === 0 && 
         pendingFeedbackTasks.overallFeedbackTasks.length === 0 && 
         contentNeedingAnalysis.needsFansFeedback.length === 0 && 
         contentNeedingAnalysis.needsOverallFeedback.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-2">✅</div>
            <div className="text-lg font-medium">All caught up!</div>
            <div className="text-sm">No pending feedback analysis tasks.</div>
          </div>
        )}
      </div>
    </div>
  );
};