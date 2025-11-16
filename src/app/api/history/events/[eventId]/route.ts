/**
 * API endpoint for event historical data
 * GET /api/history/events/[eventId]?limit=30
 *
 * Returns:
 * - Historical snapshots for the event
 * - Probability trend over time
 * - 24h, 7d, 30d changes
 */

import { NextResponse } from 'next/server';
import { SnapshotService } from '@/lib/services/snapshot-service';
import { ResolutionService } from '@/lib/services/resolution-service';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: { eventId: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '30');
    const days = parseInt(searchParams.get('days') || '30');

    const eventId = params.eventId;

    // Get historical snapshots
    const history = await SnapshotService.getEventHistory(eventId, limit);

    // Get probability trend with changes
    const trend = await SnapshotService.getProbabilityTrend(eventId, days);

    // Check if event has been resolved
    const resolution = await ResolutionService.getResolution(eventId);

    return NextResponse.json({
      success: true,
      data: {
        eventId,
        history,
        trend: {
          currentProbability: trend.currentProbability,
          change24h: trend.change24h,
          change7d: trend.change7d,
          change30d: trend.change30d,
          chartData: trend.history,
        },
        resolution: resolution
          ? {
              outcome: resolution.outcome,
              resolvedDate: resolution.resolvedDate,
              brierScore: resolution.brierScore,
              calibrationError: resolution.calibrationError,
              notes: resolution.notes,
            }
          : null,
        metadata: {
          snapshotCount: history.length,
          dateRange: {
            from: history.length > 0 ? history[history.length - 1].snapshotDate : null,
            to: history.length > 0 ? history[0].snapshotDate : null,
          },
        },
      },
    });
  } catch (error) {
    console.error('[API] Get event history error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get event history',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
