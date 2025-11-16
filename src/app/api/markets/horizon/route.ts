/**
 * API endpoint for time-horizon filtered events
 * GET /api/markets/horizon?period=7d&minImpact=60
 */

import { NextResponse } from 'next/server';
import { scraperAggregator } from '@/lib/services/scraper-aggregator';
import { TimeFilter } from '@/lib/utils/time-filter';
import { TimeHorizon } from '@/types/market';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') as TimeHorizon | null;
    const minImpact = parseInt(searchParams.get('minImpact') || '0');
    const limit = parseInt(searchParams.get('limit') || '50');

    // Validate period
    const validPeriods = Object.values(TimeHorizon);
    if (period && !validPeriods.includes(period)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid period',
          validPeriods,
        },
        { status: 400 }
      );
    }

    // Get all events
    const allEvents = await scraperAggregator.fetchAllEvents();

    // Filter by time horizon
    let filteredEvents = allEvents;
    if (period) {
      filteredEvents = TimeFilter.filterByTimeHorizon(allEvents, period);
    }

    // Get aggregated odds
    const aggregated = await scraperAggregator.getAggregatedOdds(filteredEvents);

    // Filter by impact score
    const impactFiltered = aggregated.filter(
      (event) => event.impactScore.score >= minImpact
    );

    // Sort by proximity (soonest first), then by impact
    const sorted = impactFiltered.sort((a, b) => {
      const daysA = TimeFilter.getDaysUntilClose(a.event);
      const daysB = TimeFilter.getDaysUntilClose(b.event);

      if (daysA !== daysB) {
        return daysA - daysB; // Soonest first
      }

      return b.impactScore.score - a.impactScore.score; // Highest impact first
    });

    // Limit results
    const limited = sorted.slice(0, limit);

    // Enrich with time metadata
    const enriched = limited.map((event) => ({
      ...event,
      daysUntilClose: TimeFilter.getDaysUntilClose(event.event),
      isImminent: TimeFilter.isImminent(event.event),
      isNearTerm: TimeFilter.isNearTerm(event.event),
    }));

    // Group by horizon for summary
    const grouped = TimeFilter.groupByHorizon(filteredEvents);
    const horizonSummary = {
      imminent: grouped.imminent.length,    // 0-7 days
      nearTerm: grouped.nearTerm.length,    // 8-30 days
      midTerm: grouped.midTerm.length,      // 31-90 days
      longTerm: grouped.longTerm.length,    // 90+ days
    };

    return NextResponse.json({
      success: true,
      count: enriched.length,
      filters: {
        period: period || 'all',
        minImpact,
        limit,
      },
      data: enriched,
      horizonSummary,
      metadata: {
        source: 'aggregated',
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Time horizon markets API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch time-horizon events',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
