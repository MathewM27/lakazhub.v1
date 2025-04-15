import { SupabaseClient, Session } from '@supabase/supabase-js';
import { logDebug, logError } from './errorHandling';
import * as Sentry from '@sentry/nextjs';

// Constants
const PREFIX = 'SESSION_MANAGER';
const REFRESH_BUFFER_SECONDS = 300; // Refresh 5 minutes before expiry

export class SessionManager {
  private client: SupabaseClient;
  private refreshTimeout: NodeJS.Timeout | null = null;
  private onSessionExpired: () => void;
  private isServerSide: boolean;
  
  constructor(
    supabaseClient: SupabaseClient,
    onSessionExpiredCallback: () => void = () => { /* Default empty callback */ }
  ) {
    this.client = supabaseClient;
    this.onSessionExpired = onSessionExpiredCallback;
    this.isServerSide = typeof window === 'undefined';
  }
  
  /**
   * Initialize session monitoring
   */
  public async initialize(): Promise<boolean> {
    if (this.isServerSide) return false;
    
    try {
      // Check current session
      const { data } = await this.client.auth.getSession();
      
      if (data?.session) {
        this.scheduleRefresh(data.session);
        return true;
      }
      
      return false;
    } catch (error) {
      logError(PREFIX, 'Error initializing session manager', error);
      return false;
    }
  }
  
  /**
   * Calculate when to refresh based on expiry time
   */
  private scheduleRefresh(session: Session): void {
    if (this.isServerSide || !session?.expires_at) return;
    
    if (this.refreshTimeout) {
      clearTimeout(this.refreshTimeout);
      this.refreshTimeout = null;
    }
    
    const expiryTime = session.expires_at * 1000; // Convert to milliseconds
    const currentTime = Date.now();
    const timeUntilExpiry = expiryTime - currentTime;
    
    // If already expired or will expire very soon, call expiration handler immediately
    if (timeUntilExpiry <= REFRESH_BUFFER_SECONDS * 1000) {
      // logDebug(PREFIX, 'Session expired or expiring very soon');
      this.refreshSession();
      return;
    }
    
    // Schedule refresh for 5 minutes before expiration
    const refreshTime = timeUntilExpiry - (REFRESH_BUFFER_SECONDS * 1000);
    
    // logDebug(PREFIX, `Scheduling token refresh in ${Math.floor(refreshTime / 60000)} minutes`);
    
    this.refreshTimeout = setTimeout(() => {
      this.refreshSession();
    }, refreshTime);
  }
  
  /**
   * Refresh the session
   */
  private async refreshSession(): Promise<void> {
    try {
      // logDebug(PREFIX, 'Attempting to refresh session');
      
      const { data, error } = await this.client.auth.refreshSession();
      
      if (error) {
        logError(PREFIX, 'Failed to refresh session', error);
        
        // If refresh failed, session is likely expired - handle accordingly
        this.onSessionExpired();
        
        // Report to monitoring
        Sentry.captureMessage('Session refresh failed', {
          level: 'warning',
          tags: { component: PREFIX },
          extra: { error: error.message }
        });
        
        return;
      }
      
      if (data?.session) {
        // logDebug(PREFIX, 'Session refreshed successfully');
        
        // Schedule the next refresh
        this.scheduleRefresh(data.session);
      } else {
        // logDebug(PREFIX, 'No session returned after refresh');
        this.onSessionExpired();
      }
    } catch (err) {
      logError(PREFIX, 'Unexpected error during session refresh', err);
      this.onSessionExpired();
    }
  }
  
  /**
   * Clean up resources
   */
  public cleanup(): void {
    if (this.refreshTimeout) {
      clearTimeout(this.refreshTimeout);
      this.refreshTimeout = null;
    }
  }
  
  /**
   * Set up auth state change listener
   */
  public setupAuthListener(): (() => void) {
    if (this.isServerSide) return () => {};
    
    const { data: { subscription } } = this.client.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          if (session) {
            this.scheduleRefresh(session);
          }
        } else if (event === 'SIGNED_OUT') {
          if (this.refreshTimeout) {
            clearTimeout(this.refreshTimeout);
            this.refreshTimeout = null;
          }
        }
      }
    );
    
    return () => {
      subscription.unsubscribe();
    };
  }
}