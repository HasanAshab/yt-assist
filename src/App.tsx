import { BrowserRouter as Router } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { AppProvider } from './contexts/AppContext';
import { ProtectedRoute } from './components/auth';
import { AppLayout } from './components/layout';
import { AppRouter } from './components/router';
import { ErrorBoundary, ToastContainer, OfflineIndicator } from './components/common';
import { useErrorHandler } from './hooks/useErrorHandler';

function AppContent() {
  const { errors, removeError } = useErrorHandler();

  return (
    <AppLayout>
      <OfflineIndicator className="mx-4 mt-4" />
      <AppRouter />
      <ToastContainer 
        errors={errors} 
        onRemoveError={removeError}
        position="top-right"
        maxToasts={5}
      />
    </AppLayout>
  );
}

function App() {
  const handleError = (error: Error, errorInfo: any) => {
    console.error('Application Error:', error, errorInfo);
    // In production, you might want to send this to an error reporting service
  };

  return (
    <ErrorBoundary onError={handleError}>
      <AuthProvider>
        <Router>
          <ProtectedRoute>
            <AppProvider>
              <AppContent />
            </AppProvider>
          </ProtectedRoute>
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
