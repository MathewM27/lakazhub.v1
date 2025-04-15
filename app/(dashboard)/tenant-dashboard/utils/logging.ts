import * as Sentry from '@sentry/nextjs';

export const logDebug = (message: string, data?: any) => {
  // Comment out console.log but keep the function for future debugging needs
  /* if (process.env.NODE_ENV === 'development') {
    if (data !== undefined) {
      console.log(`[TENANT_AUTH] ${message}`, data);
    } else {
      console.log(`[TENANT_AUTH] ${message}`);
    }
  } */
};

export const logError = (message: string, error?: any) => {
  // Keep error logging in development but comment out console outputs
  /* if (process.env.NODE_ENV === 'development') {
    if (error !== undefined) {
      console.error(`[TENANT_AUTH] ${message}`, error);
    } else {
      console.error(`[TENANT_AUTH] ${message}`);
    }
  } */
  
  // Report errors to Sentry in all environments (keep this active)
  if (error) {
    Sentry.captureException(error, {
      tags: {
        component: 'TenantAuth',
      },
      extra: {
        message,
      },
    });
  } else {
    Sentry.captureMessage(`[TENANT_AUTH] ${message}`, {
      level: 'error',
      tags: {
        component: 'TenantAuth'
      },
    });
  }
};