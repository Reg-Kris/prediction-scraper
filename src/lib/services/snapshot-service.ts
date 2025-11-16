/**
 * Snapshot Service - Daily capture of prediction market probabilities
 *
 * Captures daily snapshots of all active prediction markets to build
 * historical database for accuracy validation and trend analysis.
 */

import { PrismaClient } from '@/generated/prisma';
import { scraperAggregator } from './scraper-aggregator';
import { VolatilityCalculator } from '../utils/volatility-calculator';
import type { AggregatedOdds } from '@/types/market';

const prisma = new PrismaClient();

export class SnapshotService {
  /**
   * Capture current state of all prediction markets
   * Run this daily (e.g., via cron job at midnight)
   */
  static async captureSnapshot(): Promise<{
    success: boolean;
    snapshotCount: number;
    errors: string[];
  }> {
    const errors: string[] = [];
    let snapshotCount = 0;

    try {
      console.log('[SnapshotService] Starting daily snapshot capture...');

      // 1. Fetch all current events
      const allEvents = await scraperAggregator.fetchAllEvents();
      console.log(`[SnapshotService] Found ${allEvents.length} active events`);

      // 2. Get aggregated odds for all events
      const aggregated = await scraperAggregator.getAggregatedOdds(allEvents);
      console.log(`[SnapshotService] Aggregated ${aggregated.length} events`);

      // 3. Save snapshot for each event
      for (const item of aggregated) {
        try {
          await this.saveSnapshot(item);
          snapshotCount++;
        } catch (error) {
          const errorMsg = `Failed to save snapshot for event ${item.event.id}: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`;
          console.error(`[SnapshotService] ${errorMsg}`);
          errors.push(errorMsg);
        }
      }

      console.log(
        `[SnapshotService] Snapshot complete: ${snapshotCount} saved, ${errors.length} errors`
      );

      return {
        success: errors.length === 0 || snapshotCount > 0,
        snapshotCount,
        errors,
      };
    } catch (error) {
      console.error('[SnapshotService] Fatal error during snapshot:', error);
      return {
        success: false,
        snapshotCount,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      };
    }
  }

  /**
   * Save a single event snapshot to database
   */
  private static async saveSnapshot(item: AggregatedOdds): Promise<void> {
    const vixCorrelation = VolatilityCalculator.estimateVIXCorrelation(item);
    const sources = item.odds.map((o) => o.source);

    await prisma.predictionSnapshot.create({
      data: {
        eventId: item.event.id,
        eventTitle: item.event.title,
        category: item.event.category,
        snapshotDate: new Date(),
        closeDate: item.event.closeDate,
        probability: item.aggregatedProbability,
        impactScore: item.impactScore.score,
        vixCorrelation,
        sources: JSON.stringify(sources),
        sourceCount: sources.length,
        confidence: item.confidence,
        tags: JSON.stringify(item.event.tags),
      },
    });
  }

  /**
   * Get historical snapshots for a specific event
   */
  static async getEventHistory(
    eventId: string,
    limit?: number
  ): Promise<
    Array<{
      snapshotDate: Date;
      probability: number;
      impactScore: number;
      vixCorrelation: number | null;
      confidence: number | null;
    }>
  > {
    const snapshots = await prisma.predictionSnapshot.findMany({
      where: { eventId },
      orderBy: { snapshotDate: 'desc' },
      take: limit,
      select: {
        snapshotDate: true,
        probability: true,
        impactScore: true,
        vixCorrelation: true,
        confidence: true,
      },
    });

    return snapshots;
  }

  /**
   * Get probability trend for an event
   */
  static async getProbabilityTrend(
    eventId: string,
    days: number = 30
  ): Promise<{
    eventId: string;
    currentProbability: number | null;
    change24h: number | null;
    change7d: number | null;
    change30d: number | null;
    history: Array<{ date: Date; probability: number }>;
  }> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const snapshots = await prisma.predictionSnapshot.findMany({
      where: {
        eventId,
        snapshotDate: {
          gte: cutoffDate,
        },
      },
      orderBy: { snapshotDate: 'asc' },
      select: {
        snapshotDate: true,
        probability: true,
      },
    });

    if (snapshots.length === 0) {
      return {
        eventId,
        currentProbability: null,
        change24h: null,
        change7d: null,
        change30d: null,
        history: [],
      };
    }

    const current = snapshots[snapshots.length - 1].probability;

    // Calculate changes
    const get24hAgo = () => {
      const target = new Date();
      target.setDate(target.getDate() - 1);
      return this.findClosestSnapshot(snapshots, target)?.probability;
    };

    const get7dAgo = () => {
      const target = new Date();
      target.setDate(target.getDate() - 7);
      return this.findClosestSnapshot(snapshots, target)?.probability;
    };

    const get30dAgo = () => {
      const target = new Date();
      target.setDate(target.getDate() - 30);
      return this.findClosestSnapshot(snapshots, target)?.probability;
    };

    const prob24h = get24hAgo();
    const prob7d = get7dAgo();
    const prob30d = get30dAgo();

    return {
      eventId,
      currentProbability: current,
      change24h: prob24h ? current - prob24h : null,
      change7d: prob7d ? current - prob7d : null,
      change30d: prob30d ? current - prob30d : null,
      history: snapshots.map((s) => ({
        date: s.snapshotDate,
        probability: s.probability,
      })),
    };
  }

  /**
   * Find snapshot closest to target date
   */
  private static findClosestSnapshot(
    snapshots: Array<{ snapshotDate: Date; probability: number }>,
    targetDate: Date
  ): { snapshotDate: Date; probability: number } | undefined {
    if (snapshots.length === 0) return undefined;

    return snapshots.reduce((closest, current) => {
      const closestDiff = Math.abs(closest.snapshotDate.getTime() - targetDate.getTime());
      const currentDiff = Math.abs(current.snapshotDate.getTime() - targetDate.getTime());
      return currentDiff < closestDiff ? current : closest;
    });
  }

  /**
   * Get events with largest probability changes
   */
  static async getBiggestMovers(
    days: number = 7,
    limit: number = 10
  ): Promise<
    Array<{
      eventId: string;
      eventTitle: string;
      category: string;
      currentProbability: number;
      previousProbability: number;
      change: number;
      changePercent: number;
    }>
  > {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    // Get all events with snapshots in the time window
    const recentSnapshots = await prisma.predictionSnapshot.findMany({
      where: {
        snapshotDate: {
          gte: cutoffDate,
        },
      },
      orderBy: { snapshotDate: 'desc' },
    });

    // Group by eventId and get latest vs oldest
    const eventMap = new Map<
      string,
      {
        eventTitle: string;
        category: string;
        latest: { date: Date; probability: number };
        oldest: { date: Date; probability: number };
      }
    >();

    for (const snapshot of recentSnapshots) {
      const existing = eventMap.get(snapshot.eventId);

      if (!existing) {
        eventMap.set(snapshot.eventId, {
          eventTitle: snapshot.eventTitle,
          category: snapshot.category,
          latest: { date: snapshot.snapshotDate, probability: snapshot.probability },
          oldest: { date: snapshot.snapshotDate, probability: snapshot.probability },
        });
      } else {
        if (snapshot.snapshotDate > existing.latest.date) {
          existing.latest = { date: snapshot.snapshotDate, probability: snapshot.probability };
        }
        if (snapshot.snapshotDate < existing.oldest.date) {
          existing.oldest = { date: snapshot.snapshotDate, probability: snapshot.probability };
        }
      }
    }

    // Calculate changes and sort
    const movers = Array.from(eventMap.entries())
      .map(([eventId, data]) => {
        const change = data.latest.probability - data.oldest.probability;
        const changePercent = (change / data.oldest.probability) * 100;

        return {
          eventId,
          eventTitle: data.eventTitle,
          category: data.category,
          currentProbability: data.latest.probability,
          previousProbability: data.oldest.probability,
          change,
          changePercent,
        };
      })
      .sort((a, b) => Math.abs(b.change) - Math.abs(a.change))
      .slice(0, limit);

    return movers;
  }

  /**
   * Get snapshot statistics
   */
  static async getStatistics(): Promise<{
    totalSnapshots: number;
    uniqueEvents: number;
    oldestSnapshot: Date | null;
    newestSnapshot: Date | null;
    snapshotsLast24h: number;
    snapshotsLast7d: number;
  }> {
    const [totalSnapshots, uniqueEvents, oldestSnapshot, newestSnapshot] = await Promise.all([
      prisma.predictionSnapshot.count(),
      prisma.predictionSnapshot.findMany({ distinct: ['eventId'] }).then((r) => r.length),
      prisma.predictionSnapshot.findFirst({
        orderBy: { snapshotDate: 'asc' },
        select: { snapshotDate: true },
      }),
      prisma.predictionSnapshot.findFirst({
        orderBy: { snapshotDate: 'desc' },
        select: { snapshotDate: true },
      }),
    ]);

    const date24h = new Date();
    date24h.setDate(date24h.getDate() - 1);
    const date7d = new Date();
    date7d.setDate(date7d.getDate() - 7);

    const [snapshotsLast24h, snapshotsLast7d] = await Promise.all([
      prisma.predictionSnapshot.count({ where: { snapshotDate: { gte: date24h } } }),
      prisma.predictionSnapshot.count({ where: { snapshotDate: { gte: date7d } } }),
    ]);

    return {
      totalSnapshots,
      uniqueEvents,
      oldestSnapshot: oldestSnapshot?.snapshotDate || null,
      newestSnapshot: newestSnapshot?.snapshotDate || null,
      snapshotsLast24h,
      snapshotsLast7d,
    };
  }

  /**
   * Clean up old snapshots (optional - for storage management)
   */
  static async cleanupOldSnapshots(daysToKeep: number = 365): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const result = await prisma.predictionSnapshot.deleteMany({
      where: {
        snapshotDate: {
          lt: cutoffDate,
        },
      },
    });

    console.log(`[SnapshotService] Deleted ${result.count} old snapshots`);
    return result.count;
  }
}
