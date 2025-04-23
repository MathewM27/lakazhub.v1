import { SupabaseClient, Session } from '@supabase/supabase-js';
import { logDebug, logError } from './errorHandling';

// Constants
const PREFIX = 'SESSION_MANAGER';
const REFRESH_BUFFER_SECONDS = 300; // Refresh 5 minutes before expiry

export class SessionManager {
  private client: SupabaseClient;
  private refreshTimeout: NodeJS.Timeout | null = null;
  private onSessionExpired: () => void;
  private isServerSide: boolean;
  private lastRefreshTime: number = 0;
  private minRefreshInterval: number = 60000; // Minimum 1 minute between refresh attempts
  
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
      this.refreshSession();
      return;
    }
    
    // Schedule refresh for 5 minutes before expiration
    const refreshTime = timeUntilExpiry - (REFRESH_BUFFER_SECONDS * 1000);
    
    this.refreshTimeout = setTimeout(() => {
      this.refreshSession();
    }, refreshTime);
  }
  
  /**
   * Refresh the session
   */
  private async refreshSession(): Promise<void> {
    // Prevent excessive refreshes
    const now = Date.now();
    if (now - this.lastRefreshTime < this.minRefreshInterval) {
      return;
    }
    
    this.lastRefreshTime = now;
    
    try {
      const { data, error } = await this.client.auth.refreshSession();
      
      if (error) {
        logError(PREFIX, 'Failed to refresh session', error);
        
        // If refresh failed, session is likely expired - handle accordingly
        this.onSessionExpired();
        
        console.error('Session refresh failed:', {
          component: PREFIX,
          error: error.message
        });
        
        return;
      }
      
      if (data?.session) {
        // Schedule the next refresh
        this.scheduleRefresh(data.session);
      } else {
        this.onSessionExpired();
      }
    } catch (err) {
      logError(PREFIX, 'Unexpected error during session refresh', err);
      this.onSessionExpired();
    }
  }
  
  /**
   * Manually trigger a session refresh
   * @returns Promise resolving to success boolean
   */
  public async manualRefresh(): Promise<boolean> {
    if (this.isServerSide) return false;
    
    try {
      const { data, error } = await this.client.auth.refreshSession();
      
      if (error) {
        logError(PREFIX, 'Manual refresh failed', error);
        return false;
      }
      
      if (data?.session) {
        this.scheduleRefresh(data.session);
        return true;
      }
      
      return false;
    } catch (err) {
      logError(PREFIX, 'Error during manual refresh', err);
      return false;
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

  /**
   * Static helper to clear all PKCE/session storage and Supabase cookies
   */
  public static clearAuthStorage(): void {
    try {
      if (typeof window !== "undefined") {
        sessionStorage.clear();
        localStorage.clear();
        document.cookie.split(";").forEach(cookie => {
          const eqPos = cookie.indexOf("=");
          const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
          document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
        });
      }
    } catch {}
  }
}