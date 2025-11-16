/**
 * Next.js Instrumentation
 *
 * This file is automatically called once when the Next.js server starts.
 * Use it to initialize long-running services like schedulers.
 *
 * https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */

export async function register() {
  // Only run on server side
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { startScheduler } = await import('./lib/jobs/snapshot-scheduler');

    // Start the automated snapshot scheduler
    startScheduler();

    console.log('[Instrumentation] Server initialized successfully');
  }
}
