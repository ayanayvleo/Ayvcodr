# Frontend (Next.js) for Custom AI API Platform

This is the Next.js/React frontend for the Custom AI API Platform. It provides a modern dashboard for API key management, privacy/compliance controls, analytics, and model upload/fine-tuning.

## Features
- API key management (CRUD, per-workflow permissions, rate limits)
- Privacy & compliance toolkit (data export, deletion, consent, audit logs)
- Analytics dashboard
- Custom model upload and fine-tuning
- Granular user and workflow settings

## Getting Started

1. Install dependencies:
   ```sh
   npm install
   ```
2. Run the development server:
   ```sh
   npm run dev
   ```
3. Open [https://ayvcodr.com](https://ayvcodr.com) in your browser.

## Testing
- Run all tests:
  ```sh
  npx jest
  ```
- Lint and type check:
  ```sh
  npx eslint .
  npx tsc --noEmit
  ```

## Project Structure
- `app/` - Next.js app directory (routing, pages)
- `components/` - UI and settings components
- `lib/` - API and utility functions
- `__tests__/` - Unit and integration tests


## Monitoring & Error Reporting
This project uses [Sentry](https://sentry.io/) for monitoring and error reporting. To enable Sentry:

1. Create a Sentry project at sentry.io and get your DSN.
2. Copy `.env.example` to `.env.local` and set `SENTRY_DSN`.
3. Deploy as usual. Errors and performance data will be sent to Sentry.

---

## Production Checklist
- [x] All tests pass
- [x] Lint/type checks clean
- [x] Security audit run
- [x] CI/CD configured
- [x] Monitoring and error reporting
- [x] Documentation polished

---

*This frontend is designed for privacy, extensibility, and ease of use. For backend setup, see the main project README.*
