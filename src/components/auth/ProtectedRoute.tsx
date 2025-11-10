import { type ReactNode } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { AuthComponent } from './AuthComponent';

interface ProtectedRouteProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export function ProtectedRoute({ children, fallback }: ProtectedRouteProps) {
  const { state } = useAuth();

  // Show loading state while checking authentication
  if (state.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show authentication component if not authenticated
  if (!state.isAuthenticated) {
    return fallback || <AuthComponent />;
  }

  // Render protected content if authenticated
  return <>{children}</>;
}

// Higher-order component version for class components or more complex use cases
export function withAuth<P extends object>(
  Component: React.ComponentType<P>
): React.ComponentType<P> {
  return function AuthenticatedComponent(props: P) {
    return (
      <ProtectedRoute>
        <Component {...props} />
      </ProtectedRoute>
    );
  };
}