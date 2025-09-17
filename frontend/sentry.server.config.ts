// Sentry config for Next.js (server)
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN || '',
  tracesSampleRate: 1.0, // Adjust for production
  environment: process.env.NODE_ENV,
  // Add more options as needed
});
