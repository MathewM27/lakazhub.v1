import { supabase } from './supabase/client';
import { logDebug, logError } from './logging';
import { Session } from '@supabase/supabase-js';

// Automatically refresh session when it's about to expire
export const setupSessionRefresh = () => {
  if (typeof window === 'undefined') return () => {}; // Return empty cleanup function for SSR
  
  let refreshTimeout: NodeJS.Timeout | null = null;
  
  const refreshSession = async () => {
    try {
      // logDebug('Refreshing authentication session');
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error) {
        logError('Session refresh failed', error);
        return;
      }
      
      if (data.session) {
        // Calculate next refresh time (5 minutes before expiry)
        const expiresAt = data.session.expires_at;
        if (expiresAt) {
          const expiryTime = expiresAt * 1000; // Convert to milliseconds
          const refreshTime = expiryTime - Date.now() - (5 * 60 * 1000); // 5 minutes before expiry
          
          if (refreshTime > 0) {
            // logDebug(`Scheduling next refresh in ${Math.floor(refreshTime / 60000)} minutes`);
            refreshTimeout = setTimeout(refreshSession, refreshTime);
          }
        }
      }
    } catch (err) {
      logError('Error during session refresh', err);
      // Sentry reporting removed
    }
  };

  // Set up auth state change listener
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    (event: string, session: Session | null) => {
    // Clear any existing refresh timeout
    if (refreshTimeout) {
      clearTimeout(refreshTimeout);
      refreshTimeout = null;
    }

    if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
      if (session) {
        // Calculate initial refresh timeout
        const expiresAt = session.expires_at;
        if (expiresAt) {
          const expiryTime = expiresAt * 1000; // Convert to milliseconds
          const refreshTime = expiryTime - Date.now() - (5 * 60 * 1000); // 5 minutes before expiry
          
          if (refreshTime > 0) {
            // logDebug(`Initial session refresh in ${Math.floor(refreshTime / 60000)} minutes`);
            refreshTimeout = setTimeout(refreshSession, refreshTime);
          } else {
            // If already close to expiry, refresh immediately
            refreshSession();
          }
        }
      }
    }
  });

  // Return cleanup function
  return () => {
    if (refreshTimeout) clearTimeout(refreshTimeout);
    subscription.unsubscribe();
  };
};