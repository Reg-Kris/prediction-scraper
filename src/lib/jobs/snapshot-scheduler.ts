/**
 * Automated Snapshot Scheduler
 *
 * Runs daily snapshots automatically using cron scheduling.
 * Captures prediction market state every day at midnight.
 */

import cron from 'node-cron';
import { SnapshotService } from '../services/snapshot-service';

interface SchedulerConfig {
  enabled: boolean;
  schedule: string; // Cron expression
  timezone?: string;
  runOnStartup?: boolean;
}

interface SchedulerState {
  isRunning: boolean;
  lastRun: Date | null;
  lastRunStatus: 'success' | 'error' | null;
  lastRunCount: number;
  totalRuns: number;
  totalErrors: number;
  task: cron.ScheduledTask | null;
}

class SnapshotScheduler {
  private config: SchedulerConfig;
  private state: SchedulerState;

  constructor(config?: Partial<SchedulerConfig>) {
    this.config = {
      enabled: process.env.ENABLE_HISTORICAL_DATA === 'true',
      schedule: process.env.SNAPSHOT_SCHEDULE || '0 0 * * *', // Daily at midnight
      timezone: process.env.SNAPSHOT_TIMEZONE || 'UTC',
      runOnStartup: process.env.SNAPSHOT_RUN_ON_STARTUP === 'true',
      ...config,
    };

    this.state = {
      isRunning: false,
      lastRun: null,
      lastRunStatus: null,
      lastRunCount: 0,
      totalRuns: 0,
      totalErrors: 0,
      task: null,
    };
  }

  /**
   * Start the scheduler
   */
  start(): void {
    if (!this.config.enabled) {
      console.log('[SnapshotScheduler] Scheduler is disabled via configuration');
      return;
    }

    if (this.state.task) {
      console.log('[SnapshotScheduler] Scheduler already running');
      return;
    }

    // Validate cron expression
    if (!cron.validate(this.config.schedule)) {
      console.error(
        `[SnapshotScheduler] Invalid cron expression: ${this.config.schedule}`
      );
      return;
    }

    console.log('[SnapshotScheduler] Starting scheduler...');
    console.log(`[SnapshotScheduler] Schedule: ${this.config.schedule}`);
    console.log(`[SnapshotScheduler] Timezone: ${this.config.timezone}`);

    // Schedule the task
    this.state.task = cron.schedule(
      this.config.schedule,
      async () => {
        await this.runSnapshot();
      },
      {
        scheduled: true,
        timezone: this.config.timezone,
      }
    );

    console.log('[SnapshotScheduler] Scheduler started successfully');

    // Optionally run immediately on startup
    if (this.config.runOnStartup) {
      console.log('[SnapshotScheduler] Running snapshot on startup...');
      setImmediate(() => this.runSnapshot());
    }
  }

  /**
   * Stop the scheduler
   */
  stop(): void {
    if (!this.state.task) {
      console.log('[SnapshotScheduler] No active scheduler to stop');
      return;
    }

    console.log('[SnapshotScheduler] Stopping scheduler...');
    this.state.task.stop();
    this.state.task = null;
    console.log('[SnapshotScheduler] Scheduler stopped');
  }

  /**
   * Execute snapshot capture
   */
  private async runSnapshot(): Promise<void> {
    if (this.state.isRunning) {
      console.warn('[SnapshotScheduler] Snapshot already in progress, skipping...');
      return;
    }

    this.state.isRunning = true;
    const startTime = Date.now();

    console.log('[SnapshotScheduler] ========================================');
    console.log('[SnapshotScheduler] Starting scheduled snapshot capture...');
    console.log(`[SnapshotScheduler] Time: ${new Date().toISOString()}`);

    try {
      const result = await SnapshotService.captureSnapshot();

      const duration = ((Date.now() - startTime) / 1000).toFixed(2);

      this.state.lastRun = new Date();
      this.state.lastRunStatus = 'success';
      this.state.lastRunCount = result.snapshotCount;
      this.state.totalRuns++;

      console.log('[SnapshotScheduler] Snapshot completed successfully!');
      console.log(`[SnapshotScheduler] Events captured: ${result.snapshotCount}`);
      console.log(`[SnapshotScheduler] Errors: ${result.errors.length}`);
      console.log(`[SnapshotScheduler] Duration: ${duration}s`);

      if (result.errors.length > 0) {
        console.warn('[SnapshotScheduler] Errors encountered:');
        result.errors.forEach((err, idx) => {
          console.warn(`[SnapshotScheduler]   ${idx + 1}. ${err}`);
        });
      }

      console.log('[SnapshotScheduler] ========================================');
    } catch (error) {
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);

      this.state.lastRun = new Date();
      this.state.lastRunStatus = 'error';
      this.state.totalErrors++;

      console.error('[SnapshotScheduler] Snapshot failed!');
      console.error(
        `[SnapshotScheduler] Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      console.error(`[SnapshotScheduler] Duration: ${duration}s`);
      console.error('[SnapshotScheduler] ========================================');

      // Re-throw to ensure error is logged but don't crash the scheduler
      if (error instanceof Error) {
        console.error('[SnapshotScheduler] Stack trace:', error.stack);
      }
    } finally {
      this.state.isRunning = false;
    }
  }

  /**
   * Get current scheduler status
   */
  getStatus(): {
    enabled: boolean;
    running: boolean;
    schedule: string;
    timezone: string;
    lastRun: Date | null;
    lastRunStatus: 'success' | 'error' | null;
    lastRunCount: number;
    totalRuns: number;
    totalErrors: number;
    nextRun: Date | null;
  } {
    let nextRun: Date | null = null;

    if (this.state.task) {
      // Calculate next run time based on cron expression
      // This is approximate - cron doesn't provide direct "next run" API
      nextRun = this.calculateNextRun(this.config.schedule);
    }

    return {
      enabled: this.config.enabled,
      running: this.state.task !== null,
      schedule: this.config.schedule,
      timezone: this.config.timezone || 'UTC',
      lastRun: this.state.lastRun,
      lastRunStatus: this.state.lastRunStatus,
      lastRunCount: this.state.lastRunCount,
      totalRuns: this.state.totalRuns,
      totalErrors: this.state.totalErrors,
      nextRun,
    };
  }

  /**
   * Calculate approximate next run time
   */
  private calculateNextRun(cronExpression: string): Date {
    // Simple approximation for common cron expressions
    // For more accurate calculation, would need a full cron parser

    const now = new Date();

    // Daily at midnight: "0 0 * * *"
    if (cronExpression === '0 0 * * *') {
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      return tomorrow;
    }

    // Every hour: "0 * * * *"
    if (cronExpression === '0 * * * *') {
      const nextHour = new Date(now);
      nextHour.setHours(nextHour.getHours() + 1, 0, 0, 0);
      return nextHour;
    }

    // Every 15 minutes: "*/15 * * * *"
    if (cronExpression === '*/15 * * * *') {
      const next15 = new Date(now);
      const minutes = next15.getMinutes();
      const nextInterval = Math.ceil((minutes + 1) / 15) * 15;
      next15.setMinutes(nextInterval, 0, 0);
      if (nextInterval === 60) {
        next15.setHours(next15.getHours() + 1, 0, 0, 0);
      }
      return next15;
    }

    // Default: 1 day from now
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow;
  }

  /**
   * Manually trigger a snapshot (outside of schedule)
   */
  async triggerManual(): Promise<{
    success: boolean;
    snapshotCount: number;
    errors: string[];
  }> {
    console.log('[SnapshotScheduler] Manual snapshot trigger requested');
    await this.runSnapshot();

    return {
      success: this.state.lastRunStatus === 'success',
      snapshotCount: this.state.lastRunCount,
      errors: [],
    };
  }
}

// Singleton instance using globalThis for Next.js hot reload compatibility
declare global {
  var __snapshotScheduler: SnapshotScheduler | undefined;
}

/**
 * Get or create scheduler instance (auto-starts if enabled)
 */
export function getScheduler(config?: Partial<SchedulerConfig>): SnapshotScheduler {
  if (!globalThis.__snapshotScheduler) {
    globalThis.__snapshotScheduler = new SnapshotScheduler(config);

    // Auto-start if enabled
    if (globalThis.__snapshotScheduler['config'].enabled) {
      globalThis.__snapshotScheduler.start();
    }
  }
  return globalThis.__snapshotScheduler;
}

/**
 * Start the snapshot scheduler (call this in your app initialization)
 */
export function startScheduler(config?: Partial<SchedulerConfig>): void {
  const scheduler = getScheduler(config);
  if (scheduler['config'].enabled) {
    scheduler.start();
  }
}

/**
 * Stop the snapshot scheduler (call this in your app cleanup)
 */
export function stopScheduler(): void {
  if (globalThis.__snapshotScheduler) {
    globalThis.__snapshotScheduler.stop();
  }
}

/**
 * Get scheduler status (auto-initializes scheduler if needed)
 */
export function getSchedulerStatus() {
  // Auto-initialize scheduler on first access
  const scheduler = getScheduler();
  return scheduler.getStatus();
}

export { SnapshotScheduler };
