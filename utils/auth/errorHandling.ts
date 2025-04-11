import * as Sentry from '@sentry/nextjs';

// Consistent development logging
export const logDebug = (prefix: string, message: string, data?: unknown) => {
  if (process.env.NODE_ENV === 'development') {
    if (data !== undefined) {
      console.log(`[${prefix}] ${message}`, data);
    } else {
      console.log(`[${prefix}] ${message}`);
    }
  }
};

// Unified error logging with Sentry integration
export const logError = (prefix: string, message: string, error?: any) => {
  if (process.env.NODE_ENV === 'development') {
    if (error !== undefined) {
      console.error(`[${prefix}] ${message}`, error);
    } else {
      console.error(`[${prefix}] ${message}`);
    }
  }
  
  // Report errors to Sentry in all environments
  if (error) {
    Sentry.captureException(error, {
      tags: {
        component: prefix,
      },
      extra: {
        message,
      },
    });
  } else {
    Sentry.captureMessage(`[${prefix}] ${message}`, {
      level: 'error',
      tags: {
        component: prefix,
      },
    });
  }
};

// Standardized auth error types
export enum AuthErrorType {
  SESSION_EXPIRED = 'SESSION_EXPIRED',
  SESSION_MISSING = 'SESSION_MISSING',  // Add this new type
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  UNAUTHORIZED_ROLE = 'UNAUTHORIZED_ROLE',
  NETWORK_ERROR = 'NETWORK_ERROR',
  UNKNOWN = 'UNKNOWN',
}

// Helper to categorize errors
export const categorizeAuthError = (error: any): AuthErrorType => {
  const errorMessage = error?.message?.toLowerCase() || '';
  const errorName = error?.name || '';
  
  if (errorName === 'AuthSessionMissingError' || errorMessage.includes('auth session missing')) {
    return AuthErrorType.SESSION_MISSING;
  } else if (errorMessage.includes('expired')) {
    return AuthErrorType.SESSION_EXPIRED;
  } else if (errorMessage.includes('credentials') || errorMessage.includes('password')) {
    return AuthErrorType.INVALID_CREDENTIALS;
  } else if (
    errorMessage.includes('permission') || 
    errorMessage.includes('role') || 
    errorMessage.includes('unauthorized')
  ) {
    return AuthErrorType.UNAUTHORIZED_ROLE;
  } else if (
    errorMessage.includes('network') || 
    errorMessage.includes('offline') || 
    errorMessage.includes('fetch')
  ) {
    return AuthErrorType.NETWORK_ERROR;
  }
  
  return AuthErrorType.UNKNOWN;
};