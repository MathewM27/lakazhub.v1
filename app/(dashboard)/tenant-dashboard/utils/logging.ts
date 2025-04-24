// Define a specific type for log data instead of using 'any'
type LogData = Record<string, unknown> | Error | null | undefined;

/**
 * Debug logger function (currently disabled)
 * @param _message - Debug message
 * @param _data - Optional data to log
 */
export const logDebug = (_message: string, _data?: LogData) => {
  // Comment out console.log but keep the function for future debugging needs
  /* if (process.env.NODE_ENV === 'development') {
    if (data !== undefined) {
      console.log(`[TENANT_AUTH] ${message}`, data);
    } else {
      console.log(`[TENANT_AUTH] ${message}`);
    }
  } */
};

/**
 * Error logger function (Sentry removed)
 * @param _message - Error message
 * @param _error - Optional error object
 */
export const logError = (_message: string, _error?: LogData) => {
  // Keep error logging in development but comment out console outputs
  /* if (process.env.NODE_ENV === 'development') {
    if (error !== undefined) {
      console.error(`[TENANT_AUTH] ${message}`, error);
    } else {
      console.error(`[TENANT_AUTH] ${message}`);
    }
  } */
  
  // Sentry reporting has been removed as requested
};