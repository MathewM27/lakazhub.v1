import * as Sentry from '@sentry/nextjs';

// Auth error types enum
export enum AuthErrorType {
  SESSION_EXPIRED = 'SESSION_EXPIRED',
  SESSION_MISSING = 'SESSION_MISSING', 
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