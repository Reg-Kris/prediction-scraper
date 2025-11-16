/**
 * API endpoint for biggest probability movers
 * GET /api/history/movers?days=7&limit=10
 *
 * Returns events with largest probability changes over specified time period
 * Useful for identifying market momentum and catching early trends
 */

import { NextResponse } from 'next/server';
import { SnapshotService } from '@/lib/services/snapshot-service';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '7');
    const limit = parseInt(searchParams.get('limit') || '10');

    const movers = await SnapshotService.getBiggestMovers(days, limit);

    // Separate into gainers and losers
    const gainers = movers
      .filter((m) => m.change > 0)
      .sort((a, b) => b.change - a.change)
      .slice(0, Math.ceil(limit / 2));

    const losers = movers
      .filter((m) => m.change < 0)
      .sort((a, b) => a.change - b.change)
      .slice(0, Math.ceil(limit / 2));

    return NextResponse.json({
      success: true,
      data: {
        timeframe: `${days} days`,
        gainers: gainers.map((m) => ({
          eventId: m.eventId,
          eventTitle: m.eventTitle,
          category: m.category,
          currentProbability: Math.round(m.currentProbability * 100),
          change: Math.round(m.change * 100),
          changePercent: Math.round(m.changePercent),
          momentum: 'bullish',
        })),
        losers: losers.map((m) => ({
          eventId: m.eventId,
          eventTitle: m.eventTitle,
          category: m.category,
          currentProbability: Math.round(m.currentProbability * 100),
          change: Math.round(m.change * 100),
          changePercent: Math.round(m.changePercent),
          momentum: 'bearish',
        })),
        all: movers,
      },
      metadata: {
        totalMovers: movers.length,
        filters: { days, limit },
      },
    });
  } catch (error) {
    console.error('[API] Get movers error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get probability movers',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
