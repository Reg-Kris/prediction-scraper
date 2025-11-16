/**
 * Auto-Resolution Service
 *
 * Automatically resolves closed events by verifying outcomes from
 * original prediction market sources.
 */

import { SourceVerifier, AggregatedResolution } from './source-verifier';
import { ResolutionService } from './resolution-service';
import { PrismaClient } from '@/generated/prisma';
import { MarketSource } from '@/types/market';

export interface AutoResolutionResult {
  eventId: string;
  eventTitle: string;
  status: 'resolved' | 'pending_review' | 'insufficient_data' | 'error';
  outcome?: boolean;
  confidence?: number;
  verification?: AggregatedResolution;
  error?: string;
}

export interface AutoResolutionSummary {
  totalProcessed: number;
  autoResolved: number;
  pendingReview: number;
  insufficientData: number;
  errors: number;
  results: AutoResolutionResult[];
  duration: number; // milliseconds
}

export class AutoResolutionService {
  private static readonly MIN_AUTO_RESOLVE_CONFIDENCE = 0.8;
  private static readonly MIN_REVIEW_CONFIDENCE = 0.5;

  /**
   * Process all pending resolutions
   */
  static async processAll(
    daysAfterClose: number = 1,
    dryRun: boolean = false
  ): Promise<AutoResolutionSummary> {
    const startTime = Date.now();
    const results: AutoResolutionResult[] = [];

    console.log('[AutoResolution] ========================================');
    console.log('[AutoResolution] Starting auto-resolution process...');
    console.log(`[AutoResolution] Dry run: ${dryRun}`);
    console.log(`[AutoResolution] Min days after close: ${daysAfterClose}`);

    try {
      // Get pending events
      const pending = await SourceVerifier.getPendingResolutions(daysAfterClose);
      console.log(`[AutoResolution] Found ${pending.length} pending events`);

      if (pending.length === 0) {
        console.log('[AutoResolution] No events to process');
        return this.createSummary(results, startTime);
      }

      // Process each event
      for (const event of pending) {
        console.log(
          `[AutoResolution] Processing: ${event.eventId} (${event.daysSinceClosed} days old)`
        );

        const result = await this.processEvent(
          event.eventId,
          event.eventTitle,
          dryRun
        );

        results.push(result);

        // Log result
        if (result.status === 'resolved') {
          console.log(
            `[AutoResolution] ✓ Auto-resolved: ${result.eventId} -> ${result.outcome ? 'YES' : 'NO'} (confidence: ${result.confidence?.toFixed(2)})`
          );
        } else if (result.status === 'pending_review') {
          console.log(
            `[AutoResolution] ⚠ Needs review: ${result.eventId} (confidence: ${result.confidence?.toFixed(2)})`
          );
        } else if (result.status === 'insufficient_data') {
          console.log(`[AutoResolution] ⊘ No data: ${result.eventId}`);
        } else {
          console.log(`[AutoResolution] ✗ Error: ${result.eventId} - ${result.error}`);
        }
      }

      const summary = this.createSummary(results, startTime);

      console.log('[AutoResolution] ========================================');
      console.log('[AutoResolution] Process complete!');
      console.log(`[AutoResolution] Auto-resolved: ${summary.autoResolved}`);
      console.log(`[AutoResolution] Pending review: ${summary.pendingReview}`);
      console.log(`[AutoResolution] Insufficient data: ${summary.insufficientData}`);
      console.log(`[AutoResolution] Errors: ${summary.errors}`);
      console.log(
        `[AutoResolution] Duration: ${(summary.duration / 1000).toFixed(2)}s`
      );
      console.log('[AutoResolution] ========================================');

      return summary;
    } catch (error) {
      console.error('[AutoResolution] Fatal error:', error);
      throw error;
    }
  }

  /**
   * Process a single event
   */
  static async processEvent(
    eventId: string,
    eventTitle: string,
    dryRun: boolean = false
  ): Promise<AutoResolutionResult> {
    try {
      // Get sources for this event from snapshots
      const sources = await this.getEventSources(eventId);

      if (sources.length === 0) {
        return {
          eventId,
          eventTitle,
          status: 'insufficient_data',
        };
      }

      // Verify with sources
      const verification = await SourceVerifier.verifyEvent(
        eventId,
        eventTitle,
        sources
      );

      // Decide action based on confidence
      if (verification.readyToResolve && verification.consensusConfidence >= this.MIN_AUTO_RESOLVE_CONFIDENCE) {
        // High confidence - auto-resolve
        if (!dryRun && verification.consensusOutcome !== null) {
          await ResolutionService.resolveEvent({
            eventId,
            eventTitle,
            outcome: verification.consensusOutcome,
            notes: this.generateResolutionNotes(verification),
          });
        }

        return {
          eventId,
          eventTitle,
          status: 'resolved',
          outcome: verification.consensusOutcome!,
          confidence: verification.consensusConfidence,
          verification,
        };
      } else if (verification.consensusConfidence >= this.MIN_REVIEW_CONFIDENCE) {
        // Medium confidence - needs review
        return {
          eventId,
          eventTitle,
          status: 'pending_review',
          outcome: verification.recommendedOutcome!,
          confidence: verification.consensusConfidence,
          verification,
        };
      } else {
        // Low confidence - insufficient data
        return {
          eventId,
          eventTitle,
          status: 'insufficient_data',
          confidence: verification.consensusConfidence,
          verification,
        };
      }
    } catch (error) {
      console.error(`[AutoResolution] Error processing ${eventId}:`, error);
      return {
        eventId,
        eventTitle,
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get sources that provided data for an event
   */
  private static async getEventSources(eventId: string): Promise<MarketSource[]> {
    const prisma = new PrismaClient();

    try {
      const snapshots = await prisma.predictionSnapshot.findMany({
        where: { eventId },
        select: { sources: true },
        distinct: ['sources'],
      });

      const sourcesSet = new Set<MarketSource>();

      for (const snapshot of snapshots) {
        try {
          const sources = JSON.parse(snapshot.sources) as MarketSource[];
          sources.forEach((s) => sourcesSet.add(s));
        } catch (e) {
          // Skip invalid JSON
        }
      }

      return Array.from(sourcesSet);
    } finally {
      await prisma.$disconnect();
    }
  }

  /**
   * Generate resolution notes from verification
   */
  private static generateResolutionNotes(verification: AggregatedResolution): string {
    const resolvedSources = verification.resolutions.filter((r) => r.resolved);

    if (resolvedSources.length === 0) {
      return 'Auto-resolved with no source verification (manual review recommended)';
    }

    const sourcesList = resolvedSources
      .map((r) => `${r.source} (${r.outcome ? 'YES' : 'NO'})`)
      .join(', ');

    const notes = [
      `Auto-resolved based on ${resolvedSources.length} source(s): ${sourcesList}`,
      `Consensus confidence: ${(verification.consensusConfidence * 100).toFixed(0)}%`,
    ];

    if (verification.conflictingSources) {
      notes.push('⚠️ Warning: Sources had conflicting outcomes');
    }

    return notes.join('. ');
  }

  /**
   * Create summary from results
   */
  private static createSummary(
    results: AutoResolutionResult[],
    startTime: number
  ): AutoResolutionSummary {
    return {
      totalProcessed: results.length,
      autoResolved: results.filter((r) => r.status === 'resolved').length,
      pendingReview: results.filter((r) => r.status === 'pending_review').length,
      insufficientData: results.filter((r) => r.status === 'insufficient_data').length,
      errors: results.filter((r) => r.status === 'error').length,
      results,
      duration: Date.now() - startTime,
    };
  }

  /**
   * Get events pending manual review
   */
  static async getPendingReviews(): Promise<
    Array<{
      eventId: string;
      eventTitle: string;
      recommendedOutcome: boolean;
      confidence: number;
      verification: AggregatedResolution;
    }>
  > {
    // This would typically be stored in a separate table
    // For now, we'll return an empty array as this is just a framework
    // In production, you'd store pending reviews in the database
    return [];
  }

  /**
   * Approve a pending review (manually resolve)
   */
  static async approveReview(
    eventId: string,
    eventTitle: string,
    outcome: boolean,
    notes?: string
  ): Promise<void> {
    await ResolutionService.resolveEvent({
      eventId,
      eventTitle,
      outcome,
      notes: notes || 'Manually approved after auto-resolution review',
    });

    console.log(`[AutoResolution] Review approved: ${eventId} -> ${outcome ? 'YES' : 'NO'}`);
  }

  /**
   * Reject a pending review (keep unresolved)
   */
  static async rejectReview(eventId: string, reason: string): Promise<void> {
    console.log(`[AutoResolution] Review rejected: ${eventId} - ${reason}`);
    // Could log this to a separate table for audit trail
  }
}
