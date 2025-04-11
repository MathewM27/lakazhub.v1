'use client';

import React, { ReactNode } from 'react';
import { useAuth } from '../auth/AuthHandler';

// Define the error boundary props and state types
type ErrorBoundaryProps = {
  children: ReactNode;
  fallback: (props: { error: Error; resetError: () => void }) => React.ReactElement;
};

type ErrorBoundaryState = {
  hasError: boolean;
  error: Error | null;
};

// Create our own ErrorBoundary class component
class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  resetError = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): React.ReactNode {
    if (this.state.hasError && this.state.error) {
      return this.props.fallback({
        error: this.state.error,
        resetError: this.resetError,
      });
    }

    return this.props.children;
  }
}

export default function AuthErrorBoundary({ children }: { children: ReactNode }) {
  const { signOut } = useAuth();
  
  return (
    <ErrorBoundary
      fallback={({ error, resetError }: { error: Error; resetError: () => void }) => (
        <div className="flex flex-col items-center justify-center min-h-[50vh] p-4">
          <div className="text-center max-w-md w-full bg-zinc-900 p-6 rounded-lg shadow-md border border-zinc-800">
            <h3 className="text-xl font-bold mb-4 text-yellow-500">Authentication Error</h3>
            <p className="mb-6 text-white">{error.message}</p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => {
                  signOut();
                  resetError();
                }}
                className="px-4 py-2 bg-yellow-500 text-black font-medium rounded hover:bg-yellow-400"
              >
                Sign Out
              </button>
              <button
                onClick={resetError}
                className="px-4 py-2 bg-zinc-800 text-white rounded hover:bg-zinc-700"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      )}
    >
      {children}
    </ErrorBoundary>
  );
}
