'use client';

import { useEffect, useState, createContext, useContext, useCallback } from 'react';
import { supabase, getUserProfile, createUserProfile } from '../utils/supabase/client';
import { User } from '@supabase/supabase-js';
import { UserProfile } from '@/utils/types/user';

import { useRouter } from 'next/navigation';
import { categorizeAuthError, AuthErrorType } from '../utils/errorHandling';

// Check if we're in a browser environment
const isBrowser = typeof window !== 'undefined';

// Constants for authentication
const AUTH_ROLE = 'tenant';

// Safe logging functions that only log in development
const logDebug = (p0: string) => {
  // No-op
};

// Create auth context to share authentication state
export const AuthContext = createContext<{
  isAuthenticating: boolean;
  isAuthenticated: boolean;
  user: User | null;
  profile: UserProfile | null;
  authError: string | null;
  hasCorrectRole: boolean;
  signOut: () => Promise<void>;
}>({
  isAuthenticating: true,
  isAuthenticated: false,
  user: null,
  profile: null,
  authError: null,
  hasCorrectRole: false,
  signOut: async () => {/* Default empty implementation */}
});

export const useAuth = () => useContext(AuthContext);

export default function AuthHandler({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isAuthenticating, setIsAuthenticating] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true); // Added initial loading state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [hasCorrectRole, setHasCorrectRole] = useState(false);

  // Memoized function to sign out the user
  const signOut = useCallback(async () => {
    try {
      logDebug('Signing out user');
      await supabase.auth.signOut();
      // Clear any cached auth data and Supabase cookies
      if (isBrowser) {
        sessionStorage.clear();
        localStorage.clear();
        // Remove Supabase cookies (client-side, best effort)
        if (typeof document !== "undefined") {
          document.cookie.split(";").forEach(cookie => {
            const eqPos = cookie.indexOf("=");
            const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
            document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
          });
        }
      }
    } catch {
      // Ignore sign out errors
    }
  }, []);

  // Fetch user profile when user is available
  useEffect(() => {
    let isMounted = true;
    let retryCount = 0;
    const maxRetries = 3; // Increased max retries
    const retryDelay = 1500;

    const fetchUserProfileEffect = async () => {
      if (!user) {
        setProfile(null);
        return;
      }

      try {
        const userProfile = await getUserProfile(user.id);
        
        if (isMounted) {
          if (userProfile) {
            setProfile(userProfile);
            const correctRole = userProfile.user_role === AUTH_ROLE;
            setHasCorrectRole(correctRole);
          } else if (retryCount < maxRetries) {
            retryCount++;
            setTimeout(fetchUserProfileEffect, retryDelay);
          } else {
            const fallbackProfile = {
              id: user.id, 
              full_name: user.user_metadata?.full_name || 'User',
              email_address: user.email || '',
              user_role: user.user_metadata?.user_role || 'tenant',
              created_at: new Date().toISOString()
            } as UserProfile;
            setProfile(fallbackProfile);
            createUserProfile({
              id: user.id,
              email: user.email,
              full_name: user.user_metadata?.full_name || '',
              user_role: user.user_metadata?.user_role || 'tenant',
              phone_number: user.user_metadata?.phone_number
            }).catch(() => {});
          }
        }
      } catch {
        if (isMounted) {
          const fallbackProfile = {
            id: user.id, 
            full_name: user.user_metadata?.full_name || 'User',
            email_address: user.email || '',
            user_role: user.user_metadata?.user_role || 'tenant',
            created_at: new Date().toISOString()
          } as UserProfile;
          setProfile(fallbackProfile);
        }
      }
    };

    fetchUserProfileEffect();

    return () => {
      isMounted = false;
    };
  }, [user]);

  useEffect(() => {
    const handleAuth = async () => {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        
        if (sessionData.session?.user) {
          setUser(sessionData.session.user);
          setIsAuthenticated(true);
          setIsAuthenticating(false);
          return;
        }
        
        const url = new URL(window.location.href);
        const accessToken = url.searchParams.get('access_token');
        const refreshToken = url.searchParams.get('refresh_token');
        
        if (accessToken && refreshToken) {
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (error) {
            throw error;
          }
          
          window.history.replaceState({}, document.title, window.location.pathname);
          setUser(data.user);
          setIsAuthenticated(!!data.user);
          setIsAuthenticating(false);
          return;
        }
        
        setUser(null);
        setIsAuthenticated(false);
        setProfile(null);
      } catch (err) {
        // Enhanced error handling with categorization
        const errorType = categorizeAuthError(err);
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
        
        if (errorType === AuthErrorType.SESSION_MISSING) {
          setAuthError('Authentication required: Please sign in to access this page.');
        } else if (errorType === AuthErrorType.SESSION_EXPIRED) {
          setAuthError('Your session has expired. Please sign in again.');
        } else {
          setAuthError(errorMessage);
        }
        
        setIsAuthenticated(false);
        setUser(null);
      } finally {
        setIsAuthenticating(false);
        setInitialLoading(false);
      }
    };

    handleAuth();

    // Set up auth state change listener (Supabase v2+)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event: string, session: { user?: User | null } | null) => {
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION') {
          setUser(session?.user || null);
          setIsAuthenticated(!!session?.user);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setProfile(null);
          setIsAuthenticated(false);
          setHasCorrectRole(false);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Loading UI Component to show while authentication is in progress
  const LoadingUI = (
    <div className="flex flex-col h-screen bg-black text-white">
      <div className="w-full py-6 px-8 border-b border-zinc-800">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center">
            <h1 className="text-2xl font-bold text-blue-500">LakazHub</h1>
            <span className="ml-2 text-sm bg-blue-500 text-black px-2 py-0.5 rounded">Tenant</span>
          </div>
        </div>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <h2 className="text-3xl font-bold mb-6">Welcome to LakazHub</h2>
          <p className="text-lg mb-8">Preparing your tenant experience</p>
          
          <div className="relative w-full h-2 bg-zinc-800 rounded-full overflow-hidden mb-8">
            <div className="absolute top-0 left-0 h-full bg-blue-500 animate-pulse rounded-full" style={{width: '100%'}}></div>
          </div>
          
          <div className="animate-spin mx-auto rounded-full h-12 w-12 border-2 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-zinc-400">Preparing your tenant experience</p>
        </div>
      </div>
    </div>
  );

  // Only show error screen for critical auth errors
  if (authError) {
    // Special handling for session missing error
    const isSessionMissing = authError.includes('Auth session missing') || 
                            authError.includes('AuthSessionMissingError') ||
                            authError.includes('Authentication required');
    
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="max-w-md w-full p-6 bg-white shadow-lg rounded-lg border border-gray-200">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="p-3 rounded-full bg-red-100">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-600" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            
            <h2 className="text-xl font-semibold text-gray-900">
              {isSessionMissing ? 'Authentication Required' : 'Authentication Error'}
            </h2>
            
            <p className="text-gray-600">
              {isSessionMissing 
                ? 'Your session has expired or you need to sign in to access this page.' 
                : authError}
            </p>
            
            <div className="flex flex-col space-y-2 w-full mt-2">
              <button 
                onClick={() => router.push('/auth/login?returnUrl=' + encodeURIComponent(window.location.pathname))}
                className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors"
              >
                Sign In
              </button>
              
              <button 
                onClick={() => window.location.href = '/'}
                className="w-full py-2 px-4 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium rounded-md transition-colors"
              >
                Return to Home
              </button>
              
              {!isSessionMissing && (
                <button 
                  onClick={() => window.location.reload()}
                  className="w-full py-2 px-4 border border-gray-300 hover:bg-gray-100 text-gray-700 font-medium rounded-md transition-colors"
                >
                  Retry
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show loading UI during initial authentication
  if (initialLoading || isAuthenticating) {
    return LoadingUI;
  }

  // Provide auth context to children
  return (
    <AuthContext.Provider value={{ 
      isAuthenticating, 
      isAuthenticated, 
      user, 
      profile, 
      authError, 
      hasCorrectRole,
      signOut
    }}>
      {children}
    </AuthContext.Provider>
  );
}

// Add this function and export it
export function getSafeAppUrl(path: string = '') {
  // For client-side navigation with relative URLs, just return the path
  if (typeof window !== 'undefined' && path && !path.startsWith('http')) {
    return path.startsWith('/') ? path : `/${path}`;
  }
  
  // For redirects that need absolute URLs - always use production in prod mode
  const baseUrl = 'https://lakazhub.com';
  return `${baseUrl}${path ? (path.startsWith('/') ? path : `/${path}`) : ''}`;
}