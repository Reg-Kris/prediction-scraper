/**
 * API endpoint for sector-specific events
 * GET /api/markets/sector?sector=XLK,XLV&minImpact=50
 */

import { NextResponse } from 'next/server';
import { scraperAggregator } from '@/lib/services/scraper-aggregator';
import { SectorClassifier } from '@/lib/utils/sector-classifier';
import { MarketSector } from '@/types/market';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sectorParam = searchParams.get('sector');
    const minImpact = parseInt(searchParams.get('minImpact') || '0');
    const limit = parseInt(searchParams.get('limit') || '50');

    if (!sectorParam) {
      return NextResponse.json(
        {
          success: false,
          error: 'sector parameter is required',
          availableSectors: Object.values(MarketSector),
        },
        { status: 400 }
      );
    }

    // Parse sectors from comma-separated string
    const requestedSectors = sectorParam
      .split(',')
      .map((s) => s.trim() as MarketSector)
      .filter((s) => Object.values(MarketSector).includes(s));

    if (requestedSectors.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid sectors provided',
          availableSectors: Object.values(MarketSector),
        },
        { status: 400 }
      );
    }

    // Get all events
    const allEvents = await scraperAggregator.fetchAllEvents();

    // Classify and filter by sectors
    const sectorEvents = allEvents.filter((event) => {
      const eventSectors = SectorClassifier.classifySectors(event);
      return requestedSectors.some((sector) => eventSectors.includes(sector));
    });

    // Get aggregated odds
    const aggregated = await scraperAggregator.getAggregatedOdds(sectorEvents);

    // Filter by impact score
    const filtered = aggregated.filter((event) => event.impactScore.score >= minImpact);

    // Sort by impact (highest first)
    const sorted = filtered.sort((a, b) => b.impactScore.score - a.impactScore.score);

    // Limit results
    const limited = sorted.slice(0, limit);

    // Add sector classification to each event
    const enriched = limited.map((event) => ({
      ...event,
      sectors: SectorClassifier.classifySectors(event.event),
      primarySector: SectorClassifier.getPrimarySector(event.event),
    }));

    // Calculate sector statistics
    const sectorStats = requestedSectors.map((sector) => {
      const sectorEvents = enriched.filter(
        (e) => e.sectors && e.sectors.includes(sector)
      );

      const avgImpact =
        sectorEvents.reduce((sum, e) => sum + e.impactScore.score, 0) /
        (sectorEvents.length || 1);

      return {
        sector,
        sectorName: SectorClassifier.getSectorName(sector),
        eventsCount: sectorEvents.length,
        avgImpactScore: Math.round(avgImpact),
      };
    });

    return NextResponse.json({
      success: true,
      count: enriched.length,
      filters: {
        sectors: requestedSectors,
        sectorNames: requestedSectors.map((s) => SectorClassifier.getSectorName(s)),
        minImpact,
        limit,
      },
      data: enriched,
      sectorStats,
      metadata: {
        source: 'aggregated',
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Sector markets API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch sector events',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
