'use client';

import { useState } from 'react';
import { useAuth } from '../../auth/AuthHandler';
import { testLandlordAuth } from '../../lib/utils/auth-test';

export default function AuthDebugger() {
  const { user, profile, isAuthenticated, isAuthenticating } = useAuth();
  const [showDebug, setShowDebug] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [isRunningTest, setIsRunningTest] = useState(false);

  const runAuthTest = async () => {
    setIsRunningTest(true);
    try {
      const result = await testLandlordAuth();
      setTestResult(result);
    } catch (error) {
      setTestResult({
        success: false,
        message: `Error: ${error instanceof Error ? error.message : String(error)}`,
      });
    } finally {
      setIsRunningTest(false);
    }
  };

  if (isAuthenticating) {
    return <div>Loading authentication...</div>;
  }

  return (
    <div className="p-4 bg-gray-100 rounded-lg mb-4">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-medium">Authentication Status</h3>
        <button
          onClick={() => setShowDebug(!showDebug)}
          className="px-3 py-1 bg-blue-500 text-white rounded text-sm"
        >
          {showDebug ? 'Hide' : 'Show'} Debug Info
        </button>
      </div>
      
      <div className="mb-2">
        <span className="font-medium">Status:</span>{' '}
        {isAuthenticated ? (
          <span className="text-green-600">Authenticated</span>
        ) : (
          <span className="text-red-600">Not Authenticated</span>
        )}
      </div>
      
      {showDebug && (
        <>
          <div className="mb-4">
            <h4 className="font-medium mb-1">User:</h4>
            <pre className="bg-gray-200 p-2 rounded text-xs overflow-auto max-h-40">
              {JSON.stringify(user, null, 2)}
            </pre>
          </div>
          
          <div className="mb-4">
            <h4 className="font-medium mb-1">Profile:</h4>
            <pre className="bg-gray-200 p-2 rounded text-xs overflow-auto max-h-40">
              {JSON.stringify(profile, null, 2)}
            </pre>
          </div>
          
          <div className="flex gap-2 mb-4">
            <button
              onClick={runAuthTest}
              disabled={isRunningTest}
              className="px-3 py-1 bg-green-500 text-white rounded text-sm disabled:opacity-50"
            >
              {isRunningTest ? 'Running Test...' : 'Run Auth Test'}
            </button>
          </div>
          
          {testResult && (
            <div className="mb-4">
              <h4 className="font-medium mb-1">Test Result:</h4>
              <div className={`p-2 rounded ${testResult.success ? 'bg-green-100' : 'bg-red-100'}`}>
                <p className="font-medium">{testResult.message}</p>
              </div>
              <pre className="bg-gray-200 p-2 rounded text-xs overflow-auto max-h-40 mt-2">
                {JSON.stringify(testResult, null, 2)}
              </pre>
            </div>
          )}
        </>
      )}
    </div>
  );
}
