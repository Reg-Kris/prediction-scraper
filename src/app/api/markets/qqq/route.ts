/**
 * API endpoint for QQQ (Nasdaq-100) impact events
 * GET /api/markets/qqq
 */

import { NextResponse } from 'next/server';
import { scraperAggregator } from '@/lib/services/scraper-aggregator';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');

    const events = await scraperAggregator.getQQQImpactEvents(limit);

    return NextResponse.json({
      success: true,
      count: events.length,
      data: events,
      metadata: {
        source: 'aggregated',
        sources: ['Polymarket', 'Kalshi', 'Metaculus', 'Manifold'],
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('QQQ markets API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch QQQ impact events',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
