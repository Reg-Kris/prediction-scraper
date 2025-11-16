/**
 * Advanced filtering endpoint for prediction markets
 * GET /api/markets/filter?category=fed_policy&tags=SPY,QQQ&minImpact=60&limit=10
 */

import { NextResponse } from 'next/server';
import { scraperAggregator } from '@/lib/services/scraper-aggregator';
import { EventCategory } from '@/types/market';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const category = searchParams.get('category') as EventCategory | null;
    const tagsParam = searchParams.get('tags');
    const minImpactScore = searchParams.get('minImpact')
      ? parseInt(searchParams.get('minImpact')!)
      : undefined;
    const limit = parseInt(searchParams.get('limit') || '50');

    // Parse tags from comma-separated string
    const tags = tagsParam ? tagsParam.split(',').map((t) => t.trim()) : undefined;

    // Validate category if provided
    if (category && !Object.values(EventCategory).includes(category)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid category',
          validCategories: Object.values(EventCategory),
        },
        { status: 400 }
      );
    }

    const events = await scraperAggregator.getEventsByFilters({
      category: category || undefined,
      tags,
      minImpactScore,
      limit,
    });

    return NextResponse.json({
      success: true,
      count: events.length,
      filters: {
        category: category || 'all',
        tags: tags || [],
        minImpactScore: minImpactScore || 'none',
        limit,
      },
      data: events,
      metadata: {
        source: 'aggregated',
        sources: ['Polymarket', 'Kalshi', 'Metaculus', 'Manifold'],
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Filter markets API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch filtered events',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
