'use client';

import { useEffect, useState, createContext, useContext, useCallback } from 'react';
import { supabase, getUserProfile, createUserProfile } from '../utils/supabase/client';
import { User } from '@supabase/supabase-js';
import { UserProfile } from '@/utils/types/user';
import * as Sentry from '@sentry/nextjs';
import { setupSessionRefresh } from '../utils/session-refresh';
import { logDebug, logError } from '../utils/logging'; // Import logging functions

// Check if we're in a browser environment
const isBrowser = typeof window !== 'undefined';

// Constants for authentication
const AUTH_RETRY_DELAY = 1500; // ms
const AUTH_MAX_RETRIES = 3;
const AUTH_ROLE = 'tenant'; // Explicitly define the expected role
const AUTH_CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const PROFILE_CACHE_PREFIX = 'tenant_profile_';

// Create auth context to share authentication state
export const AuthContext = createContext<{
  isAuthenticating: boolean;
  isAuthenticated: boolean;
  user: User | null;
  profile: UserProfile | null;
  authError: string | null;
  hasCorrectRole: boolean; // Add this
  signOut: () => Promise<void>;
}>({
  isAuthenticating: true,
  isAuthenticated: false,
  user: null,
  profile: null,
  authError: null,
  hasCorrectRole: false, // Add this
  signOut: async () => {/* Default empty implementation */}
});

export const useAuth = () => useContext(AuthContext);

export default function AuthHandler({ children }: { children: React.ReactNode }) {
  const [isAuthenticating, setIsAuthenticating] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [hasCorrectRole, setHasCorrectRole] = useState(false);

  async function fetchUserProfile(user: User) {
    logDebug('Fetching profile for user:', user.id);
    
    try {
      // Check if we have a cached profile first
      const cachedProfile = getProfileFromCache(user.id);
      if (cachedProfile) {
        logDebug('Using cached profile');
        return cachedProfile;
      }
      
      // Check if we're offline
      const isOnline = await checkNetworkConnectivity();
      if (!isOnline) {
        logDebug('Offline mode detected, using fallback profile');
        return createFallbackProfile(user);
      }
      
      // Try to get existing profile
      const profile = await getUserProfile(user.id);
      
      if (!profile) {
        logDebug('No profile found, creating new profile');
        
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
          logError('Failed to create profile:', createError);
          return createFallbackProfile(user);
        }
      }
      
      // Cache the profile for future use
      saveProfileToCache(user.id, profile);
      return profile;
    } catch (error) {
      logError('Profile fetch failed:', error);
      return createFallbackProfile(user);
    }
  }

  // Get profile from cache if available
  const getProfileFromCache = (userId: string): UserProfile | null => {
    if (!isBrowser) return null;
    
    try {
      const cachedProfile = localStorage.getItem(`${PROFILE_CACHE_PREFIX}${userId}`);
      const cacheTime = localStorage.getItem(`${PROFILE_CACHE_PREFIX}${userId}_time`);
      
      if (cachedProfile && cacheTime) {
        // Use cache if it's less than 5 minutes old
        if ((Date.now() - parseInt(cacheTime)) < AUTH_CACHE_TTL) {
          logDebug('Using cached profile');
          return JSON.parse(cachedProfile);
        }
      }
    } catch (e) {
      // Invalid cache, continue with API call
      logDebug('Cache read error (non-critical)');
    }
    
    return null;
  };

  // Save profile to cache
  const saveProfileToCache = (userId: string, profile: UserProfile) => {
    if (!isBrowser || !profile) return;
    
    try {
      localStorage.setItem(`${PROFILE_CACHE_PREFIX}${userId}`, JSON.stringify(profile));
      localStorage.setItem(`${PROFILE_CACHE_PREFIX}${userId}_time`, Date.now().toString());
      logDebug('Profile saved to cache');
    } catch (e) {
      logDebug('Failed to cache profile (non-critical)');
    }
  };

  // Clear cache on sign out
  const clearProfileCache = (userId?: string) => {
    if (!isBrowser) return;
    
    try {
      if (userId) {
        localStorage.removeItem(`${PROFILE_CACHE_PREFIX}${userId}`);
        localStorage.removeItem(`${PROFILE_CACHE_PREFIX}${userId}_time`);
      } else {
        // If no userId provided, clear all tenant profile caches
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith(PROFILE_CACHE_PREFIX)) {
            localStorage.removeItem(key);
          }
        }
      }
      logDebug('Profile cache cleared');
    } catch (e) {
      logDebug('Failed to clear cache (non-critical)');
    }
  };

  // Function to detect if we're offline
  const checkNetworkConnectivity = async (): Promise<boolean> => {
    if (!isBrowser) return true; // Assume online in SSR context
    
    try {
      // Try to use navigator.onLine first as it's more efficient
      if (typeof navigator !== 'undefined' && navigator.onLine === false) {
        logDebug('Offline detected via navigator.onLine');
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
    } catch (e) {
      logDebug('Offline detected via fetch failure');
      return false;
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
        const userProfile = await fetchUserProfile(user);
        
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
        
        // 2. Check for tokens in URL (both in search params and hash fragment)
        console.log('[AUTH_HANDLER] No existing session, checking URL for tokens');
        const url = new URL(window.location.href);
        
        // Check query parameters (used by some OAuth flows)
        let accessToken = url.searchParams.get('access_token');
        let refreshToken = url.searchParams.get('refresh_token');
        
        // Also check hash fragment (used by SPA redirects)
        if (!accessToken || !refreshToken) {
          const hashParams = new URLSearchParams(window.location.hash.substring(1));
          accessToken = accessToken || hashParams.get('access_token');
          refreshToken = refreshToken || hashParams.get('refresh_token');
        }
        
        // Also check for code (used by PKCE flow)
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
            console.log('[AUTH_HANDLER] User authenticated but no profile, will trigger profile fetch');
          }
        } else if (event === 'SIGNED_OUT') {
          console.log('[AUTH_HANDLER] Sign out event detected');
          setUser(null);
          setProfile(null);
          setIsAuthenticated(false);
        } else {
          // For other events, just update the user state
          setUser(session?.user || null);
          setIsAuthenticated(!!session?.user);
        }
        
        setIsAuthenticating(false);
      }
    );

    // Clean up subscription
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    // Try to get auth status from localStorage immediately to prevent flashing
    if (isBrowser) {
      try {
        // Check if we have a cached auth status to use immediately
        const cachedAuthStatus = sessionStorage.getItem('auth_status');
        const cacheTime = sessionStorage.getItem('auth_status_time');
        
        if (cachedAuthStatus && cacheTime) {
          // Use cache if it's less than 5 minutes old
          if ((Date.now() - parseInt(cacheTime)) < AUTH_CACHE_TTL) {
            const authData = JSON.parse(cachedAuthStatus);
            if (authData.authenticated && authData.user) {
              logDebug('Using cached auth status');
              // Set initial state from cache to prevent flashing
              setUser(authData.user);
              setIsAuthenticated(true);
              // Don't set isAuthenticating to false yet - wait for the real check
            }
          }
        }
      } catch (e) {
        logError('Cache read error (non-critical):', e);
        // Ignore cache errors, will fall back to normal auth flow
      }
    }
  }, []);

  useEffect(() => {
    // Set up session refresh mechanism for better session recovery
    const cleanupRefresh = setupSessionRefresh();
    
    return () => {
      cleanupRefresh();
    };
  }, []);

  // Update your signOut function

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
        
        // Clear profile cache
        if (user) {
          clearProfileCache(user.id);
        } else {
          clearProfileCache(); // Clear all if no specific user
        }
      }
    } catch (error) {
      logError('Error signing out:', error);
    }
  }, [user]);

  // Simplified loading indicator to reduce nesting
  if (isAuthenticating) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Only show error screen for critical auth errors
  if (authError) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded max-w-md">
          <strong>Authentication Error:</strong> {authError}
        </div>
      </div>
    );
  }

  // Provide auth context to all child components
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