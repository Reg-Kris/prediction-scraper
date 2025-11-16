/**
 * Source Verification Service
 *
 * Fetches event outcomes from original prediction market sources
 * to automatically resolve events without manual intervention.
 */

import { MarketSource } from '@/types/market';

export interface SourceResolution {
  source: MarketSource;
  eventId: string;
  resolved: boolean; // Has the source resolved this event?
  outcome: boolean | null; // true = YES, false = NO, null = unresolved
  resolvedDate: Date | null;
  confidence: number; // 0-1: How confident are we in this resolution?
  notes?: string;
  raw?: any; // Raw data from source for debugging
}

export interface AggregatedResolution {
  eventId: string;
  eventTitle: string;
  resolutions: SourceResolution[];
  consensusOutcome: boolean | null; // Majority outcome
  consensusConfidence: number; // How much sources agree
  readyToResolve: boolean; // Should we auto-resolve?
  recommendedOutcome: boolean | null;
  conflictingSources: boolean; // Do sources disagree?
}

export class SourceVerifier {
  /**
   * Check if an event can be resolved from original sources
   */
  static async verifyEvent(
    eventId: string,
    eventTitle: string,
    sources: MarketSource[]
  ): Promise<AggregatedResolution> {
    console.log(`[SourceVerifier] Verifying event: ${eventId}`);

    // Fetch resolutions from all sources
    const resolutions = await Promise.all(
      sources.map((source) => this.checkSource(eventId, source))
    );

    // Filter to only resolved sources
    const resolvedSources = resolutions.filter((r) => r.resolved);

    // Calculate consensus
    const consensus = this.calculateConsensus(resolvedSources);

    return {
      eventId,
      eventTitle,
      resolutions,
      consensusOutcome: consensus.outcome,
      consensusConfidence: consensus.confidence,
      readyToResolve: consensus.readyToResolve,
      recommendedOutcome: consensus.recommendedOutcome,
      conflictingSources: consensus.conflicting,
    };
  }

  /**
   * Check a single source for event resolution
   */
  private static async checkSource(
    eventId: string,
    source: MarketSource
  ): Promise<SourceResolution> {
    try {
      switch (source) {
        case MarketSource.CME_FEDWATCH:
          return await this.checkCMEFedWatch(eventId);
        case MarketSource.POLYMARKET:
          return await this.checkPolymarket(eventId);
        case MarketSource.KALSHI:
          return await this.checkKalshi(eventId);
        case MarketSource.METACULUS:
          return await this.checkMetaculus(eventId);
        case MarketSource.MANIFOLD:
          return await this.checkManifold(eventId);
        default:
          return this.unresolvedResult(source, eventId, 'Source not supported');
      }
    } catch (error) {
      console.error(`[SourceVerifier] Error checking ${source}:`, error);
      return this.unresolvedResult(
        source,
        eventId,
        `Error: ${error instanceof Error ? error.message : 'Unknown'}`
      );
    }
  }

  /**
   * Check CME FedWatch for FOMC meeting outcomes
   */
  private static async checkCMEFedWatch(eventId: string): Promise<SourceResolution> {
    // CME FedWatch is just probabilities, not actual resolutions
    // We'd need to check actual FOMC announcements from Fed website
    // For now, mark as unresolved - require manual resolution
    return this.unresolvedResult(
      MarketSource.CME_FEDWATCH,
      eventId,
      'CME FedWatch does not provide resolutions - manual resolution required'
    );
  }

  /**
   * Check Polymarket for event resolution
   */
  private static async checkPolymarket(eventId: string): Promise<SourceResolution> {
    // Extract Polymarket ID from our composite ID
    const polymarketId = eventId.replace('polymarket-', '');

    // In production, we'd fetch from Polymarket API
    // For now, return unresolved as we need actual API implementation
    return this.unresolvedResult(
      MarketSource.POLYMARKET,
      eventId,
      'Polymarket API resolution check not yet implemented'
    );

    /*
    // Future implementation:
    try {
      const response = await axios.get(
        `https://gamma-api.polymarket.com/markets/${polymarketId}`
      );

      const market = response.data;

      if (market.closed && market.resolved) {
        return {
          source: MarketSource.POLYMARKET,
          eventId,
          resolved: true,
          outcome: market.outcome === 'YES',
          resolvedDate: new Date(market.resolved_at),
          confidence: 1.0, // Polymarket resolutions are official
          notes: market.resolution_source || 'Officially resolved by Polymarket',
          raw: market
        };
      }

      return this.unresolvedResult(
        MarketSource.POLYMARKET,
        eventId,
        market.closed ? 'Closed but not yet resolved' : 'Still open'
      );
    } catch (error) {
      throw error;
    }
    */
  }

  /**
   * Check Kalshi for event resolution
   */
  private static async checkKalshi(eventId: string): Promise<SourceResolution> {
    // Similar to Polymarket - needs actual API implementation
    return this.unresolvedResult(
      MarketSource.KALSHI,
      eventId,
      'Kalshi API resolution check not yet implemented'
    );

    /*
    // Future implementation:
    const kalshiId = eventId.replace('kalshi-', '');

    try {
      const response = await axios.get(
        `https://api.elections.kalshi.com/trade-api/v2/events/${kalshiId}`,
        { headers: { Authorization: `Bearer ${process.env.KALSHI_API_KEY}` } }
      );

      const event = response.data.event;

      if (event.status === 'settled') {
        return {
          source: MarketSource.KALSHI,
          eventId,
          resolved: true,
          outcome: event.result === 'yes',
          resolvedDate: new Date(event.settlement_time),
          confidence: 1.0,
          notes: 'Officially settled by Kalshi',
          raw: event
        };
      }

      return this.unresolvedResult(
        MarketSource.KALSHI,
        eventId,
        event.status === 'closed' ? 'Closed but not settled' : 'Still open'
      );
    } catch (error) {
      throw error;
    }
    */
  }

  /**
   * Check Metaculus for forecast resolution
   */
  private static async checkMetaculus(eventId: string): Promise<SourceResolution> {
    return this.unresolvedResult(
      MarketSource.METACULUS,
      eventId,
      'Metaculus API resolution check not yet implemented'
    );
  }

  /**
   * Check Manifold Markets for resolution
   */
  private static async checkManifold(eventId: string): Promise<SourceResolution> {
    return this.unresolvedResult(
      MarketSource.MANIFOLD,
      eventId,
      'Manifold API resolution check not yet implemented'
    );
  }

  /**
   * Helper: Create unresolved result
   */
  private static unresolvedResult(
    source: MarketSource,
    eventId: string,
    notes: string
  ): SourceResolution {
    return {
      source,
      eventId,
      resolved: false,
      outcome: null,
      resolvedDate: null,
      confidence: 0,
      notes,
    };
  }

  /**
   * Calculate consensus from multiple source resolutions
   */
  private static calculateConsensus(resolutions: SourceResolution[]): {
    outcome: boolean | null;
    confidence: number;
    readyToResolve: boolean;
    recommendedOutcome: boolean | null;
    conflicting: boolean;
  } {
    if (resolutions.length === 0) {
      return {
        outcome: null,
        confidence: 0,
        readyToResolve: false,
        recommendedOutcome: null,
        conflicting: false,
      };
    }

    // Count votes
    const yesVotes = resolutions.filter((r) => r.outcome === true).length;
    const noVotes = resolutions.filter((r) => r.outcome === false).length;
    const totalVotes = yesVotes + noVotes;

    if (totalVotes === 0) {
      return {
        outcome: null,
        confidence: 0,
        readyToResolve: false,
        recommendedOutcome: null,
        conflicting: false,
      };
    }

    // Determine majority outcome
    const outcome = yesVotes > noVotes;

    // Calculate confidence based on agreement
    const agreement = Math.max(yesVotes, noVotes) / totalVotes;

    // Weight by source confidence
    const avgSourceConfidence =
      resolutions.reduce((sum, r) => sum + r.confidence, 0) / resolutions.length;

    // Combined confidence
    const confidence = agreement * avgSourceConfidence;

    // Check for conflicts
    const conflicting = yesVotes > 0 && noVotes > 0;

    // Ready to auto-resolve if:
    // 1. High confidence (>0.8)
    // 2. At least 2 sources agree
    // 3. No conflicts OR strong majority (>75%)
    const strongMajority = agreement > 0.75;
    const multipleSourcesAgree = Math.max(yesVotes, noVotes) >= 2;
    const readyToResolve =
      confidence > 0.8 && multipleSourcesAgree && (!conflicting || strongMajority);

    return {
      outcome,
      confidence,
      readyToResolve,
      recommendedOutcome: outcome,
      conflicting,
    };
  }

  /**
   * Get list of events that are closed but not yet resolved
   */
  static async getPendingResolutions(daysAfterClose: number = 1): Promise<
    Array<{
      eventId: string;
      eventTitle: string;
      closeDate: Date;
      daysSinceClosed: number;
    }>
  > {
    const { PrismaClient } = await import('@/generated/prisma');
    const prisma = new PrismaClient();

    try {
      // Get all unique event IDs from snapshots
      const snapshots = await prisma.predictionSnapshot.findMany({
        distinct: ['eventId'],
        select: {
          eventId: true,
          eventTitle: true,
          closeDate: true,
        },
      });

      // Get already resolved events
      const resolutions = await prisma.eventResolution.findMany({
        select: { eventId: true },
      });

      const resolvedIds = new Set(resolutions.map((r) => r.eventId));

      // Filter to closed but unresolved events
      const now = new Date();
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysAfterClose);

      const pending = snapshots
        .filter((s) => {
          const closeDate = new Date(s.closeDate);
          return (
            !resolvedIds.has(s.eventId) && // Not already resolved
            closeDate < cutoffDate && // Closed at least N days ago
            closeDate < now // Definitely closed
          );
        })
        .map((s) => {
          const closeDate = new Date(s.closeDate);
          const daysSinceClosed = Math.floor(
            (now.getTime() - closeDate.getTime()) / (1000 * 60 * 60 * 24)
          );

          return {
            eventId: s.eventId,
            eventTitle: s.eventTitle,
            closeDate,
            daysSinceClosed,
          };
        })
        .sort((a, b) => b.daysSinceClosed - a.daysSinceClosed); // Oldest first

      return pending;
    } finally {
      await prisma.$disconnect();
    }
  }
}
