'use client';

import { useEffect, useState, createContext, useContext, useCallback } from 'react';
import { supabase, getUserProfile, createUserProfile, checkAuthStatus } from '../lib/utils/supabase/client';
import { User } from '@supabase/supabase-js';
import { UserProfile } from '@/utils/types/user';
import * as Sentry from '@sentry/nextjs';
import { logDebug, logError, categorizeAuthError, AuthErrorType } from '@/utils/auth/errorHandling';
import { SessionManager } from '@/utils/auth/sessionManager';
import AuthLoadingScreen from '@/components/auth/AuthLoadingScreen';
import { useRouter } from 'next/navigation';

// Check if we're in a browser environment
const isBrowser = typeof window !== 'undefined';

// Constants for authentication
const AUTH_RETRY_DELAY = 1500; // ms
const AUTH_MAX_RETRIES = 3;
const AUTH_ROLE = 'landlord';
const PREFIX = 'AUTH_HANDLER';

// Create auth context to share authentication state
export const AuthContext = createContext<{
  isAuthenticating: boolean;
  isAuthenticated: boolean;
  user: User | null;
  profile: UserProfile | null;
  authError: string | null;
  hasCorrectRole: boolean;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
}>({
  isAuthenticating: true,
  isAuthenticated: false,
  user: null,
  profile: null,
  authError: null,
  hasCorrectRole: false,
  signOut: async () => {/* Default empty implementation */},
  refreshSession: async () => {/* Default empty implementation */}
});

export const useAuth = () => useContext(AuthContext);

export default function AuthHandler({ children }: { children: React.ReactNode }) {
  const [isAuthenticating, setIsAuthenticating] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [hasCorrectRole, setHasCorrectRole] = useState(false);
  const [sessionManager, setSessionManager] = useState<SessionManager | null>(null);
  const router = useRouter();

  // Handle session expiration
  const handleSessionExpired = useCallback(() => {
    logDebug(PREFIX, 'Session expired, redirecting to login');
    router.push('/auth/login?reason=expired');
  }, [router]);

  // Initialize session manager
  useEffect(() => {
    if (isBrowser) {
      const manager = new SessionManager(supabase, handleSessionExpired);
      setSessionManager(manager);
      
      manager.initialize().then(initialized => {
        logDebug(PREFIX, `Session manager initialized: ${initialized}`);
      });
      
      // Set up auth listener
      const cleanupListener = manager.setupAuthListener();
      
      return () => {
        manager.cleanup();
        cleanupListener();
      };
    }
  }, [handleSessionExpired]);

  // Function to refresh session manually
  const refreshSession = useCallback(async () => {
    try {
      logDebug(PREFIX, 'Manually refreshing session');
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error) {
        throw error;
      }
      
      if (data?.session) {
        logDebug(PREFIX, 'Session refreshed successfully');
        return; // Just return without a value to match Promise<void>
      }
      
      // No need to return anything for Promise<void>
    } catch (error) {
      logError(PREFIX, 'Failed to refresh session manually', error);
      // No return value needed
    }
  }, []);

  // Memoized function to sign out the user
  const signOut = useCallback(async () => {
    try {
      logDebug(PREFIX, 'Signing out user');
      
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
      logError(PREFIX, 'Error signing out', error);
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
    return {
      id: user.id, 
      full_name: user.user_metadata?.full_name || 'User',
      email_address: user.email || '',
      user_role: user.user_metadata?.user_role || AUTH_ROLE,
      created_at: new Date().toISOString()
    } as UserProfile;
  };

  // Memoize the fetchUserProfile function
  const fetchUserProfile = useCallback(async (user: User) => {
    logDebug(PREFIX, 'Fetching profile for user:', user.id);
    
    try {
      // Check if we have a cached profile first
      const cachedProfile = getProfileFromCache(user.id);
      if (cachedProfile) {
        logDebug(PREFIX, 'Using cached profile');
        return cachedProfile;
      }
      
      // Check if we're offline
      const isOnline = await checkNetworkConnectivity();
      if (!isOnline) {
        logDebug(PREFIX, 'Offline mode detected, using fallback profile');
        return createFallbackProfile(user);
      }
      
      // Try to get existing profile
      const profile = await getUserProfile(user.id);
      
      if (!profile) {
        logDebug(PREFIX, 'No profile found, creating new profile');
        
        try {
          // Create a profile that matches your database schema
          const profileData = {
            id: user.id,
            email: user.email,
            full_name: user.user_metadata?.full_name || '',
            user_role: user.user_metadata?.user_role || AUTH_ROLE,
            phone_number: user.user_metadata?.phone_number
          };
          
          const newProfile = await createUserProfile(profileData);
          
          if (newProfile) {
            // Cache the new profile
            saveProfileToCache(user.id, newProfile);
            return newProfile;
          }
          return createFallbackProfile(user);
        } catch (createError) {
          logError(PREFIX, 'Failed to create profile:', createError);
          return createFallbackProfile(user);
        }
      }
      
      // Cache the profile for future use
      saveProfileToCache(user.id, profile);
      return profile;
    } catch (error) {
      logError(PREFIX, 'Profile fetch failed:', error);
      return createFallbackProfile(user);
    }
  }, []); // Empty dependency array since it doesn't rely on component state

  // Fetch user profile when user is available
  useEffect(() => {
    let isMounted = true;
    let retryCount = 0;

    const fetchUserProfileEffect = async () => {
      if (!user) {
        setProfile(null);
        setHasCorrectRole(false);
        return;
      }

      try {
        const userProfile = await fetchUserProfile(user);
        
        if (isMounted) {
          if (userProfile) {
            setProfile(userProfile);
            
            // Check if user has the correct role
            const correctRole = userProfile.user_role === AUTH_ROLE;
            setHasCorrectRole(correctRole);
            
            // If role is incorrect, try to update it if it's in metadata but not in profile
            if (!correctRole && user.user_metadata?.user_role === AUTH_ROLE) {
              try {
                const updatedProfile = await createUserProfile({
                  id: user.id,
                  email: user.email,
                  full_name: user.user_metadata?.full_name || '',
                  user_role: AUTH_ROLE,
                  phone_number: user.user_metadata?.phone_number
                });
                
                if (updatedProfile && isMounted) {
                  setProfile(updatedProfile);
                  setHasCorrectRole(updatedProfile.user_role === AUTH_ROLE);
                  saveProfileToCache(user.id, updatedProfile);
                }
              } catch (updateError) {
                logError(PREFIX, 'Failed to update profile role:', updateError);
              }
            }
          } else if (retryCount < AUTH_MAX_RETRIES) {
            // Only retry a limited number of times with exponential backoff
            retryCount++;
            const backoffDelay = AUTH_RETRY_DELAY * Math.pow(1.5, retryCount - 1);
            
            logDebug(PREFIX, `Retry ${retryCount}/${AUTH_MAX_RETRIES} in ${backoffDelay}ms`);
            
            setTimeout(fetchUserProfileEffect, backoffDelay);
          } else {
            // If we still can't get the profile, create a fallback in-memory profile
            const fallbackProfile = createFallbackProfile(user);
            setProfile(fallbackProfile);
            setHasCorrectRole(fallbackProfile.user_role === AUTH_ROLE);
            
            // Try to create the profile in the background without logging errors
            createUserProfile({
              id: user.id,
              email: user.email,
              full_name: user.user_metadata?.full_name || '',
              user_role: user.user_metadata?.user_role || AUTH_ROLE,
              phone_number: user.user_metadata?.phone_number
            }).catch(() => {/* Silently fail */});
          }
        }
      } catch (error) {
        logError(PREFIX, 'Error in profile effect:', error);
        
        if (isMounted && retryCount < AUTH_MAX_RETRIES) {
          retryCount++;
          const backoffDelay = AUTH_RETRY_DELAY * Math.pow(1.5, retryCount - 1);
          setTimeout(fetchUserProfileEffect, backoffDelay);
        } else if (isMounted) {
          // Last resort fallback
          const lastResortProfile = createFallbackProfile(user);
          setProfile(lastResortProfile);
          setHasCorrectRole(lastResortProfile.user_role === AUTH_ROLE);
        }
      }
    };
    
    if (user) {
      fetchUserProfileEffect();
    } else {
      setProfile(null);
      setHasCorrectRole(false);
    }
    
    return () => {
      isMounted = false;
    };
  }, [user, fetchUserProfile]);

  // Check if we have a stored session in localStorage to prevent flashing unauthenticated UI
  useEffect(() => {
    // Try to get auth status from localStorage immediately to prevent flashing
    if (isBrowser) {
      try {
        // Check if we have a cached auth status to use immediately
        const cachedAuthStatus = sessionStorage.getItem('auth_status');
        const cacheTime = sessionStorage.getItem('auth_status_time');
        
        if (cachedAuthStatus && cacheTime) {
          // Use cache if it's less than 5 minutes old
          if ((Date.now() - parseInt(cacheTime)) < 5 * 60 * 1000) {
            const authData = JSON.parse(cachedAuthStatus);
            if (authData.authenticated && authData.user) {
              logDebug(PREFIX, 'Using cached auth status');
              // Set initial state from cache to prevent flashing
              setUser(authData.user);
              setIsAuthenticated(true);
              // Don't set isAuthenticating to false yet - wait for the real check
            }
          }
        }
      } catch (_e) {
        logError(PREFIX, 'Cache read error (non-critical)', _e);
        // Ignore cache errors, will fall back to normal auth flow
      }
    }
  }, []);

  useEffect(() => {
    const handleAuth = async () => {
      try {
        logDebug(PREFIX, 'Checking authentication status...');
        
        // Use getSession() since it's the correct method in Supabase v2+ for checking current session
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          throw sessionError;
        }
        
        // Also get user data which is compatible with Supabase v2+
        const { data: userData, error: userError } = await supabase.auth.getUser();
        
        if (userError) {
          throw userError;
        }
        
        if (sessionData.session && userData.user) {
          setUser(userData.user);
          setIsAuthenticated(true);
          
          // Cache the auth status
          if (isBrowser) {
            sessionStorage.setItem('auth_status', JSON.stringify({ 
              authenticated: true, 
              user: userData.user
            }));
            sessionStorage.setItem('auth_status_time', Date.now().toString());
          }
          
          // SECURITY IMPROVEMENT: No role parameter handling from client-side code
          // Roles are now managed through secure server-side operations via middleware
          // The middleware handles role verification with the database as the source of truth
          logDebug(PREFIX, 'User authenticated:', userData.user.id);
        } else {
          logDebug(PREFIX, 'User not authenticated');
          setUser(null);
          setIsAuthenticated(false);
          setProfile(null);
          setHasCorrectRole(false);
        }
      } catch (error) {
        logError(PREFIX, 'Auth error:', error);
        
        // Enhanced error handling
        const errorType = categorizeAuthError(error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        
        // Set more user-friendly error messages based on error type
        if (errorType === AuthErrorType.SESSION_MISSING) {
          setAuthError('Authentication required: Please sign in to access this page.');
        } else if (errorType === AuthErrorType.SESSION_EXPIRED) {
          setAuthError('Your session has expired. Please sign in again.');
        } else {
          setAuthError(errorMessage);
        }
        
        // Track authentication failures with user context
        Sentry.setContext('auth', {
          isAuthenticated: false,
          hasError: true,
          errorType: errorType,
          timestamp: new Date().toISOString(),
        });
        
        // Handle specific error types with appropriate actions
        if (errorType === AuthErrorType.SESSION_EXPIRED) {
          // Attempt to refresh the session using try-catch
          try {
            logDebug(PREFIX, 'Attempting to refresh expired session');
            await refreshSession();
            // If we get here, refresh was successful
            logDebug(PREFIX, 'Session refreshed successfully after expiration');
          } catch (refreshError) {
            // If refresh fails or throws an error, we'll show the error UI instead of redirecting
            logError(PREFIX, 'Failed to refresh expired session', refreshError);
          }
        } else if (errorType === AuthErrorType.SESSION_MISSING) {
          // Just show the error UI, which has login buttons
          logDebug(PREFIX, 'No session found, showing authentication required screen');
        }
      } finally {
        // Ensure we always exit the authenticating state
        setTimeout(() => {
          setIsAuthenticating(false);
        }, 300); // Small delay to ensure smooth transition
      }
    };

    handleAuth();

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event: string, session: any) => {
        logDebug(PREFIX, `Auth state changed: ${event}`);
        
        if (session) {
          setUser(session.user);
          setIsAuthenticated(true);
          
          // Clear any cached auth status since it changed
          if (isBrowser) {
            sessionStorage.removeItem('auth_status');
            sessionStorage.removeItem('auth_status_time');
          }
        } else {
          setUser(null);
          setProfile(null);
          setIsAuthenticated(false);
          setHasCorrectRole(false);
          
          // Clear any cached auth data
          if (isBrowser) {
            sessionStorage.removeItem('auth_status');
            sessionStorage.removeItem('auth_status_time');
          }
        }
      }
    );

    // Clean up subscription
    return () => {
      subscription.unsubscribe();
    };
  }, [refreshSession, router]);

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
                className="w-full py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-md transition-colors"
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

  // Show unified loading UI during authentication
  if (isAuthenticating) {
    return <AuthLoadingScreen userType="landlord" />;
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
      signOut,
      refreshSession
    }}>
      {children}
    </AuthContext.Provider>
  );
}