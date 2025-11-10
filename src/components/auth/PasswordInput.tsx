import { useState, type FormEvent } from 'react';

interface PasswordInputProps {
  onSubmit: (password: string) => Promise<boolean>;
  loading?: boolean;
  error?: string | null;
  className?: string;
}

export function PasswordInput({ onSubmit, loading = false, error, className = '' }: PasswordInputProps) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const validatePassword = (value: string): string | null => {
    if (!value.trim()) {
      return 'Password is required';
    }
    if (value.length < 3) {
      return 'Password must be at least 3 characters';
    }
    return null;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    const validation = validatePassword(password);
    if (validation) {
      setValidationError(validation);
      return;
    }

    setValidationError(null);
    const success = await onSubmit(password);
    
    if (!success) {
      // Clear password on failed attempt
      setPassword('');
    }
  };

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    if (validationError) {
      setValidationError(null);
    }
  };

  const displayError = validationError || error;

  return (
    <form onSubmit={handleSubmit} className={`space-y-4 ${className}`}>
      <div>
        <label 
          htmlFor="password" 
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Enter Password
        </label>
        <div className="relative">
          <input
            id="password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => handlePasswordChange(e.target.value)}
            disabled={loading}
            className={`
              w-full px-3 py-2 pr-10 border rounded-md shadow-sm
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
              disabled:bg-gray-50 disabled:text-gray-500
              ${displayError ? 'border-red-300' : 'border-gray-300'}
            `}
            placeholder="Enter your password"
            autoComplete="current-password"
            autoFocus
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            disabled={loading}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 disabled:hover:text-gray-400"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? (
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
              </svg>
            ) : (
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            )}
          </button>
        </div>
        {displayError && (
          <p className="mt-1 text-sm text-red-600" role="alert">
            {displayError}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={loading || !password.trim()}
        className={`
          w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white
          focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
          disabled:opacity-50 disabled:cursor-not-allowed
          ${loading 
            ? 'bg-blue-400 cursor-not-allowed' 
            : 'bg-blue-600 hover:bg-blue-700'
          }
        `}
      >
        {loading ? (
          <div className="flex items-center">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Authenticating...
          </div>
        ) : (
          'Sign In'
        )}
      </button>
    </form>
  );
}