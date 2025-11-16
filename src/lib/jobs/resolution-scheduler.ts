/**
 * Resolution Scheduler
 *
 * Automatically processes pending event resolutions daily.
 * Runs after snapshot scheduler to ensure fresh data.
 */

import cron from 'node-cron';
import { AutoResolutionService } from '../services/auto-resolution-service';

interface ResolutionSchedulerConfig {
  enabled: boolean;
  schedule: string; // Cron expression
  timezone?: string;
  daysAfterClose: number; // Min days after close before auto-resolving
  dryRun: boolean; // If true, only log what would be resolved
}

interface ResolutionSchedulerState {
  isRunning: boolean;
  lastRun: Date | null;
  lastRunStatus: 'success' | 'error' | null;
  lastRunStats: {
    autoResolved: number;
    pendingReview: number;
    total: number;
  } | null;
  totalRuns: number;
  totalResolved: number;
  totalErrors: number;
  task: cron.ScheduledTask | null;
}

class ResolutionScheduler {
  private config: ResolutionSchedulerConfig;
  private state: ResolutionSchedulerState;

  constructor(config?: Partial<ResolutionSchedulerConfig>) {
    this.config = {
      enabled: process.env.ENABLE_AUTO_RESOLUTION === 'true',
      schedule: process.env.RESOLUTION_SCHEDULE || '30 0 * * *', // Daily at 12:30 AM (after snapshots)
      timezone: process.env.RESOLUTION_TIMEZONE || 'UTC',
      daysAfterClose: parseInt(process.env.RESOLUTION_DAYS_AFTER_CLOSE || '1'),
      dryRun: process.env.RESOLUTION_DRY_RUN === 'true',
      ...config,
    };

    this.state = {
      isRunning: false,
      lastRun: null,
      lastRunStatus: null,
      lastRunStats: null,
      totalRuns: 0,
      totalResolved: 0,
      totalErrors: 0,
      task: null,
    };
  }

  /**
   * Start the scheduler
   */
  start(): void {
    if (!this.config.enabled) {
      console.log('[ResolutionScheduler] Scheduler is disabled via configuration');
      return;
    }

    if (this.state.task) {
      console.log('[ResolutionScheduler] Scheduler already running');
      return;
    }

    // Validate cron expression
    if (!cron.validate(this.config.schedule)) {
      console.error(
        `[ResolutionScheduler] Invalid cron expression: ${this.config.schedule}`
      );
      return;
    }

    console.log('[ResolutionScheduler] Starting scheduler...');
    console.log(`[ResolutionScheduler] Schedule: ${this.config.schedule}`);
    console.log(`[ResolutionScheduler] Timezone: ${this.config.timezone}`);
    console.log(`[ResolutionScheduler] Days after close: ${this.config.daysAfterClose}`);
    console.log(`[ResolutionScheduler] Dry run mode: ${this.config.dryRun}`);

    // Schedule the task
    this.state.task = cron.schedule(
      this.config.schedule,
      async () => {
        await this.runResolution();
      },
      {
        scheduled: true,
        timezone: this.config.timezone,
      }
    );

    console.log('[ResolutionScheduler] Scheduler started successfully');
  }

  /**
   * Stop the scheduler
   */
  stop(): void {
    if (!this.state.task) {
      console.log('[ResolutionScheduler] No active scheduler to stop');
      return;
    }

    console.log('[ResolutionScheduler] Stopping scheduler...');
    this.state.task.stop();
    this.state.task = null;
    console.log('[ResolutionScheduler] Scheduler stopped');
  }

  /**
   * Execute resolution process
   */
  private async runResolution(): Promise<void> {
    if (this.state.isRunning) {
      console.warn(
        '[ResolutionScheduler] Resolution already in progress, skipping...'
      );
      return;
    }

    this.state.isRunning = true;
    const startTime = Date.now();

    console.log('[ResolutionScheduler] ========================================');
    console.log('[ResolutionScheduler] Starting scheduled resolution process...');
    console.log(`[ResolutionScheduler] Time: ${new Date().toISOString()}`);
    console.log(`[ResolutionScheduler] Dry run: ${this.config.dryRun}`);

    try {
      const summary = await AutoResolutionService.processAll(
        this.config.daysAfterClose,
        this.config.dryRun
      );

      const duration = ((Date.now() - startTime) / 1000).toFixed(2);

      this.state.lastRun = new Date();
      this.state.lastRunStatus = 'success';
      this.state.lastRunStats = {
        autoResolved: summary.autoResolved,
        pendingReview: summary.pendingReview,
        total: summary.totalProcessed,
      };
      this.state.totalRuns++;
      this.state.totalResolved += summary.autoResolved;

      console.log('[ResolutionScheduler] Resolution completed successfully!');
      console.log(`[ResolutionScheduler] Total processed: ${summary.totalProcessed}`);
      console.log(`[ResolutionScheduler] Auto-resolved: ${summary.autoResolved}`);
      console.log(`[ResolutionScheduler] Pending review: ${summary.pendingReview}`);
      console.log(`[ResolutionScheduler] Insufficient data: ${summary.insufficientData}`);
      console.log(`[ResolutionScheduler] Errors: ${summary.errors}`);
      console.log(`[ResolutionScheduler] Duration: ${duration}s`);

      if (summary.errors > 0) {
        console.warn('[ResolutionScheduler] Some events had errors:');
        summary.results
          .filter((r) => r.status === 'error')
          .forEach((r) => {
            console.warn(`[ResolutionScheduler]   ${r.eventId}: ${r.error}`);
          });
      }

      console.log('[ResolutionScheduler] ========================================');
    } catch (error) {
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);

      this.state.lastRun = new Date();
      this.state.lastRunStatus = 'error';
      this.state.totalErrors++;

      console.error('[ResolutionScheduler] Resolution failed!');
      console.error(
        `[ResolutionScheduler] Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      console.error(`[ResolutionScheduler] Duration: ${duration}s`);
      console.error('[ResolutionScheduler] ========================================');

      if (error instanceof Error) {
        console.error('[ResolutionScheduler] Stack trace:', error.stack);
      }
    } finally {
      this.state.isRunning = false;
    }
  }

  /**
   * Get current scheduler status
   */
  getStatus() {
    let nextRun: Date | null = null;

    if (this.state.task) {
      nextRun = this.calculateNextRun(this.config.schedule);
    }

    return {
      enabled: this.config.enabled,
      running: this.state.task !== null,
      schedule: this.config.schedule,
      timezone: this.config.timezone || 'UTC',
      daysAfterClose: this.config.daysAfterClose,
      dryRun: this.config.dryRun,
      lastRun: this.state.lastRun,
      lastRunStatus: this.state.lastRunStatus,
      lastRunStats: this.state.lastRunStats,
      totalRuns: this.state.totalRuns,
      totalResolved: this.state.totalResolved,
      totalErrors: this.state.totalErrors,
      nextRun,
    };
  }

  /**
   * Calculate approximate next run time
   */
  private calculateNextRun(cronExpression: string): Date {
    const now = new Date();

    // Daily at 12:30 AM: "30 0 * * *"
    if (cronExpression === '30 0 * * *') {
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 30, 0, 0);
      return tomorrow;
    }

    // Every hour at :30: "30 * * * *"
    if (cronExpression === '30 * * * *') {
      const nextHour = new Date(now);
      if (now.getMinutes() >= 30) {
        nextHour.setHours(nextHour.getHours() + 1, 30, 0, 0);
      } else {
        nextHour.setMinutes(30, 0, 0);
      }
      return nextHour;
    }

    // Default: 1 day from now
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow;
  }

  /**
   * Manually trigger resolution (outside of schedule)
   */
  async triggerManual(dryRun?: boolean): Promise<{
    success: boolean;
    summary: any;
  }> {
    console.log('[ResolutionScheduler] Manual resolution trigger requested');

    const useDryRun = dryRun !== undefined ? dryRun : this.config.dryRun;

    await this.runResolution();

    return {
      success: this.state.lastRunStatus === 'success',
      summary: this.state.lastRunStats,
    };
  }
}

// Singleton instance using globalThis for Next.js hot reload compatibility
declare global {
  var __resolutionScheduler: ResolutionScheduler | undefined;
}

/**
 * Get or create scheduler instance (auto-starts if enabled)
 */
export function getResolutionScheduler(
  config?: Partial<ResolutionSchedulerConfig>
): ResolutionScheduler {
  if (!globalThis.__resolutionScheduler) {
    globalThis.__resolutionScheduler = new ResolutionScheduler(config);

    // Auto-start if enabled
    if (globalThis.__resolutionScheduler['config'].enabled) {
      globalThis.__resolutionScheduler.start();
    }
  }
  return globalThis.__resolutionScheduler;
}

/**
 * Start the resolution scheduler
 */
export function startResolutionScheduler(
  config?: Partial<ResolutionSchedulerConfig>
): void {
  const scheduler = getResolutionScheduler(config);
  if (scheduler['config'].enabled) {
    scheduler.start();
  }
}

/**
 * Stop the resolution scheduler
 */
export function stopResolutionScheduler(): void {
  if (globalThis.__resolutionScheduler) {
    globalThis.__resolutionScheduler.stop();
  }
}

/**
 * Get resolution scheduler status (auto-initializes if needed)
 */
export function getResolutionSchedulerStatus() {
  const scheduler = getResolutionScheduler();
  return scheduler.getStatus();
}

export { ResolutionScheduler };
