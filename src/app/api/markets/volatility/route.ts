/**
 * API endpoint for high volatility/VIX correlation events
 * GET /api/markets/volatility?threshold=0.6
 */

import { NextResponse } from 'next/server';
import { scraperAggregator } from '@/lib/services/scraper-aggregator';
import { VolatilityCalculator } from '@/lib/utils/volatility-calculator';
import { TimeFilter } from '@/lib/utils/time-filter';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const threshold = parseFloat(searchParams.get('threshold') || '0.6');
    const days = parseInt(searchParams.get('days') || '30');

    // Get all recent events
    const allEvents = await scraperAggregator.fetchAllEvents();

    // Filter by time horizon
    const upcomingEvents = TimeFilter.getUpcomingEvents(allEvents, days);

    // Get aggregated odds
    const aggregated = await scraperAggregator.getAggregatedOdds(upcomingEvents);

    // Filter for high volatility events
    const highVolatility = aggregated.filter((event) => {
      const vixCorrelation = VolatilityCalculator.estimateVIXCorrelation(event);
      return vixCorrelation >= threshold;
    });

    // Get 50/50 events (maximum uncertainty)
    const fifty50Events = VolatilityCalculator.get5050Events(aggregated);

    // Get summary statistics
    const summary = VolatilityCalculator.getVolatilitySummary(aggregated);

    // Sort by VIX correlation (highest first)
    const sorted = highVolatility.sort((a, b) => {
      const vixA = VolatilityCalculator.estimateVIXCorrelation(a);
      const vixB = VolatilityCalculator.estimateVIXCorrelation(b);
      return vixB - vixA;
    });

    return NextResponse.json({
      success: true,
      count: sorted.length,
      filters: {
        vixThreshold: threshold,
        daysAhead: days,
      },
      data: sorted.map((event) => ({
        ...event,
        vixCorrelation: VolatilityCalculator.estimateVIXCorrelation(event),
        uncertainty: VolatilityCalculator.calculateAggregatedUncertainty(event.odds),
        volatilityLevel: VolatilityCalculator.getVolatilityLevel(event.aggregatedProbability),
      })),
      summary: {
        ...summary,
        fifty50Count: fifty50Events.length,
      },
      metadata: {
        source: 'aggregated',
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Volatility markets API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch volatility events',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
