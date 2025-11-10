import React from 'react';
import { PublicationSuggestions } from './PublicationSuggestions';

/**
 * Example usage of PublicationSuggestions component
 * This demonstrates how to integrate the component into your application
 */
export const PublicationSuggestionsExample: React.FC = () => {
  const handleContentSelect = (contentId: string) => {
    console.log('Selected content:', contentId);
    // Navigate to content edit page or show content details
    // Example: navigate(`/content/${contentId}/edit`);
  };

  const handleRefresh = () => {
    console.log('Suggestions refreshed');
    // Optional: Show toast notification or update other UI elements
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        Publication Suggestions Demo
      </h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Main suggestions component */}
        <div>
          <PublicationSuggestions
            onContentSelect={handleContentSelect}
            onRefresh={handleRefresh}
            className="h-fit"
          />
        </div>

        {/* Additional info panel */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            How It Works
          </h2>
          <div className="space-y-3 text-sm text-gray-600">
            <div>
              <strong>Suggestion Algorithm:</strong>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>Calculates readiness scores based on current stage and completeness</li>
                <li>Prioritizes contents closer to publication</li>
                <li>Gives bonus points for completed fields and final checks</li>
                <li>Excludes contents blocked by dependencies</li>
              </ul>
            </div>
            
            <div>
              <strong>Dependency Checking:</strong>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>Only shows contents with no publish_after dependencies</li>
                <li>Or contents whose dependencies are already published</li>
                <li>Prevents publishing out of order</li>
              </ul>
            </div>

            <div>
              <strong>Real-time Updates:</strong>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>Automatically refreshes when content changes</li>
                <li>Manual refresh button available</li>
                <li>Shows loading states during updates</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Usage examples */}
      <div className="mt-8 bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          Integration Examples
        </h2>
        
        <div className="space-y-4">
          <div>
            <h3 className="font-medium text-gray-700 mb-2">Basic Usage:</h3>
            <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
{`import { PublicationSuggestions } from '@/components/suggestions';

<PublicationSuggestions 
  onContentSelect={(id) => navigate(\`/content/\${id}/edit\`)}
  onRefresh={() => showToast('Suggestions updated')}
/>`}
            </pre>
          </div>

          <div>
            <h3 className="font-medium text-gray-700 mb-2">With Custom Hook:</h3>
            <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
{`import { useSuggestions } from '@/hooks';

const { suggestions, loading, error, refreshSuggestions } = useSuggestions();

// Use suggestions data directly in your custom UI`}
            </pre>
          </div>

          <div>
            <h3 className="font-medium text-gray-700 mb-2">Dashboard Integration:</h3>
            <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
{`// In your dashboard component
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  <MetricsCard />
  <TasksSummary />
  <PublicationSuggestions className="lg:col-span-1" />
</div>`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublicationSuggestionsExample;