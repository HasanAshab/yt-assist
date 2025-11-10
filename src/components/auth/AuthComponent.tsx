
import { useAuth } from '../../contexts/AuthContext';
import { PasswordInput } from './PasswordInput';

interface AuthComponentProps {
  onAuthenticated?: () => void;
}

export function AuthComponent({ onAuthenticated }: AuthComponentProps) {
  const { state, login } = useAuth();

  const handleLogin = async (password: string): Promise<boolean> => {
    const success = await login(password);
    if (success && onAuthenticated) {
      onAuthenticated();
    }
    return success;
  };

  if (state.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8 p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Checking authentication...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-blue-100">
            <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            YTAssist
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            YouTube Content Pipeline Management
          </p>
          <p className="mt-4 text-center text-sm text-gray-500">
            Please enter your password to access the application
          </p>
        </div>

        <div className="bg-white py-8 px-6 shadow-md rounded-lg">
          <PasswordInput
            onSubmit={handleLogin}
            loading={state.loading}
            error={state.error}
          />
        </div>

        <div className="text-center">
          <p className="text-xs text-gray-500">
            Your authentication status is cached locally for 24 hours
          </p>
        </div>
      </div>
    </div>
  );
}