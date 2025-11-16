/**
 * Resolution Service - Track event outcomes and calculate accuracy metrics
 *
 * Handles:
 * - Recording final outcomes of resolved events
 * - Calculating Brier scores for prediction accuracy
 * - Computing calibration metrics
 * - Tracking system performance over time
 */

import { PrismaClient } from '@/generated/prisma';

const prisma = new PrismaClient();

export interface EventResolutionData {
  eventId: string;
  eventTitle: string;
  outcome: boolean; // true = event happened, false = didn't happen
  notes?: string;
}

export interface AccuracyMetrics {
  brierScore: number; // 0 = perfect, 1 = worst
  calibrationError: number;
  totalSnapshots: number;
  finalProbability: number;
}

export class ResolutionService {
  /**
   * Resolve an event and calculate accuracy metrics
   *
   * @param data Event resolution data
   * @returns Accuracy metrics including Brier score
   */
  static async resolveEvent(data: EventResolutionData): Promise<AccuracyMetrics> {
    const { eventId, eventTitle, outcome, notes } = data;

    console.log(`[ResolutionService] Resolving event: ${eventId} - ${eventTitle}`);

    // 1. Get all snapshots for this event
    const snapshots = await prisma.predictionSnapshot.findMany({
      where: { eventId },
      orderBy: { snapshotDate: 'asc' },
      select: {
        probability: true,
        snapshotDate: true,
      },
    });

    if (snapshots.length === 0) {
      throw new Error(`No snapshots found for event ${eventId}`);
    }

    // 2. Calculate accuracy metrics
    const metrics = this.calculateAccuracyMetrics(snapshots, outcome);

    // 3. Save resolution to database
    await prisma.eventResolution.create({
      data: {
        eventId,
        eventTitle,
        outcome,
        notes: notes || '',
        finalProbability: metrics.finalProbability,
        brierScore: metrics.brierScore,
        calibrationError: metrics.calibrationError,
        totalSnapshots: metrics.totalSnapshots,
      },
    });

    console.log(
      `[ResolutionService] Event ${eventId} resolved. Brier Score: ${metrics.brierScore.toFixed(
        4
      )}`
    );

    return metrics;
  }

  /**
   * Calculate Brier score and other accuracy metrics
   *
   * Brier Score = (1/N) * Σ(forecast - outcome)²
   * - Perfect prediction: 0.0
   * - Random prediction: 0.25
   * - Worst prediction: 1.0
   */
  static calculateAccuracyMetrics(
    snapshots: Array<{ probability: number; snapshotDate: Date }>,
    outcome: boolean
  ): AccuracyMetrics {
    const outcomeValue = outcome ? 1 : 0;
    const finalProbability = snapshots[snapshots.length - 1].probability;

    // Brier Score: average squared error
    const brierScore =
      snapshots.reduce((sum, snapshot) => {
        const error = snapshot.probability - outcomeValue;
        return sum + error * error;
      }, 0) / snapshots.length;

    // Calibration error: difference between average probability and outcome
    const averageProbability =
      snapshots.reduce((sum, s) => sum + s.probability, 0) / snapshots.length;
    const calibrationError = Math.abs(averageProbability - outcomeValue);

    return {
      brierScore: Math.round(brierScore * 10000) / 10000, // Round to 4 decimals
      calibrationError: Math.round(calibrationError * 10000) / 10000,
      totalSnapshots: snapshots.length,
      finalProbability,
    };
  }

  /**
   * Get resolution for a specific event
   */
  static async getResolution(eventId: string) {
    return prisma.eventResolution.findUnique({
      where: { eventId },
    });
  }

  /**
   * Get all resolved events with their accuracy metrics
   */
  static async getAllResolutions(options?: {
    limit?: number;
    orderBy?: 'resolvedDate' | 'brierScore';
    order?: 'asc' | 'desc';
  }) {
    const { limit = 50, orderBy = 'resolvedDate', order = 'desc' } = options || {};

    return prisma.eventResolution.findMany({
      take: limit,
      orderBy:
        orderBy === 'brierScore'
          ? { brierScore: order }
          : { resolvedDate: order },
    });
  }

  /**
   * Get system-wide accuracy statistics
   */
  static async getSystemAccuracy(): Promise<{
    totalResolutions: number;
    averageBrierScore: number;
    averageCalibrationError: number;
    bestPredictions: Array<{ eventId: string; eventTitle: string; brierScore: number }>;
    worstPredictions: Array<{ eventId: string; eventTitle: string; brierScore: number }>;
    accuracyByCategory: Array<{
      category: string;
      count: number;
      averageBrierScore: number;
    }>;
  }> {
    const resolutions = await prisma.eventResolution.findMany({
      select: {
        eventId: true,
        eventTitle: true,
        brierScore: true,
        calibrationError: true,
      },
    });

    if (resolutions.length === 0) {
      return {
        totalResolutions: 0,
        averageBrierScore: 0,
        averageCalibrationError: 0,
        bestPredictions: [],
        worstPredictions: [],
        accuracyByCategory: [],
      };
    }

    const averageBrierScore =
      resolutions.reduce((sum, r) => sum + (r.brierScore || 0), 0) / resolutions.length;
    const averageCalibrationError =
      resolutions.reduce((sum, r) => sum + (r.calibrationError || 0), 0) / resolutions.length;

    // Best and worst predictions
    const sorted = [...resolutions].sort((a, b) => (a.brierScore || 1) - (b.brierScore || 1));
    const bestPredictions = sorted
      .slice(0, 5)
      .map((r) => ({
        eventId: r.eventId,
        eventTitle: r.eventTitle,
        brierScore: r.brierScore || 0,
      }));
    const worstPredictions = sorted
      .slice(-5)
      .reverse()
      .map((r) => ({
        eventId: r.eventId,
        eventTitle: r.eventTitle,
        brierScore: r.brierScore || 0,
      }));

    // Accuracy by category
    const categoryMap = new Map<string, { sum: number; count: number }>();

    // Get categories from snapshots
    const eventIds = resolutions.map((r) => r.eventId);
    const snapshots = await prisma.predictionSnapshot.findMany({
      where: { eventId: { in: eventIds } },
      distinct: ['eventId'],
      select: { eventId: true, category: true },
    });

    for (const resolution of resolutions) {
      const snapshot = snapshots.find((s) => s.eventId === resolution.eventId);
      if (!snapshot) continue;

      const category = snapshot.category;
      const existing = categoryMap.get(category) || { sum: 0, count: 0 };
      existing.sum += resolution.brierScore || 0;
      existing.count += 1;
      categoryMap.set(category, existing);
    }

    const accuracyByCategory = Array.from(categoryMap.entries())
      .map(([category, data]) => ({
        category,
        count: data.count,
        averageBrierScore: Math.round((data.sum / data.count) * 10000) / 10000,
      }))
      .sort((a, b) => a.averageBrierScore - b.averageBrierScore);

    return {
      totalResolutions: resolutions.length,
      averageBrierScore: Math.round(averageBrierScore * 10000) / 10000,
      averageCalibrationError: Math.round(averageCalibrationError * 10000) / 10000,
      bestPredictions,
      worstPredictions,
      accuracyByCategory,
    };
  }

  /**
   * Automatically resolve events based on close date
   * (For events that can be auto-resolved from sources)
   */
  static async autoResolveClosedEvents(): Promise<{
    resolved: number;
    skipped: number;
    errors: string[];
  }> {
    const errors: string[] = [];
    let resolved = 0;
    let skipped = 0;

    // Get events that closed more than 1 day ago and haven't been resolved
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);

    const closedEvents = await prisma.predictionSnapshot.findMany({
      where: {
        closeDate: {
          lt: oneDayAgo,
        },
      },
      distinct: ['eventId'],
      select: {
        eventId: true,
        eventTitle: true,
      },
    });

    for (const event of closedEvents) {
      try {
        // Check if already resolved
        const existing = await prisma.eventResolution.findUnique({
          where: { eventId: event.eventId },
        });

        if (existing) {
          skipped++;
          continue;
        }

        // TODO: Implement auto-resolution logic by checking original sources
        // For now, we skip auto-resolution - require manual resolution
        skipped++;
      } catch (error) {
        errors.push(
          `Failed to auto-resolve ${event.eventId}: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`
        );
      }
    }

    return { resolved, skipped, errors };
  }

  /**
   * Get calibration curve data
   * Shows how well-calibrated predictions are across probability ranges
   */
  static async getCalibrationCurve(bins: number = 10): Promise<
    Array<{
      probabilityRange: string;
      predictedProbability: number;
      actualFrequency: number;
      count: number;
    }>
  > {
    const resolutions = await prisma.eventResolution.findMany({
      select: {
        eventId: true,
        outcome: true,
        finalProbability: true,
      },
    });

    if (resolutions.length === 0) return [];

    // Group predictions into bins
    const binSize = 1 / bins;
    const binData: Array<{
      range: string;
      predictions: number[];
      outcomes: number[];
    }> = [];

    for (let i = 0; i < bins; i++) {
      const start = i * binSize;
      const end = (i + 1) * binSize;
      binData.push({
        range: `${(start * 100).toFixed(0)}-${(end * 100).toFixed(0)}%`,
        predictions: [],
        outcomes: [],
      });
    }

    // Assign each resolution to a bin
    for (const resolution of resolutions) {
      const prob = resolution.finalProbability || 0;
      const binIndex = Math.min(Math.floor(prob / binSize), bins - 1);
      binData[binIndex].predictions.push(prob);
      binData[binIndex].outcomes.push(resolution.outcome ? 1 : 0);
    }

    // Calculate statistics for each bin
    return binData
      .filter((bin) => bin.predictions.length > 0)
      .map((bin) => {
        const avgPrediction =
          bin.predictions.reduce((sum, p) => sum + p, 0) / bin.predictions.length;
        const avgOutcome = bin.outcomes.reduce((sum, o) => sum + o, 0) / bin.outcomes.length;

        return {
          probabilityRange: bin.range,
          predictedProbability: Math.round(avgPrediction * 100) / 100,
          actualFrequency: Math.round(avgOutcome * 100) / 100,
          count: bin.predictions.length,
        };
      });
  }

  /**
   * Update an existing resolution
   */
  static async updateResolution(
    eventId: string,
    updates: Partial<EventResolutionData>
  ): Promise<void> {
    await prisma.eventResolution.update({
      where: { eventId },
      data: {
        ...(updates.outcome !== undefined && { outcome: updates.outcome }),
        ...(updates.notes !== undefined && { notes: updates.notes }),
      },
    });

    console.log(`[ResolutionService] Updated resolution for event ${eventId}`);
  }
}
