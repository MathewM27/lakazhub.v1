'use client';

import { useEffect, useState, createContext, useContext, useCallback } from 'react';
import { supabase, getUserProfile, createUserProfile, checkAuthStatus } from '../utils/supabase/client';
import { User } from '@supabase/supabase-js';
import { UserProfile } from '@/utils/types/user';
import * as Sentry from '@sentry/nextjs';

// Check if we're in a browser environment
const isBrowser = typeof window !== 'undefined';

// Constants for authentication
const AUTH_RETRY_DELAY = 1500; // ms
const AUTH_MAX_RETRIES = 3;
const AUTH_ROLE = 'tenant';

// Safe logging functions that only log in development
const logDebug = (message: string, data?: unknown) => {
  if (process.env.NODE_ENV === 'development') {
    if (data !== undefined) {
      console.log(`[AUTH_HANDLER] ${message}`, data);
    } else {
      console.log(`[AUTH_HANDLER] ${message}`);
    }
  }
};

const logError = (message: string, error?: any) => {
  if (process.env.NODE_ENV === 'development') {
    if (error !== undefined) {
      console.error(`[AUTH_HANDLER] ${message}`, error);
    } else {
      console.error(`[AUTH_HANDLER] ${message}`);
    }
  }
  
  // Report errors to Sentry in all environments
  if (error) {
    Sentry.captureException(error, {
      tags: {
        component: 'AuthHandler',
      },
      extra: {
        message,
      },
    });
  } else {
    Sentry.captureMessage(`[AUTH_HANDLER] ${message}`, {
      level: 'error',
      tags: {
        component: 'AuthHandler',
      },
    });
  }
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
      
      // Clear user data from Sentry when signing out
      Sentry.setUser(null);
      Sentry.setContext('auth', null);
      
      await supabase.auth.signOut();
      // Clear any cached auth data
      if (isBrowser) {
        sessionStorage.removeItem('auth_status');
        sessionStorage.removeItem('auth_status_time');
        localStorage.removeItem('profile_cache');
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('[AUTH_HANDLER] Error signing out:', error);
      }
    }
  }, []);

  // Function to detect if we're offline
  const checkNetworkConnectivity = async (): Promise<boolean> => {
    if (!isBrowser) return true; // Assume online in SSR context
    
    try {
      // Try to use navigator.onLine first as it's more efficient
      if (typeof navigator !== 'undefined' && navigator.onLine === false) {
        return false;
      }
      
      // Double-check with a lightweight request
      await fetch('https://www.google.com/favicon.ico', { 
        mode: 'no-cors',
        cache: 'no-store',
        method: 'HEAD',
        signal: AbortSignal.timeout(2000) // 2 second timeout
      });
      return true;
    } catch (_e) {
      logDebug('Offline detected via fetch failure');
      return false;
    }
  };

  // Get profile from cache if available
  const getProfileFromCache = (userId: string): UserProfile | null => {
    if (!isBrowser) return null;
    
    try {
      const cachedProfile = localStorage.getItem(`profile_${userId}`);
      const cacheTime = localStorage.getItem(`profile_time_${userId}`);
      
      if (cachedProfile && cacheTime) {
        // Use cache if it's less than 5 minutes old
        if ((Date.now() - parseInt(cacheTime)) < 5 * 60 * 1000) {
          return JSON.parse(cachedProfile);
        }
      }
    } catch (_e) {
      // Invalid cache, continue with API call
    }
    
    return null;
  };

  // Save profile to cache
  const saveProfileToCache = (userId: string, profile: UserProfile) => {
    if (!isBrowser || !profile) return;
    
    try {
      localStorage.setItem(`profile_${userId}`, JSON.stringify(profile));
      localStorage.setItem(`profile_time_${userId}`, Date.now().toString());
    } catch (_e) {
      // Failed to cache, not critical
    }
  };

  // Create fallback profile with consistent structure
  const createFallbackProfile = (user: User): UserProfile => {
    logDebug('Creating fallback profile');
    return {
      id: user.id, 
      full_name: user.user_metadata?.full_name || 'Tenant',
      email_address: user.email || '',
      user_role: user.user_metadata?.user_role || AUTH_ROLE,
      created_at: new Date().toISOString()
    } as UserProfile;
  };

  // Fetch user profile when user is available
  useEffect(() => {
    let isMounted = true;
    let retryCount = 0;
    const maxRetries = 3; // Increased max retries
    const retryDelay = 1500;

    const fetchUserProfileEffect = async () => {
      if (!user) {
        console.log('[AUTH_HANDLER] No user available, setting profile to null');
        setProfile(null);
        return;
      }

      console.log('[AUTH_HANDLER] User authenticated, fetching profile...', user.id);
      console.log('[AUTH_HANDLER] User metadata when fetching profile:', JSON.stringify(user.user_metadata));

      try {
        console.log('[AUTH_HANDLER] Calling fetchUserProfile function');
        const userProfile = await getUserProfile(user.id);
        
        if (isMounted) {
          if (userProfile) {
            console.log('[AUTH_HANDLER] Profile fetched successfully:', userProfile);
            console.log('[AUTH_HANDLER] Profile user_role:', userProfile.user_role);
            setProfile(userProfile);
            
            // Explicitly check if user has the tenant role
            const correctRole = userProfile.user_role === AUTH_ROLE;
            setHasCorrectRole(correctRole);
          } else if (retryCount < maxRetries) {
            // Only retry a limited number of times
            retryCount++;
            console.log(`[AUTH_HANDLER] Retry ${retryCount}/${maxRetries} in ${retryDelay}ms`);
            
            setTimeout(fetchUserProfileEffect, retryDelay);
          } else {
            // If we still can't get the profile, create a fallback in-memory profile
            console.log('[AUTH_HANDLER] Max retries reached, using fallback profile');
            const fallbackProfile = {
              id: user.id, 
              full_name: user.user_metadata?.full_name || 'User',
              email_address: user.email || '',
              user_role: user.user_metadata?.user_role || 'tenant',
              created_at: new Date().toISOString()
            } as UserProfile;
            
            console.log('[AUTH_HANDLER] Using fallback profile:', fallbackProfile);
            console.log('[AUTH_HANDLER] Fallback profile user_role:', fallbackProfile.user_role);
            setProfile(fallbackProfile);
            
            // Try to create the profile in the background
            console.log('[AUTH_HANDLER] Attempting background profile creation');
            createUserProfile({
              id: user.id,
              email: user.email,
              full_name: user.user_metadata?.full_name || '',
              user_role: user.user_metadata?.user_role || 'tenant',
              phone_number: user.user_metadata?.phone_number
            }).catch(err => console.error('[AUTH_HANDLER] Background profile creation failed:', err));
          }
        }
      } catch (error) {
        console.error('[AUTH_HANDLER] Error in profile effect:', error);
        
        // Set fallback profile after error
        if (isMounted) {
          const fallbackProfile = {
            id: user.id, 
            full_name: user.user_metadata?.full_name || 'User',
            email_address: user.email || '',
            user_role: user.user_metadata?.user_role || 'tenant',
            created_at: new Date().toISOString()
          } as UserProfile;
          
          console.log('[AUTH_HANDLER] Error occurred, using fallback profile:', fallbackProfile);
          console.log('[AUTH_HANDLER] Error fallback profile user_role:', fallbackProfile.user_role);
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
        console.log('[AUTH_HANDLER] Initializing authentication...');
        console.log('[AUTH_HANDLER] Current URL:', window.location.href);
        
        // For the combined app, we need to check for auth in multiple places
        
        // 1. First check for an existing session (most reliable)
        console.log('[AUTH_HANDLER] Checking for existing session');
        const { data: sessionData } = await supabase.auth.getSession();
        
        if (sessionData.session?.user) {
          console.log('[AUTH_HANDLER] Found existing session. User ID:', sessionData.session.user.id);
          console.log('[AUTH_HANDLER] User metadata:', JSON.stringify(sessionData.session.user.user_metadata));
          console.log('[AUTH_HANDLER] User role:', sessionData.session.user.user_metadata?.user_role);
          
          setUser(sessionData.session.user);
          setIsAuthenticated(true);
          setIsAuthenticating(false);
          return; // Exit early if we found a session
        }
        
        // 2. Check for tokens in URL parameters (for redirect-based auth)
        const url = new URL(window.location.href);
        const accessToken = url.searchParams.get('access_token');
        const refreshToken = url.searchParams.get('refresh_token');
        const code = url.searchParams.get('code');
        
        console.log('[AUTH_HANDLER] Tokens in URL:', { 
          accessTokenExists: !!accessToken, 
          refreshTokenExists: !!refreshToken,
          codeExists: !!code
        });

        // 3. If we have tokens, use them to set the session
        if (accessToken && refreshToken) {
          console.log('[AUTH_HANDLER] Found auth tokens in URL, setting session...');
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (error) {
            console.error('[AUTH_HANDLER] Error setting session:', error);
            throw error;
          }
          
          // Clean URL by removing the tokens
          window.history.replaceState({}, document.title, window.location.pathname);
          console.log('[AUTH_HANDLER] Cleaned URL of tokens');
          
          console.log('[AUTH_HANDLER] Session set successfully. User ID:', data.user?.id);
          console.log('[AUTH_HANDLER] User metadata:', JSON.stringify(data.user?.user_metadata));
          console.log('[AUTH_HANDLER] User role:', data.user?.user_metadata?.user_role);
          
          setUser(data.user);
          setIsAuthenticated(!!data.user);
          setIsAuthenticating(false);
          return; // Exit early if we set the session
        }
        
        // 4. If we don't have a session or tokens, we're not authenticated
        console.log('[AUTH_HANDLER] No session or tokens found, user is not authenticated');
        setUser(null);
        setIsAuthenticated(false);
        setProfile(null);
      } catch (error) {
        console.error('[AUTH_HANDLER] Auth error:', error);
        setAuthError(error instanceof Error ? error.message : 'An unknown error occurred');
        setIsAuthenticated(false);
        setUser(null);
      } finally {
        // Ensure we always exit the authenticating state
        console.log('[AUTH_HANDLER] Exiting authenticating state');
        setIsAuthenticating(false);
        setInitialLoading(false);
      }
    };

    // Run the auth handler
    handleAuth();
    
    // Set up auth state change listener
    console.log('[AUTH_HANDLER] Setting up auth state change listener');
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event: string, session: any) => {
        console.log(`[AUTH_HANDLER] Auth state changed: ${event}`);
        console.log('[AUTH_HANDLER] Session in state change:', !!session);
        console.log('[AUTH_HANDLER] User ID in state change:', session?.user?.id);
        
        if (session?.user) {
          console.log('[AUTH_HANDLER] User metadata in state change:', 
            JSON.stringify(session.user.user_metadata));
          console.log('[AUTH_HANDLER] User role in state change:', 
            session.user.user_metadata?.user_role);
        }
        
        // Handle different auth events
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION') {
          console.log('[AUTH_HANDLER] Positive auth event detected:', event);
          setUser(session?.user || null);
          setIsAuthenticated(!!session?.user);
          
          // If we have a user but no profile, trigger profile fetch
          if (session?.user && !profile) {
            // This will trigger the profile fetch in the profile effect
          }
        } else if (event === 'SIGNED_OUT') {
          console.log('[AUTH_HANDLER] User signed out');
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
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded max-w-md">
          <strong>Authentication Error:</strong> {authError}
          <div className="mt-4">
            <button 
              onClick={() => window.location.href = '/'}
              className="bg-blue-500 text-white px-4 py-2 rounded"
            >
              Return to Home
            </button>
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