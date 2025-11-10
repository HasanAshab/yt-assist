import React from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { useContent } from '../../hooks/useContent';

interface BreadcrumbItem {
  label: string;
  path?: string;
  isActive?: boolean;
}

const ChevronRightIcon = () => (
  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
);

export const Breadcrumb: React.FC = () => {
  const location = useLocation();
  const params = useParams();
  const { contents } = useContent();

  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    const pathSegments = location.pathname.split('/').filter(Boolean);
    const breadcrumbs: BreadcrumbItem[] = [];

    // Always start with Dashboard
    breadcrumbs.push({
      label: 'Dashboard',
      path: '/dashboard',
      isActive: pathSegments.length === 0 || pathSegments[0] === 'dashboard'
    });

    // Handle different routes
    if (pathSegments.length > 0 && pathSegments[0] !== 'dashboard') {
      const firstSegment = pathSegments[0];

      switch (firstSegment) {
        case 'content':
          breadcrumbs.push({
            label: 'Content',
            path: '/content',
            isActive: pathSegments.length === 1
          });

          // Handle content edit page
          if (pathSegments.length > 1 && pathSegments[2] === 'edit') {
            const contentId = pathSegments[1];
            const content = contents.find(c => c.id === contentId);
            
            breadcrumbs.push({
              label: content ? `Edit: ${content.topic}` : 'Edit Content',
              isActive: true
            });
          }
          break;

        case 'tasks':
          breadcrumbs.push({
            label: 'Tasks',
            path: '/tasks',
            isActive: true
          });
          break;

        case 'morals':
          breadcrumbs.push({
            label: 'Morals',
            path: '/morals',
            isActive: true
          });
          break;

        case 'suggestions':
          breadcrumbs.push({
            label: 'Publication Suggestions',
            path: '/suggestions',
            isActive: true
          });
          break;

        case 'settings':
          breadcrumbs.push({
            label: 'Settings',
            path: '/settings',
            isActive: true
          });
          break;

        default:
          // Handle unknown routes
          breadcrumbs.push({
            label: firstSegment.charAt(0).toUpperCase() + firstSegment.slice(1),
            isActive: true
          });
          break;
      }
    }

    return breadcrumbs;
  };

  const breadcrumbs = generateBreadcrumbs();

  // Don't show breadcrumbs if we're only on dashboard or if the only active item is dashboard
  if (breadcrumbs.length <= 1 || (breadcrumbs.length === 1 && breadcrumbs[0].isActive)) {
    return null;
  }

  return (
    <nav className="flex items-center space-x-2 text-sm text-gray-600 mb-4" aria-label="Breadcrumb">
      <ol className="flex items-center space-x-2">
        {breadcrumbs.map((breadcrumb, index) => (
          <li key={index} className="flex items-center">
            {index > 0 && (
              <ChevronRightIcon />
            )}
            
            {breadcrumb.path && !breadcrumb.isActive ? (
              <Link
                to={breadcrumb.path}
                className="ml-2 text-blue-600 hover:text-blue-800 font-medium transition-colors"
              >
                {breadcrumb.label}
              </Link>
            ) : (
              <span className={`ml-2 ${breadcrumb.isActive ? 'text-gray-900 font-medium' : 'text-gray-600'}`}>
                {breadcrumb.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
};

// Hook for programmatic breadcrumb management
export const useBreadcrumb = () => {
  const location = useLocation();
  
  const isContentEditPage = (): boolean => {
    return location.pathname.includes('/content/') && location.pathname.endsWith('/edit');
  };

  const getContentIdFromPath = (): string | null => {
    const match = location.pathname.match(/\/content\/([^\/]+)\/edit/);
    return match ? match[1] : null;
  };

  return {
    isContentEditPage,
    getContentIdFromPath,
    currentPath: location.pathname
  };
};