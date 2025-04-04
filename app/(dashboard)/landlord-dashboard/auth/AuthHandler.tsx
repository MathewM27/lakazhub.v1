'use client';

import { useEffect, useState, createContext, useContext } from 'react';
import { supabase, getUserProfile, createUserProfile } from '../lib/utils/supabase/client';
import { User } from '@supabase/supabase-js';
import { UserProfile } from '@/types/user';

// Check if we're in a browser environment
const isBrowser = typeof window !== 'undefined';

// Create auth context to share authentication state
export const AuthContext = createContext<{
  isAuthenticating: boolean;
  isAuthenticated: boolean;
  user: User | null;
  profile: UserProfile | null;
  authError: string | null;
}>({
  isAuthenticating: true,
  isAuthenticated: false,
  user: null,
  profile: null,
  authError: null
});

export const useAuth = () => useContext(AuthContext);

export default function AuthHandler({ children }: { children: React.ReactNode }) {
  const [isAuthenticating, setIsAuthenticating] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  async function fetchUserProfile(user: User) {
    try {
      console.log('[AUTH_HANDLER] Fetching profile for user:', user.id);
      console.log('[AUTH_HANDLER] User email:', user.email);
      console.log('[AUTH_HANDLER] User metadata in fetchUserProfile:', JSON.stringify(user.user_metadata));
      console.log('[AUTH_HANDLER] User role from metadata:', user.user_metadata?.user_role);
      
      // First check if the session is still valid
      const { data: sessionData } = await supabase.auth.getSession();
      console.log('[AUTH_HANDLER] Session exists in fetchUserProfile:', !!sessionData.session);
      
      // Add a flag to detect if we're likely offline
      let isLikelyOffline = false;
      
      try {
        // Simple fetch to check internet connectivity
        console.log('[AUTH_HANDLER] Checking internet connectivity');
        await fetch('https://www.google.com/favicon.ico', { 
          mode: 'no-cors',
          cache: 'no-store',
          method: 'HEAD',
          signal: AbortSignal.timeout(2000) // 2 second timeout
        });
        console.log('[AUTH_HANDLER] Internet connectivity check passed');
      } catch (e) {
        console.log('[AUTH_HANDLER] Network connectivity check failed - likely offline');
        isLikelyOffline = true;
      }
      
      // If we're likely offline, don't even try to fetch profile
      if (isLikelyOffline) {
        console.log('[AUTH_HANDLER] Offline mode detected, using fallback profile');
        const offlineProfile = {
          id: user.id, 
          full_name: user.user_metadata?.full_name || 'User',
          email_address: user.email || '',
          user_role: user.user_metadata?.user_role || 'landlord',
          created_at: new Date().toISOString()
        } as UserProfile;
        console.log('[AUTH_HANDLER] Offline fallback profile:', offlineProfile);
        return offlineProfile;
      }
      
      // Try to get existing profile
      console.log('[AUTH_HANDLER] Calling getUserProfile with ID:', user.id);
      const profile = await getUserProfile(user.id);
      console.log('[AUTH_HANDLER] Profile fetch result:', profile);
      console.log('[AUTH_HANDLER] Profile exists:', !!profile);
      
      if (!profile) {
        console.log('[AUTH_HANDLER] No profile found, creating new profile');
        // Create a new profile if one doesn't exist
        try {
          // Create a profile that matches your database schema
          const profileData = {
            id: user.id,
            email: user.email,
            full_name: user.user_metadata?.full_name || '',
            user_role: user.user_metadata?.user_role || 'landlord',
            phone_number: user.user_metadata?.phone_number
          };
          
          console.log('[AUTH_HANDLER] Creating profile with data:', profileData);
          console.log('[AUTH_HANDLER] User role being used:', profileData.user_role);
          
          const newProfile = await createUserProfile(profileData);
          
          console.log('[AUTH_HANDLER] New profile created:', newProfile);
          if (newProfile) {
            console.log('[AUTH_HANDLER] New profile user_role:', newProfile.user_role);
          }
          return newProfile;
        } catch (createError) {
          console.error('[AUTH_HANDLER] Failed to create profile:', createError);
          // Return a fallback profile even if creation fails
          const fallbackProfile = {
            id: user.id, 
            full_name: user.user_metadata?.full_name || 'User',
            email_address: user.email || '',
            user_role: user.user_metadata?.user_role || 'landlord',
            created_at: new Date().toISOString()
          } as UserProfile;
          
          console.log('[AUTH_HANDLER] Creation error fallback profile:', fallbackProfile);
          return fallbackProfile;
        }
      }
      
      console.log('[AUTH_HANDLER] Returning existing profile with user_role:', profile.user_role);
      return profile;
    } catch (error) {
      console.error('[AUTH_HANDLER] Profile fetch failed:', error);
      // Return a fallback profile on any error
      const errorFallbackProfile = {
        id: user.id, 
        full_name: user.user_metadata?.full_name || 'User',
        email_address: user.email || '',
        user_role: user.user_metadata?.user_role || 'landlord',
        created_at: new Date().toISOString()
      } as UserProfile;
      
      console.log('[AUTH_HANDLER] General error fallback profile:', errorFallbackProfile);
      return errorFallbackProfile;
    }
  }

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
              user_role: user.user_metadata?.user_role || 'landlord',
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
              user_role: user.user_metadata?.user_role || 'landlord',
              phone_number: user.user_metadata?.phone_number
            }).catch(err => console.error('[AUTH_HANDLER] Background profile creation failed:', err));
          }
        }
      } catch (error) {
        console.error('[AUTH_HANDLER] Error in profile effect:', error);
        if (isMounted && retryCount < maxRetries) {
          retryCount++;
          console.log(`[AUTH_HANDLER] Error retry ${retryCount}/${maxRetries} in ${retryDelay}ms`);
          setTimeout(fetchUserProfileEffect, retryDelay);
        } else if (isMounted) {
          // Last resort fallback
          const lastResortProfile = {
            id: user.id, 
            full_name: user.user_metadata?.full_name || 'User',
            email_address: user.email || '',
            user_role: user.user_metadata?.user_role || 'landlord',
            created_at: new Date().toISOString()
          } as UserProfile;
          
          console.log('[AUTH_HANDLER] Last resort fallback profile:', lastResortProfile);
          setProfile(lastResortProfile);
        }
      }
    };
    
    if (user) {
      fetchUserProfileEffect();
    }
    
    return () => {
      isMounted = false;
    };
  }, [user]);

  useEffect(() => {
    const handleAuth = async () => {
      try {
        console.log('[AUTH_HANDLER] Checking authentication status...');
        
        // Get the current session
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          throw error;
        }
        
        if (data.session) {
          console.log('[AUTH_HANDLER] User is authenticated:', data.session.user.id);
          setUser(data.session.user);
          setIsAuthenticated(true);
          
          // Check URL parameters for role information
          if (isBrowser) {
            const urlParams = new URLSearchParams(window.location.search);
            const roleParam = urlParams.get('role') || urlParams.get('user_role');
            
            if (roleParam) {
              console.log('[AUTH_HANDLER] Role parameter found in URL:', roleParam);
              
              // Update user metadata if role is specified in URL
              if (roleParam === 'landlord' && data.session.user.user_metadata?.user_role !== 'landlord') {
                console.log('[AUTH_HANDLER] Updating user metadata with landlord role');
                await supabase.auth.updateUser({
                  data: { user_role: 'landlord' }
                });
              }
            }
          }
        } else {
          console.log('[AUTH_HANDLER] No active session found');
          setUser(null);
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('[AUTH_HANDLER] Auth error:', error);
        setAuthError(error instanceof Error ? error.message : 'An unknown error occurred');
      } finally {
        // Ensure we always exit the authenticating state
        setIsAuthenticating(false);
      }
    };

    handleAuth();

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event: string, session: any) => {
        console.log(`[AUTH_HANDLER] Auth state changed: ${event}`);
        if (session) {
          console.log('[AUTH_HANDLER] User authenticated:', session.user.id);
          setUser(session.user);
          setIsAuthenticated(true);
        } else {
          console.log('[AUTH_HANDLER] User signed out');
          setUser(null);
          setProfile(null);
          setIsAuthenticated(false);
        }
      }
    );

    // Clean up subscription
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Simplified loading indicator to reduce nesting
  if (isAuthenticating) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-12 h-12 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

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

  // Provide auth context to children
  return (
    <AuthContext.Provider value={{ isAuthenticating, isAuthenticated, user, profile, authError }}>
      {children}
    </AuthContext.Provider>
  );
}