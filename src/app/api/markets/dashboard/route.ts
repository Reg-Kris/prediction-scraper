/**
 * Comprehensive trading dashboard endpoint
 * GET /api/markets/dashboard
 *
 * Returns a complete overview of:
 * - High impact events
 * - Upcoming events (next 7 days)
 * - High volatility/VIX correlation events
 * - Sector rotation signals
 * - Recession probability (if available)
 */

import { NextResponse } from 'next/server';
import { scraperAggregator } from '@/lib/services/scraper-aggregator';
import { TimeFilter } from '@/lib/utils/time-filter';
import { VolatilityCalculator } from '@/lib/utils/volatility-calculator';
import { SectorClassifier } from '@/lib/utils/sector-classifier';
import { MarketSector, EventCategory } from '@/types/market';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Get all events
    const allEvents = await scraperAggregator.fetchAllEvents();

    // Get high impact events (top 10)
    const highImpact = await scraperAggregator.getHighImpactEvents(10);

    // Get upcoming events (next 7 days)
    const upcomingEventsList = TimeFilter.getUpcomingEvents(allEvents, 7);
    const upcoming = await scraperAggregator.getAggregatedOdds(upcomingEventsList);

    // Get SPY and QQQ specific events
    const spyEvents = await scraperAggregator.getSPYImpactEvents(10);
    const qqqEvents = await scraperAggregator.getQQQImpactEvents(10);

    // Get all aggregated events for analysis
    const allAggregated = await scraperAggregator.getAggregatedOdds(allEvents);

    // High volatility events (VIX correlation > 0.6)
    const highVolatility = allAggregated.filter((event) => {
      const vixCorrelation = VolatilityCalculator.estimateVIXCorrelation(event);
      return vixCorrelation >= 0.6;
    }).slice(0, 10);

    // 50/50 events (maximum uncertainty)
    const fifty50Events = VolatilityCalculator.get5050Events(allAggregated).slice(0, 5);

    // Volatility summary
    const volSummary = VolatilityCalculator.getVolatilitySummary(allAggregated);

    // Sector rotation signals
    const sectors = Object.values(MarketSector);
    const sectorRotation = sectors.map((sector) => {
      const sectorEvents = allEvents.filter((event) =>
        SectorClassifier.affectsSector(event, sector)
      );

      const sectorAggregated = allAggregated.filter((event) =>
        SectorClassifier.affectsSector(event.event, sector)
      );

      const avgImpact =
        sectorAggregated.reduce((sum, e) => sum + e.impactScore.score, 0) /
        (sectorAggregated.length || 1);

      // Simple momentum: positive events vs negative events
      const positiveEvents = sectorAggregated.filter(
        (e) => e.aggregatedProbability > 0.5
      ).length;
      const negativeEvents = sectorAggregated.filter(
        (e) => e.aggregatedProbability <= 0.5
      ).length;

      const momentum =
        sectorEvents.length > 0
          ? (positiveEvents - negativeEvents) / sectorEvents.length
          : 0;

      let sentiment: 'bullish' | 'neutral' | 'bearish' = 'neutral';
      if (momentum > 0.2) sentiment = 'bullish';
      else if (momentum < -0.2) sentiment = 'bearish';

      return {
        sector,
        sectorName: SectorClassifier.getSectorName(sector),
        momentum: Math.round(momentum * 100) / 100,
        eventsCount: sectorEvents.length,
        avgImpactScore: Math.round(avgImpact),
        sentiment,
      };
    })
    .filter((s) => s.eventsCount > 0) // Only include sectors with events
    .sort((a, b) => b.avgImpactScore - a.avgImpactScore); // Sort by impact

    // Recession probability (from specific recession markets)
    const recessionEvents = allAggregated.filter(
      (e) => e.event.category === EventCategory.RECESSION
    );
    const recessionProbability =
      recessionEvents.length > 0
        ? recessionEvents.reduce((sum, e) => sum + e.aggregatedProbability, 0) /
          recessionEvents.length
        : null;

    // Time horizon breakdown
    const horizonGroups = TimeFilter.groupByHorizon(allEvents);

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      dashboard: {
        highImpactEvents: highImpact.map((e) => ({
          id: e.event.id,
          title: e.event.title,
          category: e.event.category,
          probability: e.aggregatedProbability,
          impactScore: e.impactScore.score,
          impactLevel: e.impactScore.level,
          daysUntilClose: TimeFilter.getDaysUntilClose(e.event),
          tags: e.event.tags,
        })),

        upcomingEvents: upcoming.map((e) => ({
          id: e.event.id,
          title: e.event.title,
          probability: e.aggregatedProbability,
          impactScore: e.impactScore.score,
          daysUntilClose: TimeFilter.getDaysUntilClose(e.event),
          closeDate: e.event.closeDate,
        })),

        spyFocused: {
          count: spyEvents.length,
          topEvents: spyEvents.slice(0, 5).map((e) => ({
            title: e.event.title,
            probability: e.aggregatedProbability,
            impactScore: e.impactScore.score,
          })),
        },

        qqqFocused: {
          count: qqqEvents.length,
          topEvents: qqqEvents.slice(0, 5).map((e) => ({
            title: e.event.title,
            probability: e.aggregatedProbability,
            impactScore: e.impactScore.score,
          })),
        },

        volatility: {
          summary: {
            avgUncertainty: Math.round(volSummary.avgUncertainty * 100) / 100,
            highVolatilityCount: volSummary.highVolatilityCount,
            veryHighVolatilityCount: volSummary.veryHighVolatilityCount,
          },
          highVixCorrelation: highVolatility.map((e) => ({
            title: e.event.title,
            probability: e.aggregatedProbability,
            vixCorrelation: Math.round(VolatilityCalculator.estimateVIXCorrelation(e) * 100) / 100,
            impactScore: e.impactScore.score,
          })),
          fifty50Events: fifty50Events.map((e) => ({
            title: e.event.title,
            probability: e.aggregatedProbability,
            impactScore: e.impactScore.score,
          })),
        },

        sectorRotation: sectorRotation.slice(0, 11), // All sectors

        recessionProbability: recessionProbability
          ? Math.round(recessionProbability * 100) / 100
          : null,

        timeHorizonBreakdown: {
          imminent: horizonGroups.imminent.length,      // 0-7 days
          nearTerm: horizonGroups.nearTerm.length,      // 8-30 days
          midTerm: horizonGroups.midTerm.length,        // 31-90 days
          longTerm: horizonGroups.longTerm.length,      // 90+ days
        },

        summary: {
          totalEvents: allEvents.length,
          totalHighImpact: highImpact.length,
          totalUpcoming7Days: upcoming.length,
          criticalEvents: allAggregated.filter((e) => e.impactScore.level === 'CRITICAL').length,
        },
      },
    });
  } catch (error) {
    console.error('Dashboard API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to generate dashboard',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
