'use client';

import React from 'react';
import { useAuth } from '../../auth/AuthHandler';

// Import the ErrorBoundary component as a named import
import { ErrorBoundary as ReactErrorBoundary } from './ErrorBoundary';

export default function AuthErrorBoundary({ children }: { children: React.ReactNode }) {
  const { signOut } = useAuth();
  
  return (
    <ReactErrorBoundary
      fallback={({ error, resetError }) => (
        <div className="flex flex-col items-center justify-center min-h-[50vh] p-4">
          <div className="text-center max-w-md w-full bg-red-50 p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-bold mb-4 text-red-700">Tenant Authentication Error</h3>
            <p className="mb-6 text-red-600">{error.message}</p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => {
                  signOut();
                  resetError();
                }}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Sign Out
              </button>
              <button
                onClick={resetError}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      )}
    >
      {children}
    </ReactErrorBoundary>
  );
}