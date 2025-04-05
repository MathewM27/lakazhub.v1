'use client';

import { useEffect, useState, createContext, useContext, useCallback } from 'react';
import { supabase, getUserProfile, createUserProfile, validateUserRole, checkAuthStatus } from '../lib/utils/supabase/client';
import { User } from '@supabase/supabase-js';
import { UserProfile } from '@/types/user';

// Check if we're in a browser environment
const isBrowser = typeof window !== 'undefined';

// Constants for authentication
const AUTH_RETRY_DELAY = 1500; // ms
const AUTH_MAX_RETRIES = 3;
const AUTH_ROLE = 'landlord';

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
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [hasCorrectRole, setHasCorrectRole] = useState(false);

  // Memoized function to sign out the user
  const signOut = useCallback(async () => {
    try {
      if (process.env.NODE_ENV === 'development') {
        console.log('[AUTH_HANDLER] Signing out user');
      }
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
    } catch (e) {
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
    } catch (e) {
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
    } catch (e) {
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

  // Fetch user profile with caching and offline support
  async function fetchUserProfile(user: User) {
    if (process.env.NODE_ENV === 'development') {
      console.log('[AUTH_HANDLER] Fetching profile for user:', user.id);
    }
    
    try {
      // Check if we have a cached profile first
      const cachedProfile = getProfileFromCache(user.id);
      if (cachedProfile) {
        if (process.env.NODE_ENV === 'development') {
          console.log('[AUTH_HANDLER] Using cached profile');
        }
        return cachedProfile;
      }
      
      // Check if we're offline
      const isOnline = await checkNetworkConnectivity();
      if (!isOnline) {
        if (process.env.NODE_ENV === 'development') {
          console.log('[AUTH_HANDLER] Offline mode detected, using fallback profile');
        }
        return createFallbackProfile(user);
      }
      
      // Try to get existing profile
      const profile = await getUserProfile(user.id);
      
      if (!profile) {
        if (process.env.NODE_ENV === 'development') {
          console.log('[AUTH_HANDLER] No profile found, creating new profile');
        }
        
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
          if (process.env.NODE_ENV === 'development') {
            console.error('[AUTH_HANDLER] Failed to create profile:', createError);
          }
          return createFallbackProfile(user);
        }
      }
      
      // Cache the profile for future use
      saveProfileToCache(user.id, profile);
      return profile;
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('[AUTH_HANDLER] Profile fetch failed:', error);
      }
      return createFallbackProfile(user);
    }
  }

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
                if (process.env.NODE_ENV === 'development') {
                  console.error('[AUTH_HANDLER] Failed to update profile role:', updateError);
                }
              }
            }
          } else if (retryCount < AUTH_MAX_RETRIES) {
            // Only retry a limited number of times with exponential backoff
            retryCount++;
            const backoffDelay = AUTH_RETRY_DELAY * Math.pow(1.5, retryCount - 1);
            
            if (process.env.NODE_ENV === 'development') {
              console.log(`[AUTH_HANDLER] Retry ${retryCount}/${AUTH_MAX_RETRIES} in ${backoffDelay}ms`);
            }
            
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
        if (process.env.NODE_ENV === 'development') {
          console.error('[AUTH_HANDLER] Error in profile effect:', error);
        }
        
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
  }, [user]);

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
              // Set initial state from cache to prevent flashing
              setUser(authData.user);
              setIsAuthenticated(true);
              // Don't set isAuthenticating to false yet - wait for the real check
            }
          }
        }
      } catch (e) {
        // Ignore cache errors, will fall back to normal auth flow
      }
    }
  }, []);

  useEffect(() => {
    const handleAuth = async () => {
      try {
        if (process.env.NODE_ENV === 'development') {
          console.log('[AUTH_HANDLER] Checking authentication status...');
        }
        
        // Use our optimized checkAuthStatus function that includes caching
        const authStatus = await checkAuthStatus();
        
        if (authStatus.error) {
          throw new Error(authStatus.error);
        }
        
        if (authStatus.authenticated && authStatus.user) {
          setUser(authStatus.user);
          setIsAuthenticated(true);
          
          // Check URL parameters for role information - only in development or with secure validation
          if (isBrowser) {
            const urlParams = new URLSearchParams(window.location.search);
            const roleParam = urlParams.get('role');
            
            // Allow role parameter with validation
            if (roleParam === AUTH_ROLE && authStatus.user.user_metadata?.user_role !== AUTH_ROLE) {
              await supabase.auth.updateUser({
                data: { user_role: AUTH_ROLE }
              });
              
              // Update the user object with the new metadata
              const { data } = await supabase.auth.getUser();
              if (data?.user) {
                setUser(data.user);
              }
            }
          }
        } else {
          setUser(null);
          setIsAuthenticated(false);
          setProfile(null);
          setHasCorrectRole(false);
        }
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error('[AUTH_HANDLER] Auth error:', error);
        }
        setAuthError(error instanceof Error ? error.message : 'An unknown error occurred');
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
      async (event: string, session: any) => {
        if (process.env.NODE_ENV === 'development') {
          console.log(`[AUTH_HANDLER] Auth state changed: ${event}`);
        }
        
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
  }, []);

  // We'll let the child components handle their own loading states
  // This allows for a more customized welcome experience in each dashboard
  // Instead of showing a loading indicator here, we'll pass the loading state to children

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

  // Provide auth context to children, including when authenticating
  // This allows child components to show a welcome screen during authentication
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