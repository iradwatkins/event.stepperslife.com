import * as Sentry from '@sentry/nextjs';

const SENTRY_DSN = process.env.SENTRY_DSN;

export function initSentry() {
  if (!SENTRY_DSN) {
    console.warn('Sentry DSN not configured. Error tracking disabled.');
    return;
  }

  Sentry.init({
    dsn: SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',

    // Performance Monitoring
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

    // Error Filtering
    beforeSend(event, hint) {
      // Don't send errors in development unless explicitly enabled
      if (process.env.NODE_ENV === 'development' && !process.env.SENTRY_ENABLE_DEV) {
        return null;
      }

      // Filter out known non-critical errors
      const error = hint.originalException;
      if (error instanceof Error) {
        const errorMessage = error.message.toLowerCase();

        // Filter out common non-critical errors
        const ignoredErrors = [
          'non-error promise rejection captured',
          'network error',
          'loading chunk',
          'chunkloaderror',
          'abortError'
        ];

        if (ignoredErrors.some(ignored => errorMessage.includes(ignored))) {
          return null;
        }
      }

      return event;
    },

    // Additional configuration
    release: process.env.VERCEL_GIT_COMMIT_SHA || process.env.npm_package_version,
    integrations: [
      new Sentry.Integrations.Http({ tracing: true }),
      new Sentry.Integrations.Console(),
    ],

    // Tags for better organization
    initialScope: {
      tags: {
        component: 'events-platform',
        version: process.env.npm_package_version || 'unknown'
      }
    }
  });
}

// Custom error logger with context
export function logError(
  error: Error,
  context?: {
    user?: { id: string; email?: string; role?: string };
    extra?: Record<string, any>;
    tags?: Record<string, string>;
    level?: 'fatal' | 'error' | 'warning' | 'info' | 'debug';
  }
) {
  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    if (context?.extra) {
      console.error('Context:', context.extra);
    }
  }

  // Send to Sentry if configured
  if (SENTRY_DSN) {
    Sentry.withScope((scope) => {
      if (context?.user) {
        scope.setUser(context.user);
      }

      if (context?.extra) {
        Object.entries(context.extra).forEach(([key, value]) => {
          scope.setExtra(key, value);
        });
      }

      if (context?.tags) {
        Object.entries(context.tags).forEach(([key, value]) => {
          scope.setTag(key, value);
        });
      }

      if (context?.level) {
        scope.setLevel(context.level);
      }

      Sentry.captureException(error);
    });
  }
}

// Custom message logger
export function logMessage(
  message: string,
  level: 'fatal' | 'error' | 'warning' | 'info' | 'debug' = 'info',
  context?: {
    user?: { id: string; email?: string; role?: string };
    extra?: Record<string, any>;
    tags?: Record<string, string>;
  }
) {
  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.log(`[${level.toUpperCase()}] ${message}`);
    if (context?.extra) {
      console.log('Context:', context.extra);
    }
  }

  // Send to Sentry if configured
  if (SENTRY_DSN) {
    Sentry.withScope((scope) => {
      if (context?.user) {
        scope.setUser(context.user);
      }

      if (context?.extra) {
        Object.entries(context.extra).forEach(([key, value]) => {
          scope.setExtra(key, value);
        });
      }

      if (context?.tags) {
        Object.entries(context.tags).forEach(([key, value]) => {
          scope.setTag(key, value);
        });
      }

      scope.setLevel(level);
      Sentry.captureMessage(message);
    });
  }
}

// Performance monitoring helpers
export function startTransaction(name: string, operation: string) {
  if (!SENTRY_DSN) return null;

  return Sentry.startTransaction({
    name,
    op: operation
  });
}

export function addBreadcrumb(message: string, category?: string, level?: 'fatal' | 'error' | 'warning' | 'info' | 'debug') {
  Sentry.addBreadcrumb({
    message,
    category: category || 'custom',
    level: level || 'info',
    timestamp: Date.now() / 1000
  });
}

export { Sentry };