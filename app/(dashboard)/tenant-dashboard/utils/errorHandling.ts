// Auth error types enum
export enum AuthErrorType {
  SESSION_EXPIRED = 'SESSION_EXPIRED',
  SESSION_MISSING = 'SESSION_MISSING', 
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  UNAUTHORIZED_ROLE = 'UNAUTHORIZED_ROLE',
  NETWORK_ERROR = 'NETWORK_ERROR',
  UNKNOWN = 'UNKNOWN',
}

// Define a specific error type to replace 'any'
interface ErrorWithMessage {
  message?: string;
  name?: string;
}

// Helper to categorize errors
export const categorizeAuthError = (error: ErrorWithMessage | unknown): AuthErrorType => {
  // Cast unknown error to our interface with optional properties
  const err = error as ErrorWithMessage;
  const errorMessage = err?.message?.toLowerCase() || '';
  const errorName = err?.name || '';
  
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