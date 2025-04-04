'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';

// Log the URL for debugging
console.log('Current URL:', typeof window !== 'undefined' ? window.location.href : 'SSR');

// Define the type for debugInfo
interface DebugInfo {
  session?: any;
  sessionError?: any;
  user?: any;
  user_metadata?: any;
  redirectUrl?: string;
  [key: string]: any;
}

const SuccessPage = () => {
  const [status, setStatus] = useState('Checking authentication...');
  const [error, setError] = useState(null);
  const [debugInfo, setDebugInfo] = useState<DebugInfo>({});
  const [showDebug, setShowDebug] = useState(false);

  useEffect(() => {
    const handleAuthCallback = async () => {
      // Initialize the client using the established pattern
      const supabase = createClient();
      
      try {
        console.log('URL hash:', window.location.hash);
        console.log('URL search:', window.location.search);
        
        // Check if we have auth params in the URL
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const queryParams = new URLSearchParams(window.location.search);
        const hasAuthParams = hashParams.has('access_token') || queryParams.has('code');
        
        if (hasAuthParams) {
          console.log('Auth params detected in URL');
          
          // For hash-based auth (implicit flow)
          if (hashParams.has('access_token')) {
            const accessToken = hashParams.get('access_token');
            const refreshToken = hashParams.get('refresh_token');
            
            console.log('Setting session from hash params');
            await supabase.auth.setSession({
              access_token: accessToken!,
              refresh_token: refreshToken || ''
            });
          }
          
          // For code-based auth (PKCE flow)
          if (queryParams.has('code')) {
            console.log('Exchanging code for session');
            await supabase.auth.exchangeCodeForSession(window.location.href);
          }
          
          // Remove the auth params from URL to avoid issues with refreshes
          window.history.replaceState({}, document.title, window.location.pathname);
        }
        
        // Now try to get the session
        console.log('Getting session...');
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        setDebugInfo(prev => ({
          ...prev,
          session,
          sessionError
        }));
        
        if (sessionError) {
          throw sessionError;
        }
        
        if (!session) {
          throw new Error('No session found');
        }
        
        // Get user data
        console.log('Getting user data...');
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError) {
          throw userError;
        }
        
        if (!user) {
          throw new Error('No user found');
        }
        
        setDebugInfo(prev => ({
          ...prev,
          user,
          user_metadata: user.user_metadata
        }));
        
        const { user_metadata } = user;
        console.log('User metadata:', user_metadata);
        
        const { full_name, user_role } = user_metadata || {};
        
        if (!user_role) {
          throw new Error('User role not found in metadata');
        }

        // In the handleAuthCallback function, make landlord redirection explicit:
        if (user_role === 'landlord') {
          console.log('Detected landlord role, preparing landlord redirection');
        }

        setStatus(`Authentication successful. User role: ${user_role}`);
        
        // Add a button for redirect
        setDebugInfo(prev => ({
          ...prev,
          redirectUrl: user_role === 'landlord' 
            ? '/landlord-dashboard' 
            : user_role === 'tenant' 
              ? '/tenant-dashboard'
              : user_role === 'admin'
                ? '/admin-dashboard'
                : '/',
          session // Store the entire session object
        }));
      } catch (error: any) {
        console.error('Authentication error:', error);
        setError(error.message);
        setStatus(`Authentication error: ${error.message}`);
      }
    };
    
    handleAuthCallback();
  }, []);
  
  // In the handleRedirect function
  const handleRedirect = () => {
    const { redirectUrl, user_metadata } = debugInfo;
    if (redirectUrl) {
      console.log(`Redirecting to ${redirectUrl} with role: ${user_metadata?.user_role || 'unknown'}`);
      // For landlords, ensure the URL preserves the role
      if (user_metadata?.user_role === 'landlord') {
        window.location.href = `${redirectUrl}?role=landlord`;
      } else {
        window.location.href = redirectUrl;
      }
    } else {
      window.location.href = '/';
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="text-lg font-medium mb-4">
        {status}
      </div>
      
      {error ? (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <strong>Error:</strong> {error}
        </div>
      ) : (
        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
      )}
      
      <button 
        onClick={() => setShowDebug(!showDebug)}
        className="bg-gray-200 px-4 py-2 rounded mb-4"
      >
        {showDebug ? 'Hide' : 'Show'} Debug Info
      </button>
      
      {showDebug && (
        <pre className="bg-gray-100 p-4 rounded overflow-auto max-w-full max-h-96">
          {JSON.stringify(debugInfo, null, 2)}
        </pre>
      )}
      
      {debugInfo.redirectUrl && (
        <button
          onClick={handleRedirect}
          className="bg-blue-500 text-white px-4 py-2 rounded mt-4"
        >
          Continue to Dashboard
        </button>
      )}
    </div>
  );
};

export default SuccessPage;