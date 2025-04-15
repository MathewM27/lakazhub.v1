'use client';

import React from 'react';
import * as Sentry from '@sentry/nextjs';

type AuthErrorBoundaryState = {
  hasError: boolean;
  error?: Error;
};

export default class AuthErrorBoundary extends React.Component<
  { children: React.ReactNode },
  AuthErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): AuthErrorBoundaryState {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log the error to Sentry
    Sentry.captureException(error, {
      extra: {
        componentStack: errorInfo.componentStack,
        location: 'AuthErrorBoundary'
      },
      tags: {
        component: 'AuthErrorBoundary'
      },
    });
    
    // You can also log the error to your monitoring service
    if (process.env.NODE_ENV === 'development') {
      // Comment out console errors but keep them for reference
      // console.error('[AUTH_ERROR_BOUNDARY] Error caught in AuthErrorBoundary:', error);
      // console.error('[AUTH_ERROR_BOUNDARY] Component stack:', errorInfo.componentStack);
    }
  }

  render() {
    if (this.state.hasError) {
      // Render a fallback UI when authentication errors occur
      return (
        <div className="min-h-screen flex items-center justify-center bg-black text-white p-4">
          <div className="max-w-md w-full bg-zinc-900 border border-red-700 rounded-lg p-6 shadow-lg">
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold text-red-500">Authentication Error</h2>
              <p className="mt-2 text-zinc-300">
                We encountered an error with the authentication system.
              </p>
            </div>
            
            <div className="bg-black/30 p-4 rounded-md mb-6 overflow-auto max-h-32">
              <p className="text-red-400 text-sm font-mono">
                {this.state.error?.toString() || 'Unknown error'}
              </p>
            </div>

            <div className="flex justify-center gap-4">
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-zinc-800 text-white rounded hover:bg-zinc-700 transition-colors"
              >
                Retry
              </button>
              <button
                onClick={() => window.location.href = '/'}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                Return Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}