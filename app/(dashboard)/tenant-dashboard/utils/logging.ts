import * as Sentry from '@sentry/nextjs';

export const logDebug = (message: string, data?: any) => {
  if (process.env.NODE_ENV === 'development') {
    if (data !== undefined) {
      console.log(`[TENANT_AUTH] ${message}`, data);
    } else {
      console.log(`[TENANT_AUTH] ${message}`);
    }
  }
};

export const logError = (message: string, error?: any) => {
  if (process.env.NODE_ENV === 'development') {
    if (error !== undefined) {
      console.error(`[TENANT_AUTH] ${message}`, error);
    } else {
      console.error(`[TENANT_AUTH] ${message}`);
    }
  }
  
  // Report errors to Sentry in all environments
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