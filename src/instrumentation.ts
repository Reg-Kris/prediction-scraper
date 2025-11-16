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
    const { startResolutionScheduler } = await import('./lib/jobs/resolution-scheduler');

    // Start the automated snapshot scheduler
    startScheduler();

    // Start the automated resolution scheduler
    startResolutionScheduler();

    console.log('[Instrumentation] Server initialized successfully');
    console.log('[Instrumentation] - Snapshot scheduler: running');
    console.log('[Instrumentation] - Resolution scheduler: running');
  }
}
