/**
 * API endpoint for resolving events
 * POST /api/history/resolve
 *
 * Body:
 * {
 *   "eventId": "string",
 *   "eventTitle": "string",
 *   "outcome": boolean,
 *   "notes": "string" (optional)
 * }
 *
 * Records final outcome and calculates accuracy metrics (Brier score)
 */

import { NextResponse } from 'next/server';
import { ResolutionService } from '@/lib/services/resolution-service';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { eventId, eventTitle, outcome, notes } = body;

    // Validation
    if (!eventId || !eventTitle || outcome === undefined) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields',
          message: 'eventId, eventTitle, and outcome are required',
        },
        { status: 400 }
      );
    }

    if (typeof outcome !== 'boolean') {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid outcome type',
          message: 'outcome must be a boolean (true or false)',
        },
        { status: 400 }
      );
    }

    // Check if already resolved
    const existing = await ResolutionService.getResolution(eventId);
    if (existing) {
      return NextResponse.json(
        {
          success: false,
          error: 'Event already resolved',
          message: `Event ${eventId} was already resolved on ${existing.resolvedDate}`,
          data: {
            eventId: existing.eventId,
            resolvedDate: existing.resolvedDate,
            outcome: existing.outcome,
            brierScore: existing.brierScore,
          },
        },
        { status: 409 }
      );
    }

    // Resolve the event
    const metrics = await ResolutionService.resolveEvent({
      eventId,
      eventTitle,
      outcome,
      notes,
    });

    return NextResponse.json({
      success: true,
      message: 'Event resolved successfully',
      data: {
        eventId,
        eventTitle,
        outcome,
        metrics: {
          brierScore: metrics.brierScore,
          calibrationError: metrics.calibrationError,
          finalProbability: metrics.finalProbability,
          totalSnapshots: metrics.totalSnapshots,
        },
        interpretation: {
          brierScoreQuality:
            metrics.brierScore < 0.1
              ? 'Excellent'
              : metrics.brierScore < 0.25
              ? 'Good'
              : metrics.brierScore < 0.5
              ? 'Fair'
              : 'Poor',
          description: `Brier score of ${metrics.brierScore.toFixed(
            4
          )} (0=perfect, 0.25=random, 1=worst)`,
        },
      },
    });
  } catch (error) {
    console.error('[API] Resolve event error:', error);

    // Handle missing snapshots error
    if (error instanceof Error && error.message.includes('No snapshots found')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Cannot resolve event',
          message: 'No historical snapshots found for this event. Capture snapshots first.',
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to resolve event',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { eventId, outcome, notes } = body;

    if (!eventId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing eventId',
        },
        { status: 400 }
      );
    }

    await ResolutionService.updateResolution(eventId, { outcome, notes });

    return NextResponse.json({
      success: true,
      message: 'Resolution updated successfully',
    });
  } catch (error) {
    console.error('[API] Update resolution error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update resolution',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const orderBy = (searchParams.get('orderBy') || 'resolvedDate') as
      | 'resolvedDate'
      | 'brierScore';
    const order = (searchParams.get('order') || 'desc') as 'asc' | 'desc';

    const resolutions = await ResolutionService.getAllResolutions({
      limit,
      orderBy,
      order,
    });

    return NextResponse.json({
      success: true,
      data: resolutions,
      metadata: {
        count: resolutions.length,
        filters: { limit, orderBy, order },
      },
    });
  } catch (error) {
    console.error('[API] Get resolutions error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get resolutions',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
